
import React, { useEffect } from 'react';
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
  
  // Listen for game state changes
  useEffect(() => {
    console.log('PlayerGameSync mounted for player:', playerName);
    
    const handleStateChange = (e: CustomEvent) => {
      console.log('PlayerGameSync received state change event:', e.detail);
      onStateChange(e.detail);
      onSync();
    };
    
    // Listen for targeted sync responses
    const handleTargetedSync = (e: CustomEvent) => {
      if (e.detail?.targetPlayer === playerName) {
        console.log('Received targeted sync for player:', playerName);
        onStateChange(e.detail);
        onSync();
        
        toast({
          title: "Game synchronized",
          description: "Your game has been synchronized with the display."
        });
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
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChange as EventListener);
      window.removeEventListener('playerSyncResponse', handleTargetedSync as EventListener);
      clearInterval(announceInterval);
    };
  }, [playerName, gameId, onStateChange, onSync, toast]);
  
  // Request initial sync from display
  const requestInitialSync = () => {
    console.log('Requesting initial sync from display for player:', playerName);
    
    // Try to load from local storage first
    const storedState = localStorage.getItem('gameState');
    if (storedState) {
      try {
        const parsedState = JSON.parse(storedState);
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
    
    // Request sync from display
    window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
      detail: {
        playerName,
        gameId,
        timestamp: Date.now()
      }
    }));
  };
  
  return null; // This is a non-visual component
};
