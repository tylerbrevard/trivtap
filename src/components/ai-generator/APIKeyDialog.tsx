
import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AIProvider } from './types';

interface APIKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProvider: AIProvider;
  currentApiKey: string;
  onSave: (apiKey: string) => Promise<void>;
  onCancel: () => void;
}

export function APIKeyDialog({
  open,
  onOpenChange,
  selectedProvider,
  currentApiKey,
  onSave,
  onCancel,
}: APIKeyDialogProps) {
  const [apiKey, setApiKey] = React.useState(currentApiKey);

  const handleSave = async () => {
    await onSave(apiKey);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure {selectedProvider.name} API Key</DialogTitle>
          <DialogDescription>
            Enter your {selectedProvider.name} API key to generate questions. 
            You can get your API key from the {selectedProvider.name} dashboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="apiKey" className="text-sm font-medium">
              {selectedProvider.name} API Key
            </label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter API key..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!apiKey.trim()}>
            Save API Key
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
