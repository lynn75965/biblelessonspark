import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Lesson } from "@/constants/contracts";

// Re-export for backward compatibility
export type { Lesson };

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
        .eq('user_id', user.id)
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
    organization_id?: string;
  }) => {
    if (!user) return { error: 'Not authenticated' };
    try {
      // Fetch user's organization_id from profile (SSOT: data integrity at source)
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      const { data, error } = await supabase
        .from('lessons')
        .insert([
          {
            ...lessonData,
            title: lessonData.title || 'Untitled Lesson',
            user_id: user.id,
            organization_id: profile?.organization_id || null,
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

  /**
   * Update lesson visibility (Phase 26 — Lesson Visibility Status)
   * Private is permanent default. Teacher must explicitly share.
   */
  const updateLessonVisibility = async (lessonId: string, visibility: 'private' | 'shared') => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ visibility })
        .eq('id', lessonId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setLessons(prev => prev.map(lesson =>
        lesson.id === lessonId ? { ...lesson, visibility } : lesson
      ));

      toast({
        title: visibility === 'shared' ? "Lesson shared" : "Lesson set to private",
        description: visibility === 'shared'
          ? "Share with Org Leaders"
          : "This lesson is now visible only to you.",
      });
    } catch (error) {
      console.error('Error updating lesson visibility:', error);
      toast({
        title: "Error updating visibility",
        description: "Failed to update lesson visibility. Please try again.",
        variant: "destructive",
      });
    }
  };

  return {
    lessons,
    loading,
    createLesson,
    deleteLesson,
    updateLessonVisibility,
    refetch: fetchLessons,
  };
}
