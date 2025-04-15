
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Upload, AlertCircle, CheckCircle2, Download, Save, Trash2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories, getOrCreateCategory } from "@/utils/importUtils";
import { 
  addImportedQuestionsToCollection, 
  exportQuestionsToJson,
  exportQuestionsToCSV, 
  getCurrentUserId, 
  getStaticQuestions, 
  StaticQuestion
} from "@/utils/staticQuestions";
import DuplicateQuestionRemover from "@/components/DuplicateQuestionRemover";

const ImportPage = () => {
  const [selectedOption, setSelectedOption] = useState('csv');
  const [csvData, setCsvData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: boolean; message: string } | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');
  const { toast } = useToast();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
        console.log("Loaded categories:", categoriesData);
        
        const userId = await getCurrentUserId();
        setCurrentUserId(userId);
        console.log("Current user ID:", userId || "Not logged in");
      } catch (err) {
        console.error('Failed to load initial data:', err);
        toast({
          title: "Error",
          description: "Failed to load categories.",
          variant: "destructive",
        });
      }
    };
    
    loadData();
  }, [toast]);
  
  const parseCSVData = (csvContent: string): any[] => {
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
  
  const parseJSONData = (jsonContent: string): any[] => {
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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      
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
  
  const handleExportQuestions = async () => {
    try {
      let content: string;
      let fileType: string;
      let fileName: string;
      
      if (exportFormat === 'json') {
        content = await exportQuestionsToJson();
        fileType = 'application/json';
        fileName = 'trivia_questions.json';
      } else {
        content = await exportQuestionsToCSV();
        fileType = 'text/csv';
        fileName = 'trivia_questions.csv';
      }
      
      const element = document.createElement('a');
      const file = new Blob([content], {type: fileType});
      element.href = URL.createObjectURL(file);
      element.download = fileName;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      
      toast({
        title: "Export Successful",
        description: `Questions exported successfully as ${exportFormat.toUpperCase()}!`,
        variant: "default",
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Export Failed",
        description: error instanceof Error ? error.message : 'Failed to export questions',
        variant: "destructive",
      });
    }
  };
  
  const handleImport = async () => {
    setImporting(true);
    setImportResults(null);
    
    try {
      let questions: any[] = [];
      
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
      
      const result = await addImportedQuestionsToCollection(questions);
      
      setImportResults({
        success: true,
        message: result
      });
      
      toast({
        title: "Import Successful",
        description: `${questions.length} questions imported successfully! ${currentUserId ? 'They will be available in your account.' : 'They will be available in this browser.'}`,
        variant: "default",
      });
      
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
      
      <Tabs defaultValue="import">
        <TabsList className="grid grid-cols-2 w-[400px]">
          <TabsTrigger value="import">Import Questions</TabsTrigger>
          <TabsTrigger value="manage">Manage Questions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Import Questions</CardTitle>
              <CardDescription>Add new trivia questions to your collection</CardDescription>
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
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  className="flex-1"
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
                
                <div className="flex-1 flex gap-2">
                  <Select 
                    defaultValue="csv" 
                    onValueChange={(value) => setExportFormat(value as 'json' | 'csv')}
                  >
                    <SelectTrigger className="w-[110px]">
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV</SelectItem>
                      <SelectItem value="json">JSON</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleExportQuestions}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Export Collection
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>About Static Questions</CardTitle>
              <CardDescription>
                {currentUserId 
                  ? "Your imported questions are saved to your account" 
                  : "Sign in to keep your questions when you return"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                We've updated the system to use static questions instead of database storage to reduce database usage and costs. When you import questions:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground mb-4">
                <li>A set of default questions is always available to all users</li>
                <li>
                  {currentUserId 
                    ? "Your imported questions are tied to your account and will be available when you log in later" 
                    : "When logged in, your imported questions will be saved to your account and available when you return"}
                </li>
                <li>You can export the full collection to save it locally</li>
                <li>Import that exported file later to restore your collection</li>
                <li>This approach significantly reduces database costs while maintaining functionality</li>
              </ul>
              <div className="bg-muted p-3 rounded-md">
                <h4 className="text-sm font-medium mb-2">CSV Template Example</h4>
                <pre className="overflow-x-auto text-xs">
                  <code>
                    Which planet is known as the Red Planet?,Science,Venus,Mars,Jupiter,Saturn,Mars,Easy<br/>
                    Who painted the Mona Lisa?,Art,Vincent van Gogh,Leonardo da Vinci,Pablo Picasso,Michelangelo,Leonardo da Vinci,Easy<br/>
                    In which year did World War II end?,History,1943,1944,1945,1946,1945,Medium
                  </code>
                </pre>
                <Button variant="outline" className="mt-3" onClick={handleDownloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="manage">
          <DuplicateQuestionRemover />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ImportPage;
