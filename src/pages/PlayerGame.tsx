import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trophy, Clock, AlertTriangle } from 'lucide-react';
import { gameSettings } from '@/utils/gameSettings';
import { supabase } from "@/integrations/supabase/client";
import { listenForGameStateChanges } from '@/utils/gameStateUtils';
import { baseStaticQuestions, getRandomQuestions, formatQuestionsForGame, StaticQuestion } from '@/utils/staticQuestions';

const PlayerGame = () => {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [registeredPlayerId, setRegisteredPlayerId] = useState<string | null>(null);
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
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [pendingPoints, setPendingPoints] = useState(0);
  const [pendingCorrect, setPendingCorrect] = useState(false);
  const [hasSelectedAnswer, setHasSelectedAnswer] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        
        // Use the static questions instead of loading from the database
        const randomQuestions = await getRandomQuestions(15);
        const formattedQuestions = formatQuestionsForGame(randomQuestions, gameSettings.questionDuration);
        
        if (formattedQuestions.length > 0) {
          console.log(`Loaded ${formattedQuestions.length} questions from static source for player view`);
          setQuestions(formattedQuestions);
          
          const gameState = localStorage.getItem('gameState');
          if (gameState) {
            const parsedState = JSON.parse(gameState);
            const initialQuestionIndex = parsedState.questionIndex || 0;
            setQuestionIndex(initialQuestionIndex);
            setCurrentQuestion(formattedQuestions[initialQuestionIndex] || formattedQuestions[0]);
            setCurrentGameState(parsedState.state || 'question');
            setTimeLeft(parsedState.state === 'question' ? parsedState.timeLeft : 0);
            setIsAnswerRevealed(parsedState.state === 'answer');
            
            // Reset "Time's Up" message when receiving a new question state
            if (parsedState.state === 'question' && parsedState.timeLeft > 0) {
              setShowTimeUp(false);
            }
          } else {
            setCurrentQuestion(formattedQuestions[0]);
          }
        }
      } catch (error) {
        console.error('Error loading questions for player:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
    
    // Register player on display screen
    const notifyDisplayAboutPlayer = () => {
      const storedName = sessionStorage.getItem('playerName');
      const storedGameId = sessionStorage.getItem('gameId');
      const storedIsRegistered = sessionStorage.getItem('isRegistered') === 'true';
      
      if (storedName && storedGameId) {
        localStorage.setItem('playerJoined', JSON.stringify({ 
          name: storedName, 
          gameId: storedGameId, 
          timestamp: Date.now(),
          isRegistered: storedIsRegistered
        }));
        console.log('Notified display about player:', storedName);
        
        // Broadcast a custom event for display screens in other windows
        const playerJoinedEvent = new CustomEvent('playerJoined', { 
          detail: { 
            name: storedName, 
            gameId: storedGameId, 
            timestamp: Date.now(),
            isRegistered: storedIsRegistered 
          }
        });
        window.dispatchEvent(playerJoinedEvent);
      }
    };
    
    // Call immediately and then periodically to ensure display screens are aware of this player
    notifyDisplayAboutPlayer();
    const notifyInterval = setInterval(notifyDisplayAboutPlayer, 5000);
    
    return () => clearInterval(notifyInterval);
  }, []);
  
  useEffect(() => {
    const checkRegisteredPlayer = async () => {
      const { data: session } = await supabase.auth.getSession();
      
      if (session && session.session) {
        const { data, error } = await supabase
          .from('registered_players')
          .select('id, name')
          .eq('user_id', session.session.user.id)
          .single();
          
        if (!error && data) {
          setIsRegistered(true);
          setRegisteredPlayerId(data.id);
          console.log('Found registered player:', data.name);
        }
      }
    };
    
    const storedName = sessionStorage.getItem('playerName');
    const storedGameId = sessionStorage.getItem('gameId');
    const storedIsRegistered = sessionStorage.getItem('isRegistered') === 'true';
    
    if (!storedName || !storedGameId) {
      toast({
        title: "Not Joined",
        description: "You need to join a game first.",
        variant: "destructive",
      });
      navigate('/join');
      return;
    }
    
    console.log('Player joined:', storedName, 'Game ID:', storedGameId, 'Registered:', storedIsRegistered);
    setPlayerName(storedName);
    setGameId(storedGameId);
    setIsRegistered(storedIsRegistered);
    
    localStorage.setItem('playerJoined', JSON.stringify({ 
      name: storedName, 
      gameId: storedGameId, 
      timestamp: Date.now(),
      isRegistered: storedIsRegistered
    }));
    
    if (storedIsRegistered) {
      checkRegisteredPlayer();
    }
    
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
            if (lastGameStateTimestamp > 0) {
              console.log('Game state is not newer, ignoring');
              setFailedSyncAttempts(prev => prev + 1);
              
              if (failedSyncAttempts > 20) {
                console.log('Forcing state sync after multiple failed attempts');
                setLastGameStateTimestamp(0);
                setFailedSyncAttempts(0);
              }
            }
            return;
          }
          
          setFailedSyncAttempts(0);
          setLastGameStateTimestamp(parsedState.timestamp);
          
          const newGameState = parsedState.state;
          setCurrentGameState(newGameState);
          
          if (parsedState.questionIndex !== questionIndex) {
            console.log(`Question index changed from ${questionIndex} to ${parsedState.questionIndex}`);
            setQuestionIndex(parsedState.questionIndex);
            
            if (questions.length > 0 && parsedState.questionIndex < questions.length) {
              setCurrentQuestion(questions[parsedState.questionIndex]);
              console.log('Updated current question to:', questions[parsedState.questionIndex]?.text);
            }
            
            setSelectedAnswer(null);
            setHasSelectedAnswer(false);
            setAnsweredCorrectly(null);
            setIsAnswerRevealed(newGameState === 'answer');
            setTimeLeft(newGameState === 'question' ? parsedState.timeLeft : 0);
            setPendingPoints(0);
            setPendingCorrect(false);
            
            // Clear "Time's Up" message when changing to a new question
            setShowTimeUp(false);
          } 
          else if (newGameState === 'question') {
            setTimeLeft(parsedState.timeLeft);
            
            if (parsedState.timeLeft > 0) {
              setAnsweredCorrectly(null);
              setShowTimeUp(false); // Clear "Time's Up" if timer is running
            } else if (parsedState.timeLeft === 0 && !isAnswerRevealed) {
              // Show "Time's Up" only when time is 0 and answer is not revealed
              setShowTimeUp(true);
            }
          }
          
          // When changing to answer state, reveal the correct/incorrect status
          if (newGameState === 'answer' && !isAnswerRevealed) {
            console.log('Changing to answer state');
            setIsAnswerRevealed(true);
            setTimeLeft(0);
            
            // Apply pending points and update answer status
            if (pendingPoints > 0 && pendingCorrect) {
              setScore(prevScore => prevScore + pendingPoints);
              setCorrectAnswers(prev => prev + 1);
              setAnsweredCorrectly(true);
              
              const playerScoreData = {
                name: playerName,
                score: score + pendingPoints,
                gameId: gameId,
                timestamp: Date.now(),
                isRegistered: isRegistered,
                correctAnswers: correctAnswers + 1
              };
              localStorage.setItem(`playerScore_${playerName}`, JSON.stringify(playerScoreData));
              
              console.log('Applied pending points:', pendingPoints);
              
              toast({
                title: "Correct!",
                description: `+${pendingPoints} points`,
                variant: "default",
              });
              
              // Reset pending values
              setPendingPoints(0);
              setPendingCorrect(false);
            } else if (hasSelectedAnswer) {
              setAnsweredCorrectly(false);
              console.log('Revealing incorrect answer');
              
              toast({
                title: "Incorrect",
                description: "Better luck on the next question!",
                variant: "default",
              });
            }
          } else if (newGameState === 'question' && isAnswerRevealed) {
            console.log('Changing back to question state');
            setIsAnswerRevealed(false);
            setSelectedAnswer(null);
            setHasSelectedAnswer(false);
            setAnsweredCorrectly(null);
            setPendingPoints(0);
            setPendingCorrect(false);
            
            // Only show "Time's Up" if timeLeft is 0 in question state
            setShowTimeUp(parsedState.timeLeft === 0);
          }
          
          if (newGameState === 'intermission' || newGameState === 'leaderboard') {
            console.log(`Display is showing ${newGameState}, waiting...`);
            setSelectedAnswer(null);
            setHasSelectedAnswer(false);
            setAnsweredCorrectly(null);
            setIsAnswerRevealed(false);
            setPendingPoints(0);
            setPendingCorrect(false);
            setShowTimeUp(false); // Clear "Time's Up" when in intermission or leaderboard
          }
        } catch (error) {
          console.error('Error parsing game state', error);
        }
      } else {
        console.log('No game state found in localStorage');
        setFailedSyncAttempts(prev => prev + 1);
      }
    };
    
    const intervalId = setInterval(checkGameState, 200);
    return () => clearInterval(intervalId);
  }, [questionIndex, isAnswerRevealed, lastGameStateTimestamp, failedSyncAttempts, questions, currentGameState, answeredCorrectly, pendingPoints, pendingCorrect, hasSelectedAnswer, score, playerName, gameId, isRegistered, correctAnswers, toast]);
  
  useEffect(() => {
    const cleanupListener = listenForGameStateChanges((gameState) => {
      console.log('Received game state change event in player:', gameState);
      
      if (gameState.timestamp > lastGameStateTimestamp) {
        setLastGameStateTimestamp(gameState.timestamp);
        setCurrentGameState(gameState.state);
        
        if (gameState.questionIndex !== questionIndex) {
          setQuestionIndex(gameState.questionIndex);
          
          if (questions.length > 0 && gameState.questionIndex < questions.length) {
            setCurrentQuestion(questions[gameState.questionIndex]);
            console.log('Custom event updated question to:', questions[gameState.questionIndex]?.text);
          }
          
          setSelectedAnswer(null);
          setHasSelectedAnswer(false);
          setAnsweredCorrectly(null);
          setIsAnswerRevealed(gameState.state === 'answer');
          setPendingPoints(0);
          setPendingCorrect(false);
          
          // Clear "Time's Up" message when changing to a new question
          setShowTimeUp(false);
        }
        
        if (gameState.state === 'question') {
          setTimeLeft(gameState.timeLeft);
          
          if (gameState.timeLeft > 0) {
            setAnsweredCorrectly(null);
            setShowTimeUp(false); // Clear "Time's Up" if timer is running
          } else if (gameState.timeLeft === 0 && !isAnswerRevealed) {
            // Show "Time's Up" when answering period has ended
            setShowTimeUp(true);
          }
        } else if (gameState.state === 'answer') {
          setIsAnswerRevealed(true);
          setTimeLeft(0);
          setShowTimeUp(false); // Clear "Time's Up" message in answer state
          
          // Apply pending points
          if (pendingPoints > 0 && pendingCorrect) {
            setScore(prevScore => prevScore + pendingPoints);
            setCorrectAnswers(prev => prev + 1);
            setAnsweredCorrectly(true);
            
            const playerScoreData = {
              name: playerName,
              score: score + pendingPoints,
              gameId: gameId,
              timestamp: Date.now(),
              isRegistered: isRegistered,
              correctAnswers: correctAnswers + 1
            };
            localStorage.setItem(`playerScore_${playerName}`, JSON.stringify(playerScoreData));
            
            console.log('Applied pending points via game event:', pendingPoints);
            
            toast({
              title: "Correct!",
              description: `+${pendingPoints} points`,
              variant: "default",
            });
            
            setPendingPoints(0);
            setPendingCorrect(false);
          } else if (hasSelectedAnswer) {
            setAnsweredCorrectly(false);
            
            toast({
              title: "Incorrect",
              description: "Better luck on the next question!",
              variant: "default",
            });
          }
        } else if (gameState.state === 'intermission' || gameState.state === 'leaderboard') {
          setShowTimeUp(false); // Clear "Time's Up" in intermission or leaderboard
        }
      }
    });
    
    return cleanupListener;
  }, [lastGameStateTimestamp, questionIndex, questions, currentGameState, answeredCorrectly, isAnswerRevealed, pendingPoints, pendingCorrect, hasSelectedAnswer, score, playerName, gameId, isRegistered, correctAnswers, toast]);
  
  useEffect(() => {
    if (selectedAnswer !== null && !isAnswerRevealed && timeLeft > 0 && currentQuestion) {
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      
      if (isCorrect) {
        const pointsEarned = 100 + (timeLeft * 10);
        // Instead of applying points immediately, store them for later
        setPendingPoints(pointsEarned);
        setPendingCorrect(true);
        console.log('Stored pending points:', pointsEarned);
      } else {
        // Just mark that we selected an answer, but don't reveal result yet
        console.log('Answer selected, but result hidden until reveal');
      }
      
      setHasSelectedAnswer(true);
    }
  }, [selectedAnswer, currentQuestion, timeLeft, isAnswerRevealed]);
  
  useEffect(() => {
    const updateGameHistory = async () => {
      if (isRegistered && registeredPlayerId && currentGameState === 'leaderboard' && questions.length > 0) {
        try {
          // Check if we already recorded this game
          const gameHistoryKey = `game_history_${gameId}_${registeredPlayerId}`;
          const historyRecorded = localStorage.getItem(gameHistoryKey) === 'true';
          
          if (!historyRecorded) {
            const { error } = await supabase
              .from('player_game_history')
              .insert({
                player_id: registeredPlayerId,
                game_id: gameId,
                score: score,
                correct_answers: correctAnswers,
                total_questions: questions.length
              });
              
            if (error) {
              console.error('Error saving game history:', error);
            } else {
              console.log('Game history saved for registered player:', playerName);
              localStorage.setItem(gameHistoryKey, 'true');
            }
          }
        } catch (error) {
          console.error('Error updating game history:', error);
        }
      }
    };
    
    updateGameHistory();
  }, [currentGameState, isRegistered, registeredPlayerId, gameId, score, correctAnswers, questions.length, playerName]);
  
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
    setFailedSyncAttempts(0);
    setShowTimeUp(false); // Reset time's up message when forcing sync
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
            {isRegistered && (
              <p className="text-sm text-muted-foreground mt-2">
                Your score will be saved to your account
              </p>
            )}
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
  
  if (showTimeUp && timeLeft === 0 && !isAnswerRevealed && currentGameState === 'question') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Time's Up!</h2>
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
          <Button variant="outline" size="sm" onClick={handleForceSync} className="mr-2">
            Force Sync
          </Button>
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Game State: {currentGameState}</p>
            <p>Question Index: {questionIndex}</p>
            <p>Current Time Left: {timeLeft}</p>
            <p>Show Time's Up: {showTimeUp.toString()}</p>
            <p>Last Sync: {new Date(lastGameStateTimestamp).toLocaleTimeString()}</p>
            <p>Questions loaded: {questions.length}</p>
            <p>Failed sync attempts: {failedSyncAttempts}</p>
            <p>Registered player: {isRegistered ? 'Yes' : 'No'}</p>
            <p>Pending points: {pendingPoints}</p>
            <p>Has selected answer: {hasSelectedAnswer ? 'Yes' : 'No'}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerGame;
