
import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface AnswerDisplayProps {
  currentQuestion: any;
  questionCounter: number;
  onManualNext: () => void;
}

export const AnswerDisplay = ({
  currentQuestion,
  questionCounter,
  onManualNext
}: AnswerDisplayProps) => {
  // Add effect to broadcast the answer state
  useEffect(() => {
    // Clear any previous state
    localStorage.removeItem('gameState');
    
    // Set a minimal delay to ensure clean state
    setTimeout(() => {
      // Create authoritative answer state
      const definedState = {
        state: 'answer',
        questionIndex: questionCounter - 1,
        timeLeft: 0,
        questionCounter: questionCounter,
        timestamp: Date.now() + 20000, // Future timestamp for high priority
        forceAnswerState: true,
        definitiveTruth: true,
        guaranteedDelivery: true,
        displayInit: true,
        forceSync: true,
        questionText: currentQuestion.text,
        correctAnswer: currentQuestion.correctAnswer,
        broadcastTime: new Date().toISOString()
      };
      
      // Store the state
      localStorage.setItem('gameState', JSON.stringify(definedState));
      localStorage.setItem('gameState_display_truth', JSON.stringify(definedState));
      
      // Dispatch the event to notify all listeners
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: definedState
      }));
      
      console.log('Answer display initialized with authoritative state:', definedState);
      
      // Send redundant events to ensure delivery
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('triviaStateChange', { 
            detail: {
              ...definedState,
              timestamp: definedState.timestamp + i,
              redundancyLevel: i
            }
          }));
        }, i * 200);
      }
    }, 100);
  }, [currentQuestion, questionCounter]);

  // Listen for special sync requests from players
  useEffect(() => {
    const handlePlayerSyncRequest = (e: CustomEvent) => {
      console.log('Received sync request from player while in answer state:', e.detail);
      
      // Create a special high-priority sync message targeted at this player
      const targetedSync = {
        state: 'answer',
        questionIndex: questionCounter - 1,
        timeLeft: 0,
        questionCounter: questionCounter,
        timestamp: Date.now() + 30000, // Very high priority
        forceAnswerState: true,
        definitiveTruth: true,
        guaranteedDelivery: true,
        forcedSyncResponse: true,
        targetPlayer: e.detail.playerName,
        questionText: currentQuestion.text,
        correctAnswer: currentQuestion.correctAnswer,
        broadcastTime: new Date().toISOString()
      };
      
      // Store and broadcast
      localStorage.setItem('gameState', JSON.stringify(targetedSync));
      localStorage.setItem('gameState_display_truth', JSON.stringify(targetedSync));
      
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: targetedSync
      }));
      
      console.log('Sent targeted answer sync response to player:', e.detail.playerName);
    };
    
    // Add event listener for player sync requests
    window.addEventListener('playerNeedsSync', handlePlayerSyncRequest as EventListener);
    
    return () => {
      window.removeEventListener('playerNeedsSync', handlePlayerSyncRequest as EventListener);
    };
  }, [currentQuestion, questionCounter]);

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
            {currentQuestion.category}
          </div>
          <div className="text-xl font-medium">
            Question {questionCounter}
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex flex-col">
        <div className="card-trivia p-8 mb-8 flex-1 flex items-center justify-center">
          <h2 className="text-4xl font-bold text-center">{currentQuestion.text}</h2>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {currentQuestion.options.map((option: string, index: number) => (
            <div 
              key={index}
              className={`card-trivia p-6 flex items-center justify-center text-2xl font-semibold text-center min-h-28 ${
                option === currentQuestion.correctAnswer 
                  ? 'bg-green-500 border-green-600' 
                  : 'opacity-50'
              }`}
            >
              {option}
            </div>
          ))}
        </div>
      </div>
      
      <div className="mt-6 text-center">
        <h3 className="text-3xl font-bold text-primary">Correct Answer: {currentQuestion.correctAnswer}</h3>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
          <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onManualNext}>
              Force Next Question
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const gameState = localStorage.getItem('gameState');
                console.log('Current game state:', gameState ? JSON.parse(gameState) : 'Not found');
                console.log('Current question:', currentQuestion);
              }}
            >
              Log Debug Info
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                // Force resync with clean state
                localStorage.removeItem('gameState');
                localStorage.removeItem('gameState_display_truth');
                
                setTimeout(() => {
                  const freshState = {
                    state: 'answer',
                    questionIndex: questionCounter - 1,
                    timeLeft: 0,
                    questionCounter: questionCounter,
                    timestamp: Date.now() + 30000,
                    forceAnswerState: true,
                    definitiveTruth: true,
                    guaranteedDelivery: true,
                    forceSync: true,
                    manualSync: true,
                    questionText: currentQuestion.text,
                    correctAnswer: currentQuestion.correctAnswer,
                    broadcastTime: new Date().toISOString()
                  };
                  
                  localStorage.setItem('gameState', JSON.stringify(freshState));
                  localStorage.setItem('gameState_display_truth', JSON.stringify(freshState));
                  
                  window.dispatchEvent(new CustomEvent('triviaStateChange', { 
                    detail: freshState
                  }));
                  
                  console.log('Forced complete resync of answer state:', freshState);
                  
                  // Send multiple broadcasts to ensure delivery
                  for (let i = 1; i <= 5; i++) {
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
                        detail: {
                          ...freshState,
                          timestamp: freshState.timestamp + i,
                          redundancyLevel: i
                        }
                      }));
                    }, i * 200);
                  }
                }, 100);
              }}
            >
              Reset and Force Sync All Players
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
