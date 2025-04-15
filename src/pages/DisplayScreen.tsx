import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { QrCode, Clock, Wifi } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { gameSettings } from '@/utils/gameSettings';
import { useGameSync } from '@/hooks/useGameSync';

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
  },
  {
    id: '4',
    text: 'Which of these elements has the chemical symbol \'Au\'?',
    options: ['Silver', 'Gold', 'Aluminum', 'Argon'],
    correctAnswer: 'Gold',
    category: 'Science',
  },
  {
    id: '5',
    text: 'What is the capital city of Australia?',
    options: ['Sydney', 'Melbourne', 'Canberra', 'Perth'],
    correctAnswer: 'Canberra',
    category: 'Geography',
  },
  {
    id: '6',
    text: 'Who wrote the novel \'Pride and Prejudice\'?',
    options: ['Jane Austen', 'Charles Dickens', 'Emily Brontë', 'F. Scott Fitzgerald'],
    correctAnswer: 'Jane Austen',
    category: 'Entertainment',
  },
  {
    id: '7',
    text: 'Which of these is NOT a programming language?',
    options: ['Python', 'Java', 'Cougar', 'Ruby'],
    correctAnswer: 'Cougar',
    category: 'Science',
  }
];

const DisplayScreen = () => {
  const { id } = useParams();
  const [players, setPlayers] = useState<any[]>([]);
  const [gameCode, setGameCode] = useState('');
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [questions, setQuestions] = useState(mockQuestions);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [intermissionSlides, setIntermissionSlides] = useState<any[]>([]);
  const { toast } = useToast();
  
  const { 
    currentState, 
    questionIndex, 
    questionCounter,
    timeLeft,
    forcePause,
    updateGameState,
    moveToNextQuestion,
    togglePause,
    setCurrentState,
    setTimeLeft,
    lastStateChange
  } = useGameSync({
    totalQuestions: questions.length,
    initialQuestionIndex: 0,
    initialQuestionCounter: 1,
    autoSync: true
  });
  
  console.log('Current state:', currentState);
  console.log('Current question index:', questionIndex);
  console.log('Available questions:', questions.length);
  console.log('Question counter:', questionCounter);
  console.log('Game settings:', gameSettings);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoadingQuestions(true);
        
        const { data: buckets, error: bucketsError } = await supabase
          .from('buckets')
          .select('id')
          .eq('is_default', true)
          .limit(1);
          
        if (bucketsError) {
          console.error('Error fetching default bucket:', bucketsError);
          setQuestions(mockQuestions);
          setIsLoadingQuestions(false);
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
            setQuestions(mockQuestions);
            setIsLoadingQuestions(false);
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
                category: question.categories ? question.categories.name : 'General'
              };
            });
            
            if (formattedQuestions.length > 0) {
              console.log(`Loaded ${formattedQuestions.length} questions from the default bucket`);
              setQuestions(formattedQuestions);
            } else {
              console.log('No questions in default bucket, using mock questions');
              setQuestions(mockQuestions);
            }
          } else {
            console.log('No questions found in the default bucket, using mock questions');
            setQuestions(mockQuestions);
          }
        } else {
          console.log('No default bucket found, using mock questions');
          setQuestions(mockQuestions);
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        setQuestions(mockQuestions);
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    
    fetchQuestions();
  }, []);

  useEffect(() => {
    const savedSlides = localStorage.getItem('intermissionSlides');
    if (savedSlides) {
      try {
        const slides = JSON.parse(savedSlides);
        const activeSlides = slides.filter((slide: any) => slide.isActive);
        setIntermissionSlides(activeSlides);
        console.log(`Loaded ${activeSlides.length} active intermission slides`);
      } catch (error) {
        console.error('Error loading intermission slides:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (currentState === 'intermission') {
      const currentGameState = localStorage.getItem('gameState');
      if (currentGameState) {
        try {
          const parsedState = JSON.parse(currentGameState);
          if (parsedState.slidesIndex !== undefined) {
            setCurrentSlideIndex(parsedState.slidesIndex);
          }
        } catch (error) {
          console.error('Error parsing game state for slides:', error);
        }
      }
    }
  }, [currentState, lastStateChange]);

  useEffect(() => {
    const storedGameCode = localStorage.getItem('persistentGameCode');
    
    if (storedGameCode) {
      console.log('Using existing game code:', storedGameCode);
      setGameCode(storedGameCode);
    } else {
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
      localStorage.setItem('persistentGameCode', newCode);
      console.log('Generated new game code:', newCode);
    }
    
    const sessionCode = storedGameCode || localStorage.getItem('persistentGameCode');
    sessionStorage.setItem('activeGameCode', sessionCode);
    localStorage.setItem('activeGameCode', sessionCode);
    
    const playerKeys = Object.keys(localStorage).filter(key => key.startsWith('playerScore_'));
    playerKeys.forEach(key => localStorage.removeItem(key));
    if (localStorage.getItem('playerJoined')) {
      localStorage.removeItem('playerJoined');
    }
    
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cleaning up development test data');
      }
    };
  }, []);
  
  useEffect(() => {
    const checkForPlayerJoins = () => {
      const playerJoinData = localStorage.getItem('playerJoined');
      if (playerJoinData) {
        try {
          const playerData = JSON.parse(playerJoinData);
          console.log('Detected player join via localStorage:', playerData);
          
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
            
            localStorage.removeItem('playerJoined');
          }
        } catch (error) {
          console.error('Error processing player join data:', error);
        }
      }
      
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
  
  useEffect(() => {
    let timerId: number | undefined;
    
    if (currentState === 'join' && !hasGameStarted) {
      timerId = window.setTimeout(() => {
        setCurrentState('question');
        setTimeLeft(gameSettings.questionDuration);
        setHasGameStarted(true);
        console.log('Starting game with first question');
        
        updateGameState('question', questionIndex, gameSettings.questionDuration, questionCounter);
      }, 10000);
      
      return () => {
        if (timerId) clearTimeout(timerId);
      };
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [currentState, questionIndex, questionCounter, updateGameState, hasGameStarted, setCurrentState, setTimeLeft]);
  
  const handleStartGameNow = () => {
    setCurrentState('question');
    setTimeLeft(gameSettings.questionDuration);
    setHasGameStarted(true);
    updateGameState('question', questionIndex, gameSettings.questionDuration, questionCounter);
  };
  
  const handleManualNextQuestion = () => {
    if (hasGameStarted) {
      moveToNextQuestion();
    }
  };
  
  const currentQuestion = questions[questionIndex] || mockQuestions[0];
  
  const getTimerColor = () => {
    if (timeLeft > gameSettings.questionDuration * 0.6) return 'bg-green-500';
    if (timeLeft > gameSettings.questionDuration * 0.3) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  
  const sortedPlayers = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  
  const uniquePlayers = players.filter((player, index, self) => 
    index === self.findIndex(p => p.name === player.name)
  );
  
  const handleLaunchDisplay = () => {
    const displayUrl = `${window.location.origin}/display/${id}`;
    window.open(displayUrl, '_blank', 'noopener,noreferrer');
    console.log('Launching display at:', displayUrl);
    toast({
      title: "Display Launched",
      description: "The display has been opened in a new tab.",
    });
  };
  
  const getCurrentIntermissionSlide = () => {
    if (intermissionSlides.length === 0) {
      return null;
    }
    
    const slideIndex = currentSlideIndex % intermissionSlides.length;
    return intermissionSlides[slideIndex];
  };
  
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
            
            <div className="mt-8 space-y-4">
              <Button onClick={handleStartGameNow}>
                Start Game Now
              </Button>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleManualNextQuestion}>
                      Force Next Question
                    </Button>
                    <Button variant="outline" size="sm" onClick={togglePause}>
                      {forcePause ? 'Resume Game' : 'Pause Game'}
                    </Button>
                  </div>
                </div>
              )}
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
                  style={{ width: `${(timeLeft / gameSettings.questionDuration) * 100}%` }}
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
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
                <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleManualNextQuestion}>
                    Force Next Question
                  </Button>
                  <Button variant="outline" size="sm" onClick={togglePause}>
                    {forcePause ? 'Resume Game' : 'Pause Game'}
                  </Button>
                </div>
              </div>
            )}
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
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
                <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
                <Button variant="outline" size="sm" onClick={handleManualNextQuestion}>
                  Force Next Question
                </Button>
              </div>
            )}
          </div>
        );
        
      case 'intermission':
        const currentSlide = getCurrentIntermissionSlide();
        
        if (!currentSlide) {
          return (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h1 className="text-4xl font-bold mb-8 text-primary">Intermission</h1>
              <div className="card-trivia p-8 max-w-2xl w-full">
                <h2 className="text-3xl font-bold mb-4">Welcome to Trivia Night!</h2>
                <p className="text-xl mb-6">The next question will be coming up shortly...</p>
              </div>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
                  <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
                  <Button variant="outline" size="sm" onClick={handleManualNextQuestion}>
                    Force Next Question
                  </Button>
                </div>
              )}
            </div>
          );
        }
        
        return (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-4xl font-bold mb-8 text-primary">Intermission</h1>
            <div className="card-trivia p-8 max-w-2xl w-full">
              <h2 className="text-3xl font-bold mb-4">{currentSlide.title}</h2>
              
              {currentSlide.type === 'text' && (
                <p className="text-xl mb-6 whitespace-pre-line">{currentSlide.content}</p>
              )}
              
              {currentSlide.type === 'html' && (
                <div className="prose max-w-none mx-auto" dangerouslySetInnerHTML={{ __html: currentSlide.content }} />
              )}
              
              {currentSlide.type === 'wifi' && (
                <div className="bg-muted p-6 rounded-md">
                  <div className="flex items-center justify-center mb-4">
                    <Wifi className="h-8 w-8 text-primary mr-2" />
                    <p className="text-lg font-medium">WiFi Connection</p>
                  </div>
                  <div className="flex justify-center gap-8 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">WiFi Name</p>
                      <p className="text-xl font-medium">{currentSlide.wifiName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Password</p>
                      <p className="text-xl font-medium">{currentSlide.wifiPassword}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {currentSlide.type === 'image' && currentSlide.imageUrl && (
                <div className="mt-4">
                  <img 
                    src={currentSlide.imageUrl} 
                    alt={currentSlide.title}
                    className="max-w-full max-h-[300px] object-contain mx-auto rounded"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.src = 'https://placehold.co/600x400?text=Image+URL+Error';
                    }}
                  />
                  {currentSlide.content && (
                    <p className="mt-4 text-lg">{currentSlide.content}</p>
                  )}
                </div>
              )}
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
                <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
                <Button variant="outline" size="sm" onClick={handleManualNextQuestion}>
                  Force Next Question
                </Button>
              </div>
            )}
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
            
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 border border-dashed border-gray-300 p-4 rounded-md">
                <p className="text-sm text-muted-foreground mb-2">Development Controls</p>
                <Button variant="outline" size="sm" onClick={handleManualNextQuestion}>
                  Force Next Question
                </Button>
              </div>
            )}
          </div>
        );
        
      default:
        return <div>Unknown state: {currentState}</div>;
    }
  };
  
  if (isLoadingQuestions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading Trivia Game...</h2>
          <Progress value={50} className="w-64" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="p-4 border-b border-border">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">TrivTap</h1>
          <div className="flex items-center gap-4">
            <div className="bg-primary/20 text-primary px-3 py-1 rounded-full">
              Display #{id || 'Default'}
            </div>
            <div className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full">
              Players: {uniquePlayers.length}
            </div>
            <div className="bg-blue-500/20 text-blue-500 px-3 py-1 rounded-full">
              Auto Progress: {gameSettings.autoProgress ? 'On' : 'Off'}
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
        <p>Powered by TrivTap</p>
      </footer>
    </div>
  );
};

export default DisplayScreen;
