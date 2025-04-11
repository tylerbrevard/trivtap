
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trophy, Clock, AlertTriangle } from 'lucide-react';
import { gameSettings } from '@/utils/gameSettings';
import { supabase } from "@/integrations/supabase/client";

const PlayerGame = () => {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [answeredCorrectly, setAnsweredCorrectly] = useState<boolean | null>(null);
  const [lastGameStateTimestamp, setLastGameStateTimestamp] = useState<number>(0);
  const [currentGameState, setCurrentGameState] = useState<string>('question');
  const [failedSyncAttempts, setFailedSyncAttempts] = useState(0);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Load questions from Supabase
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        
        const { data: buckets, error: bucketsError } = await supabase
          .from('buckets')
          .select('id')
          .eq('is_default', true)
          .limit(1);
          
        if (bucketsError) {
          console.error('Error fetching default bucket:', bucketsError);
          setLoading(false);
          return;
        }
        
        if (buckets && buckets.length > 0) {
          const defaultBucketId = buckets[0].id;
          
          const { data: bucketQuestions, error: questionsError } = await supabase
            .from('bucket_questions')
            .select(`
              question_id,
              questions:question_id (
                id, 
                text, 
                options, 
                correct_answer, 
                categories:category_id (
                  id,
                  name
                )
              )
            `)
            .eq('bucket_id', defaultBucketId);
            
          if (questionsError) {
            console.error('Error fetching questions:', questionsError);
            setLoading(false);
            return;
          }
          
          if (bucketQuestions && bucketQuestions.length > 0) {
            const formattedQuestions = bucketQuestions.map(item => {
              const question = item.questions;
              
              let options: string[] = [];
              if (question.options) {
                if (Array.isArray(question.options)) {
                  options = question.options.map(opt => String(opt));
                } else if (typeof question.options === 'string') {
                  try {
                    const parsedOptions = JSON.parse(question.options);
                    options = Array.isArray(parsedOptions) ? parsedOptions.map(opt => String(opt)) : [];
                  } catch {
                    options = [String(question.options)];
                  }
                }
              }
              
              return {
                id: question.id,
                text: question.text,
                options: options,
                correctAnswer: question.correct_answer,
                category: question.categories ? question.categories.name : 'General',
                timeLimit: gameSettings.questionDuration
              };
            });
            
            if (formattedQuestions.length > 0) {
              console.log(`Loaded ${formattedQuestions.length} questions from the default bucket for player view`);
              setQuestions(formattedQuestions);
              
              // Initialize with the first question
              const gameState = localStorage.getItem('gameState');
              if (gameState) {
                const parsedState = JSON.parse(gameState);
                setCurrentQuestion(formattedQuestions[parsedState.questionIndex] || formattedQuestions[0]);
              } else {
                setCurrentQuestion(formattedQuestions[0]);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading questions for player:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, []);
  
  console.log('Player screen - current question index:', questionIndex);
  console.log('Player screen - questions available:', questions.length);
  
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
  
  // Monitor game state changes
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
          
          if (parsedState.state === 'leaderboard') {
            console.log('Display is showing leaderboard, waiting...');
            setSelectedAnswer(null);
            setAnsweredCorrectly(null);
            setIsAnswerRevealed(false);
            return;
          }
          
          if (parsedState.questionIndex !== questionIndex) {
            console.log('Question index changed:', parsedState.questionIndex);
            setQuestionIndex(parsedState.questionIndex);
            
            if (questions.length > 0 && parsedState.questionIndex < questions.length) {
              setCurrentQuestion(questions[parsedState.questionIndex]);
              console.log('Updated current question to:', questions[parsedState.questionIndex]?.text);
            }
            
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
  }, [questionIndex, isAnswerRevealed, lastGameStateTimestamp, failedSyncAttempts, questions]);
  
  // Register event listener for game state changes
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      console.log('Received game state change event in player:', event.detail);
      if (event.detail.timestamp > lastGameStateTimestamp) {
        setLastGameStateTimestamp(event.detail.timestamp);
        setCurrentGameState(event.detail.state);
        
        if (event.detail.questionIndex !== questionIndex) {
          setQuestionIndex(event.detail.questionIndex);
          
          if (questions.length > 0 && event.detail.questionIndex < questions.length) {
            setCurrentQuestion(questions[event.detail.questionIndex]);
          }
        }
      }
    };
    
    window.addEventListener('triviaStateChange', handleStateChange as EventListener);
    
    return () => {
      window.removeEventListener('triviaStateChange', handleStateChange as EventListener);
    };
  }, [lastGameStateTimestamp, questionIndex, questions]);
  
  useEffect(() => {
    if (selectedAnswer !== null && !isAnswerRevealed && timeLeft > 0 && currentQuestion) {
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
    if (!currentQuestion) return 'bg-green-500';
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
          <p className="text-lg mb-6">Please wait while we load your trivia game.</p>
        </div>
      </div>
    );
  }
  
  if (currentGameState === 'intermission' || currentGameState === 'leaderboard') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">
            {currentGameState === 'intermission' ? 'Intermission' : 'Leaderboard'}
          </h2>
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
  
  if (!currentQuestion) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Waiting for Game...</h2>
          <p className="text-lg mb-6">The host will start the game shortly.</p>
          
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
            style={{ width: `${(timeLeft / (currentQuestion?.timeLimit || 20)) * 100}%` }}
          />
        </div>
      </div>
      
      <div className="card-trivia p-6 mb-6">
        <h3 className="text-xl font-semibold mb-2">Question:</h3>
        <p className="text-lg mb-0">{currentQuestion.text}</p>
      </div>
      
      <div className="grid grid-cols-1 gap-3 mb-6">
        {currentQuestion.options.map((option: string, index: number) => (
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
            <p>Questions loaded: {questions.length}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerGame;
