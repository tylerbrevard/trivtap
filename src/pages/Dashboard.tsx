
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  Users, 
  PlayCircle, 
  Clock, 
  ArrowRight,
  ArrowUpRight,
  Tv,
  Brain,
  Trophy,
  Timer
} from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { Link } from 'react-router-dom';

// Mock data
const statsData = {
  totalPlayers: 1284,
  questionsAsked: 4682,
  avgPlayTime: "24 min",
  displayScreens: 3,
};

const recentGames = [
  { id: "1", date: "Apr 9, 2025", players: 42, duration: "1h 15m", questions: 32 },
  { id: "2", date: "Apr 8, 2025", players: 38, duration: "1h 05m", questions: 28 },
  { id: "3", date: "Apr 7, 2025", players: 45, duration: "1h 30m", questions: 36 },
];

const topPlayers = [
  { id: "1", name: "Sarah", games: 12, totalScore: 4250 },
  { id: "2", name: "Mike", games: 8, totalScore: 3890 },
  { id: "3", name: "Jessica", games: 10, totalScore: 3720 },
  { id: "4", name: "David", games: 9, totalScore: 3480 },
];

const Dashboard = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Button className="btn-trivia">
          <PlayCircle className="mr-2 h-4 w-4" />
          Launch New Game
        </Button>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Players</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="mr-2 h-4 w-4 text-primary" />
              <div className="text-2xl font-bold">{statsData.totalPlayers.toLocaleString()}</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">+14% from last month</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Questions Asked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Brain className="mr-2 h-4 w-4 text-primary" />
              <div className="text-2xl font-bold">{statsData.questionsAsked.toLocaleString()}</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Across all games</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Play Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Timer className="mr-2 h-4 w-4 text-primary" />
              <div className="text-2xl font-bold">{statsData.avgPlayTime}</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Per player session</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Display Screens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Tv className="mr-2 h-4 w-4 text-primary" />
              <div className="text-2xl font-bold">{statsData.displayScreens}</div>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Active trivia displays</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Games */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Games</CardTitle>
            <Button variant="ghost" size="sm" className="text-primary">
              View All <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
          <CardDescription>Overview of your latest trivia sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentGames.map((game) => (
              <div key={game.id} className="flex items-center border-b border-border pb-4 last:border-0 last:pb-0">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary mr-4">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium">Game #{game.id}</h3>
                    <span className="text-sm text-muted-foreground">{game.date}</span>
                  </div>
                  <div className="flex text-sm text-muted-foreground gap-4">
                    <div className="flex items-center">
                      <Users className="h-3.5 w-3.5 mr-1" />
                      {game.players} players
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3.5 w-3.5 mr-1" />
                      {game.duration}
                    </div>
                    <div className="flex items-center">
                      <Brain className="h-3.5 w-3.5 mr-1" />
                      {game.questions} questions
                    </div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="ml-4">
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Top Players & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Players */}
        <Card>
          <CardHeader>
            <CardTitle>Top Players</CardTitle>
            <CardDescription>Your highest scoring participants</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPlayers.map((player, index) => (
                <div key={player.id} className="flex items-center">
                  <div className="w-6 text-muted-foreground font-medium">{index + 1}</div>
                  <div className="flex-1">
                    <div className="font-medium">{player.name}</div>
                    <div className="text-sm text-muted-foreground">{player.games} games played</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold">{player.totalScore.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total points</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for managing your trivia games</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <Link to="/admin/questions">
              <Button variant="outline" className="w-full justify-start">
                <Brain className="mr-2 h-4 w-4" />
                Manage Question Library
              </Button>
            </Link>
            <Link to="/admin/displays">
              <Button variant="outline" className="w-full justify-start">
                <Tv className="mr-2 h-4 w-4" />
                Configure Display Screens
              </Button>
            </Link>
            <Link to="/admin/intermission">
              <Button variant="outline" className="w-full justify-start">
                <Clock className="mr-2 h-4 w-4" />
                Edit Intermission Slides
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline" className="w-full justify-start">
                <Trophy className="mr-2 h-4 w-4" />
                Adjust Game Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
