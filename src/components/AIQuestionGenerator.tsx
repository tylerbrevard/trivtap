import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface GeneratedQuestion {
  text: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

const AIQuestionGenerator = () => {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          difficulty,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const generatedQuestions = await response.json();

      const existingDataString = localStorage.getItem('trivia_questions');
      let existingData: Record<string, any[]> = {};
      
      if (existingDataString) {
        existingData = JSON.parse(existingDataString);
      }

      const bucketName = `AI Generated: ${topic}`;
      if (!existingData[bucketName]) {
        existingData[bucketName] = [];
      }

      existingData[bucketName] = [...existingData[bucketName], ...generatedQuestions];
      
      localStorage.setItem('trivia_questions', JSON.stringify(existingData));

      toast({
        title: "Success",
        description: `Generated ${generatedQuestions.length} questions for topic: ${topic}`,
      });
    } catch (error) {
      console.error('Error generating questions:', error);
      toast({
        title: "Error",
        description: "Failed to generate questions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-6 w-6" />
          AI Question Generator
        </CardTitle>
        <CardDescription>
          Generate multiple-choice questions on any topic using AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            This will generate 100 multiple-choice questions based on your topic. 
            Questions will be saved to a new bucket labeled "AI Generated: [Topic]".
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="topic" className="text-sm font-medium">Topic</label>
            <Input
              id="topic"
              placeholder="Enter a topic (e.g., World History, Science, Geography)"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium">Difficulty Level</label>
            <Select
              value={difficulty}
              onValueChange={(value: 'easy' | 'medium' | 'hard') => setDifficulty(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="easy">Easy</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="hard">Hard</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleGenerate} 
          disabled={isGenerating || !topic.trim()} 
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Questions...
            </>
          ) : (
            <>
              <Bot className="mr-2 h-4 w-4" />
              Generate 100 Questions
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AIQuestionGenerator;
