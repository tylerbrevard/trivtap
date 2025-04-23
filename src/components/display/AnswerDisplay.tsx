import React, { useEffect } from 'react';
import { Button } from "@/components/ui/button";

interface AnswerDisplayProps {
  currentQuestion: any;
  questionCounter: number;
  onManualNext: () => void;
}

export const AnswerDisplay = ({
  currentQuestion,
  questionCounter,
  onManualNext
}: AnswerDisplayProps) => {
  // Add effect to broadcast the answer state
  useEffect(() => {
    // Create authoritative answer state
    const definedState = {
      state: 'answer',
      questionIndex: questionCounter - 1,
      timeLeft: 0,
      questionCounter: questionCounter,
      timestamp: Date.now(),
      displayInit: true,
      questionText: currentQuestion.text,
      correctAnswer: currentQuestion.correctAnswer,
      gameId: localStorage.getItem('currentGameId') || sessionStorage.getItem('currentGameId')
    };
    
    // Store the state
    localStorage.setItem('gameState', JSON.stringify(definedState));
    
    // Dispatch standard event
    window.dispatchEvent(new CustomEvent('triviaStateChange', { 
      detail: definedState
    }));
    
    // Also broadcast using BroadcastChannel API
    try {
      const bc = new BroadcastChannel('trivia_game_state');
      bc.postMessage(definedState);
      
      // Keep channel open to handle sync requests
      const handleSyncRequest = (event: MessageEvent) => {
        if (event.data && event.data.type === 'REQUEST_STATE' || event.data.type === 'FORCE_SYNC') {
          console.log('Received sync request via BroadcastChannel:', event.data);
          bc.postMessage({
            ...definedState,
            timestamp: Date.now(),
            syncResponse: true
          });
        }
      };
      
      bc.onmessage = handleSyncRequest;
      
      // Close channel on cleanup
      return () => {
        bc.close();
      };
    } catch (error) {
      console.log('BroadcastChannel not supported, using only events');
    }
  }, [currentQuestion, questionCounter]);
  
  // Listen for sync requests from players
  useEffect(() => {
    const handleSyncRequest = (e: CustomEvent) => {
      console.log('Received sync request from player:', e.detail);
      
      // Create state update
      const syncResponse = {
        state: 'answer',
        questionIndex: questionCounter - 1,
        timeLeft: 0,
        questionCounter: questionCounter,
        timestamp: Date.now(),
        questionText: currentQuestion.text,
        correctAnswer: currentQuestion.correctAnswer,
        syncResponse: true,
        targetPlayer: e.detail.playerName,
        gameId: localStorage.getItem('currentGameId') || sessionStorage.getItem('currentGameId')
      };
      
      // Send response
      window.dispatchEvent(new CustomEvent('gameStateUpdate', { 
        detail: syncResponse
      }));
      
      console.log('Sent sync response to player:', e.detail.playerName);
    };
    
    // Listen for sync requests
    window.addEventListener('requestGameState', handleSyncRequest as EventListener);
    
    return () => {
      window.removeEventListener('requestGameState', handleSyncRequest as EventListener);
    };
  }, [currentQuestion, questionCounter]);

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
          {currentQuestion.options.map((option: string, index: number) => (
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
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={onManualNext}>
              Force Next Question
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Manually broadcast state
                const syncResponse = {
                  state: 'answer',
                  questionIndex: questionCounter - 1,
                  timeLeft: 0,
                  questionCounter: questionCounter,
                  timestamp: Date.now(),
                  questionText: currentQuestion.text,
                  correctAnswer: currentQuestion.correctAnswer,
                  manualSync: true,
                  gameId: localStorage.getItem('currentGameId') || sessionStorage.getItem('currentGameId')
                };
                
                // Broadcast via events
                window.dispatchEvent(new CustomEvent('gameStateUpdate', { 
                  detail: syncResponse
                }));
                window.dispatchEvent(new CustomEvent('triviaStateChange', { 
                  detail: syncResponse
                }));
                
                // Also via BroadcastChannel
                try {
                  const bc = new BroadcastChannel('trivia_game_state');
                  bc.postMessage(syncResponse);
                  setTimeout(() => bc.close(), 500);
                } catch (error) {
                  console.log('BroadcastChannel not supported');
                }
                
                console.log('Manually broadcast state to all players');
              }}
            >
              Sync All Players
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Current question:', currentQuestion);
              }}
            >
              Log Debug Info
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
