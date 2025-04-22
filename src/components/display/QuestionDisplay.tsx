
import React from 'react';
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

  // Log the current question and ensure game state is synchronized
  React.useEffect(() => {
    console.log('Display showing question:', {
      text: currentQuestion.text,
      index: questionCounter - 1,
      options: currentQuestion.options,
      correctAnswer: currentQuestion.correctAnswer
    });
    
    // Create a definitive game state that players MUST accept
    // Use current timestamp + 10000 to ensure it's in the future compared to any existing state
    const definitiveTruth = {
      state: 'question',
      questionIndex: questionCounter - 1,
      timeLeft: timeLeft,
      questionCounter: questionCounter,
      timestamp: Date.now() + 10000, // Future timestamp to guarantee acceptance
      guaranteedDelivery: true,      // Flag that forces players to accept this state
      definitiveTruth: true,         // Additional flag that overrides normal sync checks
      forceSync: true                // Force player sync immediately
    };
    
    // Store the definitive truth in localStorage
    localStorage.setItem('gameState', JSON.stringify(definitiveTruth));
    localStorage.setItem('gameState_display_truth', JSON.stringify(definitiveTruth));
    
    // Broadcast to all players with multiple events for redundancy
    window.dispatchEvent(new CustomEvent('triviaStateChange', { 
      detail: definitiveTruth
    }));
    
    // Send a second event with a slight delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: {
          ...definitiveTruth,
          timestamp: definitiveTruth.timestamp + 1 // Slightly newer
        }
      }));
    }, 100);
    
    // And a third event with a longer delay
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('triviaStateChange', { 
        detail: {
          ...definitiveTruth,
          timestamp: definitiveTruth.timestamp + 2 // Even newer
        }
      }));
    }, 300);
    
    console.log('Broadcast definitive question state:', definitiveTruth);
  }, [currentQuestion, questionCounter, timeLeft]);

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
                // Create a fresh, authoritative game state update
                const authoritative = {
                  state: 'question',
                  questionIndex: questionCounter - 1,
                  timeLeft: timeLeft,
                  questionCounter: questionCounter,
                  timestamp: Date.now() + 10000, // Future timestamp to ensure precedence
                  forceSync: true,
                  authoritative: true
                };
                
                // Store it with a special key that will always be recognized
                localStorage.setItem('gameState', JSON.stringify(authoritative));
                localStorage.setItem('gameState_display_truth', JSON.stringify(authoritative));
                
                // Trigger multiple events with slightly different timestamps to break sync deadlocks
                window.dispatchEvent(new CustomEvent('triviaStateChange', { 
                  detail: {
                    ...authoritative,
                    timestamp: authoritative.timestamp,
                    guaranteedDelivery: true
                  }
                }));
                
                console.log('Sent authoritative game state update:', authoritative);
              }}
            >
              Send Authoritative State
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
