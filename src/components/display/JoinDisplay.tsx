
import React, { useEffect } from 'react';
import { QrCode } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface JoinDisplayProps {
  gameCode: string;
  uniquePlayers: any[];
  onStartGame: () => void;
  onManualNext: () => void;
  forcePause: boolean;
  togglePause: () => void;
}

export const JoinDisplay = ({
  gameCode,
  uniquePlayers,
  onStartGame,
  onManualNext,
  forcePause,
  togglePause
}: JoinDisplayProps) => {
  // Ensure game state is set to 'join' when this component mounts
  useEffect(() => {
    // Clear any previous game state
    localStorage.removeItem('gameState');
    localStorage.removeItem('gameState_display_truth');
    
    // Create authoritative join state
    const joinState = {
      state: 'join',
      questionIndex: 0,
      timeLeft: 0,
      questionCounter: 1,
      timestamp: Date.now() + 10000, // Future timestamp for priority
      forceJoinState: true,
      definitiveTruth: true,
      guaranteedDelivery: true,
      displayInit: true,
      forceSync: true
    };
    
    // Store the state
    localStorage.setItem('gameState', JSON.stringify(joinState));
    localStorage.setItem('gameState_display_truth', JSON.stringify(joinState));
    
    // Dispatch the event to notify all listeners
    window.dispatchEvent(new CustomEvent('triviaStateChange', { 
      detail: joinState
    }));
    
    console.log('Join display initialized with authoritative state:', joinState);
    
    // Send redundant events to ensure delivery
    for (let i = 1; i <= 3; i++) {
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('triviaStateChange', { 
          detail: {
            ...joinState,
            timestamp: joinState.timestamp + i,
            redundancyLevel: i
          }
        }));
      }, i * 100);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-5xl font-bold mb-8 text-primary animate-pulse">Join the Game!</h1>
      <div className="mb-8">
        <div className="bg-white rounded-lg p-6 inline-block mb-4">
          <QrCode className="h-40 w-40 text-black" />
        </div>
        <p className="text-xl">Scan the QR code or visit</p>
        <p className="text-2xl font-bold text-primary mb-4">trivtap.com/join</p>
        <div className="text-4xl font-bold bg-gradient-to-r from-trivia-primary to-trivia-accent bg-clip-text text-transparent py-4 px-8 border-2 border-primary rounded-lg animate-pulse-scale">
          {gameCode}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xl font-medium">Players joined: {uniquePlayers.length}</p>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          {uniquePlayers.map(player => (
            <div key={player.id} className="bg-primary/20 px-3 py-1 rounded-full text-primary">
              {player.name}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-8 space-y-4">
        <Button onClick={onStartGame}>
          Start Game Now
        </Button>
        
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
            <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onManualNext}>
                Force Next Question
              </Button>
              <Button variant="outline" size="sm" onClick={togglePause}>
                {forcePause ? 'Resume Game' : 'Pause Game'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  const gameState = localStorage.getItem('gameState');
                  console.log('Current game state:', gameState ? JSON.parse(gameState) : 'Not found');
                }}
              >
                Log Debug Info
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
