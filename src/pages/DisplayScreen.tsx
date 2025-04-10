import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { QrCode } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

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
  
  useEffect(() => {
    const generateGameCode = () => {
      const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let result = '';
      for (let i = 0; i < 4; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
      }
      return result;
    };
    
    setGameCode(generateGameCode());
    
    const setupPlayerSubscription = async () => {
      const channel = supabase
        .channel('public:players')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'players' },
          (payload) => {
            setPlayers((current) => [...current, payload.new]);
            toast({
              title: "New player joined!",
              description: `${payload.new.name} has joined the game.`,
            });
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(channel);
      };
    };
    
    const cleanup = setupPlayerSubscription();
    return () => {
      if (cleanup && typeof cleanup === 'function') {
        cleanup();
      }
    };
  }, [toast]);
  
  useEffect(() => {
    let timerId: number | undefined;
    
    if (currentState === 'join') {
      timerId = window.setTimeout(() => {
        setCurrentState('question');
        setTimeLeft(mockSettings.questionDuration);
      }, 10000);
    } 
    else if (currentState === 'question') {
      if (timeLeft > 0) {
        timerId = window.setTimeout(() => {
          setTimeLeft(timeLeft - 1);
        }, 1000);
      } else {
        setCurrentState('answer');
        timerId = window.setTimeout(() => {
          if (questionCounter % 10 === 0) {
            setCurrentState('leaderboard');
            timerId = window.setTimeout(() => {
              moveToNextQuestion();
            }, 10000);
          } else {
            moveToNextQuestion();
          }
        }, mockSettings.answerRevealDuration * 1000);
      }
    }
    
    return () => {
      if (timerId) {
        clearTimeout(timerId);
      }
    };
  }, [currentState, timeLeft, questionCounter]);
  
  const moveToNextQuestion = () => {
    setQuestionCounter(prev => prev + 1);
    setCurrentQuestionIndex((currentQuestionIndex + 1) % mockQuestions.length);
    setTimeLeft(mockSettings.questionDuration);
    setCurrentState('question');
  };
  
  const currentQuestion = mockQuestions[currentQuestionIndex];
  
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
              <p className="text-xl font-medium">Players joined: {players.length}</p>
              <div className="flex flex-wrap justify-center gap-2 mt-2">
                {players.map(player => (
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
                <div className="text-xl font-medium">
                  {timeLeft}s
                </div>
              </div>
              <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-1000"
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
            
            {players.length > 0 ? (
              <div className="w-full max-w-2xl">
                <div className="flex justify-center items-end gap-4 mb-8">
                  {players.length > 1 && (
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-gray-400">
                        <span className="text-3xl font-bold text-gray-400">2</span>
                      </div>
                      <div className="text-center">
                        <div className="h-40 bg-gradient-to-t from-gray-600 to-gray-400 w-24 rounded-t-lg flex items-end justify-center pb-4">
                          <span className="text-white font-bold">{players[1].score || 0}</span>
                        </div>
                        <div className="bg-gray-200 text-gray-800 py-2 px-4 rounded-b-lg">
                          <span className="font-medium">{players[1].name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {players.length > 0 && (
                    <div className="flex flex-col items-center -mt-8">
                      <div className="w-24 h-24 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-yellow-400">
                        <span className="text-4xl font-bold text-yellow-400">1</span>
                      </div>
                      <div className="text-center">
                        <div className="h-52 bg-gradient-to-t from-yellow-600 to-yellow-400 w-32 rounded-t-lg flex items-end justify-center pb-4">
                          <span className="text-white font-bold">{players[0].score || 0}</span>
                        </div>
                        <div className="bg-yellow-100 text-yellow-800 py-2 px-4 rounded-b-lg">
                          <span className="font-medium">{players[0].name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {players.length > 2 && (
                    <div className="flex flex-col items-center">
                      <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mb-2 border-4 border-amber-700">
                        <span className="text-3xl font-bold text-amber-700">3</span>
                      </div>
                      <div className="text-center">
                        <div className="h-32 bg-gradient-to-t from-amber-800 to-amber-500 w-24 rounded-t-lg flex items-end justify-center pb-4">
                          <span className="text-white font-bold">{players[2].score || 0}</span>
                        </div>
                        <div className="bg-amber-100 text-amber-800 py-2 px-4 rounded-b-lg">
                          <span className="font-medium">{players[2].name}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                
                {players.length > 3 && (
                  <div className="card-trivia p-4">
                    <div className="divide-y divide-border">
                      {players.slice(3, 10).map((player, index) => (
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
            <div className="text-muted-foreground">
              Players: {players.length}
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
