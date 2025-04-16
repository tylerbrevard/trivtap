
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

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

const Displays = () => {
  const { toast } = useToast();
  const [displays, setDisplays] = useState(() => {
    // Try to load displays from localStorage first
    const savedDisplays = localStorage.getItem('trivia-displays');
    return savedDisplays ? JSON.parse(savedDisplays) : initialDisplays;
  });
  
  const [buckets, setBuckets] = useState<{ id: string; name: string; questionCount: number; isDefault?: boolean }[]>([]);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [newDisplayBucket, setNewDisplayBucket] = useState('default');
  const [changeBucketDialogOpen, setChangeBucketDialogOpen] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState('');
  
  // Save displays to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('trivia-displays', JSON.stringify(displays));
  }, [displays]);
  
  // Load buckets from localStorage
  useEffect(() => {
    const storedBuckets = localStorage.getItem('trivia-buckets');
    if (storedBuckets) {
      setBuckets(JSON.parse(storedBuckets));
    } else {
      // Initialize with default bucket
      const defaultBucket = { 
        id: 'default', 
        name: 'Default Bucket', 
        questionCount: 15,
        isDefault: true
      };
      setBuckets([defaultBucket]);
      localStorage.setItem('trivia-buckets', JSON.stringify([defaultBucket]));
    }
  }, []);
  
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
  
  // Handler for creating a new display
  const handleCreateDisplay = () => {
    if (!newDisplayName.trim()) {
      toast({
        title: "Error",
        description: "Display name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    // Get selected bucket
    const selectedBucket = buckets.find(b => b.id === newDisplayBucket);
    if (!selectedBucket) {
      toast({
        title: "Error",
        description: "Please select a valid question bucket.",
        variant: "destructive",
      });
      return;
    }
    
    // Create new display
    const newDisplay = {
      id: `display-${Date.now()}`,
      name: newDisplayName.trim(),
      status: 'inactive',
      totalQuestions: selectedBucket.questionCount,
      activePlayers: 0,
      lastActive: 'Never',
      isDefault: false,
      bucket: newDisplayBucket,
    };
    
    setDisplays([...displays, newDisplay]);
    setNewDisplayName('');
    
    toast({
      title: "Display Created",
      description: "New display screen has been created successfully.",
    });
  };
  
  // Handler for opening change bucket dialog
  const handleOpenChangeBucketDialog = (display: any) => {
    if (display.isDefault) {
      toast({
        title: "Cannot Change Default Display Bucket",
        description: "The default display's bucket cannot be changed as it uses the default bucket.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedDisplay(display);
    setChangeBucketDialogOpen(true);
  };
  
  // Handler for changing display bucket
  const handleChangeBucket = (bucketId: string) => {
    if (!selectedDisplay) return;
    
    // Update the display's bucket
    const updatedDisplays = displays.map(display => {
      if (display.id === selectedDisplay.id) {
        const selectedBucket = buckets.find(b => b.id === bucketId);
        return {
          ...display,
          bucket: bucketId,
          totalQuestions: selectedBucket ? selectedBucket.questionCount : 0
        };
      }
      return display;
    });
    
    setDisplays(updatedDisplays);
    setChangeBucketDialogOpen(false);
    setSelectedDisplay(null);
    
    toast({
      title: "Bucket Changed",
      description: "The display's question bucket has been updated.",
    });
  };
  
  // Handler for opening edit display dialog
  const handleOpenEditDialog = (display: any) => {
    if (display.isDefault) {
      toast({
        title: "Cannot Edit Default Display",
        description: "The default display cannot be modified.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedDisplay(display);
    setEditDisplayName(display.name);
    setEditDialogOpen(true);
  };
  
  // Handler for saving display edits
  const handleSaveDisplayEdit = () => {
    if (!selectedDisplay) return;
    
    if (!editDisplayName.trim()) {
      toast({
        title: "Error",
        description: "Display name cannot be empty.",
        variant: "destructive",
      });
      return;
    }
    
    // Update the display's name
    const updatedDisplays = displays.map(display => {
      if (display.id === selectedDisplay.id) {
        return {
          ...display,
          name: editDisplayName.trim()
        };
      }
      return display;
    });
    
    setDisplays(updatedDisplays);
    setEditDialogOpen(false);
    setSelectedDisplay(null);
    
    toast({
      title: "Display Updated",
      description: "The display name has been updated.",
    });
  };
  
  // Handler for toggling display status
  const handleToggleDisplayStatus = (displayId: string, currentStatus: string) => {
    // Update the display's status
    const updatedDisplays = displays.map(display => {
      if (display.id === displayId) {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        return {
          ...display,
          status: newStatus,
          lastActive: newStatus === 'active' ? 'Now' : display.lastActive
        };
      }
      return display;
    });
    
    setDisplays(updatedDisplays);
    
    toast({
      title: "Display Status Updated",
      description: `The display is now ${currentStatus === 'active' ? 'inactive' : 'active'}.`,
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
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded">Default</span>
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
                    <DropdownMenuItem onClick={() => handleOpenEditDialog(display)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleOpenChangeBucketDialog(display)}>
                      <FolderOpen className="mr-2 h-4 w-4" />
                      Change Bucket
                    </DropdownMenuItem>
                    {display.status === 'active' ? (
                      <DropdownMenuItem onClick={() => handleToggleDisplayStatus(display.id, 'active')}>
                        <Pause className="mr-2 h-4 w-4" />
                        Pause Display
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => handleToggleDisplayStatus(display.id, 'inactive')}>
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
            <Input 
              placeholder="e.g., Main Bar TV, Back Room, etc." 
              value={newDisplayName}
              onChange={(e) => setNewDisplayName(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Question Bucket</label>
            <Select 
              defaultValue="default"
              value={newDisplayBucket}
              onValueChange={setNewDisplayBucket}
            >
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
          <Button className="w-full btn-trivia" onClick={handleCreateDisplay}>Create Display</Button>
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
      
      {/* Change Bucket Dialog */}
      <Dialog open={changeBucketDialogOpen} onOpenChange={setChangeBucketDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Question Bucket</DialogTitle>
            <DialogDescription>
              Select a different bucket of questions for this display
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display: {selectedDisplay?.name}</label>
              <Select 
                defaultValue={selectedDisplay?.bucket}
                onValueChange={handleChangeBucket}
              >
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
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangeBucketDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleChangeBucket(selectedDisplay?.bucket)}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Display Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Display</DialogTitle>
            <DialogDescription>
              Update the name of this display
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Display Name</label>
              <Input 
                value={editDisplayName}
                onChange={(e) => setEditDisplayName(e.target.value)}
                placeholder="Enter display name"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDisplayEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Displays;
