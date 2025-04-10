import React, { useEffect, useState } from 'react';
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
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Dashboard = () => {
  const [statsData, setStatsData] = useState({
    totalPlayers: 0,
    questionsAsked: 0,
    avgPlayTime: "0 min",
    displayScreens: 0,
  });
  const [recentGames, setRecentGames] = useState([]);
  const [topPlayers, setTopPlayers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch dashboard data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch total players
        const { data: playersData, error: playersError } = await supabase
          .from('players')
          .select('*');
        
        if (playersError) throw playersError;
        
        // Fetch player answers (questions asked)
        const { data: answersData, error: answersError } = await supabase
          .from('player_answers')
          .select('*');
        
        if (answersError) throw answersError;
        
        // Fetch active displays
        const { data: displaysData, error: displaysError } = await supabase
          .from('displays')
          .select('*')
          .eq('is_active', true);
        
        if (displaysError) throw displaysError;
        
        // Fetch recent games
        const { data: gamesData, error: gamesError } = await supabase
          .from('games')
          .select('*, displays(name)')
          .order('created_at', { ascending: false })
          .limit(3);
        
        if (gamesError) throw gamesError;
        
        // Process recent games data
        const formattedGames = gamesData.map(game => {
          const createdAt = new Date(game.created_at);
          const endedAt = game.ended_at ? new Date(game.ended_at) : new Date();
          const durationMs = endedAt.getTime() - createdAt.getTime();
          const durationMinutes = Math.floor(durationMs / 60000);
          const durationSeconds = Math.floor((durationMs % 60000) / 1000);
          
          return {
            id: game.id.substring(0, 8),
            date: new Date(game.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            }),
            players: Math.floor(Math.random() * 20) + 10, // TODO: Replace with actual player count when available
            duration: `${durationMinutes}h ${durationSeconds}m`,
            questions: Math.floor(Math.random() * 15) + 5, // TODO: Replace with actual question count when available
            displayName: game.displays?.name || 'Unknown Display'
          };
        });
        
        // Fetch top players
        const { data: topPlayersData, error: topPlayersError } = await supabase
          .from('players')
          .select('*')
          .order('score', { ascending: false })
          .limit(4);
        
        if (topPlayersError) throw topPlayersError;
        
        // Calculate average play time
        let avgTimeMinutes = 0;
        if (gamesData.length > 0) {
          const totalDurationMs = gamesData.reduce((acc, game) => {
            const createdAt = new Date(game.created_at);
            const endedAt = game.ended_at ? new Date(game.ended_at) : new Date();
            return acc + (endedAt.getTime() - createdAt.getTime());
          }, 0);
          
          avgTimeMinutes = Math.floor((totalDurationMs / gamesData.length) / 60000);
        }
        
        // Update state with real data
        setStatsData({
          totalPlayers: playersData.length,
          questionsAsked: answersData.length,
          avgPlayTime: `${avgTimeMinutes} min`,
          displayScreens: displaysData.length,
        });
        
        setRecentGames(formattedGames);
        setTopPlayers(topPlayersData.map(player => ({
          id: player.id,
          name: player.name,
          games: Math.floor(Math.random() * 10) + 1, // TODO: Replace with actual game count when available
          totalScore: player.score || 0
        })));
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error fetching data",
          description: "There was a problem loading the dashboard data.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time listener for player scores
    const channel = supabase
      .channel('dashboard-updates')
      .on('postgres_changes', 
        { event: 'UPDATE', schema: 'public', table: 'players' }, 
        payload => {
          // Update top players when scores change
          setTopPlayers(prevPlayers => {
            const updatedPlayer = payload.new;
            const playerExists = prevPlayers.some(p => p.id === updatedPlayer.id);
            
            if (playerExists) {
              // Update existing player
              return prevPlayers
                .map(p => p.id === updatedPlayer.id ? { ...p, totalScore: updatedPlayer.score || 0 } : p)
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 4);
            } else if (prevPlayers.length < 4 || updatedPlayer.score > prevPlayers[prevPlayers.length - 1].totalScore) {
              // Add new player if they qualify for top 4
              const newPlayers = [...prevPlayers, {
                id: updatedPlayer.id,
                name: updatedPlayer.name,
                games: Math.floor(Math.random() * 10) + 1, // TODO: Replace with actual game count
                totalScore: updatedPlayer.score || 0
              }];
              return newPlayers
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, 4);
            }
            
            return prevPlayers;
          });
        })
      .subscribe();
    
    // Cleanup function to remove the channel subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Dashboard</h1>
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
            <div className="mt-2 text-xs text-muted-foreground">From all games</div>
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
            <div className="mt-2 text-xs text-muted-foreground">Per game session</div>
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
            <Button variant="ghost" size="sm" className="text-primary" asChild>
              <Link to="/admin/games">
                View All <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <CardDescription>Overview of your latest trivia sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentGames.length > 0 ? (
              recentGames.map((game) => (
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
                  <Button variant="ghost" size="sm" className="ml-4" asChild>
                    <Link to={`/admin/games/${game.id}`}>
                      <ArrowUpRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                {isLoading ? "Loading recent games..." : "No recent games found."}
              </div>
            )}
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
              {topPlayers.length > 0 ? (
                topPlayers.map((player, index) => (
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
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  {isLoading ? "Loading top players..." : "No player data available."}
                </div>
              )}
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
