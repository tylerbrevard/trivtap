
import { useState, useEffect, useCallback } from 'react';
import { updateGameState, moveToNextQuestion, autoSyncGameState, listenForGameStateChanges } from '@/utils/gameStateUtils';
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
  const [slidesIndex, setSlidesIndex] = useState(0);
  const [slideTimer, setSlideTimer] = useState(gameSettings.slideRotationTime);

  // Update game state handler
  const handleUpdateGameState = useCallback((
    state: 'question' | 'answer' | 'intermission' | 'leaderboard' | 'join',
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

  // Listen for game state changes from other windows/tabs
  useEffect(() => {
    const removeListener = listenForGameStateChanges((gameState) => {
      if (gameState.timestamp > lastStateChange) {
        console.log('Applying game state from event:', gameState);
        setCurrentState(gameState.state);
        setQuestionIndex(gameState.questionIndex);
        setTimeLeft(gameState.timeLeft);
        setQuestionCounter(gameState.questionCounter);
        
        if (gameState.slidesIndex !== undefined) {
          setSlidesIndex(gameState.slidesIndex);
          setSlideTimer(gameSettings.slideRotationTime); // Reset slide timer when changing slides
        }
        
        setLastStateChange(gameState.timestamp);
      }
    });
    
    return removeListener;
  }, [lastStateChange]);

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
    
    // Handle intermission slide cycling
    if (currentState === 'intermission' && autoSync && !forcePause) {
      timerId = window.setTimeout(() => {
        // Check if we need to update the slide
        if (slideTimer <= 0) {
          // Get slides from localStorage
          const storedSlides = localStorage.getItem('intermissionSlides');
          if (storedSlides) {
            try {
              const slides = JSON.parse(storedSlides);
              const activeSlides = slides.filter((slide: any) => slide.isActive);
              
              if (activeSlides.length > 1) {
                // Calculate next slide index
                const nextSlideIndex = (slidesIndex + 1) % activeSlides.length;
                console.log(`Rotating to slide ${nextSlideIndex} of ${activeSlides.length}`);
                
                // Update slide index in state and localStorage
                setSlidesIndex(nextSlideIndex);
                
                // Update in localStorage
                const gameState = localStorage.getItem('gameState');
                if (gameState) {
                  const parsedState = JSON.parse(gameState);
                  parsedState.slidesIndex = nextSlideIndex;
                  localStorage.setItem('gameState', JSON.stringify(parsedState));
                }
                
                // Reset timer
                setSlideTimer(gameSettings.slideRotationTime);
              } else {
                console.log('Only one active slide, not rotating');
              }
            } catch (e) {
              console.error('Error parsing intermission slides:', e);
            }
          }
        } else {
          // Just update the timer
          setSlideTimer(slideTimer - 1);
        }
      }, 1000);
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [currentState, timeLeft, questionIndex, questionCounter, forcePause, autoSync, totalQuestions, slidesIndex, slideTimer]);

  // Listen for game settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      console.log('Game settings changed, updating values');
      // If the slide rotation time changed, update our timer
      setSlideTimer(gameSettings.slideRotationTime);
    };
    
    window.addEventListener('gameSettingsChanged', handleSettingsChange);
    
    return () => {
      window.removeEventListener('gameSettingsChanged', handleSettingsChange);
    };
  }, []);

  // Toggle pause function
  const togglePause = useCallback(() => {
    setForcePause(prev => !prev);
  }, []);

  // Check for stored game state on initialization
  useEffect(() => {
    const storedGameState = localStorage.getItem('gameState');
    if (storedGameState) {
      try {
        const parsedState = JSON.parse(storedGameState);
        console.log('Found stored game state:', parsedState);
        
        if (parsedState.timestamp > lastStateChange) {
          setCurrentState(parsedState.state);
          setQuestionIndex(parsedState.questionIndex);
          setTimeLeft(parsedState.timeLeft);
          setQuestionCounter(parsedState.questionCounter);
          
          if (parsedState.slidesIndex !== undefined) {
            setSlidesIndex(parsedState.slidesIndex);
          }
          
          setLastStateChange(parsedState.timestamp);
        }
      } catch (error) {
        console.error('Error parsing stored game state:', error);
      }
    }
  }, [lastStateChange]);

  return {
    currentState,
    questionIndex,
    questionCounter,
    timeLeft,
    lastStateChange,
    forcePause,
    slidesIndex,
    updateGameState: handleUpdateGameState,
    moveToNextQuestion: handleMoveToNext,
    togglePause,
    setCurrentState,
    setQuestionIndex,
    setQuestionCounter,
    setTimeLeft
  };
};
