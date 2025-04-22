import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { gameSettings } from '@/utils/gameSettings';
import { supabase } from "@/integrations/supabase/client";
import { listenForGameStateChanges } from '@/utils/gameStateUtils';
import { getAllAvailableQuestions, formatQuestionsForGame } from '@/utils/staticQuestions';
import { recoverFromDisplayTruth } from '@/utils/gameStateUtils';
import PlayerGameHeader from "@/components/player/PlayerGameHeader";
import PlayerGameMain from "@/components/player/PlayerGameMain";
import PlayerGameStatus from "@/components/player/PlayerGameStatus";

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
  const [lastKnownQuestion, setLastKnownQuestion] = useState<number>(0);
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
            const newQuestion = questions[newIndex];
            setCurrentQuestion(newQuestion);
            console.log('Override updated question to:', newQuestion?.text);
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

  useEffect(() => {
    const fixIntermissionLoop = () => {
      if (currentGameState === 'intermission') {
        console.log('Running robust intermission state recovery...');
        const displayTruth = localStorage.getItem('gameState_display_truth');
        if (displayTruth) {
          try {
            const truthState = JSON.parse(displayTruth);

            if (truthState.state === 'question') {
              console.log('Display shows question state while player is in intermission, FORCING RECOVERY!');
              setCurrentGameState('question');
              setQuestionIndex(truthState.questionIndex);
              setTimeLeft(truthState.timeLeft);
              setLastGameStateTimestamp(truthState.timestamp);

              if (questions.length > 0 && truthState.questionIndex >= 0 && truthState.questionIndex < questions.length) {
                setCurrentQuestion(questions[truthState.questionIndex]);
                console.log('Synced current question to:', questions[truthState.questionIndex]?.text);
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
            console.error('Error in robust intermission fix:', error);
          }
        }
      }
    };

    fixIntermissionLoop();
    // Check every second aggressively
    const intermissionFixInterval = setInterval(fixIntermissionLoop, 1000);

    return () => {
      clearInterval(intermissionFixInterval);
    };
  }, [currentGameState, playerName, questionIndex, questions, lastGameStateTimestamp]);

  useEffect(() => {
    const forceSyncWithDisplay = () => {
      console.log('Performing periodic forced sync with display');
      
      // Clear any existing game state to prevent circular issues
      localStorage.removeItem('gameState');
      
      // Try to get the display's authoritative state
      const displayTruth = localStorage.getItem('gameState_display_truth');
      
      if (displayTruth) {
        try {
          const parsedTruth = JSON.parse(displayTruth);
          console.log('Found display truth:', parsedTruth);
          
          // If the question hasn't changed in a while, force an update
          if (parsedTruth.questionIndex !== lastKnownQuestion) {
            console.log(`Question changed from ${lastKnownQuestion} to ${parsedTruth.questionIndex}`);
            setLastKnownQuestion(parsedTruth.questionIndex);
            
            // Apply display truth directly
            setCurrentGameState(parsedTruth.state);
            setQuestionIndex(parsedTruth.questionIndex);
            setTimeLeft(parsedTruth.timeLeft);
            setLastGameStateTimestamp(parsedTruth.timestamp);
            
            if (questions.length > 0 && parsedTruth.questionIndex >= 0 && parsedTruth.questionIndex < questions.length) {
              setCurrentQuestion(questions[parsedTruth.questionIndex]);
              console.log('Forcibly updated to question:', questions[parsedTruth.questionIndex]?.text);
            }
            
            // Reset player state for the new question
            setSelectedAnswer(null);
            setHasSelectedAnswer(false);
            setAnsweredCorrectly(null);
            setIsAnswerRevealed(parsedTruth.state === 'answer');
            setPendingPoints(0);
            setPendingCorrect(false);
            setShowTimeUp(false);
            setFailedSyncAttempts(0);
            
            // Create a high-priority game state to ensure all clients are in sync
            const highPrioritySync = {
              ...parsedTruth,
              timestamp: Date.now() + 15000, // Future timestamp for priority
              forceSync: true,
              definitiveTruth: true,
              guaranteedDelivery: true,
              syncReset: true,
              playerInitiated: true
            };
            
            // Store and broadcast this state
            localStorage.setItem('gameState', JSON.stringify(highPrioritySync));
            window.dispatchEvent(new CustomEvent('triviaStateChange', { 
              detail: highPrioritySync
            }));
            
            console.log('Forcibly synchronized with display state');
          }
          
          // If we're stuck in intermission but display shows question, force transition
          if (currentGameState === 'intermission' && parsedTruth.state === 'question') {
            console.log('Detected intermission/question mismatch, forcing question state');
            setCurrentGameState('question');
            setTimeLeft(parsedTruth.timeLeft);
            setShowTimeUp(false);
          }
        } catch (error) {
          console.error('Error processing display truth:', error);
        }
      } else {
        console.log('No display truth found, requesting sync from display');
        // Request sync from display
        window.dispatchEvent(new CustomEvent('playerNeedsSync', { 
          detail: {
            playerName,
            gameId,
            timestamp: Date.now()
          }
        }));
      }
    };
    
    // Initial sync
    forceSyncWithDisplay();
    
    // Set up periodic sync to happen every 2 seconds
    const periodicSyncInterval = setInterval(forceSyncWithDisplay, 2000);
    
    // Cleanup
    return () => {
      clearInterval(periodicSyncInterval);
    };
  }, [questions, playerName, gameId, currentGameState, lastKnownQuestion]);
  
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
      <PlayerGameStatus state="loading" score={score} isRegistered={isRegistered} />
    );
  }

  if (currentGameState === "intermission" || currentGameState === "leaderboard") {
    return (
      <PlayerGameStatus
        state={currentGameState}
        score={score}
        isRegistered={isRegistered}
        onForceSync={handleForceSync}
      />
    );
  }

  if (!currentQuestion) {
    return (
      <PlayerGameStatus
        state="waiting"
        score={score}
        isRegistered={isRegistered}
        onForceSync={handleForceSync}
      />
    );
  }

  if (showTimeUp && timeLeft === 0 && !isAnswerRevealed && currentGameState === "question") {
    return (
      <PlayerGameStatus state="timeup" score={score} isRegistered={isRegistered} />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PlayerGameHeader
        questionIndex={questionIndex}
        score={score}
        timeLeft={timeLeft}
      />
      <PlayerGameMain
        currentQuestion={currentQuestion}
        selectedAnswer={selectedAnswer}
        isAnswerRevealed={isAnswerRevealed}
        answeredCorrectly={answeredCorrectly}
        pendingPoints={pendingPoints}
        score={score}
        timeLeft={timeLeft}
        handleSelectAnswer={handleSelectAnswer}
        hasDevTools={process.env.NODE_ENV === "development"}
        handleForceSync={handleForceSync}
      />
    </div>
  );
};

export default PlayerGame;
