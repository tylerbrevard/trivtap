
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { gameSettings } from '@/utils/gameSettings';
import { submitPlayerAnswer, hasSubmittedAnswer, getSubmittedAnswer } from '@/utils/playerAnswerUtils';

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
  const { toast } = useToast();
  
  // Check for previous submission when question changes
  useEffect(() => {
    console.log('Question changed to:', questionCounter);
    
    // Check if we've already submitted an answer
    const submitted = hasSubmittedAnswer(playerName, questionCounter);
    setHasSubmitted(submitted);
    
    if (submitted) {
      const answerData = getSubmittedAnswer(playerName, questionCounter);
      if (answerData) {
        setSelectedAnswer(answerData.answer);
        console.log('Found previously submitted answer:', answerData.answer);
      }
    } else {
      setSelectedAnswer(null);
    }
    
    setIsLoading(false);
  }, [questionIndex, questionCounter, playerName]);
  
  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    if (hasSubmitted || isLoading || timeLeft <= 0) {
      console.log('Cannot select answer: already submitted, loading, or time expired');
      return;
    }
    
    console.log('Selected answer:', answer);
    setSelectedAnswer(answer);
    setIsLoading(true);
    
    // Submit answer
    const success = submitPlayerAnswer(
      playerName,
      gameId,
      answer,
      questionIndex,
      questionCounter
    );
    
    if (success) {
      setHasSubmitted(true);
      
      toast({
        title: "Answer submitted",
        description: "Your answer has been recorded."
      });
      
      // Notify other components
      window.dispatchEvent(new CustomEvent('playerAnswerSelected', {
        detail: {
          playerName,
          gameId,
          questionCounter,
          answer,
          timestamp: Date.now()
        }
      }));
    } else {
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive"
      });
    }
    
    setIsLoading(false);
  };
  
  // Auto-submit when time expires if answer is selected but not submitted
  useEffect(() => {
    if (timeLeft <= 0 && selectedAnswer && !hasSubmitted && !isLoading) {
      console.log('Time expired, auto-submitting selected answer:', selectedAnswer);
      
      const success = submitPlayerAnswer(
        playerName,
        gameId,
        selectedAnswer,
        questionIndex,
        questionCounter
      );
      
      if (success) {
        setHasSubmitted(true);
      }
    }
  }, [timeLeft, selectedAnswer, hasSubmitted, isLoading, playerName, gameId, questionIndex, questionCounter]);
  
  // Calculate time left percentage
  const timeLeftPercentage = timeLeft > 0 
    ? (timeLeft / (gameSettings.questionDuration || 20)) * 100 
    : 0;
  
  // Get timer color based on time left
  const getTimerColor = () => {
    if (timeLeft > (gameSettings.questionDuration || 20) * 0.6) return 'bg-green-500';
    if (timeLeft > (gameSettings.questionDuration || 20) * 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Loading state
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
        </div>
      </div>
    );
  }
  
  // Time expired view
  if (timeLeft <= 0 && !hasSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="card-trivia p-6 w-full max-w-md text-center">
          <h3 className="text-xl font-semibold mb-4">Time's up!</h3>
          <p className="mb-4">The answer will be revealed shortly.</p>
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
            {timeLeft}s
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
          <Button
            key={index}
            onClick={() => handleSelectAnswer(option)}
            className={`p-4 text-left justify-start h-auto ${
              selectedAnswer === option 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-card hover:bg-card/80'
            } ${hasSubmitted ? 'opacity-50' : ''}`}
            disabled={hasSubmitted || isLoading || timeLeft <= 0}
            variant="ghost"
          >
            <span className="block font-medium">{option}</span>
          </Button>
        ))}
      </div>
      
      {hasSubmitted && (
        <div className="text-center mt-4 text-primary font-medium">
          Answer submitted! Waiting for results...
        </div>
      )}
      
      {isLoading && (
        <div className="text-center mt-4 text-amber-600 font-medium">
          Submitting your answer...
        </div>
      )}
    </div>
  );
};
