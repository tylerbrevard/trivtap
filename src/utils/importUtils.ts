
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
  const { data, error } = await supabase
    .from('categories')
    .select('id, name');
    
  if (error) {
    console.error('Error fetching categories:', error);
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }
  
  return data || [];
};

// Function to get or create a category
export const getOrCreateCategory = async (categoryName: string) => {
  console.log(`Looking for category: ${categoryName}`);
  
  // Check if category already exists
  const { data: existingCategories, error: fetchError } = await supabase
    .from('categories')
    .select('id')
    .ilike('name', categoryName)
    .limit(1);
    
  if (fetchError) {
    console.error('Error checking for existing category:', fetchError);
    throw new Error(`Failed to check for existing category: ${fetchError.message}`);
  }
  
  if (existingCategories && existingCategories.length > 0) {
    console.log(`Found existing category: ${categoryName} with id: ${existingCategories[0].id}`);
    return existingCategories[0].id;
  }
  
  // Create new category
  console.log(`Creating new category: ${categoryName}`);
  const { data, error } = await supabase
    .from('categories')
    .insert({ name: categoryName })
    .select('id')
    .single();
    
  if (error) {
    console.error('Error creating category:', error);
    throw new Error(`Failed to create category: ${error.message}`);
  }
  
  console.log(`Created new category: ${categoryName} with id: ${data.id}`);
  return data.id;
};

// Function to get or create default bucket
export const getDefaultBucket = async () => {
  console.log("Looking for default bucket");
  
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
  
  console.log(`Created default bucket with id: ${newBucket.id}`);
  return newBucket;
};

// Function to associate questions with a bucket
export const associateQuestionsWithBucket = async (questionIds: string[], bucketId: string) => {
  if (!questionIds.length || !bucketId) return;
  
  console.log(`Associating ${questionIds.length} questions with bucket ${bucketId}`);
  
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
};
