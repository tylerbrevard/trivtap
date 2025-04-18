
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Lock, Mail, History, Trophy, Building } from 'lucide-react';
import { supabase } from "@/integrations/supabase/client";

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Missing Fields",
        description: "Please enter both email and password.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      
      toast({
        title: "Login Successful",
        description: "Welcome back to TrivTap!",
      });
      
      navigate('/admin/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Login Failed",
        description: error.message || "An error occurred during login.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/80">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block mb-6">
            <h1 className="text-3xl font-bold text-primary">TrivTap</h1>
          </Link>
          <h2 className="text-2xl font-bold mb-2">Venue Login</h2>
          <p className="text-muted-foreground">
            Sign in to your venue account to manage your trivia games
          </p>
        </div>
        
        <div className="card-trivia p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Input
                  id="email"
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="#" className="text-xs text-primary hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
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
            </div>
            
            <Button 
              type="submit" 
              className="btn-trivia w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </div>
        
        <div className="bg-card border border-border/40 rounded-lg p-5 mb-6">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <Building className="mr-2 h-5 w-5 text-primary" />
            Venue Benefits
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <Trophy className="h-4 w-4 mr-2 mt-0.5 text-primary" />
              <span>Create and host engaging trivia games for your customers</span>
            </li>
            <li className="flex items-start">
              <History className="h-4 w-4 mr-2 mt-0.5 text-primary" />
              <span>View analytics on player engagement and game performance</span>
            </li>
            <li className="flex items-start">
              <Lock className="h-4 w-4 mr-2 mt-0.5 text-primary" />
              <span>Customize your trivia content and branding</span>
            </li>
          </ul>
        </div>
        
        <div className="mt-6 text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            Don't have a venue account?{" "}
            <Link to="/register" className="text-primary hover:underline">
              Sign up
            </Link>
          </p>
          
          <div className="border-t border-border/40 pt-4">
            <p className="text-sm text-muted-foreground mb-2">
              Looking to join games as a player instead?
            </p>
            <Button variant="outline" asChild className="w-full">
              <Link to="/join">
                Join as a Player
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
