
import React from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Timer, AlertTriangle } from "lucide-react";

interface PlayerGameStatusProps {
  state: "loading" | "intermission" | "leaderboard" | "waiting" | "timeup";
  score: number;
  isRegistered: boolean;
  onForceSync?: () => void;
}

const PlayerGameStatus: React.FC<PlayerGameStatusProps> = ({
  state,
  score,
  isRegistered,
  onForceSync,
}) => {
  if (state === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#2B2464] to-[#1A1740] p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 rounded-xl shadow-lg">
          <div className="animate-pulse mb-6">
            <div className="h-6 w-24 bg-indigo-500/40 rounded mx-auto"></div>
          </div>
          <h2 className="text-2xl font-bold mb-4 text-white">Loading Game...</h2>
          <p className="text-lg mb-6 text-indigo-200">Please wait while we connect to your trivia game.</p>
          <div className="flex justify-center">
            <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }
  
  if (state === "intermission" || state === "leaderboard") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#2B2464] to-[#1A1740] p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-white">
            {state === "intermission" ? "Intermission" : "Leaderboard"}
          </h2>
          <p className="text-lg mb-6 text-indigo-200">The next question will appear shortly...</p>
          <div className="bg-indigo-800/50 p-6 rounded-lg mb-6 border border-indigo-500/40">
            <Trophy className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
            <p className="text-md font-medium text-indigo-200">Your Score</p>
            <p className="text-3xl font-bold text-white">{score}</p>
            {isRegistered && (
              <p className="text-sm text-indigo-300 mt-2">
                Your score will be saved to your account
              </p>
            )}
          </div>
          {process.env.NODE_ENV === "development" && onForceSync && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onForceSync} 
              className="mt-4 bg-indigo-600/30 border-indigo-500 text-indigo-200 hover:bg-indigo-500/50"
            >
              Force Sync
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  if (state === "waiting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#2B2464] to-[#1A1740] p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-white">Waiting for Game...</h2>
          <p className="text-lg mb-6 text-indigo-200">The host will start the game shortly.</p>
          <div className="flex justify-center mb-6">
            <div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          {process.env.NODE_ENV === "development" && onForceSync && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onForceSync} 
              className="mt-4 bg-indigo-600/30 border-indigo-500 text-indigo-200 hover:bg-indigo-500/50"
            >
              Force Sync
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  if (state === "timeup") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#2B2464] to-[#1A1740] p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40 rounded-xl shadow-lg">
          <Timer className="h-12 w-12 text-red-400 mx-auto mb-2" />
          <h2 className="text-2xl font-bold mb-4 text-white">Time's Up!</h2>
          <p className="text-lg mb-6 text-indigo-200">The next question will appear shortly...</p>
          <div className="bg-indigo-800/50 p-6 rounded-lg border border-indigo-500/40">
            <p className="text-md font-medium text-indigo-200">Your Score</p>
            <p className="text-3xl font-bold text-white">{score}</p>
          </div>
        </div>
      </div>
    );
  }
  
  return null;
};

export default PlayerGameStatus;
