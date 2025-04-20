
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Key } from 'lucide-react';
import { AIProvider } from './types';

interface AIProviderSelectProps {
  providers: AIProvider[];
  selectedProvider: string;
  onProviderChange: (value: string) => void;
  onConfigureKey: () => void;
  hasApiKey: boolean;
}

export function AIProviderSelect({
  providers,
  selectedProvider,
  onProviderChange,
  onConfigureKey,
  hasApiKey,
}: AIProviderSelectProps) {
  return (
    <div className="flex flex-col space-y-1.5">
      <label htmlFor="provider" className="text-sm font-medium">AI Provider</label>
      <div className="flex gap-2">
        <Select value={selectedProvider} onValueChange={onProviderChange}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select AI provider" />
          </SelectTrigger>
          <SelectContent>
            {providers.map(provider => (
              <SelectItem key={provider.id} value={provider.id}>
                {provider.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          onClick={onConfigureKey}
          title={`Configure ${providers.find(p => p.id === selectedProvider)?.name} API Key`}
        >
          <Key className="h-4 w-4" />
        </Button>
      </div>
      {!hasApiKey && (
        <p className="text-yellow-600 dark:text-yellow-400 text-sm">
          You need to configure your {providers.find(p => p.id === selectedProvider)?.name} API key 
          before generating questions.
        </p>
      )}
    </div>
  );
}
