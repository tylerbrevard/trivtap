
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";

/**
 * Custom hook for player-display synchronization with a simpler approach
 */
export const usePlayerSync = (playerName: string, gameId: string) => {
  const [currentState, setCurrentState] = useState<'question' | 'answer' | 'leaderboard' | 'intermission' | 'join'>('join');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questionCounter, setQuestionCounter] = useState(1);
  const [serverTimeLeft, setServerTimeLeft] = useState(0);
  const [localTimeLeft, setLocalTimeLeft] = useState(0);
  const [hasInitialState, setHasInitialState] = useState(false);
  const { toast } = useToast();
  
  // Function to handle incoming game state updates
  const handleGameStateUpdate = useCallback((gameState: any) => {
    console.log('Player received game state update:', gameState);
    
    // Always accept definitive updates
    setCurrentState(gameState.state);
    setQuestionIndex(gameState.questionIndex);
    setQuestionCounter(gameState.questionCounter || questionCounter);
    
    // Update time only for question state
    if (gameState.state === 'question') {
      setServerTimeLeft(gameState.timeLeft);
      setLocalTimeLeft(gameState.timeLeft);
    } else {
      setServerTimeLeft(0);
      setLocalTimeLeft(0);
    }
    
    setHasInitialState(true);
  }, [questionCounter]);
  
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
    
    // Listen for state change events
    window.addEventListener('triviaStateChange', handleStateChangeEvent as EventListener);
    
    // Check for stored game state on mount
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
        handleGameStateUpdate(parsedTruth);
      } catch (error) {
        console.error('Error parsing display truth:', error);
      }
    }
    
    // Request initial sync on mount
    requestSyncFromDisplay();
    
    // Periodic sync request
    const periodicSyncInterval = setInterval(requestSyncFromDisplay, 3000);
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChangeEvent as EventListener);
      clearInterval(periodicSyncInterval);
    };
  }, [handleGameStateUpdate]);
  
  // Request sync from display
  const requestSyncFromDisplay = useCallback(() => {
    console.log('Player requesting sync from display');
    
    // Dispatch an event requesting sync
    window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
      detail: {
        playerName,
        gameId,
        timestamp: Date.now()
      }
    }));
    
    // Also check local storage for display truth
    const displayTruth = localStorage.getItem('gameState_display_truth');
    if (displayTruth) {
      try {
        const parsedTruth = JSON.parse(displayTruth);
        handleGameStateUpdate(parsedTruth);
      } catch (error) {
        console.error('Error parsing display truth during sync:', error);
      }
    }
  }, [playerName, gameId, handleGameStateUpdate]);
  
  // Force sync method for manual triggering
  const forceSync = useCallback(() => {
    console.log('Force sync requested');
    
    // Clear any stored game state to avoid conflicts
    localStorage.removeItem('gameState');
    
    // Request a new sync
    requestSyncFromDisplay();
    
    toast({
      title: "Syncing",
      description: "Requesting latest game state from display"
    });
  }, [requestSyncFromDisplay, toast]);
  
  return {
    currentState,
    questionIndex,
    timeLeft: localTimeLeft,
    questionCounter,
    hasInitialState,
    forceSync
  };
};
