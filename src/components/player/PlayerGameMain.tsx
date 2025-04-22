
import React, { useState, useEffect, useRef } from "react";
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
  // References to track elements and clicks
  const containerRef = useRef<HTMLDivElement>(null);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [debugMsg, setDebugMsg] = useState("");
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [clickCount, setClickCount] = useState(0);
  
  // Ensures we process each selection only once
  const processingRef = useRef(false);
  
  // Clear local state when question changes
  useEffect(() => {
    setLocalAnswer(null);
    setDebugMsg("");
    setClickCount(0);
    processingRef.current = false;
    console.log("New question loaded, resetting selection state");
  }, [currentQuestion?.text]);
  
  // Update local state when parent state changes
  useEffect(() => {
    if (selectedAnswer) {
      setLocalAnswer(selectedAnswer);
    }
  }, [selectedAnswer]);
  
  // Actual click handler function
  const selectAnswerOption = (option: string) => {
    if (processingRef.current) return;
    if (isAnswerRevealed) return;
    if (timeLeft <= 0) return;
    if (localAnswer !== null) return;
    
    processingRef.current = true;
    setClickCount(prev => prev + 1);
    setLocalAnswer(option);
    setDebugMsg(`Clicked: ${option} at ${new Date().toLocaleTimeString()}`);
    
    console.log(`Player clicked answer: ${option}`, {
      time: timeLeft,
      revealed: isAnswerRevealed,
      currentlyProcessing: processingRef.current
    });
    
    // Send to parent handler
    handleSelectAnswer(option);
    
    // Reset processing flag after a short delay
    setTimeout(() => {
      processingRef.current = false;
    }, 500);
  };
  
  // Fallback direct DOM click handler as a backup
  useEffect(() => {
    if (!containerRef.current || !trackingEnabled) return;
    
    const handleClickCapture = (e: MouseEvent) => {
      // Only process if we haven't selected yet
      if (localAnswer !== null || timeLeft <= 0 || isAnswerRevealed) return;
      
      const target = e.target as HTMLElement;
      const optionElement = target.closest('[data-option]');
      
      if (optionElement) {
        const option = optionElement.getAttribute('data-option');
        if (option) {
          e.preventDefault();
          e.stopPropagation();
          
          console.log("Direct DOM click captured on option:", option);
          selectAnswerOption(option);
        }
      }
    };
    
    // Use capturing phase to get the event before React
    containerRef.current.addEventListener('click', handleClickCapture, { capture: true });
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('click', handleClickCapture, { capture: true });
      }
    };
  }, [localAnswer, timeLeft, isAnswerRevealed, trackingEnabled]);
  
  // Ensure we have a valid question
  if (!currentQuestion || !currentQuestion.options) {
    return <div className="p-4 text-center">Loading question...</div>;
  }

  return (
    <main 
      className="flex-1 p-4 overflow-auto bg-gradient-to-b from-[#2B2464] to-[#1A1740]"
      ref={containerRef}
    >
      <div className="card-trivia p-6 mb-6 shadow-lg rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40">
        <h2 className="text-xl font-bold mb-4 text-white">{currentQuestion.text}</h2>
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          {currentQuestion.options.map((option: string, index: number) => {
            // Determine if this option is selected either via local or parent state
            const isSelected = option === localAnswer || option === selectedAnswer;
            
            let buttonClasses = "p-5 rounded-lg text-left transition-all duration-300 relative cursor-pointer";
            
            // Add proper visual state
            if (isAnswerRevealed) {
              if (option === currentQuestion.correctAnswer) {
                buttonClasses += " correct-answer bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-lg";
              } else if (isSelected) {
                buttonClasses += " incorrect-answer bg-gradient-to-r from-red-500 to-red-400 border-2 border-red-300 text-white shadow-lg";
              } else {
                buttonClasses += " unselected-answer bg-gradient-to-r from-[#7E69AB]/70 to-[#9B87F5]/70 border border-[#D6BCFA]/50 text-white/80";
              }
            } else {
              if (isSelected) {
                buttonClasses += " selected-answer bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] border-2 border-[#D6BCFA] text-white shadow-md animate-pulse";
              } else {
                buttonClasses += " selectable-answer bg-gradient-to-r from-[#7E69AB]/90 to-[#9B87F5]/90 hover:from-[#7E69AB] hover:to-[#9B87F5] border border-[#D6BCFA]/70 text-white shadow hover:shadow-lg";
              }
            }
            
            return (
              <div
                key={index}
                id={`answer-option-${index}`}
                className={buttonClasses}
                data-testid={`answer-option-${index}`}
                data-option={option}
                data-index={index}
                onClick={() => selectAnswerOption(option)}
                role="button"
                tabIndex={0}
                aria-selected={isSelected}
              >
                <div className="flex items-center">
                  <span className="mr-4 text-white font-bold flex items-center justify-center h-10 w-10 rounded-full bg-[#8B5CF6]/50 shadow-inner">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="text-white font-medium text-lg">{option}</span>
                  
                  {isSelected && (
                    <span className="ml-auto">
                      <Check className="h-6 w-6 text-white" />
                    </span>
                  )}
                </div>
              </div>
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
        <p>Selected: {selectedAnswer || 'None'} | Local: {localAnswer || 'None'} | Time: {timeLeft}s | Revealed: {isAnswerRevealed ? 'Yes' : 'No'}</p>
        <p>Click Count: {clickCount} | Processing: {String(processingRef.current)} | State: {currentGameState}</p>
      </div>
      
      {/* Dev tools */}
      {hasDevTools && handleForceSync && (
        <PlayerGameDevTools 
          handleForceSync={handleForceSync} 
          onForceTimer={() => {
            // Reset processing flag in case it's stuck
            processingRef.current = false;
            setTrackingEnabled(true);
            
            // Clear local storage state to force reset
            localStorage.removeItem('gameState');
            
            // Create a high-priority reset state
            const resetState = {
              state: 'question',
              questionIndex: currentQuestion ? currentQuestion.index : 0,
              timeLeft: 25,
              timestamp: Date.now() + 10000,
              definitiveTruth: true,
              forceSync: true
            };
            
            // Apply the reset
            localStorage.setItem('gameState', JSON.stringify(resetState));
            window.dispatchEvent(new CustomEvent('triviaStateChange', { 
              detail: resetState
            }));
            
            console.log('Forced complete reset, timer set to 25 seconds');
          }}
          debugInfo={{
            selectedAnswer,
            timeLeft,
            isAnswerRevealed,
            clicksRegistered: clickCount,
            currentState: currentGameState || "question"
          }}
        />
      )}
      
      {/* CSS for styling the component */}
      <style>
        {`
        .selectable-answer:active {
          transform: scale(0.98);
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .selected-answer {
          transform: scale(1.02);
          transition: all 0.3s ease;
        }
        
        .correct-answer, .incorrect-answer {
          transition: all 0.5s ease;
        }
        
        .unselected-answer {
          opacity: 0.8;
        }
        `}
      </style>
    </main>
  );
};

export default PlayerGameMain;
