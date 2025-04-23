
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
