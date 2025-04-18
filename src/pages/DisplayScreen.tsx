import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useGameSync } from '@/hooks/useGameSync';
import { JoinDisplay } from '@/components/display/JoinDisplay';
import { QuestionDisplay } from '@/components/display/QuestionDisplay';
import { AnswerDisplay } from '@/components/display/AnswerDisplay';
import { LeaderboardDisplay } from '@/components/display/LeaderboardDisplay';
import { IntermissionDisplay } from '@/components/display/IntermissionDisplay';

const DisplayScreen = () => {
  const { id } = useParams();
  const [players, setPlayers] = useState<any[]>([]);
  const [gameCode, setGameCode] = useState('');
  const [hasGameStarted, setHasGameStarted] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [intermissionSlides, setIntermissionSlides] = useState<any[]>([]);
  const [roundWinners, setRoundWinners] = useState<any[]>([]);
  const [dayWinners, setDayWinners] = useState<any[]>([]);
  const [displayedQuestionCount, setDisplayedQuestionCount] = useState(0);
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
  console.log('Current slide index:', currentSlideIndex);
  console.log('Active intermission slides:', intermissionSlides.length);

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
          fetchStaticQuestions();
          return;
        }
        
        if (buckets && buckets.length > 0) {
          const defaultBucketId = buckets[0].id;
          console.log(`Found default bucket: ${defaultBucketId}`);
          
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
            fetchStaticQuestions();
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
            
            console.log(`Loaded ${formattedQuestions.length} questions from database bucket`);
            
            if (formattedQuestions.length > 0) {
              setQuestions(formattedQuestions);
              setDisplayedQuestionCount(formattedQuestions.length);
            } else {
              console.log('No questions in Supabase default bucket, falling back to static questions');
              fetchStaticQuestions();
            }
          } else {
            console.log('No questions found in the default bucket, falling back to static questions');
            fetchStaticQuestions();
          }
        } else {
          console.log('No default bucket found, falling back to static questions');
          fetchStaticQuestions();
        }
      } catch (error) {
        console.error('Error loading questions:', error);
        fetchStaticQuestions();
      } finally {
        setIsLoadingQuestions(false);
      }
    };
    
    const fetchStaticQuestions = async () => {
      try {
        const { getStaticQuestions } = await import('@/utils/staticQuestions');
        const staticQuestions = await getStaticQuestions();
        console.log(`Loaded ${staticQuestions.length} static questions as fallback - ALL questions`);
        setQuestions(staticQuestions);
        setDisplayedQuestionCount(staticQuestions.length);
      } catch (error) {
        console.error('Error loading static questions:', error);
        setQuestions([]);
        setDisplayedQuestionCount(0);
      }
    };
    
    fetchQuestions();
  }, []);

  useEffect(() => {
    const loadIntermissionSlides = () => {
      const savedSlides = localStorage.getItem('intermissionSlides');
      if (savedSlides) {
        try {
          const slides = JSON.parse(savedSlides);
          const activeSlides = slides.filter((slide: any) => slide.isActive === true);
          console.log(`Found ${slides.length} total slides, ${activeSlides.length} are active`);
          setIntermissionSlides(activeSlides);
        } catch (error) {
          console.error('Error loading intermission slides:', error);
        }
      }
    };
    
    loadIntermissionSlides();
    
    const handleSlidesChanged = () => {
      loadIntermissionSlides();
    };
    
    window.addEventListener('intermissionSlidesChanged', handleSlidesChanged);
    
    return () => {
      window.removeEventListener('intermissionSlidesChanged', handleSlidesChanged);
    };
  }, []);

  useEffect(() => {
    let slideRotationTimer: number | undefined;
    
    if (currentState === 'intermission' && intermissionSlides.length > 1) {
      const rotationTime = gameSettings.slideRotationTime || 10;
      console.log(`Setting up slide rotation timer for ${rotationTime} seconds`);
      
      slideRotationTimer = window.setTimeout(() => {
        const nextIndex = (currentSlideIndex + 1) % intermissionSlides.length;
        setCurrentSlideIndex(nextIndex);
        console.log(`Rotating to slide ${nextIndex + 1} of ${intermissionSlides.length}`);
        
        const gameStateStr = localStorage.getItem('gameState');
        if (gameStateStr) {
          try {
            const gameState = JSON.parse(gameStateStr);
            gameState.slidesIndex = nextIndex;
            localStorage.setItem('gameState', JSON.stringify(gameState));
          } catch (error) {
            console.error('Error updating game state with new slide index:', error);
          }
        }
      }, rotationTime * 1000);
    }
    
    return () => {
      if (slideRotationTimer) {
        clearTimeout(slideRotationTimer);
      }
    };
  }, [currentState, currentSlideIndex, intermissionSlides.length, gameSettings.slideRotationTime]);

  useEffect(() => {
    if (currentState === 'intermission') {
      const currentGameState = localStorage.getItem('gameState');
      if (currentGameState) {
        try {
          const parsedState = JSON.parse(currentGameState);
          if (parsedState.slidesIndex !== undefined) {
            console.log(`Setting current slide index to ${parsedState.slidesIndex} from game state`);
            setCurrentSlideIndex(parsedState.slidesIndex);
          }
        } catch (error) {
          console.error('Error parsing game state for slides:', error);
        }
      }
    }
  }, [currentState, lastStateChange]);

  useEffect(() => {
    if (players.length > 0) {
      const roundTopPlayers = [...players]
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, 3)
        .map(player => ({
          ...player,
          isRoundWinner: true
        }));
      
      setRoundWinners(roundTopPlayers);
      
      setDayWinners(roundTopPlayers.map(player => ({
        ...player,
        isDayWinner: true
      })));
    }
  }, [players, currentState]);

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
  
  const getCurrentQuestion = () => {
    if (!questions.length) {
      return { 
        text: "Loading question...", 
        options: ["Option 1", "Option 2", "Option 3", "Option 4"],
        correctAnswer: "Option 1",
        category: "General"
      };
    }
    
    const safeIndex = questionIndex < questions.length ? questionIndex : 0;
    return questions[safeIndex] || { 
      text: "Loading question...", 
      options: ["Option 1", "Option 2", "Option 3", "Option 4"],
      correctAnswer: "Option 1",
      category: "General"
    };
  };
  
  const currentQuestion = getCurrentQuestion();
  
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
    console.log(`Getting slide at index ${slideIndex} of ${intermissionSlides.length} active slides`);
    return intermissionSlides[slideIndex];
  };

  const renderWinnerSlide = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold mb-8 text-primary">Round Winners</h1>
        
        {roundWinners.length > 0 ? (
          <div className="w-full max-w-2xl">
            <div className="flex justify-center items-end gap-4 mb-8">
              {roundWinners.length > 1 && (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-gray-400">
                    <span className="text-3xl font-bold text-gray-400">2</span>
                  </div>
                  <div className="text-center">
                    <div className="h-40 bg-gradient-to-t from-gray-600 to-gray-400 w-24 rounded-t-lg flex items-end justify-center pb-4">
                      <span className="text-white font-bold">{roundWinners[1].score || 0}</span>
                    </div>
                    <div className="bg-gray-200 text-gray-800 py-2 px-4 rounded-b-lg">
                      <span className="font-medium">{roundWinners[1].name}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {roundWinners.length > 0 && (
                <div className="flex flex-col items-center -mt-8">
                  <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-yellow-400">
                    <span className="text-4xl font-bold text-yellow-400">1</span>
                  </div>
                  <div className="text-center">
                    <div className="h-52 bg-gradient-to-t from-yellow-600 to-yellow-400 w-32 rounded-t-lg flex items-end justify-center pb-4">
                      <span className="text-white font-bold">{roundWinners[0].score || 0}</span>
                    </div>
                    <div className="bg-yellow-100 text-yellow-800 py-2 px-4 rounded-b-lg">
                      <span className="font-medium">{roundWinners[0].name}</span>
                    </div>
                  </div>
                </div>
              )}
              
              {roundWinners.length > 2 && (
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-amber-700">
                    <span className="text-3xl font-bold text-amber-700">3</span>
                  </div>
                  <div className="text-center">
                    <div className="h-32 bg-gradient-to-t from-amber-800 to-amber-500 w-24 rounded-t-lg flex items-end justify-center pb-4">
                      <span className="text-white font-bold">{roundWinners[2].score || 0}</span>
                    </div>
                    <div className="bg-amber-100 text-amber-800 py-2 px-4 rounded-b-lg">
                      <span className="font-medium">{roundWinners[2].name}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="card-trivia p-6 mt-4">
              <h2 className="text-2xl font-semibold mb-4">Congratulations!</h2>
              <p className="text-lg">Let's give a round of applause to our top players!</p>
            </div>
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
  };

  const renderContent = () => {
    switch (currentState) {
      case 'join':
        return (
          <JoinDisplay 
            gameCode={gameCode}
            uniquePlayers={uniquePlayers}
            onStartGame={handleStartGameNow}
            onManualNext={handleManualNextQuestion}
            forcePause={forcePause}
            togglePause={togglePause}
          />
        );
        
      case 'question':
        return (
          <QuestionDisplay
            currentQuestion={getCurrentQuestion()}
            timeLeft={timeLeft}
            questionCounter={questionCounter}
            onManualNext={handleManualNextQuestion}
            forcePause={forcePause}
            togglePause={togglePause}
          />
        );
        
      case 'answer':
        return (
          <AnswerDisplay
            currentQuestion={getCurrentQuestion()}
            questionCounter={questionCounter}
            onManualNext={handleManualNextQuestion}
          />
        );
        
      case 'intermission':
        if (gameSettings.showWinnerSlide !== false && roundWinners.length > 0 && currentSlideIndex === 0) {
          return renderWinnerSlide();
        }
      
        const currentSlide = getCurrentIntermissionSlide();
        console.log("Current intermission slide:", currentSlide);
        
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
          <LeaderboardDisplay
            sortedPlayers={sortedPlayers}
            onManualNext={handleManualNextQuestion}
          />
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
              Questions: {displayedQuestionCount}
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
