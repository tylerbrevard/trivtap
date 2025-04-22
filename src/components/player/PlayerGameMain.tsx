
import React, { useEffect, useState, useRef } from "react";
import { Trophy, AlertTriangle, Check } from "lucide-react";
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
  // Simplified approach with direct state management
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string>("");
  const [buttonClicked, setButtonClicked] = useState<number | null>(null);
  
  // Force update on props change
  useEffect(() => {
    setInternalSelected(selectedAnswer);
  }, [selectedAnswer]);
  
  // Reset when question changes
  useEffect(() => {
    if (currentQuestion) {
      console.log("New question detected, resetting internal state");
      setInternalSelected(null);
      setButtonClicked(null);
      setDebugInfo("");
    }
  }, [currentQuestion?.text]);
  
  // Direct click handler with immediate visual feedback
  const handleDirectClick = (option: string, index: number) => {
    // Log the click event for debugging
    const clickTime = new Date().toLocaleTimeString();
    const logMessage = `CLICK: Answer ${option} (index: ${index}) at ${clickTime}. Time left: ${timeLeft}s, Selected: ${selectedAnswer || 'None'}`;
    console.log(logMessage);
    setDebugInfo(logMessage);
    
    // Set internal selection for immediate feedback
    setInternalSelected(option);
    setButtonClicked(index);
    
    // Dispatch a custom event to aid debugging
    document.dispatchEvent(new CustomEvent('answerClicked', { 
      detail: { option, index, timestamp: Date.now() }
    }));
    
    // Call the parent handler
    handleSelectAnswer(option);
    
    // Update the UI to show the selection visually
    setTimeout(() => {
      const buttons = document.querySelectorAll('[data-testid^="answer-option-"]');
      buttons.forEach((btn, i) => {
        if (i === index) {
          btn.classList.add('answer-selected');
        }
      });
    }, 50);
  };

  // Ensure we have a valid question object
  if (!currentQuestion || !currentQuestion.options) {
    return <div className="p-4">Loading question...</div>;
  }

  return (
    <main className="flex-1 p-4 overflow-auto bg-gradient-to-b from-[#2B2464] to-[#1A1740]">
      <div className="card-trivia p-6 mb-6 shadow-lg rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40">
        <h2 className="text-xl font-bold mb-4 text-white">{currentQuestion.text}</h2>
        <div className="grid grid-cols-1 gap-4 mt-6">
          {currentQuestion.options.map((option: string, index: number) => {
            // Determine button appearance based on state
            let buttonClass = "p-5 rounded-lg text-left transition-all duration-200";
            
            if (isAnswerRevealed) {
              // Answer is revealed - show correct/incorrect states
              if (option === currentQuestion.correctAnswer) {
                buttonClass += " bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-md";
              } else if (option === internalSelected || option === selectedAnswer) {
                buttonClass += " bg-gradient-to-r from-red-500 to-red-400 border-2 border-red-300 text-white shadow-md";
              } else {
                buttonClass += " bg-gradient-to-r from-[#7E69AB]/70 to-[#9B87F5]/70 border border-[#D6BCFA]/50 text-white/80";
              }
            } else {
              // Answer not revealed - show selection state
              if ((option === internalSelected || option === selectedAnswer) || buttonClicked === index) {
                buttonClass += " bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] border-2 border-[#D6BCFA] text-white shadow-md animate-pulse";
              } else {
                buttonClass += " bg-gradient-to-r from-[#7E69AB]/90 to-[#9B87F5]/90 hover:from-[#7E69AB] hover:to-[#9B87F5] border border-[#D6BCFA]/70 text-white shadow-lg cursor-pointer";
              }
            }
            
            // Add active state and transform for tactile feedback
            buttonClass += " active:scale-[0.98] active:shadow-inner";
            
            const isDisabled = isAnswerRevealed || timeLeft <= 0;
            
            return (
              <button
                key={index}
                className={buttonClass}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  if (!isAnswerRevealed && timeLeft > 0) {
                    handleDirectClick(option, index);
                  } else {
                    console.log("Click ignored - answer revealed or time up");
                  }
                }}
                type="button"
                data-option={option}
                data-index={index}
                data-testid={`answer-option-${index}`}
                data-clickable={!isDisabled ? "true" : "false"}
                data-selected={option === internalSelected || option === selectedAnswer ? "true" : "false"}
                disabled={isDisabled}
              >
                <div className="flex items-center">
                  <span className="mr-4 text-white font-bold flex items-center justify-center h-10 w-10 rounded-full bg-[#8B5CF6]/50 shadow-inner">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-white font-medium text-lg">{option}</span>
                  
                  {/* Selection indicator */}
                  {((option === internalSelected || option === selectedAnswer) || buttonClicked === index) && (
                    <span className="ml-auto">
                      <Check className="h-6 w-6 text-white" />
                    </span>
                  )}
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
      
      {/* Simplified debug info */}
      <div className="mt-4 p-3 border border-dashed border-yellow-500/30 rounded bg-yellow-900/10 text-yellow-200 text-xs">
        <p>Status: {internalSelected ? `Selected "${internalSelected}"` : 'No selection'} | Time: {timeLeft}s | Revealed: {isAnswerRevealed ? 'Yes' : 'No'}</p>
        {buttonClicked !== null && <p>Button clicked: Option {String.fromCharCode(65 + buttonClicked)}</p>}
        {debugInfo && <p className="text-orange-200">{debugInfo}</p>}
      </div>
      
      {hasDevTools && handleForceSync && (
        <PlayerGameDevTools handleForceSync={handleForceSync} />
      )}
    </main>
  );
};

export default PlayerGameMain;
