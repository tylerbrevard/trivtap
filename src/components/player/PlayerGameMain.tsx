
import React, { useState, useEffect } from "react";
import { Trophy, AlertTriangle, Check } from "lucide-react";
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
  currentGameState?: string;
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
  currentGameState = "question"
}) => {
  // Track the locally selected answer for immediate feedback
  const [localSelectedAnswer, setLocalSelectedAnswer] = useState<string | null>(null);
  // Track if we're currently processing a click to prevent double-clicks
  const [isProcessingClick, setIsProcessingClick] = useState(false);
  // Debug information
  const [debugMsg, setDebugMsg] = useState("");
  // Track number of clicks for debugging
  const [clickCount, setClickCount] = useState(0);
  
  // Reset local selection when the question or global selection changes
  useEffect(() => {
    setLocalSelectedAnswer(selectedAnswer);
  }, [selectedAnswer, currentQuestion?.text]);
  
  // Handle clicking an answer option
  const handleAnswerClick = (answer: string) => {
    console.log(`Answer clicked: ${answer}, timeLeft: ${timeLeft}, isAnswerRevealed: ${isAnswerRevealed}`);
    
    // Increment click counter for debugging
    setClickCount(prev => prev + 1);
    
    // Don't process if time's up or answer is revealed
    if (timeLeft <= 0 || isAnswerRevealed) {
      console.log("Click ignored: time's up or answer already revealed");
      setDebugMsg(`Click ignored: ${timeLeft <= 0 ? "time's up" : "answer revealed"}`);
      return;
    }
    
    // Don't process if we already have a selection (either local or global)
    if (localSelectedAnswer || selectedAnswer) {
      console.log("Click ignored: answer already selected");
      setDebugMsg("Click ignored: already selected an answer");
      return;
    }
    
    // Set processing flag to prevent double-clicks
    setIsProcessingClick(true);
    
    // Update local state immediately for visual feedback
    setLocalSelectedAnswer(answer);
    
    // Log click for debugging
    setDebugMsg(`Selected: ${answer} at ${new Date().toLocaleTimeString()}`);
    
    // Call the parent handler
    handleSelectAnswer(answer);
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      setIsProcessingClick(false);
    }, 300);
  };

  // Ensure we have a valid question
  if (!currentQuestion || !currentQuestion.options) {
    return <div className="p-4 text-center">Loading question...</div>;
  }

  return (
    <main className="flex-1 p-4 overflow-auto bg-gradient-to-b from-[#2B2464] to-[#1A1740]">
      <div className="card-trivia p-6 mb-6 shadow-lg rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40">
        <h2 className="text-xl font-bold mb-4 text-white">{currentQuestion.text}</h2>
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          {currentQuestion.options.map((option: string, index: number) => {
            // Base button classes
            let buttonClasses = "p-5 rounded-lg text-left transition-all duration-200 relative";
            
            // Determine if this option is selected (either locally or globally)
            const isSelected = option === localSelectedAnswer || option === selectedAnswer;
            
            // Determine button appearance based on game state
            if (isAnswerRevealed) {
              // Answer reveal state
              if (option === currentQuestion.correctAnswer) {
                // Correct answer
                buttonClasses += " bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-md";
              } else if (isSelected) {
                // Selected but incorrect
                buttonClasses += " bg-gradient-to-r from-red-500 to-red-400 border-2 border-red-300 text-white shadow-md";
              } else {
                // Not selected and not correct
                buttonClasses += " bg-gradient-to-r from-[#7E69AB]/70 to-[#9B87F5]/70 border border-[#D6BCFA]/50 text-white/80";
              }
            } else {
              // Question state
              if (isSelected) {
                // Selected option
                buttonClasses += " bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] border-2 border-[#D6BCFA] text-white shadow-md animate-pulse";
              } else {
                // Unselected option
                buttonClasses += " bg-gradient-to-r from-[#7E69AB]/90 to-[#9B87F5]/90 hover:from-[#7E69AB] hover:to-[#9B87F5] border border-[#D6BCFA]/70 text-white shadow-lg cursor-pointer";
              }
            }
            
            // Add active state for tactile feedback
            buttonClasses += " active:scale-[0.98] active:shadow-inner";
            
            // Determine if button should be disabled
            const isDisabled = isAnswerRevealed || timeLeft <= 0 || isProcessingClick || isSelected;
            
            return (
              <button
                key={index}
                className={buttonClasses}
                onClick={() => handleAnswerClick(option)}
                disabled={isDisabled}
                type="button"
                data-testid={`answer-option-${index}`}
                data-option={option}
                data-clickable={!isDisabled ? "true" : "false"}
                data-selected={isSelected ? "true" : "false"}
                data-index={index}
              >
                <div className="flex items-center">
                  <span className="mr-4 text-white font-bold flex items-center justify-center h-10 w-10 rounded-full bg-[#8B5CF6]/50 shadow-inner">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-white font-medium text-lg">{option}</span>
                  
                  {/* Selection indicator */}
                  {isSelected && (
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
      
      {/* Answer result notification */}
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
                  ? `You earned ${pendingPoints} points!`
                  : `The correct answer was: ${currentQuestion.correctAnswer}`}
              </p>
            </div>
          </div>
        </div>
      )}
      
      {/* Debug information */}
      <div className="mt-4 p-3 border border-dashed border-yellow-500/30 rounded bg-yellow-900/10 text-yellow-200 text-xs">
        <p>Debug: Last Click: {debugMsg || 'None'}</p>
        <p>Selected: {selectedAnswer || 'None'} | Local: {localSelectedAnswer || 'None'} | Time: {timeLeft}s | Revealed: {isAnswerRevealed ? 'Yes' : 'No'}</p>
        <p>Click Count: {clickCount} | Processing: {isProcessingClick ? 'Yes' : 'No'}</p>
      </div>
      
      {/* Dev tools */}
      {hasDevTools && handleForceSync && (
        <PlayerGameDevTools 
          handleForceSync={handleForceSync} 
          debugInfo={{
            selectedAnswer,
            timeLeft,
            isAnswerRevealed,
            clicksRegistered: clickCount,
            currentState: currentGameState || "question"
          }}
        />
      )}
    </main>
  );
};

export default PlayerGameMain;
