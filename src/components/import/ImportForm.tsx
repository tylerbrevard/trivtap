
import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { AlertCircle, CheckCircle2, Upload, Save } from 'lucide-react';
import { parseCSVData, parseJSONData } from './importUtils';
import { addImportedQuestionsToCollection } from '@/utils/staticQuestions';

interface ImportFormProps {
  setImportResults: React.Dispatch<React.SetStateAction<{ success: boolean; message: string } | null>>;
  importResults: { success: boolean; message: string } | null;
}

const ImportForm = ({ setImportResults, importResults }: ImportFormProps) => {
  const [selectedOption, setSelectedOption] = useState('csv');
  const [csvData, setCsvData] = useState('');
  const [jsonData, setJsonData] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('csv');
  const { toast } = useToast();

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

  const handleImport = async () => {
    setImporting(true);
    setImportResults(null);
    
    try {
      let questions: any[] = [];
      
      if (selectedOption === 'csv' && csvData) {
        questions = parseCSVData(csvData);
      } else if (selectedOption === 'json' && jsonData) {
        questions = parseJSONData(jsonData);
      }
      
      if (questions.length === 0) {
        throw new Error('No valid questions to import. Please check your data format.');
      }
      
      const result = await addImportedQuestionsToCollection(questions);
      
      setImportResults({
        success: true,
        message: result
      });
      
      toast({
        title: "Import Successful",
        description: `${questions.length} questions imported successfully!`,
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
    <>
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
            onClick={() => {}}
          >
            <Save className="mr-2 h-4 w-4" />
            Export Collection
          </Button>
        </div>
      </div>
    </>
  );
};

export default ImportForm;
