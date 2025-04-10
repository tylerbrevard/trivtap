
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Search, MoreVertical, Edit, Trash, Copy } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BucketQuestionsProps {
  bucketId: string;
  bucketName: string;
  onClose: () => void;
}

interface Question {
  id: string;
  text: string;
  category: string;
  category_id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correct_answer: string;
}

const BucketQuestions: React.FC<BucketQuestionsProps> = ({
  bucketId,
  bucketName,
  onClose
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchBucketQuestions = async () => {
      try {
        setLoading(true);
        
        // Get question IDs in this bucket
        const { data: bucketQuestionsData, error: bucketError } = await supabase
          .from('bucket_questions')
          .select('question_id')
          .eq('bucket_id', bucketId);
          
        if (bucketError) {
          console.error('Error fetching bucket questions:', bucketError);
          return;
        }
        
        if (!bucketQuestionsData || bucketQuestionsData.length === 0) {
          setQuestions([]);
          setLoading(false);
          return;
        }
        
        // Extract question IDs
        const questionIds = bucketQuestionsData.map(bq => bq.question_id);
        
        // Get the actual questions
        const { data: questionsData, error } = await supabase
          .from('questions')
          .select(`
            id, 
            text, 
            options, 
            correct_answer, 
            difficulty,
            categories(id, name)
          `)
          .in('id', questionIds);
          
        if (error) {
          console.error('Error fetching questions:', error);
          toast({
            title: "Error",
            description: "Failed to load questions. Please try again.",
            variant: "destructive",
          });
          return;
        }
        
        // Format questions data
        const formattedQuestions = questionsData?.map(q => {
          // Convert options to string array
          let optionsArray: string[] = [];
          if (Array.isArray(q.options)) {
            optionsArray = q.options.map(opt => String(opt));
          } else if (q.options) {
            try {
              const parsed = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
              optionsArray = Array.isArray(parsed) ? parsed.map(opt => String(opt)) : [];
            } catch (e) {
              console.error('Error parsing options:', e);
              optionsArray = [];
            }
          }
          
          return {
            id: q.id,
            text: q.text,
            category_id: q.categories?.id || '',
            category: q.categories?.name || 'Uncategorized',
            difficulty: q.difficulty || 'medium',
            options: optionsArray,
            correct_answer: q.correct_answer
          };
        }) || [];
        
        console.log(`Loaded ${formattedQuestions.length} questions for bucket ${bucketName}`);
        setQuestions(formattedQuestions);
      } catch (error) {
        console.error('Error in fetchBucketQuestions:', error);
        toast({
          title: "Error",
          description: "An unexpected error occurred while loading questions.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (bucketId) {
      fetchBucketQuestions();
    }
  }, [bucketId, bucketName, toast]);

  // Filter questions based on search query
  const filteredQuestions = questions.filter(question => 
    question.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    question.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Questions in {bucketName}</CardTitle>
            <CardDescription>
              {loading 
                ? "Loading questions..."
                : `Manage ${questions.length} questions in this bucket`
              }
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onClose}>
            Back to Buckets
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search questions..." 
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            {searchQuery ? 'No questions match your search' : 'No questions found for this bucket.'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BucketQuestions;
