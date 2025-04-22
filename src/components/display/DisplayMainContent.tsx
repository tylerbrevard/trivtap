
import React from "react";
import { JoinDisplay } from '@/components/display/JoinDisplay';
import { QuestionDisplay } from '@/components/display/QuestionDisplay';
import { AnswerDisplay } from '@/components/display/AnswerDisplay';
import { LeaderboardDisplay } from '@/components/display/LeaderboardDisplay';
import { IntermissionDisplay } from '@/components/display/IntermissionDisplay';
import { Button } from "@/components/ui/button";

interface DisplayMainContentProps {
  hasGameStarted: boolean;
  currentState: string;
  gameCode: string;
  uniquePlayers: any[];
  handleStartGameNow: () => void;
  handleManualNextQuestion: () => void;
  forcePause: boolean;
  togglePause: () => void;
  getCurrentQuestion: () => any;
  timeLeft: number;
  questionCounter: number;
  roundWinners: any[];
  gameSettings: any;
  intermissionSlides: any[];
  currentSlideIndex: number;
  getCurrentIntermissionSlide: () => any;
  sortedPlayers: any[];
}

export const DisplayMainContent = ({
  hasGameStarted,
  currentState,
  gameCode,
  uniquePlayers,
  handleStartGameNow,
  handleManualNextQuestion,
  forcePause,
  togglePause,
  getCurrentQuestion,
  timeLeft,
  questionCounter,
  roundWinners,
  gameSettings,
  intermissionSlides,
  currentSlideIndex,
  getCurrentIntermissionSlide,
  sortedPlayers,
}: DisplayMainContentProps) => {

  // Winner Slide is inlined here so refactor doesn't lose code
  const renderWinnerSlide = () => (
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

  if (!hasGameStarted && (currentState === "join" || window.location.href.toLowerCase().includes("display"))) {
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
  }

  switch(currentState) {
    case "join":
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
    case "question":
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
    case "answer":
      return (
        <AnswerDisplay
          currentQuestion={getCurrentQuestion()}
          questionCounter={questionCounter}
          onManualNext={handleManualNextQuestion}
        />
      );
    case "intermission":
      if (gameSettings.showWinnerSlide !== false && roundWinners.length > 0 && currentSlideIndex === 0) {
        return renderWinnerSlide();
      }
      const currentSlide = getCurrentIntermissionSlide();
      return (
        <IntermissionDisplay
          currentSlide={currentSlide}
          roundWinners={roundWinners}
          onManualNext={handleManualNextQuestion}
          showWinnerSlide={gameSettings.showWinnerSlide !== false}
          currentSlideIndex={currentSlideIndex}
        />
      );
    case "leaderboard":
      return (
        <LeaderboardDisplay
          sortedPlayers={sortedPlayers}
          onManualNext={handleManualNextQuestion}
        />
      );
    default:
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
  }
};
