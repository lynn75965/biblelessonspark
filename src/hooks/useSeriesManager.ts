/**
 * useSeriesManager Hook
 * Manages lesson series lifecycle: create, fetch, update, complete, abandon.
 *
 * Architecture: Frontend drives backend
 * SSOT: seriesConfig.ts owns all series interfaces and constants
 *
 * CREATED: January 2026 (Phase 24)
 */

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  LessonSeries,
  SeriesStyleMetadata,
  SeriesLessonSummary,
  SERIES_LIMITS,
  SERIES_STATUSES,
  getNextLessonNumber,
  isSeriesComplete,
} from "@/constants/seriesConfig";

// ============================================================================
// HOOK RETURN TYPE
// ============================================================================

interface UseSeriesManagerReturn {
  // State
  activeSeries: LessonSeries[];
  selectedSeries: LessonSeries | null;
  isLoading: boolean;
  isCreating: boolean;

  // Actions
  fetchActiveSeries: () => Promise<void>;
  createSeries: (name: string, totalLessons: number, passage?: string, topic?: string, theologyProfileId?: string, ageGroup?: string) => Promise<LessonSeries | null>;
  selectSeries: (seriesId: string) => void;
  clearSelection: () => void;
  updateStyleMetadata: (seriesId: string, styleMetadata: SeriesStyleMetadata) => Promise<boolean>;
  addLessonSummary: (seriesId: string, summary: SeriesLessonSummary) => Promise<boolean>;
  linkLessonToSeries: (lessonId: string, seriesId: string, lessonNumber: number) => Promise<boolean>;
  completeSeries: (seriesId: string) => Promise<boolean>;
  abandonSeries: (seriesId: string) => Promise<boolean>;

  // Derived state
  nextLessonNumber: number;
  isSeriesFull: boolean;
  hasStyleMetadata: boolean;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSeriesManager(): UseSeriesManagerReturn {
  const [activeSeries, setActiveSeries] = useState<LessonSeries[]>([]);
  const [selectedSeries, setSelectedSeries] = useState<LessonSeries | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  // ============================================================================
  // FETCH ACTIVE SERIES
  // ============================================================================

  const fetchActiveSeries = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;

      const { data, error } = await supabase
        .from('lesson_series')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', SERIES_STATUSES.IN_PROGRESS)
        .order('updated_at', { ascending: false })
        .limit(SERIES_LIMITS.maxActiveSeries);

      if (error) {
        console.error('Error fetching series:', error);
        toast({
          title: "Error loading series",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      // Cast JSONB fields to typed arrays
      const typedSeries: LessonSeries[] = (data || []).map(row => ({
        ...row,
        lesson_summaries: (row.lesson_summaries as SeriesLessonSummary[]) || [],
        style_metadata: row.style_metadata as SeriesStyleMetadata | null,
        status: row.status as LessonSeries['status'],
      }));

      setActiveSeries(typedSeries);

      // If a series was selected, refresh it from the new data
      if (selectedSeries) {
        const refreshed = typedSeries.find(s => s.id === selectedSeries.id);
        if (refreshed) {
          setSelectedSeries(refreshed);
        } else {
          // Selected series is no longer in_progress (completed or abandoned)
          setSelectedSeries(null);
        }
      }
    } catch (err) {
      console.error('Error in fetchActiveSeries:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedSeries, toast]);

  // Fetch on mount
  useEffect(() => {
    fetchActiveSeries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================================================
  // CREATE SERIES
  // ============================================================================

  const createSeries = useCallback(async (
    name: string,
    totalLessons: number,
    passage?: string,
    topic?: string,
    theologyProfileId?: string,
    ageGroup?: string
  ): Promise<LessonSeries | null> => {
    if (!name.trim()) {
      toast({
        title: "Series name required",
        description: "Please enter a name for your teaching series.",
        variant: "destructive",
      });
      return null;
    }

    if (name.trim().length > SERIES_LIMITS.maxSeriesNameLength) {
      toast({
        title: "Name too long",
        description: `Series name must be ${SERIES_LIMITS.maxSeriesNameLength} characters or less.`,
        variant: "destructive",
      });
      return null;
    }

    if (totalLessons < SERIES_LIMITS.minLessons || totalLessons > SERIES_LIMITS.maxLessons) {
      toast({
        title: "Invalid lesson count",
        description: `Series must have ${SERIES_LIMITS.minLessons}-${SERIES_LIMITS.maxLessons} lessons.`,
        variant: "destructive",
      });
      return null;
    }

    if (activeSeries.length >= SERIES_LIMITS.maxActiveSeries) {
      toast({
        title: "Too many active series",
        description: `You can have up to ${SERIES_LIMITS.maxActiveSeries} active series. Complete or abandon an existing series first.`,
        variant: "destructive",
      });
      return null;
    }

    setIsCreating(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        toast({
          title: "Authentication required",
          description: "Please sign in to create a series.",
          variant: "destructive",
        });
        return null;
      }

      const { data, error } = await supabase
        .from('lesson_series')
        .insert({
          user_id: session.user.id,
          series_name: name.trim(),
          total_lessons: totalLessons,
          bible_passage: passage || null,
          focused_topic: topic || null,
          theology_profile_id: theologyProfileId || null,
          age_group: ageGroup || null,
          lesson_summaries: [],
          status: SERIES_STATUSES.IN_PROGRESS,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating series:', error);
        toast({
          title: "Error creating series",
          description: error.message,
          variant: "destructive",
        });
        return null;
      }

      const newSeries: LessonSeries = {
        ...data,
        lesson_summaries: [],
        style_metadata: null,
        status: data.status as LessonSeries['status'],
      };

      // Add to list and select it
      setActiveSeries(prev => [newSeries, ...prev]);
      setSelectedSeries(newSeries);

      toast({
        title: "Series created",
        description: `"${name.trim()}" -- ${totalLessons} lessons. Generate Lesson 1 to get started.`,
      });

      return newSeries;
    } catch (err) {
      console.error('Error in createSeries:', err);
      return null;
    } finally {
      setIsCreating(false);
    }
  }, [activeSeries.length, toast]);

  // ============================================================================
  // SELECT / CLEAR SERIES
  // ============================================================================

  const selectSeries = useCallback((seriesId: string) => {
    const series = activeSeries.find(s => s.id === seriesId);
    setSelectedSeries(series || null);
  }, [activeSeries]);

  const clearSelection = useCallback(() => {
    setSelectedSeries(null);
  }, []);

  // ============================================================================
  // UPDATE STYLE METADATA (after Lesson 1 generation)
  // ============================================================================

  const updateStyleMetadata = useCallback(async (
    seriesId: string,
    styleMetadata: SeriesStyleMetadata
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lesson_series')
        .update({
          style_metadata: styleMetadata as any,
          updated_at: new Date().toISOString(),
        })
        .eq('id', seriesId);

      if (error) {
        console.error('Error updating style metadata:', error);
        return false;
      }

      // Update local state
      setActiveSeries(prev => prev.map(s =>
        s.id === seriesId ? { ...s, style_metadata: styleMetadata } : s
      ));
      if (selectedSeries?.id === seriesId) {
        setSelectedSeries(prev => prev ? { ...prev, style_metadata: styleMetadata } : null);
      }

      return true;
    } catch (err) {
      console.error('Error in updateStyleMetadata:', err);
      return false;
    }
  }, [selectedSeries]);

  // ============================================================================
  // ADD LESSON SUMMARY (after each lesson generation)
  // ============================================================================

  const addLessonSummary = useCallback(async (
    seriesId: string,
    summary: SeriesLessonSummary
  ): Promise<boolean> => {
    try {
      // Fetch current summaries to append
      const { data: current, error: fetchError } = await supabase
        .from('lesson_series')
        .select('lesson_summaries, total_lessons')
        .eq('id', seriesId)
        .single();

      if (fetchError) {
        console.error('Error fetching current summaries:', fetchError);
        return false;
      }

      const existingSummaries = (current.lesson_summaries as SeriesLessonSummary[]) || [];
      const updatedSummaries = [...existingSummaries, summary];

      // Check if series should auto-complete
      const shouldComplete = updatedSummaries.length >= current.total_lessons;

      const updateData: any = {
        lesson_summaries: updatedSummaries,
        updated_at: new Date().toISOString(),
      };

      if (shouldComplete) {
        updateData.status = SERIES_STATUSES.COMPLETED;
      }

      const { error: updateError } = await supabase
        .from('lesson_series')
        .update(updateData)
        .eq('id', seriesId);

      if (updateError) {
        console.error('Error adding lesson summary:', updateError);
        return false;
      }

      // Update local state
      const updater = (s: LessonSeries) =>
        s.id === seriesId
          ? {
              ...s,
              lesson_summaries: updatedSummaries,
              status: shouldComplete ? SERIES_STATUSES.COMPLETED as LessonSeries['status'] : s.status,
            }
          : s;

      setActiveSeries(prev => shouldComplete
        ? prev.filter(s => s.id !== seriesId) // Remove from active if completed
        : prev.map(updater)
      );

      if (selectedSeries?.id === seriesId) {
        if (shouldComplete) {
          setSelectedSeries(null);
          toast({
            title: "Series complete! ",
            description: `All ${current.total_lessons} lessons in this series have been generated.`,
          });
        } else {
          setSelectedSeries(prev => prev ? updater(prev) : null);
        }
      }

      return true;
    } catch (err) {
      console.error('Error in addLessonSummary:', err);
      return false;
    }
  }, [selectedSeries, toast]);

  // ============================================================================
  // LINK LESSON TO SERIES (set series_id + series_lesson_number on lessons row)
  // ============================================================================

  const linkLessonToSeries = useCallback(async (
    lessonId: string,
    seriesId: string,
    lessonNumber: number
  ): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          series_id: seriesId,
          series_lesson_number: lessonNumber,
        })
        .eq('id', lessonId);

      if (error) {
        console.error('Error linking lesson to series:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Error in linkLessonToSeries:', err);
      return false;
    }
  }, []);

  // ============================================================================
  // COMPLETE SERIES (manual)
  // ============================================================================

  const completeSeries = useCallback(async (seriesId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lesson_series')
        .update({
          status: SERIES_STATUSES.COMPLETED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', seriesId);

      if (error) {
        console.error('Error completing series:', error);
        return false;
      }

      setActiveSeries(prev => prev.filter(s => s.id !== seriesId));
      if (selectedSeries?.id === seriesId) {
        setSelectedSeries(null);
      }

      toast({
        title: "Series completed",
        description: "This series has been marked as complete.",
      });

      return true;
    } catch (err) {
      console.error('Error in completeSeries:', err);
      return false;
    }
  }, [selectedSeries, toast]);

  // ============================================================================
  // ABANDON SERIES
  // ============================================================================

  const abandonSeries = useCallback(async (seriesId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('lesson_series')
        .update({
          status: SERIES_STATUSES.ABANDONED,
          updated_at: new Date().toISOString(),
        })
        .eq('id', seriesId);

      if (error) {
        console.error('Error abandoning series:', error);
        return false;
      }

      setActiveSeries(prev => prev.filter(s => s.id !== seriesId));
      if (selectedSeries?.id === seriesId) {
        setSelectedSeries(null);
      }

      toast({
        title: "Series abandoned",
        description: "This series has been removed from your active list.",
      });

      return true;
    } catch (err) {
      console.error('Error in abandonSeries:', err);
      return false;
    }
  }, [selectedSeries, toast]);

  // ============================================================================
  // DERIVED STATE
  // ============================================================================

  const nextLessonNumber = selectedSeries ? getNextLessonNumber(selectedSeries) : 1;
  const isSeriesFull = selectedSeries ? isSeriesComplete(selectedSeries) : false;
  const hasStyleMetadata = selectedSeries?.style_metadata !== null && selectedSeries?.style_metadata !== undefined;

  return {
    activeSeries,
    selectedSeries,
    isLoading,
    isCreating,
    fetchActiveSeries,
    createSeries,
    selectSeries,
    clearSelection,
    updateStyleMetadata,
    addLessonSummary,
    linkLessonToSeries,
    completeSeries,
    abandonSeries,
    nextLessonNumber,
    isSeriesFull,
    hasStyleMetadata,
  };
}
