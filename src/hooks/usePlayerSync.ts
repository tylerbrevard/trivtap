
import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { forcePlayerGameSync, storePlayerGameState, getPlayerGameState } from '@/utils/playerAnswerUtils';

/**
 * Custom hook for player-display synchronization
 */
export const usePlayerSync = (playerName: string, gameId: string) => {
  const [currentState, setCurrentState] = useState<'question' | 'answer' | 'leaderboard' | 'intermission' | 'join'>('join');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionCounter, setQuestionCounter] = useState(1);
  const [serverTimeLeft, setServerTimeLeft] = useState(0);
  const [localTimeLeft, setLocalTimeLeft] = useState(0);
  const [hasInitialState, setHasInitialState] = useState(false);
  const [lastStateUpdate, setLastStateUpdate] = useState<number>(Date.now());
  const [disconnected, setDisconnected] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checkConnectionRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  
  // Initialization - try to get stored game state on mount
  useEffect(() => {
    console.log('usePlayerSync initialized for player:', playerName);
    
    // Store that we're actively using this game
    try {
      localStorage.setItem('activeGame', JSON.stringify({
        playerName,
        gameId,
        timestamp: Date.now()
      }));
      sessionStorage.setItem('activeGame', JSON.stringify({
        playerName,
        gameId,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error storing active game info:', error);
    }
    
    const storedState = getPlayerGameState();
    if (storedState) {
      console.log('Found stored player game state on mount:', storedState);
      if (storedState.state) setCurrentState(storedState.state);
      if (storedState.questionIndex !== undefined) setQuestionIndex(storedState.questionIndex);
      if (storedState.questionCounter) setQuestionCounter(storedState.questionCounter);
      if (storedState.timeLeft) {
        // Adjust time left based on timestamp difference
        const timePassed = (Date.now() - storedState.timestamp) / 1000;
        const adjustedTimeLeft = Math.max(0, storedState.timeLeft - Math.floor(timePassed));
        setServerTimeLeft(adjustedTimeLeft);
        setLocalTimeLeft(adjustedTimeLeft);
      }
      if (storedState.timestamp && (Date.now() - storedState.timestamp < 30000)) {
        setHasInitialState(true);
      }
    }
    
    // Clean up on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      if (checkConnectionRef.current) {
        clearInterval(checkConnectionRef.current);
        checkConnectionRef.current = null;
      }
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [playerName, gameId]);
  
  // Function to handle incoming game state updates
  const handleGameStateUpdate = useCallback((gameState: any) => {
    console.log('Player received game state update:', gameState);
    
    // Validate game ID if present
    if (gameState.gameId && gameState.gameId !== gameId) {
      console.log('Ignoring state update for different game ID:', gameState.gameId);
      return;
    }
    
    const now = Date.now();
    setLastStateUpdate(now);
    setDisconnected(false);
    
    // Always update state with incoming data
    if (gameState.state) setCurrentState(gameState.state);
    if (gameState.questionIndex !== undefined) setQuestionIndex(gameState.questionIndex);
    if (gameState.questionCounter) setQuestionCounter(gameState.questionCounter);
    
    // Update time only for question state
    if (gameState.state === 'question' && gameState.timeLeft !== undefined) {
      // If this is an old state update, adjust the time accordingly
      if (gameState.timestamp) {
        const timeSinceUpdate = (now - gameState.timestamp) / 1000;
        const adjustedTimeLeft = Math.max(0, gameState.timeLeft - Math.floor(timeSinceUpdate));
        setServerTimeLeft(adjustedTimeLeft);
        setLocalTimeLeft(adjustedTimeLeft);
      } else {
        setServerTimeLeft(gameState.timeLeft);
        setLocalTimeLeft(gameState.timeLeft);
      }
    }
    
    setHasInitialState(true);
    
    // Clear any reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    // Store the update as the latest known state
    const stateToStore = {
      ...gameState,
      playerReceived: now
    };
    
    storePlayerGameState(stateToStore);
    
    // If we've reconnected after being disconnected, show a notification
    if (disconnected) {
      toast({
        title: "Reconnected",
        description: "Connection to the game has been restored."
      });
    }
  }, [gameId, disconnected, toast]);
  
  // Check for disconnection
  useEffect(() => {
    const disconnectionCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastStateUpdate;
      
      // If it's been more than 10 seconds since the last state update, consider disconnected
      if (timeSinceLastUpdate > 10000 && !disconnected && hasInitialState) {
        setDisconnected(true);
        toast({
          title: "Connection issues",
          description: "Trying to reconnect to the game...",
          variant: "destructive"
        });
        
        // Try to force sync
        forcePlayerGameSync(playerName, gameId);
        
        // Also dispatch a force sync request event
        window.dispatchEvent(new CustomEvent('forceSyncRequest', { 
          detail: {
            playerName,
            gameId,
            timestamp: Date.now(),
            urgent: true
          }
        }));
        
        // Set a timeout to try again with increasing backoff
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
        
        let reconnectAttempts = parseInt(sessionStorage.getItem('reconnectAttempts') || '0', 10);
        reconnectAttempts++;
        sessionStorage.setItem('reconnectAttempts', reconnectAttempts.toString());
        
        const delay = Math.min(2000 + reconnectAttempts * 500, 10000);
        console.log(`Setting reconnect timeout for ${delay}ms (attempt ${reconnectAttempts})`);
        
        reconnectTimeoutRef.current = setTimeout(() => {
          forcePlayerGameSync(playerName, gameId);
          
          window.dispatchEvent(new CustomEvent('forceSyncRequest', { 
            detail: {
              playerName,
              gameId,
              timestamp: Date.now(),
              urgent: true,
              attempt: reconnectAttempts
            }
          }));
        }, delay);
      }
      
      // If we've been connected, reset reconnect attempts
      if (!disconnected && timeSinceLastUpdate < 5000) {
        sessionStorage.setItem('reconnectAttempts', '0');
      }
    }, 3000); // Check every 3 seconds
    
    checkConnectionRef.current = disconnectionCheckInterval;
    
    return () => clearInterval(disconnectionCheckInterval);
  }, [lastStateUpdate, disconnected, hasInitialState, playerName, gameId, toast]);
  
  // Set up local timer
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Start local timer only when in question state with time > 0
    if (currentState === 'question' && serverTimeLeft > 0) {
      console.log('Starting local timer with', serverTimeLeft, 'seconds');
      setLocalTimeLeft(serverTimeLeft);
      
      timerRef.current = setInterval(() => {
        setLocalTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            timerRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [currentState, serverTimeLeft]);
  
  // Listen for game state events
  useEffect(() => {
    const handleStateChangeEvent = (e: CustomEvent) => {
      handleGameStateUpdate(e.detail);
    };
    
    // Listen for all state change events
    window.addEventListener('triviaStateChange', handleStateChangeEvent as EventListener);
    window.addEventListener('playerSyncResponse', handleStateChangeEvent as EventListener);
    window.addEventListener('gameStateUpdate', handleStateChangeEvent as EventListener);
    
    // Check for stored game state on mount (both storage types)
    const checkStoredState = () => {
      // First check sessionStorage (more reliable during session)
      const sessionState = sessionStorage.getItem('gameState');
      if (sessionState) {
        try {
          const parsedState = JSON.parse(sessionState);
          const timestamp = parsedState.timestamp || parsedState.lastReceived || 0;
          const age = Date.now() - timestamp;
          
          // Only use if it's recent
          if (age < 30000) {
            console.log('Using recent session state, age:', age/1000, 'seconds');
            handleGameStateUpdate(parsedState);
          } else {
            console.log('Session state too old:', age/1000, 'seconds');
          }
        } catch (error) {
          console.error('Error parsing session game state:', error);
        }
      }
      // Then try localStorage
      else {
        const localState = localStorage.getItem('gameState');
        if (localState) {
          try {
            const parsedState = JSON.parse(localState);
            const timestamp = parsedState.timestamp || parsedState.lastReceived || 0;
            const age = Date.now() - timestamp;
            
            // Only use if it's recent
            if (age < 30000) {
              console.log('Using recent local state, age:', age/1000, 'seconds');
              handleGameStateUpdate(parsedState);
            } else {
              console.log('Local state too old:', age/1000, 'seconds');
            }
          } catch (error) {
            console.error('Error parsing local game state:', error);
          }
        }
      }
      
      // Also check for display truth
      const displayTruth = localStorage.getItem('gameState_display_truth');
      if (displayTruth) {
        try {
          const parsedTruth = JSON.parse(displayTruth);
          const timestamp = parsedTruth.timestamp || 0;
          const age = Date.now() - timestamp;
          
          // Display truth can be a bit older since it's more authoritative
          if (age < 60000) {
            console.log('Found recent display truth during check, age:', age/1000, 'seconds');
            handleGameStateUpdate({
              ...parsedTruth,
              definitiveTruth: true
            });
          } else {
            console.log('Display truth too old:', age/1000, 'seconds');
          }
        } catch (error) {
          console.error('Error parsing display truth:', error);
        }
      }
    };
    
    checkStoredState();
    
    // Request sync initially and set up periodic requests
    const requestSync = () => {
      if (disconnected) {
        console.log('Player requesting sync (disconnected status)');
      } else {
        console.log('Player requesting regular sync update');
      }
      
      // Dispatch on multiple channels for higher reliability
      window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
        detail: {
          playerName,
          gameId,
          timestamp: Date.now(),
          disconnected
        }
      }));
      
      window.dispatchEvent(new CustomEvent('triviaPlayerNeedsSync', { 
        detail: {
          playerName,
          gameId,
          timestamp: Date.now(),
          alternate: true,
          disconnected
        }
      }));
      
      // Also fire a general status update
      window.dispatchEvent(new CustomEvent('playerStatusUpdate', {
        detail: {
          playerName,
          gameId,
          timestamp: Date.now(),
          status: disconnected ? 'disconnected' : 'connected',
          lastSync: lastStateUpdate
        }
      }));
      
      // Check stored state only occasionally
      if (Math.random() < 0.3) {
        checkStoredState();
      }
    };
    
    requestSync(); // Initial request
    
    // Set up regular sync requests with randomized intervals for better distribution
    const syncInterval = setInterval(requestSync, 5000 + Math.random() * 1000);
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChangeEvent as EventListener);
      window.removeEventListener('playerSyncResponse', handleStateChangeEvent as EventListener);
      window.removeEventListener('gameStateUpdate', handleStateChangeEvent as EventListener);
      clearInterval(syncInterval);
    };
  }, [handleGameStateUpdate, playerName, gameId, disconnected, lastStateUpdate]);
  
  // Force sync method for manual triggering
  const forceSync = useCallback(() => {
    console.log('Force sync requested by user');
    
    // Reset reconnect attempts counter
    sessionStorage.setItem('reconnectAttempts', '0');
    
    // Clear any stored game state to avoid conflicts
    localStorage.removeItem('gameState');
    sessionStorage.removeItem('gameState');
    
    // Force a sync through multiple channels
    forcePlayerGameSync(playerName, gameId);
    
    // Also dispatch an event for other components to respond to
    window.dispatchEvent(new CustomEvent('forceSyncRequest', { 
      detail: {
        playerName,
        gameId,
        timestamp: Date.now(),
        userInitiated: true,
        urgent: true
      }
    }));
    
    toast({
      title: "Syncing",
      description: "Requesting latest game state from display"
    });
    
    // Set flag to indicate we're awaiting a sync response
    sessionStorage.setItem('awaitingSync', 'true');
    
    // If no response after 5 seconds, show another notification
    setTimeout(() => {
      if (sessionStorage.getItem('awaitingSync') === 'true') {
        // Try one more forceful sync
        forcePlayerGameSync(playerName, gameId);
        
        window.dispatchEvent(new CustomEvent('forceSyncRequest', { 
          detail: {
            playerName,
            gameId,
            timestamp: Date.now(),
            userInitiated: true,
            urgent: true,
            backup: true
          }
        }));
        
        toast({
          title: "Still syncing...",
          description: "Making another attempt to connect"
        });
        
        // Clear the flag after 10 more seconds
        setTimeout(() => {
          sessionStorage.removeItem('awaitingSync');
        }, 10000);
      }
    }, 5000);
  }, [playerName, gameId, toast]);
  
  // Clear the awaiting sync flag when we get a state update
  useEffect(() => {
    if (hasInitialState) {
      sessionStorage.removeItem('awaitingSync');
    }
  }, [hasInitialState]);
  
  return {
    currentState,
    questionIndex,
    timeLeft: localTimeLeft,
    questionCounter,
    hasInitialState,
    disconnected,
    forceSync
  };
};
