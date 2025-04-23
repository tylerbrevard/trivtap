
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
  // Calculate slidesIndex only for intermission state transitions
  const slidesIndex = nextState === 'intermission' ? getNextSlideIndex() : 0;
  
  const gameState = {
    state: nextState,
    questionIndex: currentQuestionIndex,
    timeLeft: timeLeft,
    questionCounter: questionCounter,
    timestamp: Date.now(),
    slidesIndex: slidesIndex,
    authoritative: true // Mark as authoritative source
  };
  
  console.log('Updating game state:', gameState);
  localStorage.setItem('gameState', JSON.stringify(gameState));
  
  // Also store as display truth for persistent reference
  if (nextState === 'question') {
    localStorage.setItem('gameState_display_truth', JSON.stringify(gameState));
  }
  
  // Trigger a custom event to notify other windows about the state change
  try {
    const stateChangeEvent = new CustomEvent('triviaStateChange', { 
      detail: gameState 
    });
    window.dispatchEvent(stateChangeEvent);
    console.log('Dispatched state change event:', gameState.state);
    
    // Send a second event after a small delay as a backup
    setTimeout(() => {
      const backupEvent = new CustomEvent('triviaStateChange', { 
        detail: {
          ...gameState,
          timestamp: gameState.timestamp + 1, // Slightly newer
          backupSync: true
        }
      });
      window.dispatchEvent(backupEvent);
      console.log('Dispatched backup state event');
    }, 200);
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
      slidesIndex: 0,
      authoritative: true,
      forceSync: true,
      forceNextQuestion: true, // Flag to force players to move to next question
      nextQuestionTimestamp: Date.now() // Timestamp for when the next question was triggered
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
      
      // Set timeout for the next slide with backup mechanism
      const slideRotationTimer = setTimeout(() => {
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
            } else {
              console.log('State has changed from intermission, not cycling slides');
            }
          } catch (error) {
            console.error('Error checking game state before cycling slides:', error);
          }
        }
      }, gameSettings.slideRotationTime * 1000); // Use slide rotation time from settings
      
      // Set a backup timer in case the main one fails
      setTimeout(() => {
        // Check if we're still showing the same slide after the rotation time plus buffer
        const latestState = localStorage.getItem('gameState');
        if (latestState) {
          try {
            const parsedLatestState = JSON.parse(latestState);
            if (parsedLatestState.state === 'intermission' && 
                parsedLatestState.slidesIndex === nextIndex &&
                Date.now() - timestamp > (gameSettings.slideRotationTime * 1000) + 2000) {
              
              console.log('Backup timer: Slide did not rotate as expected, forcing rotation');
              cycleIntermissionSlide(
                currentQuestionIndex,
                questionCounter,
                gameSettings
              );
            }
          } catch (error) {
            console.error('Error in backup timer check:', error);
          }
        }
      }, (gameSettings.slideRotationTime * 1000) + 3000); // Main timer plus buffer
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
        const leaderboardState = {
          state: 'leaderboard',
          questionIndex: currentQuestionIndex,
          timeLeft: 0,
          questionCounter: questionCounter,
          timestamp: Date.now() + 1000,
          definitiveTruth: true,
          guaranteedDelivery: true,
          broadcastTime: new Date().toISOString()
        };
        
        localStorage.setItem('gameState', JSON.stringify(leaderboardState));
        localStorage.setItem('gameState_display_truth', JSON.stringify(leaderboardState));
        
        window.dispatchEvent(new CustomEvent('triviaStateChange', { 
          detail: leaderboardState
        }));
        
        // After leaderboard, move to intermission if needed or to next question
        setTimeout(() => {
          if (shouldShowIntermission && gameSettings.showIntermission) {
            console.log('Auto-syncing: Moving to intermission after leaderboard');
            const intermissionState = {
              state: 'intermission',
              questionIndex: currentQuestionIndex,
              timeLeft: 0,
              questionCounter: questionCounter,
              timestamp: Date.now() + 1000,
              definitiveTruth: true,
              guaranteedDelivery: true,
              broadcastTime: new Date().toISOString()
            };
            
            localStorage.setItem('gameState', JSON.stringify(intermissionState));
            localStorage.setItem('gameState_display_truth', JSON.stringify(intermissionState));
            
            window.dispatchEvent(new CustomEvent('triviaStateChange', { 
              detail: intermissionState
            }));
            
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
        const intermissionState = {
          state: 'intermission',
          questionIndex: currentQuestionIndex,
          timeLeft: 0,
          questionCounter: questionCounter,
          timestamp: Date.now() + 1000,
          definitiveTruth: true,
          guaranteedDelivery: true,
          broadcastTime: new Date().toISOString()
        };
        
        localStorage.setItem('gameState', JSON.stringify(intermissionState));
        localStorage.setItem('gameState_display_truth', JSON.stringify(intermissionState));
        
        window.dispatchEvent(new CustomEvent('triviaStateChange', { 
          detail: intermissionState
        }));
        
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
        const leaderboardState = {
          state: 'leaderboard',
          questionIndex: currentQuestionIndex,
          timeLeft: 0,
          questionCounter: questionCounter,
          timestamp: Date.now() + 1000,
          definitiveTruth: true,
          guaranteedDelivery: true,
          broadcastTime: new Date().toISOString()
        };
        
        localStorage.setItem('gameState', JSON.stringify(leaderboardState));
        localStorage.setItem('gameState_display_truth', JSON.stringify(leaderboardState));
        
        window.dispatchEvent(new CustomEvent('triviaStateChange', { 
          detail: leaderboardState
        }));
        
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
    
    // Special flags for guaranteed delivery - always process these
    if (event.detail.guaranteedDelivery || 
        event.detail.authoritative || 
        event.detail.definitiveTruth ||
        event.detail.forceSync) {
      console.log('Processing authoritative/guaranteed game state update');
      callback(event.detail);
      return;
    }
    
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

/**
 * Emergency recovery of game state from display truth
 * This function can be called by players who are out of sync
 */
export const recoverFromDisplayTruth = () => {
  // First clear any existing game state to avoid circular references
  localStorage.removeItem('gameState');
  
  // Then get the display truth
  const displayTruth = localStorage.getItem('gameState_display_truth');
  if (displayTruth) {
    try {
      const truthState = JSON.parse(displayTruth);
      console.log('Recovering from display truth:', truthState);
      
      // Create a new state with special override flags
      const recoveryState = {
        ...truthState,
        timestamp: Date.now() + 20000, // Future timestamp to ensure acceptance
        recovered: true,
        guaranteedDelivery: true,
        overrideIntermission: true,
        supercedeAllStates: true,
        forceSync: true,
        playerRecovery: true
      };
      
      // Update the regular game state
      localStorage.setItem('gameState', JSON.stringify(recoveryState));
      
      // Trigger multiple events to ensure delivery
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: recoveryState
      }));
      
      // Send additional events to ensure delivery
      for (let i = 1; i <= 3; i++) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('triviaStateChange', { 
            detail: {
              ...recoveryState,
              timestamp: recoveryState.timestamp + i,
              redundancyLevel: i
            }
          }));
        }, i * 100);
      }
      
      return true;
    } catch (error) {
      console.error('Error recovering from display truth:', error);
      return false;
    }
  }
  return false;
};

/**
 * Player-specific function to request a state sync from the display
 * @param playerName The name of the player requesting sync
 */
export const requestSyncFromDisplay = (playerName: string) => {
  try {
    const syncRequest = {
      playerName: playerName,
      timestamp: Date.now(),
      requestType: 'sync',
      needsCurrentQuestionData: true
    };
    
    console.log('Player requesting sync from display:', syncRequest);
    
    window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
      detail: syncRequest
    }));
    
    // Send multiple sync requests to ensure delivery
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
          detail: {
            ...syncRequest,
            timestamp: syncRequest.timestamp + i,
            redundancyLevel: i
          }
        }));
      }, i * 300);
    }
    
    return true;
  } catch (error) {
    console.error('Error requesting sync from display:', error);
    return false;
  }
};

/**
 * Submit a player's answer for the current question
 * @param playerName The name of the player
 * @param gameId The game ID/code
 * @param answer The selected answer
 * @param questionIndex The current question index
 * @param questionCounter The question counter
 */
export const submitPlayerAnswer = (
  playerName: string,
  gameId: string,
  answer: string,
  questionIndex: number,
  questionCounter: number
) => {
  try {
    const submissionData = {
      playerName: playerName,
      gameId: gameId,
      answer: answer,
      questionIndex: questionIndex,
      questionCounter: questionCounter,
      timestamp: Date.now(),
      submissionType: 'answer'
    };
    
    localStorage.setItem(`playerAnswer_${playerName}_${questionCounter}`, JSON.stringify(submissionData));
    
    console.log('Player submitted answer:', submissionData);
    
    window.dispatchEvent(new CustomEvent('playerAnswerSubmitted', { 
      detail: submissionData
    }));
    
    return true;
  } catch (error) {
    console.error('Error submitting player answer:', error);
    return false;
  }
};
