/**
 * SeriesLibrary Component
 * Location: src/components/dashboard/SeriesLibrary.tsx
 *
 * SSOT Compliance:
 * - LessonSeries type from @/constants/seriesConfig
 * - isSeriesComplete() from @/constants/seriesConfig
 * - SERIES_STATUSES from @/constants/seriesConfig
 * - SeriesExportButton from @/components/SeriesExport/SeriesExportButton
 *
 * FIX: March 2026 -- switched from fetchActiveSeries (in_progress only)
 *   to fetchAllSeries (in_progress + completed) so completed series are visible.
 * FIX: March 2026 -- Print Series Booklet button removed. Export Series only.
 * FEATURE: March 27, 2026 -- Expand/collapse lesson list with up/down reorder controls
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Clock, Archive, ChevronDown, ChevronUp, ArrowUp, ArrowDown, Pin, Trash2 } from 'lucide-react';
import { useSeriesManager } from '@/hooks/useSeriesManager';
import { useSubscription } from '@/hooks/useSubscription';
import { isSeriesComplete, SERIES_STATUSES } from '@/constants/seriesConfig';
import { SeriesExportButton } from '@/components/SeriesExport/SeriesExportButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ROUTES } from '@/constants/routes';

interface SeriesLesson {
  id: string;
  title: string | null;
  series_lesson_number: number;
}

export function SeriesLibrary() {
  const { allSeries, isLoading, fetchAllSeries } = useSeriesManager();
  const { tier } = useSubscription();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const expandConsumedRef = useRef(false);

  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [seriesLessons, setSeriesLessons] = useState<SeriesLesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [reordering, setReordering] = useState(false);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAllSeries();
  }, []);

  // Batch fetch actual lesson counts per series (one query, not N)
  useEffect(() => {
    if (allSeries.length === 0) return;
    const fetchCounts = async () => {
      const seriesIds = allSeries.map(s => s.id);
      const { data, error } = await supabase
        .from('lessons')
        .select('series_id')
        .in('series_id', seriesIds);
      if (error || !data) return;
      const counts: Record<string, number> = {};
      for (const row of data) {
        if (row.series_id) {
          counts[row.series_id] = (counts[row.series_id] || 0) + 1;
        }
      }
      setLessonCounts(counts);
    };
    fetchCounts();
  }, [allSeries]);

  // Auto-expand a series when navigated from "In Series" badge
  useEffect(() => {
    const targetId = (location.state as { expandSeriesId?: string } | null)?.expandSeriesId;
    if (targetId && !expandConsumedRef.current && allSeries.length > 0) {
      expandConsumedRef.current = true;
      setExpandedSeriesId(targetId);
      fetchSeriesLessons(targetId);
      // Clear the state so refresh does not re-trigger
      window.history.replaceState({}, '');
    }
  }, [allSeries, location.state]);

  const fetchSeriesLessons = async (seriesId: string) => {
    setLessonsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select('id, title, series_lesson_number')
        .eq('series_id', seriesId)
        .order('series_lesson_number', { ascending: true });

      if (error) {
        console.error('Error fetching series lessons:', error);
        setSeriesLessons([]);
        return;
      }
      setSeriesLessons((data || []) as SeriesLesson[]);
    } catch (err) {
      console.error('Error in fetchSeriesLessons:', err);
      setSeriesLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  };

  const handleToggleExpand = (seriesId: string) => {
    if (expandedSeriesId === seriesId) {
      setExpandedSeriesId(null);
      setSeriesLessons([]);
    } else {
      setExpandedSeriesId(seriesId);
      fetchSeriesLessons(seriesId);
    }
  };

  const handleReorder = async (lessonIndex: number, direction: 'up' | 'down') => {
    const swapIndex = direction === 'up' ? lessonIndex - 1 : lessonIndex + 1;
    if (swapIndex < 0 || swapIndex >= seriesLessons.length) return;

    setReordering(true);
    try {
      const lessonA = seriesLessons[lessonIndex];
      const lessonB = seriesLessons[swapIndex];

      // Swap series_lesson_number values
      const [errA] = await Promise.all([
        supabase.from('lessons').update({ series_lesson_number: lessonB.series_lesson_number }).eq('id', lessonA.id),
        supabase.from('lessons').update({ series_lesson_number: lessonA.series_lesson_number }).eq('id', lessonB.id),
      ]).then(results => results.map(r => r.error));

      if (errA) {
        toast({ title: "Error", description: "Failed to reorder lessons.", variant: "destructive" });
        return;
      }

      // Update local state immediately
      const updated = [...seriesLessons];
      const tempNum = updated[lessonIndex].series_lesson_number;
      updated[lessonIndex].series_lesson_number = updated[swapIndex].series_lesson_number;
      updated[swapIndex].series_lesson_number = tempNum;
      // Re-sort by position
      updated.sort((a, b) => a.series_lesson_number - b.series_lesson_number);
      setSeriesLessons(updated);
    } catch (err) {
      console.error('Error reordering:', err);
      toast({ title: "Error", description: "Failed to reorder lessons.", variant: "destructive" });
    } finally {
      setReordering(false);
    }
  };

  const handleTogglePin = async (seriesId: string, currentPinOrder: number | null | undefined) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return;
      const userId = session.user.id;

      if (currentPinOrder === 1) {
        // Unpin: set to NULL, then re-number remaining pinned series
        await supabase
          .from('lesson_series')
          .update({ pin_order: null })
          .eq('id', seriesId)
          .eq('user_id', userId);

        // Get remaining pinned series ordered by pin_order
        const { data: remaining } = await supabase
          .from('lesson_series')
          .select('id, pin_order')
          .eq('user_id', userId)
          .not('pin_order', 'is', null)
          .order('pin_order', { ascending: true });

        // Re-number from 1
        if (remaining) {
          for (let i = 0; i < remaining.length; i++) {
            await supabase
              .from('lesson_series')
              .update({ pin_order: i + 1 })
              .eq('id', remaining[i].id)
              .eq('user_id', userId);
          }
        }
      } else {
        // Pin or re-pin to position 1: increment all existing pinned, then set target to 1
        const { data: pinned } = await supabase
          .from('lesson_series')
          .select('id, pin_order')
          .eq('user_id', userId)
          .not('pin_order', 'is', null)
          .neq('id', seriesId)
          .order('pin_order', { ascending: true });

        // Re-number others starting from 2
        if (pinned) {
          for (let i = 0; i < pinned.length; i++) {
            await supabase
              .from('lesson_series')
              .update({ pin_order: i + 2 })
              .eq('id', pinned[i].id)
              .eq('user_id', userId);
          }
        }

        // Set target to position 1
        await supabase
          .from('lesson_series')
          .update({ pin_order: 1 })
          .eq('id', seriesId)
          .eq('user_id', userId);
      }

      // Refresh to get new sort order
      fetchAllSeries();
    } catch (err) {
      console.error('Error toggling pin:', err);
      toast({ title: "Error", description: "Failed to update pin.", variant: "destructive" });
    }
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    });
  };

  const handleDeleteSeries = async (seriesId: string) => {
    const count = lessonCounts[seriesId] ?? 0;
    if (count > 0) {
      toast({
        title: 'Cannot delete series',
        description: 'Remove all lessons from this series before deleting it.',
        variant: 'destructive',
      });
      setDeleteConfirmId(null);
      return;
    }

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('lesson_series')
        .delete()
        .eq('id', seriesId);

      if (error) {
        toast({ title: 'Delete failed', description: error.message, variant: 'destructive' });
        return;
      }

      toast({ title: 'Series deleted' });
      setDeleteConfirmId(null);
      if (expandedSeriesId === seriesId) {
        setExpandedSeriesId(null);
        setSeriesLessons([]);
      }
      fetchAllSeries();
    } catch (err) {
      console.error('Error deleting series:', err);
      toast({ title: 'Delete failed', description: 'Something went wrong.', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (series: {
    status: string;
    lesson_summaries: unknown[];
    total_lessons: number;
  }) => {
    const complete = isSeriesComplete(series as Parameters<typeof isSeriesComplete>[0]);
    if (complete) {
      return (
        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200" variant="secondary">
          <CheckCircle className="h-3 w-3 mr-1" />
          Complete
        </Badge>
      );
    }
    if (series.status === SERIES_STATUSES.ABANDONED) {
      return (
        <Badge className="bg-muted text-muted-foreground border-border" variant="secondary">
          <Archive className="h-3 w-3 mr-1" />
          Archived
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-100 text-blue-800 border-blue-200" variant="secondary">
        <Clock className="h-3 w-3 mr-1" />
        In Progress
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-card border-border/50">
        <CardHeader>
          <CardTitle className="text-xl">My Series</CardTitle>
          <CardDescription>
            Browse your teaching series and export them as curriculum documents
          </CardDescription>
        </CardHeader>
      </Card>

      {allSeries.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {allSeries.map((series) => {
            const fallbackCount = series.lesson_summaries?.length ?? 0;
            const isExpanded = expandedSeriesId === series.id;
            const displayCount = isExpanded ? seriesLessons.length : (lessonCounts[series.id] ?? fallbackCount);
            const progressPercent = Math.round((displayCount / series.total_lessons) * 100);

            return (
              <Card key={series.id} className="group hover:shadow-glow transition-all duration-normal bg-gradient-card">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {series.series_name}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {displayCount} of {series.total_lessons} lessons
                      </CardDescription>
                    </div>
                    <button
                      onClick={() => handleTogglePin(series.id, series.pin_order)}
                      className={`shrink-0 cursor-pointer transition-colors ${
                        series.pin_order != null
                          ? 'text-yellow-400 hover:text-yellow-500'
                          : 'text-muted-foreground hover:text-yellow-400'
                      }`}
                      title={series.pin_order != null ? (series.pin_order === 1 ? 'Unpin series' : 'Move to top') : 'Pin to top'}
                    >
                      <Pin className={`h-4 w-4 ${series.pin_order != null ? 'fill-yellow-400' : ''}`} />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                    {getStatusBadge(series)}
                  </div>

                  <div className="mt-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ width: progressPercent + '%' }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {progressPercent}% complete
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      Created {formatDate(series.created_at)}
                    </span>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <SeriesExportButton series={series} tier={tier} />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleExpand(series.id)}
                      className="gap-1"
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      Lessons
                    </Button>
                    {deleteConfirmId === series.id ? (
                      <div className="flex items-center gap-1.5 ml-auto">
                        <span className="text-xs text-destructive font-medium">Delete series?</span>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={deleting}
                          onClick={() => handleDeleteSeries(series.id)}
                        >
                          {deleting ? 'Deleting...' : 'Yes, delete'}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          disabled={deleting}
                          onClick={() => setDeleteConfirmId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 ml-auto text-muted-foreground hover:text-destructive"
                        onClick={() => setDeleteConfirmId(series.id)}
                        title="Delete series"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Expanded lesson list with reorder controls */}
                  {isExpanded && (
                    <div className="mt-4 border-t pt-3 space-y-1">
                      {lessonsLoading ? (
                        <div className="flex items-center justify-center py-4">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                        </div>
                      ) : seriesLessons.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-3">No lessons in this series yet.</p>
                      ) : (
                        seriesLessons.map((lesson, index) => (
                          <div
                            key={lesson.id}
                            className="flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer hover:bg-muted transition-colors"
                            onClick={() => navigate(ROUTES.DASHBOARD, { state: { tab: 'enhance', viewLessonId: lesson.id, origin: 'series', originSeriesId: series.id } })}
                          >
                            <span className="text-xs font-medium text-muted-foreground w-5 text-center shrink-0">
                              {lesson.series_lesson_number}
                            </span>
                            <span className="text-sm line-clamp-2 flex-1 min-w-0">
                              {lesson.title || 'Untitled Lesson'}
                            </span>
                            <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                disabled={index === 0 || reordering}
                                onClick={() => handleReorder(index, 'up')}
                                title="Move up"
                              >
                                <ArrowUp className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                disabled={index === seriesLessons.length - 1 || reordering}
                                onClick={() => handleReorder(index, 'down')}
                                title="Move down"
                              >
                                <ArrowDown className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="bg-gradient-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <div className="space-y-2 text-center">
              <h3 className="text-lg font-semibold">No series yet</h3>
              <p className="text-muted-foreground max-w-md">
                Create a teaching series from the Build Lesson tab by selecting
                "Part of Series" to plan a multi-week study.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
