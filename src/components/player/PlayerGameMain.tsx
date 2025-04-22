
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
  // Simplified approach with direct DOM tracking
  const [directClickCount, setDirectClickCount] = useState(0);
  const [lastClickedOption, setLastClickedOption] = useState<string | null>(null);
  const [debugMsg, setDebugMsg] = useState("");
  const [elementIds, setElementIds] = useState<string[]>([]);
  
  // Force a rerender every second to ensure UI is responsive
  const [forceUpdate, setForceUpdate] = useState(0);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);
  
  // Reset local selection when the question changes
  useEffect(() => {
    setLastClickedOption(null);
    setDebugMsg("");
    setDirectClickCount(0);
    
    // Map option elements to track them
    if (currentQuestion?.options) {
      const ids = currentQuestion.options.map((_: any, index: number) => `answer-option-${index}`);
      setElementIds(ids);
      
      // Log for debugging
      console.log("New question loaded, tracking elements:", ids);
    }
  }, [currentQuestion?.text]);
  
  // Update local selection when global selection changes
  useEffect(() => {
    if (selectedAnswer) {
      setLastClickedOption(selectedAnswer);
    }
  }, [selectedAnswer]);
  
  // Direct DOM interaction for click handling to bypass React complexities
  useEffect(() => {
    const handleDirectClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const optionButton = target.closest('[data-option]');
      
      if (!optionButton || timeLeft <= 0 || isAnswerRevealed || lastClickedOption) {
        return;
      }
      
      const optionValue = optionButton.getAttribute('data-option');
      const optionIndex = optionButton.getAttribute('data-index');
      
      if (optionValue) {
        console.log(`Direct click on option ${optionIndex}: ${optionValue}`);
        setDirectClickCount(prev => prev + 1);
        setLastClickedOption(optionValue);
        setDebugMsg(`Clicked: ${optionValue} at ${new Date().toLocaleTimeString()}`);
        
        // Visually mark it as selected immediately
        optionButton.setAttribute('data-selected', 'true');
        optionButton.classList.add('selected-answer');
        
        // Call the parent handler
        handleSelectAnswer(optionValue);
      }
    };
    
    // Add direct event listeners to the document
    document.addEventListener('click', handleDirectClick);
    
    return () => {
      document.removeEventListener('click', handleDirectClick);
    };
  }, [timeLeft, isAnswerRevealed, lastClickedOption, handleSelectAnswer]);
  
  // Force a timer update if needed
  const handleForceTimerUpdate = () => {
    const gameState = localStorage.getItem('gameState');
    if (gameState) {
      try {
        const parsedState = JSON.parse(gameState);
        const updatedState = {
          ...parsedState,
          timeLeft: 25,
          timestamp: Date.now() + 1000,
          forceSync: true,
          definitiveTruth: true
        };
        localStorage.setItem('gameState', JSON.stringify(updatedState));
        
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('triviaStateChange', { 
          detail: updatedState
        }));
        
        console.log('Forced timer update to 25 seconds');
      } catch (error) {
        console.error('Error parsing game state:', error);
      }
    }
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
            // Determine if this option is selected either via local or global state
            const isSelected = option === lastClickedOption || option === selectedAnswer;
            
            let buttonClasses = "p-5 rounded-lg text-left transition-all duration-200 relative cursor-pointer";
            
            // Add proper visual state
            if (isAnswerRevealed) {
              if (option === currentQuestion.correctAnswer) {
                buttonClasses += " correct-answer bg-gradient-to-r from-green-500 to-green-400 border-2 border-green-300 text-white shadow-md";
              } else if (isSelected) {
                buttonClasses += " incorrect-answer bg-gradient-to-r from-red-500 to-red-400 border-2 border-red-300 text-white shadow-md";
              } else {
                buttonClasses += " unselected-answer bg-gradient-to-r from-[#7E69AB]/70 to-[#9B87F5]/70 border border-[#D6BCFA]/50 text-white/80";
              }
            } else {
              if (isSelected) {
                buttonClasses += " selected-answer bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] border-2 border-[#D6BCFA] text-white shadow-md animate-pulse";
              } else {
                buttonClasses += " selectable-answer bg-gradient-to-r from-[#7E69AB]/90 to-[#9B87F5]/90 hover:from-[#7E69AB] hover:to-[#9B87F5] border border-[#D6BCFA]/70 text-white shadow-lg";
              }
            }
            
            return (
              <div
                key={index}
                id={`answer-option-${index}`}
                className={buttonClasses}
                data-testid={`answer-option-${index}`}
                data-option={option}
                data-clickable={!isAnswerRevealed && timeLeft > 0 && !isSelected ? "true" : "false"}
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
        <p>Selected: {selectedAnswer || 'None'} | Local: {lastClickedOption || 'None'} | Time: {timeLeft}s | Revealed: {isAnswerRevealed ? 'Yes' : 'No'}</p>
        <p>Click Count: {directClickCount} | Processing: {String(false)} | Force Update: {forceUpdate}</p>
        <p>Element IDs: {elementIds.join(', ')}</p>
      </div>
      
      {/* Dev tools */}
      {hasDevTools && handleForceSync && (
        <PlayerGameDevTools 
          handleForceSync={handleForceSync} 
          onForceTimer={handleForceTimerUpdate}
          debugInfo={{
            selectedAnswer,
            timeLeft,
            isAnswerRevealed,
            clicksRegistered: directClickCount,
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
          transition: all 0.2s ease;
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
