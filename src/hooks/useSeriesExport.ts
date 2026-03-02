// ============================================================================
// useSeriesExport.ts
// Location: src/hooks/useSeriesExport.ts
//
// Orchestration hook for the Series eBook / Curriculum Quarterly Export.
// Responsibilities:
//   1. Accept a LessonSeries and export options from the UI
//   2. Fetch all full Lesson records for the series from Supabase
//   3. Delegate to buildSeriesDocx or buildSeriesPdf based on format
//   4. Trigger browser download via Blob URL
//   5. Expose loading state and progress step to SeriesExportProgress
//
// ARCHITECTURE: Frontend drives backend -- all state managed here.
// No Edge Function call in Phase A/B. Phase C will add AI intro generation.
// ============================================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  SeriesExportOptions,
  SeriesExportFormat,
  SERIES_EXPORT_FORMATS,
  SERIES_EXPORT_PROGRESS_STEPS,
  SeriesExportProgressStepId,
  buildSeriesExportFilename,
  SERIES_EXPORT_FORMAT_MIME,
  SERIES_EXPORT_UI,
} from '@/constants/seriesExportConfig';
import { buildSeriesDocx } from '@/utils/export/buildSeriesDocx';
import { buildSeriesPdf } from '@/utils/export/buildSeriesPdf';

// ============================================================================
// TYPES
// ============================================================================

export interface SeriesExportState {
  isExporting: boolean;
  progressStepId: SeriesExportProgressStepId | null;
  error: string | null;
}

export interface UseSeriesExportReturn {
  exportSeries: (
    series: LessonSeries,
    options: SeriesExportOptions
  ) => Promise<boolean>;
  state: SeriesExportState;
  reset: () => void;
}

// ============================================================================
// HOOK
// ============================================================================

export function useSeriesExport(): UseSeriesExportReturn {
  const [state, setState] = useState<SeriesExportState>({
    isExporting: false,
    progressStepId: null,
    error: null,
  });

  const setStep = useCallback((stepId: SeriesExportProgressStepId): void => {
    setState((prev) => ({ ...prev, progressStepId: stepId }));
  }, []);

  const reset = useCallback((): void => {
    setState({ isExporting: false, progressStepId: null, error: null });
  }, []);

  const exportSeries = useCallback(
    async (series: LessonSeries, options: SeriesExportOptions): Promise<boolean> => {
      setState({ isExporting: true, progressStepId: 'loading', error: null });

      try {
        // ------------------------------------------------------------------
        // Step 1: Fetch all lesson records for this series
        // The lesson_summaries array on LessonSeries contains lessonId values.
        // We fetch the full Lesson rows from Supabase using those IDs.
        // ------------------------------------------------------------------
        setStep('loading');

        const lessonIds: string[] = (series.lesson_summaries ?? [])
          .sort((a, b) => a.lessonNumber - b.lessonNumber)
          .map((s) => s.lessonId);

        if (lessonIds.length === 0) {
          setState({
            isExporting: false,
            progressStepId: null,
            error: SERIES_EXPORT_UI.emptySeriesWarning,
          });
          return false;
        }

        const { data: lessons, error: fetchError } = await supabase
          .from('lessons')
          .select('*')
          .in('id', lessonIds);

        if (fetchError || !lessons) {
          throw new Error(fetchError?.message ?? 'Failed to load lessons.');
        }

        // Re-sort lessons by their position in lesson_summaries (Supabase
        // does not guarantee order from .in() queries).
        const orderedLessons: Lesson[] = lessonIds
          .map((id) => lessons.find((l) => l.id === id))
          .filter((l): l is Lesson => l !== undefined);

        // ------------------------------------------------------------------
        // Step 2: Build the document
        // ------------------------------------------------------------------
        setStep('cover');

        let buffer: ArrayBuffer;

        if (options.format === SERIES_EXPORT_FORMATS.DOCX) {
          setStep('cover');
          buffer = await buildSeriesDocx(series, orderedLessons, options, setStep);
        } else {
          setStep('cover');
          buffer = await buildSeriesPdf(series, orderedLessons, options, setStep);
        }

        // ------------------------------------------------------------------
        // Step 3: Trigger browser download
        // ------------------------------------------------------------------
        setStep('finalizing');

        const filename = buildSeriesExportFilename(series.series_name, options.format);
        const mimeType = SERIES_EXPORT_FORMAT_MIME[options.format];

        triggerDownload(buffer, filename, mimeType);

        setState({ isExporting: false, progressStepId: null, error: null });
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : SERIES_EXPORT_UI.errorMessage;
        setState({ isExporting: false, progressStepId: null, error: message });
        return false;
      }
    },
    [setStep]
  );

  return { exportSeries, state, reset };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Trigger a browser file download from an ArrayBuffer.
 * Uses the standard Blob URL pattern -- no server round-trip.
 */
function triggerDownload(
  buffer: ArrayBuffer,
  filename: string,
  mimeType: string
): void {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}