import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trophy, Clock, AlertTriangle } from 'lucide-react';
import { gameSettings } from '@/utils/gameSettings';

const sampleQuestions = [
  {
    id: '1',
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 'Mars',
    timeLimit: gameSettings.questionDuration,
  },
  {
    id: '2',
    text: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Michelangelo'],
    correctAnswer: 'Leonardo da Vinci',
    timeLimit: gameSettings.questionDuration,
  },
  {
    id: '3',
    text: 'In which year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correctAnswer: '1945',
    timeLimit: gameSettings.questionDuration,
  },
  {
    id: '4',
    text: 'Which of these elements has the chemical symbol \'Au\'?',
    options: ['Silver', 'Gold', 'Aluminum', 'Argon'],
    correctAnswer: 'Gold',
    timeLimit: gameSettings.questionDuration,
  },
  {
    id: '5',
    text: 'What is the capital city of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctAnswer: 'Canberra',
    timeLimit: gameSettings.questionDuration,
  },
  {
    id: '6',
    text: 'Who wrote the novel \'Pride and Prejudice\'?',
    options: ['Jane Austen', 'Charles Dickens', 'Emily Brontë', 'F. Scott Fitzgerald'],
    correctAnswer: 'Jane Austen',
    timeLimit: gameSettings.questionDuration,
  },
  {
    id: '7',
    text: 'Which of these is NOT a programming language?',
    options: ['Python', 'Java', 'Cougar', 'Ruby'],
    correctAnswer: 'Cougar',
    timeLimit: gameSettings.questionDuration,
  }
];

const PlayerGame = () => {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(sampleQuestions[0]);
  const [timeLeft, setTimeLeft] = useState(currentQuestion.timeLimit);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);
  const [lastGameStateTimestamp, setLastGameStateTimestamp] = useState<number>(0);
  const [currentGameState, setCurrentGameState] = useState<string>('question');
  const [failedSyncAttempts, setFailedSyncAttempts] = useState(0);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  console.log('Player screen - current question index:', questionIndex);
  console.log('Player screen - current question:', currentQuestion.text);
  console.log('Player screen - answer revealed:', isAnswerRevealed);
  console.log('Player screen - current game state:', currentGameState);
  
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
    
    console.log('Player joined:', storedName, 'Game ID:', storedGameId);
    setPlayerName(storedName);
    setGameId(storedGameId);
    
    localStorage.setItem('playerJoined', JSON.stringify({ 
      name: storedName, 
      gameId: storedGameId, 
      timestamp: Date.now() 
    }));
    
    console.log('Notified display about player:', storedName);
  }, [navigate, toast]);
  
  useEffect(() => {
    const checkGameState = () => {
      const storedGameState = localStorage.getItem('gameState');
      if (storedGameState) {
        try {
          const parsedState = JSON.parse(storedGameState);
          console.log('Checking game state:', parsedState);
          
          if (!parsedState.timestamp || parsedState.timestamp <= lastGameStateTimestamp) {
            console.log('Game state is not newer, ignoring');
            setFailedSyncAttempts(prev => prev + 1);
            
            if (failedSyncAttempts > 20) {
              console.log('Forcing state sync after multiple failed attempts');
              setLastGameStateTimestamp(0);
              setFailedSyncAttempts(0);
            }
            return;
          }
          
          setFailedSyncAttempts(0);
          setLastGameStateTimestamp(parsedState.timestamp);
          setCurrentGameState(parsedState.state);
          
          if (parsedState.state === 'intermission') {
            console.log('Display is showing intermission, waiting...');
            setSelectedAnswer(null);
            setAnsweredCorrectly(null);
            setIsAnswerRevealed(false);
            return;
          }
          
          if (parsedState.questionIndex !== questionIndex) {
            console.log('Question index changed:', parsedState.questionIndex);
            setQuestionIndex(parsedState.questionIndex);
            setCurrentQuestion(sampleQuestions[parsedState.questionIndex]);
            setTimeLeft(parsedState.state === 'question' ? parsedState.timeLeft : 0);
            setSelectedAnswer(null);
            setAnsweredCorrectly(null);
            setIsAnswerRevealed(parsedState.state === 'answer');
          } else {
            if (parsedState.state === 'answer' && !isAnswerRevealed) {
              console.log('Changing to answer state');
              setIsAnswerRevealed(true);
              setTimeLeft(0);
            } else if (parsedState.state === 'question' && isAnswerRevealed) {
              console.log('Changing back to question state');
              setIsAnswerRevealed(false);
              setTimeLeft(parsedState.timeLeft);
              setSelectedAnswer(null);
              setAnsweredCorrectly(null);
            } else if (parsedState.state === 'question' && !isAnswerRevealed) {
              setTimeLeft(parsedState.timeLeft);
            }
          }
        } catch (error) {
          console.error('Error parsing game state', error);
        }
      } else {
        console.log('No game state found in localStorage');
        setFailedSyncAttempts(prev => prev + 1);
      }
    };
    
    const intervalId = setInterval(checkGameState, 300);
    return () => clearInterval(intervalId);
  }, [questionIndex, isAnswerRevealed, lastGameStateTimestamp, failedSyncAttempts]);
  
  useEffect(() => {
    if (selectedAnswer !== null && !isAnswerRevealed && timeLeft > 0) {
      const timerId = setTimeout(() => {
        if (selectedAnswer === currentQuestion.correctAnswer) {
          const pointsEarned = 100 + (timeLeft * 10);
          setScore(prevScore => prevScore + pointsEarned);
          setAnsweredCorrectly(true);
          
          const playerScoreData = {
            name: playerName,
            score: score + pointsEarned,
            gameId: gameId,
            timestamp: Date.now()
          };
          localStorage.setItem(`playerScore_${playerName}`, JSON.stringify(playerScoreData));
          
          console.log('Correct answer!', 'Points earned:', pointsEarned, 'Updated player score data:', playerScoreData);
          toast({
            title: "Correct!",
            description: `+${pointsEarned} points`,
            variant: "default",
          });
        } else {
          setAnsweredCorrectly(false);
          console.log('Incorrect answer');
          toast({
            title: "Incorrect",
            description: "Better luck on the next question!",
            variant: "default",
          });
        }
      }, 500);
      
      return () => clearTimeout(timerId);
    }
  }, [selectedAnswer, currentQuestion, toast, timeLeft, playerName, gameId, score]);
  
  const handleSelectAnswer = (answer: string) => {
    if (selectedAnswer === null && !isAnswerRevealed && timeLeft > 0) {
      console.log('Selected answer:', answer);
      setSelectedAnswer(answer);
    }
  };
  
  const getTimerColor = () => {
    if (timeLeft > currentQuestion.timeLimit * 0.6) return 'bg-green-500';
    if (timeLeft > currentQuestion.timeLimit * 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const handleForceSync = () => {
    setLastGameStateTimestamp(0);
    toast({
      title: "Syncing",
      description: "Forced sync with game state",
    });
  };
  
  if (currentGameState === 'intermission') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Intermission</h2>
          <p className="text-lg mb-6">The next question will appear shortly...</p>
          <div className="bg-muted p-4 rounded-md">
            <p className="text-md font-medium">Your Score</p>
            <p className="text-2xl font-bold text-primary">{score}</p>
          </div>
          
          {process.env.NODE_ENV === 'development' && (
            <Button variant="outline" size="sm" onClick={handleForceSync} className="mt-4">
              Force Sync
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col bg-background p-4">
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
      
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Time remaining: {timeLeft}s</span>
        </div>
        <div className="w-full bg-card rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${getTimerColor()}`}
            style={{ width: `${(timeLeft / currentQuestion.timeLimit) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="card-trivia p-6 mb-6">
        <h3 className="text-xl font-semibold mb-2">Question:</h3>
        <p className="text-lg mb-0">{currentQuestion.text}</p>
      </div>
      
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
      
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 border border-dashed border-gray-300 rounded-md">
          <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
          <Button variant="outline" size="sm" onClick={handleForceSync}>
            Force Sync
          </Button>
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Game State: {currentGameState}</p>
            <p>Question Index: {questionIndex}</p>
            <p>Last Sync: {new Date(lastGameStateTimestamp).toLocaleTimeString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerGame;
