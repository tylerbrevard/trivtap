
export const parseCSVData = (csvContent: string): any[] => {
  const lines = csvContent.trim().split('\n');
  const questions: any[] = [];
  
  console.log(`Parsing ${lines.length} lines of CSV data`);
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    
    if (parts.length < 7) {
      console.warn(`Line ${i + 1} does not have enough columns, skipping`);
      continue;
    }
    
    const [question, category, option1, option2, option3, option4, correctAnswer, difficulty = 'medium'] = parts;
    
    if (!question || !category || !correctAnswer) {
      console.warn(`Line ${i + 1} has missing required fields, skipping`);
      continue;
    }
    
    const options = [option1, option2, option3, option4].filter(Boolean);
    
    if (options.length < 2) {
      console.warn(`Line ${i + 1} has fewer than 2 options, skipping`);
      continue;
    }
    
    if (!options.includes(correctAnswer)) {
      console.warn(`Line ${i + 1} has a correct answer that is not in the options, skipping`);
      continue;
    }
    
    const validatedDifficulty = ['easy', 'medium', 'hard'].includes(difficulty.toLowerCase()) 
      ? difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'
      : 'medium';
    
    questions.push({
      question,
      category,
      options,
      correctAnswer,
      difficulty: validatedDifficulty
    });
  }
  
  console.log(`Successfully parsed ${questions.length} questions from CSV`);
  return questions;
};

export const parseJSONData = (jsonContent: string): any[] => {
  try {
    const parsedData = JSON.parse(jsonContent);
    
    if (!Array.isArray(parsedData)) {
      throw new Error('JSON data must be an array');
    }
    
    console.log(`Parsing ${parsedData.length} items from JSON data`);
    
    const validQuestions = parsedData.filter(item => {
      if (!item.question && !item.text) {
        console.warn('Skipping question with missing required fields');
        return false;
      }
      
      const options = Array.isArray(item.options) ? item.options : [];
      
      if (options.length < 2) {
        console.warn('Skipping question with fewer than 2 options');
        return false;
      }
      
      if (!options.includes(item.correctAnswer)) {
        console.warn('Skipping question with correct answer not in options');
        return false;
      }
      
      return true;
    });
    
    console.log(`Successfully parsed ${validQuestions.length} questions from JSON`);
    return validQuestions;
  } catch (error) {
    console.error('Error parsing JSON:', error);
    throw new Error('Failed to parse JSON data. Please check the format.');
  }
};
