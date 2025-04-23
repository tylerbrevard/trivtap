
import React, { useEffect, useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { recoverFromDisplayTruth } from '@/utils/gameStateUtils';
import { verifyGameConnection } from '@/utils/playerAnswerUtils';

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
  const syncIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectionVerified = useRef(false);
  
  // Listen for game state changes
  useEffect(() => {
    console.log('PlayerGameSync mounted for player:', playerName, 'Game ID:', gameId);
    
    // Verify game connection
    connectionVerified.current = verifyGameConnection(playerName, gameId);
    
    const handleStateChange = (e: CustomEvent) => {
      console.log('PlayerGameSync received state change event:', e.detail);
      
      // Store received game state in localStorage for reliable reference
      try {
        localStorage.setItem('gameState', JSON.stringify(e.detail));
        // Also store in sessionStorage for more reliability
        sessionStorage.setItem('gameState', JSON.stringify(e.detail));
      } catch (error) {
        console.error('Error storing game state in storage:', error);
      }
      
      onStateChange(e.detail);
      onSync();
      setSyncAttempts(0); // Reset sync attempts counter on successful sync
    };
    
    // Listen for targeted sync responses
    const handleTargetedSync = (e: CustomEvent) => {
      // Accept sync if it's targeted at this player or it's a broadcast
      if (e.detail?.targetPlayer === playerName || !e.detail?.targetPlayer) {
        console.log('Received targeted or broadcast sync:', e.detail);
        onStateChange(e.detail);
        onSync();
        
        try {
          localStorage.setItem('gameState', JSON.stringify(e.detail));
          sessionStorage.setItem('gameState', JSON.stringify(e.detail));
        } catch (error) {
          console.error('Error storing sync response in storage:', error);
        }
        
        toast({
          title: "Game synchronized",
          description: "Your game has been synchronized with the display."
        });
        
        setSyncAttempts(0); // Reset sync attempts counter
      }
    };
    
    // Listen for force sync requests from other components
    const handleForceSyncRequest = (e: CustomEvent) => {
      console.log('Received force sync request:', e.detail);
      requestInitialSync(true);
    };
    
    window.addEventListener('triviaStateChange', handleStateChange as EventListener);
    window.addEventListener('playerSyncResponse', handleTargetedSync as EventListener);
    window.addEventListener('forceSyncRequest', handleForceSyncRequest as EventListener);
    
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
    syncIntervalRef.current = setInterval(() => {
      const now = Date.now();
      if (now - lastSyncAttempt > 10000) { // 10 seconds since last sync attempt
        requestInitialSync();
        setLastSyncAttempt(now);
      }
    }, 10000);
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChange as EventListener);
      window.removeEventListener('playerSyncResponse', handleTargetedSync as EventListener);
      window.removeEventListener('forceSyncRequest', handleForceSyncRequest as EventListener);
      clearInterval(announceInterval);
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [playerName, gameId, onStateChange, onSync, toast, lastSyncAttempt]);
  
  // Request initial sync from display
  const requestInitialSync = (force = false) => {
    console.log('Requesting initial sync from display for player:', playerName, 'Force:', force);
    setLastSyncAttempt(Date.now());
    setSyncAttempts(prev => prev + 1);
    
    // Clear any existing game state if forcing a sync
    if (force) {
      localStorage.removeItem('gameState');
      sessionStorage.removeItem('gameState');
    }
    
    // Force recovery from display truth for more reliable sync
    const recoveryAttempted = recoverFromDisplayTruth();
    console.log('Recovery from display truth attempted:', recoveryAttempted);
    
    // Try to load from session storage first (more reliable during session)
    const sessionState = sessionStorage.getItem('gameState');
    if (sessionState) {
      try {
        const parsedState = JSON.parse(sessionState);
        console.log('Found stored game state in sessionStorage during sync:', parsedState);
        onStateChange(parsedState);
        onSync();
      } catch (error) {
        console.error('Error parsing session stored game state:', error);
      }
    }
    // Then try localStorage
    else {
      const localState = localStorage.getItem('gameState');
      if (localState) {
        try {
          const parsedState = JSON.parse(localState);
          console.log('Found stored game state in localStorage during sync:', parsedState);
          onStateChange(parsedState);
          onSync();
        } catch (error) {
          console.error('Error parsing local stored game state:', error);
        }
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
      urgent: syncAttempts > 3 || force,
      forceSync: force
    };
    
    // Request sync from display - try multiple channels
    window.dispatchEvent(new CustomEvent('playerNeedsSync', { detail: syncRequest }));
    window.dispatchEvent(new CustomEvent('triviaPlayerNeedsSync', { detail: syncRequest }));
    
    // Dispatch backup events with slight delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
        detail: {
          ...syncRequest,
          timestamp: Date.now(),
          backup: true
        }
      }));
    }, 300);
    
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('triviaPlayerNeedsSync', { 
        detail: {
          ...syncRequest,
          timestamp: Date.now(),
          backup: true,
          secondaryBackup: true
        }
      }));
    }, 600);
    
    // Use fallback methods if we've already tried a few times
    if (syncAttempts > 2 || force) {
      // Force a broadcast event to request state from anyone
      window.dispatchEvent(new CustomEvent('playerBroadcastNeedsSync', { 
        detail: {
          playerName,
          gameId,
          timestamp: Date.now(),
          urgent: true,
          broadcastRequest: true,
          force: force
        }
      }));
      
      // If we've tried many times, show a toast to the user
      if ((syncAttempts % 3 === 0) || force) {
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
