
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
  // Track button clicks for debugging
  const [lastClickTime, setLastClickTime] = useState<number>(0);
  const [clickDebugInfo, setClickDebugInfo] = useState<string>("");
  
  // Use local state for immediate visual feedback
  const [localSelectedAnswer, setLocalSelectedAnswer] = useState<string | null>(null);
  
  // Click count for debugging stuck clicks
  const [clickCount, setClickCount] = useState<number>(0);
  
  // Use refs to track click status
  const clicksRef = useRef<Record<string, number>>({});
  const processingClickRef = useRef<boolean>(false);
  
  // Debug log to verify props being received
  useEffect(() => {
    console.log("PlayerGameMain props update:", { 
      currentQuestion: currentQuestion?.text,
      selectedAnswer, 
      localSelectedAnswer,
      isAnswerRevealed, 
      timeLeft,
      timeLeftType: typeof timeLeft,
      clickCount
    });
  }, [currentQuestion, selectedAnswer, localSelectedAnswer, isAnswerRevealed, timeLeft, clickCount]);

  // Sync local selection with parent component selection
  useEffect(() => {
    setLocalSelectedAnswer(selectedAnswer);
  }, [selectedAnswer]);
  
  // Reset local state when question changes
  useEffect(() => {
    if (currentQuestion) {
      console.log("New question detected, resetting local state");
      setLocalSelectedAnswer(null);
      setClickCount(0);
      clicksRef.current = {};
      processingClickRef.current = false;
    }
  }, [currentQuestion?.text]);

  // Function to handle click on answer buttons with improved logging and guarantees
  const onAnswerClick = (option: string, index: number) => {
    // Record click timestamp
    const now = Date.now();
    setLastClickTime(now);
    
    // Increment click counter (for debugging)
    setClickCount(prev => prev + 1);
    
    // Track clicks per option
    clicksRef.current[option] = (clicksRef.current[option] || 0) + 1;
    
    // Create detailed click log
    const clickLog = `CLICK EVENT: Answer ${option} (index: ${index}) clicked at ${new Date(now).toLocaleTimeString()}. Time left: ${timeLeft}, Selected: ${selectedAnswer || 'None'}, Revealed: ${isAnswerRevealed ? 'Yes' : 'No'}, Click #${clicksRef.current[option]}`;
    console.log(clickLog);
    setClickDebugInfo(clickLog);
    
    // Set local selection for immediate visual feedback
    setLocalSelectedAnswer(option);
    
    // Prevent multiple rapid clicks from causing issues
    if (processingClickRef.current) {
      console.log("Click processing in progress, waiting...");
      
      // Create a delayed call to ensure the click is processed
      setTimeout(() => {
        if (!selectedAnswer) {
          console.log("Delayed click processing for:", option);
          handleSelectAnswer(option);
        }
      }, 500);
      
      return;
    }
    
    // Set processing flag
    processingClickRef.current = true;
    
    // Call the handler to update parent state
    console.log(`ATTEMPTING TO SELECT ANSWER: ${option}`);
    handleSelectAnswer(option);
    
    // Force a DOM event to ensure click is registered
    document.dispatchEvent(new CustomEvent('answerSelected', { 
      detail: { option, index, timestamp: now, clickCount: clicksRef.current[option] } 
    }));
    
    // Clear processing flag after a short delay
    setTimeout(() => {
      processingClickRef.current = false;
    }, 300);
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
            // Determine button styles based on selection state for better visual feedback
            let buttonClass = "p-5 rounded-lg text-left transition-all";
            
            // Base style for all buttons - brighter and more engaging
            if (localSelectedAnswer === option || selectedAnswer === option) {
              // Selected but not revealed - make this state very visible
              buttonClass += " bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] border-2 border-[#D6BCFA] text-white shadow-md cursor-pointer animate-pulse";
              
              if (isAnswerRevealed) {
                // Revealed and selected
                buttonClass = option === currentQuestion.correctAnswer
                  ? "p-5 rounded-lg text-left bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-md"
                  : "p-5 rounded-lg text-left bg-gradient-to-r from-red-500 to-red-400 border-2 border-red-300 text-white shadow-md";
              }
            } else if (isAnswerRevealed && option === currentQuestion.correctAnswer) {
              // Correct answer when revealed
              buttonClass += " bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-md";
            } else {
              // Default state (not selected)
              buttonClass += " bg-gradient-to-r from-[#7E69AB]/90 to-[#9B87F5]/90 hover:from-[#7E69AB] hover:to-[#9B87F5] border border-[#D6BCFA]/70 text-white shadow-lg cursor-pointer";
            }
            
            // Add active state for immediate feedback
            buttonClass += " active:scale-[0.98] active:bg-[#8B5CF6]";
            
            const isDisabled = isAnswerRevealed || timeLeft <= 0;
            
            return (
              <button
                key={index}
                onClick={(e) => {
                  // Prevent default to ensure the click is captured
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Only allow clicks when appropriate
                  if (!isAnswerRevealed && timeLeft > 0) {
                    onAnswerClick(option, index);
                  } else {
                    console.log("Click ignored - answer revealed or time up:", {
                      isAnswerRevealed,
                      timeLeft
                    });
                  }
                }}
                className={buttonClass}
                type="button"
                data-option={option}
                data-index={index}
                data-testid={`answer-option-${index}`}
                data-clickable={!isDisabled ? "true" : "false"}
                disabled={isDisabled}
              >
                <div className="flex items-center">
                  <span className="mr-4 text-white font-bold flex items-center justify-center h-10 w-10 rounded-full bg-[#8B5CF6]/50 shadow-inner">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-white font-medium text-lg">{option}</span>
                  {(localSelectedAnswer === option || selectedAnswer === option) && (
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
      
      {/* Enhanced debugging info with more details */}
      <div className="mt-4 p-3 border border-dashed border-yellow-500/30 rounded bg-yellow-900/10 text-yellow-200 text-xs">
        <p>Debug: Last Click: {lastClickTime > 0 ? new Date(lastClickTime).toLocaleTimeString() : 'None'}</p>
        <p>Selected: {selectedAnswer || 'None'} | Local: {localSelectedAnswer || 'None'} | Time: {timeLeft}s | Revealed: {isAnswerRevealed ? 'Yes' : 'No'}</p>
        <p>Click Count: {clickCount} | Processing: {processingClickRef.current ? 'Yes' : 'No'}</p>
        {clickDebugInfo && <p className="text-orange-200">Last click: {clickDebugInfo}</p>}
      </div>
      
      {hasDevTools && handleForceSync && (
        <PlayerGameDevTools handleForceSync={handleForceSync} />
      )}
    </main>
  );
};

export default PlayerGameMain;
