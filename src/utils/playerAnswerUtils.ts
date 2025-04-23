
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
  const answerKey = `playerAnswer_${playerName}_${questionCounter}`;
  return localStorage.getItem(answerKey) !== null;
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
    const answerJson = localStorage.getItem(answerKey);
    
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
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`playerAnswer_${playerName}_`)) {
        keysToRemove.push(key);
      }
    }
    
    // Remove all found keys
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keysToRemove.length} answers for player: ${playerName}`);
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
    
    console.log('Force sync requested for player:', playerName);
  } catch (error) {
    console.error('Error forcing player sync:', error);
  }
};
