
import React from "react";
import { Trophy, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}) => {
  // Add a function to handle the click event on answer buttons
  const onAnswerClick = (option: string) => {
    console.log("Answer selected:", option);
    handleSelectAnswer(option);
  };

  return (
    <main className="flex-1 p-4 overflow-auto">
      <div className="card-trivia p-6 mb-6">
        <h2 className="text-xl font-medium mb-4">{currentQuestion.text}</h2>
        <div className="grid grid-cols-1 gap-3 mt-4">
          {currentQuestion.options &&
            currentQuestion.options.map((option: string, index: number) => (
              <button
                key={index}
                onClick={() => onAnswerClick(option)}
                disabled={selectedAnswer !== null || timeLeft === 0 || isAnswerRevealed}
                className={`p-4 rounded-lg text-left transition ${
                  selectedAnswer === option
                    ? isAnswerRevealed
                      ? option === currentQuestion.correctAnswer
                        ? "bg-green-100 border-green-500 border-2"
                        : "bg-red-100 border-red-500 border-2"
                      : "bg-primary/20 border-primary border-2"
                    : isAnswerRevealed && option === currentQuestion.correctAnswer
                    ? "bg-green-100 border-green-500 border-2"
                    : "bg-card hover:bg-primary/10 border border-border"
                } ${
                  timeLeft === 0 || isAnswerRevealed
                    ? "cursor-default"
                    : "cursor-pointer"
                }`}
              >
                <div className="flex items-start">
                  <span className="mr-3 text-muted-foreground">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            ))}
        </div>
      </div>
      {isAnswerRevealed && (
        <div
          className={`p-4 rounded-lg mb-4 ${
            answeredCorrectly ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          <div className="flex items-start">
            <div className="mr-3">
              {answeredCorrectly ? <Trophy className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
            </div>
            <div>
              <p className="font-medium">
                {answeredCorrectly ? "Correct!" : "Incorrect"}
              </p>
              <p className="text-sm">
                {answeredCorrectly
                  ? `You earned ${pendingPoints > 0 ? pendingPoints : score - (score - pendingPoints)
                    } points!`
                  : `The correct answer was: ${currentQuestion.correctAnswer}`}
              </p>
            </div>
          </div>
        </div>
      )}
      {hasDevTools && handleForceSync && (
        <PlayerGameDevTools handleForceSync={handleForceSync} />
      )}
    </main>
  );
};

export default PlayerGameMain;
