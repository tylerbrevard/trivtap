import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Search, MoreVertical, Edit, Trash, Copy } from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getStaticQuestions, StaticQuestion } from "@/utils/staticQuestions";
import { supabase } from "@/integrations/supabase/client";

interface BucketQuestionsProps {
  bucketId: string;
  bucketName: string;
  onClose?: () => void; // Made optional for use in list view
}

const BucketQuestions: React.FC<BucketQuestionsProps> = ({
  bucketId,
  bucketName,
  onClose
}) => {
  const [questions, setQuestions] = useState<StaticQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const fetchBucketQuestions = async () => {
      try {
        setLoading(true);
        
        // Check if this is a default bucket
        if (bucketId === 'default') {
          // For the default bucket, we'll load questions directly
          const allQuestions = await getStaticQuestions();
          console.log(`Fetched ${allQuestions.length} total default questions`);
          setQuestions(allQuestions);
        } else {
          // For non-default buckets, check Supabase first
          const { data: bucketQuestions, error: questionsError } = await supabase
            .from('bucket_questions')
            .select(`
              question_id,
              questions:question_id (
                id, 
                text, 
                options, 
                correct_answer, 
                categories:category_id (
                  id,
                  name
                )
              )
            `)
            .eq('bucket_id', bucketId);
            
          if (questionsError) {
            console.error('Error fetching bucket questions:', questionsError);
            // Fallback to filtering by category as before
            const allQuestions = await getStaticQuestions();
            const filteredQuestions = allQuestions.filter(q => 
              q.category.toLowerCase() === bucketName.toLowerCase()
            );
            console.log(`Loaded ${filteredQuestions.length} questions for category ${bucketName}`);
            setQuestions(filteredQuestions);
            return;
          }
          
          if (bucketQuestions && bucketQuestions.length > 0) {
            const formattedQuestions = bucketQuestions.map(item => {
              const question = item.questions;
              
              let options: string[] = [];
              if (question.options) {
                if (Array.isArray(question.options)) {
                  options = question.options.map(opt => String(opt));
                } else if (typeof question.options === 'string') {
                  try {
                    const parsedOptions = JSON.parse(question.options);
                    options = Array.isArray(parsedOptions) ? parsedOptions.map(opt => String(opt)) : [];
                  } catch {
                    options = [String(question.options)];
                  }
                }
              }
              
              // Ensure difficulty is one of the allowed values
              // Since the 'difficulty' property doesn't exist on the question type from Supabase,
              // we'll default to 'medium' without checking
              const difficulty: 'easy' | 'medium' | 'hard' = 'medium';
              
              return {
                id: question.id,
                text: question.text,
                options: options,
                correctAnswer: question.correct_answer,
                category: question.categories ? question.categories.name : bucketName,
                difficulty: difficulty
              };
            });
            
            console.log(`Loaded ${formattedQuestions.length} questions for bucket ${bucketName}`);
            setQuestions(formattedQuestions);
          } else {
            // Fallback to filtering by category as before
            const allQuestions = await getStaticQuestions();
            const filteredQuestions = allQuestions.filter(q => 
              q.category.toLowerCase() === bucketName.toLowerCase()
            );
            console.log(`Loaded ${filteredQuestions.length} questions for category ${bucketName} (fallback method)`);
            setQuestions(filteredQuestions);
          }
        }
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
          {/* Only show the back button if onClose is provided */}
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Back to Buckets
            </Button>
          )}
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
                      {question.difficulty || 'Medium'}
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
                        option === question.correctAnswer 
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
