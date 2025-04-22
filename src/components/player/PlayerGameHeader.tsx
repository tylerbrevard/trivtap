
import React, { useEffect, useState, useRef } from "react";
import { Timer, Trophy } from "lucide-react";

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
  // Local state for smooth timer display
  const [displayTime, setDisplayTime] = useState(timeLeft);
  // Update the type to NodeJS.Timeout which is the correct type for setTimeout/setInterval
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Update display time when parent timeLeft changes
  useEffect(() => {
    // Clear any existing interval
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Immediately update displayTime to match parent
    setDisplayTime(timeLeft);
    
    if (timeLeft > 0) {
      // Set up interval for smooth countdown
      const startTime = Date.now();
      const initialValue = timeLeft;
      
      const tickInterval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const newTime = Math.max(0, Math.floor(initialValue - elapsed));
        
        setDisplayTime(newTime);
        
        // Stop interval when time reaches 0
        if (newTime <= 0) {
          clearInterval(tickInterval);
        }
      }, 200);
      
      timerRef.current = tickInterval;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft]);
  
  // Function to determine time color based on remaining time
  const getTimeColor = () => {
    if (displayTime > 20) return "text-green-400";
    if (displayTime > 10) return "text-yellow-400";
    return "text-red-400 animate-pulse";
  };

  return (
    <header className="p-4 border-b border-indigo-500/30 bg-gradient-to-r from-[#2B2464] to-[#1A1740] backdrop-blur-sm sticky top-0 z-10">
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
          Question {questionIndex + 1}
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-gradient-to-r from-indigo-600/40 to-purple-600/40 border border-indigo-500/40 text-white px-4 py-1.5 rounded-full shadow-md">
            <Trophy className="h-4 w-4 mr-1 text-yellow-300" />
            <span className="font-bold">{score}</span>
            <span className="text-indigo-200 ml-1">pts</span>
          </div>
          <div className={`flex items-center gap-1 ${getTimeColor()}`}>
            <Timer className="h-5 w-5" />
            <span 
              className="font-bold" 
              data-time-value={displayTime}
              data-testid="timer-display"
            >
              {displayTime}s
            </span>
          </div>
        </div>
      </div>
      {displayTime > 0 && (
        <div className="w-full h-2 bg-indigo-900/50 rounded-full mt-3 overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-200 ease-linear"
            style={{ width: `${(displayTime / 30) * 100}%` }}
            data-testid="timer-progress"
          ></div>
        </div>
      )}
    </header>
  );
};

export default PlayerGameHeader;
