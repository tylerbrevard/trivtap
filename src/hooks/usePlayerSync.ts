
import { useState, useEffect, useCallback } from 'react';
import { recoverFromDisplayTruth, requestSyncFromDisplay } from '@/utils/gameStateUtils';

/**
 * Custom hook for player-display synchronization
 */
export const usePlayerSync = (playerName: string, gameId: string) => {
  const [syncAttempts, setSyncAttempts] = useState(0);
  const [lastSyncRequest, setLastSyncRequest] = useState(0);
  const [hasInitialState, setHasInitialState] = useState(false);
  const [currentState, setCurrentState] = useState<'question' | 'answer' | 'leaderboard' | 'intermission' | 'join'>('join');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionCounter, setQuestionCounter] = useState(1);
  
  // Handle game state changes from events
  const handleGameStateChange = useCallback((gameState: any) => {
    console.log('Player handling game state change:', gameState);
    
    if (gameState.definitiveTruth || gameState.guaranteedDelivery || gameState.forceSync) {
      console.log('Accepting definitive game state update from event');
      setCurrentState(gameState.state);
      setQuestionIndex(gameState.questionIndex);
      setTimeLeft(gameState.state === 'question' ? gameState.timeLeft : 0);
      setQuestionCounter(gameState.questionCounter);
      setSyncAttempts(0);
      setHasInitialState(true);
      return;
    }
    
    if (gameState.timestamp && (lastSyncRequest === 0 || gameState.timestamp > lastSyncRequest)) {
      setCurrentState(gameState.state);
      setQuestionIndex(gameState.questionIndex);
      setTimeLeft(gameState.state === 'question' ? gameState.timeLeft : 0);
      setQuestionCounter(gameState.questionCounter);
      setSyncAttempts(0);
      setHasInitialState(true);
      setLastSyncRequest(gameState.timestamp);
    }
  }, [lastSyncRequest]);
  
  // Listen for game state changes
  useEffect(() => {
    const handleStateChangeEvent = (e: CustomEvent) => {
      handleGameStateChange(e.detail);
    };
    
    window.addEventListener('triviaStateChange', handleStateChangeEvent as EventListener);
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChangeEvent as EventListener);
    };
  }, [handleGameStateChange]);
  
  // Initial state check and periodic sync
  useEffect(() => {
    // Check for initial state
    const storedState = localStorage.getItem('gameState');
    if (storedState) {
      try {
        const parsedState = JSON.parse(storedState);
        handleGameStateChange(parsedState);
      } catch (error) {
        console.error('Error parsing stored game state:', error);
      }
    }
    
    // Set up periodic sync check
    const syncInterval = setInterval(() => {
      if (!hasInitialState || syncAttempts < 3) {
        console.log('Player periodic sync check in hook');
        requestSyncFromDisplay(playerName);
        setSyncAttempts(prev => prev + 1);
        setLastSyncRequest(Date.now());
      }
      
      if (syncAttempts >= 3) {
        console.log('Multiple sync attempts failed, trying to recover from display truth');
        recoverFromDisplayTruth();
      }
    }, 3000);
    
    return () => {
      clearInterval(syncInterval);
    };
  }, [playerName, handleGameStateChange, hasInitialState, syncAttempts]);
  
  // Force sync method
  const forceSync = useCallback(() => {
    console.log('Force sync requested');
    recoverFromDisplayTruth();
    requestSyncFromDisplay(playerName);
    setSyncAttempts(0);
    setLastSyncRequest(Date.now());
  }, [playerName]);
  
  return {
    currentState,
    questionIndex,
    timeLeft,
    questionCounter,
    hasInitialState,
    forceSync
  };
};
