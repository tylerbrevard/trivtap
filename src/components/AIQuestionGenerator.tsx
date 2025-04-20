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

interface AIProvider {
  id: string;
  name: string;
  keyName: string;
}

const AI_PROVIDERS: AIProvider[] = [
  { id: 'openai', name: 'OpenAI', keyName: 'openai_api_key' },
  { id: 'anthropic', name: 'Anthropic', keyName: 'anthropic_api_key' },
  { id: 'gemini', name: 'Google Gemini', keyName: 'gemini_api_key' },
];

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

  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [apiKeys, setApiKeys] = useState<Record<string, string | null>>({});
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [currentKeyType, setCurrentKeyType] = useState<string>('');

  useEffect(() => {
    checkApiKeys();
  }, []);

  const checkApiKeys = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('user_api_settings')
      .select('openai_api_key, anthropic_api_key, gemini_api_key')
      .single();

    setApiKeys({
      openai_api_key: data?.openai_api_key || null,
      anthropic_api_key: data?.anthropic_api_key || null,
      gemini_api_key: data?.gemini_api_key || null,
    });
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
          [currentKeyType]: currentApiKey,
        });

      if (error) throw error;

      setApiKeys(prev => ({
        ...prev,
        [currentKeyType]: currentApiKey
      }));
      
      setShowApiKeyDialog(false);
      setCurrentApiKey('');
      
      toast({
        title: "Success",
        description: "API key saved successfully",
      });

      checkApiKeys();
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

    const providerKey = AI_PROVIDERS.find(p => p.id === selectedProvider)?.keyName;
    if (!providerKey || !apiKeys[providerKey]) {
      setCurrentKeyType(providerKey || '');
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
          provider: selectedProvider,
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
            {!apiKeys[AI_PROVIDERS.find(p => p.id === selectedProvider)?.keyName || ''] && (
              <p className="text-yellow-600 dark:text-yellow-400">
                You need to configure your {AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} API key before generating questions.
                Click the "Configure API Key" button below.
              </p>
            )}
          </AlertDescription>
        </Alert>
        
        <div className="grid gap-4">
          <div className="flex flex-col space-y-1.5">
            <label htmlFor="provider" className="text-sm font-medium">AI Provider</label>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select AI provider" />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map(provider => (
                  <SelectItem key={provider.id} value={provider.id}>
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
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
          onClick={() => {
            setCurrentKeyType(AI_PROVIDERS.find(p => p.id === selectedProvider)?.keyName || '');
            setShowApiKeyDialog(true);
          }}
          title={`Configure ${AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} API Key`}
        >
          <Key className="h-4 w-4" />
        </Button>
      </CardFooter>

      <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure {AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} API Key</DialogTitle>
            <DialogDescription>
              Enter your {AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} API key to generate questions. 
              You can get your API key from the {AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} dashboard.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="apiKey" className="text-sm font-medium">
                {AI_PROVIDERS.find(p => p.id === selectedProvider)?.name} API Key
              </label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter API key..."
                value={currentApiKey}
                onChange={(e) => setCurrentApiKey(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApiKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey} disabled={!currentApiKey.trim()}>
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default AIQuestionGenerator;
