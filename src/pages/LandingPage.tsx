import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Award, Users, Smartphone, Zap, Clock, Github, Menu, X, LogIn } from 'lucide-react';
const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  return <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-bold text-primary">TrivTap.com</span>
            </div>
            
            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-foreground/80 hover:text-primary transition-colors">Features</a>
              <a href="#how-it-works" className="text-foreground/80 hover:text-primary transition-colors">How It Works</a>
              <a href="#testimonials" className="text-foreground/80 hover:text-primary transition-colors">Testimonials</a>
              <Link to="/login" className="text-primary hover:text-primary/80 transition-colors">Login</Link>
              <Link to="/join">
                <Button variant="outline" className="flex items-center gap-2 border-primary text-primary hover:bg-primary/10">
                  <LogIn size={18} />
                  Join Game
                </Button>
              </Link>
              <Link to="/register">
                <Button className="btn-trivia">Get Started</Button>
              </Link>
            </nav>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle menu">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Mobile menu */}
        {mobileMenuOpen && <div className="md:hidden py-2 px-4 space-y-3 border-t border-border/40">
            <a href="#features" className="block py-2 text-foreground/80 hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Features
            </a>
            <a href="#how-it-works" className="block py-2 text-foreground/80 hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              How It Works
            </a>
            <a href="#testimonials" className="block py-2 text-foreground/80 hover:text-primary transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Testimonials
            </a>
            <Link to="/login" className="block py-2 text-primary hover:text-primary/80 transition-colors" onClick={() => setMobileMenuOpen(false)}>
              Login
            </Link>
            <Link to="/join" className="block pt-2" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full flex items-center justify-center gap-2 border-primary text-primary hover:bg-primary/10">
                <LogIn size={18} />
                Join Game
              </Button>
            </Link>
            <Link to="/register" className="block pt-2" onClick={() => setMobileMenuOpen(false)}>
              <Button className="btn-trivia w-full">Get Started</Button>
            </Link>
          </div>}
      </header>
      
      {/* Hero Section */}
      <section className="flex-1 flex flex-col items-center justify-center py-12 md:py-24 lg:py-32 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
            Host <span className="text-primary">Engaging Trivia</span> for Your Venue
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8">
            Transform your bar, restaurant, or waiting area with interactive trivia games that keep your customers entertained and coming back.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/register">
              <Button className="btn-trivia text-lg py-6 px-8">Start Hosting Trivia</Button>
            </Link>
            <Link to="/join">
              <Button variant="outline" className="text-lg py-6 px-8 border-primary text-primary hover:bg-primary/10 flex items-center gap-2">
                <LogIn size={24} />
                Join a Game
              </Button>
            </Link>
          </div>
          
          <div className="mt-8 p-1 bg-gradient-to-r from-trivia-primary via-trivia-accent to-trivia-orange rounded-xl">
            <div className="card-trivia p-0 overflow-hidden rounded-lg">
              <img src="https://images.unsplash.com/photo-1516478177764-9fe5bd7e9717?ixlib=rb-4.0.3&auto=format&fit=crop&w=1050&q=80" alt="Trivia night at a bar" className="w-full h-auto max-h-[400px] object-cover object-center" />
            </div>
          </div>
        </div>
      </section>
      
      {/* Features */}
      <section id="features" className="py-16 bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Why TrivTap?</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="card-trivia p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <Smartphone size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Mobile-First Experience</h3>
              <p className="text-muted-foreground">Players join instantly on their phones with a simple OTP code. No downloads or sign-ups required.</p>
            </div>
            
            {/* Feature 2 */}
            <div className="card-trivia p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <Clock size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Speed-Based Scoring</h3>
              <p className="text-muted-foreground">The faster players answer, the more points they earn, creating an exciting competitive atmosphere.</p>
            </div>
            
            {/* Feature 3 */}
            <div className="card-trivia p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <Zap size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Low-Maintenance</h3>
              <p className="text-muted-foreground">Questions loop automatically, so hosts can set it and forget it. Perfect for busy venues.</p>
            </div>
            
            {/* Feature 4 */}
            <div className="card-trivia p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <Users size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Drop-in, Drop-out</h3>
              <p className="text-muted-foreground">Players can join or leave at any time, making it perfect for venues with changing crowds.</p>
            </div>
            
            {/* Feature 5 */}
            <div className="card-trivia p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <Award size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Leaderboards</h3>
              <p className="text-muted-foreground">Automatic leaderboards every 10 questions keep the competition exciting and encourage longer stays.</p>
            </div>
            
            {/* Feature 6 */}
            <div className="card-trivia p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20 text-primary mb-4">
                <Github size={24} />
              </div>
              <h3 className="text-xl font-bold mb-2">Customizable</h3>
              <p className="text-muted-foreground">Create custom question buckets, adjust timing, and add intermission slides to match your venue's style.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section id="how-it-works" className="py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">How It Works</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4">1</div>
              <h3 className="text-xl font-bold mb-2">Set Up Your Display</h3>
              <p className="text-muted-foreground">Launch the display screen on a TV or projector in your venue. It will show your trivia questions and an OTP code.</p>
            </div>
            
            {/* Step 2 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4">2</div>
              <h3 className="text-xl font-bold mb-2">Players Join</h3>
              <p className="text-muted-foreground">Players scan a QR code or visit the site and enter the displayed OTP to join the game on their phones.</p>
            </div>
            
            {/* Step 3 */}
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center text-2xl font-bold mb-4">3</div>
              <h3 className="text-xl font-bold mb-2">Play and Win</h3>
              <p className="text-muted-foreground">Questions display automatically with countdowns. Players answer quickly to score more points and climb the leaderboard.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Boost Engagement?</h2>
          <p className="text-xl text-white/80 mb-8 max-w-2xl mx-auto">Join thousands of venues using TrivTap to create memorable experiences for their customers.</p>
          <Link to="/register">
            <Button className="bg-white text-primary hover:bg-white/90 text-lg py-6 px-8">
              Start Free Trial
            </Button>
          </Link>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <span className="text-xl font-bold text-primary">TrivTap</span>
            </div>
            <div className="flex space-x-6">
              <Link to="#" className="text-muted-foreground hover:text-primary">Privacy Policy</Link>
              <Link to="#" className="text-muted-foreground hover:text-primary">Terms of Service</Link>
              <Link to="#" className="text-muted-foreground hover:text-primary">Contact Us</Link>
            </div>
          </div>
          <div className="mt-8 text-center text-muted-foreground">
            &copy; {new Date().getFullYear()} TriviaPulse. All rights reserved.
          </div>
        </div>
      </footer>
    </div>;
};
export default LandingPage;