
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Bot } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { AIProvider } from './ai-generator/types';
import { APIKeyDialog } from './ai-generator/APIKeyDialog';
import { AIProviderSelect } from './ai-generator/AIProviderSelect';
import { QuestionGeneratorForm } from './ai-generator/QuestionGeneratorForm';

const AI_PROVIDERS: AIProvider[] = [
  { id: 'openai', name: 'OpenAI', keyName: 'openai_api_key' },
  { id: 'anthropic', name: 'Anthropic', keyName: 'anthropic_api_key' },
  { id: 'gemini', name: 'Google Gemini', keyName: 'gemini_api_key' },
];

export default function AIQuestionGenerator() {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [apiKeys, setApiKeys] = useState<Record<string, string | null>>({});
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState('');
  const [currentKeyType, setCurrentKeyType] = useState<string>('');
  const { toast } = useToast();

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

  const handleSaveApiKey = async (apiKey: string) => {
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
          [currentKeyType]: apiKey,
        });

      if (error) throw error;

      setApiKeys(prev => ({
        ...prev,
        [currentKeyType]: apiKey
      }));
      
      setShowApiKeyDialog(false);
      
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

  const handleConfigureKey = () => {
    const providerKey = AI_PROVIDERS.find(p => p.id === selectedProvider)?.keyName;
    setCurrentKeyType(providerKey || '');
    setCurrentApiKey(apiKeys[providerKey || ''] || '');
    setShowApiKeyDialog(true);
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
      handleConfigureKey();
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
        <AIProviderSelect
          providers={AI_PROVIDERS}
          selectedProvider={selectedProvider}
          onProviderChange={setSelectedProvider}
          onConfigureKey={handleConfigureKey}
          hasApiKey={!!apiKeys[AI_PROVIDERS.find(p => p.id === selectedProvider)?.keyName || '']}
        />

        <QuestionGeneratorForm
          topic={topic}
          onTopicChange={setTopic}
          difficulty={difficulty}
          onDifficultyChange={setDifficulty}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
          hasApiKey={!!apiKeys[AI_PROVIDERS.find(p => p.id === selectedProvider)?.keyName || '']}
        />

        <APIKeyDialog
          open={showApiKeyDialog}
          onOpenChange={setShowApiKeyDialog}
          selectedProvider={AI_PROVIDERS.find(p => p.id === selectedProvider) || AI_PROVIDERS[0]}
          currentApiKey={currentApiKey}
          onSave={handleSaveApiKey}
          onCancel={() => setShowApiKeyDialog(false)}
        />
      </CardContent>
    </Card>
  );
}
