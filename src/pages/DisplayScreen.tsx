
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { QrCode, Clock } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

const mockQuestions = [
  {
    id: '1',
    text: 'Which planet is known as the Red Planet?',
    options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
    correctAnswer: 'Mars',
    category: 'Science',
  },
  {
    id: '2',
    text: 'Who painted the Mona Lisa?',
    options: ['Vincent van Gogh', 'Leonardo da Vinci', 'Pablo Picasso', 'Michelangelo'],
    correctAnswer: 'Leonardo da Vinci',
    category: 'Art',
  },
  {
    id: '3',
    text: 'In which year did World War II end?',
    options: ['1943', '1944', '1945', '1946'],
    correctAnswer: '1945',
    category: 'History',
  }
];

const mockSettings = {
  questionDuration: 20, // seconds
  answerRevealDuration: 5, // seconds
};

const DisplayScreen = () => {
  const { id } = useParams();
  const [currentState, setCurrentState] = useState<'question' | 'answer' | 'leaderboard' | 'join'>('join');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(mockSettings.questionDuration);
  const [players, setPlayers] = useState<any[]>([]);
  const [gameCode, setGameCode] = useState('');
  const [questionCounter, setQuestionCounter] = useState(1);
  const { toast } = useToast();
  
  // Initialize game code and set up subscriptions - only once
  useEffect(() => {
    // Check if a game code is already stored for this session
    const storedGameCode = localStorage.getItem('persistentGameCode');
    
    if (storedGameCode) {
      console.log('Using existing game code:', storedGameCode);
      setGameCode(storedGameCode);
    } else {
      // Generate a new code only if one doesn't exist
      const generateGameCode = () => {
        const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 4; i++) {
          result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
      };
      
      const newCode = generateGameCode();
      setGameCode(newCode);
      // Store in localStorage for persistence across refreshes
      localStorage.setItem('persistentGameCode', newCode);
      console.log('Generated new game code:', newCode);
    }
    
    // Store game session info - use the stored or newly generated code
    const sessionCode = storedGameCode || localStorage.getItem('persistentGameCode');
    sessionStorage.setItem('activeGameCode', sessionCode);
    localStorage.setItem('activeGameCode', sessionCode);
    
    const setupPlayerSubscription = async () => {
      console.log('Setting up player subscription');
      
      // Mock player for testing if needed
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => {
          const mockPlayer = { id: 'mock-id', name: 'Test Player', score: 100 };
          console.log('Adding mock player for testing');
          setPlayers(prev => [...prev, mockPlayer]);
        }, 2000);
      }
      
      const channel = supabase
        .channel('public:players')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'players' },
          (payload) => {
            console.log('New player joined via Supabase:', payload.new);
            setPlayers((current) => {
              const newPlayers = [...current, payload.new];
              console.log('Updated players list:', newPlayers);
              return newPlayers;
            });
            toast({
              title: "New player joined!",
              description: `${payload.new.name} has joined the game.`,
            });
          }
        )
        .subscribe();
        
      return () => {
        channel.unsubscribe();
      };
    };
    
    const setupSubscription = setupPlayerSubscription();
    
    return () => {
      setupSubscription.then(cleanup => {
        if (cleanup && typeof cleanup === 'function') {
          cleanup();
        }
      }).catch(error => {
        console.error("Error cleaning up subscription:", error);
      });
    };
  }, []); // Empty dependency array ensures this only runs once
  
  // Function to check for player joins - separated to avoid dependency issues
  useEffect(() => {
    // Clear all player scores initially to avoid stale data
    const playerKeys = Object.keys(localStorage).filter(key => key.startsWith('playerScore_'));
    playerKeys.forEach(key => localStorage.removeItem(key));
    
    const checkForPlayerJoins = () => {
      // Check for new player joins via localStorage
      const playerJoinData = localStorage.getItem('playerJoined');
      if (playerJoinData) {
        try {
          const playerData = JSON.parse(playerJoinData);
          console.log('Detected player join via localStorage:', playerData);
          
          // Check if this player is already in our list to avoid duplicates
          const playerExists = players.some(p => p.name === playerData.name);
          
          if (!playerExists && playerData.gameId === gameCode) {
            const newPlayer = { 
              id: `local-${Date.now()}`, 
              name: playerData.name,
              score: 0,
              timestamp: playerData.timestamp
            };
            setPlayers(prev => [...prev, newPlayer]);
            
            console.log('Added new player from localStorage:', newPlayer);
            
            toast({
              title: "New player joined!",
              description: `${playerData.name} has joined the game.`,
            });
            
            // Clear the notification to avoid duplicate processing
            localStorage.removeItem('playerJoined');
          }
        } catch (error) {
          console.error('Error processing player join data:', error);
        }
      }
      
      // Check for session storage-based joins
      const playerName = sessionStorage.getItem('playerName');
      const playerGameId = sessionStorage.getItem('gameId');
      
      if (playerName && playerGameId && playerGameId === gameCode) {
        console.log('Player joined via sessionStorage:', playerName, playerGameId);
        // Check if this player is already in our list to avoid duplicates
        const playerExists = players.some(p => p.name === playerName);
        
        if (!playerExists) {
          const newPlayer = { 
            id: `session-${Date.now()}`, 
            name: playerName,
            score: 0 
          };
          setPlayers(prev => [...prev, newPlayer]);
          
          toast({
            title: "New player joined!",
            description: `${playerName} has joined the game.`,
          });
        }
      }
      
      // Update player scores from localStorage
      players.forEach(player => {
        const playerScoreData = localStorage.getItem(`playerScore_${player.name}`);
        if (playerScoreData) {
          try {
            const scoreData = JSON.parse(playerScoreData);
            if (scoreData.gameId === gameCode && scoreData.score !== player.score) {
              console.log(`Updating score for ${player.name} from ${player.score} to ${scoreData.score}`);
              setPlayers(prev => prev.map(p => 
                p.name === player.name ? { ...p, score: scoreData.score } : p
              ));
            }
          } catch (error) {
            console.error('Error processing player score data:', error);
          }
        }
      });
    };
    
    const playerCheckInterval = setInterval(checkForPlayerJoins, 1000);
    
    return () => {
      clearInterval(playerCheckInterval);
    };
  }, [players, toast, gameCode]);
  
  // Function to update game state in localStorage
  const updateGameState = useCallback((state: 'question' | 'answer', questionIndex: number, time: number, qCounter: number) => {
    const gameState = {
      state: state,
      questionIndex: questionIndex,
      timeLeft: time,
      questionCounter: qCounter,
      timestamp: Date.now() // Add timestamp to ensure updates are detected
    };
    
    console.log('Updating game state:', gameState);
    localStorage.setItem('gameState', JSON.stringify(gameState));
  }, []);
  
  // Game state management (timer, question progression)
  useEffect(() => {
    let timerId: number | undefined;
    
    if (currentState === 'join') {
      // The join screen will show for 10 seconds before transitioning to the first question
      timerId = window.setTimeout(() => {
        setCurrentState('question');
        setTimeLeft(mockSettings.questionDuration);
        console.log('Starting game with first question');
        
        // Store initial game state
        updateGameState('question', currentQuestionIndex, mockSettings.questionDuration, questionCounter);
      }, 10000);
      return () => {
        if (timerId) clearTimeout(timerId);
      };
    } 
    
    if (currentState === 'question') {
      // Set up the timer to count down
      if (timeLeft > 0) {
        timerId = window.setTimeout(() => {
          const newTimeLeft = timeLeft - 1;
          setTimeLeft(newTimeLeft);
          
          // Update game state with new time
          updateGameState('question', currentQuestionIndex, newTimeLeft, questionCounter);
        }, 1000);
        
        return () => {
          if (timerId) clearTimeout(timerId);
        };
      } else {
        // When time runs out, show the answer state
        console.log('Time out, revealing answer');
        setCurrentState('answer');
        
        // Update game state for answer reveal
        updateGameState('answer', currentQuestionIndex, 0, questionCounter);
        
        // After the answer reveal duration, move to the next question or leaderboard
        timerId = window.setTimeout(() => {
          if (questionCounter % 10 === 0) {
            setCurrentState('leaderboard');
            console.log('Showing leaderboard');
            
            timerId = window.setTimeout(() => {
              moveToNextQuestion();
            }, 10000);
          } else {
            moveToNextQuestion();
          }
        }, mockSettings.answerRevealDuration * 1000);
        
        return () => {
          if (timerId) clearTimeout(timerId);
        };
      }
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [currentState, timeLeft, currentQuestionIndex, questionCounter, updateGameState]);
  
  const moveToNextQuestion = useCallback(() => {
    // Calculate the next question index
    const nextQuestionIndex = (currentQuestionIndex + 1) % mockQuestions.length;
    console.log(`Moving to next question: ${nextQuestionIndex} from ${currentQuestionIndex}`);
    
    // Update state for the next question
    setCurrentQuestionIndex(nextQuestionIndex);
    setQuestionCounter(prev => prev + 1);
    setTimeLeft(mockSettings.questionDuration);
    setCurrentState('question');
    
    // Update game state for the next question
    setTimeout(() => {
      updateGameState('question', nextQuestionIndex, mockSettings.questionDuration, questionCounter + 1);
    }, 100);
  }, [currentQuestionIndex, questionCounter, updateGameState]);
  
  const currentQuestion = mockQuestions[currentQuestionIndex];
  
  const getTimerColor = () => {
    if (timeLeft > mockSettings.questionDuration * 0.6) return 'bg-green-500';
    if (timeLeft > mockSettings.questionDuration * 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  // Sort players by score for leaderboard
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  // Get unique players based on name to avoid counting duplicates
  const uniquePlayers = players.filter((player, index, self) => 
    index === self.findIndex(p => p.name === player.name)
  );
  
  const renderContent = () => {
    switch (currentState) {
      case 'join':
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-5xl font-bold mb-8 text-primary animate-pulse">Join the Game!</h1>
            <div className="mb-8">
              <div className="bg-white rounded-lg p-6 inline-block mb-4">
                <QrCode className="h-40 w-40 text-black" />
              </div>
              <p className="text-xl">Scan the QR code or visit</p>
              <p className="text-2xl font-bold text-primary mb-4">triviapulse.com/join</p>
              <div className="text-4xl font-bold bg-gradient-to-r from-trivia-primary to-trivia-accent bg-clip-text text-transparent py-4 px-8 border-2 border-primary rounded-lg animate-pulse-scale">
                {gameCode}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-xl font-medium">Players joined: {uniquePlayers.length}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {uniquePlayers.map(player => (
                  <div key={player.id} className="bg-primary/20 px-3 py-1 rounded-full text-primary">
                    {player.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'question':
        return (
          <div className="flex flex-col h-full">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                  {currentQuestion.category}
                </div>
                <div className="text-xl font-medium">
                  Question {questionCounter}
                </div>
                <div className="flex items-center gap-2 text-xl font-medium">
                  <Clock className="h-5 w-5" />
                  {timeLeft}s
                </div>
              </div>
              <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${getTimerColor()} transition-all duration-300`}
                  style={{ width: `${(timeLeft / mockSettings.questionDuration) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="card-trivia p-8 mb-8 flex-1 flex items-center justify-center">
                <h2 className="text-4xl font-bold text-center">{currentQuestion.text}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <div 
                    key={index}
                    className="card-trivia p-6 flex items-center justify-center text-2xl font-semibold text-center min-h-28"
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'answer':
        return (
          <div className="flex flex-col h-full">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <div className="bg-primary/20 text-primary px-3 py-1 rounded-full text-sm">
                  {currentQuestion.category}
                </div>
                <div className="text-xl font-medium">
                  Question {questionCounter}
                </div>
              </div>
            </div>
            
            <div className="flex-1 flex flex-col">
              <div className="card-trivia p-8 mb-8 flex-1 flex items-center justify-center">
                <h2 className="text-4xl font-bold text-center">{currentQuestion.text}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                {currentQuestion.options.map((option, index) => (
                  <div 
                    key={index}
                    className={`card-trivia p-6 flex items-center justify-center text-2xl font-semibold text-center min-h-28 ${
                      option === currentQuestion.correctAnswer 
                        ? 'bg-green-500 border-green-600' 
                        : 'opacity-50'
                    }`}
                  >
                    {option}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <h3 className="text-3xl font-bold text-primary">Correct Answer: {currentQuestion.correctAnswer}</h3>
            </div>
          </div>
        );
        
      case 'leaderboard':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-4xl font-bold mb-8 text-primary">Leaderboard</h1>
            
            {sortedPlayers.length > 0 ? (
              <div className="w-full max-w-2xl">
                <div className="flex justify-center items-end gap-4 mb-8">
                  {sortedPlayers.length > 1 && (
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-gray-400">
                        <span className="text-3xl font-bold text-gray-400">2</span>
                      </div>
                      <div className="text-center">
                        <div className="h-40 bg-gradient-to-t from-gray-600 to-gray-400 w-24 rounded-t-lg flex items-end justify-center pb-4">
                          <span className="text-white font-bold">{sortedPlayers[1].score || 0}</span>
                        </div>
                        <div className="bg-gray-200 text-gray-800 py-2 px-4 rounded-b-lg">
                          <span className="font-medium">{sortedPlayers[1].name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {sortedPlayers.length > 0 && (
                    <div className="flex flex-col items-center -mt-8">
                      <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-yellow-400">
                        <span className="text-4xl font-bold text-yellow-400">1</span>
                      </div>
                      <div className="text-center">
                        <div className="h-52 bg-gradient-to-t from-yellow-600 to-yellow-400 w-32 rounded-t-lg flex items-end justify-center pb-4">
                          <span className="text-white font-bold">{sortedPlayers[0].score || 0}</span>
                        </div>
                        <div className="bg-yellow-100 text-yellow-800 py-2 px-4 rounded-b-lg">
                          <span className="font-medium">{sortedPlayers[0].name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {sortedPlayers.length > 2 && (
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-amber-700">
                        <span className="text-3xl font-bold text-amber-700">3</span>
                      </div>
                      <div className="text-center">
                        <div className="h-32 bg-gradient-to-t from-amber-800 to-amber-500 w-24 rounded-t-lg flex items-end justify-center pb-4">
                          <span className="text-white font-bold">{sortedPlayers[2].score || 0}</span>
                        </div>
                        <div className="bg-amber-100 text-amber-800 py-2 px-4 rounded-b-lg">
                          <span className="font-medium">{sortedPlayers[2].name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {sortedPlayers.length > 3 && (
                  <div className="card-trivia p-4">
                    <div className="divide-y divide-border">
                      {sortedPlayers.slice(3, 10).map((player, index) => (
                        <div key={player.id} className="flex justify-between items-center py-3">
                          <div className="flex items-center">
                            <span className="text-muted-foreground font-medium mr-4">{index + 4}</span>
                            <span className="font-medium">{player.name}</span>
                          </div>
                          <span className="font-bold">{player.score || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>No players have joined yet.</p>
              </div>
            )}
          </div>
        );
    }
  };
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">TriviaPulse</h1>
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 text-primary px-3 py-1 rounded-full">
              Display #{id || 'Default'}
            </div>
            <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full">
              Players: {uniquePlayers.length}
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 p-6">
        {renderContent()}
      </main>
      
      <footer className="p-4 border-t border-border text-center text-sm text-muted-foreground">
        {currentState !== 'join' && (
          <div className="flex justify-center mb-2">
            <div className="bg-card px-4 py-2 rounded-full">
              Join code: <span className="font-bold text-primary">{gameCode}</span>
            </div>
          </div>
        )}
        <p>Powered by TriviaPulse</p>
      </footer>
    </div>
  );
};

export default DisplayScreen;
