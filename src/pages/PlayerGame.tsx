import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trophy, Clock, AlertTriangle } from 'lucide-react';
import { gameSettings } from '@/utils/gameSettings';
import { supabase } from "@/integrations/supabase/client";
import { listenForGameStateChanges } from '@/utils/gameStateUtils';
import { baseStaticQuestions, getAllAvailableQuestions, getRandomQuestions, formatQuestionsForGame, StaticQuestion } from '@/utils/staticQuestions';
import { recoverFromDisplayTruth } from '@/utils/gameStateUtils';

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
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
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
        
        const allQuestions = await getAllAvailableQuestions();
        const formattedQuestions = formatQuestionsForGame(allQuestions, gameSettings.questionDuration);
        
        if (formattedQuestions.length > 0) {
          console.log(`Loaded ${formattedQuestions.length} questions from all sources for player view`);
          setQuestions(formattedQuestions);
          
          const gameState = localStorage.getItem('gameState');
          if (gameState) {
            const parsedState = JSON.parse(gameState);
            console.log('Found stored game state:', parsedState);
            
            const initialQuestionIndex = parsedState.questionIndex || 0;
            setQuestionIndex(initialQuestionIndex);
            
            if (formattedQuestions[initialQuestionIndex]) {
              setCurrentQuestion(formattedQuestions[initialQuestionIndex]);
              console.log('Set current question to:', formattedQuestions[initialQuestionIndex].text);
            } else {
              console.error('Question index out of bounds:', initialQuestionIndex, 'max:', formattedQuestions.length - 1);
              setCurrentQuestion(formattedQuestions[0]);
            }
            
            setCurrentGameState(parsedState.state || 'question');
            setTimeLeft(parsedState.state === 'question' ? parsedState.timeLeft : 0);
            setIsAnswerRevealed(parsedState.state === 'answer');
            
            if (parsedState.state === 'question' && parsedState.timeLeft > 0) {
              setShowTimeUp(false);
            }
          } else {
            console.warn('No game state found, defaulting to first question');
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
          
          // Special handling for question state that should override intermission
          if (parsedState.state === 'question' && 
              (parsedState.overrideIntermission || parsedState.supercedeAllStates ||
               parsedState.definitiveTruth || parsedState.guaranteedDelivery)) {
            
            console.log('Processing highest-priority question state override:', parsedState);
            
            setLastGameStateTimestamp(parsedState.timestamp);
            setCurrentGameState('question'); // Force question state
            setQuestionIndex(parsedState.questionIndex);
            setTimeLeft(parsedState.timeLeft);
            
            if (questions.length > 0 && parsedState.questionIndex >= 0 && parsedState.questionIndex < questions.length) {
              setCurrentQuestion(questions[parsedState.questionIndex]);
              console.log('RESET current question to:', questions[parsedState.questionIndex]?.text);
            }
            
            setSelectedAnswer(null);
            setHasSelectedAnswer(false);
            setAnsweredCorrectly(null);
            setIsAnswerRevealed(false); // Ensure answer state is correct
            setPendingPoints(0);
            setPendingCorrect(false);
            setShowTimeUp(false);
            setFailedSyncAttempts(0);
            
            // Also store a flag that we've processed this override, to avoid circular state issues
            sessionStorage.setItem('last_override_processed', String(parsedState.timestamp));
            
            return; // Skip the rest of the state handling for this priority override
          }
          
          // Always accept definitive truth, regardless of timestamp
          if (parsedState.definitiveTruth || parsedState.guaranteedDelivery || parsedState.forceSync) {
            console.log('Processing definitive game state:', parsedState);
            
            setLastGameStateTimestamp(parsedState.timestamp);
            setCurrentGameState(parsedState.state);
            setQuestionIndex(parsedState.questionIndex);
            setTimeLeft(parsedState.state === 'question' ? parsedState.timeLeft : 0);
            
            if (questions.length > 0 && parsedState.questionIndex >= 0 && parsedState.questionIndex < questions.length) {
              setCurrentQuestion(questions[parsedState.questionIndex]);
              console.log('Updated current question to:', questions[parsedState.questionIndex]?.text);
            }
            
            setSelectedAnswer(null);
            setHasSelectedAnswer(false);
            setAnsweredCorrectly(null);
            setIsAnswerRevealed(parsedState.state === 'answer');
            setPendingPoints(0);
            setPendingCorrect(false);
            setShowTimeUp(false);
            setFailedSyncAttempts(0);
            
            return;
          }
          
          // Standard timestamp-based check for non-definitive updates
          if (!parsedState.timestamp || parsedState.timestamp <= lastGameStateTimestamp) {
            if (lastGameStateTimestamp > 0) {
              console.log('Game state is not newer, ignoring');
              setFailedSyncAttempts(prev => prev + 1);
              
              if (failedSyncAttempts > 10) {
                console.log('Multiple sync failures detected, resetting timestamp to accept any state');
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
            
            if (questions.length > 0) {
              const newQuestionIndex = parsedState.questionIndex;
              if (newQuestionIndex >= 0 && newQuestionIndex < questions.length) {
                const newQuestion = questions[newQuestionIndex];
                setCurrentQuestion(newQuestion);
                console.log('Updated current question to:', newQuestion?.text);
              } else {
                console.error('New question index out of range:', newQuestionIndex, 'max:', questions.length - 1);
              }
            }
            
            setSelectedAnswer(null);
            setHasSelectedAnswer(false);
            setAnsweredCorrectly(null);
            setIsAnswerRevealed(newGameState === 'answer');
            setTimeLeft(newGameState === 'question' ? parsedState.timeLeft : 0);
            setPendingPoints(0);
            setPendingCorrect(false);
            
            setShowTimeUp(false);
          } 
          else if (newGameState === 'question') {
            setTimeLeft(parsedState.timeLeft);
            
            if (parsedState.timeLeft > 0) {
              setAnsweredCorrectly(null);
              setShowTimeUp(false);
            } else if (parsedState.timeLeft === 0 && !isAnswerRevealed) {
              setShowTimeUp(true);
            }
          }
          
          if (newGameState === 'answer' && !isAnswerRevealed) {
            console.log('Changing to answer state');
            setIsAnswerRevealed(true);
            setTimeLeft(0);
            
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
            setShowTimeUp(false);
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
    
    // More aggressive recovery for intermission states
    const forceSyncIntervalId = setInterval(() => {
      // If in intermission for too long, try to recover display truth
      if (currentGameState === 'intermission' && failedSyncAttempts > 3) {
        console.log('Periodic sync check - attempting recovery from intermission');
        
        // Clear existing state to avoid circular references
        localStorage.removeItem('gameState');
        
        // Then try to recover from display truth
        recoverFromDisplayTruth();
      }
    }, 3000); // Check more frequently
    
    return () => {
      clearInterval(intervalId);
      clearInterval(forceSyncIntervalId);
    };
  }, [questionIndex, isAnswerRevealed, lastGameStateTimestamp, failedSyncAttempts, questions, currentGameState, answeredCorrectly, pendingPoints, pendingCorrect, hasSelectedAnswer, score, playerName, gameId, isRegistered, correctAnswers, toast]);
  
  useEffect(() => {
    const cleanupListener = listenForGameStateChanges((gameState) => {
      console.log('Received game state change event in player:', gameState);
      
      // Special override handling for intermission escape
      if (gameState.state === 'question' && 
          (gameState.overrideIntermission || gameState.supercedeAllStates)) {
        console.log('Processing override state change to escape intermission:', gameState);
        
        // Force to question state immediately
        setCurrentGameState('question');
        setQuestionIndex(gameState.questionIndex);
        setTimeLeft(gameState.timeLeft);
        setLastGameStateTimestamp(gameState.timestamp);
        
        if (questions.length > 0) {
          const newIndex = gameState.questionIndex;
          if (newIndex >= 0 && newIndex < questions.length) {
            setCurrentQuestion(questions[newIndex]);
            console.log('Override updated question to:', questions[newIndex]?.text);
          }
        }
        
        setSelectedAnswer(null);
        setHasSelectedAnswer(false);
        setAnsweredCorrectly(null);
        setIsAnswerRevealed(false);
        setPendingPoints(0);
        setPendingCorrect(false);
        setShowTimeUp(false);
        setFailedSyncAttempts(0);
        
        return; // Skip other state handling for this override
      }
      
      // Always accept definitive truth updates
      if (gameState.definitiveTruth || gameState.guaranteedDelivery || gameState.forceSync) {
        console.log('Accepting definitive game state update from event:', gameState);
        setLastGameStateTimestamp(gameState.timestamp);
        setCurrentGameState(gameState.state);
        setQuestionIndex(gameState.questionIndex);
        
        if (questions.length > 0) {
          const newIndex = gameState.questionIndex;
          if (newIndex >= 0 && newIndex < questions.length) {
            setCurrentQuestion(questions[newIndex]);
            console.log('Event updated question to:', questions[newIndex]?.text);
          } else {
            console.error('Event provided invalid question index:', newIndex, 'max:', questions.length - 1);
          }
        }
        
        setSelectedAnswer(null);
        setHasSelectedAnswer(false);
        setAnsweredCorrectly(null);
        setIsAnswerRevealed(gameState.state === 'answer');
        if (gameState.state === 'question') {
          setTimeLeft(gameState.timeLeft);
        } else {
          setTimeLeft(0);
        }
        setPendingPoints(0);
        setPendingCorrect(false);
        setShowTimeUp(false);
        setFailedSyncAttempts(0);
        return;
      }
      
      // Standard timestamp check for non-definitive updates
      if (gameState.timestamp > lastGameStateTimestamp) {
        setLastGameStateTimestamp(gameState.timestamp);
        setCurrentGameState(gameState.state);
        
        if (gameState.questionIndex !== questionIndex) {
          console.log(`Question index changed from ${questionIndex} to ${gameState.questionIndex}`);
          setQuestionIndex(gameState.questionIndex);
          
          if (questions.length > 0) {
            const newIndex = gameState.questionIndex;
            if (newIndex >= 0 && newIndex < questions.length) {
              setCurrentQuestion(questions[newIndex]);
              console.log('Event updated question to:', questions[newIndex]?.text);
            } else {
              console.error('Event provided invalid question index:', newIndex, 'max:', questions.length - 1);
            }
          }
          
          setSelectedAnswer(null);
          setHasSelectedAnswer(false);
          setAnsweredCorrectly(null);
          setIsAnswerRevealed(gameState.state === 'answer');
          setPendingPoints(0);
          setPendingCorrect(false);
          setShowTimeUp(false);
        }
        
        if (gameState.state === 'question') {
          setTimeLeft(gameState.timeLeft);
          
          if (gameState.timeLeft > 0) {
            setAnsweredCorrectly(null);
            setShowTimeUp(false);
          } else if (gameState.timeLeft === 0 && !isAnswerRevealed) {
            setShowTimeUp(true);
          }
        } else if (gameState.state === 'answer') {
          setIsAnswerRevealed(true);
          setTimeLeft(0);
          setShowTimeUp(false);
          
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
          setShowTimeUp(false);
        }
      }
    });
    
    return cleanupListener;
  }, [lastGameStateTimestamp, questionIndex, questions, currentGameState, answeredCorrectly, isAnswerRevealed, pendingPoints, pendingCorrect, hasSelectedAnswer, score, playerName, gameId, isRegistered, correctAnswers, toast]);

  // Add a more direct fix for intermission state
  useEffect(() => {
    // Special check focused on fixing stuck intermission state
    const fixIntermissionLoop = () => {
      // If we're stuck in intermission
      if (currentGameState === 'intermission') {
        console.log('Running special intermission state check...');
        
        // Try to retrieve display truth which may have question state
        const displayTruth = localStorage.getItem('gameState_display_truth');
        if (displayTruth) {
          try {
            const truthState = JSON.parse(displayTruth);
            
            // If display is showing a question but we're in intermission, force question state
            if (truthState.state === 'question') {
              console.log('Found display truth showing question while player is in intermission! Fixing.');
              
              setCurrentGameState('question');
              setQuestionIndex(truthState.questionIndex);
              setTimeLeft(truthState.timeLeft);
              setLastGameStateTimestamp(truthState.timestamp);
              
              if (questions.length > 0 && truthState.questionIndex >= 0 && truthState.questionIndex < questions.length) {
                setCurrentQuestion(questions[truthState.questionIndex]);
                console.log('Emergency fix updated question to:', questions[truthState.questionIndex]?.text);
              }
              
              setSelectedAnswer(null);
              setHasSelectedAnswer(false);
              setAnsweredCorrectly(null);
              setIsAnswerRevealed(false);
              setPendingPoints(0);
              setPendingCorrect(false);
              setShowTimeUp(false);
              setFailedSyncAttempts(0);
              
              // Also broadcast that we're fixing this issue
              window.dispatchEvent(new CustomEvent('playerStateFixed', { 
                detail: {
                  player: playerName,
                  fixedFrom: 'intermission',
                  fixedTo: 'question'
                }
              }));
            }
          } catch (error) {
            console.error('Error checking display truth for intermission fix:', error);
          }
        }
      }
    };
    
    // Run this check immediately
    fixIntermissionLoop();
    
    // And setup an interval to keep checking
    const intermissionFixInterval = setInterval(fixIntermissionLoop, 3000);
    
    return () => {
      clearInterval(intermissionFixInterval);
    };
  }, [currentGameState, playerName, questionIndex, questions, lastGameStateTimestamp]);
  
  useEffect(() => {
    if (selectedAnswer !== null && !isAnswerRevealed && timeLeft > 0 && currentQuestion) {
      const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
      
      if (isCorrect) {
        const pointsEarned = 100 + (timeLeft * 10);
        setPendingPoints(pointsEarned);
        setPendingCorrect(true);
        console.log('Stored pending points:', pointsEarned);
      } else {
        console.log('Answer selected, but result hidden until reveal');
      }
      
      setHasSelectedAnswer(true);
    }
  }, [selectedAnswer, currentQuestion, timeLeft, isAnswerRevealed]);
  
  useEffect(() => {
    const updateGameHistory = async () => {
      if (isRegistered && registeredPlayerId && currentGameState === 'leaderboard' && questions.length > 0) {
        try {
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
    console.log('Manual force sync requested');
    
    // Reset timestamp to accept any newer state
    setLastGameStateTimestamp(0);
    setFailedSyncAttempts(0);
    setShowTimeUp(false);
    
    // Clear localStorage game state to avoid circular references
    localStorage.removeItem('gameState');
    
    // Try to recover from display truth
    const recovered = recoverFromDisplayTruth();
    
    if (!recovered) {
      // If recovery didn't work, request a new definitive state from display
      console.log('Requesting new definitive state from display');
      window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
        detail: {
          playerName,
          gameId,
          timestamp: Date.now()
        }
      }));
    }
    
    // Reload questions
    const reloadQuestions = async () => {
      try {
        const allQuestions = await getAllAvailableQuestions();
        const formattedQuestions = formatQuestionsForGame(allQuestions, gameSettings.questionDuration);
        
        if (formattedQuestions.length > 0) {
          setQuestions(formattedQuestions);
          
          const gameState = localStorage.getItem('gameState');
          if (gameState) {
            const parsedState = JSON.parse(gameState);
            if (parsedState.questionIndex >= 0 && parsedState.questionIndex < formattedQuestions.length) {
              setCurrentQuestion(formattedQuestions[parsedState.questionIndex]);
            }
          }
        }
      } catch (error) {
        console.error('Error reloading questions:', error);
      }
    };
    
    reloadQuestions();
    
    toast({
      title: "Syncing",
      description: "Recovering game state and reloading questions",
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
          Correct
