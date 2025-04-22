
import React from 'react';
import { Wifi } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface IntermissionDisplayProps {
  currentSlide: any;
  roundWinners: any[];
  onManualNext: () => void;
  showWinnerSlide: boolean;
  currentSlideIndex: number;
}

export const IntermissionDisplay = ({
  currentSlide,
  roundWinners,
  onManualNext,
  showWinnerSlide,
  currentSlideIndex
}: IntermissionDisplayProps) => {
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
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <p>No players have joined yet.</p>
          </div>
        )}
      </div>
    );
  };

  if (showWinnerSlide && currentSlideIndex === 0) {
    return renderWinnerSlide();
  }

  if (!currentSlide) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <h1 className="text-4xl font-bold mb-8 text-primary">Intermission</h1>
        <div className="card-trivia p-8 max-w-2xl w-full">
          <h2 className="text-3xl font-bold mb-4">Welcome to Trivia Night!</h2>
          <p className="text-xl mb-6">The next question will be coming up shortly...</p>
        </div>
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
          <Button variant="outline" size="sm" onClick={onManualNext}>
            Force Next Question
          </Button>
        </div>
      )}
    </div>
  );
};
