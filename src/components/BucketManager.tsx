
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, Trash, Save, X } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from 'lucide-react';

// Interface for bucket data
interface Bucket {
  id: string;
  name: string;
  description?: string;
  questionCount: number;
  isDefault?: boolean;
}

const BucketManager = () => {
  const { toast } = useToast();
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketDescription, setNewBucketDescription] = useState('');
  const [editingBucketId, setEditingBucketId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  
  // Load buckets from localStorage or initialize with default
  useEffect(() => {
    const storedBuckets = localStorage.getItem('trivia-buckets');
    if (storedBuckets) {
      setBuckets(JSON.parse(storedBuckets));
    } else {
      // Initialize with default bucket
      const defaultBucket: Bucket = {
        id: 'default',
        name: 'Default Bucket',
        description: 'Default questions available to all customers',
        questionCount: 15, // Use the count from your static questions
        isDefault: true
      };
      setBuckets([defaultBucket]);
      localStorage.setItem('trivia-buckets', JSON.stringify([defaultBucket]));
    }
  }, []);
  
  // Save buckets to localStorage whenever they change
  useEffect(() => {
    if (buckets.length > 0) {
      localStorage.setItem('trivia-buckets', JSON.stringify(buckets));
    }
  }, [buckets]);
  
  const handleAddBucket = () => {
    if (!newBucketName.trim()) {
      toast({
        title: "Error",
        description: "Bucket name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    const newBucket: Bucket = {
      id: `bucket_${Date.now()}`,
      name: newBucketName.trim(),
      description: newBucketDescription.trim(),
      questionCount: 0
    };
    
    setBuckets([...buckets, newBucket]);
    setNewBucketName('');
    setNewBucketDescription('');
    
    toast({
      title: "Bucket Created",
      description: `New bucket "${newBucketName}" has been created.`,
    });
  };
  
  const handleDeleteBucket = (bucketId: string, isDefault: boolean | undefined) => {
    if (isDefault) {
      toast({
        title: "Cannot Delete Default Bucket",
        description: "The default bucket cannot be deleted as it's shared with all customers.",
        variant: "destructive",
      });
      return;
    }
    
    const updatedBuckets = buckets.filter(bucket => bucket.id !== bucketId);
    setBuckets(updatedBuckets);
    
    // Also update display references to this bucket
    const displaysStr = localStorage.getItem('trivia-displays');
    if (displaysStr) {
      const displays = JSON.parse(displaysStr);
      const updatedDisplays = displays.map((display: any) => {
        if (display.bucket === bucketId) {
          return { ...display, bucket: 'default' };
        }
        return display;
      });
      localStorage.setItem('trivia-displays', JSON.stringify(updatedDisplays));
    }
    
    toast({
      title: "Bucket Deleted",
      description: "The bucket has been removed. Any displays using this bucket have been reset to the default bucket.",
    });
  };
  
  const startEditBucket = (bucket: Bucket) => {
    if (bucket.isDefault) {
      toast({
        title: "Cannot Edit Default Bucket",
        description: "The default bucket cannot be modified as it's shared with all customers.",
        variant: "destructive",
      });
      return;
    }
    
    setEditingBucketId(bucket.id);
    setEditName(bucket.name);
    setEditDescription(bucket.description || '');
  };
  
  const saveEditBucket = (bucketId: string) => {
    if (!editName.trim()) {
      toast({
        title: "Error",
        description: "Bucket name cannot be empty",
        variant: "destructive",
      });
      return;
    }
    
    const updatedBuckets = buckets.map(bucket => {
      if (bucket.id === bucketId) {
        return {
          ...bucket,
          name: editName.trim(),
          description: editDescription.trim()
        };
      }
      return bucket;
    });
    
    setBuckets(updatedBuckets);
    setEditingBucketId(null);
    
    toast({
      title: "Bucket Updated",
      description: "The bucket details have been updated.",
    });
  };
  
  const cancelEditBucket = () => {
    setEditingBucketId(null);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Question Buckets</h2>
      </div>
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Question buckets allow you to organize questions for different trivia events. 
          The Default Bucket contains system-provided questions available to all customers.
        </AlertDescription>
      </Alert>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {buckets.map(bucket => (
          <Card key={bucket.id}>
            <CardHeader className="pb-2">
              {editingBucketId === bucket.id ? (
                <Input 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Bucket name"
                  className="font-semibold"
                />
              ) : (
                <CardTitle className="flex items-center justify-between">
                  <span>{bucket.name}</span>
                  {bucket.isDefault && (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-full">
                      Default
                    </span>
                  )}
                </CardTitle>
              )}
              
              {editingBucketId === bucket.id ? (
                <Textarea 
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Description (optional)"
                  className="text-sm text-muted-foreground mt-2"
                  rows={2}
                />
              ) : (
                <CardDescription>
                  {bucket.description || "No description provided"}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent>
              <div className="text-sm">
                <span className="font-medium">{bucket.questionCount}</span> questions
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              {editingBucketId === bucket.id ? (
                <div className="flex space-x-2 w-full">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={cancelEditBucket}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button 
                    className="flex-1"
                    onClick={() => saveEditBucket(bucket.id)}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </Button>
                </div>
              ) : (
                <>
                  <Button 
                    variant="outline"
                    onClick={() => startEditBucket(bucket)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button 
                    variant="destructive"
                    onClick={() => handleDeleteBucket(bucket.id, bucket.isDefault)}
                    disabled={bucket.isDefault}
                  >
                    <Trash className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        ))}
        
        {/* New Bucket Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Bucket</CardTitle>
            <CardDescription>
              Add a new collection of questions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Bucket Name"
              value={newBucketName}
              onChange={(e) => setNewBucketName(e.target.value)}
            />
            <Textarea
              placeholder="Description (optional)"
              value={newBucketDescription}
              onChange={(e) => setNewBucketDescription(e.target.value)}
              rows={3}
            />
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleAddBucket} 
              className="w-full"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Bucket
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default BucketManager;
