
import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { gameSettings } from '@/utils/gameSettings';

interface QuestionDisplayProps {
  currentQuestion: any;
  timeLeft: number;
  questionCounter: number;
  onManualNext: () => void;
  forcePause: boolean;
  togglePause: () => void;
}

export const QuestionDisplay = ({
  currentQuestion,
  timeLeft,
  questionCounter,
  onManualNext,
  forcePause,
  togglePause
}: QuestionDisplayProps) => {
  const getTimerColor = () => {
    if (timeLeft > gameSettings.questionDuration * 0.6) return 'bg-green-500';
    if (timeLeft > gameSettings.questionDuration * 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Initial question state setup
  useEffect(() => {
    // Clear any possible previous state
    localStorage.removeItem('gameState');
    localStorage.removeItem('gameState_display_truth');
    
    // Set a minimal delay to ensure clean state
    setTimeout(() => {
      // Create authoritative question state
      const definedState = {
        state: 'question',
        questionIndex: questionCounter - 1,
        timeLeft: timeLeft,
        questionCounter: questionCounter,
        timestamp: Date.now() + 20000, // Increased future timestamp for higher priority
        forceQuestionState: true,
        definitiveTruth: true,
        guaranteedDelivery: true,
        displayInit: true,
        forceSync: true,
        questionText: currentQuestion.text, // Add question text for debugging
        broadcastTime: new Date().toISOString(),
        // Add question data for player screens
        currentQuestion: {
          text: currentQuestion.text,
          options: currentQuestion.options,
          category: currentQuestion.category
        }
      };
      
      // Store the state
      localStorage.setItem('gameState', JSON.stringify(definedState));
      localStorage.setItem('gameState_display_truth', JSON.stringify(definedState));
      
      // Dispatch the event to notify all listeners
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: definedState
      }));
      
      console.log('Question display initialized with authoritative state:', definedState);
      
      // Send redundant events to ensure delivery (more events, longer intervals)
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('triviaStateChange', { 
            detail: {
              ...definedState,
              timestamp: definedState.timestamp + i,
              redundancyLevel: i,
              broadcastTime: new Date().toISOString()
            }
          }));
          console.log(`Sending redundant sync event #${i}`);
        }, i * 200);
      }
    }, 100);
  }, [currentQuestion, questionCounter]);

  // Listen for special sync requests from players
  useEffect(() => {
    const handlePlayerSyncRequest = (e: CustomEvent) => {
      console.log('Received sync request from player:', e.detail);
      
      // Create a special high-priority sync message targeted at this player
      const targetedSync = {
        state: 'question',
        questionIndex: questionCounter - 1,
        timeLeft: timeLeft,
        questionCounter: questionCounter,
        timestamp: Date.now() + 30000, // Very high priority
        forceQuestionState: true,
        definitiveTruth: true,
        guaranteedDelivery: true,
        forcedSyncResponse: true,
        targetPlayer: e.detail.playerName,
        questionText: currentQuestion.text,
        broadcastTime: new Date().toISOString(),
        // Add question data for player screens
        currentQuestion: {
          text: currentQuestion.text,
          options: currentQuestion.options,
          category: currentQuestion.category
        }
      };
      
      // Store and broadcast
      localStorage.setItem('gameState', JSON.stringify(targetedSync));
      localStorage.setItem('gameState_display_truth', JSON.stringify(targetedSync));
      
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: targetedSync
      }));
      
      console.log('Sent targeted sync response to player:', e.detail.playerName);
    };
    
    // Add event listener for player sync requests
    window.addEventListener('playerNeedsSync', handlePlayerSyncRequest as EventListener);
    
    return () => {
      window.removeEventListener('playerNeedsSync', handlePlayerSyncRequest as EventListener);
    };
  }, [currentQuestion, questionCounter, timeLeft]);

  // Active timer update effect - more frequent updates
  useEffect(() => {
    if (timeLeft > 0 && !forcePause) {
      // Update game state with current timer
      const currentState = {
        state: 'question',
        questionIndex: questionCounter - 1,
        timeLeft: timeLeft,
        questionCounter: questionCounter,
        timestamp: Date.now() + 5000, // Future timestamp
        timerUpdate: true,
        questionText: currentQuestion.text,
        broadcastTime: new Date().toISOString(),
        // Add question data for player screens
        currentQuestion: {
          text: currentQuestion.text,
          options: currentQuestion.options,
          category: currentQuestion.category
        }
      };
      
      localStorage.setItem('gameState', JSON.stringify(currentState));
      localStorage.setItem('gameState_display_truth', JSON.stringify(currentState));
      
      // Dispatch timer update event
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: currentState
      }));
      
      // More frequent broadcasting for improved sync
      if (timeLeft % 3 === 0) { // Every 3 seconds, send a higher priority update
        const highPriorityUpdate = {
          ...currentState,
          timestamp: Date.now() + 10000,
          highPriorityUpdate: true
        };
        
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('triviaStateChange', { 
            detail: highPriorityUpdate
          }));
        }, 500);
      }
    }
  }, [timeLeft, forcePause, questionCounter, currentQuestion]);

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
          <div className="flex items-center gap-2 text-xl font-medium">
            <Clock className="h-5 w-5" />
            {timeLeft}s
          </div>
        </div>
        <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getTimerColor()} transition-all duration-300`}
            style={{ width: `${(timeLeft / gameSettings.questionDuration) * 100}%` }}
          />
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
              className="card-trivia p-6 flex items-center justify-center text-2xl font-semibold text-center min-h-28"
            >
              {option}
            </div>
          ))}
        </div>
      </div>
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
          <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onManualNext}>
              Force Next Question
            </Button>
            <Button variant="outline" size="sm" onClick={togglePause}>
              {forcePause ? 'Resume Game' : 'Pause Game'}
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
                    state: 'question',
                    questionIndex: questionCounter - 1,
                    timeLeft: gameSettings.questionDuration,
                    questionCounter: questionCounter,
                    timestamp: Date.now() + 30000,
                    forceQuestionState: true,
                    definitiveTruth: true,
                    guaranteedDelivery: true,
                    resetTimer: true,
                    forceSync: true,
                    manualSync: true,
                    questionText: currentQuestion.text,
                    broadcastTime: new Date().toISOString()
                  };
                  
                  localStorage.setItem('gameState', JSON.stringify(freshState));
                  localStorage.setItem('gameState_display_truth', JSON.stringify(freshState));
                  
                  window.dispatchEvent(new CustomEvent('triviaStateChange', { 
                    detail: freshState
                  }));
                  
                  console.log('Forced complete resync with fresh timer:', freshState);
                  
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
