
/**
 * Utility functions for handling player answers
 */

/**
 * Submit player answer to the game
 */
export const submitPlayerAnswer = (
  playerName: string,
  gameId: string,
  answer: string,
  questionIndex: number,
  questionCounter: number
): boolean => {
  try {
    // Create answer data object
    const answerData = {
      playerName,
      gameId,
      answer,
      questionIndex,
      questionCounter,
      timestamp: Date.now()
    };
    
    // Store answer in localStorage for recovery
    localStorage.setItem(`playerAnswer_${playerName}_${questionCounter}`, JSON.stringify(answerData));
    sessionStorage.setItem(`playerAnswer_${playerName}_${questionCounter}`, JSON.stringify(answerData));
    
    // Mark as submitted
    sessionStorage.setItem(`answerSubmitted_${questionCounter}`, 'true');
    
    // Dispatch event with answer
    window.dispatchEvent(new CustomEvent('playerAnswerSubmitted', { 
      detail: answerData
    }));
    
    console.log('Player answer submitted:', answerData);
    return true;
  } catch (error) {
    console.error('Error submitting player answer:', error);
    return false;
  }
};

/**
 * Check if player has already submitted an answer for this question
 */
export const hasSubmittedAnswer = (
  playerName: string,
  questionCounter: number
): boolean => {
  // Check submission flag
  if (sessionStorage.getItem(`answerSubmitted_${questionCounter}`) === 'true') {
    return true;
  }
  
  // Check for stored answer
  const answerKey = `playerAnswer_${playerName}_${questionCounter}`;
  return sessionStorage.getItem(answerKey) !== null || localStorage.getItem(answerKey) !== null;
};

/**
 * Get submitted answer for a player and question
 */
export const getSubmittedAnswer = (
  playerName: string,
  questionCounter: number
): { answer: string, timestamp: number } | null => {
  try {
    const answerKey = `playerAnswer_${playerName}_${questionCounter}`;
    
    // Try sessionStorage first (faster access)
    const sessionAnswer = sessionStorage.getItem(answerKey);
    if (sessionAnswer) {
      const answerData = JSON.parse(sessionAnswer);
      return {
        answer: answerData.answer,
        timestamp: answerData.timestamp
      };
    }
    
    // Fall back to localStorage
    const localAnswer = localStorage.getItem(answerKey);
    if (localAnswer) {
      const answerData = JSON.parse(localAnswer);
      return {
        answer: answerData.answer,
        timestamp: answerData.timestamp
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting submitted answer:', error);
    return null;
  }
};

/**
 * Clear all player answers for testing
 */
export const clearAllPlayerAnswers = (playerName: string): void => {
  try {
    // Find all keys to remove
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`playerAnswer_${playerName}_`)) {
        localStorage.removeItem(key);
      }
    }
    
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(`playerAnswer_${playerName}_`)) {
        sessionStorage.removeItem(key);
      }
      if (key && key.startsWith('answerSubmitted_')) {
        sessionStorage.removeItem(key);
      }
    }
    
    console.log(`Cleared answers for player: ${playerName}`);
  } catch (error) {
    console.error('Error clearing player answers:', error);
  }
};

/**
 * Generate client ID for identification
 */
export const getClientId = (): string => {
  let clientId = localStorage.getItem('trivia_client_id');
  
  if (!clientId) {
    clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('trivia_client_id', clientId);
  }
  
  return clientId;
};

/**
 * Store player session info
 */
export const storePlayerSession = (playerName: string, gameId: string): void => {
  const sessionData = {
    playerName,
    gameId,
    timestamp: Date.now(),
    clientId: getClientId()
  };
  
  localStorage.setItem('playerSession', JSON.stringify(sessionData));
  sessionStorage.setItem('playerSession', JSON.stringify(sessionData));
};

/**
 * Get stored player session
 */
export const getPlayerSession = () => {
  try {
    const sessionData = sessionStorage.getItem('playerSession') || localStorage.getItem('playerSession');
    return sessionData ? JSON.parse(sessionData) : null;
  } catch (error) {
    console.error('Error getting player session:', error);
    return null;
  }
};

/**
 * Store the current game state from display
 */
export const storeGameState = (gameState: any): void => {
  if (!gameState) return;
  
  try {
    // Add received timestamp
    const stateWithTimestamp = {
      ...gameState,
      receivedAt: Date.now()
    };
    
    // Store in both storage types
    localStorage.setItem('currentGameState', JSON.stringify(stateWithTimestamp));
    sessionStorage.setItem('currentGameState', JSON.stringify(stateWithTimestamp));
  } catch (error) {
    console.error('Error storing game state:', error);
  }
};

/**
 * Get the current game state
 */
export const getGameState = () => {
  try {
    // Try session storage first (faster)
    const sessionState = sessionStorage.getItem('currentGameState');
    if (sessionState) {
      return JSON.parse(sessionState);
    }
    
    // Fall back to localStorage
    const localState = localStorage.getItem('currentGameState');
    return localState ? JSON.parse(localState) : null;
  } catch (error) {
    console.error('Error getting game state:', error);
    return null;
  }
};

/**
 * Game state poller function for reliable updates
 */
export const setupGameStatePoller = (
  playerName: string, 
  gameId: string, 
  onStateChange: (state: any) => void
): () => void => {
  // Initial poll
  pollGameState(playerName, gameId, onStateChange);
  
  // Set up polling interval
  const intervalId = setInterval(() => {
    pollGameState(playerName, gameId, onStateChange);
  }, 2000); // Poll every 2 seconds
  
  // Return cleanup function
  return () => clearInterval(intervalId);
};

/**
 * Poll for game state updates
 */
const pollGameState = (
  playerName: string, 
  gameId: string, 
  onStateChange: (state: any) => void
) => {
  // Create a clean query string
  const params = new URLSearchParams({
    playerName,
    gameId,
    clientId: getClientId(),
    timestamp: Date.now().toString()
  }).toString();
  
  // Use the BroadcastChannel API for same-origin sync
  try {
    const bc = new BroadcastChannel('trivia_game_state');
    
    bc.onmessage = (event) => {
      if (event.data && event.data.gameId === gameId) {
        storeGameState(event.data);
        onStateChange(event.data);
        bc.close();
      }
    };
    
    // Send a request for state
    bc.postMessage({
      type: 'REQUEST_STATE',
      playerName,
      gameId,
      timestamp: Date.now()
    });
    
    // Close channel after a short time
    setTimeout(() => bc.close(), 500);
  } catch (error) {
    console.log('BroadcastChannel not supported, using events');
    
    // Fallback to custom events
    window.dispatchEvent(new CustomEvent('requestGameState', {
      detail: {
        playerName,
        gameId,
        timestamp: Date.now()
      }
    }));
  }
  
  // Also verify with stored state
  const currentState = getGameState();
  if (currentState) {
    const age = Date.now() - (currentState.receivedAt || 0);
    if (age < 10000) { // Less than 10 seconds old
      onStateChange(currentState);
    }
  }
};

/**
 * Verify player connection to game
 */
export const verifyGameConnection = (playerName: string, gameId: string): boolean => {
  storePlayerSession(playerName, gameId);
  
  // Announce player
  window.dispatchEvent(new CustomEvent('playerPresence', {
    detail: {
      playerName,
      gameId,
      timestamp: Date.now(),
      clientId: getClientId()
    }
  }));
  
  return true;
};
