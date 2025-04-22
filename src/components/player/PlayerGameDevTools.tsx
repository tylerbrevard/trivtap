
import React from "react";
import { Button } from "@/components/ui/button";

interface PlayerGameDevToolsProps {
  handleForceSync: () => void;
}

const PlayerGameDevTools: React.FC<PlayerGameDevToolsProps> = ({
  handleForceSync,
}) => (
  <div className="mt-4 border border-dashed border-gray-300 p-3 rounded-md">
    <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
    <div className="flex gap-2">
      <Button variant="outline" size="sm" onClick={handleForceSync}>
        Force Sync
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          localStorage.removeItem("gameState");
          window.location.reload();
        }}
      >
        Reset Game
      </Button>
    </div>
  </div>
);

export default PlayerGameDevTools;
