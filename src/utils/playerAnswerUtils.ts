
/**
 * Utility functions for handling player answers
 */

/**
 * Submit player answer and store it for retrieval
 */
export const submitPlayerAnswer = (
  playerName: string,
  gameId: string,
  answer: string,
  questionIndex: number,
  questionCounter: number
): boolean => {
  try {
    const answerData = {
      playerName,
      gameId,
      answer,
      questionIndex,
      questionCounter,
      timestamp: Date.now()
    };
    
    // Store answer in localStorage
    localStorage.setItem(`playerAnswer_${playerName}_${questionCounter}`, JSON.stringify(answerData));
    
    // Dispatch event with answer
    window.dispatchEvent(new CustomEvent('playerAnswerSubmitted', { 
      detail: answerData
    }));
    
    // Also store in sessionStorage for more reliable retrieval
    try {
      sessionStorage.setItem(`playerAnswer_${playerName}_${questionCounter}`, JSON.stringify(answerData));
    } catch (error) {
      console.error('Error storing in sessionStorage:', error);
    }
    
    // Also dispatch a backup event slightly later
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('playerAnswerSubmitted', { 
        detail: {
          ...answerData,
          timestamp: Date.now(),
          isBackup: true
        }
      }));
      
      // Dispatch another event on a different channel
      window.dispatchEvent(new CustomEvent('triviaAnswerSubmitted', { 
        detail: {
          ...answerData,
          timestamp: Date.now(),
          alternateChannel: true
        }
      }));
    }, 300);
    
    console.log('Player answer submitted successfully:', answerData);
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
  // First check sessionStorage (faster)
  if (sessionStorage.getItem(`answerSubmitted_${questionCounter}`) === 'true') {
    return true;
  }
  
  // Try localStorage next
  const answerKey = `playerAnswer_${playerName}_${questionCounter}`;
  const localAnswer = localStorage.getItem(answerKey);
  
  // If not in localStorage, try sessionStorage
  if (!localAnswer) {
    const sessionAnswer = sessionStorage.getItem(answerKey);
    return sessionAnswer !== null;
  }
  
  return true;
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
    // Try sessionStorage first (more reliable during session)
    let answerJson = sessionStorage.getItem(answerKey);
    
    // If not in sessionStorage, try localStorage
    if (!answerJson) {
      answerJson = localStorage.getItem(answerKey);
    }
    
    if (answerJson) {
      const answerData = JSON.parse(answerJson);
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
 * Clear all player answers for the current game session
 * Useful for testing or when starting a new game
 */
export const clearAllPlayerAnswers = (playerName: string): void => {
  try {
    // Find all answer keys for this player
    const keysToRemove: string[] = [];
    
    // Check in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`playerAnswer_${playerName}_`)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all found keys from localStorage
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Also check in sessionStorage
    const sessionKeysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(`playerAnswer_${playerName}_`)) {
        sessionKeysToRemove.push(key);
      }
    }
    
    // Also clear any answerSubmitted flags
    const submittedFlagsToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('answerSubmitted_')) {
        submittedFlagsToRemove.push(key);
      }
    }
    
    // Remove all found keys from sessionStorage
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    submittedFlagsToRemove.forEach(key => sessionStorage.removeItem(key));
    
    console.log(`Cleared ${keysToRemove.length + sessionKeysToRemove.length} answers for player: ${playerName}`);
  } catch (error) {
    console.error('Error clearing player answers:', error);
  }
};

/**
 * Force sync player with game state
 */
export const forcePlayerGameSync = (playerName: string, gameId: string): void => {
  try {
    // First clear existing game state to avoid conflicts
    localStorage.removeItem('gameState');
    sessionStorage.removeItem('gameState');
    
    // Create urgent sync request
    const syncRequest = {
      playerName,
      gameId,
      timestamp: Date.now(),
      urgent: true,
      forceSync: true,
      clientId: getClientId()
    };
    
    // Dispatch multiple events to increase chances of sync
    window.dispatchEvent(new CustomEvent('playerNeedsSync', { detail: syncRequest }));
    window.dispatchEvent(new CustomEvent('playerBroadcastNeedsSync', { detail: syncRequest }));
    window.dispatchEvent(new CustomEvent('playerForceSyncRequest', { detail: syncRequest }));
    window.dispatchEvent(new CustomEvent('gameStateRequest', { detail: syncRequest }));
    
    // Also try to broadcast directly to any displays
    try {
      window.dispatchEvent(new CustomEvent('displayForceSyncRequest', { 
        detail: {
          ...syncRequest,
          broadcastChannel: 'all_displays',
          priority: 'urgent'
        }
      }));
      
      // Also try general broadcast
      window.dispatchEvent(new CustomEvent('globalSyncRequest', { 
        detail: {
          ...syncRequest,
          global: true
        }
      }));
      
      // Store that we requested a sync
      localStorage.setItem('lastSyncRequest', JSON.stringify({
        timestamp: Date.now(),
        playerName,
        gameId
      }));
      
      // Also store in sessionStorage
      sessionStorage.setItem('lastSyncRequest', JSON.stringify({
        timestamp: Date.now(),
        playerName,
        gameId
      }));
    } catch (error) {
      console.error('Error creating broadcast event:', error);
    }
    
    console.log('Force sync requested for player:', playerName);
    
    // Try again with slight delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
        detail: {
          ...syncRequest,
          timestamp: Date.now(),
          backup: true
        }
      }));
    }, 500);
  } catch (error) {
    console.error('Error forcing player sync:', error);
  }
};

/**
 * Generate or get a unique client ID for this browser
 */
export const getClientId = (): string => {
  let clientId = localStorage.getItem('trivia_client_id');
  
  if (!clientId) {
    // Generate a simple UUID-like string
    clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('trivia_client_id', clientId);
  }
  
  return clientId;
};

/**
 * Verify the game code and ensure we're connected to the right display
 */
export const verifyGameConnection = (playerName: string, gameId: string): boolean => {
  try {
    // Store the current verified connection
    const clientId = getClientId();
    const connectionData = {
      playerName,
      gameId,
      clientId,
      timestamp: Date.now()
    };
    
    localStorage.setItem('verifiedGameConnection', JSON.stringify(connectionData));
    sessionStorage.setItem('verifiedGameConnection', JSON.stringify(connectionData));
    
    // Broadcast that this player is verified
    window.dispatchEvent(new CustomEvent('playerVerifiedConnection', {
      detail: {
        ...connectionData,
        verified: true
      }
    }));
    
    // Also broadcast on alternate channel
    window.dispatchEvent(new CustomEvent('triviaPlayerVerified', {
      detail: {
        ...connectionData,
        alternate: true
      }
    }));
    
    return true;
  } catch (error) {
    console.error('Error verifying game connection:', error);
    return false;
  }
};

/**
 * Store player game state across sessions
 */
export const storePlayerGameState = (playerState: any): boolean => {
  try {
    if (!playerState) return false;
    
    // Generate a timestamp if not present
    const stateWithTimestamp = {
      ...playerState,
      timestamp: playerState.timestamp || Date.now()
    };
    
    // Store in both localStorage and sessionStorage for reliability
    localStorage.setItem('playerGameState', JSON.stringify(stateWithTimestamp));
    sessionStorage.setItem('playerGameState', JSON.stringify(stateWithTimestamp));
    
    return true;
  } catch (error) {
    console.error('Error storing player game state:', error);
    return false;
  }
};

/**
 * Get stored player game state
 */
export const getPlayerGameState = (): any => {
  try {
    // Try sessionStorage first as it's more reliable during the same session
    const sessionState = sessionStorage.getItem('playerGameState');
    if (sessionState) {
      return JSON.parse(sessionState);
    }
    
    // Fall back to localStorage
    const localState = localStorage.getItem('playerGameState');
    if (localState) {
      return JSON.parse(localState);
    }
    
    return null;
  } catch (error) {
    console.error('Error getting player game state:', error);
    return null;
  }
};

/**
 * Check if player is connected to a display
 */
export const isConnectedToDisplay = (gameId: string): boolean => {
  try {
    // Check connection status in session storage first
    const sessionConnection = sessionStorage.getItem('playerConnection');
    if (sessionConnection) {
      try {
        const connectionData = JSON.parse(sessionConnection);
        if (connectionData.gameId === gameId && connectionData.connected) {
          const age = Date.now() - (connectionData.timestamp || 0);
          if (age < 30000) { // Less than 30 seconds old
            return true;
          }
        }
      } catch (error) {
        console.error('Error parsing connection data:', error);
      }
    }
    
    // Check for recent game state
    const sessionState = sessionStorage.getItem('gameState');
    if (sessionState) {
      try {
        const stateData = JSON.parse(sessionState);
        const age = Date.now() - (stateData.timestamp || stateData.lastReceived || 0);
        if (age < 20000) { // Less than 20 seconds old
          return true;
        }
      } catch (error) {
        console.error('Error parsing game state:', error);
      }
    }
    
    // As a fallback, check localStorage
    const localState = localStorage.getItem('gameState');
    if (localState) {
      try {
        const stateData = JSON.parse(localState);
        const age = Date.now() - (stateData.timestamp || stateData.lastReceived || 0);
        if (age < 20000) { // Less than 20 seconds old
          return true;
        }
      } catch (error) {
        console.error('Error parsing local game state:', error);
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking display connection:', error);
    return false;
  }
};
