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
   * Update lesson visibility (Phase 26 -- Lesson Visibility Status)
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

  /**
   * Update lesson title and/or content (inline WYSIWYG editing)
   * Both fields are validated for non-empty content when provided.
   * Returns true on success, false on validation error or Supabase error.
   * updated_at is always stamped explicitly because the lessons table
   * has no confirmed DEFAULT/trigger for updated_at.
   */
  const updateLessonContent = async (
    lessonId: string,
    updates: { title?: string; original_text?: string }
  ): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Not signed in",
        description: "You must be signed in to edit lessons.",
        variant: "destructive",
      });
      return false;
    }

    if (updates.original_text !== undefined && !updates.original_text.trim()) {
      toast({
        title: "Lesson content cannot be empty",
        description: "Please add content before saving.",
        variant: "destructive",
      });
      return false;
    }

    if (updates.title !== undefined && !updates.title.trim()) {
      toast({
        title: "Lesson title cannot be empty",
        description: "Please add a title before saving.",
        variant: "destructive",
      });
      return false;
    }

    const payload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.original_text !== undefined) payload.original_text = updates.original_text;

    try {
      const { error } = await supabase
        .from('lessons')
        .update(payload)
        .eq('id', lessonId)
        .eq('user_id', user.id);

      if (error) throw error;

      setLessons(prev => prev.map(lesson =>
        lesson.id === lessonId ? { ...lesson, ...payload } : lesson
      ));

      toast({
        title: "Lesson updated",
        description: "Your changes have been saved.",
      });
      return true;
    } catch (error) {
      console.error('Error updating lesson:', error);
      toast({
        title: "Error saving lesson",
        description: "Failed to save changes. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  /**
   * Save reshaped lesson content (Phase 27 -- Lesson Shapes)
   * Stores shaped_content and shape_id on the lessons row
   * One shaped version per lesson -- reshaping again overwrites previous
   */
  const updateLessonShape = async (
    lessonId: string,
    shapedContent: string,
    shapeId: string
  ) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ shaped_content: shapedContent, shape_id: shapeId })
        .eq('id', lessonId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setLessons(prev => prev.map(lesson =>
        lesson.id === lessonId
          ? { ...lesson, shaped_content: shapedContent, shape_id: shapeId }
          : lesson
      ));
    } catch (error) {
      console.error('Error saving reshaped lesson:', error);
      toast({
        title: "Error saving reshape",
        description: "The lesson was reshaped but couldn't be saved. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Clear shaped content from a lesson (Phase 27 -- Lesson Shapes)
   * Resets to original format only
   */
  const clearLessonShape = async (lessonId: string) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({ shaped_content: null, shape_id: null })
        .eq('id', lessonId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setLessons(prev => prev.map(lesson =>
        lesson.id === lessonId
          ? { ...lesson, shaped_content: null, shape_id: null }
          : lesson
      ));

      toast({
        title: "Shape cleared",
        description: "Lesson restored to original format.",
      });
    } catch (error) {
      console.error('Error clearing lesson shape:', error);
      toast({
        title: "Error clearing shape",
        description: "Failed to clear shaped content. Please try again.",
        variant: "destructive",
      });
    }
  };

  /**
   * Append a reshaped lesson row to local state (Session A -- reshape-as-lesson)
   * Reshape now returns a full lessons row from the Edge Function.
   * Prepend so the new reshape appears at the top of the library,
   * matching the createLesson add pattern (line 78).
   */
  const addReshapedLesson = (newLesson: Lesson): void => {
    setLessons(prev => [newLesson, ...prev]);
  };

  return {
    lessons,
    loading,
    createLesson,
    deleteLesson,
    updateLessonVisibility,
    updateLessonContent,
    updateLessonShape,
    clearLessonShape,
    addReshapedLesson,
    refetch: fetchLessons,
  };
}
