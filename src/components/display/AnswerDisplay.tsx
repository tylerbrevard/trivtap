
import React from 'react';
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
          <Button variant="outline" size="sm" onClick={onManualNext}>
            Force Next Question
          </Button>
        </div>
      )}
    </div>
  );
};
