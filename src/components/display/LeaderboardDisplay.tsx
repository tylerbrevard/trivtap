
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface LeaderboardDisplayProps {
  sortedPlayers: any[];
  onManualNext: () => void;
}

export const LeaderboardDisplay = ({
  sortedPlayers,
  onManualNext
}: LeaderboardDisplayProps) => {
  // Force a broadcast of player scores to ensure leaderboard accuracy
  useEffect(() => {
    // Create a definitive game state truth that includes all player scores
    const leaderboardState = {
      state: 'leaderboard',
      playerScores: sortedPlayers.map(player => ({
        name: player.name,
        score: player.score || 0
      })),
      timestamp: Date.now() + 5000,
      definitiveTruth: true
    };
    
    // Store and broadcast this state to all clients
    localStorage.setItem('leaderboard_scores', JSON.stringify(leaderboardState));
    
    // Custom event to ensure all components are aware of the definitive scores
    window.dispatchEvent(new CustomEvent('leaderboardScoresUpdated', { 
      detail: leaderboardState
    }));
    
    console.log('Broadcasting definitive leaderboard scores:', sortedPlayers);
  }, [sortedPlayers]);

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-4xl font-bold mb-8 text-primary">Leaderboard</h1>
      
      {sortedPlayers.length > 0 ? (
        <div className="w-full max-w-2xl">
          <div className="flex justify-center items-end gap-4 mb-8">
            {sortedPlayers.length > 1 && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-gray-400">
                  <span className="text-3xl font-bold text-gray-400">2</span>
                </div>
                <div className="text-center">
                  <div className="h-40 bg-gradient-to-t from-gray-600 to-gray-400 w-24 rounded-t-lg flex items-end justify-center pb-4">
                    <span className="text-white font-bold">{sortedPlayers[1].score || 0}</span>
                  </div>
                  <div className="bg-gray-200 text-gray-800 py-2 px-4 rounded-b-lg">
                    <span className="font-medium">{sortedPlayers[1].name}</span>
                  </div>
                </div>
              </div>
            )}
            
            {sortedPlayers.length > 0 && (
              <div className="flex flex-col items-center -mt-8">
                <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-yellow-400">
                  <span className="text-4xl font-bold text-yellow-400">1</span>
                </div>
                <div className="text-center">
                  <div className="h-52 bg-gradient-to-t from-yellow-600 to-yellow-400 w-32 rounded-t-lg flex items-end justify-center pb-4">
                    <span className="text-white font-bold">{sortedPlayers[0].score || 0}</span>
                  </div>
                  <div className="bg-yellow-100 text-yellow-800 py-2 px-4 rounded-b-lg">
                    <span className="font-medium">{sortedPlayers[0].name}</span>
                  </div>
                </div>
              </div>
            )}
            
            {sortedPlayers.length > 2 && (
              <div className="flex flex-col items-center">
                <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-amber-700">
                  <span className="text-3xl font-bold text-amber-700">3</span>
                </div>
                <div className="text-center">
                  <div className="h-32 bg-gradient-to-t from-amber-800 to-amber-500 w-24 rounded-t-lg flex items-end justify-center pb-4">
                    <span className="text-white font-bold">{sortedPlayers[2].score || 0}</span>
                  </div>
                  <div className="bg-amber-100 text-amber-800 py-2 px-4 rounded-b-lg">
                    <span className="font-medium">{sortedPlayers[2].name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {sortedPlayers.length > 3 && (
            <div className="card-trivia p-4">
              <div className="divide-y divide-border">
                {sortedPlayers.slice(3, 10).map((player, index) => (
                  <div key={player.id || index} className="flex justify-between items-center py-3">
                    <div className="flex items-center">
                      <span className="text-muted-foreground font-medium mr-4">{index + 4}</span>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    <span className="font-bold">{player.score || 0}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center text-muted-foreground">
          <p>No players have joined yet.</p>
        </div>
      )}
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
          <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
          <Button variant="outline" size="sm" onClick={onManualNext}>
            Force Next Question
          </Button>
        </div>
      )}
    </div>
  );
};
