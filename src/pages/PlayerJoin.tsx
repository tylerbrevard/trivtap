
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Gamepad2, ArrowRight } from 'lucide-react';

const PlayerJoin = () => {
  const [otp, setOtp] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      toast({
        title: "OTP Required",
        description: "Please enter the OTP code displayed on the trivia screen.",
        variant: "destructive",
      });
      return;
    }
    
    if (!playerName) {
      toast({
        title: "Name Required",
        description: "Please enter your name to join the game.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    // Mock API call to validate OTP
    setTimeout(() => {
      setIsSubmitting(false);
      
      // Simulate successful join - in a real app, this would verify the OTP with the backend
      if (otp.length >= 4) {
        // Store player info in localStorage/sessionStorage
        sessionStorage.setItem('playerName', playerName);
        sessionStorage.setItem('gameId', otp);
        
        toast({
          title: "Game Joined!",
          description: `Welcome ${playerName}! Get ready to play.`,
        });
        
        // Redirect to the game screen
        navigate('/play');
      } else {
        toast({
          title: "Invalid OTP",
          description: "The OTP code you entered is invalid. Please check and try again.",
          variant: "destructive",
        });
      }
    }, 1000);
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
              <Gamepad2 className="h-10 w-10 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Join Trivia Game</h1>
          <p className="text-muted-foreground">
            Enter the code shown on the trivia display to join the game
          </p>
        </div>
        
        <div className="card-trivia p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="otp" className="block text-sm font-medium">
                Game Code
              </label>
              <Input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.toUpperCase())}
                placeholder="Enter code (e.g., ABCD)"
                className="trivia-input text-center text-2xl tracking-widest uppercase"
                maxLength={6}
                autoComplete="off"
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="playerName" className="block text-sm font-medium">
                Your Name
              </label>
              <Input
                id="playerName"
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Enter your name"
                className="trivia-input"
                maxLength={20}
              />
            </div>
            
            <Button 
              type="submit" 
              className="btn-trivia w-full flex items-center justify-center gap-2"
              disabled={isSubmitting}
            >
              Join Game
              <ArrowRight size={18} />
            </Button>
          </form>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Don't see a game code? Ask the venue to display the trivia screen.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PlayerJoin;
