
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Library, Package, Tag, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories } from '@/utils/importUtils';
import CategoryQuestions from '@/components/CategoryQuestions';
import BucketQuestions from '@/components/BucketQuestions';
import { getStaticQuestions, StaticQuestion } from '@/utils/staticQuestions';

const QuestionLibrary = () => {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [buckets, setBuckets] = useState<{ id: string; name: string }[]>([]);
  const [allQuestions, setAllQuestions] = useState<StaticQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        const categoriesData = await fetchCategories();
        setCategories(categoriesData);
        
        // Get default bucket for static questions
        const defaultBucket = { id: 'default', name: 'Default Bucket' };
        setBuckets([defaultBucket]);
        
        // Load all questions
        const questions = await getStaticQuestions();
        setAllQuestions(questions);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading question library data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  // Dummy onClose function since we're viewing in a list context
  const handleClose = () => {
    // No-op in this context, but satisfies the type requirement
    console.log('Close requested, but ignored in list view');
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Question Library</h1>
        <div className="space-x-2">
          {/* Import button removed as requested */}
        </div>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all" className="flex items-center">
            <List className="mr-2 h-4 w-4" />
            All Questions
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            By Category
          </TabsTrigger>
          <TabsTrigger value="buckets" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            By Bucket
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <p>Loading questions...</p>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-medium">All Questions ({allQuestions.length})</h2>
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
                    {allQuestions.map((question) => (
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
                  onClose={handleClose}
                />
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="buckets">
          {isLoading ? (
            <p>Loading buckets...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {buckets.map(bucket => (
                <BucketQuestions 
                  key={bucket.id} 
                  bucketId={bucket.id} 
                  bucketName={bucket.name} 
                  onClose={handleClose}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionLibrary;
