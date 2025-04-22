
import React, { useEffect, useState } from "react";
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
  // Track button clicks for debugging
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  
  // Debug log to verify props being received
  useEffect(() => {
    console.log("PlayerGameMain props:", { 
      currentQuestion: currentQuestion?.text, 
      selectedAnswer, 
      isAnswerRevealed, 
      timeLeft 
    });
  }, [currentQuestion, selectedAnswer, isAnswerRevealed, timeLeft]);

  // Function to handle click on answer buttons - completely rewritten
  const onAnswerClick = (option: string) => {
    // Record click time and log details
    const now = Date.now();
    setLastClickTime(now);
    console.log(`CLICK EVENT: Answer ${option} clicked at ${now}. Time left: ${timeLeft}, Selected: ${selectedAnswer}, Revealed: ${isAnswerRevealed}`);
    
    // Only allow answer selection if no answer is already selected, answer is not revealed, and there's time left
    if (selectedAnswer === null && !isAnswerRevealed && timeLeft > 0) {
      console.log(`ATTEMPTING TO SELECT ANSWER: ${option}`);
      handleSelectAnswer(option);
    } else {
      console.log(`ANSWER SELECTION BLOCKED. Reason: ${selectedAnswer !== null ? 'Already answered' : isAnswerRevealed ? 'Answer revealed' : 'No time left'}`);
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
            let buttonClass = "p-5 rounded-lg text-left transition-all cursor-pointer ";
            
            // Base style for all buttons - brighter and more engaging
            buttonClass += "bg-gradient-to-r from-[#7E69AB]/90 to-[#9B87F5]/90 hover:from-[#7E69AB] hover:to-[#9B87F5] border border-[#D6BCFA]/70 text-white shadow-lg ";
            
            // Add specific styles based on selection state
            if (selectedAnswer === option) {
              if (isAnswerRevealed) {
                // Revealed and selected
                buttonClass = option === currentQuestion.correctAnswer
                  ? "p-5 rounded-lg text-left bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-md cursor-default"
                  : "p-5 rounded-lg text-left bg-gradient-to-r from-red-500 to-red-400 border-2 border-red-300 text-white shadow-md cursor-default";
              } else {
                // Selected but not revealed
                buttonClass = "p-5 rounded-lg text-left bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] border-2 border-[#D6BCFA] text-white shadow-md cursor-default";
              }
            } else if (isAnswerRevealed && option === currentQuestion.correctAnswer) {
              // Correct answer when revealed
              buttonClass = "p-5 rounded-lg text-left bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-md cursor-default";
            }
            
            // Add active state for better feedback
            if (selectedAnswer === null && !isAnswerRevealed && timeLeft > 0) {
              buttonClass += " active:scale-[0.98] active:bg-[#8B5CF6]";
            } else {
              buttonClass += " opacity-90 pointer-events-auto"; // Still allow clicks for better UX but style differently
            }
            
            return (
              <button
                key={index}
                onClick={(e) => {
                  // Stop any potential event propagation issues
                  e.stopPropagation();
                  onAnswerClick(option);
                }}
                className={buttonClass}
                // Important: Changed from type="button" to role="button" for better accessibility
                role="button"
                aria-pressed={selectedAnswer === option}
                // Using data attributes for debugging
                data-option={option}
                data-index={index}
                data-testid={`answer-option-${index}`}
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
      
      {/* Debugging info displayed only in development mode */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-3 border border-dashed border-yellow-500/30 rounded bg-yellow-900/10 text-yellow-200 text-xs">
          <p>Debug: Last Click: {lastClickTime > 0 ? new Date(lastClickTime).toLocaleTimeString() : 'None'}</p>
          <p>Selected: {selectedAnswer || 'None'} | Time: {timeLeft}s | Revealed: {isAnswerRevealed ? 'Yes' : 'No'}</p>
        </div>
      )}
      
      {hasDevTools && handleForceSync && (
        <PlayerGameDevTools handleForceSync={handleForceSync} />
      )}
    </main>
  );
};

export default PlayerGameMain;
