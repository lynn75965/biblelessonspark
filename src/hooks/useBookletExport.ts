// ============================================================================
// useBookletExport.ts
// Location: src/hooks/useBookletExport.ts
//
// Orchestration hook for the Print Class Booklet feature.
// Fetches full lesson records, calls buildBookletPdf, triggers browser download.
//
// Follows the identical pattern as useSeriesExport.ts.
// All configuration imported from bookletConfig.ts (SSOT).
// ============================================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LessonSeries } from '@/constants/seriesConfig';
import type { Lesson } from '@/constants/contracts';
import {
  BookletOptions,
  BookletProgressStepId,
  BOOKLET_UI,
} from '@/constants/bookletConfig';
import { buildBookletPdf } from '@/utils/export/buildBookletPdf';

// ============================================================================
// STATE SHAPE
// ============================================================================

export interface BookletExportState {
  isExporting:      boolean;
  progressStepId:   BookletProgressStepId | null;
  error:            string | null;
}

const INITIAL_STATE: BookletExportState = {
  isExporting:    false,
  progressStepId: null,
  error:          null,
};

// ============================================================================
// HOOK
// ============================================================================

export function useBookletExport() {
  const [state, setState] = useState<BookletExportState>(INITIAL_STATE);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const exportBooklet = useCallback(async (
    series:  LessonSeries,
    options: BookletOptions
  ): Promise<boolean> => {

    setState({ isExporting: true, progressStepId: 'loading', error: null });

    try {
      // -- Fetch full lesson records for every lesson in the series ------------
      const lessonIds: string[] = (series.lesson_summaries ?? [])
        .map((s: any) => s.lessonId)
        .filter(Boolean);

      if (lessonIds.length === 0) {
        throw new Error('This series has no completed lessons to export.');
      }

      const { data: lessonRows, error: fetchError } = await supabase
        .from('lessons')
        .select('*')
        .in('id', lessonIds)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      if (!lessonRows || lessonRows.length === 0) {
        throw new Error('Could not load lesson content. Please try again.');
      }

      const lessons = lessonRows as Lesson[];

      // -- Build PDF ------------------------------------------------------------
      const buffer = await buildBookletPdf(
        series,
        lessons,
        options,
        (stepId: BookletProgressStepId) => {
          setState(prev => ({ ...prev, progressStepId: stepId }));
        }
      );

      // -- Trigger browser download ---------------------------------------------
      const blob = new Blob([buffer], { type: 'application/pdf' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const safeName = (series.series_name ?? 'Series')
        .replace(/[^a-zA-Z0-9\s-]/g, '')
        .replace(/\s+/g, '_')
        .slice(0, 60);
      a.href     = url;
      a.download = `${safeName}_Booklet.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setState(INITIAL_STATE);
      return true;

    } catch (err: unknown) {
      const message = err instanceof Error
        ? err.message
        : BOOKLET_UI.errorMessage;
      setState({ isExporting: false, progressStepId: null, error: message });
      return false;
    }
  }, []);

  return { exportBooklet, state, reset };
}

