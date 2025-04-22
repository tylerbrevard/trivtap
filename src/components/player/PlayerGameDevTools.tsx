
import React from "react";
import { Button } from "@/components/ui/button";
import { Zap, RefreshCw, Bug, Timer, Play, AlertCircle } from "lucide-react";

interface PlayerGameDevToolsProps {
  handleForceSync: () => void;
  debugInfo?: {
    selectedAnswer: string | null;
    timeLeft: number;
    isAnswerRevealed: boolean;
    clicksRegistered: number;
    currentState: string;
  };
  onForceTimer?: () => void;
}

const PlayerGameDevTools: React.FC<PlayerGameDevToolsProps> = ({
  handleForceSync,
  debugInfo,
  onForceTimer
}) => {
  return (
    <div className="mt-4 p-4 border border-dashed border-purple-500/30 rounded bg-purple-900/10">
      <h3 className="text-purple-300 font-bold mb-2 flex items-center">
        <Zap className="h-4 w-4 mr-1" /> Dev Tools
      </h3>
      
      {debugInfo && (
        <div className="mb-3 p-2 bg-black/20 rounded text-xs font-mono text-purple-200">
          <p>State: {debugInfo.currentState} | Time: {debugInfo.timeLeft}s | Revealed: {debugInfo.isAnswerRevealed ? 'Yes' : 'No'}</p>
          <p>Selected: {debugInfo.selectedAnswer || 'None'} | Clicks: {debugInfo.clicksRegistered}</p>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        <Button 
          variant="outline" 
          onClick={() => {
            console.log("Force sync button clicked");
            handleForceSync();
          }}
          className="bg-purple-800/50 hover:bg-purple-700/50 text-purple-100 border-purple-600/50 flex items-center"
          size="sm"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Force Sync with Display
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            localStorage.removeItem('gameState');
            console.log('Cleared gameState from localStorage');
            setTimeout(() => window.location.reload(), 300);
          }}
          className="bg-red-800/50 hover:bg-red-700/50 text-red-100 border-red-600/50 flex items-center"
          size="sm"
        >
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
          Clear Game State & Reload
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            console.log('Current localStorage:', {
              gameState: JSON.parse(localStorage.getItem('gameState') || '{}'),
              displayTruth: JSON.parse(localStorage.getItem('gameState_display_truth') || '{}'),
              playerName: sessionStorage.getItem('playerName'),
              gameId: sessionStorage.getItem('gameId'),
              elements: {
                selectedElements: document.querySelectorAll('[aria-selected="true"]').length,
                clickableElements: document.querySelectorAll('[role="button"]').length,
                options: Array.from(document.querySelectorAll('[data-option]')).map(el => el.getAttribute('data-option'))
              }
            });
          }}
          className="bg-blue-800/50 hover:bg-blue-700/50 text-blue-100 border-blue-600/50 flex items-center"
          size="sm"
        >
          <Bug className="h-3.5 w-3.5 mr-1.5" />
          Log Debug Info
        </Button>
        {onForceTimer && (
          <Button
            variant="outline"
            onClick={onForceTimer}
            className="bg-green-800/50 hover:bg-green-700/50 text-green-100 border-green-600/50 flex items-center"
            size="sm"
          >
            <Timer className="h-3.5 w-3.5 mr-1.5" />
            Force Reset Timer (25s)
          </Button>
        )}
        <Button
          variant="outline"
          onClick={() => {
            // Try to get the game to move forward
            const gameState = localStorage.getItem('gameState');
            if (gameState) {
              try {
                const parsedState = JSON.parse(gameState);
                const forcedState = {
                  ...parsedState,
                  state: parsedState.state === 'question' ? 'answer' : 'question',
                  timeLeft: parsedState.state === 'question' ? 0 : 30,
                  timestamp: Date.now() + 5000,
                  forceSync: true,
                  definitiveTruth: true
                };
                localStorage.setItem('gameState', JSON.stringify(forcedState));
                window.dispatchEvent(new CustomEvent('triviaStateChange', { 
                  detail: forcedState
                }));
                console.log(`Forced state transition to: ${forcedState.state}`);
              } catch (e) {
                console.error('Error forcing state transition:', e);
              }
            }
          }}
          className="bg-yellow-800/50 hover:bg-yellow-700/50 text-yellow-100 border-yellow-600/50 flex items-center"
          size="sm"
        >
          <Play className="h-3.5 w-3.5 mr-1.5" />
          Force Next Game State
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            // Direct click simulation
            const options = document.querySelectorAll('[data-option]');
            if (options.length > 0) {
              // Click the first option directly
              const firstOption = options[0] as HTMLElement;
              firstOption.click();
              console.log('Simulated click on option:', firstOption.getAttribute('data-option'));
            } else {
              console.log('No options found to simulate click');
            }
          }}
          className="bg-indigo-800/50 hover:bg-indigo-700/50 text-indigo-100 border-indigo-600/50 flex items-center"
          size="sm"
        >
          <AlertCircle className="h-3.5 w-3.5 mr-1.5" />
          Simulate Click
        </Button>
      </div>
    </div>
  );
};

export default PlayerGameDevTools;
