
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
    console.log("Answer clicked:", option);
    // Only allow answer selection if no answer is already selected, answer is not revealed, and there's time left
    if (selectedAnswer === null && !isAnswerRevealed && timeLeft > 0) {
      handleSelectAnswer(option);
    }
  };

  // Ensure we have a valid question object
  if (!currentQuestion || !currentQuestion.options) {
    console.error("Invalid question data:", currentQuestion);
    return <div className="p-4">Loading question...</div>;
  }

  return (
    <main className="flex-1 p-4 overflow-auto bg-gradient-to-b from-background to-background/80">
      <div className="card-trivia p-6 mb-6 shadow-lg rounded-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
        <h2 className="text-xl font-bold mb-4 text-white">{currentQuestion.text}</h2>
        <div className="grid grid-cols-1 gap-4 mt-6">
          {currentQuestion.options.map((option: string, index: number) => (
            <button
              key={index}
              onClick={() => onAnswerClick(option)}
              disabled={selectedAnswer !== null || timeLeft === 0 || isAnswerRevealed}
              className={`p-5 rounded-lg text-left transition-all transform hover:scale-[1.02] ${
                selectedAnswer === option
                  ? isAnswerRevealed
                    ? option === currentQuestion.correctAnswer
                      ? "bg-gradient-to-r from-green-500 to-green-400 border-green-600 border-2 text-white shadow-md"
                      : "bg-gradient-to-r from-red-500 to-red-400 border-red-600 border-2 text-white shadow-md"
                    : "bg-gradient-to-r from-trivia-primary to-trivia-primary/80 border-trivia-primary border-2 text-white shadow-md"
                  : isAnswerRevealed && option === currentQuestion.correctAnswer
                  ? "bg-gradient-to-r from-green-500 to-green-400 border-green-600 border-2 text-white shadow-md"
                  : "bg-gradient-to-r from-indigo-500/40 to-purple-500/40 hover:from-indigo-500/60 hover:to-purple-500/60 border border-indigo-500/50 text-white shadow-lg"
              } ${
                timeLeft === 0 || isAnswerRevealed
                  ? "cursor-default opacity-80"
                  : "cursor-pointer active:scale-[0.98]"
              }`}
            >
              <div className="flex items-center">
                <span className="mr-4 text-white font-bold flex items-center justify-center h-10 w-10 rounded-full bg-trivia-primary/50 shadow-inner">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-white font-medium text-lg">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>
      {isAnswerRevealed && (
        <div
          className={`p-5 rounded-lg mb-4 shadow-lg ${
            answeredCorrectly 
              ? "bg-gradient-to-r from-green-500/20 to-green-400/20 border border-green-500/30 text-green-100" 
              : "bg-gradient-to-r from-red-500/20 to-red-400/20 border border-red-500/30 text-red-100"
          }`}
        >
          <div className="flex items-start">
            <div className="mr-4 mt-1">
              {answeredCorrectly ? (
                <Trophy className="h-7 w-7 text-yellow-300" />
              ) : (
                <AlertTriangle className="h-7 w-7 text-red-300" />
              )}
            </div>
            <div>
              <p className="font-bold text-xl">
                {answeredCorrectly ? "Correct!" : "Incorrect"}
              </p>
              <p className="text-md">
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
