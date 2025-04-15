
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Crown, Trophy, Medal, Star, Clock } from 'lucide-react';
import { gameSettings } from '@/utils/gameSettings';

interface PlayerScore {
  name: string;
  score: number;
  isRegistered: boolean;
  correctAnswers: number;
}

const Intermission = () => {
  const [remainingTime, setRemainingTime] = useState(gameSettings.intermissionDuration);
  const [playerScores, setPlayerScores] = useState<PlayerScore[]>([]);
  const [topPlayer, setTopPlayer] = useState<PlayerScore | null>(null);
  const [intermissionSlides, setIntermissionSlides] = useState<any[]>([]);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get intermission data from location state or localStorage
  useEffect(() => {
    const getPlayerScores = () => {
      const scores: PlayerScore[] = [];
      
      // Find all player scores in localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('playerScore_')) {
          try {
            const playerData = JSON.parse(localStorage.getItem(key) || '{}');
            if (playerData.name && playerData.score !== undefined) {
              scores.push({
                name: playerData.name,
                score: playerData.score,
                isRegistered: playerData.isRegistered || false,
                correctAnswers: playerData.correctAnswers || 0
              });
            }
          } catch (e) {
            console.error('Error parsing player score:', e);
          }
        }
      }
      
      // Sort by score (highest first)
      return scores.sort((a, b) => b.score - a.score);
    };
    
    // Load slides from localStorage
    const loadSlides = () => {
      const slidesData = localStorage.getItem('intermissionSlides');
      if (slidesData) {
        try {
          const slides = JSON.parse(slidesData);
          setIntermissionSlides(slides.filter((slide: any) => slide.isActive));
        } catch (e) {
          console.error('Error parsing intermission slides:', e);
          setIntermissionSlides([]);
        }
      } else {
        // Create default slide if none exist
        const defaultSlide = {
          id: 'default-slide',
          title: 'Intermission',
          content: 'Next question coming up soon...',
          isActive: true
        };
        setIntermissionSlides([defaultSlide]);
        localStorage.setItem('intermissionSlides', JSON.stringify([defaultSlide]));
      }
    };
    
    const loadScores = () => {
      const scores = getPlayerScores();
      setPlayerScores(scores);
      setTopPlayer(scores.length > 0 ? scores[0] : null);
      
      // If no players, create a dummy player for testing
      if (process.env.NODE_ENV === 'development' && scores.length === 0) {
        const dummyPlayer = {
          name: 'Test Player',
          score: 500,
          isRegistered: true,
          correctAnswers: 5
        };
        setPlayerScores([dummyPlayer]);
        setTopPlayer(dummyPlayer);
      }
    };
    
    // Load initial data
    loadScores();
    loadSlides();
    
    // Set up interval to refresh data
    const refreshInterval = setInterval(loadScores, 1000);
    
    // Get current slide index from game state
    const gameState = localStorage.getItem('gameState');
    if (gameState) {
      try {
        const parsedState = JSON.parse(gameState);
        if (parsedState.slidesIndex !== undefined) {
          setCurrentSlideIndex(parsedState.slidesIndex);
        }
      } catch (e) {
        console.error('Error parsing game state for slides:', e);
      }
    }
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  // Setup timer
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timerInterval);
  }, []);
  
  // Auto navigate when timer runs out
  useEffect(() => {
    if (remainingTime === 0) {
      navigate('/display');
    }
  }, [remainingTime, navigate]);
  
  const getProgressPercent = () => {
    return (remainingTime / gameSettings.intermissionDuration) * 100;
  };
  
  const getTopPlayerTrophyIcon = () => {
    return <Crown className="h-12 w-12 text-yellow-500" />;
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const renderCurrentSlide = () => {
    if (intermissionSlides.length === 0) {
      return (
        <div className="text-center p-6 bg-muted rounded-lg">
          <p className="text-lg font-medium">No intermission slides available</p>
        </div>
      );
    }
    
    const slideIndex = currentSlideIndex % intermissionSlides.length;
    const slide = intermissionSlides[slideIndex];
    
    return (
      <Card className="mb-6 animate-fade-in">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-4">{slide.title}</h2>
          <div className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: slide.content }}
          />
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="min-h-screen bg-background p-6 flex flex-col">
      {/* Header with timer */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Intermission</h1>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Clock className="h-5 w-5" />
          <span>{formatTime(remainingTime)}</span>
        </div>
      </div>
      
      <Progress value={getProgressPercent()} className="h-2 mb-8" />
      
      {/* Current Intermission Slide */}
      {renderCurrentSlide()}
      
      {/* Top Winner Highlight */}
      {topPlayer && (
        <div className="mb-8 animate-fade-in">
          <div className="relative">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-background font-bold py-1 px-4 rounded-full z-10">
              ROUND LEADER
            </div>
            <Card className="bg-gradient-to-r from-yellow-100 to-amber-50 border-yellow-300 overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 bg-yellow-400 rounded-full opacity-20"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 -ml-6 -mb-6 bg-yellow-400 rounded-full opacity-20"></div>
              
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-yellow-900">{topPlayer.name}</h2>
                    <p className="text-yellow-700 font-medium">
                      {topPlayer.correctAnswers} correct answers
                    </p>
                    {topPlayer.isRegistered && (
                      <span className="inline-flex items-center mt-1 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded-full">
                        <Star className="h-3 w-3 mr-1" />
                        Registered Player
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-col items-center">
                    {getTopPlayerTrophyIcon()}
                    <div className="text-3xl font-bold text-yellow-700 mt-2">
                      {topPlayer.score}
                    </div>
                    <div className="text-xs font-medium text-yellow-600">
                      POINTS
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
      
      {/* Player scores list */}
      <div className="bg-card border rounded-lg p-4 flex-1">
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Trophy className="mr-2 h-5 w-5 text-primary" />
          Current Standings
        </h2>
        
        <div className="space-y-3">
          {playerScores.length > 0 ? (
            playerScores.slice(0, 10).map((player, index) => (
              <div key={player.name + index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 text-center font-semibold text-muted-foreground">
                      {index + 1}
                    </div>
                    
                    {index < 3 && (
                      <div>
                        {index === 0 ? (
                          <Crown className="h-5 w-5 text-yellow-500" />
                        ) : index === 1 ? (
                          <Medal className="h-5 w-5 text-gray-400" />
                        ) : (
                          <Medal className="h-5 w-5 text-amber-700" />
                        )}
                      </div>
                    )}
                    
                    <div className="font-medium">
                      {player.name}
                      {player.isRegistered && (
                        <span className="ml-2 inline-flex items-center text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          <Star className="h-3 w-3 mr-0.5" />
                          Registered
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="font-bold text-lg">
                    {player.score}
                  </div>
                </div>
                {index < playerScores.length - 1 && <Separator className="mt-3" />}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-3">
                Waiting for players to join...
              </p>
              <p className="text-sm text-muted-foreground">
                Players can join by entering the game code on their device
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Admin controls */}
      <div className="mt-6 flex justify-end">
        <Button 
          variant="outline" 
          onClick={() => navigate('/display')}
        >
          Skip Intermission
        </Button>
      </div>
    </div>
  );
};

export default Intermission;
