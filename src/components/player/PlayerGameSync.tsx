
import React, { useEffect, useState } from 'react';
import { recoverFromDisplayTruth, requestSyncFromDisplay } from '@/utils/gameStateUtils';
import { useToast } from "@/components/ui/use-toast";

interface PlayerGameSyncProps {
  playerName: string;
  gameId: string;
  onStateChange: (newState: any) => void;
  onSync: () => void;
}

export const PlayerGameSync = ({
  playerName,
  gameId,
  onStateChange,
  onSync
}: PlayerGameSyncProps) => {
  const { toast } = useToast();
  const [syncAttempts, setSyncAttempts] = useState(0);
  const [lastSyncRequest, setLastSyncRequest] = useState(0);
  
  // Listen for game state changes
  useEffect(() => {
    const handleStateChange = (e: CustomEvent) => {
      console.log('Player received game state change event:', e.detail);
      
      if (e.detail.forceNextQuestion) {
        console.log('Force next question flag detected, updating player state');
        onStateChange(e.detail);
        onSync();
        return;
      }
      
      if (e.detail.guaranteedDelivery || e.detail.definitiveTruth || e.detail.forceSync) {
        console.log('Processing authoritative game state update for player', playerName);
        onStateChange(e.detail);
        onSync();
        setSyncAttempts(0);
        return;
      }
      
      // Process targeted sync response for this player
      if (e.detail.targetPlayer === playerName && e.detail.forcedSyncResponse) {
        console.log('Received targeted sync for player:', playerName);
        onStateChange(e.detail);
        onSync();
        setSyncAttempts(0);
        
        toast({
          title: "Game synchronized",
          description: "Your game has been synchronized with the display.",
        });
        
        return;
      }
      
      // Process normal game state updates
      onStateChange(e.detail);
    };
    
    window.addEventListener('triviaStateChange', handleStateChange as EventListener);
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChange as EventListener);
    };
  }, [onStateChange, onSync, playerName, toast]);
  
  // Periodically check game state and request sync if needed
  useEffect(() => {
    const syncInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncRequest;
      
      // Only request sync if it's been at least 5 seconds since the last request
      if (timeSinceLastSync > 5000) {
        // More aggressive sync request strategy
        console.log('Player periodic sync check');
        requestSyncFromDisplay(playerName);
        setLastSyncRequest(now);
        setSyncAttempts(prev => prev + 1);
        
        if (syncAttempts > 3) {
          console.log('Multiple sync attempts failed, trying to recover from display truth');
          const recovered = recoverFromDisplayTruth();
          
          if (recovered) {
            setSyncAttempts(0);
            toast({
              title: "Game recovered",
              description: "Successfully recovered game state from display.",
            });
          }
        }
      }
    }, 3000);
    
    return () => {
      clearInterval(syncInterval);
    };
  }, [lastSyncRequest, playerName, syncAttempts, toast]);
  
  return null; // This is a non-visual component
};
