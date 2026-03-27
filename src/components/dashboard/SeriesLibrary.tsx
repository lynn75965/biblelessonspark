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
import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BookOpen, CheckCircle, Clock, Archive, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { useSeriesManager } from '@/hooks/useSeriesManager';
import { useSubscription } from '@/hooks/useSubscription';
import { isSeriesComplete, SERIES_STATUSES } from '@/constants/seriesConfig';
import { SeriesExportButton } from '@/components/SeriesExport/SeriesExportButton';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
  const expandConsumedRef = useRef(false);

  const [expandedSeriesId, setExpandedSeriesId] = useState<string | null>(null);
  const [seriesLessons, setSeriesLessons] = useState<SeriesLesson[]>([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    fetchAllSeries();
  }, []);

  // Auto-expand a series when navigated from "In Series" badge
  useEffect(() => {
    const targetId = (location.state as any)?.expandSeriesId;
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

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day:   'numeric',
      year:  'numeric',
    });
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
            const completedCount  = series.lesson_summaries?.length ?? 0;
            const progressPercent = Math.round((completedCount / series.total_lessons) * 100);
            const isExpanded = expandedSeriesId === series.id;

            return (
              <Card key={series.id} className="group hover:shadow-glow transition-all duration-normal bg-gradient-card">
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base sm:text-lg mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {series.series_name}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        {completedCount} of {series.total_lessons} lessons
                      </CardDescription>
                    </div>
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

                  <div className="flex gap-2">
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
                          <div key={lesson.id} className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors">
                            <span className="text-xs font-medium text-muted-foreground w-5 text-center shrink-0">
                              {lesson.series_lesson_number}
                            </span>
                            <span className="text-sm truncate flex-1 min-w-0">
                              {lesson.title || 'Untitled Lesson'}
                            </span>
                            <div className="flex gap-0.5 shrink-0">
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
