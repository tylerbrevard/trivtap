
import React from 'react';
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
} from 'lucide-react';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

// Mock categories
const categories = [
  "General Knowledge", "Science", "History", "Geography", 
  "Entertainment", "Sports", "Art", "Music", "Food & Drink"
];

// Mock buckets
const buckets = [
  { id: "default", name: "Default Bucket", questionCount: 248, isDefault: true },
  { id: "pub-night", name: "Pub Night Specials", questionCount: 85, isDefault: false },
  { id: "easy-round", name: "Easy Questions", questionCount: 64, isDefault: false },
  { id: "hard-round", name: "Challenging Round", questionCount: 42, isDefault: false },
];

// Mock questions
const questions = [
  { 
    id: "1", 
    text: "Which planet is known as the Red Planet?", 
    category: "Science",
    difficulty: "Easy",
    options: ["Venus", "Mars", "Jupiter", "Saturn"],
    correctAnswer: "Mars",
    buckets: ["default", "easy-round"]
  },
  { 
    id: "2", 
    text: "Who painted the Mona Lisa?", 
    category: "Art",
    difficulty: "Easy",
    options: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"],
    correctAnswer: "Leonardo da Vinci",
    buckets: ["default"]
  },
  { 
    id: "3", 
    text: "In which year did World War II end?", 
    category: "History",
    difficulty: "Medium",
    options: ["1943", "1944", "1945", "1946"],
    correctAnswer: "1945",
    buckets: ["default", "pub-night"]
  },
  { 
    id: "4", 
    text: "Which of these elements has the chemical symbol 'Au'?", 
    category: "Science",
    difficulty: "Medium",
    options: ["Silver", "Gold", "Aluminum", "Argon"],
    correctAnswer: "Gold",
    buckets: ["default"]
  },
  { 
    id: "5", 
    text: "What is the capital city of Australia?", 
    category: "Geography",
    difficulty: "Medium",
    options: ["Sydney", "Melbourne", "Canberra", "Perth"],
    correctAnswer: "Canberra",
    buckets: ["default", "pub-night"]
  },
  { 
    id: "6", 
    text: "Who wrote the novel 'Pride and Prejudice'?", 
    category: "Entertainment",
    difficulty: "Medium",
    options: ["Jane Austen", "Charles Dickens", "Emily Brontë", "F. Scott Fitzgerald"],
    correctAnswer: "Jane Austen",
    buckets: ["default"]
  },
  { 
    id: "7", 
    text: "Which of these is NOT a programming language?", 
    category: "Science",
    difficulty: "Hard",
    options: ["Python", "Java", "Cougar", "Ruby"],
    correctAnswer: "Cougar",
    buckets: ["default", "hard-round"]
  },
];

const QuestionLibrary = () => {
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
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardDescription>Manage all your trivia questions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {questions.map((question) => (
                  <div key={question.id} className="card-trivia p-4">
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
                            option === question.correctAnswer 
                              ? 'bg-green-500/20 text-green-500 border border-green-500/30' 
                              : 'bg-muted border border-transparent'
                          }`}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-3 flex gap-1">
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
              <CardDescription>Organize questions into themed groups</CardDescription>
            </CardHeader>
            <CardContent>
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
              <CardDescription>Browse and manage question categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((category) => (
                  <Card key={category}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">{category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button variant="outline" size="sm">Browse Questions</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionLibrary;
