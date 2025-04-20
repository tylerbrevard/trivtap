
import React from 'react';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Bot, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface QuestionGeneratorFormProps {
  topic: string;
  onTopicChange: (value: string) => void;
  difficulty: 'easy' | 'medium' | 'hard';
  onDifficultyChange: (value: 'easy' | 'medium' | 'hard') => void;
  onGenerate: () => Promise<void>;
  isGenerating: boolean;
  hasApiKey: boolean;
}

export function QuestionGeneratorForm({
  topic,
  onTopicChange,
  difficulty,
  onDifficultyChange,
  onGenerate,
  isGenerating,
  hasApiKey,
}: QuestionGeneratorFormProps) {
  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription className="space-y-2">
          <p>This will generate 100 multiple-choice questions based on your topic. 
             Questions will be saved to a new bucket labeled "AI Generated: [Topic]".</p>
        </AlertDescription>
      </Alert>
      
      <div className="grid gap-4">
        <div className="flex flex-col space-y-1.5">
          <label htmlFor="topic" className="text-sm font-medium">Topic</label>
          <Input
            id="topic"
            placeholder="Enter a topic (e.g., World History, Science, Geography)"
            value={topic}
            onChange={(e) => onTopicChange(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col space-y-1.5">
          <label className="text-sm font-medium">Difficulty Level</label>
          <Select
            value={difficulty}
            onValueChange={(value: 'easy' | 'medium' | 'hard') => onDifficultyChange(value)}
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

      <div className="flex justify-end">
        <Button 
          onClick={onGenerate} 
          disabled={isGenerating || !topic.trim() || !hasApiKey} 
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
      </div>
    </div>
  );
}
