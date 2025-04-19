
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Bot, Loader2, Key } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [hasApiKey, setHasApiKey] = useState(false);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    checkApiKey();
  }, []);

  const checkApiKey = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('user_api_settings')
      .select('openai_api_key')
      .single();

    setHasApiKey(!!data?.openai_api_key);
  };

  const handleSaveApiKey = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Error",
          description: "You must be logged in to save API settings",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('user_api_settings')
        .upsert({
          user_id: session.user.id,
          openai_api_key: apiKey,
        });

      if (error) throw error;

      setHasApiKey(true);
      setShowApiKeyDialog(false);
      setApiKey('');
      
      toast({
        title: "Success",
        description: "API key saved successfully",
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Error",
        description: "Failed to save API key",
        variant: "destructive",
      });
    }
  };

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic",
        variant: "destructive",
      });
      return;
    }

    if (!hasApiKey) {
      setShowApiKeyDialog(true);
      return;
    }

    setIsGenerating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch('https://lddknaikooiwbkpagjuc.supabase.co/functions/v1/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
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

      // Save to localStorage
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
        description: "Failed to generate questions. Please check your API key and try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
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
            <AlertDescription className="space-y-2">
              <p>This will generate 100 multiple-choice questions based on your topic. 
              Questions will be saved to a new bucket labeled "AI Generated: [Topic]".</p>
              {!hasApiKey && (
                <p className="text-yellow-600 dark:text-yellow-400">
                  You need to configure your OpenAI API key before generating questions.
                  Click the "Configure API Key" button below.
                </p>
              )}
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
        <CardFooter className="flex gap-2">
          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !topic.trim()} 
            className="flex-1"
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
          <Button
            variant="outline"
            onClick={() => setShowApiKeyDialog(true)}
            title="Configure OpenAI API Key"
          >
            <Key className="h-4 w-4" />
          </Button>
        </CardFooter>
      </Card>

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure OpenAI API Key</DialogTitle>
            <DialogDescription>
              Enter your OpenAI API key to generate questions. You can get your API key from the OpenAI dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                OpenAI API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIQuestionGenerator;
