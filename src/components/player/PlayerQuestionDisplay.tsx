
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { submitPlayerAnswer, requestSyncFromDisplay } from '@/utils/gameStateUtils';
import { gameSettings } from '@/utils/gameSettings';

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
  
  // Reset state when question changes
  useEffect(() => {
    if (questionCounter !== lastQuestionCounter) {
      setSelectedAnswer(null);
      setHasSubmitted(false);
      setIsLoading(false);
      setLastQuestionCounter(questionCounter);
      console.log(`Player screen detected question change from ${lastQuestionCounter} to ${questionCounter}`);
    }
  }, [questionCounter, lastQuestionCounter]);
  
  // Handle answer selection
  const handleSelectAnswer = (answer: string) => {
    if (!hasSubmitted && !isLoading && timeLeft > 0) {
      setSelectedAnswer(answer);
    }
  };
  
  // Handle answer submission
  const handleSubmitAnswer = () => {
    if (selectedAnswer && !hasSubmitted && !isLoading && timeLeft > 0) {
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
      }
      
      setIsLoading(false);
    }
  };
  
  // Request sync if question data is missing
  useEffect(() => {
    if (!question || !question.text) {
      console.log('Player screen missing question data, requesting sync');
      requestSyncFromDisplay(playerName);
    }
  }, [question, playerName]);
  
  // Calculate time left percentage
  const timeLeftPercentage = (timeLeft / gameSettings.questionDuration) * 100;

  // Render timer color
  const getTimerColor = () => {
    if (timeLeft > gameSettings.questionDuration * 0.6) return 'bg-green-500';
    if (timeLeft > gameSettings.questionDuration * 0.3) return 'bg-yellow-500';
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
            style={{ width: `${timeLeftPercentage}%` }}
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
            } ${hasSubmitted ? 'opacity-50 cursor-default' : ''}`}
            disabled={hasSubmitted || isLoading || timeLeft <= 0}
          >
            <span className="block font-medium">{option}</span>
          </button>
        ))}
      </div>
      
      <div className="mt-4">
        <Button
          onClick={handleSubmitAnswer}
          className="w-full"
          disabled={!selectedAnswer || hasSubmitted || isLoading || timeLeft <= 0}
          variant={selectedAnswer && !hasSubmitted ? "default" : "outline"}
        >
          {isLoading ? "Submitting..." : hasSubmitted ? "Answer Submitted" : "Submit Answer"}
        </Button>
      </div>
    </div>
  );
};
