
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

export const staticQuestions: StaticQuestion[] = [
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

// Function to get questions by category
export const getQuestionsByCategory = (category: string): StaticQuestion[] => {
  return staticQuestions.filter(q => q.category.toLowerCase() === category.toLowerCase());
};

// Function to get questions by difficulty
export const getQuestionsByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): StaticQuestion[] => {
  return staticQuestions.filter(q => q.difficulty === difficulty);
};

// Function to get random questions
export const getRandomQuestions = (count: number = 10): StaticQuestion[] => {
  const shuffled = [...staticQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

// Function to format questions for game use
export const formatQuestionsForGame = (questions: StaticQuestion[], defaultTimeLimit: number = 20) => {
  return questions.map(question => ({
    ...question,
    timeLimit: question.timeLimit || defaultTimeLimit
  }));
};

// Function to add imported questions to the static collection
export const addImportedQuestionsToCollection = (newQuestions: any[]): string => {
  try {
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
    
    // Add the new questions to the static collection
    staticQuestions.push(...importedQuestions);
    
    // Return success message with number of questions added
    return `Successfully added ${importedQuestions.length} questions to the collection.`;
  } catch (error) {
    console.error('Error adding imported questions:', error);
    throw new Error('Failed to add imported questions to collection.');
  }
};

// Function to export all questions to JSON format
export const exportQuestionsToJson = (): string => {
  try {
    return JSON.stringify(staticQuestions, null, 2);
  } catch (error) {
    console.error('Error exporting questions to JSON:', error);
    throw new Error('Failed to export questions to JSON.');
  }
};
