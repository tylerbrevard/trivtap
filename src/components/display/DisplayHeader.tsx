
import React from "react";
import { Button } from "@/components/ui/button";

interface DisplayHeaderProps {
  id: string | undefined;
  uniquePlayersCount: number;
  displayedQuestionCount: number;
  forceSync: () => void;
  toast: (opts: { title: string; description: string }) => void;
}

export const DisplayHeader = ({
  id,
  uniquePlayersCount,
  displayedQuestionCount,
  forceSync,
  toast,
}: DisplayHeaderProps) => (
  <header className="p-4 border-b border-border">
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-primary">TrivTap</h1>
      <div className="flex items-center gap-4">
        <div className="bg-primary/20 text-primary px-3 py-1 rounded-full">
          Display {id && id !== "default" ? `#${id}` : ""}
        </div>
        <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full">
          Players: {uniquePlayersCount}
        </div>
        <div className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full">
          Questions: {displayedQuestionCount}
        </div>
        {process.env.NODE_ENV === "development" && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              forceSync();
              toast({
                title: "Force Sync",
                description: "Forcing synchronization of game state",
              });
            }}
          >
            Force Sync
          </Button>
        )}
      </div>
    </div>
  </header>
);

