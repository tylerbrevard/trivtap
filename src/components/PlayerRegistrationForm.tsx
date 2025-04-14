
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface PlayerRegistrationFormProps {
  onSuccess: (playerName: string) => void;
}

const PlayerRegistrationForm = ({ onSuccess }: PlayerRegistrationFormProps) => {
  const [playerName, setPlayerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName || !email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please fill out all fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Register the player with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: playerName,
            is_player: true
          }
        }
      });
      
      if (authError) throw authError;
      
      if (authData.user) {
        // Create registered player entry
        const { error: playerError } = await supabase
          .from('registered_players')
          .insert({
            user_id: authData.user.id,
            name: playerName,
            email: email
          });
          
        if (playerError) throw playerError;
      }
      
      toast({
        title: "Registration Successful",
        description: "Your player account has been created. Now you can track your game history!",
      });
      
      onSuccess(playerName);
    } catch (error: any) {
      console.error('Player registration error:', error);
      toast({
        title: "Registration Failed",
        description: error.message || "An error occurred during registration.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="card-trivia p-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-semibold">Create a Player Account</h3>
        <p className="text-muted-foreground text-sm">
          Register to track your scores and game history
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="playerName">Your Name</Label>
          <div className="relative">
            <Input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Your Display Name"
              className="trivia-input pl-10"
              maxLength={20}
            />
            <User className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="playerEmail">Email</Label>
          <div className="relative">
            <Input
              id="playerEmail"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="trivia-input pl-10"
            />
            <Mail className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="playerPassword">Password</Label>
          <div className="relative">
            <Input
              id="playerPassword"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="trivia-input pl-10"
            />
            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1 h-8 w-8 text-muted-foreground"
              onClick={toggleShowPassword}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Password must be at least 8 characters long
          </p>
        </div>
        
        <Button 
          type="submit" 
          className="btn-trivia w-full"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating Account..." : "Create Player Account"}
        </Button>
      </form>
    </div>
  );
};

export default PlayerRegistrationForm;
