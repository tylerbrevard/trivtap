
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { forcePlayerGameSync } from '@/utils/playerAnswerUtils';

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
  const { toast } = useToast();
  
  // Function to handle incoming game state updates
  const handleGameStateUpdate = useCallback((gameState: any) => {
    console.log('Player received game state update:', gameState);
    
    const now = Date.now();
    setLastStateUpdate(now);
    setDisconnected(false);
    
    // Always update state with incoming data
    setCurrentState(gameState.state || currentState);
    setQuestionIndex(gameState.questionIndex !== undefined ? gameState.questionIndex : questionIndex);
    setQuestionCounter(gameState.questionCounter || questionCounter);
    
    // Update time only for question state
    if (gameState.state === 'question') {
      setServerTimeLeft(gameState.timeLeft || 0);
      setLocalTimeLeft(gameState.timeLeft || 0);
    }
    
    setHasInitialState(true);
    
    // Store the update as the latest known state
    try {
      localStorage.setItem('latestPlayerState', JSON.stringify({
        ...gameState,
        playerReceived: now
      }));
    } catch (error) {
      console.error('Error storing latest player state:', error);
    }
  }, [currentState, questionIndex, questionCounter]);
  
  // Check for disconnection
  useEffect(() => {
    const disconnectionCheckInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastStateUpdate;
      
      // If it's been more than 20 seconds since the last state update, consider disconnected
      if (timeSinceLastUpdate > 20000 && !disconnected && hasInitialState) {
        setDisconnected(true);
        toast({
          title: "Connection issues",
          description: "Trying to reconnect to the game...",
          variant: "destructive"
        });
        
        // Try to force sync
        forcePlayerGameSync(playerName, gameId);
      }
    }, 10000);
    
    return () => clearInterval(disconnectionCheckInterval);
  }, [lastStateUpdate, disconnected, hasInitialState, playerName, gameId, toast]);
  
  // Set up local timer
  useEffect(() => {
    // Start local timer only when in question state with time > 0
    if (currentState === 'question' && serverTimeLeft > 0) {
      console.log('Starting local timer with', serverTimeLeft, 'seconds');
      setLocalTimeLeft(serverTimeLeft);
      
      const timerId = setInterval(() => {
        setLocalTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => clearInterval(timerId);
    }
  }, [currentState, serverTimeLeft]);
  
  // Listen for game state events
  useEffect(() => {
    const handleStateChangeEvent = (e: CustomEvent) => {
      handleGameStateUpdate(e.detail);
    };
    
    // Listen for all state change events
    window.addEventListener('triviaStateChange', handleStateChangeEvent as EventListener);
    window.addEventListener('playerSyncResponse', handleStateChangeEvent as EventListener);
    
    // Check for stored game state on mount
    const checkStoredState = () => {
      const storedState = localStorage.getItem('gameState');
      if (storedState) {
        try {
          const parsedState = JSON.parse(storedState);
          handleGameStateUpdate(parsedState);
        } catch (error) {
          console.error('Error parsing stored game state:', error);
        }
      }
      
      // Also check for display truth
      const displayTruth = localStorage.getItem('gameState_display_truth');
      if (displayTruth) {
        try {
          const parsedTruth = JSON.parse(displayTruth);
          console.log('Found display truth during initial load:', parsedTruth);
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
      window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
        detail: {
          playerName,
          gameId,
          timestamp: Date.now()
        }
      }));
      
      checkStoredState(); // Also check local storage again
    };
    
    requestSync(); // Initial request
    
    // Set up regular sync requests
    const syncInterval = setInterval(requestSync, 5000);
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChangeEvent as EventListener);
      window.removeEventListener('playerSyncResponse', handleStateChangeEvent as EventListener);
      clearInterval(syncInterval);
    };
  }, [handleGameStateUpdate, playerName, gameId]);
  
  // Force sync method for manual triggering
  const forceSync = useCallback(() => {
    console.log('Force sync requested');
    
    // Clear any stored game state to avoid conflicts
    localStorage.removeItem('gameState');
    
    // Force a sync
    forcePlayerGameSync(playerName, gameId);
    
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
