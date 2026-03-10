// ============================================================================
// useSeriesExport.ts
// Location: src/hooks/useSeriesExport.ts
// ============================================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  SeriesExportOptions,
  SeriesExportFormat,
  SERIES_EXPORT_FORMATS,
  SERIES_EXPORT_LAYOUTS,
  SERIES_EXPORT_PROGRESS_STEPS,
  SeriesExportProgressStepId,
  buildSeriesExportFilename,
  SERIES_EXPORT_FORMAT_MIME,
  SERIES_EXPORT_UI,
} from '@/constants/seriesExportConfig';
import { buildSeriesDocx } from '@/utils/export/buildSeriesDocx';
import { buildSeriesPdf, buildBookletPdf } from '@/utils/export/buildSeriesPdf';

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
      setState({ isExporting: true, progressStepId: SERIES_EXPORT_PROGRESS_STEPS.PREPARING, error: null });

      try {
        setStep(SERIES_EXPORT_PROGRESS_STEPS.PREPARING);

        const lessonIds: string[] = (series.lesson_summaries ?? [])
          .sort((a, b) => a.lessonNumber - b.lessonNumber)
          .map((s) => s.lessonId);

        if (lessonIds.length === 0) {
          setState({
            isExporting: false,
            progressStepId: null,
            error: 'This series has no lessons to export. Add lessons before exporting.',
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

        const orderedLessons: Lesson[] = lessonIds
          .map((id) => lessons.find((l) => l.id === id))
          .filter((l): l is Lesson => l !== undefined);

        setStep(SERIES_EXPORT_PROGRESS_STEPS.COVER);

        let buffer: ArrayBuffer;

        if (options.format === SERIES_EXPORT_FORMATS.DOCX) {
          buffer = await buildSeriesDocx(series, orderedLessons, options, setStep);
        } else if (options.format === SERIES_EXPORT_FORMATS.BOOKLET || options.layout === SERIES_EXPORT_LAYOUTS.BOOKLET) {
          buffer = await buildBookletPdf(series, orderedLessons, options, setStep);
        } else {
          buffer = await buildSeriesPdf(series, orderedLessons, options, setStep);
        }

        setStep(SERIES_EXPORT_PROGRESS_STEPS.FINALIZING);

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