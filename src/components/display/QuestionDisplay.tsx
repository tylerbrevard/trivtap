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

  // Force question state to all players and ensure it overrides any previous state
  useEffect(() => {
    console.log('Display showing question:', {
      text: currentQuestion.text,
      index: questionCounter - 1,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer,
      timeLeft: timeLeft
    });
    
    // First clear existing game state to avoid conflicts
    localStorage.removeItem('gameState');
    
    // Small delay to ensure clear happens first
    setTimeout(() => {
      // Create a definitive game state that players MUST accept
      // Use future timestamp to ensure it's always newer than any existing state
      const futureTimestamp = Date.now() + 30000; // 30 seconds in the future to guarantee precedence
      
      const definitiveQuestionState = {
        state: 'question',
        questionIndex: questionCounter - 1,
        timeLeft: timeLeft,
        questionCounter: questionCounter,
        timestamp: futureTimestamp,
        guaranteedDelivery: true,
        definitiveTruth: true,
        forceSync: true,
        overrideIntermission: true, // Special flag to force overriding intermission state
        supercedeAllStates: true,   // Special flag to supercede all other states
        displayInit: true           // Flag indicating this came from the display
      };
      
      // Set the definitive truth state
      localStorage.setItem('gameState', JSON.stringify(definitiveQuestionState));
      localStorage.setItem('gameState_display_truth', JSON.stringify(definitiveQuestionState));
      
      // Dispatch events with slight delays to ensure receipt
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: definitiveQuestionState
      }));
      
      // Send additional events to ensure delivery
      for (let i = 1; i <= 5; i++) {
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('triviaStateChange', { 
            detail: {
              ...definitiveQuestionState,
              timestamp: definitiveQuestionState.timestamp + i, // Slightly newer
              redundancyLevel: i
            }
          }));
          console.log(`Dispatched redundant question state event #${i}`);
        }, i * 100); // Stagger by 100ms each
      }
      
      console.log('Broadcast definitive question state with future timestamp:', definitiveQuestionState);
    }, 50);
    
    // Set an interval to keep broadcasting the state
    const broadcastInterval = setInterval(() => {
      const refreshedState = {
        state: 'question',
        questionIndex: questionCounter - 1,
        timeLeft: timeLeft, // Use current timeLeft to reflect time passing
        questionCounter: questionCounter,
        timestamp: Date.now() + 30000, // Refresh the future timestamp
        guaranteedDelivery: true,
        definitiveTruth: true,
        forceSync: true,
        periodicBroadcast: true
      };
      
      localStorage.setItem('gameState', JSON.stringify(refreshedState));
      localStorage.setItem('gameState_display_truth', JSON.stringify(refreshedState));
      
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: refreshedState
      }));
      
      console.log('Periodic broadcast of question state:', refreshedState);
    }, 2000); // Broadcast every 2 seconds
    
    return () => {
      clearInterval(broadcastInterval);
    };
  }, [currentQuestion, questionCounter]);

  // Add new effect specifically for time left updates
  useEffect(() => {
    if (timeLeft > 0 && !forcePause) {
      console.log(`Question timer update: ${timeLeft} seconds remaining`);
      
      // Update local storage to ensure timer sync
      const currentGameState = localStorage.getItem('gameState');
      if (currentGameState) {
        try {
          const parsedState = JSON.parse(currentGameState);
          parsedState.timeLeft = timeLeft;
          parsedState.timestamp = Date.now() + 30000; // Future timestamp
          localStorage.setItem('gameState', JSON.stringify(parsedState));
          
          // Dispatch timer update event
          window.dispatchEvent(new CustomEvent('triviaStateChange', { 
            detail: parsedState
          }));
        } catch (error) {
          console.error('Error updating timer in game state:', error);
        }
      }
    }
  }, [timeLeft, forcePause]);

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
                // Create a fresh, authoritative game state update with clean localStorage
                localStorage.removeItem('gameState');
                
                // Add a slight delay to ensure clean slate
                setTimeout(() => {
                  const futureTimestamp = Date.now() + 30000;
                  const authoritative = {
                    state: 'question',
                    questionIndex: questionCounter - 1,
                    timeLeft: gameSettings.questionDuration, // Reset to full duration
                    questionCounter: questionCounter,
                    timestamp: futureTimestamp,
                    forceSync: true,
                    authoritative: true,
                    definitiveTruth: true,
                    guaranteedDelivery: true,
                    overrideIntermission: true,
                    supercedeAllStates: true,
                    resetTimer: true
                  };
                  
                  // Store it with a special key that will always be recognized
                  localStorage.setItem('gameState', JSON.stringify(authoritative));
                  localStorage.setItem('gameState_display_truth', JSON.stringify(authoritative));
                  
                  // Trigger multiple events with slightly different timestamps to break sync deadlocks
                  window.dispatchEvent(new CustomEvent('triviaStateChange', { 
                    detail: authoritative
                  }));
                  
                  // Send additional events to ensure delivery
                  for (let i = 1; i <= 5; i++) {
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
                        detail: {
                          ...authoritative,
                          timestamp: authoritative.timestamp + i,
                          redundancyLevel: i
                        }
                      }));
                    }, i * 100);
                  }
                  
                  console.log('Sent authoritative game state update with reset mechanism:', authoritative);
                }, 200);
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
