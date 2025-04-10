
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
  nextState: 'question' | 'answer' | 'intermission' | 'leaderboard',
  timeLeft: number, 
  questionCounter: number
) => {
  const gameState = {
    state: nextState,
    questionIndex: currentQuestionIndex,
    timeLeft: timeLeft,
    questionCounter: questionCounter,
    timestamp: Date.now()
  };
  
  console.log('Updating game state:', gameState);
  localStorage.setItem('gameState', JSON.stringify(gameState));
  
  // Trigger a custom event to notify other windows about the state change
  const stateChangeEvent = new CustomEvent('triviaStateChange', { 
    detail: gameState 
  });
  window.dispatchEvent(stateChangeEvent);
  
  // Return the timestamp for tracking
  return gameState.timestamp;
};

/**
 * Moves to the next question
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
  const nextQuestionIndex = (currentQuestionIndex + 1) % totalQuestions;
  console.log(`Moving to next question: ${nextQuestionIndex} from ${currentQuestionIndex}`);
  
  // Update game state for the next question
  updateGameState(
    nextQuestionIndex,
    'question',
    questionDuration,
    questionCounter + 1
  );
  
  return {
    newQuestionIndex: nextQuestionIndex,
    newQuestionCounter: questionCounter + 1
  };
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
  
  if (currentState === 'question') {
    // Move from question to answer state
    updateGameState(
      currentQuestionIndex,
      'answer',
      0,
      questionCounter
    );
    
    // Set timeout to move to the next appropriate state
    setTimeout(() => {
      const shouldShowIntermission = questionCounter > 0 && 
        questionCounter % gameSettings.intermissionFrequency === 0;
      
      const shouldShowLeaderboard = questionCounter > 0 && 
        questionCounter % gameSettings.leaderboardFrequency === 0 && 
        !shouldShowIntermission;
      
      if (shouldShowIntermission) {
        console.log('Auto-syncing: Moving to intermission');
        updateGameState(
          currentQuestionIndex,
          'intermission',
          0,
          questionCounter
        );
        
        // After intermission, move to next question
        setTimeout(() => {
          moveToNextQuestion(
            currentQuestionIndex,
            questionCounter,
            gameSettings.questionDuration,
            totalQuestions
          );
        }, gameSettings.intermissionDuration * 1000);
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
