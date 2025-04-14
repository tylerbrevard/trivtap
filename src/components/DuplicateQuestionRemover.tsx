
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { 
  Trash2, 
  AlertTriangle, 
  Check, 
  RefreshCw, 
  Search, 
  Info 
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  getStaticQuestions, 
  StaticQuestion, 
  getCurrentUserId,
  removeQuestionFromCollection
} from "@/utils/staticQuestions";

interface DuplicateGroup {
  original: StaticQuestion;
  duplicates: StaticQuestion[];
}

const DuplicateQuestionRemover: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [questions, setQuestions] = useState<StaticQuestion[]>([]);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [strictMode, setStrictMode] = useState(true);
  const [scanProgress, setScanProgress] = useState(0);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [deletedCount, setDeletedCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const currentUserId = await getCurrentUserId();
        setUserId(currentUserId);
        
        // Load all questions
        const allQuestions = await getStaticQuestions();
        setQuestions(allQuestions);
      } catch (error) {
        console.error('Error loading questions:', error);
        toast({
          title: "Error",
          description: "Failed to load questions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [toast, deletedCount]);

  // Function to normalize text for comparison
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  };

  // Function to check if two questions are duplicates
  const isDuplicate = (q1: StaticQuestion, q2: StaticQuestion): boolean => {
    if (q1.id === q2.id) return false; // Same question, not a duplicate
    
    // For strict mode, compare the normalized text
    if (strictMode) {
      return normalizeText(q1.text) === normalizeText(q2.text);
    } 
    
    // For non-strict mode, use similarity detection
    const text1 = normalizeText(q1.text);
    const text2 = normalizeText(q2.text);
    
    // Simple similarity - if one text contains more than 80% of the other
    const minLength = Math.min(text1.length, text2.length);
    const maxLength = Math.max(text1.length, text2.length);
    
    // If length difference is too big, not similar enough
    if (minLength / maxLength < 0.7) return false;
    
    // Check character by character similarity (simple approach)
    let matches = 0;
    const longerText = text1.length > text2.length ? text1 : text2;
    const shorterText = text1.length > text2.length ? text2 : text1;
    
    for (let i = 0; i < shorterText.length; i++) {
      if (shorterText[i] === longerText[i]) matches++;
    }
    
    return matches / shorterText.length > 0.8;
  };

  // Function to find duplicate questions
  const findDuplicates = async () => {
    try {
      setScanning(true);
      setScanProgress(0);
      setDuplicateGroups([]);
      
      const groups: DuplicateGroup[] = [];
      const processed = new Set<string>();
      
      for (let i = 0; i < questions.length; i++) {
        // Update progress
        setScanProgress(Math.floor((i / questions.length) * 100));
        
        const q1 = questions[i];
        
        // Skip if already processed as a duplicate
        if (processed.has(q1.id)) continue;
        
        const duplicates: StaticQuestion[] = [];
        
        for (let j = 0; j < questions.length; j++) {
          if (i === j) continue; // Skip same question
          
          const q2 = questions[j];
          
          // Skip if already processed
          if (processed.has(q2.id)) continue;
          
          if (isDuplicate(q1, q2)) {
            duplicates.push(q2);
            processed.add(q2.id);
          }
        }
        
        if (duplicates.length > 0) {
          groups.push({ original: q1, duplicates });
        }
      }
      
      setDuplicateGroups(groups);
      
      // Notify the user about the results
      toast({
        title: "Scan Complete",
        description: `Found ${groups.length} groups of duplicate questions with a total of ${groups.reduce((acc, group) => acc + group.duplicates.length, 0)} duplicates.`,
        variant: "default",
      });
      
      setScanProgress(100);
    } catch (error) {
      console.error('Error scanning for duplicates:', error);
      toast({
        title: "Scan Failed",
        description: "An error occurred while scanning for duplicates",
        variant: "destructive",
      });
    } finally {
      setScanning(false);
    }
  };

  // Function to remove a single duplicate
  const removeDuplicate = async (questionId: string, groupIndex: number, duplicateIndex: number) => {
    try {
      await removeQuestionFromCollection(questionId);
      
      // Update the UI
      const updatedGroups = [...duplicateGroups];
      updatedGroups[groupIndex].duplicates.splice(duplicateIndex, 1);
      
      // If no more duplicates in this group, remove the group
      if (updatedGroups[groupIndex].duplicates.length === 0) {
        updatedGroups.splice(groupIndex, 1);
      }
      
      setDuplicateGroups(updatedGroups);
      setDeletedCount(prev => prev + 1);
      
      toast({
        title: "Question Removed",
        description: "Duplicate question successfully removed",
        variant: "default",
      });
    } catch (error) {
      console.error('Error removing duplicate:', error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove duplicate question",
        variant: "destructive",
      });
    }
  };

  // Function to remove all duplicates in a group
  const removeAllInGroup = async (groupIndex: number) => {
    try {
      const group = duplicateGroups[groupIndex];
      const duplicateIds = group.duplicates.map(d => d.id);
      
      // Remove all duplicates in this group
      for (const id of duplicateIds) {
        await removeQuestionFromCollection(id);
      }
      
      // Update the UI
      const updatedGroups = [...duplicateGroups];
      updatedGroups.splice(groupIndex, 1);
      setDuplicateGroups(updatedGroups);
      setDeletedCount(prev => prev + duplicateIds.length);
      
      toast({
        title: "Duplicates Removed",
        description: `Successfully removed ${duplicateIds.length} duplicate questions`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error removing duplicates:', error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove duplicate questions",
        variant: "destructive",
      });
    }
  };

  // Function to remove all duplicates across all groups
  const removeAllDuplicates = async () => {
    try {
      // Count total duplicates
      const totalDuplicates = duplicateGroups.reduce(
        (acc, group) => acc + group.duplicates.length, 0
      );
      
      if (totalDuplicates === 0) {
        toast({
          title: "No Duplicates",
          description: "No duplicate questions to remove",
          variant: "default",
        });
        return;
      }
      
      // Remove all duplicates
      for (const group of duplicateGroups) {
        for (const duplicate of group.duplicates) {
          await removeQuestionFromCollection(duplicate.id);
        }
      }
      
      // Update the UI
      setDuplicateGroups([]);
      setDeletedCount(prev => prev + totalDuplicates);
      
      toast({
        title: "All Duplicates Removed",
        description: `Successfully removed ${totalDuplicates} duplicate questions`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error removing all duplicates:', error);
      toast({
        title: "Removal Failed",
        description: "Failed to remove all duplicate questions",
        variant: "destructive",
      });
    }
  };

  // Filter duplicate groups based on search query
  const filteredDuplicateGroups = duplicateGroups.filter(group => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      group.original.text.toLowerCase().includes(query) ||
      group.original.category.toLowerCase().includes(query) ||
      group.duplicates.some(d => 
        d.text.toLowerCase().includes(query) ||
        d.category.toLowerCase().includes(query)
      )
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Duplicate Question Remover</CardTitle>
        <CardDescription>
          Find and remove duplicate questions from your collection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {loading ? (
          <div className="flex justify-center items-center h-24">
            <RefreshCw className="animate-spin h-6 w-6 text-primary" />
            <span className="ml-2">Loading questions...</span>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <div className="text-sm">
                  Total questions in collection: <span className="font-semibold">{questions.length}</span>
                </div>
                
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>About Duplicate Detection</AlertTitle>
                  <AlertDescription>
                    {strictMode 
                      ? "Using strict mode: Questions must match exactly (ignoring capitalization and punctuation)."
                      : "Using fuzzy mode: Questions with high similarity will be detected as duplicates."}
                  </AlertDescription>
                </Alert>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="strict-mode" 
                  checked={strictMode}
                  onCheckedChange={setStrictMode}
                />
                <Label htmlFor="strict-mode">
                  Strict Matching Mode (recommended)
                </Label>
              </div>
              
              <Button 
                onClick={findDuplicates} 
                disabled={scanning}
                className="w-full"
              >
                {scanning ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Scanning for duplicates...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Scan for Duplicate Questions
                  </>
                )}
              </Button>
              
              {scanning && (
                <div className="space-y-2">
                  <Progress value={scanProgress} className="w-full" />
                  <p className="text-xs text-center text-muted-foreground">
                    {scanProgress}% complete
                  </p>
                </div>
              )}

              {duplicateGroups.length > 0 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">
                      Found {duplicateGroups.length} groups with duplicates
                    </h3>
                    
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Search in duplicates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-64"
                      />
                      
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={removeAllDuplicates}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove All Duplicates
                      </Button>
                    </div>
                  </div>
                  
                  {filteredDuplicateGroups.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">
                      No matching duplicate groups found.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {filteredDuplicateGroups.map((group, groupIndex) => (
                        <div key={group.original.id} className="border rounded-md p-4 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">Original Question</h4>
                              <p className="mt-1">{group.original.text}</p>
                              <div className="flex space-x-2 mt-2">
                                <Badge variant="outline" className="bg-muted">
                                  {group.original.category}
                                </Badge>
                                <Badge variant="outline" className="bg-muted">
                                  {group.original.difficulty}
                                </Badge>
                              </div>
                            </div>
                            
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => removeAllInGroup(groupIndex)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove All
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="font-medium text-sm text-muted-foreground">
                              Duplicates ({group.duplicates.length})
                            </h4>
                            
                            {group.duplicates.map((duplicate, duplicateIndex) => (
                              <div 
                                key={duplicate.id} 
                                className="flex justify-between items-start p-3 border border-dashed rounded-md"
                              >
                                <div>
                                  <p>{duplicate.text}</p>
                                  <div className="flex space-x-2 mt-2">
                                    <Badge variant="outline" className="bg-muted/50">
                                      {duplicate.category}
                                    </Badge>
                                    <Badge variant="outline" className="bg-muted/50">
                                      {duplicate.difficulty}
                                    </Badge>
                                  </div>
                                </div>
                                
                                <Button 
                                  variant="destructive" 
                                  size="sm"
                                  onClick={() => removeDuplicate(duplicate.id, groupIndex, duplicateIndex)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DuplicateQuestionRemover;
