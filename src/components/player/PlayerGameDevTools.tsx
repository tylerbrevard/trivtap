
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw } from "lucide-react";

interface PlayerGameDevToolsProps {
  handleForceSync: () => void;
}

const PlayerGameDevTools: React.FC<PlayerGameDevToolsProps> = ({
  handleForceSync,
}) => (
  <div className="mt-4 border border-dashed border-gray-500 p-4 rounded-md bg-gray-900/50">
    <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
    <div className="flex gap-3">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleForceSync}
        className="flex items-center gap-1"
      >
        <RefreshCw className="h-4 w-4 mr-1" />
        Force Sync
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          localStorage.removeItem("gameState");
          window.location.reload();
        }}
        className="flex items-center gap-1"
      >
        <RotateCcw className="h-4 w-4 mr-1" />
        Reset Game
      </Button>
    </div>
  </div>
);

export default PlayerGameDevTools;
