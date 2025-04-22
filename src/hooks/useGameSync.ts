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
  const [lastSlideRotation, setLastSlideRotation] = useState<number>(Date.now());
  const [forceUpdate, setForceUpdate] = useState(0);
  const [timerActivity, setTimerActivity] = useState<number>(Date.now());

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
    setTimerActivity(Date.now());
    
    // Set display truth immediately to ensure players can sync correctly
    localStorage.setItem('gameState_display_truth', JSON.stringify({
      state,
      questionIndex: qIndex,
      timeLeft: time,
      questionCounter: qCounter,
      timestamp: timestamp + 1,
      definitiveTruth: true
    }));
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
    setTimerActivity(Date.now());
    
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
      if (gameState.definitiveTruth || gameState.guaranteedDelivery || gameState.forceSync) {
        console.log('Accepting definitive game state update:', gameState);
        setCurrentState(gameState.state);
        setQuestionIndex(gameState.questionIndex);
        setTimeLeft(gameState.timeLeft);
        setQuestionCounter(gameState.questionCounter);
        
        if (gameState.slidesIndex !== undefined) {
          setSlidesIndex(gameState.slidesIndex);
          setSlideTimer(gameSettings.slideRotationTime); // Reset slide timer when changing slides
          setLastSlideRotation(Date.now()); // Reset last rotation timestamp
        }
        
        setLastStateChange(gameState.timestamp);
        setTimerActivity(Date.now()); // Update timer activity
        setSyncAttempts(0); // Reset sync attempts counter on successful sync
        return;
      }
      
      if (gameState.timestamp > lastStateChange) {
        console.log('Applying game state from event:', gameState);
        setCurrentState(gameState.state);
        setQuestionIndex(gameState.questionIndex);
        setTimeLeft(gameState.timeLeft);
        setQuestionCounter(gameState.questionCounter);
        
        if (gameState.slidesIndex !== undefined) {
          setSlidesIndex(gameState.slidesIndex);
          setSlideTimer(gameSettings.slideRotationTime); // Reset slide timer when changing slides
          setLastSlideRotation(Date.now()); // Reset last rotation timestamp
        }
        
        setLastStateChange(gameState.timestamp);
        setTimerActivity(Date.now()); // Update timer activity
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
      console.log(`Timer update: timeLeft=${timeLeft}, state=${currentState}`);
      
      timerId = window.setTimeout(() => {
        const newTimeLeft = timeLeft - 1;
        console.log(`Decreasing timer to ${newTimeLeft}`);
        setTimeLeft(newTimeLeft);
        setTimerActivity(Date.now()); // Record timer activity
        
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
    
    if (currentState === 'intermission' && autoSync && !forcePause) {
      const currentTime = Date.now();
      const timeElapsed = currentTime - lastSlideRotation;
      const rotationTimeInMs = gameSettings.slideRotationTime * 1000;
      
      console.log(`Slide rotation check: ${timeElapsed}ms elapsed, rotation time: ${rotationTimeInMs}ms`);
      
      if (timeElapsed >= rotationTimeInMs) {
        console.log('Rotation timeout reached, cycling slide...');
        
        const storedSlides = localStorage.getItem('intermissionSlides');
        if (storedSlides) {
          try {
            const slides = JSON.parse(storedSlides);
            const activeSlidesList = slides.filter((slide: any) => slide.isActive);
            
            console.log(`Found ${activeSlidesList.length} active slides for rotation`);
            
            if (activeSlidesList.length > 1) {
              const nextSlideIndex = (slidesIndex + 1) % activeSlidesList.length;
              console.log(`Rotating to slide ${nextSlideIndex} of ${activeSlidesList.length}`);
              
              setSlidesIndex(nextSlideIndex);
              
              const futureTimestamp = Date.now() + 1000;
              const gameState = {
                state: 'intermission',
                questionIndex: questionIndex,
                timeLeft: 0,
                questionCounter: questionCounter,
                timestamp: futureTimestamp,
                slidesIndex: nextSlideIndex,
                slideRotation: true
              };
              
              localStorage.setItem('gameState', JSON.stringify(gameState));
              
              window.dispatchEvent(new CustomEvent('triviaStateChange', { 
                detail: gameState
              }));
              
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('triviaStateChange', { 
                  detail: {
                    ...gameState,
                    timestamp: futureTimestamp + 100,
                    redundant: true
                  }
                }));
              }, 200);
              
              setLastSlideRotation(currentTime);
              setSlideTimer(gameSettings.slideRotationTime);
            } else {
              console.log('Only one active slide, not rotating');
              setLastSlideRotation(currentTime);
            }
          } catch (e) {
            console.error('Error parsing intermission slides:', e);
            setLastSlideRotation(currentTime);
          }
        } else {
          console.log('No slides found in localStorage');
          setLastSlideRotation(currentTime);
        }
      } else {
        const remainingSeconds = Math.ceil((rotationTimeInMs - timeElapsed) / 1000);
        if (remainingSeconds !== slideTimer) {
          setSlideTimer(remainingSeconds);
        }
        
        timerId = window.setTimeout(() => {
          setForceUpdate(prev => prev + 1);
        }, 1000);
      }
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [
    currentState, 
    timeLeft, 
    questionIndex, 
    questionCounter, 
    forcePause, 
    autoSync, 
    totalQuestions, 
    slidesIndex, 
    activeSlides, 
    lastSlideRotation, 
    forceUpdate
  ]);

  useEffect(() => {
    if (currentState !== 'question' || forcePause) return;
    
    const activityCheckInterval = window.setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - timerActivity;
      
      if (timeSinceLastActivity > 5000 && timeLeft > 0) {
        console.log(`Timer appears stuck - no activity for ${timeSinceLastActivity}ms. Resetting timer.`);
        
        const futureTimestamp = Date.now() + 10000;
        const definitiveState = {
          state: 'question',
          questionIndex,
          timeLeft: timeLeft - 1,
          questionCounter,
          timestamp: futureTimestamp,
          forceSync: true,
          definitiveTruth: true,
          guaranteedDelivery: true
        };
        
        setTimeLeft(timeLeft - 1);
        setTimerActivity(now);
        localStorage.setItem('gameState', JSON.stringify(definitiveState));
        
        window.dispatchEvent(new CustomEvent('triviaStateChange', { 
          detail: definitiveState
        }));
        
        console.log('Forced timer reset due to inactivity');
      }
    }, 3000);
    
    return () => {
      clearInterval(activityCheckInterval);
    };
  }, [currentState, questionIndex, questionCounter, timeLeft, timerActivity, forcePause]);

  useEffect(() => {
    const syncCheckInterval = window.setInterval(() => {
      const storedGameState = localStorage.getItem('gameState');
      if (storedGameState) {
        try {
          const parsedState = JSON.parse(storedGameState);
          
          if (currentState === 'intermission' && parsedState.state === 'question') {
            const timeDiff = Date.now() - lastStateChange;
            if (timeDiff > 10000 && parsedState.timestamp > lastStateChange) {
              console.log('Detected sync issue - intermission while display is showing question. Forcing sync.');
              setCurrentState(parsedState.state);
              setQuestionIndex(parsedState.questionIndex);
              setTimeLeft(parsedState.timeLeft);
              setQuestionCounter(parsedState.questionCounter);
              setLastStateChange(parsedState.timestamp);
              setSyncAttempts(0);
            } else {
              setSyncAttempts(prev => {
                const newCount = prev + 1;
                if (newCount > 5) {
                  console.log('Multiple sync issues detected. Resetting timestamp to force sync on next state change.');
                  setLastStateChange(0);
                  return 0;
                }
                return newCount;
              });
            }
          }
          
          if (currentState === 'intermission') {
            const now = Date.now();
            const timeSinceLastRotation = now - lastSlideRotation;
            const rotationTimeInMs = gameSettings.slideRotationTime * 1000;
            
            if (timeSinceLastRotation > rotationTimeInMs * 1.5) {
              console.log('Detected slide rotation issue, forcing rotation update');
              
              setLastSlideRotation(now - rotationTimeInMs - 1000);
              setForceUpdate(prev => prev + 1);
            }
          }
        } catch (error) {
          console.error('Error checking stored game state:', error);
        }
      }
    }, 5000);
    
    return () => {
      clearInterval(syncCheckInterval);
    };
  }, [currentState, lastStateChange, forcePause, questionIndex, questionCounter, lastSlideRotation]);

  useEffect(() => {
    const handleSettingsChange = (e: Event) => {
      console.log('Game settings changed, updating values', (e as CustomEvent).detail);
      if ((e as CustomEvent).detail?.key === 'slideRotationTime') {
        setSlideTimer(gameSettings.slideRotationTime);
      }
    };
    
    window.addEventListener('gameSettingsChanged', handleSettingsChange);
    
    return () => {
      window.removeEventListener('gameSettingsChanged', handleSettingsChange);
    };
  }, []);

  const togglePause = useCallback(() => {
    setForcePause(prev => !prev);
  }, []);

  useEffect(() => {
    const storedGameState = localStorage.getItem('gameState');
    if (storedGameState) {
      try {
        const parsedState = JSON.parse(storedGameState);
        console.log('Found stored game state:', parsedState);
        
        if (parsedState.definitiveTruth || parsedState.guaranteedDelivery || parsedState.forceSync) {
          console.log('Accepting definitive stored game state:', parsedState);
          setCurrentState(parsedState.state);
          setQuestionIndex(parsedState.questionIndex);
          setTimeLeft(parsedState.timeLeft);
          setQuestionCounter(parsedState.questionCounter);
          
          if (parsedState.slidesIndex !== undefined) {
            setSlidesIndex(parsedState.slidesIndex);
            setLastSlideRotation(Date.now());
          }
          
          setLastStateChange(parsedState.timestamp);
          return;
        }
        
        if (parsedState.timestamp > lastStateChange) {
          setCurrentState(parsedState.state);
          setQuestionIndex(parsedState.questionIndex);
          setTimeLeft(parsedState.timeLeft);
          setQuestionCounter(parsedState.questionCounter);
          
          if (parsedState.slidesIndex !== undefined) {
            setSlidesIndex(parsedState.slidesIndex);
            setLastSlideRotation(Date.now());
          }
          
          setLastStateChange(parsedState.timestamp);
        }
      } catch (error) {
        console.error('Error parsing stored game state:', error);
      }
    }
  }, [lastStateChange]);

  const forceSync = useCallback(() => {
    console.log('Forcing sync by resetting timestamp and clearing localStorage');
    
    localStorage.removeItem('gameState');
    
    setLastStateChange(0);
    setSyncAttempts(0);
    setTimerActivity(Date.now());
    
    setTimeout(() => {
      const futureTimestamp = Date.now() + 20000;
      const definitiveState = {
        state: currentState,
        questionIndex: questionIndex,
        timeLeft: currentState === 'question' ? gameSettings.questionDuration : 0,
        questionCounter: questionCounter,
        timestamp: futureTimestamp,
        slidesIndex: slidesIndex,
        forceSync: true,
        definitiveTruth: true,
        guaranteedDelivery: true,
        syncReset: true
      };
      
      localStorage.setItem('gameState', JSON.stringify(definitiveState));
      
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: definitiveState
      }));
      
      setCurrentState(definitiveState.state);
      setQuestionIndex(definitiveState.questionIndex);
      setTimeLeft(definitiveState.timeLeft);
      setQuestionCounter(definitiveState.questionCounter);
      setLastStateChange(definitiveState.timestamp);
      
      if (definitiveState.state === 'question') {
        setTimeLeft(gameSettings.questionDuration);
      }
    }, 200);
  }, [currentState, questionIndex, questionCounter, slidesIndex]);

  // Add a dedicated player sync handler
  const syncWithPlayers = useCallback(() => {
    console.log('Forcing sync with all players');
    
    const highPriorityState = {
      state: currentState,
      questionIndex: questionIndex,
      timeLeft: currentState === 'question' ? timeLeft : 0,
      questionCounter: questionCounter,
      timestamp: Date.now() + 10000, // Far-future timestamp for priority
      slidesIndex: slidesIndex,
      definitiveTruth: true,
      guaranteedDelivery: true,
      forceSync: true,
      displayInitiated: true
    };
    
    // Store state with high-priority flags
    localStorage.setItem('gameState', JSON.stringify(highPriorityState));
    localStorage.setItem('gameState_display_truth', JSON.stringify({
      ...highPriorityState,
      timestamp: highPriorityState.timestamp + 1 // Even higher priority
    }));
    
    // Dispatch the event
    window.dispatchEvent(new CustomEvent('triviaStateChange', { 
      detail: highPriorityState
    }));
    
    // Schedule repeated events
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => {
        const repeatedState = {
          ...highPriorityState,
          timestamp: highPriorityState.timestamp + i,
          attempt: i
        };
        
        window.dispatchEvent(new CustomEvent('triviaStateChange', { 
          detail: repeatedState
        }));
      }, i * 200);
    }
  }, [currentState, questionIndex, timeLeft, questionCounter, slidesIndex]);

  // Listen for player sync requests
  useEffect(() => {
    const handlePlayerNeedsSync = (e: Event) => {
      console.log('Player requested sync:', (e as CustomEvent).detail);
      syncWithPlayers();
    };
    
    window.addEventListener('playerNeedsSync', handlePlayerNeedsSync);
    
    return () => {
      window.removeEventListener('playerNeedsSync', handlePlayerNeedsSync);
    };
  }, [syncWithPlayers]);

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
    setTimeLeft,
    slideTimer,
    lastSlideRotation,
    timerActivity,
    syncWithPlayers, // Add the new function to the return values
  };
};
