
import React from "react";
import { Button } from "@/components/ui/button";

interface PlayerGameDevToolsProps {
  handleForceSync: () => void;
}

const PlayerGameDevTools: React.FC<PlayerGameDevToolsProps> = ({
  handleForceSync,
}) => {
  return (
    <div className="mt-4 p-4 border border-dashed border-purple-500/30 rounded bg-purple-900/10">
      <h3 className="text-purple-300 font-bold mb-2">Dev Tools</h3>
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleForceSync();
          }}
          className="bg-purple-800/50 hover:bg-purple-700/50 text-purple-100 border-purple-600/50"
        >
          Force Sync with Display
        </Button>
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            localStorage.removeItem('gameState');
            console.log('Cleared gameState from localStorage');
          }}
          className="bg-red-800/50 hover:bg-red-700/50 text-red-100 border-red-600/50"
        >
          Clear Game State
        </Button>
        <Button
          variant="outline"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Current localStorage:', {
              gameState: JSON.parse(localStorage.getItem('gameState') || '{}'),
              displayTruth: JSON.parse(localStorage.getItem('gameState_display_truth') || '{}'),
              playerName: sessionStorage.getItem('playerName'),
              gameId: sessionStorage.getItem('gameId')
            });
          }}
          className="bg-blue-800/50 hover:bg-blue-700/50 text-blue-100 border-blue-600/50"
        >
          Log Debug Info
        </Button>
      </div>
    </div>
  );
};

export default PlayerGameDevTools;
