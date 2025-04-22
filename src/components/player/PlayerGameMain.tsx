
import React from "react";
import { Trophy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlayerGameDevTools from "./PlayerGameDevTools";

interface PlayerGameMainProps {
  currentQuestion: any;
  selectedAnswer: string | null;
  isAnswerRevealed: boolean;
  answeredCorrectly: boolean | null;
  pendingPoints: number;
  score: number;
  timeLeft: number;
  handleSelectAnswer: (answer: string) => void;
  hasDevTools?: boolean;
  handleForceSync?: () => void;
}

const PlayerGameMain: React.FC<PlayerGameMainProps> = ({
  currentQuestion,
  selectedAnswer,
  isAnswerRevealed,
  answeredCorrectly,
  pendingPoints,
  score,
  timeLeft,
  handleSelectAnswer,
  hasDevTools,
  handleForceSync,
}) => {
  // Function to handle click on answer buttons
  const onAnswerClick = (option: string) => {
    console.log("Answer selected:", option);
    if (selectedAnswer === null && !isAnswerRevealed && timeLeft > 0) {
      handleSelectAnswer(option);
    }
  };

  return (
    <main className="flex-1 p-4 overflow-auto bg-gradient-to-b from-background to-background/80">
      <div className="card-trivia p-6 mb-6 shadow-lg">
        <h2 className="text-xl font-medium mb-4 text-trivia-text">{currentQuestion.text}</h2>
        <div className="grid grid-cols-1 gap-3 mt-4">
          {currentQuestion.options &&
            currentQuestion.options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => onAnswerClick(option)}
                disabled={selectedAnswer !== null || timeLeft === 0 || isAnswerRevealed}
                className={`p-4 rounded-lg text-left transition-all transform hover:scale-102 ${
                  selectedAnswer === option
                    ? isAnswerRevealed
                      ? option === currentQuestion.correctAnswer
                        ? "bg-gradient-to-r from-green-500 to-green-400 border-green-600 border-2 text-white shadow-md"
                        : "bg-gradient-to-r from-red-500 to-red-400 border-red-600 border-2 text-white shadow-md"
                      : "bg-gradient-to-r from-trivia-primary to-trivia-primary/80 border-trivia-primary border-2 text-white shadow-md"
                    : isAnswerRevealed && option === currentQuestion.correctAnswer
                    ? "bg-gradient-to-r from-green-500 to-green-400 border-green-600 border-2 text-white shadow-md"
                    : "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 border border-indigo-500/30 text-white shadow-sm"
                } ${
                  timeLeft === 0 || isAnswerRevealed
                    ? "cursor-default"
                    : "cursor-pointer active:scale-98"
                }`}
              >
                <div className="flex items-start">
                  <span className="mr-3 text-white/80 font-semibold flex items-center justify-center h-8 w-8 rounded-full bg-trivia-primary/30">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-white font-medium">{option}</span>
                </div>
              </button>
            ))}
        </div>
      </div>
      {isAnswerRevealed && (
        <div
          className={`p-4 rounded-lg mb-4 shadow-md ${
            answeredCorrectly 
              ? "bg-gradient-to-r from-green-500/20 to-green-400/20 border border-green-500/30 text-green-100" 
              : "bg-gradient-to-r from-red-500/20 to-red-400/20 border border-red-500/30 text-red-100"
          }`}
        >
          <div className="flex items-start">
            <div className="mr-3">
              {answeredCorrectly ? (
                <Trophy className="h-6 w-6 text-yellow-300" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-red-300" />
              )}
            </div>
            <div>
              <p className="font-medium text-lg">
                {answeredCorrectly ? "Correct!" : "Incorrect"}
              </p>
              <p className="text-sm">
                {answeredCorrectly
                  ? `You earned ${pendingPoints > 0 ? pendingPoints : score - (score - pendingPoints)
                    } points!`
                  : `The correct answer was: ${currentQuestion.correctAnswer}`}
              </p>
            </div>
          </div>
        </div>
      )}
      {hasDevTools && handleForceSync && (
        <PlayerGameDevTools handleForceSync={handleForceSync} />
      )}
    </main>
  );
};

export default PlayerGameMain;
