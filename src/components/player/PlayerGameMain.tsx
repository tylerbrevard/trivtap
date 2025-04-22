
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
    <main className="flex-1 p-4 overflow-auto bg-gradient-to-b from-[#2B2464] to-[#1A1740]">
      <div className="card-trivia p-6 mb-6 shadow-lg rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40">
        <h2 className="text-xl font-bold mb-4 text-white">{currentQuestion.text}</h2>
        <div className="grid grid-cols-1 gap-4 mt-6">
          {currentQuestion.options.map((option: string, index: number) => {
            // Determine the button class based on selection and answer state
            let buttonClass = "p-5 rounded-lg text-left transition-all transform hover:scale-[1.02] ";
            
            // Base style for all buttons
            buttonClass += "bg-gradient-to-r from-[#7E69AB]/80 to-[#9B87F5]/80 hover:from-[#7E69AB] hover:to-[#9B87F5] border border-[#D6BCFA]/50 text-white shadow-lg ";
            
            // Add specific styles based on selection state
            if (selectedAnswer === option) {
              if (isAnswerRevealed) {
                // Revealed and selected
                buttonClass = option === currentQuestion.correctAnswer
                  ? "p-5 rounded-lg text-left bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-md"
                  : "p-5 rounded-lg text-left bg-gradient-to-r from-red-500 to-red-400 border-2 border-red-300 text-white shadow-md";
              } else {
                // Selected but not revealed
                buttonClass = "p-5 rounded-lg text-left bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] border-2 border-[#D6BCFA] text-white shadow-md";
              }
            } else if (isAnswerRevealed && option === currentQuestion.correctAnswer) {
              // Correct answer when revealed
              buttonClass = "p-5 rounded-lg text-left bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-md";
            }
            
            // Add disabled styling if needed
            if (selectedAnswer !== null || timeLeft === 0 || isAnswerRevealed) {
              buttonClass += " opacity-80";
            } else {
              buttonClass += " cursor-pointer active:scale-[0.98]";
            }
            
            return (
              <button
                key={index}
                onClick={() => onAnswerClick(option)}
                disabled={selectedAnswer !== null || timeLeft === 0 || isAnswerRevealed}
                className={buttonClass}
              >
                <div className="flex items-center">
                  <span className="mr-4 text-white font-bold flex items-center justify-center h-10 w-10 rounded-full bg-[#8B5CF6]/50 shadow-inner">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-white font-medium text-lg">{option}</span>
                </div>
              </button>
            );
          })}
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
                  ? `You earned ${pendingPoints > 0 ? pendingPoints : score - (score - pendingPoints)} points!`
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
