
import React, { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { recoverFromDisplayTruth } from '@/utils/gameStateUtils';

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
  const [lastSyncAttempt, setLastSyncAttempt] = useState(0);
  const [syncAttempts, setSyncAttempts] = useState(0);
  
  // Listen for game state changes
  useEffect(() => {
    console.log('PlayerGameSync mounted for player:', playerName, 'Game ID:', gameId);
    
    const handleStateChange = (e: CustomEvent) => {
      console.log('PlayerGameSync received state change event:', e.detail);
      
      // Store received game state in localStorage for reliable reference
      try {
        localStorage.setItem('gameState', JSON.stringify(e.detail));
      } catch (error) {
        console.error('Error storing game state in localStorage:', error);
      }
      
      onStateChange(e.detail);
      onSync();
      setSyncAttempts(0); // Reset sync attempts counter on successful sync
    };
    
    // Listen for targeted sync responses
    const handleTargetedSync = (e: CustomEvent) => {
      if (e.detail?.targetPlayer === playerName || !e.detail?.targetPlayer) {
        console.log('Received targeted or broadcast sync:', e.detail);
        onStateChange(e.detail);
        onSync();
        
        try {
          localStorage.setItem('gameState', JSON.stringify(e.detail));
        } catch (error) {
          console.error('Error storing sync response in localStorage:', error);
        }
        
        toast({
          title: "Game synchronized",
          description: "Your game has been synchronized with the display."
        });
        
        setSyncAttempts(0); // Reset sync attempts counter
      }
    };
    
    window.addEventListener('triviaStateChange', handleStateChange as EventListener);
    window.addEventListener('playerSyncResponse', handleTargetedSync as EventListener);
    
    // Announce player presence
    const announcePlayer = () => {
      window.dispatchEvent(new CustomEvent('playerJoined', { 
        detail: { 
          name: playerName, 
          gameId: gameId, 
          timestamp: Date.now() 
        }
      }));
    };
    
    // Announce on mount and periodically
    announcePlayer();
    const announceInterval = setInterval(announcePlayer, 5000);
    
    // Request initial sync
    requestInitialSync();
    
    // Setup periodic sync check to ensure we're still connected
    const syncCheckInterval = setInterval(() => {
      const now = Date.now();
      if (now - lastSyncAttempt > 10000) { // 10 seconds since last sync attempt
        requestInitialSync();
        setLastSyncAttempt(now);
      }
    }, 10000);
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChange as EventListener);
      window.removeEventListener('playerSyncResponse', handleTargetedSync as EventListener);
      clearInterval(announceInterval);
      clearInterval(syncCheckInterval);
    };
  }, [playerName, gameId, onStateChange, onSync, toast, lastSyncAttempt]);
  
  // Request initial sync from display
  const requestInitialSync = () => {
    console.log('Requesting initial sync from display for player:', playerName);
    setLastSyncAttempt(Date.now());
    setSyncAttempts(prev => prev + 1);
    
    // Force recovery from display truth for more reliable sync
    const recoveryAttempted = recoverFromDisplayTruth();
    console.log('Recovery from display truth attempted:', recoveryAttempted);
    
    // Try to load from local storage first
    const storedState = localStorage.getItem('gameState');
    if (storedState) {
      try {
        const parsedState = JSON.parse(storedState);
        console.log('Found stored game state during initial sync:', parsedState);
        onStateChange(parsedState);
        onSync();
      } catch (error) {
        console.error('Error parsing stored game state:', error);
      }
    }
    
    // Also check for display truth
    const displayTruth = localStorage.getItem('gameState_display_truth');
    if (displayTruth) {
      try {
        const parsedTruth = JSON.parse(displayTruth);
        console.log('Found display truth during initial load:', parsedTruth);
        onStateChange({
          ...parsedTruth,
          definitiveTruth: true
        });
        onSync();
      } catch (error) {
        console.error('Error parsing display truth:', error);
      }
    }
    
    // Create a more robust sync request
    const syncRequest = {
      playerName,
      gameId,
      timestamp: Date.now(),
      attempts: syncAttempts,
      urgent: syncAttempts > 3
    };
    
    // Request sync from display
    window.dispatchEvent(new CustomEvent('playerNeedsSync', { detail: syncRequest }));
    
    // Dispatch a backup event
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
        detail: {
          ...syncRequest,
          timestamp: Date.now(),
          backup: true
        }
      }));
    }, 500);
    
    // Use fallback methods if we've already tried a few times
    if (syncAttempts > 3) {
      // Force a broadcast event to request state from anyone
      window.dispatchEvent(new CustomEvent('playerBroadcastNeedsSync', { 
        detail: {
          playerName,
          gameId,
          timestamp: Date.now(),
          urgent: true,
          broadcastRequest: true
        }
      }));
      
      // If we've tried many times, show a toast to the user
      if (syncAttempts % 5 === 0) {
        toast({
          title: "Sync issues detected",
          description: "Trying to reconnect to the game...",
          variant: "destructive"
        });
      }
    }
  };
  
  return null; // This is a non-visual component
};
