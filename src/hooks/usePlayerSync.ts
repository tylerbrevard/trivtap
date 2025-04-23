
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
  const { toast } = useToast();
  
  // Initialization - try to get stored game state on mount
  useEffect(() => {
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
      setHasInitialState(true);
    }
  }, []);
  
  // Function to handle incoming game state updates
  const handleGameStateUpdate = useCallback((gameState: any) => {
    console.log('Player received game state update:', gameState);
    
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
    
    // Store the update as the latest known state
    const stateToStore = {
      ...gameState,
      playerReceived: now
    };
    
    storePlayerGameState(stateToStore);
  }, []);
  
  // Check for disconnection
  useEffect(() => {
    const disconnectionCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastStateUpdate;
      
      // If it's been more than 15 seconds since the last state update, consider disconnected
      if (timeSinceLastUpdate > 15000 && !disconnected && hasInitialState) {
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
            timestamp: Date.now()
          }
        }));
      }
    }, 5000); // Check every 5 seconds
    
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
    
    // Check for stored game state on mount (both storage types)
    const checkStoredState = () => {
      // First check sessionStorage (more reliable during session)
      const sessionState = sessionStorage.getItem('gameState');
      if (sessionState) {
        try {
          const parsedState = JSON.parse(sessionState);
          handleGameStateUpdate(parsedState);
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
            handleGameStateUpdate(parsedState);
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
          console.log('Found display truth during check:', parsedTruth);
          handleGameStateUpdate({
            ...parsedTruth,
            definitiveTruth: true
          });
        } catch (error) {
          console.error('Error parsing display truth:', error);
        }
      }
    };
    
    checkStoredState();
    
    // Request sync initially and set up periodic requests
    const requestSync = () => {
      console.log('Player requesting sync from display');
      
      // Dispatch on multiple channels for higher reliability
      window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
        detail: {
          playerName,
          gameId,
          timestamp: Date.now()
        }
      }));
      
      window.dispatchEvent(new CustomEvent('triviaPlayerNeedsSync', { 
        detail: {
          playerName,
          gameId,
          timestamp: Date.now(),
          alternate: true
        }
      }));
      
      checkStoredState(); // Also check storage again
    };
    
    requestSync(); // Initial request
    
    // Set up regular sync requests with randomized intervals for better distribution
    const syncInterval = setInterval(requestSync, 4000 + Math.random() * 2000);
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChangeEvent as EventListener);
      window.removeEventListener('playerSyncResponse', handleStateChangeEvent as EventListener);
      clearInterval(syncInterval);
    };
  }, [handleGameStateUpdate, playerName, gameId]);
  
  // Force sync method for manual triggering
  const forceSync = useCallback(() => {
    console.log('Force sync requested by user');
    
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
        userInitiated: true
      }
    }));
    
    toast({
      title: "Syncing",
      description: "Requesting latest game state from display"
    });
  }, [playerName, gameId, toast]);
  
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
