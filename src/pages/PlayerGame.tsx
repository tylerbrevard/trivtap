
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trophy, Clock, AlertTriangle } from 'lucide-react';

// Mock question data - in a real app this would come from the server
const sampleQuestion = {
  id: '1',
  text: 'Which planet is known as the Red Planet?',
  options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
  correctAnswer: 'Mars',
  timeLimit: 20, // seconds
};

const PlayerGame = () => {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(sampleQuestion);
  const [timeLeft, setTimeLeft] = useState(currentQuestion.timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if player has joined with valid information
  useEffect(() => {
    const storedName = sessionStorage.getItem('playerName');
    const storedGameId = sessionStorage.getItem('gameId');
    
    if (!storedName || !storedGameId) {
      toast({
        title: "Not Joined",
        description: "You need to join a game first.",
        variant: "destructive",
      });
      navigate('/join');
      return;
    }
    
    setPlayerName(storedName);
    setGameId(storedGameId);
  }, [navigate, toast]);
  
  // Timer countdown effect
  useEffect(() => {
    if (timeLeft <= 0 || selectedAnswer !== null) {
      // Time's up or already answered
      return;
    }
    
    const timerId = setTimeout(() => {
      setTimeLeft(timeLeft - 1);
    }, 1000);
    
    return () => clearTimeout(timerId);
  }, [timeLeft, selectedAnswer]);
  
  // Reveal answer after time's up or player selects an answer
  useEffect(() => {
    if (timeLeft <= 0 || selectedAnswer !== null) {
      const timerId = setTimeout(() => {
        setIsAnswerRevealed(true);
        
        // Only award points if answer was correct and selected before time ran out
        if (selectedAnswer === currentQuestion.correctAnswer && timeLeft > 0) {
          // Calculate points based on time left (faster answers = more points)
          const pointsEarned = 100 + (timeLeft * 10);
          setScore(prevScore => prevScore + pointsEarned);
          setAnsweredCorrectly(true);
          
          toast({
            title: "Correct!",
            description: `+${pointsEarned} points`,
            variant: "default",
          });
        } else if (selectedAnswer !== null) {
          setAnsweredCorrectly(false);
          toast({
            title: "Incorrect",
            description: "Better luck on the next question!",
            variant: "default",
          });
        } else {
          toast({
            title: "Time's up!",
            description: "You didn't answer in time.",
            variant: "default",
          });
        }
        
        // Move to next question after 3 seconds
        setTimeout(() => {
          // Reset for next question
          setIsAnswerRevealed(false);
          setSelectedAnswer(null);
          setAnsweredCorrectly(null);
          
          // In a real app, we would fetch the next question from the server
          // For this demo, we'll just reset the timer
          setTimeLeft(currentQuestion.timeLimit);
        }, 3000);
      }, 500);
      
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, selectedAnswer, currentQuestion, toast]);
  
  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer === null && !isAnswerRevealed && timeLeft > 0) {
      setSelectedAnswer(answer);
    }
  };
  
  const getTimerColor = () => {
    if (timeLeft > currentQuestion.timeLimit * 0.6) return 'bg-green-500';
    if (timeLeft > currentQuestion.timeLimit * 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background p-4">
      {/* Header */}
      <header className="mb-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold">{playerName}</h2>
            <p className="text-sm text-muted-foreground">Game #{gameId}</p>
          </div>
          <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-full">
            <Trophy className="h-4 w-4 text-primary" />
            <span className="font-semibold">{score}</span>
          </div>
        </div>
      </header>
      
      {/* Timer */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Time remaining: {timeLeft}s</span>
        </div>
        <div className="w-full bg-card rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ${getTimerColor()}`}
            style={{ width: `${(timeLeft / currentQuestion.timeLimit) * 100}%` }}
          />
        </div>
      </div>
      
      {/* Question */}
      <div className="card-trivia p-6 mb-6">
        <h3 className="text-xl font-semibold mb-2">Question:</h3>
        <p className="text-lg mb-0">{currentQuestion.text}</p>
      </div>
      
      {/* Answer Options */}
      <div className="grid grid-cols-1 gap-3 mb-6">
        {currentQuestion.options.map((option, index) => (
          <Button
            key={index}
            className={`h-auto py-4 px-4 text-left justify-start text-base ${
              isAnswerRevealed 
                ? option === currentQuestion.correctAnswer
                  ? 'bg-green-500 hover:bg-green-600'
                  : selectedAnswer === option
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-card hover:bg-card/80'
                : selectedAnswer === option
                  ? 'bg-primary hover:bg-primary/90'
                  : 'bg-card hover:bg-card/80'
            }`}
            onClick={() => handleSelectAnswer(option)}
            disabled={selectedAnswer !== null || isAnswerRevealed}
          >
            {option}
          </Button>
        ))}
      </div>
      
      {/* Status Indicators */}
      {timeLeft === 0 && !isAnswerRevealed && (
        <div className="flex items-center gap-3 justify-center mt-4 text-muted-foreground">
          <AlertTriangle className="h-5 w-5" />
          <span>Time's up!</span>
        </div>
      )}
      
      {isAnswerRevealed && answeredCorrectly === true && (
        <div className="text-center mt-4 text-green-500 font-bold">
          Correct Answer!
        </div>
      )}
      
      {isAnswerRevealed && answeredCorrectly === false && (
        <div className="text-center mt-4 text-red-500 font-bold">
          Incorrect. The correct answer is {currentQuestion.correctAnswer}.
        </div>
      )}
    </div>
  );
};

export default PlayerGame;
