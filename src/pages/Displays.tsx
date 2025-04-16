import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  PlusCircle, 
  Tv, 
  Link as LinkIcon, 
  Copy, 
  Play, 
  Pause, 
  FolderOpen,
  Edit,
  Trash,
  MoreVertical,
  BatteryFull,
  BookOpen,
  EyeOff,
  AlertCircle
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { gameSettings, updateGameSetting } from '@/utils/gameSettings';

// Mock display data
const initialDisplays = [
  {
    id: 'default',
    name: 'Main Display',
    status: 'active',
    totalQuestions: 248,
    activePlayers: 32,
    lastActive: 'Now',
    isDefault: true,
    bucket: 'default',
  },
  {
    id: 'display-2',
    name: 'Lounge Area',
    status: 'inactive',
    totalQuestions: 85,
    activePlayers: 0,
    lastActive: '2 days ago',
    isDefault: false,
    bucket: 'pub-night',
  },
  {
    id: 'display-3',
    name: 'Private Room',
    status: 'active',
    totalQuestions: 42,
    activePlayers: 8,
    lastActive: 'Now',
    isDefault: false,
    bucket: 'hard-round',
  },
];

// Mock bucket data
const buckets = [
  { id: "default", name: "Default Bucket", questionCount: 248 },
  { id: "pub-night", name: "Pub Night Specials", questionCount: 85 },
  { id: "easy-round", name: "Easy Questions", questionCount: 64 },
  { id: "hard-round", name: "Challenging Round", questionCount: 42 },
];

const Displays = () => {
  const { toast } = useToast();
  const [displays, setDisplays] = useState(() => {
    // Try to load displays from localStorage first
    const savedDisplays = localStorage.getItem('trivia-displays');
    return savedDisplays ? JSON.parse(savedDisplays) : initialDisplays;
  });
  
  // Save displays to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('trivia-displays', JSON.stringify(displays));
  }, [displays]);
  
  const handleCopyLink = (displayId: string) => {
    // In a real app, this would copy the actual URL
    const displayUrl = `${window.location.origin}/display/${displayId}`;
    navigator.clipboard.writeText(displayUrl);
    
    toast({
      title: "Link Copied",
      description: "Display URL copied to clipboard!",
    });
  };
  
  const handleLaunchDisplay = (displayId: string) => {
    // Create full URL using origin and path
    const displayUrl = `${window.location.origin}/display/${displayId}`;
    
    // Open the display in a new tab
    window.open(displayUrl, '_blank', 'noopener,noreferrer');
    
    console.log('Launching display at:', displayUrl);
    
    toast({
      title: "Display Launched",
      description: "The display has been opened in a new tab.",
    });
  };

  // Handler for updating intermission frequency
  const handleIntermissionFrequencyChange = (value: string) => {
    const frequency = parseInt(value, 10);
    if (!isNaN(frequency) && frequency > 0) {
      updateGameSetting('intermissionFrequency', frequency);
      toast({
        title: "Setting Updated",
        description: `Intermission will now appear after every ${frequency} questions.`,
      });
    }
  };

  // Handler for toggling auto progression
  const handleAutoProgressChange = (checked: boolean) => {
    updateGameSetting('autoProgress', checked);
    toast({
      title: "Setting Updated",
      description: checked 
        ? "Questions will now progress automatically." 
        : "Automatic progression turned off. Use manual controls.",
    });
  };
  
  // Handler for deleting a display
  const handleDeleteDisplay = (displayId: string, isDefault: boolean) => {
    if (isDefault) {
      toast({
        title: "Cannot Delete Default Display",
        description: "The default display cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    
    // Filter out the display with the given ID
    const updatedDisplays = displays.filter(display => display.id !== displayId);
    setDisplays(updatedDisplays);
    
    // Show toast notification
    toast({
      title: "Display Deleted",
      description: `The display has been removed.`,
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Display Screens</h1>
        <Button className="btn-trivia">
          <PlusCircle className="mr-2 h-4 w-4" />
          New Display
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displays.map((display) => (
          <Card key={display.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{display.name}</CardTitle>
                  <CardDescription>
                    ID: {display.id}
                    {display.isDefault && (
                      <div className="mt-1">
                        <Badge variant="outline">Default</Badge>
                      </div>
                    )}
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Change Bucket
                    </DropdownMenuItem>
                    {display.status === 'active' ? (
                      <DropdownMenuItem>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause Display
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem>
                        <Play className="mr-2 h-4 w-4" />
                        Activate Display
                      </DropdownMenuItem>
                    )}
                    {!display.isDefault && (
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={() => handleDeleteDisplay(display.id, display.isDefault)}
                      >
                        <Trash className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            
            <div className={`px-6 py-2 ${display.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${display.status === 'active' ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span className="capitalize">{display.status}</span>
                </div>
                <div>
                  <span className="text-sm">Last active: {display.lastActive}</span>
                </div>
              </div>
            </div>
            
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Active Players</span>
                  <div className="flex items-center">
                    <BatteryFull className="h-4 w-4 text-primary mr-2" />
                    <span className="font-bold">{display.activePlayers}</span>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Question Bucket</span>
                  <div className="flex items-center">
                    <BookOpen className="h-4 w-4 text-primary mr-2" />
                    <span className="font-bold">{buckets.find(b => b.id === display.bucket)?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-3 rounded-md flex items-center justify-between text-sm mb-4">
                <span className="text-muted-foreground truncate flex-1">
                  {window.location.origin}/display/{display.id}
                </span>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="ml-2 h-8 w-8" 
                  onClick={() => handleCopyLink(display.id)}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={() => handleCopyLink(display.id)}
              >
                <LinkIcon className="mr-2 h-4 w-4" />
                Copy Link
              </Button>
              <Button 
                className="flex-1"
                variant={display.status === 'active' ? 'default' : 'outline'}
                onClick={() => handleLaunchDisplay(display.id)}
              >
                <Tv className="mr-2 h-4 w-4" />
                Launch
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Create New Display</CardTitle>
          <CardDescription>Set up a new trivia display for your venue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Display Name</label>
            <Input placeholder="e.g., Main Bar TV, Back Room, etc." />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Question Bucket</label>
            <Select defaultValue="default">
              <SelectTrigger>
                <SelectValue placeholder="Select bucket" />
              </SelectTrigger>
              <SelectContent>
                {buckets.map((bucket) => (
                  <SelectItem key={bucket.id} value={bucket.id}>
                    {bucket.name} ({bucket.questionCount} questions)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              New displays will be automatically assigned a unique code for players to join.
            </AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter>
          <Button className="w-full btn-trivia">Create Display</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display Settings</CardTitle>
          <CardDescription>Configure how your trivia game behaves</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
              <span className="font-medium">Show Intermission After Every</span>
              <span className="text-sm text-muted-foreground">
                Display intermission slides periodically
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                defaultValue={gameSettings.intermissionFrequency.toString()} 
                min="1" 
                max="50" 
                className="w-20"
                onChange={(e) => handleIntermissionFrequencyChange(e.target.value)}
              />
              <span>questions</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <div className="flex flex-col space-y-1">
              <span className="font-medium">Auto Progress Questions</span>
              <span className="text-sm text-muted-foreground">
                Automatically move to the next question when timer ends
              </span>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                className="toggle"
                checked={gameSettings.autoProgress}
                onChange={(e) => handleAutoProgressChange(e.target.checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Displays;
