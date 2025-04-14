
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Gamepad2, ArrowRight, UserPlus, History } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";

const PlayerJoin = () => {
  const [otp, setOtp] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>("guest");
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        const { data: playerData, error } = await supabase
          .from('registered_players')
          .select('name')
          .eq('user_id', data.session.user.id)
          .single();
          
        if (!error && playerData) {
          setPlayerName(playerData.name);
          setIsRegistered(true);
          setCurrentTab("registered");
        }
      }
    };
    
    checkSession();
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp) {
      toast({
        title: "Game Code Required",
        description: "Please enter the game code displayed on the trivia screen.",
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
    
    // Store player info in sessionStorage
    sessionStorage.setItem('playerName', playerName);
    sessionStorage.setItem('gameId', otp);
    
    // If player is registered, store their registration status
    if (isRegistered) {
      sessionStorage.setItem('isRegistered', 'true');
    } else {
      sessionStorage.setItem('isRegistered', 'false');
    }
    
    toast({
      title: "Game Joined!",
      description: `Welcome ${playerName}! Get ready to play.`,
    });
    
    // Redirect to the game screen
    navigate('/play');
    setIsSubmitting(false);
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      if (data.user) {
        const { data: playerData, error: playerError } = await supabase
          .from('registered_players')
          .select('name')
          .eq('user_id', data.user.id)
          .single();
          
        if (!playerError && playerData) {
          setPlayerName(playerData.name);
          setIsRegistered(true);
          
          toast({
            title: "Login Successful",
            description: `Welcome back, ${playerData.name}!`,
          });
          
          setCurrentTab("registered");
        }
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsRegistered(false);
      setPlayerName('');
      setCurrentTab("guest");
      
      toast({
        title: "Logged Out",
        description: "You have been logged out.",
      });
    } catch (error: any) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Failed",
        description: error.message || "An error occurred during logout.",
        variant: "destructive",
      });
    }
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
        
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="guest">Guest Player</TabsTrigger>
            <TabsTrigger value="registered">Registered Player</TabsTrigger>
          </TabsList>
          
          <TabsContent value="guest" className="mt-4">
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
            
            <div className="mt-6 p-4 bg-card rounded-lg border border-border/40">
              <div className="flex items-start gap-3">
                <History className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium">Save Your Game History</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Register or login to track your scores and see your game history!
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs text-primary"
                    onClick={() => setCurrentTab("registered")}
                  >
                    Register or login →
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="registered" className="mt-4">
            {isRegistered ? (
              <div className="card-trivia p-6">
                <div className="text-center mb-4">
                  <h3 className="text-xl font-semibold">Welcome, {playerName}!</h3>
                  <p className="text-muted-foreground">Your game history will be saved</p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="registeredOtp" className="block text-sm font-medium">
                      Game Code
                    </label>
                    <Input
                      id="registeredOtp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.toUpperCase())}
                      placeholder="Enter code (e.g., ABCD)"
                      className="trivia-input text-center text-2xl tracking-widest uppercase"
                      maxLength={6}
                      autoComplete="off"
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
                  
                  <Button 
                    type="button" 
                    variant="outline"
                    className="w-full"
                    onClick={handleLogout}
                  >
                    Logout
                  </Button>
                </form>
              </div>
            ) : (
              <div className="card-trivia p-6">
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium">
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="trivia-input"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium">
                      Password
                    </label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="trivia-input"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="btn-trivia w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Signing in..." : "Sign In"}
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Don't have an account?{" "}
                      <Link to="/register" className="text-primary hover:underline">
                        Register here
                      </Link>
                    </p>
                  </div>
                </form>
              </div>
            )}
          </TabsContent>
        </Tabs>
        
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
