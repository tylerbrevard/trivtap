
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
    }, 500);
    
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
  // Try localStorage first
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
    // Try localStorage first
    let answerJson = localStorage.getItem(answerKey);
    
    // If not in localStorage, try sessionStorage
    if (!answerJson) {
      answerJson = sessionStorage.getItem(answerKey);
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
    
    // Remove all found keys from sessionStorage
    sessionKeysToRemove.forEach(key => sessionStorage.removeItem(key));
    
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
      forceSync: true
    };
    
    // Dispatch multiple events to increase chances of sync
    window.dispatchEvent(new CustomEvent('playerNeedsSync', { detail: syncRequest }));
    window.dispatchEvent(new CustomEvent('playerBroadcastNeedsSync', { detail: syncRequest }));
    window.dispatchEvent(new CustomEvent('playerForceSyncRequest', { detail: syncRequest }));
    
    // Also try to broadcast directly to any displays
    try {
      window.dispatchEvent(new CustomEvent('displayForceSyncRequest', { 
        detail: {
          ...syncRequest,
          broadcastChannel: 'all_displays',
          priority: 'urgent'
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
  } catch (error) {
    console.error('Error forcing player sync:', error);
  }
};

/**
 * Verify the game code and ensure we're connected to the right display
 */
export const verifyGameConnection = (playerName: string, gameId: string): boolean => {
  try {
    // Store the current verified connection
    localStorage.setItem('verifiedGameConnection', JSON.stringify({
      playerName,
      gameId,
      timestamp: Date.now()
    }));
    
    // Also store in sessionStorage for more reliable access
    sessionStorage.setItem('verifiedGameConnection', JSON.stringify({
      playerName,
      gameId,
      timestamp: Date.now()
    }));
    
    // Broadcast that this player is verified
    window.dispatchEvent(new CustomEvent('playerVerifiedConnection', {
      detail: {
        playerName,
        gameId,
        timestamp: Date.now(),
        verified: true
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
    
    // Store in both localStorage and sessionStorage for reliability
    localStorage.setItem('playerGameState', JSON.stringify({
      ...playerState,
      timestamp: Date.now()
    }));
    
    sessionStorage.setItem('playerGameState', JSON.stringify({
      ...playerState,
      timestamp: Date.now()
    }));
    
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
