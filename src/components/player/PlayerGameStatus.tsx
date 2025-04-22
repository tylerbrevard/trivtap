
import React from "react";
import { Button } from "@/components/ui/button";

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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
          <p className="text-lg mb-6">Please wait while we load your trivia game.</p>
        </div>
      </div>
    );
  }
  if (state === "intermission" || state === "leaderboard") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">
            {state === "intermission" ? "Intermission" : "Leaderboard"}
          </h2>
          <p className="text-lg mb-6">The next question will appear shortly...</p>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-md font-medium">Your Score</p>
            <p className="text-2xl font-bold text-primary">{score}</p>
            {isRegistered && (
              <p className="text-sm text-muted-foreground mt-2">
                Your score will be saved to your account
              </p>
            )}
          </div>
          {process.env.NODE_ENV === "development" && onForceSync && (
            <Button variant="outline" size="sm" onClick={onForceSync} className="mt-4">
              Force Sync
            </Button>
          )}
        </div>
      </div>
    );
  }
  if (state === "waiting") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Waiting for Game...</h2>
          <p className="text-lg mb-6">The host will start the game shortly.</p>
          {process.env.NODE_ENV === "development" && onForceSync && (
            <Button variant="outline" size="sm" onClick={onForceSync} className="mt-4">
              Force Sync
            </Button>
          )}
        </div>
      </div>
    );
  }
  if (state === "timeup") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Time's Up!</h2>
          <p className="text-lg mb-6">The next question will appear shortly...</p>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-md font-medium">Your Score</p>
            <p className="text-2xl font-bold text-primary">{score}</p>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default PlayerGameStatus;

