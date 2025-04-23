
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trophy, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { PlayerQuestionDisplay } from '@/components/player/PlayerQuestionDisplay';
import { PlayerGameConnection } from '@/components/player/PlayerGameConnection';
import { usePlayerGame } from '@/hooks/usePlayerGame';
import { getAllAvailableQuestions, formatQuestionsForGame } from '@/utils/staticQuestions';
import { verifyGameConnection, storePlayerSession } from '@/utils/playerAnswerUtils';

const PlayerGame = () => {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if player is joined
  useEffect(() => {
    const storedName = sessionStorage.getItem('playerName') || localStorage.getItem('playerName');
    const storedGameId = sessionStorage.getItem('gameId') || localStorage.getItem('gameId');
    const storedIsRegistered = sessionStorage.getItem('isRegistered') === 'true' || localStorage.getItem('isRegistered') === 'true';
    
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
    setIsRegistered(storedIsRegistered);
    
    // Store player session info
    storePlayerSession(storedName, storedGameId);
    
    // Store player info in both storage types for reliability
    localStorage.setItem('playerName', storedName);
    localStorage.setItem('gameId', storedGameId);
    localStorage.setItem('isRegistered', String(storedIsRegistered));
    sessionStorage.setItem('playerName', storedName);
    sessionStorage.setItem('gameId', storedGameId);
    sessionStorage.setItem('isRegistered', String(storedIsRegistered));
  }, [navigate, toast]);
  
  // Load questions
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        setLoading(true);
        const allQuestions = await getAllAvailableQuestions();
        const formattedQuestions = formatQuestionsForGame(allQuestions, 20);
        
        if (formattedQuestions.length > 0) {
          console.log(`Loaded ${formattedQuestions.length} questions for player view`);
          setQuestions(formattedQuestions);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadQuestions();
  }, []);
  
  // Initialize player game hook
  const playerGame = usePlayerGame(playerName || '', gameId || '');
  
  // Update current question when question index changes
  useEffect(() => {
    if (questions.length > 0 && playerGame.questionIndex >= 0 && playerGame.questionIndex < questions.length) {
      setCurrentQuestion(questions[playerGame.questionIndex]);
    }
  }, [questions, playerGame.questionIndex]);
  
  // Update score when it changes in the game state
  useEffect(() => {
    setScore(playerGame.score);
  }, [playerGame.score]);
  
  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Game...</h2>
          <p className="text-lg mb-6">Please wait while we load your trivia game.</p>
          <div className="animate-pulse flex justify-center">
            <div className="h-2 w-24 bg-primary rounded"></div>
          </div>
        </div>
      </div>
    );
  }
  
  // Add PlayerGameConnection component
  const connectionComponent = playerName && gameId ? (
    <PlayerGameConnection
      playerName={playerName}
      gameId={gameId}
      onStateChange={playerGame.handleGameStateChange}
    />
  ) : null;
  
  // Render intermission or leaderboard state
  if (playerGame.currentState === 'intermission' || playerGame.currentState === 'leaderboard') {
    return (
      <>
        {connectionComponent}
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
          <div className="card-trivia p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">
              {playerGame.currentState === 'intermission' ? 'Intermission' : 'Leaderboard'}
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
            
            <div className="mt-6 flex justify-center">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={playerGame.forceSync} 
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Force Sync
              </Button>
            </div>
            
            {!playerGame.connected && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
                <WifiOff className="h-4 w-4" />
                <span>Connection lost. Trying to reconnect...</span>
              </div>
            )}
          </div>
        </div>
      </>
    );
  }
  
  // If we're in question or answer state
  if ((playerGame.currentState === 'question' || playerGame.currentState === 'answer') && currentQuestion) {
    return (
      <>
        {connectionComponent}
        <div className="min-h-screen flex flex-col bg-background p-4">
          <header className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">{playerName}</h2>
                <p className="text-sm text-muted-foreground">Game #{gameId}</p>
              </div>
              <div className="flex items-center">
                {!playerGame.connected ? (
                  <div className="flex items-center gap-1 text-red-500 mr-3">
                    <WifiOff className="h-4 w-4" />
                    <span className="text-sm">Reconnecting...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-green-500 mr-3">
                    <Wifi className="h-4 w-4" />
                    <span className="text-sm">Connected</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-full">
                  <Trophy className="h-4 w-4 text-primary" />
                  <span className="font-semibold">{score}</span>
                </div>
              </div>
            </div>
          </header>
          
          <PlayerQuestionDisplay
            question={currentQuestion}
            playerName={playerName || ''}
            gameId={gameId || ''}
            questionIndex={playerGame.questionIndex}
            questionCounter={playerGame.questionCounter}
            timeLeft={playerGame.timeLeft}
          />
          
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={playerGame.forceSync}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Force Sync
            </Button>
            <div className="text-xs text-muted-foreground mt-1">
              State: {playerGame.currentState} | Question: #{playerGame.questionCounter} | Time: {playerGame.timeLeft}s
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Default waiting state
  return (
    <>
      {connectionComponent}
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Waiting for Game...</h2>
          <p className="text-lg mb-6">The host will start the game shortly.</p>
          
          {!playerGame.connected && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span>Connection lost. Trying to reconnect...</span>
            </div>
          )}
          
          <Button 
            variant="outline"
            onClick={playerGame.forceSync}
            className="flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="h-4 w-4" /> Reconnect
          </Button>
        </div>
      </div>
    </>
  );
};

export default PlayerGame;
