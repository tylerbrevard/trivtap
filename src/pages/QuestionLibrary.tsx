
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  FolderPlus,
  Tag,
  MoreVertical,
  Edit,
  Trash,
  Copy,
  Loader2
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";

// Define types for our data
interface Question {
  id: string;
  text: string;
  category: string;
  category_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correct_answer: string;
  buckets: string[];
}

interface Bucket {
  id: string;
  name: string;
  questionCount: number;
  isDefault: boolean;
}

interface Category {
  id: string;
  name: string;
}

const QuestionLibrary = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState({
    questions: true,
    buckets: true,
    categories: true
  });
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  // Fetch questions from Supabase
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        console.log('Fetching questions from database...');
        
        // Get questions with categories
        const { data: questionsData, error } = await supabase
          .from('questions')
          .select(`
            id, 
            text, 
            options, 
            correct_answer, 
            difficulty,
            categories(id, name)
          `);
          
        if (error) {
          console.error('Error fetching questions:', error);
          toast({
            title: "Error",
            description: "Failed to load questions. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        // Get bucket questions mapping
        const { data: bucketQuestionsData, error: bucketQuestionsError } = await supabase
          .from('bucket_questions')
          .select('bucket_id, question_id');
          
        if (bucketQuestionsError) {
          console.error('Error fetching bucket questions:', bucketQuestionsError);
        }
        
        // Map bucket IDs to questions
        const questionBuckets = new Map();
        bucketQuestionsData?.forEach(bq => {
          if (!questionBuckets.has(bq.question_id)) {
            questionBuckets.set(bq.question_id, []);
          }
          questionBuckets.get(bq.question_id).push(bq.bucket_id);
        });
        
        // Format questions data - ensure options is always an array
        const formattedQuestions = questionsData?.map(q => ({
          id: q.id,
          text: q.text,
          category_id: q.categories?.id || '',
          category: q.categories?.name || 'Uncategorized',
          difficulty: q.difficulty || 'medium',
          options: Array.isArray(q.options) ? q.options : [],
          correct_answer: q.correct_answer,
          buckets: questionBuckets.get(q.id) || []
        })) || [];
        
        console.log(`Loaded ${formattedQuestions.length} questions`);
        setQuestions(formattedQuestions);
      } catch (error) {
        console.error('Error in fetchQuestions:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading questions.",
          variant: "destructive",
        });
      } finally {
        setLoading(prev => ({ ...prev, questions: false }));
      }
    };

    fetchQuestions();
  }, [toast]);

  // Fetch buckets from Supabase
  useEffect(() => {
    const fetchBuckets = async () => {
      try {
        console.log('Fetching buckets from database...');
        
        // Get buckets
        const { data: bucketsData, error } = await supabase
          .from('buckets')
          .select('id, name, is_default, description');
          
        if (error) {
          console.error('Error fetching buckets:', error);
          toast({
            title: "Error",
            description: "Failed to load buckets. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        // Get bucket questions count
        const { data: bucketQuestionsData, error: countError } = await supabase
          .from('bucket_questions')
          .select('bucket_id');
          
        if (countError) {
          console.error('Error fetching bucket question counts:', countError);
        }
        
        // Count questions per bucket
        const bucketCounts = new Map();
        bucketQuestionsData?.forEach(bq => {
          bucketCounts.set(bq.bucket_id, (bucketCounts.get(bq.bucket_id) || 0) + 1);
        });
        
        // Format buckets data
        const formattedBuckets = bucketsData?.map(b => ({
          id: b.id,
          name: b.name,
          questionCount: bucketCounts.get(b.id) || 0,
          isDefault: b.is_default || false,
          description: b.description
        })) || [];
        
        console.log(`Loaded ${formattedBuckets.length} buckets`);
        setBuckets(formattedBuckets);
      } catch (error) {
        console.error('Error in fetchBuckets:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading buckets.",
          variant: "destructive",
        });
      } finally {
        setLoading(prev => ({ ...prev, buckets: false }));
      }
    };

    fetchBuckets();
  }, [toast]);

  // Fetch categories from Supabase
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        console.log('Fetching categories from database...');
        
        const { data, error } = await supabase
          .from('categories')
          .select('id, name');
          
        if (error) {
          console.error('Error fetching categories:', error);
          toast({
            title: "Error",
            description: "Failed to load categories. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        console.log(`Loaded ${data?.length || 0} categories`);
        setCategories(data || []);
      } catch (error) {
        console.error('Error in fetchCategories:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading categories.",
          variant: "destructive",
        });
      } finally {
        setLoading(prev => ({ ...prev, categories: false }));
      }
    };

    fetchCategories();
  }, [toast]);

  // Filter questions based on search query
  const filteredQuestions = questions.filter(question => 
    question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    question.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Question Library</h1>
        <div className="flex gap-2">
          <Button>
            <FolderPlus className="mr-2 h-4 w-4" />
            New Bucket
          </Button>
          <Button className="btn-trivia">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Question
          </Button>
          <Button variant="outline" asChild>
            <Link to="/admin/import">
              <PlusCircle className="mr-2 h-4 w-4" />
              Import Questions
            </Link>
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="questions">
        <TabsList className="mb-4">
          <TabsTrigger value="questions">All Questions</TabsTrigger>
          <TabsTrigger value="buckets">Buckets</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        
        {/* Questions Tab */}
        <TabsContent value="questions">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>All Questions</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search questions..." 
                      className="pl-9 w-[250px]"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>
                {loading.questions 
                  ? "Loading questions..."
                  : `Manage ${questions.length} trivia questions`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.questions ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredQuestions.length > 0 ? (
                <div className="space-y-4">
                  {filteredQuestions.map((question) => (
                    <div key={question.id} className="card-trivia p-4 border rounded-lg shadow-sm">
                      <div className="flex justify-between">
                        <div className="flex gap-2">
                          <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20 text-primary border-primary/30">
                            {question.category}
                          </Badge>
                          <Badge variant="outline" className="bg-muted hover:bg-muted/80">
                            {question.difficulty}
                          </Badge>
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
                              <Copy className="mr-2 h-4 w-4" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      
                      <h3 className="text-lg font-medium mt-2">{question.text}</h3>
                      
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {question.options.map((option, index) => (
                          <div 
                            key={index} 
                            className={`p-2 rounded-md text-sm ${
                              option === question.correct_answer 
                                ? 'bg-green-500/20 text-green-700 border border-green-500/30' 
                                : 'bg-muted border border-transparent'
                            }`}
                          >
                            {option}
                          </div>
                        ))}
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-1">
                        {question.buckets.map((bucketId) => {
                          const bucket = buckets.find(b => b.id === bucketId);
                          return bucket ? (
                            <Badge key={bucketId} variant="secondary" className="bg-accent/50 text-accent-foreground">
                              {bucket.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  {searchQuery ? 'No questions match your search' : 'No questions found. Try importing some!'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Buckets Tab */}
        <TabsContent value="buckets">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Question Buckets</CardTitle>
                <Button>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  New Bucket
                </Button>
              </div>
              <CardDescription>
                {loading.buckets 
                  ? "Loading buckets..."
                  : "Organize questions into themed groups"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.buckets ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : buckets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {buckets.map((bucket) => (
                    <Card key={bucket.id}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <CardTitle className="text-lg">{bucket.name}</CardTitle>
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
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              {!bucket.isDefault && (
                                <DropdownMenuItem className="text-destructive">
                                  <Trash className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                        {bucket.isDefault && (
                          <Badge className="mt-1">Default</Badge>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <div className="text-muted-foreground">
                            {bucket.questionCount} questions
                          </div>
                          <Button variant="outline" size="sm">View Questions</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No buckets found. Create a bucket to organize your questions!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Categories Tab */}
        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Categories</CardTitle>
                <Button>
                  <Tag className="mr-2 h-4 w-4" />
                  New Category
                </Button>
              </div>
              <CardDescription>
                {loading.categories 
                  ? "Loading categories..."
                  : "Browse and manage question categories"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading.categories ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : categories.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {categories.map((category) => (
                    <Card key={category.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Button variant="outline" size="sm">Browse Questions</Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No categories found. Create or import questions to add categories!
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionLibrary;
