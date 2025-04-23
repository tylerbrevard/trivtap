
import { useState, useEffect, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { getGameState } from '@/utils/playerAnswerUtils';

interface PlayerGameState {
  state: 'question' | 'answer' | 'intermission' | 'leaderboard' | 'join';
  questionIndex: number;
  questionCounter: number;
  timeLeft: number;
  connected: boolean;
}

export const usePlayerGame = (playerName: string, gameId: string) => {
  const [gameState, setGameState] = useState<PlayerGameState>({
    state: 'join',
    questionIndex: 0,
    questionCounter: 1,
    timeLeft: 0,
    connected: false
  });
  const [score, setScore] = useState(0);
  const [localTimeLeft, setLocalTimeLeft] = useState(0);
  const { toast } = useToast();
  
  // Handle game state changes
  const handleGameStateChange = useCallback((newState: any) => {
    if (!newState) return;
    
    console.log('Game state updated:', newState);
    
    // Update game state
    setGameState(prev => ({
      ...prev,
      state: newState.state || prev.state,
      questionIndex: newState.questionIndex ?? prev.questionIndex,
      questionCounter: newState.questionCounter ?? prev.questionCounter,
      timeLeft: newState.timeLeft ?? prev.timeLeft,
      connected: true
    }));
    
    // Update score if available
    if (newState.scores && newState.scores[playerName]) {
      const playerScore = newState.scores[playerName].score || 0;
      setScore(playerScore);
    }
    
    // Reset local timer when we get a new question
    if (newState.state === 'question' && newState.timeLeft > 0) {
      setLocalTimeLeft(newState.timeLeft);
    }
  }, [playerName]);
  
  // Local timer for question countdown
  useEffect(() => {
    let timerId: number | null = null;
    
    if (gameState.state === 'question' && localTimeLeft > 0) {
      timerId = window.setInterval(() => {
        setLocalTimeLeft(prev => Math.max(0, prev - 1));
      }, 1000);
    }
    
    return () => {
      if (timerId !== null) {
        clearInterval(timerId);
      }
    };
  }, [gameState.state, localTimeLeft]);
  
  // Load initial state from storage on mount
  useEffect(() => {
    const savedState = getGameState();
    if (savedState) {
      handleGameStateChange(savedState);
    }
  }, [handleGameStateChange]);
  
  // Force a sync with the display
  const forceSync = useCallback(() => {
    toast({
      title: "Requesting sync",
      description: "Requesting latest game state..."
    });
    
    // Clear any cached state
    localStorage.removeItem('currentGameState');
    sessionStorage.removeItem('currentGameState');
    
    // Request fresh state via multiple channels
    window.dispatchEvent(new CustomEvent('requestGameState', {
      detail: {
        playerName,
        gameId,
        timestamp: Date.now(),
        forceSync: true
      }
    }));
    
    try {
      const bc = new BroadcastChannel('trivia_game_state');
      bc.postMessage({
        type: 'FORCE_SYNC',
        playerName,
        gameId,
        timestamp: Date.now()
      });
      setTimeout(() => bc.close(), 500);
    } catch (error) {
      console.log('BroadcastChannel not supported');
    }
  }, [playerName, gameId, toast]);
  
  return {
    currentState: gameState.state,
    questionIndex: gameState.questionIndex,
    questionCounter: gameState.questionCounter,
    timeLeft: localTimeLeft,
    score,
    connected: gameState.connected,
    handleGameStateChange,
    forceSync
  };
};
