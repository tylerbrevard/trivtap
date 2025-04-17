
import { supabase } from "@/integrations/supabase/client";

// Define question type
export interface ImportQuestion {
  question: string;
  category: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Function to fetch categories from database
export const fetchCategories = async () => {
  console.log('Fetching categories from database');
  const { data, error } = await supabase
    .from('categories')
    .select('id, name');
    
  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
  
  console.log(`Successfully fetched ${data?.length || 0} categories`);
  return data || [];
};

// Function to get or create a category
export const getOrCreateCategory = async (categoryName: string) => {
  if (!categoryName || categoryName.trim() === '') {
    console.error('Invalid category name provided');
    throw new Error('Category name cannot be empty');
  }
  
  const trimmedCategoryName = categoryName.trim();
  console.log(`Looking for category: "${trimmedCategoryName}"`);
  
  // Check if category already exists
  const { data: existingCategories, error: fetchError } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', trimmedCategoryName)
    .limit(1);
    
  if (fetchError) {
    console.error('Error checking for existing category:', fetchError);
    throw new Error(`Failed to check for existing category: ${fetchError.message}`);
  }
  
  if (existingCategories && existingCategories.length > 0) {
    console.log(`Found existing category: "${trimmedCategoryName}" with id: ${existingCategories[0].id}`);
    return existingCategories[0].id;
  }
  
  // Create new category
  console.log(`Creating new category: "${trimmedCategoryName}"`);
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: trimmedCategoryName })
    .select('id')
    .single();
    
  if (error) {
    console.error('Error creating category:', error);
    throw new Error(`Failed to create category: ${error.message}`);
  }
  
  if (!data || !data.id) {
    console.error('No data returned from category creation');
    throw new Error('Failed to create category: No data returned');
  }
  
  console.log(`Created new category: "${trimmedCategoryName}" with id: ${data.id}`);
  return data.id;
};

// Function to get or create default bucket
export const getDefaultBucket = async () => {
  console.log("Looking for default bucket");
  
  try {
    // Check if default bucket exists
    const { data, error } = await supabase
      .from('buckets')
      .select('id, name')
      .eq('is_default', true)
      .maybeSingle();
      
    if (error) {
      console.error('Error checking for default bucket:', error);
      throw new Error(`Failed to check for default bucket: ${error.message}`);
    }
    
    if (data) {
      console.log(`Found default bucket: ${data.name} with id: ${data.id}`);
      return data;
    }
    
    // Create default bucket if it doesn't exist
    console.log("Creating default bucket");
    const { data: newBucket, error: createError } = await supabase
      .from('buckets')
      .insert({
        name: 'Default Bucket',
        is_default: true,
        description: 'Default bucket for imported questions'
      })
      .select('id, name')
      .single();
      
    if (createError) {
      console.error('Error creating default bucket:', createError);
      throw new Error(`Failed to create default bucket: ${createError.message}`);
    }
    
    if (!newBucket || !newBucket.id) {
      console.error('No data returned from bucket creation');
      throw new Error('Failed to create default bucket: No data returned');
    }
    
    console.log(`Created default bucket with id: ${newBucket.id}`);
    return newBucket;
  } catch (error) {
    console.error('Error in getDefaultBucket:', error);
    throw error;
  }
};

// Function to associate questions with a bucket
export const associateQuestionsWithBucket = async (questionIds: string[], bucketId: string) => {
  if (!questionIds.length || !bucketId) {
    console.log('No questions or bucket ID provided for association');
    return;
  }
  
  console.log(`Associating ${questionIds.length} questions with bucket ${bucketId}`);
  
  try {
    // First, check if this is a local default bucket or a Supabase bucket
    if (bucketId === 'default') {
      // For default bucket, we'll add these to localStorage
      const existingDataString = localStorage.getItem('trivia_questions');
      let existingData: Record<string, any[]> = {};
      
      if (existingDataString) {
        existingData = JSON.parse(existingDataString);
      }
      
      // Initialize the default array if needed
      if (!existingData['default']) {
        existingData['default'] = [];
      }
      
      // Import the getStaticQuestions function directly from staticQuestions to avoid circular dependency
      const { getStaticQuestions } = await import('./staticQuestions');
      
      // Get the questions to add
      const allQuestions = await getStaticQuestions();
      const questionsToAdd = allQuestions.filter(q => questionIds.includes(q.id));
      
      // Add to default, avoiding duplicates
      const existingIds = new Set(existingData['default'].map((q: any) => q.id));
      const newQuestions = questionsToAdd.filter(q => !existingIds.has(q.id));
      
      existingData['default'] = [...existingData['default'], ...newQuestions];
      
      // Save back to localStorage
      localStorage.setItem('trivia_questions', JSON.stringify(existingData));
      console.log(`Added ${newQuestions.length} questions to default bucket in localStorage`);
      
      // Update bucket counts
      const updatedBucketsStr = localStorage.getItem('trivia-buckets');
      if (updatedBucketsStr) {
        const updatedBuckets = JSON.parse(updatedBucketsStr);
        const defaultBucketIndex = updatedBuckets.findIndex((b: any) => b.isDefault);
        
        if (defaultBucketIndex >= 0) {
          updatedBuckets[defaultBucketIndex].questionCount = existingData['default'].length;
          localStorage.setItem('trivia-buckets', JSON.stringify(updatedBuckets));
          console.log(`Updated default bucket count to ${existingData['default'].length}`);
        }
      }
    } else {
      // For Supabase buckets, continue with original logic
      const bucketQuestions = questionIds.map(questionId => ({
        bucket_id: bucketId,
        question_id: questionId
      }));
      
      const { error } = await supabase
        .from('bucket_questions')
        .insert(bucketQuestions);
        
      if (error) {
        console.error('Error associating questions with bucket:', error);
        throw new Error(`Failed to associate questions with bucket: ${error.message}`);
      }
      
      console.log(`Successfully associated ${questionIds.length} questions with bucket ${bucketId}`);
    }
  } catch (error) {
    console.error('Error in associateQuestionsWithBucket:', error);
    throw error;
  }
};

// Function to convert questions to CSV format
export const convertQuestionsToCSV = (questions: any[]): string => {
  try {
    const csvRows = [];
    
    // Add header row
    csvRows.push('question,category,option1,option2,option3,option4,correctAnswer,difficulty');
    
    // Add data rows
    questions.forEach(question => {
      const questionText = question.question || question.text;
      const options = [...question.options];
      
      // Fill options array with empty strings if not enough options (ensuring 4 options)
      while (options.length < 4) {
        options.push('');
      }
      
      // Escape commas in all fields
      const escapedQuestion = questionText.replace(/,/g, '\\,');
      const escapedCategory = question.category.replace(/,/g, '\\,');
      const escapedOptions = options.map((opt: string) => opt.replace(/,/g, '\\,'));
      const escapedCorrectAnswer = question.correctAnswer.replace(/,/g, '\\,');
      
      // Create and add the CSV row
      csvRows.push(
        `${escapedQuestion},${escapedCategory},${escapedOptions[0]},${escapedOptions[1]},${escapedOptions[2]},${escapedOptions[3]},${escapedCorrectAnswer},${question.difficulty}`
      );
    });
    
    return csvRows.join('\n');
  } catch (error) {
    console.error('Error converting questions to CSV:', error);
    throw new Error('Failed to convert questions to CSV format');
  }
};

// Function to save questions to localStorage, tied to user ID if authenticated
export const saveQuestionsToLocalStorage = (questions: any[], userId?: string) => {
  try {
    // Get existing questions from localStorage
    const existingDataString = localStorage.getItem('trivia_questions');
    let existingData: Record<string, any[]> = {};
    
    if (existingDataString) {
      existingData = JSON.parse(existingDataString);
    }
    
    // Key to store questions under: either user ID or 'default' for unauthenticated users
    const storageKey = userId || 'default';
    
    // Initialize the array for this key if it doesn't exist
    if (!existingData[storageKey]) {
      existingData[storageKey] = [];
    }
    
    // Add the new questions to the existing array
    existingData[storageKey] = [...existingData[storageKey], ...questions];
    
    // Save back to localStorage
    localStorage.setItem('trivia_questions', JSON.stringify(existingData));
    
    console.log(`Saved ${questions.length} questions to localStorage under key: ${storageKey}`);
    return true;
  } catch (error) {
    console.error('Error saving questions to localStorage:', error);
    return false;
  }
};

// Function to get questions from localStorage
export const getQuestionsFromLocalStorage = (userId?: string) => {
  try {
    const existingDataString = localStorage.getItem('trivia_questions');
    if (!existingDataString) {
      return [];
    }
    
    const existingData = JSON.parse(existingDataString);
    const storageKey = userId || 'default';
    
    // Return the questions for this user, or an empty array if none exist
    return existingData[storageKey] || [];
  } catch (error) {
    console.error('Error retrieving questions from localStorage:', error);
    return [];
  }
};

// Function to get all available questions (including default and user-specific)
export const getAllAvailableQuestions = (userId?: string) => {
  try {
    const existingDataString = localStorage.getItem('trivia_questions');
    if (!existingDataString) {
      return [];
    }
    
    const existingData = JSON.parse(existingDataString);
    
    // Always include default questions
    let allQuestions = [...(existingData['default'] || [])];
    
    // Add user-specific questions if user is logged in
    if (userId && existingData[userId]) {
      allQuestions = [...allQuestions, ...existingData[userId]];
    }
    
    return allQuestions;
  } catch (error) {
    console.error('Error retrieving all available questions:', error);
    return [];
  }
};
