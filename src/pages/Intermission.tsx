
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Wifi, Image, FileText, Plus, Trash, Pencil, Check, X } from 'lucide-react';
import { gameSettings } from '@/utils/gameSettings';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

interface IntermissionSlide {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'image' | 'wifi' | 'html';
  isActive: boolean;
  wifiName?: string;
  wifiPassword?: string;
  imageUrl?: string;
}

const Intermission = () => {
  const [slides, setSlides] = useState<IntermissionSlide[]>([]);
  const [editingSlide, setEditingSlide] = useState<IntermissionSlide | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  
  useEffect(() => {
    // Load slides from localStorage
    const savedSlides = localStorage.getItem('intermissionSlides');
    if (savedSlides) {
      try {
        const parsedSlides = JSON.parse(savedSlides);
        setSlides(parsedSlides);
      } catch (e) {
        console.error('Error parsing intermission slides:', e);
        // Create default slides if parsing fails
        createDefaultSlides();
      }
    } else {
      // Create default slides if none exist
      createDefaultSlides();
    }
  }, []);
  
  const createDefaultSlides = () => {
    const defaultSlides: IntermissionSlide[] = [
      {
        id: 'default-slide-1',
        title: 'Intermission',
        content: 'Next question coming up soon...',
        type: 'text',
        isActive: true
      },
      {
        id: 'default-slide-2',
        title: 'WiFi Information',
        content: 'Connect to our WiFi',
        type: 'wifi',
        wifiName: 'Venue WiFi',
        wifiPassword: 'guest1234',
        isActive: true
      },
      {
        id: 'default-slide-3',
        title: 'Featured Image',
        content: 'Check out our sponsors',
        type: 'image',
        imageUrl: 'https://placehold.co/600x400?text=Sponsor+Image',
        isActive: true
      },
      {
        id: 'default-slide-4',
        title: 'Special Announcement',
        content: '<h3>Drink Specials</h3><p>All cocktails $2 off during happy hour!</p>',
        type: 'html',
        isActive: true
      }
    ];
    
    setSlides(defaultSlides);
    saveSlides(defaultSlides);
  };
  
  const saveSlides = (slidesToSave: IntermissionSlide[]) => {
    localStorage.setItem('intermissionSlides', JSON.stringify(slidesToSave));
    
    // Save current slide index to game state
    const gameState = localStorage.getItem('gameState');
    if (gameState) {
      try {
        const parsedState = JSON.parse(gameState);
        parsedState.slidesIndex = 0; // Reset to first slide when saving
        localStorage.setItem('gameState', JSON.stringify(parsedState));
      } catch (e) {
        console.error('Error updating game state for slides:', e);
      }
    }
  };
  
  const handleAddSlide = () => {
    const newSlide: IntermissionSlide = {
      id: `slide-${Date.now()}`,
      title: 'New Slide',
      content: 'Add your content here...',
      type: 'text',
      isActive: true
    };
    
    setEditingSlide(newSlide);
    setIsEditing(true);
  };
  
  const handleEditSlide = (slide: IntermissionSlide) => {
    setEditingSlide({ ...slide });
    setIsEditing(true);
  };
  
  const handleDeleteSlide = (id: string) => {
    const updatedSlides = slides.filter(slide => slide.id !== id);
    setSlides(updatedSlides);
    saveSlides(updatedSlides);
    
    toast({
      title: "Slide deleted",
      description: "The intermission slide has been removed.",
    });
  };
  
  const handleToggleActive = (id: string, isActive: boolean) => {
    const updatedSlides = slides.map(slide => 
      slide.id === id ? { ...slide, isActive } : slide
    );
    setSlides(updatedSlides);
    saveSlides(updatedSlides);
  };
  
  const handleSaveSlide = () => {
    if (!editingSlide) return;
    
    const existingSlideIndex = slides.findIndex(s => s.id === editingSlide.id);
    let updatedSlides;
    
    if (existingSlideIndex >= 0) {
      // Update existing slide
      updatedSlides = [...slides];
      updatedSlides[existingSlideIndex] = editingSlide;
    } else {
      // Add new slide
      updatedSlides = [...slides, editingSlide];
    }
    
    setSlides(updatedSlides);
    saveSlides(updatedSlides);
    setIsEditing(false);
    setEditingSlide(null);
    
    toast({
      title: existingSlideIndex >= 0 ? "Slide updated" : "Slide added",
      description: `The intermission slide has been ${existingSlideIndex >= 0 ? 'updated' : 'added'}.`,
    });
  };
  
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingSlide(null);
  };
  
  const renderSlideIcon = (type: string) => {
    switch (type) {
      case 'wifi': return <Wifi className="h-5 w-5 text-blue-500" />;
      case 'image': return <Image className="h-5 w-5 text-green-500" />;
      case 'html': return <FileText className="h-5 w-5 text-purple-500" />;
      default: return <FileText className="h-5 w-5 text-orange-500" />;
    }
  };
  
  const handleOnDragEnd = (result: any) => {
    if (!result.destination) return;
    
    const items = Array.from(slides);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setSlides(items);
    saveSlides(items);
  };
  
  const handleTestDisplay = () => {
    // Navigate to display screen for testing
    navigate('/display');
  };
  
  const renderEditForm = () => {
    if (!editingSlide) return null;
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{editingSlide.id.startsWith('slide-') ? 'Add New Slide' : 'Edit Slide'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="slide-title">Title</Label>
                <Input 
                  id="slide-title" 
                  value={editingSlide.title} 
                  onChange={(e) => setEditingSlide({...editingSlide, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slide-type">Type</Label>
                <Select 
                  value={editingSlide.type} 
                  onValueChange={(value: any) => setEditingSlide({...editingSlide, type: value})}
                >
                  <SelectTrigger id="slide-type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="wifi">WiFi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {editingSlide.type === 'wifi' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="wifi-name">WiFi Name</Label>
                  <Input 
                    id="wifi-name" 
                    value={editingSlide.wifiName || ''} 
                    onChange={(e) => setEditingSlide({...editingSlide, wifiName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wifi-password">WiFi Password</Label>
                  <Input 
                    id="wifi-password" 
                    value={editingSlide.wifiPassword || ''} 
                    onChange={(e) => setEditingSlide({...editingSlide, wifiPassword: e.target.value})}
                  />
                </div>
              </div>
            )}
            
            {editingSlide.type === 'image' && (
              <div className="space-y-2">
                <Label htmlFor="image-url">Image URL</Label>
                <Input 
                  id="image-url" 
                  value={editingSlide.imageUrl || ''} 
                  onChange={(e) => setEditingSlide({...editingSlide, imageUrl: e.target.value})}
                />
                {editingSlide.imageUrl && (
                  <div className="mt-2 p-2 border rounded">
                    <img 
                      src={editingSlide.imageUrl} 
                      alt="Preview" 
                      className="max-h-[200px] object-contain mx-auto"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.src = 'https://placehold.co/600x400?text=Image+URL+Error';
                      }}
                    />
                  </div>
                )}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="slide-content">Content</Label>
              <Textarea 
                id="slide-content" 
                value={editingSlide.content} 
                onChange={(e) => setEditingSlide({...editingSlide, content: e.target.value})}
                rows={editingSlide.type === 'html' ? 5 : 3}
                className={editingSlide.type === 'html' ? 'font-mono text-sm' : ''}
              />
              
              {editingSlide.type === 'html' && (
                <div className="mt-2">
                  <Label>HTML Preview</Label>
                  <div 
                    className="mt-1 p-4 border rounded bg-white prose max-w-none" 
                    dangerouslySetInnerHTML={{ __html: editingSlide.content }}
                  />
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={handleCancelEdit}>
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button onClick={handleSaveSlide}>
                <Check className="mr-2 h-4 w-4" />
                Save Slide
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Intermission Slides</h1>
        <div className="space-x-2">
          <Button variant="outline" onClick={handleTestDisplay}>
            Test on Display
          </Button>
          <Button onClick={handleAddSlide}>
            <Plus className="mr-2 h-4 w-4" />
            Add Slide
          </Button>
        </div>
      </div>
      
      <p className="text-muted-foreground">
        Create and manage slides that will be shown during the intermission period between questions.
        These slides will rotate on the display screen during gameplay.
      </p>
      
      {isEditing && renderEditForm()}
      
      {!isEditing && (
        <DragDropContext onDragEnd={handleOnDragEnd}>
          <Droppable droppableId="slides">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                {slides.length > 0 ? (
                  slides.map((slide, index) => (
                    <Draggable key={slide.id} draggableId={slide.id} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`border rounded-lg p-4 ${slide.isActive ? 'bg-card' : 'bg-muted/50 opacity-60'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {renderSlideIcon(slide.type)}
                              <span className="font-medium">{slide.title}</span>
                              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                                {slide.type.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <Switch 
                                  checked={slide.isActive}
                                  onCheckedChange={(checked) => handleToggleActive(slide.id, checked)}
                                  id={`active-${slide.id}`}
                                />
                                <Label htmlFor={`active-${slide.id}`} className="text-sm">
                                  {slide.isActive ? 'Active' : 'Inactive'}
                                </Label>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEditSlide(slide)}>
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteSlide(slide.id)}>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-2">
                            {slide.type === 'text' && (
                              <p className="text-sm text-muted-foreground">{slide.content}</p>
                            )}
                            
                            {slide.type === 'html' && (
                              <div className="text-sm text-muted-foreground overflow-hidden whitespace-nowrap text-ellipsis">
                                {slide.content.replace(/<[^>]*>/g, '')}
                              </div>
                            )}
                            
                            {slide.type === 'image' && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>Image URL:</span>
                                <span className="overflow-hidden whitespace-nowrap text-ellipsis">
                                  {slide.imageUrl}
                                </span>
                              </div>
                            )}
                            
                            {slide.type === 'wifi' && (
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>WiFi:</span>
                                <span>{slide.wifiName} / {slide.wifiPassword}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <div className="text-center py-12 border rounded-lg">
                    <p className="text-muted-foreground">
                      No intermission slides found. Click "Add Slide" to create your first slide.
                    </p>
                  </div>
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
      
      <div className="border-t pt-6">
        <h2 className="text-xl font-bold mb-2">Settings</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Intermission Duration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input 
                  type="number" 
                  min="5"
                  max="300"
                  value={gameSettings.intermissionDuration}
                  onChange={(e) => {
                    const newSettings = { 
                      ...gameSettings, 
                      intermissionDuration: Math.max(5, Math.min(300, parseInt(e.target.value) || 30)) 
                    };
                    localStorage.setItem('gameSettings', JSON.stringify(newSettings));
                    // Force a refresh of the global settings
                    window.dispatchEvent(new Event('gameSettingsChanged'));
                  }}
                  className="w-24"
                />
                <span>seconds</span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Slide Rotation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Input 
                  type="number"
                  min="3"
                  max="30" 
                  value={gameSettings.slideRotationTime || 10}
                  onChange={(e) => {
                    const newSettings = { 
                      ...gameSettings, 
                      slideRotationTime: Math.max(3, Math.min(30, parseInt(e.target.value) || 10)) 
                    };
                    localStorage.setItem('gameSettings', JSON.stringify(newSettings));
                    // Force a refresh of the global settings
                    window.dispatchEvent(new Event('gameSettingsChanged'));
                  }}
                  className="w-24"
                />
                <span>seconds per slide</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Intermission;
