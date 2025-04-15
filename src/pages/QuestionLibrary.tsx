
// Modify the QuestionLibrary component to remove the import button
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Library, Package, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { fetchCategories } from '@/utils/importUtils';
import CategoryQuestions from '@/components/CategoryQuestions';
import BucketQuestions from '@/components/BucketQuestions';

const QuestionLibrary = () => {
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [buckets, setBuckets] = useState<{ id: string; name: string }[]>([]);
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
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading question library data:', error);
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Question Library</h1>
        <div className="space-x-2">
          {/* Import button removed as requested */}
        </div>
      </div>
      
      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories" className="flex items-center">
            <Tag className="mr-2 h-4 w-4" />
            By Category
          </TabsTrigger>
          <TabsTrigger value="buckets" className="flex items-center">
            <Package className="mr-2 h-4 w-4" />
            By Bucket
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          {isLoading ? (
            <p>Loading categories...</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {categories.map(category => (
                <CategoryQuestions key={category.id} category={category} />
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
                <BucketQuestions key={bucket.id} bucket={bucket} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default QuestionLibrary;
