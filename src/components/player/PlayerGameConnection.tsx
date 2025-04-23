
import React, { useEffect, useState } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { 
  verifyGameConnection, 
  setupGameStatePoller, 
  getGameState,
  storeGameState
} from '@/utils/playerAnswerUtils';

interface PlayerGameConnectionProps {
  playerName: string;
  gameId: string;
  onStateChange: (state: any) => void;
}

export const PlayerGameConnection: React.FC<PlayerGameConnectionProps> = ({
  playerName,
  gameId,
  onStateChange
}) => {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(Date.now());
  
  // Set up game state listener
  useEffect(() => {
    console.log('Setting up game connection for:', playerName, gameId);
    
    // Verify connection
    verifyGameConnection(playerName, gameId);
    
    // Handle state updates from display
    const handleGameStateUpdate = (e: CustomEvent) => {
      const gameState = e.detail;
      
      // Verify this update is for our game
      if (gameState.gameId && gameState.gameId !== gameId) {
        return;
      }
      
      console.log('Received game state update:', gameState);
      storeGameState(gameState);
      onStateChange(gameState);
      setLastSyncTime(Date.now());
      setConnected(true);
    };
    
    // Listen for state updates
    window.addEventListener('triviaStateChange', handleGameStateUpdate as EventListener);
    window.addEventListener('gameStateUpdate', handleGameStateUpdate as EventListener);
    
    // Set up polling for state updates
    const cleanupPoller = setupGameStatePoller(playerName, gameId, (gameState) => {
      onStateChange(gameState);
      setLastSyncTime(Date.now());
      setConnected(true);
    });
    
    // Check for existing state
    const existingState = getGameState();
    if (existingState) {
      const stateAge = Date.now() - (existingState.receivedAt || 0);
      
      if (stateAge < 15000) { // Less than 15 seconds old
        console.log('Using existing game state:', existingState);
        onStateChange(existingState);
        setLastSyncTime(Date.now());
        setConnected(true);
      }
    }
    
    // Set up connection monitor
    const connectionMonitor = setInterval(() => {
      const timeSinceLastSync = Date.now() - lastSyncTime;
      if (timeSinceLastSync > 10000) {
        setConnected(false);
        console.log('Connection may be lost, last sync was', timeSinceLastSync / 1000, 'seconds ago');
      }
    }, 5000);
    
    // Clean up
    return () => {
      window.removeEventListener('triviaStateChange', handleGameStateUpdate as EventListener);
      window.removeEventListener('gameStateUpdate', handleGameStateUpdate as EventListener);
      cleanupPoller();
      clearInterval(connectionMonitor);
    };
  }, [playerName, gameId, onStateChange, lastSyncTime]);
  
  // Setup BroadcastChannel receiver
  useEffect(() => {
    let bc: BroadcastChannel;
    
    try {
      bc = new BroadcastChannel('trivia_game_state');
      
      bc.onmessage = (event) => {
        if (event.data && (!event.data.gameId || event.data.gameId === gameId)) {
          console.log('Received game state via BroadcastChannel:', event.data);
          storeGameState(event.data);
          onStateChange(event.data);
          setLastSyncTime(Date.now());
          setConnected(true);
        }
      };
    } catch (error) {
      console.log('BroadcastChannel API not supported');
    }
    
    return () => {
      if (bc) bc.close();
    };
  }, [gameId, onStateChange]);
  
  // Announce player presence periodically
  useEffect(() => {
    const announceInterval = setInterval(() => {
      window.dispatchEvent(new CustomEvent('playerPresence', {
        detail: {
          playerName,
          gameId,
          timestamp: Date.now(),
          connectionState: connected ? 'connected' : 'reconnecting'
        }
      }));
    }, 5000);
    
    return () => clearInterval(announceInterval);
  }, [playerName, gameId, connected]);
  
  // Force a state refresh when connection status changes
  useEffect(() => {
    if (!connected) {
      toast({
        title: "Connection issue detected",
        description: "Trying to reconnect to the game...",
        variant: "destructive"
      });
    }
  }, [connected, toast]);
  
  // This is a non-visual component
  return null;
};
