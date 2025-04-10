
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PlusCircle, Edit, Trash, Wifi, Image, Text, MoreVertical, EyeOff, Eye } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Mock slides data
const slides = [
  {
    id: '1',
    type: 'text',
    title: 'Welcome to Trivia Night!',
    content: 'Every Wednesday at 8pm. Prizes for top 3 winners!',
    isActive: true,
  },
  {
    id: '2',
    type: 'wifi',
    title: 'Connect to Our WiFi',
    wifiName: 'VenueGuest',
    wifiPassword: 'trivia2025',
    isActive: true,
  },
  {
    id: '3',
    type: 'image',
    title: 'Happy Hour Specials',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?ixlib=rb-4.0.3&auto=format&fit=crop&w=1050&q=80',
    isActive: false,
  },
  {
    id: '4',
    type: 'text',
    title: 'Upcoming Events',
    content: 'Live Music: Friday 9pm\nComedy Night: Saturday 8pm\nKaraoke: Sunday 7pm',
    isActive: true,
  },
];

const Intermission = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Intermission Slides</h1>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Slide
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Text className="mr-2 h-4 w-4" />
                Text Slide
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Wifi className="mr-2 h-4 w-4" />
                WiFi Info Slide
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Image className="mr-2 h-4 w-4" />
                Image Slide
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Manage Intermission Slides</CardTitle>
          <CardDescription>
            These slides will display between trivia questions or during breaks
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {slides.map((slide) => (
              <div key={slide.id} className="card-trivia p-4">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-2">
                    {slide.type === 'text' && <Text className="h-5 w-5 text-primary" />}
                    {slide.type === 'wifi' && <Wifi className="h-5 w-5 text-primary" />}
                    {slide.type === 'image' && <Image className="h-5 w-5 text-primary" />}
                    <h3 className="text-lg font-medium">{slide.title}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Switch id={`slide-${slide.id}`} checked={slide.isActive} />
                      <Label htmlFor={`slide-${slide.id}`} className="text-sm">
                        {slide.isActive ? 'Active' : 'Inactive'}
                      </Label>
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
                          {slide.isActive ? (
                            <>
                              <EyeOff className="mr-2 h-4 w-4" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <Eye className="mr-2 h-4 w-4" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                {slide.type === 'text' && (
                  <div className="bg-card p-3 rounded-md">
                    <p className="whitespace-pre-line">{slide.content}</p>
                  </div>
                )}
                
                {slide.type === 'wifi' && (
                  <div className="bg-card p-3 rounded-md">
                    <div className="flex gap-8">
                      <div>
                        <p className="text-sm text-muted-foreground">WiFi Name</p>
                        <p className="font-medium">{slide.wifiName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Password</p>
                        <p className="font-medium">{slide.wifiPassword}</p>
                      </div>
                    </div>
                  </div>
                )}
                
                {slide.type === 'image' && (
                  <div className="bg-card rounded-md overflow-hidden">
                    <img 
                      src={slide.imageUrl} 
                      alt={slide.title} 
                      className="w-full h-auto max-h-[200px] object-cover"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Intermission Settings</CardTitle>
          <CardDescription>Configure how and when intermission slides appear</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="show-intermission" className="flex flex-col space-y-1">
              <span>Show Intermission Slides</span>
              <span className="font-normal text-sm text-muted-foreground">
                Enable or disable all intermission slides
              </span>
            </Label>
            <Switch id="show-intermission" defaultChecked />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="every-questions" className="flex flex-col space-y-1">
              <span>Show After Every X Questions</span>
              <span className="font-normal text-sm text-muted-foreground">
                Display intermission slides periodically
              </span>
            </Label>
            <Input 
              id="every-questions" 
              type="number" 
              defaultValue="10" 
              min="1" 
              max="50" 
              className="w-20"
            />
          </div>
          
          <div className="flex items-center justify-between space-x-2">
            <Label htmlFor="slide-duration" className="flex flex-col space-y-1">
              <span>Slide Duration (seconds)</span>
              <span className="font-normal text-sm text-muted-foreground">
                How long each slide is displayed
              </span>
            </Label>
            <Input 
              id="slide-duration" 
              type="number" 
              defaultValue="15" 
              min="5" 
              max="60" 
              className="w-20"
            />
          </div>
          
          <Button className="w-full mt-4">Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Intermission;
