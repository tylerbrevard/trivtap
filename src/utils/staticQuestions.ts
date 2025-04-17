import { saveQuestionsToLocalStorage, getQuestionsFromLocalStorage, getAllAvailableQuestions, convertQuestionsToCSV } from './importUtils';
import { supabase } from "@/integrations/supabase/client";

// Collection of static trivia questions to reduce database usage
export interface StaticQuestion {
  id: string;
  text: string;
  options: string[];
  correctAnswer: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeLimit?: number;
}

// Base set of static questions that will always be available
export const baseStaticQuestions: StaticQuestion[] = [
  {
    id: "q1",
    text: "What is the capital of France?",
    options: ["London", "Berlin", "Paris", "Madrid"],
    correctAnswer: "Paris",
    category: "Geography",
    difficulty: "easy"
  },
  {
    id: "q2",
    text: "Who painted the Mona Lisa?",
    options: ["Vincent Van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"],
    correctAnswer: "Leonardo da Vinci",
    category: "Art",
    difficulty: "easy"
  },
  {
    id: "q3",
    text: "Which planet is known as the Red Planet?",
    options: ["Venus", "Jupiter", "Mars", "Saturn"],
    correctAnswer: "Mars",
    category: "Science",
    difficulty: "easy"
  },
  {
    id: "q4",
    text: "In which year did World War II end?",
    options: ["1943", "1945", "1947", "1950"],
    correctAnswer: "1945",
    category: "History",
    difficulty: "easy"
  },
  {
    id: "q5",
    text: "What is the largest ocean on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
    correctAnswer: "Pacific Ocean",
    category: "Geography",
    difficulty: "easy"
  },
  {
    id: "q6",
    text: "Who wrote 'Romeo and Juliet'?",
    options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
    correctAnswer: "William Shakespeare",
    category: "Literature",
    difficulty: "easy"
  },
  {
    id: "q7",
    text: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctAnswer: "Au",
    category: "Science",
    difficulty: "medium"
  },
  {
    id: "q8",
    text: "Which country won the 2018 FIFA World Cup?",
    options: ["Brazil", "Germany", "France", "Argentina"],
    correctAnswer: "France",
    category: "Sports",
    difficulty: "medium"
  },
  {
    id: "q9",
    text: "What is the square root of 144?",
    options: ["12", "14", "18", "24"],
    correctAnswer: "12",
    category: "Mathematics",
    difficulty: "medium"
  },
  {
    id: "q10",
    text: "Who discovered penicillin?",
    options: ["Marie Curie", "Alexander Fleming", "Louis Pasteur", "Joseph Lister"],
    correctAnswer: "Alexander Fleming",
    category: "Science",
    difficulty: "medium"
  },
  {
    id: "q11",
    text: "Which element has the chemical symbol 'O'?",
    options: ["Gold", "Oxygen", "Osmium", "Oganesson"],
    correctAnswer: "Oxygen",
    category: "Science",
    difficulty: "easy"
  },
  {
    id: "q12",
    text: "In what year was the first iPhone released?",
    options: ["2005", "2007", "2009", "2010"],
    correctAnswer: "2007",
    category: "Technology",
    difficulty: "medium"
  },
  {
    id: "q13",
    text: "What is the capital of Japan?",
    options: ["Beijing", "Seoul", "Tokyo", "Bangkok"],
    correctAnswer: "Tokyo",
    category: "Geography",
    difficulty: "easy"
  },
  {
    id: "q14",
    text: "Who was the first person to step on the moon?",
    options: ["Buzz Aldrin", "Yuri Gagarin", "Neil Armstrong", "John Glenn"],
    correctAnswer: "Neil Armstrong",
    category: "Space",
    difficulty: "easy"
  },
  {
    id: "q15",
    text: "What is the largest mammal in the world?",
    options: ["Elephant", "Blue Whale", "Giraffe", "Polar Bear"],
    correctAnswer: "Blue Whale",
    category: "Animals",
    difficulty: "easy"
  }
];

// Initialize local storage with base questions if it doesn't exist yet
const initializeStorage = () => {
  try {
    if (!localStorage.getItem('trivia_questions')) {
      // Initialize storage with base questions
      saveQuestionsToLocalStorage(baseStaticQuestions);
      console.log("Initialized local storage with base questions");
    }
  } catch (error) {
    console.error("Error initializing local storage:", error);
  }
};

// Call initialization on module load
initializeStorage();

// Get the current user ID if logged in
export const getCurrentUserId = async (): Promise<string | undefined> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user?.id;
  } catch (error) {
    console.error("Error getting current user:", error);
    return undefined;
  }
};

// Check for the presence of imported questions in localStorage
const hasImportedQuestions = (): boolean => {
  try {
    // Check for the presence of imported_questions key
    const importedQuestionsStr = localStorage.getItem('imported_questions');
    if (importedQuestionsStr) {
      const importedQuestions = JSON.parse(importedQuestionsStr);
      return Array.isArray(importedQuestions) && importedQuestions.length > 0;
    }
    return false;
  } catch (error) {
    console.error("Error checking for imported questions:", error);
    return false;
  }
};

// Get imported questions from localStorage
const getImportedQuestions = (): StaticQuestion[] => {
  try {
    const importedQuestionsStr = localStorage.getItem('imported_questions');
    if (importedQuestionsStr) {
      return JSON.parse(importedQuestionsStr) || [];
    }
    return [];
  } catch (error) {
    console.error("Error getting imported questions:", error);
    return [];
  }
};

// Get all static questions, combining base questions with user-imported ones
export const getStaticQuestions = async (): Promise<StaticQuestion[]> => {
  try {
    const userId = await getCurrentUserId();
    console.log(`Getting questions for user: ${userId || 'anonymous'}`);
    
    // Check for imported questions first
    const hasImported = hasImportedQuestions();
    console.log(`Has imported questions: ${hasImported}`);
    
    // Get stored user questions from localStorage
    const storedUserQuestions = getQuestionsFromLocalStorage(userId);
    console.log(`Stored user questions count: ${storedUserQuestions.length}`);
    
    // Get stored imported questions
    const importedQuestions = getImportedQuestions();
    console.log(`Imported questions count: ${importedQuestions.length}`);
    
    // Get all available questions (e.g., from external sources)
    const availableQuestions = getAllAvailableQuestions();
    console.log(`Available questions from other sources: ${availableQuestions.length}`);
    
    // Check the default bucket for all available questions
    const defaultBucketStr = localStorage.getItem('trivia-buckets');
    let defaultBucket = null;
    
    if (defaultBucketStr) {
      const buckets = JSON.parse(defaultBucketStr);
      defaultBucket = buckets.find(b => b.isDefault);
    }
    
    // Start with base questions
    let allQuestions = [...baseStaticQuestions];
    console.log(`Starting with ${allQuestions.length} base questions`);
    
    // Add imported questions if available
    if (hasImported) {
      // Add imported questions, avoiding duplicates by ID
      const existingIds = new Set(allQuestions.map(q => q.id));
      
      let addedCount = 0;
      importedQuestions.forEach(question => {
        if (!existingIds.has(question.id)) {
          allQuestions.push(question);
          existingIds.add(question.id);
          addedCount++;
        }
      });
      console.log(`Added ${addedCount} imported questions (avoiding duplicates)`);
    }
    
    // Add available questions, avoiding duplicates
    if (availableQuestions.length > 0) {
      const allExistingIds = new Set(allQuestions.map(q => q.id));
      let addedCount = 0;
      
      availableQuestions.forEach(question => {
        if (!allExistingIds.has(question.id)) {
          allQuestions.push(question);
          allExistingIds.add(question.id);
          addedCount++;
        }
      });
      console.log(`Added ${addedCount} available questions (avoiding duplicates)`);
    }
    
    // Add user-specific questions, avoiding duplicates
    const allExistingIds = new Set(allQuestions.map(q => q.id));
    let addedUserCount = 0;
    storedUserQuestions.forEach(question => {
      if (!allExistingIds.has(question.id)) {
        allQuestions.push(question);
        allExistingIds.add(question.id);
        addedUserCount++;
      }
    });
    console.log(`Added ${addedUserCount} user-specific questions (avoiding duplicates)`);
    
    console.log(`Total questions after combining: ${allQuestions.length}`);
    
    // Update the default bucket question count if needed
    if (defaultBucket && defaultBucket.questionCount !== allQuestions.length) {
      updateDefaultBucketCount(allQuestions.length);
    }
    
    return allQuestions;
  } catch (error) {
    console.error("Error getting static questions:", error);
    return baseStaticQuestions; // Fallback to base questions on error
  }
};

// Function to update default bucket question count
const updateDefaultBucketCount = (count: number) => {
  try {
    const bucketsStr = localStorage.getItem('trivia-buckets');
    if (bucketsStr) {
      const buckets = JSON.parse(bucketsStr);
      const defaultBucketIndex = buckets.findIndex(b => b.isDefault);
      
      if (defaultBucketIndex >= 0) {
        buckets[defaultBucketIndex].questionCount = count;
        localStorage.setItem('trivia-buckets', JSON.stringify(buckets));
        console.log(`Updated default bucket question count to ${count}`);
      }
    }
  } catch (error) {
    console.error("Error updating default bucket count:", error);
  }
};

// Function to get questions by category
export const getQuestionsByCategory = async (category: string): Promise<StaticQuestion[]> => {
  const allQuestions = await getStaticQuestions();
  return allQuestions.filter(q => q.category.toLowerCase() === category.toLowerCase());
};

// Function to get questions by difficulty
export const getQuestionsByDifficulty = async (difficulty: 'easy' | 'medium' | 'hard'): Promise<StaticQuestion[]> => {
  const allQuestions = await getStaticQuestions();
  return allQuestions.filter(q => q.difficulty === difficulty);
};

// Function to get random questions
export const getRandomQuestions = async (count: number = 10): Promise<StaticQuestion[]> => {
  const allQuestions = await getStaticQuestions();
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Function to format questions for game use
export const formatQuestionsForGame = (questions: StaticQuestion[], defaultTimeLimit: number = 20) => {
  return questions.map(question => ({
    ...question,
    timeLimit: question.timeLimit || defaultTimeLimit
  }));
};

// Function to add imported questions to the collection
export const addImportedQuestionsToCollection = async (newQuestions: any[]): Promise<string> => {
  try {
    console.log(`Adding ${newQuestions.length} questions to the collection`);
    
    // Generate new IDs for the imported questions
    const importedQuestions = newQuestions.map((question, index) => {
      // Create a new StaticQuestion object from the imported data
      const newQuestion: StaticQuestion = {
        id: `imported_${Date.now()}_${index}`,
        text: question.question || question.text,
        options: question.options,
        correctAnswer: question.correctAnswer,
        category: question.category,
        difficulty: (question.difficulty?.toLowerCase() || 'medium') as 'easy' | 'medium' | 'hard',
        timeLimit: question.timeLimit
      };
      
      return newQuestion;
    });
    
    // Save to imported_questions in localStorage for admin usage
    localStorage.setItem('imported_questions', JSON.stringify(importedQuestions));
    console.log(`Saved ${importedQuestions.length} questions to imported_questions`);
    
    // Update default bucket question count
    const allQuestions = await getStaticQuestions();
    updateDefaultBucketCount(allQuestions.length);
    
    // Return success message with number of questions added
    return `Successfully added ${importedQuestions.length} questions to the collection.`;
  } catch (error) {
    console.error('Error adding imported questions:', error);
    throw new Error('Failed to add imported questions to collection.');
  }
};

// Function to export all questions to JSON format
export const exportQuestionsToJson = async (): Promise<string> => {
  try {
    const allQuestions = await getStaticQuestions();
    return JSON.stringify(allQuestions, null, 2);
  } catch (error) {
    console.error('Error exporting questions to JSON:', error);
    throw new Error('Failed to export questions to JSON.');
  }
};

// Function to export all questions to CSV format
export const exportQuestionsToCSV = async (): Promise<string> => {
  try {
    const allQuestions = await getStaticQuestions();
    return convertQuestionsToCSV(allQuestions);
  } catch (error) {
    console.error('Error exporting questions to CSV:', error);
    throw new Error('Failed to export questions to CSV.');
  }
};

// Function to remove a question from the collection
export const removeQuestionFromCollection = async (questionId: string): Promise<boolean> => {
  try {
    // Get current user ID if available
    const userId = await getCurrentUserId();
    
    // Get the stored questions from localStorage
    const existingDataString = localStorage.getItem('trivia_questions');
    if (!existingDataString) {
      return false;
    }
    
    const existingData = JSON.parse(existingDataString);
    
    // Determine which collection to update (user-specific or default)
    const storageKey = userId || 'default';
    
    // Skip if collection doesn't exist
    if (!existingData[storageKey]) {
      return false;
    }
    
    // Find and remove the question with the matching ID
    const questions = existingData[storageKey];
    const initialLength = questions.length;
    existingData[storageKey] = questions.filter(q => q.id !== questionId);
    
    // If no question was removed, return false
    if (initialLength === existingData[storageKey].length) {
      // The question might be in the base questions, which can't be removed
      const baseIds = baseStaticQuestions.map(q => q.id);
      if (baseIds.includes(questionId)) {
        console.warn(`Cannot remove base question with ID ${questionId}`);
        throw new Error("Cannot remove questions from the default set. These questions are built into the system.");
      }
      return false;
    }
    
    // Save updated questions back to localStorage
    localStorage.setItem('trivia_questions', JSON.stringify(existingData));
    
    // Update default bucket question count after removing
    getStaticQuestions(); // This will trigger the count update
    
    console.log(`Successfully removed question with ID ${questionId}`);
    return true;
  } catch (error) {
    console.error('Error removing question from collection:', error);
    throw error;
  }
};

// Function to clear all imported questions but keep base ones
export const clearImportedQuestions = async (): Promise<boolean> => {
  try {
    // Clear imported questions
    localStorage.removeItem('imported_questions');
    console.log("Cleared imported_questions from localStorage");
    
    // Update default bucket question count
    const allQuestions = await getStaticQuestions();
    updateDefaultBucketCount(allQuestions.length);
    
    console.log("Successfully cleared all imported questions");
    return true;
  } catch (error) {
    console.error('Error clearing imported questions:', error);
    return false;
  }
};

// Function to restore all default questions
export const restoreDefaultQuestions = async (): Promise<boolean> => {
  try {
    // Get original imported questions from backup if available
    const originalQuestionsStr = localStorage.getItem('original_imported_questions');
    if (originalQuestionsStr) {
      localStorage.setItem('imported_questions', originalQuestionsStr);
      console.log("Restored original imported questions from backup");
    } else {
      console.log("No backup of original imported questions found");
    }
    
    // Update default bucket question count
    const allQuestions = await getStaticQuestions();
    updateDefaultBucketCount(allQuestions.length);
    
    console.log("Successfully restored default questions");
    return true;
  } catch (error) {
    console.error('Error restoring default questions:', error);
    return false;
  }
};

// Function to backup current imported questions
export const backupImportedQuestions = (): boolean => {
  try {
    const importedQuestionsStr = localStorage.getItem('imported_questions');
    if (importedQuestionsStr) {
      localStorage.setItem('original_imported_questions', importedQuestionsStr);
      console.log("Successfully backed up imported questions");
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error backing up imported questions:', error);
    return false;
  }
};
