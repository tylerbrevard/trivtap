
import React from "react";
import { Clock } from "lucide-react";

interface PlayerGameHeaderProps {
  questionIndex: number;
  score: number;
  timeLeft: number;
}

const PlayerGameHeader: React.FC<PlayerGameHeaderProps> = ({
  questionIndex,
  score,
  timeLeft,
}) => (
  <header className="p-4 border-b border-border">
    <div className="flex justify-between items-center">
      <h1 className="text-xl font-bold text-primary">Question {questionIndex + 1}</h1>
      <div className="flex items-center gap-2">
        <div className="bg-primary/10 text-primary px-3 py-1 rounded-full">
          <span className="font-medium">Score: {score}</span>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{timeLeft || 0}s</span>
        </div>
      </div>
    </div>
  </header>
);

export default PlayerGameHeader;

