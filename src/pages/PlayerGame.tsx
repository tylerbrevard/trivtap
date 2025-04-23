
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trophy, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { PlayerQuestionDisplay } from '@/components/player/PlayerQuestionDisplay';
import { PlayerGameSync } from '@/components/player/PlayerGameSync';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { getAllAvailableQuestions, formatQuestionsForGame } from '@/utils/staticQuestions';
import { verifyGameConnection } from '@/utils/playerAnswerUtils';

const PlayerGame = () => {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(true);
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
    
    console.log('Player joined:', storedName, 'Game ID:', storedGameId, 'Registered:', storedIsRegistered);
    setPlayerName(storedName);
    setGameId(storedGameId);
    setIsRegistered(storedIsRegistered);
    
    // Verify game connection
    verifyGameConnection(storedName, storedGameId);
    
    // Set in both storage types for reliability
    localStorage.setItem('playerName', storedName);
    localStorage.setItem('gameId', storedGameId);
    localStorage.setItem('isRegistered', String(storedIsRegistered));
    sessionStorage.setItem('playerName', storedName);
    sessionStorage.setItem('gameId', storedGameId);
    sessionStorage.setItem('isRegistered', String(storedIsRegistered));
    
    // Load score from localStorage if available
    const storedScore = localStorage.getItem(`playerScore_${storedName}`);
    if (storedScore) {
      try {
        const scoreData = JSON.parse(storedScore);
        setScore(scoreData.score || 0);
        setCorrectAnswers(scoreData.correctAnswers || 0);
      } catch (error) {
        console.error('Error parsing stored score:', error);
      }
    }
    
    // After a short delay, remove connecting indicator
    const timer = setTimeout(() => {
      setIsConnecting(false);
    }, 2000);
    
    return () => clearTimeout(timer);
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
  
  // Use the playerSync hook
  const playerSync = usePlayerSync(playerName || '', gameId || '');
  
  // Update current question when question index changes
  useEffect(() => {
    if (questions.length > 0 && playerSync.questionIndex >= 0 && playerSync.questionIndex < questions.length) {
      setCurrentQuestion(questions[playerSync.questionIndex]);
      console.log('Current question set to:', questions[playerSync.questionIndex]?.text);
    }
  }, [questions, playerSync.questionIndex]);
  
  // Handle state changes from PlayerGameSync
  const handleStateChange = useCallback((gameState: any) => {
    console.log('PlayerGame received state change:', gameState);
    
    // Check for score updates
    if (gameState.scores && gameState.scores[playerName || '']) {
      const newScore = gameState.scores[playerName || ''].score || 0;
      const newCorrectAnswers = gameState.scores[playerName || ''].correctAnswers || 0;
      
      setScore(newScore);
      setCorrectAnswers(newCorrectAnswers);
      
      // Store score in localStorage
      localStorage.setItem(`playerScore_${playerName}`, JSON.stringify({
        name: playerName,
        score: newScore,
        correctAnswers: newCorrectAnswers,
        gameId: gameId
      }));
      // Also store in sessionStorage for more reliability
      sessionStorage.setItem(`playerScore_${playerName}`, JSON.stringify({
        name: playerName,
        score: newScore,
        correctAnswers: newCorrectAnswers,
        gameId: gameId
      }));
    }
    
    setIsConnecting(false);
  }, [playerName, gameId]);
  
  // Handle sync completion
  const handleSyncComplete = useCallback(() => {
    console.log('Sync completed');
    setIsConnecting(false);
  }, []);
  
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
  
  // Add PlayerGameSync component for event handling
  const syncComponent = playerName && gameId ? (
    <PlayerGameSync
      playerName={playerName}
      gameId={gameId}
      onStateChange={handleStateChange}
      onSync={handleSyncComplete}
    />
  ) : null;
  
  // Render based on game state
  if (playerSync.currentState === 'intermission' || playerSync.currentState === 'leaderboard') {
    return (
      <>
        {syncComponent}
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
          <div className="card-trivia p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold mb-4">
              {playerSync.currentState === 'intermission' ? 'Intermission' : 'Leaderboard'}
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
                onClick={playerSync.forceSync} 
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" /> Force Sync
              </Button>
            </div>
            
            {playerSync.disconnected && (
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
  
  // If we're in question or answer state, and we have a current question
  if ((playerSync.currentState === 'question' || playerSync.currentState === 'answer') && currentQuestion) {
    return (
      <>
        {syncComponent}
        <div className="min-h-screen flex flex-col bg-background p-4">
          <header className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold">{playerName}</h2>
                <p className="text-sm text-muted-foreground">Game #{gameId}</p>
              </div>
              <div className="flex items-center">
                {playerSync.disconnected ? (
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
          
          {/* Player Question Display component */}
          <PlayerQuestionDisplay
            question={currentQuestion}
            playerName={playerName || ''}
            gameId={gameId || ''}
            questionIndex={playerSync.questionIndex}
            questionCounter={playerSync.questionCounter}
            timeLeft={playerSync.timeLeft}
          />
          
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={playerSync.forceSync}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Force Sync
            </Button>
            <div className="text-xs text-muted-foreground mt-1">
              State: {playerSync.currentState} | Question: #{playerSync.questionCounter} | Time: {playerSync.timeLeft}s
            </div>
          </div>
        </div>
      </>
    );
  }
  
  // Default waiting state
  return (
    <>
      {syncComponent}
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="card-trivia p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold mb-4">Waiting for Game...</h2>
          {isConnecting ? (
            <div className="mb-6">
              <p className="text-lg mb-2">Connecting to game #{gameId}...</p>
              <div className="animate-pulse flex justify-center">
                <div className="h-2 w-24 bg-primary rounded"></div>
              </div>
            </div>
          ) : (
            <p className="text-lg mb-6">The host will start the game shortly.</p>
          )}
          
          {playerSync.disconnected && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md flex items-center gap-2">
              <WifiOff className="h-4 w-4" />
              <span>Connection lost. Trying to reconnect...</span>
            </div>
          )}
          
          <Button 
            variant="outline"
            onClick={playerSync.forceSync}
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
