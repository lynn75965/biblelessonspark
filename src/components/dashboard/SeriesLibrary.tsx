/**
 * SeriesLibrary Component
 * Browse and manage lesson series with export capability
 *
 * SSOT Compliance:
 * - LessonSeries type from @/constants/seriesConfig
 * - isSeriesComplete() from @/constants/seriesConfig
 * - SERIES_STATUSES from @/constants/seriesConfig
 * - SeriesExportButton from @/components/SeriesExport/SeriesExportButton
 * - BookletPrintModal from @/components/SeriesExport/BookletPrintModal
 * - BOOKLET_UI from @/constants/bookletConfig
 * - useSubscription hook for tier gating
 *
 * Phase 28: Series Library Tab (March 2026)
 * FIX: March 2026 — switched from fetchActiveSeries (in_progress only)
 *   to fetchAllSeries (in_progress + completed) so completed series
 *   are visible.
 * ADDED: March 2026 — Print Class Booklet button (Personal Plan, gated)
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, CheckCircle, Clock, Archive, BookMarked, Lock } from "lucide-react";
import { useSeriesManager } from "@/hooks/useSeriesManager";
import { useSubscription } from "@/hooks/useSubscription";
import { isSeriesComplete, SERIES_STATUSES } from "@/constants/seriesConfig";
import { SeriesExportButton } from "@/components/SeriesExport/SeriesExportButton";
import { BookletPrintModal } from "@/components/SeriesExport/BookletPrintModal";
import { BOOKLET_UI } from "@/constants/bookletConfig";
import { hasFeatureAccess } from "@/constants/featureFlags";
import type { LessonSeries } from "@/constants/seriesConfig";

export function SeriesLibrary() {
  const { allSeries, isLoading, fetchAllSeries } = useSeriesManager();
  const { tier } = useSubscription();

  const [bookletSeries, setBookletSeries] = useState<LessonSeries | null>(null);

  const canPrintBooklet = hasFeatureAccess(tier, 'bookletPrint');

  useEffect(() => {
    fetchAllSeries();
  }, []);

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusBadge = (series: { status: string; lesson_summaries: any[]; total_lessons: number }) => {
    const complete = isSeriesComplete(series as any);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
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
            const completedCount = series.lesson_summaries?.length || 0;
            const progressPercent = Math.round((completedCount / series.total_lessons) * 100);

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
                        style={{ width: `${progressPercent}%` }}
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

                  <div className="flex flex-col gap-2">
                    {/* Existing curriculum export button */}
                    <SeriesExportButton series={series} tier={tier} />

                    {/* Print Class Booklet button */}
                    {canPrintBooklet ? (
                      <button
                        type="button"
                        onClick={() => setBookletSeries(series as LessonSeries)}
                        className="
                          w-full flex items-center justify-center gap-2
                          px-4 py-2 text-sm font-medium rounded-md
                          border border-border
                          text-foreground bg-background
                          hover:bg-muted transition-colors
                          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                        "
                      >
                        <BookMarked className="h-4 w-4 text-primary" aria-hidden="true" />
                        {BOOKLET_UI.buttonLabel}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        title={BOOKLET_UI.upgradePrompt}
                        className="
                          w-full flex items-center justify-center gap-2
                          px-4 py-2 text-sm font-medium rounded-md
                          border border-border
                          text-muted-foreground bg-muted/50
                          cursor-not-allowed
                        "
                      >
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        {BOOKLET_UI.buttonLabel}
                      </button>
                    )}
                  </div>
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
                Create a teaching series from the Build Lesson tab by selecting "Part of Series" to plan a multi-week study.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Booklet Print Modal — rendered at root level to avoid card clipping */}
      {bookletSeries && (
        <BookletPrintModal
          series={bookletSeries}
          onClose={() => setBookletSeries(null)}
        />
      )}
    </div>
  );
}
