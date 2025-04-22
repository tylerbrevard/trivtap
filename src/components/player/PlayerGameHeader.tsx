
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
}) => {
  // Function to determine time color based on remaining time
  const getTimeColor = () => {
    if (timeLeft > 20) return "text-green-400";
    if (timeLeft > 10) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <header className="p-4 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-trivia-primary to-trivia-accent bg-clip-text text-transparent">
          Question {questionIndex + 1}
        </h1>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-trivia-primary/20 to-trivia-accent/20 border border-trivia-primary/30 text-white px-3 py-1 rounded-full shadow-sm">
            <span className="font-medium">Score: {score}</span>
          </div>
          <div className={`flex items-center gap-1 ${getTimeColor()}`}>
            <Clock className="h-4 w-4" />
            <span className="font-medium">{timeLeft || 0}s</span>
          </div>
        </div>
      </div>
      {timeLeft > 0 && (
        <div className="w-full h-1 bg-gray-700 rounded-full mt-2 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-trivia-primary to-trivia-accent rounded-full transition-all duration-1000"
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          ></div>
        </div>
      )}
    </header>
  );
};

export default PlayerGameHeader;
