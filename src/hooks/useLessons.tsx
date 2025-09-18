import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Lesson {
  id: string;
  title: string | null;
  original_text: string | null;
  source_type: string;
  upload_path: string | null;
  filters: any;
  created_at: string | null;
  user_id: string;
}

export function useLessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchLessons();
    } else {
      setLessons([]);
      setLoading(false);
    }
  }, [user]);

  const fetchLessons = async () => {
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error loading lessons",
        description: "Failed to load your lessons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createLesson = async (lessonData: {
    title?: string;
    original_text?: string;
    source_type: string;
    upload_path?: string;
    filters: any;
  }) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('lessons')
        .insert([
          {
            ...lessonData,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setLessons(prev => [data, ...prev]);
      toast({
        title: "Lesson created",
        description: "Your lesson has been saved successfully.",
      });

      return { data, error: null };
    } catch (error) {
      console.error('Error creating lesson:', error);
      toast({
        title: "Error creating lesson",
        description: "Failed to save your lesson. Please try again.",
        variant: "destructive",
      });
      return { data: null, error };
    }
  };

  const deleteLesson = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);

      if (error) throw error;

      setLessons(prev => prev.filter(lesson => lesson.id !== lessonId));
      toast({
        title: "Lesson deleted",
        description: "Your lesson has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Error deleting lesson",
        description: "Failed to delete your lesson. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    lessons,
    loading,
    createLesson,
    deleteLesson,
    refetch: fetchLessons,
  };
}