import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { Lesson } from "@/constants/contracts";
import { LESSON_LIBRARY_TEXT } from "@/constants/dashboardConfig";

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
    // Single query attempt. A zero-row result returns data:[] / error:null,
    // so it never throws -- the empty library renders its empty state and no
    // toast appears. Only a genuine Supabase error throws here.
    const attemptFetch = async (): Promise<Lesson[]> => {
      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    };

    try {
      let data: Lesson[];
      try {
        data = await attemptFetch();
      } catch (firstError) {
        // Resilient one-time retry: a brand-new session can briefly fail the
        // first fetch (e.g. a transient network/auth hiccup). Retry once after
        // a short delay before surfacing anything to the user. A persistent
        // failure still reaches the catch below and shows the error toast.
        console.warn('Lessons fetch failed; retrying once:', firstError);
        await new Promise((resolve) => setTimeout(resolve, 600));
        data = await attemptFetch();
      }
      setLessons(data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: LESSON_LIBRARY_TEXT.loadError.title,
        description: LESSON_LIBRARY_TEXT.loadError.description,
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

  /**
   * Delete a lesson, optionally cascading reshape children. Session C
   * (May 19, 2026) -- extended from a single-id delete to support the
   * smart-deletion flow.
   *
   * Rule DEL3: children are deleted BEFORE the parent so the FK's
   * ON DELETE SET NULL never fires and never orphans rows.
   * Rule DEL4: a single setLessons call removes all rows at once.
   * Rule DEL6: success-toast wording is owned by the caller (it knows
   * whether this was a reshape, an original with children, or a plain
   * original). The hook keeps the destructive failure toast.
   *
   * Returns success boolean so the caller can sequence the success
   * toast and any side effects (e.g. closing the viewer).
   */
  const deleteLesson = async (
    lessonId: string,
    options?: { childrenIds?: string[] },
  ): Promise<{ success: boolean }> => {
    const childrenIds = options?.childrenIds ?? [];
    try {
      if (childrenIds.length > 0) {
        const { error: childErr } = await supabase
          .from('lessons')
          .delete()
          .in('id', childrenIds);
        if (childErr) throw childErr;
      }

      const { error } = await supabase
        .from('lessons')
        .delete()
        .eq('id', lessonId);
      if (error) throw error;

      const removeIds = new Set([lessonId, ...childrenIds]);
      setLessons(prev => prev.filter(l => !removeIds.has(l.id)));
      return { success: true };
    } catch (error) {
      console.error('Error deleting lesson:', error);
      toast({
        title: "Failed to delete",
        description: "Please try again.",
        variant: "destructive",
      });
      return { success: false };
    }
  };

  /**
   * Stage C -- update a lesson's per-group sharing (Team and/or Shepherd,
   * independently). Replaces the old single-flag updateLessonVisibility.
   * Author-only (the .eq('user_id') guard). Both-false is private (the default);
   * the teacher explicitly opts into each group.
   */
  const updateLessonShares = async (
    lessonId: string,
    shares: { shared_with_team: boolean; shared_with_org: boolean }
  ) => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          shared_with_team: shares.shared_with_team,
          shared_with_org: shares.shared_with_org,
        })
        .eq('id', lessonId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setLessons(prev => prev.map(lesson =>
        lesson.id === lessonId ? { ...lesson, ...shares } : lesson
      ));

      const targets = [
        shares.shared_with_team ? "your Team" : null,
        shares.shared_with_org ? "your Shepherd group" : null,
      ].filter(Boolean);

      toast({
        title: targets.length > 0 ? "Sharing updated" : "Lesson set to private",
        description: targets.length > 0
          ? `Now shared with ${targets.join(" and ")}.`
          : "This lesson is now visible only to you.",
      });
    } catch (error) {
      console.error('Error updating lesson sharing:', error);
      toast({
        title: "Error updating sharing",
        description: "Failed to update lesson sharing. Please try again.",
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
    updateLessonShares,
    updateLessonContent,
    addReshapedLesson,
    refetch: fetchLessons,
  };
}
