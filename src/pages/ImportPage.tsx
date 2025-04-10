
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

const ImportPage = () => {
  const [selectedOption, setSelectedOption] = useState('csv');
  const [csvData, setCsvData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: boolean; message: string } | null>(null);
  const { toast } = useToast();
  
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
      
      if (selectedOption === 'csv') {
        reader.readAsText(selectedFile);
      } else {
        reader.readAsText(selectedFile);
      }
    }
  };
  
  const handleImport = () => {
    setImporting(true);
    setImportResults(null);
    
    // Mock import process - in a real app, this would be an API call
    setTimeout(() => {
      setImporting(false);
      
      if (selectedOption === 'csv' && csvData) {
        // Success scenario for demo
        setImportResults({
          success: true,
          message: `Successfully imported ${csvData.split('\n').length - 1} questions to the Default Bucket.`
        });
        
        toast({
          title: "Import Successful",
          description: `${csvData.split('\n').length - 1} questions imported to the Default Bucket.`,
        });
      } else if (selectedOption === 'json' && jsonData) {
        // Success scenario for demo
        try {
          const parsedData = JSON.parse(jsonData);
          const questionCount = Array.isArray(parsedData) ? parsedData.length : 1;
          
          setImportResults({
            success: true,
            message: `Successfully imported ${questionCount} questions to the Default Bucket.`
          });
          
          toast({
            title: "Import Successful",
            description: `${questionCount} questions imported to the Default Bucket.`,
          });
        } catch (error) {
          setImportResults({
            success: false,
            message: "Error parsing JSON data. Please ensure it's in valid format."
          });
          
          toast({
            title: "Import Failed",
            description: "Error parsing JSON data. Please check the format.",
            variant: "destructive",
          });
        }
      } else {
        setImportResults({
          success: false,
          message: "No data to import. Please enter data or upload a file."
        });
        
        toast({
          title: "Import Failed",
          description: "No data to import. Please enter data or upload a file.",
          variant: "destructive",
        });
      }
    }, 2000);
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
          <Button variant="outline" className="mt-4">
            Download CSV Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImportPage;
