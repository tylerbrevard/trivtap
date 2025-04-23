
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
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Listen for game state changes
  useEffect(() => {
    const handleStateChange = (e: CustomEvent) => {
      console.log('Player received game state change event:', e.detail);
      
      // Force next question handling
      if (e.detail.forceNextQuestion) {
        console.log('Force next question flag detected, updating player state');
        onStateChange(e.detail);
        onSync();
        return;
      }
      
      // Handle authoritative updates
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
  
  // Emergency fallback for complete lack of state
  useEffect(() => {
    if (localStorage.getItem('gameState') === null) {
      // If there's no game state at all, try to recover immediately
      console.log('EMERGENCY: No game state found, attempting recovery');
      recoverFromDisplayTruth();
      requestSyncFromDisplay(playerName);
    }
  }, [playerName]);
  
  // Periodically check game state and request sync if needed
  useEffect(() => {
    // Active periodic sync checking
    const syncInterval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastSync = now - lastSyncRequest;
      
      // Only request sync if it's been at least 3 seconds since the last request
      if (timeSinceLastSync > 3000 && !isSyncing) {
        setIsSyncing(true);
        console.log('Player periodic sync check - requesting sync from display');
        requestSyncFromDisplay(playerName);
        setLastSyncRequest(now);
        setSyncAttempts(prev => prev + 1);
        
        if (syncAttempts > 2) {
          console.log('Multiple sync attempts failed, trying to recover from display truth');
          const recovered = recoverFromDisplayTruth();
          
          if (recovered) {
            setSyncAttempts(0);
            toast({
              title: "Game recovered",
              description: "Successfully recovered game state from display.",
            });
          } else {
            console.log('Recovery attempt failed, will try again');
            
            // Broadcast a help request event that the display can respond to
            window.dispatchEvent(new CustomEvent('playerNeedsEmergencySync', { 
              detail: {
                playerName,
                timestamp: Date.now(),
                attempts: syncAttempts
              }
            }));
          }
        }
        
        setTimeout(() => setIsSyncing(false), 500);
      }
    }, 2000); // Check more frequently - every 2 seconds
    
    return () => {
      clearInterval(syncInterval);
    };
  }, [lastSyncRequest, playerName, syncAttempts, toast, isSyncing]);
  
  return null; // This is a non-visual component
};
