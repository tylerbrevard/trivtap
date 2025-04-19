
import React from 'react';
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
