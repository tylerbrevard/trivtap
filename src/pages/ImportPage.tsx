
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Upload, AlertCircle, CheckCircle2, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, getOrCreateCategory, getDefaultBucket, associateQuestionsWithBucket, ImportQuestion } from "@/utils/importUtils";

const ImportPage = () => {
  const [selectedOption, setSelectedOption] = useState('csv');
  const [csvData, setCsvData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: boolean; message: string } | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const { toast } = useToast();
  
  // Fetch categories on component mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
        console.log("Loaded categories:", categoriesData);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        toast({
          title: "Error",
          description: "Failed to load categories.",
          variant: "destructive",
        });
      }
    };
    
    loadCategories();
  }, [toast]);
  
  // Function to parse CSV data
  const parseCSVData = (csvContent: string): ImportQuestion[] => {
    const lines = csvContent.trim().split('\n');
    const questions: ImportQuestion[] = [];
    
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
  
  // Function to parse JSON data
  const parseJSONData = (jsonContent: string): ImportQuestion[] => {
    try {
      const parsedData = JSON.parse(jsonContent);
      
      if (!Array.isArray(parsedData)) {
        throw new Error('JSON data must be an array');
      }
      
      console.log(`Parsing ${parsedData.length} items from JSON data`);
      
      const validQuestions = parsedData.filter(item => {
        if (!item.question || !item.category || !item.correctAnswer) {
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
  
  // Function to import questions to database
  const importQuestionsToDB = async (questions: ImportQuestion[]) => {
    let successCount = 0;
    let errorCount = 0;
    let newQuestionIds: string[] = [];
    
    try {
      console.log(`Starting import of ${questions.length} questions`);
      
      for (const question of questions) {
        try {
          // Get or create category
          console.log(`Processing question: ${question.question.substring(0, 30)}...`);
          console.log(`Getting category ID for: ${question.category}`);
          const categoryId = await getOrCreateCategory(question.category);
          console.log(`Using category ID: ${categoryId}`);
          
          // Insert question
          console.log(`Inserting question with category ID: ${categoryId}`);
          const { data, error } = await supabase
            .from('questions')
            .insert({
              text: question.question,
              category_id: categoryId,
              options: question.options,
              correct_answer: question.correctAnswer,
              difficulty: question.difficulty
            })
            .select('id')
            .single();
            
          if (error) {
            console.error('Error inserting question:', error);
            errorCount++;
            continue;
          } else if (!data) {
            console.error('No data returned from question insert');
            errorCount++;
            continue;
          }
          
          console.log(`Question inserted successfully with ID: ${data.id}`);
          successCount++;
          newQuestionIds.push(data.id);
        } catch (itemError) {
          console.error('Error processing question:', itemError);
          errorCount++;
        }
      }
      
      if (newQuestionIds.length > 0) {
        // Get default bucket
        console.log('Getting default bucket');
        const defaultBucket = await getDefaultBucket();
        
        if (defaultBucket) {
          // Associate questions with the default bucket
          console.log(`Associating ${newQuestionIds.length} questions with default bucket`);
          await associateQuestionsWithBucket(newQuestionIds, defaultBucket.id);
          console.log('Questions associated with default bucket successfully');
        } else {
          console.warn('Default bucket not found or could not be created');
          // Still count as success since questions were imported, just not associated
        }
      }
      
      console.log(`Import completed. Success: ${successCount}, Errors: ${errorCount}`);
      return { successCount, errorCount, newQuestionIds };
    } catch (error) {
      console.error('Import process failed:', error);
      throw error;
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
      // Read the file content
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (selectedOption === 'csv') {
          setCsvData(content);
        } else {
          setJsonData(content);
        }
      };
      
      reader.readAsText(selectedFile);
    }
  };
  
  const handleDownloadTemplate = () => {
    const template = "Which president signed the Declaration of Independence?,US History,John Adams,Thomas Jefferson,George Washington,Benjamin Franklin,Thomas Jefferson,Medium\nWhich amendment to the US Constitution abolished slavery?,US History,13th Amendment,14th Amendment,15th Amendment,Emancipation Proclamation,13th Amendment,Medium\nWho was the first female Supreme Court Justice?,US History,Sandra Day O'Connor,Ruth Bader Ginsburg,Elena Kagan,Sonia Sotomayor,Sandra Day O'Connor,Medium";
    
    const element = document.createElement('a');
    const file = new Blob([template], {type: 'text/csv'});
    element.href = URL.createObjectURL(file);
    element.download = 'trivia_template.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  const handleImport = async () => {
    setImporting(true);
    setImportResults(null);
    
    try {
      let questions: ImportQuestion[] = [];
      
      // Parse data based on selected format
      if (selectedOption === 'csv' && csvData) {
        console.log('Parsing CSV data');
        questions = parseCSVData(csvData);
      } else if (selectedOption === 'json' && jsonData) {
        console.log('Parsing JSON data');
        questions = parseJSONData(jsonData);
      }
      
      if (questions.length === 0) {
        throw new Error('No valid questions to import. Please check your data format.');
      }
      
      console.log(`Starting import of ${questions.length} questions`);
      
      // Import questions to database
      const result = await importQuestionsToDB(questions);
      
      // Only consider it a success if at least one question was imported
      const wasSuccessful = result.successCount > 0;
      let statusMessage = '';
      
      if (wasSuccessful) {
        statusMessage = `Successfully imported ${result.successCount} questions to the Default Bucket.`;
        if (result.errorCount > 0) {
          statusMessage += ` ${result.errorCount} questions failed to import.`;
        }
      } else {
        statusMessage = `Import failed. All ${result.errorCount} questions failed to import. Please check the console for details.`;
      }
      
      console.log(statusMessage);
      setImportResults({
        success: wasSuccessful,
        message: statusMessage
      });
      
      toast({
        title: wasSuccessful ? "Import Successful" : "Import Failed",
        description: statusMessage,
        variant: wasSuccessful ? "default" : "destructive",
      });
      
      // Refresh categories list
      const categoriesData = await fetchCategories();
      setCategories(categoriesData);
      
    } catch (error) {
      console.error('Import failed:', error);
      setImportResults({
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error during import'
      });
      
      toast({
        title: "Import Failed",
        description: error instanceof Error ? error.message : 'Failed to import questions',
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Import Questions</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Import Questions to Default Bucket</CardTitle>
          <CardDescription>Add new trivia questions by importing data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Import Format</label>
            <Select defaultValue="csv" onValueChange={setSelectedOption}>
              <SelectTrigger>
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV Format</SelectItem>
                <SelectItem value="json">JSON Format</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedOption === 'csv' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">CSV Data</label>
              <Textarea 
                placeholder="question,category,option1,option2,option3,option4,correctAnswer,difficulty"
                className="min-h-[150px]"
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: Each line should be: question,category,option1,option2,option3,option4,correctAnswer,difficulty
              </p>
            </div>
          )}
          
          {selectedOption === 'json' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">JSON Data</label>
              <Textarea 
                placeholder='[{"question": "Which planet is known as the Red Planet?", "category": "Science", "options": ["Venus", "Mars", "Jupiter", "Saturn"], "correctAnswer": "Mars", "difficulty": "Easy"}]'
                className="min-h-[150px]"
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Format: Array of question objects with question, category, options (array), correctAnswer, and difficulty
              </p>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Or Upload a File</label>
            <Input 
              type="file" 
              accept={selectedOption === 'csv' ? ".csv" : ".json"} 
              onChange={handleFileChange}
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                Selected file: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>
          
          {importResults && (
            <Alert variant={importResults.success ? "default" : "destructive"}>
              {importResults.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {importResults.success ? "Import Successful" : "Import Failed"}
              </AlertTitle>
              <AlertDescription>
                {importResults.message}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            className="w-full"
            onClick={handleImport}
            disabled={importing}
          >
            {importing ? (
              "Importing..."
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Questions
              </>
            )}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>CSV Template</CardTitle>
          <CardDescription>Example CSV format for importing questions</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-md overflow-x-auto text-sm">
            <code>
              Which planet is known as the Red Planet?,Science,Venus,Mars,Jupiter,Saturn,Mars,Easy<br/>
              Who painted the Mona Lisa?,Art,Vincent van Gogh,Leonardo da Vinci,Pablo Picasso,Michelangelo,Leonardo da Vinci,Easy<br/>
              In which year did World War II end?,History,1943,1944,1945,1946,1945,Medium
            </code>
          </pre>
          <Button variant="outline" className="mt-4" onClick={handleDownloadTemplate}>
            <Download className="mr-2 h-4 w-4" />
            Download CSV Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportPage;
