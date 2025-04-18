
// Game state utility functions for synchronizing game state across screens

/**
 * Updates the game state in localStorage to progress to the next question
 * @param currentQuestionIndex The current question index
 * @param nextState The state to transition to
 * @param timeLeft Time remaining (for question state)
 * @param questionCounter Current question counter
 */
export const updateGameState = (
  currentQuestionIndex: number, 
  nextState: 'question' | 'answer' | 'intermission' | 'leaderboard' | 'join',
  timeLeft: number, 
  questionCounter: number
) => {
  const gameState = {
    state: nextState,
    questionIndex: currentQuestionIndex,
    timeLeft: timeLeft,
    questionCounter: questionCounter,
    timestamp: Date.now(),
    slidesIndex: nextState === 'intermission' ? getNextSlideIndex() : 0
  };
  
  console.log('Updating game state:', gameState);
  localStorage.setItem('gameState', JSON.stringify(gameState));
  
  // Trigger a custom event to notify other windows about the state change
  try {
    const stateChangeEvent = new CustomEvent('triviaStateChange', { 
      detail: gameState 
    });
    window.dispatchEvent(stateChangeEvent);
    console.log('Dispatched state change event:', gameState.state);
  } catch (error) {
    console.error('Error dispatching state change event:', error);
  }
  
  // Return the timestamp for tracking
  return gameState.timestamp;
};

/**
 * Get the next slide index for intermission, cycling through active slides
 */
export const getNextSlideIndex = (): number => {
  // Get the current slide index from localStorage, defaulting to 0
  const currentState = localStorage.getItem('gameState');
  let currentSlideIndex = 0;
  
  if (currentState) {
    try {
      const parsedState = JSON.parse(currentState);
      currentSlideIndex = parsedState.slidesIndex || 0;
    } catch (error) {
      console.error('Error parsing current state for slides:', error);
    }
  }
  
  // Get all the available slides
  const savedSlides = localStorage.getItem('intermissionSlides');
  if (!savedSlides) {
    console.log('No intermission slides found, using default index 0');
    return 0;
  }
  
  try {
    const slides = JSON.parse(savedSlides);
    const activeSlides = slides.filter((slide: any) => slide.isActive);
    
    if (activeSlides.length === 0) {
      console.log('No active intermission slides, using default index 0');
      return 0;
    }
    
    // Move to the next slide, cycling back to the beginning if needed
    const nextIndex = (currentSlideIndex + 1) % activeSlides.length;
    console.log(`Moving to slide index ${nextIndex} of ${activeSlides.length} active slides`);
    return nextIndex;
  } catch (error) {
    console.error('Error calculating next slide:', error);
    return 0;
  }
};

/**
 * Keeps track of shown questions to avoid repeats until all questions have been shown
 */
let shownQuestionIndices: number[] = [];

/**
 * Resets the shown questions tracking
 */
export const resetShownQuestions = () => {
  shownQuestionIndices = [];
  console.log('Reset shown questions tracking');
};

/**
 * Moves to the next question, avoiding repeats until all questions have been shown
 * @param currentQuestionIndex Current question index
 * @param questionCounter Question counter
 * @param questionDuration Default question duration
 * @param totalQuestions Total number of questions available
 */
export const moveToNextQuestion = (
  currentQuestionIndex: number,
  questionCounter: number,
  questionDuration: number,
  totalQuestions: number
) => {
  console.log(`Moving to next question (total: ${totalQuestions}), shown so far: ${shownQuestionIndices.length}`);
  
  // Add current question to shown list if not already there
  if (!shownQuestionIndices.includes(currentQuestionIndex)) {
    shownQuestionIndices.push(currentQuestionIndex);
    console.log(`Added question ${currentQuestionIndex} to shown list`);
  }
  
  let nextQuestionIndex: number;
  
  // If we've shown all questions, reset the tracking
  if (shownQuestionIndices.length >= totalQuestions) {
    console.log('All questions have been shown, resetting question cycle');
    shownQuestionIndices = [currentQuestionIndex];
  }
  
  // Find a question that hasn't been shown yet
  let attemptsCounter = 0;
  do {
    nextQuestionIndex = Math.floor(Math.random() * totalQuestions);
    attemptsCounter++;
    
    // Prevent infinite loops with a reasonable attempt limit
    if (attemptsCounter > 100) {
      console.log('Exceeded attempt limit, using a random question');
      // Ensure we don't repeat the current question at least
      do {
        nextQuestionIndex = Math.floor(Math.random() * totalQuestions);
      } while (nextQuestionIndex === currentQuestionIndex);
      break;
    }
  } while (shownQuestionIndices.includes(nextQuestionIndex) && shownQuestionIndices.length < totalQuestions);
  
  console.log(`Moving to next question: ${nextQuestionIndex} from ${currentQuestionIndex} (${shownQuestionIndices.length}/${totalQuestions} shown)`);
  
  // Update game state for the next question
  const timestamp = updateGameState(
    nextQuestionIndex,
    'question',
    questionDuration,
    questionCounter + 1
  );
  
  console.log(`Updated game state for next question with timestamp: ${timestamp}`);
  
  // Force a second event dispatch with slight delay to ensure all clients receive it
  setTimeout(() => {
    const gameState = {
      state: 'question',
      questionIndex: nextQuestionIndex,
      timeLeft: questionDuration,
      questionCounter: questionCounter + 1,
      timestamp: Date.now(),
      slidesIndex: 0
    };
    
    localStorage.setItem('gameState', JSON.stringify(gameState));
    
    // Trigger another custom event as a backup
    try {
      const stateChangeEvent = new CustomEvent('triviaStateChange', { 
        detail: gameState 
      });
      window.dispatchEvent(stateChangeEvent);
      console.log('Sent backup state change event for question change');
    } catch (error) {
      console.error('Error sending backup state change event:', error);
    }
  }, 250);
  
  return {
    newQuestionIndex: nextQuestionIndex,
    newQuestionCounter: questionCounter + 1
  };
};

/**
 * Cycles to the next intermission slide
 * @param currentQuestionIndex Current question index
 * @param questionCounter Question counter
 * @param gameSettings Game settings with timing configurations
 */
export const cycleIntermissionSlide = (
  currentQuestionIndex: number,
  questionCounter: number,
  gameSettings: any
) => {
  console.log('Cycling to next intermission slide');
  
  // Get the slides from localStorage
  const savedSlides = localStorage.getItem('intermissionSlides');
  if (!savedSlides) {
    console.log('No intermission slides found, moving to next question');
    moveToNextQuestion(
      currentQuestionIndex,
      questionCounter,
      gameSettings.questionDuration,
      1000 // Large number to prevent index errors until we know the actual count
    );
    return;
  }
  
  try {
    const slides = JSON.parse(savedSlides);
    const activeSlides = slides.filter((slide: any) => slide.isActive);
    
    if (activeSlides.length === 0) {
      console.log('No active intermission slides, moving to next question');
      moveToNextQuestion(
        currentQuestionIndex,
        questionCounter,
        gameSettings.questionDuration,
        1000 // Large number to prevent index errors until we know the actual count
      );
      return;
    }
    
    const currentState = localStorage.getItem('gameState');
    let currentSlideIndex = 0;
    
    if (currentState) {
      try {
        const parsedState = JSON.parse(currentState);
        currentSlideIndex = parsedState.slidesIndex || 0;
      } catch (error) {
        console.error('Error parsing current state for slides:', error);
      }
    }
    
    const nextIndex = (currentSlideIndex + 1) % activeSlides.length;
    console.log(`Cycling to slide ${nextIndex} of ${activeSlides.length}`);
    
    // If we've gone through all slides, move to the next question
    if (nextIndex === 0 && activeSlides.length > 1) {
      console.log('Completed all intermission slides, moving to next question');
      moveToNextQuestion(
        currentQuestionIndex,
        questionCounter,
        gameSettings.questionDuration,
        1000 // Large number to prevent index errors until we know the actual count
      );
    } else {
      // Otherwise, update to show the next slide
      const timestamp = Date.now();
      const gameState = {
        state: 'intermission',
        questionIndex: currentQuestionIndex,
        timeLeft: 0,
        questionCounter: questionCounter,
        timestamp: timestamp,
        slidesIndex: nextIndex
      };
      
      localStorage.setItem('gameState', JSON.stringify(gameState));
      
      // Trigger a custom event to notify other windows about the state change
      try {
        const stateChangeEvent = new CustomEvent('triviaStateChange', { 
          detail: gameState 
        });
        window.dispatchEvent(stateChangeEvent);
        console.log(`Updated to show intermission slide ${nextIndex}`);
      } catch (error) {
        console.error('Error dispatching intermission state change event:', error);
      }
      
      // Set timeout for the next slide
      setTimeout(() => {
        // Verify we're still in intermission state before cycling to the next slide
        const currentGameState = localStorage.getItem('gameState');
        if (currentGameState) {
          try {
            const parsedState = JSON.parse(currentGameState);
            if (parsedState.state === 'intermission') {
              cycleIntermissionSlide(
                currentQuestionIndex,
                questionCounter,
                gameSettings
              );
            }
          } catch (error) {
            console.error('Error checking game state before cycling slides:', error);
          }
        }
      }, gameSettings.slideRotationTime * 1000); // Use slide rotation time from settings
    }
  } catch (error) {
    console.error('Error cycling intermission slides:', error);
    moveToNextQuestion(
      currentQuestionIndex,
      questionCounter,
      gameSettings.questionDuration,
      1000 // Large number to prevent index errors until we know the actual count
    );
  }
};

/**
 * Auto-sync game state between displays, admins, and players
 * This function automatically progresses the game state based on timing rules
 * @param gameSettings Game settings object with timing configurations
 * @param currentState Current game state
 * @param currentQuestionIndex Current question index
 * @param questionCounter Current question counter
 * @param totalQuestions Total available questions
 */
export const autoSyncGameState = (
  gameSettings: any,
  currentState: string,
  currentQuestionIndex: number,
  questionCounter: number,
  totalQuestions: number
) => {
  console.log('Auto-syncing game state:', { currentState, currentQuestionIndex, questionCounter });
  console.log('Using game settings:', gameSettings);
  
  if (currentState === 'question') {
    // Move from question to answer state
    const timestamp = updateGameState(
      currentQuestionIndex,
      'answer',
      0,
      questionCounter
    );
    
    console.log('Changed state from question to answer, timestamp:', timestamp);
    
    // Set timeout to move to the next appropriate state
    setTimeout(() => {
      // Check if we should show intermission based on game settings
      const shouldShowIntermission = questionCounter > 0 && 
        questionCounter % gameSettings.intermissionFrequency === 0;
      
      // Check if we should show leaderboard based on game settings
      const shouldShowLeaderboard = questionCounter > 0 && 
        questionCounter % gameSettings.leaderboardFrequency === 0 && 
        !shouldShowIntermission;
      
      // Check if we should display the winner slide
      const shouldShowWinnerSlide = gameSettings.showWinnerSlide !== false && 
        (shouldShowLeaderboard || shouldShowIntermission);
      
      console.log('Decision making for next state:', {
        currentQuestionCounter: questionCounter,
        intermissionFrequency: gameSettings.intermissionFrequency,
        shouldShowIntermission,
        leaderboardFrequency: gameSettings.leaderboardFrequency,
        shouldShowLeaderboard,
        showIntermissionSetting: gameSettings.showIntermission,
        showWinnerSlideSetting: gameSettings.showWinnerSlide,
        shouldShowWinnerSlide
      });
      
      if (shouldShowWinnerSlide) {
        console.log('Auto-syncing: Moving to leaderboard for winners');
        updateGameState(
          currentQuestionIndex,
          'leaderboard',
          0,
          questionCounter
        );
        
        // After leaderboard, move to intermission if needed or to next question
        setTimeout(() => {
          if (shouldShowIntermission && gameSettings.showIntermission) {
            console.log('Auto-syncing: Moving to intermission after leaderboard');
            updateGameState(
              currentQuestionIndex,
              'intermission',
              0,
              questionCounter
            );
            
            // Start cycling through intermission slides
            setTimeout(() => {
              cycleIntermissionSlide(
                currentQuestionIndex,
                questionCounter,
                gameSettings
              );
            }, gameSettings.slideRotationTime * 1000);
          } else {
            moveToNextQuestion(
              currentQuestionIndex,
              questionCounter,
              gameSettings.questionDuration,
              totalQuestions
            );
          }
        }, 8000); // 8 seconds for leaderboard display
      }
      else if (shouldShowIntermission && gameSettings.showIntermission) {
        console.log('Auto-syncing: Moving to intermission');
        updateGameState(
          currentQuestionIndex,
          'intermission',
          0,
          questionCounter
        );
        
        // Start cycling through intermission slides
        setTimeout(() => {
          cycleIntermissionSlide(
            currentQuestionIndex,
            questionCounter,
            gameSettings
          );
        }, gameSettings.slideRotationTime * 1000);
      } 
      else if (shouldShowLeaderboard) {
        console.log('Auto-syncing: Moving to leaderboard');
        updateGameState(
          currentQuestionIndex,
          'leaderboard',
          0,
          questionCounter
        );
        
        // After leaderboard, move to next question
        setTimeout(() => {
          moveToNextQuestion(
            currentQuestionIndex,
            questionCounter,
            gameSettings.questionDuration,
            totalQuestions
          );
        }, 10000); // 10 seconds for leaderboard display
      }
      else {
        // Directly move to next question
        moveToNextQuestion(
          currentQuestionIndex,
          questionCounter,
          gameSettings.questionDuration,
          totalQuestions
        );
      }
    }, gameSettings.answerRevealDuration * 1000);
  }
};

/**
 * Listen for game state changes from other windows/tabs
 * @param callback Function to call when state changes are detected
 */
export const listenForGameStateChanges = (callback: (gameState: any) => void) => {
  const handleStateChange = (event: CustomEvent) => {
    console.log('Received game state change event:', event.detail);
    callback(event.detail);
  };
  
  window.addEventListener('triviaStateChange', handleStateChange as EventListener);
  
  return () => {
    window.removeEventListener('triviaStateChange', handleStateChange as EventListener);
  };
};

/**
 * Notify all connected windows about a player joining
 * @param playerName Player name
 * @param gameId Game ID
 */
export const notifyPlayerJoined = (playerName: string, gameId: string) => {
  try {
    const playerData = {
      name: playerName,
      gameId: gameId,
      timestamp: Date.now()
    };
    
    localStorage.setItem('playerJoined', JSON.stringify(playerData));
    
    const playerJoinedEvent = new CustomEvent('playerJoined', { 
      detail: playerData
    });
    window.dispatchEvent(playerJoinedEvent);
    console.log('Sent player joined notification:', playerName);
    
    return true;
  } catch (error) {
    console.error('Error notifying player joined:', error);
    return false;
  }
};

/**
 * Listen for players joining from other windows/tabs
 * @param callback Function to call when player joins
 */
export const listenForPlayersJoining = (callback: (playerData: any) => void) => {
  const handlePlayerJoined = (event: CustomEvent) => {
    console.log('Received player joined event:', event.detail);
    callback(event.detail);
  };
  
  window.addEventListener('playerJoined', handlePlayerJoined as EventListener);
  
  return () => {
    window.removeEventListener('playerJoined', handlePlayerJoined as EventListener);
  };
};
