
import { useEffect } from 'react';
import { recoverFromDisplayTruth } from '@/utils/gameStateUtils';

interface PlayerSyncManagerProps {
  playerName: string | null;
  gameId: string | null;
  onSync: () => void;
}

/**
 * Component to manage player synchronization with display
 * This runs in the background to ensure the player stays in sync
 */
const PlayerSyncManager: React.FC<PlayerSyncManagerProps> = ({
  playerName,
  gameId,
  onSync
}) => {
  // Initial sync on mount
  useEffect(() => {
    const initialSync = () => {
      console.log('Player sync manager initializing...');
      
      // Check if we need to recover from display truth
      const gameState = localStorage.getItem('gameState');
      const displayTruth = localStorage.getItem('gameState_display_truth');
      
      if (displayTruth && (!gameState || Math.random() < 0.5)) {
        try {
          const truthState = JSON.parse(displayTruth);
          const parsedGameState = gameState ? JSON.parse(gameState) : null;
          
          // If display truth is newer or we don't have a game state, recover
          if (!parsedGameState || truthState.timestamp > parsedGameState.timestamp) {
            console.log('Display truth is newer, recovering...');
            recoverFromDisplayTruth();
            onSync();
          }
        } catch (error) {
          console.error('Error in initial sync:', error);
        }
      }
    };
    
    // Run initial sync
    initialSync();
    
    // Set up regular sync check
    const syncInterval = setInterval(() => {
      console.log('Regular sync check running...');
      
      try {
        const gameState = localStorage.getItem('gameState');
        const displayTruth = localStorage.getItem('gameState_display_truth');
        
        if (displayTruth && gameState) {
          const truthState = JSON.parse(displayTruth);
          const parsedGameState = JSON.parse(gameState);
          
          // If states don't match or display truth is much newer
          if (truthState.state !== parsedGameState.state || 
              truthState.questionIndex !== parsedGameState.questionIndex ||
              truthState.timestamp > parsedGameState.timestamp + 5000) {
            
            console.log('Sync mismatch detected, recovering from display truth');
            recoverFromDisplayTruth();
            onSync();
          }
        }
      } catch (error) {
        console.error('Error in sync check:', error);
      }
    }, 3000);
    
    // Set up intermission escape check
    const intermissionCheckInterval = setInterval(() => {
      try {
        const gameState = localStorage.getItem('gameState');
        const displayTruth = localStorage.getItem('gameState_display_truth');
        
        if (gameState && displayTruth) {
          const parsedState = JSON.parse(gameState);
          const truthState = JSON.parse(displayTruth);
          
          // If we're in intermission but display is in question state
          if (parsedState.state === 'intermission' && truthState.state === 'question') {
            console.log('Detected intermission while display is in question state, forcing recovery');
            recoverFromDisplayTruth();
            onSync();
          }
        }
      } catch (error) {
        console.error('Error in intermission check:', error);
      }
    }, 1000);
    
    return () => {
      clearInterval(syncInterval);
      clearInterval(intermissionCheckInterval);
    };
  }, [onSync]);
  
  // Listen for state changes from other components/tabs
  useEffect(() => {
    const handleStateChange = (e: CustomEvent) => {
      const detail = e.detail;
      
      // Check for high-priority sync messages
      if (detail.definitiveTruth || detail.guaranteedDelivery || detail.forceSync) {
        console.log('Received high-priority sync message:', detail);
        onSync();
      }
    };
    
    window.addEventListener('triviaStateChange', handleStateChange as EventListener);
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChange as EventListener);
    };
  }, [onSync]);
  
  // Ping method to announce this player to display
  useEffect(() => {
    const pingDisplay = () => {
      if (!playerName || !gameId) return;
      
      // Broadcast player presence to help display track active players
      window.dispatchEvent(new CustomEvent('playerPing', { 
        detail: { 
          name: playerName,
          gameId: gameId,
          timestamp: Date.now(),
          active: true
        }
      }));
      
      console.log('Sent player ping to display');
    };
    
    // Run initial ping
    pingDisplay();
    
    // Set up regular pings
    const pingInterval = setInterval(pingDisplay, 5000);
    
    return () => {
      clearInterval(pingInterval);
    };
  }, [playerName, gameId]);
  
  // This component doesn't render anything
  return null;
};

export default PlayerSyncManager;
