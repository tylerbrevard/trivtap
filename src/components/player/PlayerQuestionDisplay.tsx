
import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { submitPlayerAnswer, requestSyncFromDisplay } from '@/utils/gameStateUtils';
import { gameSettings } from '@/utils/gameSettings';
import { useToast } from "@/components/ui/use-toast";

interface PlayerQuestionDisplayProps {
  question: any;
  playerName: string;
  gameId: string;
  questionIndex: number;
  questionCounter: number;
  timeLeft: number;
}

export const PlayerQuestionDisplay = ({
  question,
  playerName,
  gameId,
  questionIndex,
  questionCounter,
  timeLeft
}: PlayerQuestionDisplayProps) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastQuestionCounter, setLastQuestionCounter] = useState(questionCounter);
  const [localTimeLeft, setLocalTimeLeft] = useState(timeLeft);
  const timerRef = useRef<number | null>(null);
  const { toast } = useToast();
  
  // Initialize local timer when question changes or time is updated from props
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Set local time to match prop
    setLocalTimeLeft(timeLeft);
    
    // Create local timer countdown
    if (timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setLocalTimeLeft(prev => {
          if (prev <= 0) {
            // Clear timer when we reach zero
            if (timerRef.current) {
              window.clearInterval(timerRef.current);
              timerRef.current = null;
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    // Cleanup
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [timeLeft]);
  
  // Reset state when question changes
  useEffect(() => {
    if (questionCounter !== lastQuestionCounter) {
      console.log(`Player screen detected question change from ${lastQuestionCounter} to ${questionCounter}`);
      setSelectedAnswer(null);
      setHasSubmitted(false);
      setIsLoading(false);
      setLastQuestionCounter(questionCounter);
      setLocalTimeLeft(timeLeft);
      
      // Clear any existing timer
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
      
      // Start a new timer
      if (timeLeft > 0) {
        timerRef.current = window.setInterval(() => {
          setLocalTimeLeft(prev => {
            if (prev <= 0) {
              // Clear timer when we reach zero
              if (timerRef.current) {
                window.clearInterval(timerRef.current);
              }
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    }
  }, [questionCounter, lastQuestionCounter, timeLeft]);
  
  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    console.log(`Attempting to select answer: ${answer}, hasSubmitted=${hasSubmitted}, isLoading=${isLoading}, localTimeLeft=${localTimeLeft}`);
    if (!hasSubmitted && !isLoading && localTimeLeft > 0) {
      setSelectedAnswer(answer);
      console.log(`Selected answer: ${answer}`);
    }
  };
  
  // Handle answer submission
  const handleSubmitAnswer = () => {
    console.log(`Attempting to submit answer: ${selectedAnswer}, hasSubmitted=${hasSubmitted}, isLoading=${isLoading}, localTimeLeft=${localTimeLeft}`);
    if (selectedAnswer && !hasSubmitted && !isLoading && localTimeLeft > 0) {
      setIsLoading(true);
      
      const success = submitPlayerAnswer(
        playerName,
        gameId,
        selectedAnswer,
        questionIndex,
        questionCounter
      );
      
      if (success) {
        setHasSubmitted(true);
        console.log(`Successfully submitted answer: ${selectedAnswer}`);
        toast({
          title: "Answer submitted",
          description: "Your answer has been recorded.",
        });
      } else {
        console.log('Failed to submit answer');
        toast({
          title: "Error",
          description: "Failed to submit your answer. Please try again.",
          variant: "destructive",
        });
      }
      
      setIsLoading(false);
    }
  };
  
  // Request sync if question data is missing or when component mounts
  useEffect(() => {
    console.log('Player question component mounted/updated with question:', question);
    if (!question || !question.text) {
      console.log('Player screen missing question data, requesting sync');
      requestSyncFromDisplay(playerName);
      
      // Try to get the display truth directly
      const displayTruth = localStorage.getItem('gameState_display_truth');
      if (displayTruth) {
        try {
          const parsedState = JSON.parse(displayTruth);
          console.log('Found display truth:', parsedState);
          
          // Create a high-priority sync event
          const syncEvent = {
            ...parsedState,
            timestamp: Date.now() + 10000, // Future timestamp for priority
            forceSync: true,
            definitiveTruth: true
          };
          
          // Dispatch this event to force a state update
          window.dispatchEvent(new CustomEvent('triviaStateChange', { 
            detail: syncEvent
          }));
        } catch (error) {
          console.error('Error parsing display truth:', error);
        }
      }
    }
  }, [question, playerName]);
  
  // Calculate time left percentage
  const timeLeftPercentage = (localTimeLeft / gameSettings.questionDuration) * 100;

  // Render timer color
  const getTimerColor = () => {
    if (localTimeLeft > gameSettings.questionDuration * 0.6) return 'bg-green-500';
    if (localTimeLeft > gameSettings.questionDuration * 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  if (!question || !question.text) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="card-trivia p-6 w-full max-w-md text-center">
          <h3 className="text-xl font-semibold mb-4">Loading question...</h3>
          <div className="animate-pulse flex flex-col gap-4">
            <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-full mx-auto"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
          </div>
          <Button 
            onClick={() => requestSyncFromDisplay(playerName)} 
            className="mt-6"
            variant="outline"
          >
            Sync Manually
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-full p-4">
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
            {question.category || 'General'}
          </div>
          <div className="text-sm font-medium">
            Question {questionCounter}
          </div>
          <div className="flex items-center gap-1 text-sm font-medium">
            {localTimeLeft}s
          </div>
        </div>
        <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
          <div 
            className={`h-full ${getTimerColor()} transition-all duration-300`}
            style={{ width: `${Math.max(0, Math.min(100, timeLeftPercentage))}%` }}
          />
        </div>
      </div>
      
      <div className="card-trivia p-6 mb-4">
        <h2 className="text-xl font-semibold text-center mb-2">{question.text}</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-3 flex-1">
        {question.options && question.options.map((option: string, index: number) => (
          <button
            key={index}
            onClick={() => handleSelectAnswer(option)}
            className={`p-4 text-left rounded-lg transition-all ${
              selectedAnswer === option 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card hover:bg-card/80'
            } ${hasSubmitted ? 'opacity-50' : ''}`}
            disabled={hasSubmitted || isLoading || localTimeLeft <= 0}
          >
            <span className="block font-medium">{option}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-4">
        <Button
          onClick={handleSubmitAnswer}
          className="w-full"
          disabled={!selectedAnswer || hasSubmitted || isLoading || localTimeLeft <= 0}
          variant={selectedAnswer && !hasSubmitted && localTimeLeft > 0 ? "default" : "outline"}
        >
          {isLoading ? "Submitting..." : hasSubmitted ? "Answer Submitted" : "Submit Answer"}
        </Button>
      </div>
    </div>
  );
};
