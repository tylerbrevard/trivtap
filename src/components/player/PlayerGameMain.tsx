
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
  // Local state to track answer selection
  const [localAnswer, setLocalAnswer] = useState<string | null>(null);
  const [clickDebugMsg, setClickDebugMsg] = useState("");
  const [clickCount, setClickCount] = useState(0);
  
  // Container reference for direct DOM event handling
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Reset selection state when question changes
  useEffect(() => {
    setLocalAnswer(selectedAnswer);
    setClickCount(0);
    setClickDebugMsg("");
    console.log("New question loaded, reset selection state. Selected answer:", selectedAnswer);
  }, [currentQuestion?.text, selectedAnswer]);
  
  // Sync with parent component selection
  useEffect(() => {
    if (selectedAnswer !== localAnswer) {
      setLocalAnswer(selectedAnswer);
      console.log("Synchronized with parent selection:", selectedAnswer);
    }
  }, [selectedAnswer]);

  // Option click handler with improved feedback
  const handleOptionClick = (option: string) => {
    // Capture click timestamp for debugging
    const clickTime = new Date().toISOString();
    setClickCount(prev => prev + 1);
    console.log(`Click detected on "${option}" at ${clickTime}`, {
      isAnswerRevealed,
      timeLeft,
      currentAnswer: localAnswer,
      selectedAnswer
    });
    
    // Don't process clicks if:
    // - Answer has been revealed
    // - Time is up
    // - Already selected an answer
    if (isAnswerRevealed || timeLeft <= 0 || localAnswer !== null) {
      console.log("Click ignored:", {
        reason: isAnswerRevealed ? "Answer revealed" : 
               timeLeft <= 0 ? "Time is up" : 
               localAnswer !== null ? "Already selected" : "Unknown"
      });
      return;
    }
    
    // Update local state immediately for responsive UI
    setLocalAnswer(option);
    setClickDebugMsg(`Clicked: ${option} at ${clickTime}`);
    console.log("Processing answer selection:", option);
    
    // Call the parent handler with a small delay to ensure local UI updates first
    setTimeout(() => {
      handleSelectAnswer(option);
    }, 50);
  };
  
  // Direct DOM event listener for more reliable click handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    
    const directClickHandler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const optionElement = target.closest('[data-option]');
      
      if (optionElement) {
        const option = optionElement.getAttribute('data-option');
        if (option) {
          console.log("Direct DOM click handler activated for option:", option);
          
          // Only process if we haven't selected an answer yet
          if (localAnswer === null && !isAnswerRevealed && timeLeft > 0) {
            // Update local UI immediately
            setLocalAnswer(option);
            setClickCount(prev => prev + 1);
            
            const clickTime = new Date().toISOString();
            setClickDebugMsg(`Direct DOM click: ${option} at ${clickTime}`);
            
            // Call the parent handler with a small delay
            setTimeout(() => {
              handleSelectAnswer(option);
            }, 50);
          } else {
            console.log("DOM click ignored - answer already selected or revealed");
          }
        }
      }
    };
    
    // Use mousedown for faster response
    container.addEventListener('mousedown', directClickHandler);
    
    return () => {
      container.removeEventListener('mousedown', directClickHandler);
    };
  }, [isAnswerRevealed, timeLeft, localAnswer, handleSelectAnswer]);
  
  // Ensure we have a valid question
  if (!currentQuestion || !currentQuestion.options) {
    return <div className="p-4 text-center">Loading question...</div>;
  }

  return (
    <main 
      className="flex-1 p-4 overflow-auto bg-gradient-to-b from-[#2B2464] to-[#1A1740]"
      ref={containerRef}
      data-testid="player-game-main"
    >
      <div className="card-trivia p-6 mb-6 shadow-lg rounded-xl bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border border-indigo-500/40">
        <h2 className="text-xl font-bold mb-4 text-white">{currentQuestion.text}</h2>
        
        <div className="grid grid-cols-1 gap-4 mt-6">
          {currentQuestion.options.map((option: string, index: number) => {
            // Determine if this option is selected
            const isSelected = option === localAnswer;
            
            // Define button classes based on state
            let buttonClasses = "p-5 rounded-lg text-left transition-all duration-200 relative hover:scale-[1.01] active:scale-[0.99]";
            
            if (isAnswerRevealed) {
              // Answer revealed state
              if (option === currentQuestion.correctAnswer) {
                buttonClasses += " bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-lg";
              } else if (isSelected) {
                buttonClasses += " bg-gradient-to-r from-red-500 to-red-400 border-2 border-red-300 text-white shadow-lg";
              } else {
                buttonClasses += " bg-gradient-to-r from-[#7E69AB]/70 to-[#9B87F5]/70 border border-[#D6BCFA]/50 text-white/80";
              }
            } else {
              // Question state
              if (isSelected) {
                buttonClasses += " bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] border-2 border-[#D6BCFA] text-white shadow-lg animate-pulse";
              } else {
                buttonClasses += " bg-gradient-to-r from-[#7E69AB]/90 to-[#9B87F5]/90 hover:from-[#7E69AB] hover:to-[#9B87F5] border border-[#D6BCFA]/70 text-white shadow hover:shadow-lg cursor-pointer";
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
                onClick={() => handleOptionClick(option)}
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
        <p>Debug: Last Click: {clickDebugMsg || 'None'}</p>
        <p>Selected: {selectedAnswer || 'None'} | Local: {localAnswer || 'None'} | Time: {timeLeft}s | Revealed: {isAnswerRevealed ? 'Yes' : 'No'}</p>
        <p>Click Count: {clickCount} | State: {currentGameState}</p>
      </div>
      
      {/* Dev tools */}
      {hasDevTools && handleForceSync && (
        <PlayerGameDevTools 
          handleForceSync={handleForceSync} 
          onForceTimer={() => {
            // Clear local storage state to force reset
            localStorage.removeItem('gameState');
            
            // Create a high-priority reset state
            const resetState = {
              state: 'question',
              questionIndex: currentQuestion ? currentQuestion.index : 0,
              timeLeft: 30,
              timestamp: Date.now() + 10000,
              definitiveTruth: true,
              forceSync: true
            };
            
            // Apply the reset
            localStorage.setItem('gameState', JSON.stringify(resetState));
            window.dispatchEvent(new CustomEvent('triviaStateChange', { 
              detail: resetState
            }));
            
            console.log('Forced complete reset, timer set to 30 seconds');
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
