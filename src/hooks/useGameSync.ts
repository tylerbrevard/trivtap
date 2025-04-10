
import { useState, useEffect, useCallback } from 'react';
import { updateGameState, moveToNextQuestion, autoSyncGameState } from '@/utils/gameStateUtils';
import { gameSettings } from '@/utils/gameSettings';

interface UseGameSyncProps {
  totalQuestions: number;
  initialQuestionIndex?: number;
  initialQuestionCounter?: number;
  autoSync?: boolean;
}

/**
 * Custom hook for game state synchronization
 */
export const useGameSync = ({
  totalQuestions,
  initialQuestionIndex = 0,
  initialQuestionCounter = 1,
  autoSync = true
}: UseGameSyncProps) => {
  const [currentState, setCurrentState] = useState<'question' | 'answer' | 'leaderboard' | 'join' | 'intermission'>('join');
  const [questionIndex, setQuestionIndex] = useState(initialQuestionIndex);
  const [questionCounter, setQuestionCounter] = useState(initialQuestionCounter);
  const [timeLeft, setTimeLeft] = useState(gameSettings.questionDuration);
  const [lastStateChange, setLastStateChange] = useState<number>(Date.now());
  const [forcePause, setForcePause] = useState(false);

  // Update game state handler
  const handleUpdateGameState = useCallback((
    state: 'question' | 'answer' | 'intermission' | 'leaderboard',
    qIndex: number,
    time: number,
    qCounter: number
  ) => {
    const timestamp = updateGameState(qIndex, state, time, qCounter);
    setLastStateChange(timestamp);
    setCurrentState(state);
    setQuestionIndex(qIndex);
    setTimeLeft(time);
    setQuestionCounter(qCounter);
  }, []);

  // Move to next question handler
  const handleMoveToNext = useCallback(() => {
    const { newQuestionIndex, newQuestionCounter } = moveToNextQuestion(
      questionIndex,
      questionCounter,
      gameSettings.questionDuration,
      totalQuestions
    );
    
    setQuestionIndex(newQuestionIndex);
    setQuestionCounter(newQuestionCounter);
    setTimeLeft(gameSettings.questionDuration);
    setCurrentState('question');
    setLastStateChange(Date.now());
    
    return { newQuestionIndex, newQuestionCounter };
  }, [questionIndex, questionCounter, totalQuestions]);

  // Listen for timer updates and state changes in question mode
  useEffect(() => {
    let timerId: number | undefined;
    
    if (forcePause) {
      console.log('Game is paused. Skipping timer update.');
      return () => {
        if (timerId) clearTimeout(timerId);
      };
    }
    
    if (currentState === 'question' && timeLeft > 0 && autoSync) {
      timerId = window.setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        setTimeLeft(newTimeLeft);
        
        // Update localStorage with new time
        updateGameState(questionIndex, 'question', newTimeLeft, questionCounter);
        
        // If time is up, automatically progress to answer state
        if (newTimeLeft === 0) {
          console.log('Time up, auto-progressing to answer state');
          autoSyncGameState(
            gameSettings,
            'question',
            questionIndex,
            questionCounter,
            totalQuestions
          );
        }
      }, 1000);
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [currentState, timeLeft, questionIndex, questionCounter, forcePause, autoSync, totalQuestions]);

  // Toggle pause function
  const togglePause = useCallback(() => {
    setForcePause(prev => !prev);
  }, []);

  return {
    currentState,
    questionIndex,
    questionCounter,
    timeLeft,
    lastStateChange,
    forcePause,
    updateGameState: handleUpdateGameState,
    moveToNextQuestion: handleMoveToNext,
    togglePause,
    setCurrentState,
    setQuestionIndex,
    setQuestionCounter,
    setTimeLeft
  };
};
