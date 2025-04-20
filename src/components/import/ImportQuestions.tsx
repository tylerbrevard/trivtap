
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import ImportForm from './ImportForm';
import ImportInfo from './ImportInfo';

const ImportQuestions = () => {
  const [importResults, setImportResults] = useState<{ success: boolean; message: string } | null>(null);
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import Questions</CardTitle>
          <CardDescription>Add new trivia questions to your collection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImportForm 
            setImportResults={setImportResults} 
            importResults={importResults}
          />
        </CardContent>
      </Card>
      
      <ImportInfo />
    </div>
  );
};

export default ImportQuestions;
