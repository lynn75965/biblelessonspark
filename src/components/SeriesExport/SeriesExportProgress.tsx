// ============================================================================
// SeriesExportProgress.tsx
// Location: src/components/SeriesExport/SeriesExportProgress.tsx
//
// SSOT: SERIES_EXPORT_PROGRESS_STEPS is a const object -- not an array.
// This component derives an ordered array from it at module level.
// ============================================================================

import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  SERIES_EXPORT_PROGRESS_STEPS,
  SERIES_EXPORT_PROGRESS_STEP_LABELS,
  SeriesExportProgressStepId,
} from '@/constants/seriesExportConfig';

const ORDERED_STEP_IDS: SeriesExportProgressStepId[] = [
  SERIES_EXPORT_PROGRESS_STEPS.PREPARING,
  SERIES_EXPORT_PROGRESS_STEPS.COVER,
  SERIES_EXPORT_PROGRESS_STEPS.TOC,
  SERIES_EXPORT_PROGRESS_STEPS.LESSONS,
  SERIES_EXPORT_PROGRESS_STEPS.HANDOUT,
  SERIES_EXPORT_PROGRESS_STEPS.FINALIZING,
];

interface SeriesExportProgressProps {
  currentStepId: SeriesExportProgressStepId;
}

export function SeriesExportProgress({
  currentStepId,
}: SeriesExportProgressProps): React.ReactElement {
  const currentIndex = ORDERED_STEP_IDS.indexOf(currentStepId);
  const totalSteps   = ORDERED_STEP_IDS.length;
  const label        = SERIES_EXPORT_PROGRESS_STEP_LABELS[currentStepId]
    ?? 'Preparing your document...';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Export progress"
      className="py-4 space-y-4"
    >
      <div className="flex items-center gap-3">
        <Loader2
          className="h-5 w-5 text-primary animate-spin flex-shrink-0"
          aria-hidden="true"
        />
        <span className="text-sm text-foreground font-medium">
          {label}
        </span>
      </div>
      <div className="space-y-1">
        <div
          className="h-1.5 w-full bg-muted rounded-full overflow-hidden"
          role="progressbar"
          aria-valuenow={currentIndex + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
        >
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${Math.round(((currentIndex + 1) / totalSteps) * 100)}%`,
            }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-right">
          Step {currentIndex + 1} of {totalSteps}
        </p>
      </div>
    </div>
  );
}