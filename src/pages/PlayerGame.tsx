
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Trophy } from 'lucide-react';
import { PlayerQuestionDisplay } from '@/components/player/PlayerQuestionDisplay';
import { PlayerGameSync } from '@/components/player/PlayerGameSync';
import { usePlayerSync } from '@/hooks/usePlayerSync';
import { getAllAvailableQuestions, formatQuestionsForGame } from '@/utils/staticQuestions';

const PlayerGame = () => {
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [gameId, setGameId] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean>(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Check if player is joined
  useEffect(() => {
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
  const handleStateChange = (gameState: any) => {
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
    }
  };
  
  // Handle sync completion
  const handleSyncComplete = () => {
    console.log('Sync completed');
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
            
            {process.env.NODE_ENV === 'development' && (
              <Button variant="outline" size="sm" onClick={playerSync.forceSync} className="mt-4">
                Force Sync
              </Button>
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
              <div className="flex items-center gap-2 bg-card px-3 py-1 rounded-full">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="font-semibold">{score}</span>
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
          
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4 text-center">
              <Button variant="outline" size="sm" onClick={playerSync.forceSync}>
                Force Sync
              </Button>
              <div className="text-xs text-muted-foreground mt-1">
                State: {playerSync.currentState} | Time: {playerSync.timeLeft}s
              </div>
            </div>
          )}
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
          <p className="text-lg mb-6">The host will start the game shortly.</p>
          
          {process.env.NODE_ENV === 'development' && (
            <Button variant="outline" size="sm" onClick={playerSync.forceSync} className="mt-4">
              Force Sync
            </Button>
          )}
        </div>
      </div>
    </>
  );
};

export default PlayerGame;
