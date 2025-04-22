
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw } from "lucide-react";

interface PlayerGameDevToolsProps {
  handleForceSync: () => void;
}

const PlayerGameDevTools: React.FC<PlayerGameDevToolsProps> = ({
  handleForceSync,
}) => (
  <div className="mt-4 border border-dashed border-purple-500/50 p-4 rounded-md bg-indigo-900/50">
    <p className="text-sm text-purple-300 mb-2">Development Controls</p>
    <div className="flex gap-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={(e) => {
          e.preventDefault();
          console.log("Force sync button clicked");
          handleForceSync();
        }}
        className="flex items-center gap-1 bg-indigo-800/50 hover:bg-indigo-700/50 border-purple-500/50 text-purple-200"
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Force Sync
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={(e) => {
          e.preventDefault();
          console.log("Reset game button clicked");
          localStorage.removeItem("gameState");
          window.location.reload();
        }}
        className="flex items-center gap-1 bg-indigo-800/50 hover:bg-indigo-700/50 border-purple-500/50 text-purple-200"
      >
        <RotateCcw className="h-4 w-4 mr-1" />
        Reset Game
      </Button>
    </div>
  </div>
);

export default PlayerGameDevTools;
