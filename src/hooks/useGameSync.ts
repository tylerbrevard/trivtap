
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
  const [activeSlides, setActiveSlides] = useState<any[]>([]);
  const [syncAttempts, setSyncAttempts] = useState(0);

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

  // Load active slides from localStorage
  useEffect(() => {
    const loadActiveSlides = () => {
      const storedSlides = localStorage.getItem('intermissionSlides');
      if (storedSlides) {
        try {
          const slides = JSON.parse(storedSlides);
          const filteredActiveSlides = slides.filter((slide: any) => slide.isActive);
          setActiveSlides(filteredActiveSlides);
          console.log(`Loaded ${filteredActiveSlides.length} active intermission slides`);
        } catch (e) {
          console.error('Error parsing intermission slides:', e);
          setActiveSlides([]);
        }
      }
    };
    
    loadActiveSlides();
    
    // Also listen for changes to intermission slides
    const handleSlidesChanged = () => {
      loadActiveSlides();
    };
    
    window.addEventListener('intermissionSlidesChanged', handleSlidesChanged);
    
    return () => {
      window.removeEventListener('intermissionSlidesChanged', handleSlidesChanged);
    };
  }, []);

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
        setSyncAttempts(0); // Reset sync attempts counter on successful sync
      } else {
        console.log('Game state event is not newer, ignoring. Current timestamp:', lastStateChange, 'Event timestamp:', gameState.timestamp);
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
          // Reload active slides to ensure we have the latest
          const storedSlides = localStorage.getItem('intermissionSlides');
          if (storedSlides) {
            try {
              const slides = JSON.parse(storedSlides);
              const activeSlidesList = slides.filter((slide: any) => slide.isActive);
              
              console.log(`Found ${activeSlidesList.length} active slides for rotation`);
              
              if (activeSlidesList.length > 1) {
                // Calculate next slide index
                const nextSlideIndex = (slidesIndex + 1) % activeSlidesList.length;
                console.log(`Rotating to slide ${nextSlideIndex} of ${activeSlidesList.length}`);
                
                // Update slide index in state and localStorage
                setSlidesIndex(nextSlideIndex);
                
                // Update in localStorage
                const gameState = localStorage.getItem('gameState');
                if (gameState) {
                  const parsedState = JSON.parse(gameState);
                  parsedState.slidesIndex = nextSlideIndex;
                  parsedState.timestamp = Date.now();
                  localStorage.setItem('gameState', JSON.stringify(parsedState));
                  
                  // Dispatch custom event for other tabs to pick up
                  window.dispatchEvent(new CustomEvent('gameStateChanged'));
                }
                
                // Reset timer
                setSlideTimer(gameSettings.slideRotationTime);
              } else {
                console.log('Only one active slide, not rotating');
                // Still update the timer to keep the useEffect running
                setSlideTimer(slideTimer - 1);
              }
            } catch (e) {
              console.error('Error parsing intermission slides:', e);
              // Still update the timer to keep the useEffect running
              setSlideTimer(slideTimer - 1);
            }
          } else {
            // No slides found, still update timer
            setSlideTimer(slideTimer - 1);
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
  }, [currentState, timeLeft, questionIndex, questionCounter, forcePause, autoSync, totalQuestions, slidesIndex, slideTimer, activeSlides]);

  // Periodic state check to detect and recover from sync issues
  useEffect(() => {
    // Don't run this effect during initial load or if we're in a paused state
    if (forcePause) return;
    
    const syncCheckInterval = window.setInterval(() => {
      const storedGameState = localStorage.getItem('gameState');
      if (storedGameState) {
        try {
          const parsedState = JSON.parse(storedGameState);
          
          // If our state is intermission but localStorage shows we should be in a question state
          // and it's been a while since our last update, force a sync
          if (currentState === 'intermission' && parsedState.state === 'question') {
            const timeDiff = Date.now() - lastStateChange;
            // If we haven't updated in over 10 seconds and the stored state is newer
            if (timeDiff > 10000 && parsedState.timestamp > lastStateChange) {
              console.log('Detected sync issue - intermission while display is showing question. Forcing sync.');
              setCurrentState(parsedState.state);
              setQuestionIndex(parsedState.questionIndex);
              setTimeLeft(parsedState.timeLeft);
              setQuestionCounter(parsedState.questionCounter);
              setLastStateChange(parsedState.timestamp);
              setSyncAttempts(0);
            } else {
              // Increment sync attempts if we think there's an issue
              setSyncAttempts(prev => {
                const newCount = prev + 1;
                // After 5 failed sync attempts, force a timestamp reset to accept any newer state
                if (newCount > 5) {
                  console.log('Multiple sync issues detected. Resetting timestamp to force sync on next state change.');
                  setLastStateChange(0);
                  return 0;
                }
                return newCount;
              });
            }
          }
        } catch (error) {
          console.error('Error checking stored game state:', error);
        }
      }
    }, 5000); // Check every 5 seconds
    
    return () => {
      clearInterval(syncCheckInterval);
    };
  }, [currentState, lastStateChange, forcePause, questionIndex, questionCounter]);

  // Listen for game settings changes
  useEffect(() => {
    const handleSettingsChange = (e: Event) => {
      console.log('Game settings changed, updating values', (e as CustomEvent).detail);
      // If the slide rotation time changed, update our timer
      if ((e as CustomEvent).detail?.key === 'slideRotationTime') {
        setSlideTimer(gameSettings.slideRotationTime);
      }
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

  // Force sync function that resets timestamp to accept any newer state
  const forceSync = useCallback(() => {
    console.log('Forcing sync by resetting timestamp');
    setLastStateChange(0);
    setSyncAttempts(0);
    
    // After resetting timestamp, immediately check for newer state
    const storedGameState = localStorage.getItem('gameState');
    if (storedGameState) {
      try {
        const parsedState = JSON.parse(storedGameState);
        console.log('Applying stored game state after force sync:', parsedState);
        
        setCurrentState(parsedState.state);
        setQuestionIndex(parsedState.questionIndex);
        setTimeLeft(parsedState.timeLeft);
        setQuestionCounter(parsedState.questionCounter);
        
        if (parsedState.slidesIndex !== undefined) {
          setSlidesIndex(parsedState.slidesIndex);
        }
        
        setLastStateChange(parsedState.timestamp);
      } catch (error) {
        console.error('Error applying stored game state after force sync:', error);
      }
    }
  }, []);

  return {
    currentState,
    questionIndex,
    questionCounter,
    timeLeft,
    lastStateChange,
    forcePause,
    slidesIndex,
    activeSlides,
    syncAttempts,
    updateGameState: handleUpdateGameState,
    moveToNextQuestion: handleMoveToNext,
    togglePause,
    forceSync,
    setCurrentState,
    setQuestionIndex,
    setQuestionCounter,
    setTimeLeft
  };
};
