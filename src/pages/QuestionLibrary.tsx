import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  Library, 
  Package, 
  Tag, 
  List, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories } from '@/utils/importUtils';
import CategoryQuestions from '@/components/CategoryQuestions';
import BucketQuestions from '@/components/BucketQuestions';
import { 
  getStaticQuestions, 
  StaticQuestion, 
  getCurrentUserId, 
  removeQuestionFromCollection,
  baseStaticQuestions,
  getAllAvailableQuestions
} from '@/utils/staticQuestions';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import BucketManager from '@/components/BucketManager';
import AIQuestionGenerator from '@/components/AIQuestionGenerator';

const QuestionLibrary = () => {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [buckets, setBuckets] = useState<{ id: string; name: string; isDefault?: boolean }[]>([]);
  const [allQuestions, setAllQuestions] = useState<StaticQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<StaticQuestion | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>(undefined);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRestoreDefaultDialogOpen, setIsRestoreDefaultDialogOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all', 'user', 'default'
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formState, setFormState] = useState({
    id: '',
    text: '',
    category: categories.length > 0 ? categories[0].id : '',
    difficulty: 'medium',
    options: ['', '', '', ''],
    correctAnswerIndex: 0,
    buckets: [] as string[]
  });
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
        
        const storedBuckets = localStorage.getItem('trivia-buckets');
        if (storedBuckets) {
          setBuckets(JSON.parse(storedBuckets));
        } else {
          const defaultBucket = { id: 'default', name: 'Default Bucket', isDefault: true };
          setBuckets([defaultBucket]);
          localStorage.setItem('trivia-buckets', JSON.stringify([defaultBucket]));
        }
        
        const questions = await getStaticQuestions();
        setAllQuestions(questions);
        
        const userId = await getCurrentUserId();
        setCurrentUserId(userId);
        
        setIsAdmin(true);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading question library data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  const filteredQuestions = React.useMemo(() => {
    if (filter === 'all') {
      return allQuestions;
    } else if (filter === 'user') {
      return allQuestions.filter(q => !baseStaticQuestions.some(bq => bq.id === q.id));
    } else if (filter === 'default') {
      return allQuestions.filter(q => {
        return q.id.startsWith('imported_') || 
               q.id.startsWith('q') || 
               baseStaticQuestions.some(bq => bq.id === q.id);
      });
    }
    return allQuestions;
  }, [allQuestions, filter]);
  
  const isDefaultQuestion = (questionId: string) => {
    return baseStaticQuestions.some(q => q.id === questionId);
  };
  
  const resetFormState = () => {
    setFormState({
      id: '',
      text: '',
      category: categories.length > 0 ? categories[0].id : '',
      difficulty: 'medium',
      options: ['', '', '', ''],
      correctAnswerIndex: 0,
      buckets: ['default']
    });
  };
  
  const handleOpenAddDialog = () => {
    resetFormState();
    setAddDialogOpen(true);
  };
  
  const handleOpenEditDialog = (question: StaticQuestion) => {
    if (isDefaultQuestion(question.id)) {
      toast({
        title: "Cannot Edit Default Question",
        description: "Default questions cannot be modified as they're shared with all customers.",
        variant: "destructive",
      });
      return;
    }
    
    const correctAnswerIndex = question.options.findIndex(
      option => option === question.correctAnswer
    );
    
    setFormState({
      id: question.id,
      text: question.text,
      category: question.category,
      difficulty: question.difficulty,
      options: [...question.options],
      correctAnswerIndex: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
      buckets: []
    });
    
    setSelectedQuestion(question);
    setEditDialogOpen(true);
  };
  
  const handleOpenDeleteDialog = (question: StaticQuestion) => {
    if (isDefaultQuestion(question.id)) {
      toast({
        title: "Cannot Delete Default Question",
        description: "Default questions cannot be removed as they're shared with all customers.",
        variant: "destructive",
      });
      return;
    }
    
    setSelectedQuestion(question);
    setDeleteDialogOpen(true);
  };
  
  const handleAddQuestion = async () => {
    try {
      if (!formState.text.trim()) {
        toast({
          title: "Error",
          description: "Question text cannot be empty",
          variant: "destructive",
        });
        return;
      }
      
      if (formState.options.some(option => !option.trim())) {
        toast({
          title: "Error",
          description: "All options must be filled in",
          variant: "destructive",
        });
        return;
      }
      
      const newQuestion: StaticQuestion = {
        id: `user_${Date.now()}`,
        text: formState.text.trim(),
        category: formState.category,
        difficulty: formState.difficulty as 'easy' | 'medium' | 'hard',
        options: formState.options.map(opt => opt.trim()),
        correctAnswer: formState.options[formState.correctAnswerIndex].trim()
      };
      
      const existingDataString = localStorage.getItem('trivia_questions');
      let existingData: Record<string, any[]> = {};
      
      if (existingDataString) {
        existingData = JSON.parse(existingDataString);
      }
      
      const userId = currentUserId || 'default';
      if (!existingData[userId]) {
        existingData[userId] = [];
      }
      
      existingData[userId].push(newQuestion);
      
      localStorage.setItem('trivia_questions', JSON.stringify(existingData));
      
      setAllQuestions(prev => [...prev, newQuestion]);
      
      setAddDialogOpen(false);
      
      toast({
        title: "Question Added",
        description: "Your question has been added to the library.",
      });
    } catch (error) {
      console.error('Error adding question:', error);
      toast({
        title: "Error",
        description: "Failed to add the question. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleEditQuestion = async () => {
    try {
      if (!selectedQuestion) return;
      
      if (!formState.text.trim()) {
        toast({
          title: "Error",
          description: "Question text cannot be empty",
          variant: "destructive",
        });
        return;
      }
      
      if (formState.options.some(option => !option.trim())) {
        toast({
          title: "Error",
          description: "All options must be filled in",
          variant: "destructive",
        });
        return;
      }
      
      await removeQuestionFromCollection(selectedQuestion.id);
      
      const updatedQuestion: StaticQuestion = {
        id: selectedQuestion.id,
        text: formState.text.trim(),
        category: formState.category,
        difficulty: formState.difficulty as 'easy' | 'medium' | 'hard',
        options: formState.options.map(opt => opt.trim()),
        correctAnswer: formState.options[formState.correctAnswerIndex].trim()
      };
      
      const existingDataString = localStorage.getItem('trivia_questions');
      let existingData: Record<string, any[]> = {};
      
      if (existingDataString) {
        existingData = JSON.parse(existingDataString);
      }
      
      const userId = currentUserId || 'default';
      if (!existingData[userId]) {
        existingData[userId] = [];
      }
      
      existingData[userId].push(updatedQuestion);
      
      localStorage.setItem('trivia_questions', JSON.stringify(existingData));
      
      setAllQuestions(prev => 
        prev.map(q => q.id === selectedQuestion.id ? updatedQuestion : q)
      );
      
      setEditDialogOpen(false);
      setSelectedQuestion(null);
      
      toast({
        title: "Question Updated",
        description: "Your question has been updated.",
      });
    } catch (error) {
      console.error('Error updating question:', error);
      toast({
        title: "Error",
        description: "Failed to update the question. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleDeleteQuestion = async () => {
    try {
      if (!selectedQuestion) return;
      
      await removeQuestionFromCollection(selectedQuestion.id);
      
      setAllQuestions(prev => prev.filter(q => q.id !== selectedQuestion.id));
      
      setDeleteDialogOpen(false);
      setSelectedQuestion(null);
      
      toast({
        title: "Question Deleted",
        description: "The question has been removed from your library.",
      });
    } catch (error) {
      console.error('Error deleting question:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete the question. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleRestoreDefaultQuestions = () => {
    try {
      const existingDataString = localStorage.getItem('trivia_questions');
      let existingData: Record<string, any[]> = {};
      
      if (existingDataString) {
        existingData = JSON.parse(existingDataString);
      }
      
      existingData['default'] = [...baseStaticQuestions];
      
      localStorage.setItem('trivia_questions', JSON.stringify(existingData));
      
      const refreshQuestions = async () => {
        const questions = await getStaticQuestions();
        setAllQuestions(questions);
      };
      
      refreshQuestions();
      
      setIsRestoreDefaultDialogOpen(false);
      
      toast({
        title: "Default Questions Restored",
        description: "The default question set has been restored.",
      });
    } catch (error) {
      console.error('Error restoring default questions:', error);
      toast({
        title: "Error",
        description: "Failed to restore default questions. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleClearDefaultQuestions = () => {
    if (!isAdmin) return;
    
    try {
      const existingDataString = localStorage.getItem('trivia_questions');
      let existingData: Record<string, any[]> = {};
      
      if (existingDataString) {
        existingData = JSON.parse(existingDataString);
      }
      
      localStorage.setItem('original_default_questions', JSON.stringify(baseStaticQuestions));
      
      existingData['default'] = [];
      
      localStorage.setItem('trivia_questions', JSON.stringify(existingData));
      
      const refreshQuestions = async () => {
        const questions = await getStaticQuestions();
        setAllQuestions(questions);
      };
      
      refreshQuestions();
      
      toast({
        title: "Default Questions Cleared",
        description: "The default question set has been cleared. You can restore them later if needed.",
      });
    } catch (error) {
      console.error('Error clearing default questions:', error);
      toast({
        title: "Error",
        description: "Failed to clear default questions. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Question Library</h1>
        <div className="space-x-2">
          <Button onClick={handleOpenAddDialog} className="btn-trivia">
            <Plus className="mr-2 h-4 w-4" />
            Add Question
          </Button>
          
          {isAdmin && (
            <Button 
              variant="outline" 
              onClick={() => setIsRestoreDefaultDialogOpen(true)}
            >
              <Check className="mr-2 h-4 w-4" />
              Restore Default Questions
            </Button>
          )}
          
          {isAdmin && (
            <Button 
              variant="destructive" 
              onClick={handleClearDefaultQuestions}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Clear Default Questions
            </Button>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger 
            value="all" 
            className="flex items-center"
            onClick={() => setFilter('all')}
          >
            <List className="mr-2 h-4 w-4" />
            All Questions
          </TabsTrigger>
          <TabsTrigger 
            value="user" 
            className="flex items-center"
            onClick={() => setFilter('user')}
          >
            <List className="mr-2 h-4 w-4" />
            My Questions
          </TabsTrigger>
          <TabsTrigger 
            value="default" 
            className="flex items-center"
            onClick={() => setFilter('default')}
          >
            <List className="mr-2 h-4 w-4" />
            Default Questions
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            By Category
          </TabsTrigger>
          <TabsTrigger value="buckets" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            Buckets
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          <AIQuestionGenerator />
          {isLoading ? (
            <p>Loading questions...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">All Questions ({filteredQuestions.length})</h2>
              </div>
              <div className="border rounded-md">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Question</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Difficulty</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {filteredQuestions.map((question) => (
                      <tr key={question.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-normal text-sm">
                          {question.text}
                          {isDefaultQuestion(question.id) && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                              Default
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {question.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${question.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}>
                            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenEditDialog(question)}
                              disabled={isDefaultQuestion(question.id)}
                              title={isDefaultQuestion(question.id) ? "Default questions cannot be edited" : "Edit question"}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenDeleteDialog(question)}
                              disabled={isDefaultQuestion(question.id)}
                              title={isDefaultQuestion(question.id) ? "Default questions cannot be deleted" : "Delete question"}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="user">
          {isLoading ? (
            <p>Loading questions...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">My Questions ({filteredQuestions.length})</h2>
              </div>
              <div className="border rounded-md">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Question</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Difficulty</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {filteredQuestions.map((question) => (
                      <tr key={question.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-normal text-sm">
                          {question.text}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {question.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${question.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}>
                            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenEditDialog(question)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenDeleteDialog(question)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="default">
          {isLoading ? (
            <p>Loading questions...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">Default Questions ({filteredQuestions.length})</h2>
              </div>
              <div className="border rounded-md">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Question</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Category</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Difficulty</th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {filteredQuestions.map((question) => (
                      <tr key={question.id} className="hover:bg-muted/50">
                        <td className="px-6 py-4 whitespace-normal text-sm">
                          {question.text}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            {question.category}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                            ${question.difficulty === 'easy' ? 'bg-green-100 text-green-800' : 
                              question.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                                'bg-red-100 text-red-800'}`}>
                            {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categories">
          {isLoading ? (
            <p>Loading categories...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map(category => (
                <CategoryQuestions 
                  key={category.id} 
                  categoryId={category.id} 
                  categoryName={category.name} 
                  onClose={() => console.log('Close requested, but ignored in list view')}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="buckets">
          <BucketManager />
        </TabsContent>
      </Tabs>
      
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Question</DialogTitle>
            <DialogDescription>
              Create a new trivia question for your library
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question Text</label>
              <Textarea 
                placeholder="Enter your question here"
                value={formState.text}
                onChange={(e) => setFormState({...formState, text: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={formState.category}
                  onValueChange={(value) => setFormState({...formState, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select 
                  value={formState.difficulty}
                  onValueChange={(value) => setFormState({...formState, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-sm font-medium">Options (Select the correct answer)</label>
              {formState.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`option-${index}`}
                    checked={index === formState.correctAnswerIndex}
                    onCheckedChange={() => 
                      setFormState({...formState, correctAnswerIndex: index})
                    }
                  />
                  <Input 
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formState.options];
                      newOptions[index] = e.target.value;
                      setFormState({...formState, options: newOptions});
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddQuestion}>
              Add Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Question</DialogTitle>
            <DialogDescription>
              Modify the selected trivia question
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Question Text</label>
              <Textarea 
                placeholder="Enter your question here"
                value={formState.text}
                onChange={(e) => setFormState({...formState, text: e.target.value})}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select 
                  value={formState.category}
                  onValueChange={(value) => setFormState({...formState, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Difficulty</label>
                <Select 
                  value={formState.difficulty}
                  onValueChange={(value) => setFormState({...formState, difficulty: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="text-sm font-medium">Options (Select the correct answer)</label>
              {formState.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`edit-option-${index}`}
                    checked={index === formState.correctAnswerIndex}
                    onCheckedChange={() => 
                      setFormState({...formState, correctAnswerIndex: index})
                    }
                  />
                  <Input 
                    placeholder={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...formState.options];
                      newOptions[index] = e.target.value;
                      setFormState({...formState, options: newOptions});
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditQuestion}>
              Update Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Question</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this question? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedQuestion && (
            <div className="py-4 border-y border-border my-4">
              <p className="font-medium mb-2">{selectedQuestion.text}</p>
              <div className="text-sm text-muted-foreground">
                Category: {selectedQuestion.category} | 
                Difficulty: {selectedQuestion.difficulty.charAt(0).toUpperCase() + selectedQuestion.difficulty.slice(1)}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteQuestion}>
              Delete Question
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRestoreDefaultDialogOpen} onOpenChange={setIsRestoreDefaultDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore Default Questions</DialogTitle>
            <DialogDescription>
              This will restore the original set of default questions provided with the system. Any modifications to default questions will be lost.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRestoreDefaultDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="default" onClick={handleRestoreDefaultQuestions}>
              Restore Default Questions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default QuestionLibrary;
