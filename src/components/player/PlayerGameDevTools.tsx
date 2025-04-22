
import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface PlayerGameDevToolsProps {
  handleForceSync: () => void;
  onForceTimer?: () => void;
  debugInfo?: any;
}

const PlayerGameDevTools: React.FC<PlayerGameDevToolsProps> = ({
  handleForceSync,
  onForceTimer,
  debugInfo
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const handleLogGameState = () => {
    const gameState = localStorage.getItem('gameState');
    const displayTruth = localStorage.getItem('gameState_display_truth');
    
    console.log('Current game state:', gameState ? JSON.parse(gameState) : 'Not found');
    console.log('Display truth:', displayTruth ? JSON.parse(displayTruth) : 'Not found');
    console.log('Debug info:', debugInfo);
  };
  
  const handleEmergencyReset = () => {
    // Clear all game state
    localStorage.removeItem('gameState');
    localStorage.removeItem('gameState_display_truth');
    
    // Create a high-priority reset state
    const resetState = {
      state: 'question',
      questionIndex: 0, 
      timeLeft: 30,
      timestamp: Date.now() + 20000,
      definitiveTruth: true,
      forceSync: true,
      emergencyReset: true
    };
    
    // Apply the reset
    localStorage.setItem('gameState', JSON.stringify(resetState));
    window.dispatchEvent(new CustomEvent('triviaStateChange', { 
      detail: resetState
    }));
    
    console.log('EMERGENCY RESET applied');
    
    // Force page reload after a brief delay
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="mt-4 border border-dashed border-indigo-500/40 rounded-lg p-4 bg-indigo-900/20">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-indigo-200 text-sm font-semibold">Developer Tools</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="h-6 px-2 text-xs"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? 'Hide Details' : 'Show Details'}
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-2 mb-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-indigo-800/30"
          onClick={handleForceSync}
        >
          Force Sync
        </Button>
        
        {onForceTimer && (
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-indigo-800/30"
            onClick={onForceTimer}
          >
            Reset Timer
          </Button>
        )}
        
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-indigo-800/30"
          onClick={handleLogGameState}
        >
          Log State
        </Button>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="bg-indigo-800/30"
          onClick={() => {
            localStorage.removeItem('gameState');
            localStorage.removeItem('gameState_display_truth');
            console.log('Cleared all game state');
          }}
        >
          Clear State
        </Button>
      </div>
      
      <Button 
        variant="destructive" 
        size="sm" 
        className="w-full text-xs"
        onClick={handleEmergencyReset}
      >
        Emergency Reset
      </Button>
      
      {showDetails && debugInfo && (
        <div className="mt-3 border-t border-indigo-500/30 pt-2">
          <h4 className="text-xs text-indigo-300 mb-1">Debug Information</h4>
          <div className="bg-indigo-900/40 p-2 rounded text-xs text-indigo-100 font-mono">
            <div>State: {debugInfo.currentState || "unknown"} | Time: {debugInfo.timeLeft}s | Revealed: {debugInfo.isAnswerRevealed ? 'Yes' : 'No'}</div>
            <div>Selected: {debugInfo.selectedAnswer || 'None'} | Clicks: {debugInfo.clicksRegistered || 0}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerGameDevTools;
