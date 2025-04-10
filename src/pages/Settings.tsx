
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Save, 
  Clock, 
  BatteryFull, 
  ScrollText, 
  Shuffle,
  ListChecks,
  Info
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/components/ui/use-toast";
import { gameSettings, updateGameSetting } from '@/utils/gameSettings';

const Settings = () => {
  const [settings, setSettings] = useState({ ...gameSettings });
  const { toast } = useToast();

  // Load settings on component mount
  useEffect(() => {
    setSettings({ ...gameSettings });
  }, []);

  const handleSettingChange = (key: keyof typeof gameSettings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = () => {
    // Update all settings
    Object.keys(settings).forEach(key => {
      updateGameSetting(key as keyof typeof gameSettings, settings[key as keyof typeof gameSettings]);
    });

    toast({
      title: "Settings Saved",
      description: "Your game settings have been updated successfully.",
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button className="btn-trivia" onClick={handleSaveChanges}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Timing Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-primary" />
              Game Timing
            </CardTitle>
            <CardDescription>Control the pace of your trivia games</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Question Duration</Label>
                  <span className="text-primary font-medium">{settings.questionDuration} seconds</span>
                </div>
                <Slider 
                  value={[settings.questionDuration]} 
                  min={5} 
                  max={60} 
                  step={1} 
                  onValueChange={(val) => handleSettingChange('questionDuration', val[0])}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  How long players have to answer each question
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Answer Reveal Duration</Label>
                  <span className="text-primary font-medium">{settings.answerRevealDuration} seconds</span>
                </div>
                <Slider 
                  value={[settings.answerRevealDuration]} 
                  min={2} 
                  max={15} 
                  step={1} 
                  onValueChange={(val) => handleSettingChange('answerRevealDuration', val[0])}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  How long to show the correct answer before moving to the next question
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Intermission Frequency</Label>
                  <span className="text-primary font-medium">Every {settings.intermissionFrequency} questions</span>
                </div>
                <Slider 
                  value={[settings.intermissionFrequency]} 
                  min={1} 
                  max={20} 
                  step={1} 
                  onValueChange={(val) => handleSettingChange('intermissionFrequency', val[0])}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  How often to show intermission slides
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Intermission Duration</Label>
                  <span className="text-primary font-medium">{settings.intermissionDuration} seconds</span>
                </div>
                <Slider 
                  value={[settings.intermissionDuration]} 
                  min={3} 
                  max={30} 
                  step={1} 
                  onValueChange={(val) => handleSettingChange('intermissionDuration', val[0])}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  How long to show intermission slides
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Leaderboard Display Duration</Label>
                  <span className="text-primary font-medium">10 seconds</span>
                </div>
                <Slider defaultValue={[10]} min={5} max={30} step={1} />
                <p className="text-sm text-muted-foreground mt-1">
                  How long to show the leaderboard between question sets
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Scoring Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BatteryFull className="mr-2 h-5 w-5 text-primary" />
              Scoring
            </CardTitle>
            <CardDescription>Configure how points are awarded</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Base Points</Label>
                  <span className="text-primary font-medium">100 points</span>
                </div>
                <Slider defaultValue={[100]} min={50} max={500} step={10} />
                <p className="text-sm text-muted-foreground mt-1">
                  Base points awarded for a correct answer
                </p>
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Time Bonus Multiplier</Label>
                  <span className="text-primary font-medium">10 points/sec</span>
                </div>
                <Slider defaultValue={[10]} min={0} max={50} step={1} />
                <p className="text-sm text-muted-foreground mt-1">
                  Additional points per second remaining when answering correctly
                </p>
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="consecutive-bonus" className="flex flex-col space-y-1">
                  <span>Consecutive Bonus</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Award extra points for consecutive correct answers
                  </span>
                </Label>
                <Switch id="consecutive-bonus" defaultChecked />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Question Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ScrollText className="mr-2 h-5 w-5 text-primary" />
              Question Settings
            </CardTitle>
            <CardDescription>Configure question behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="randomize-options" className="flex flex-col space-y-1">
                  <span>Randomize Answer Options</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Shuffle the order of answer options for each question
                  </span>
                </Label>
                <Switch id="randomize-options" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="randomize-questions" className="flex flex-col space-y-1">
                  <span>Randomize Question Order</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Shuffle the order of questions in each bucket
                  </span>
                </Label>
                <Switch id="randomize-questions" defaultChecked />
              </div>
              
              <Separator />
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Questions Per Leaderboard</Label>
                  <span className="text-primary font-medium">10 questions</span>
                </div>
                <Slider defaultValue={[10]} min={5} max={25} step={1} />
                <p className="text-sm text-muted-foreground mt-1">
                  How many questions to show before displaying the leaderboard
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Display Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ListChecks className="mr-2 h-5 w-5 text-primary" />
              Display Settings
            </CardTitle>
            <CardDescription>Configure trivia display appearance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="show-player-count" className="flex flex-col space-y-1">
                  <span>Show Player Count</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Display the number of active players on the screen
                  </span>
                </Label>
                <Switch id="show-player-count" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="show-category" className="flex flex-col space-y-1">
                  <span>Show Question Category</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Display the category for each question
                  </span>
                </Label>
                <Switch id="show-category" defaultChecked />
              </div>
              
              <Separator />
              
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="auto-launch" className="flex flex-col space-y-1">
                  <span>Auto-Launch Default Display</span>
                  <span className="font-normal text-sm text-muted-foreground">
                    Automatically start the default display when accessing admin panel
                  </span>
                </Label>
                <Switch id="auto-launch" />
              </div>
              
              <Separator />
              
              <div>
                <Label>Venue Name</Label>
                <Input 
                  placeholder="Enter your venue or business name"
                  className="mt-1"
                  defaultValue="The Trivia Pub"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  This name will appear on display screens
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Info className="mr-2 h-5 w-5 text-primary" />
            Advanced Settings
          </CardTitle>
          <CardDescription>Additional configuration options</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="access-code">
              <AccordionTrigger>Game Access Code</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <p className="text-sm text-muted-foreground">
                  Customize the access code that players use to join your trivia games.
                </p>
                <div className="space-y-2">
                  <Label>Custom Game Code (Optional)</Label>
                  <Input 
                    placeholder="e.g., TRIVIA, QUIZ123 (leave blank for auto-generated)"
                    maxLength={8}
                  />
                  <p className="text-xs text-muted-foreground">
                    If left blank, a random code will be generated for each display.
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="player-names">
              <AccordionTrigger>Player Names</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="moderate-names" className="flex flex-col space-y-1">
                    <span>Moderate Player Names</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Filter inappropriate player names
                    </span>
                  </Label>
                  <Switch id="moderate-names" defaultChecked />
                </div>
                
                <div className="space-y-2">
                  <Label>Max Name Length</Label>
                  <Input 
                    type="number"
                    defaultValue={20}
                    min={3}
                    max={30}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="data-settings">
              <AccordionTrigger>Data Settings</AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2">
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="save-player-data" className="flex flex-col space-y-1">
                    <span>Save Player Statistics</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Track player performance across multiple games
                    </span>
                  </Label>
                  <Switch id="save-player-data" defaultChecked />
                </div>
                
                <div className="flex items-center justify-between space-x-2">
                  <Label htmlFor="export-data" className="flex flex-col space-y-1">
                    <span>Allow Data Export</span>
                    <span className="font-normal text-sm text-muted-foreground">
                      Enable exporting of question and player data
                    </span>
                  </Label>
                  <Switch id="export-data" defaultChecked />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
        <CardFooter>
          <Button className="w-full" onClick={handleSaveChanges}>Save Advanced Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Settings;
