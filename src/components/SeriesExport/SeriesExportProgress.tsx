// ============================================================================
// SeriesExportProgress.tsx
// Location: src/components/SeriesExport/SeriesExportProgress.tsx
//
// Inline progress indicator shown inside SeriesExportModal while the
// document is being compiled. Displays the current step label and a
// simple animated spinner. No external dependencies.
// ============================================================================

import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  SERIES_EXPORT_PROGRESS_STEPS,
  SeriesExportProgressStepId,
} from '@/constants/seriesExportConfig';

// ============================================================================
// PROPS
// ============================================================================

interface SeriesExportProgressProps {
  currentStepId: SeriesExportProgressStepId;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SeriesExportProgress({
  currentStepId,
}: SeriesExportProgressProps): React.ReactElement {
  const currentStep = SERIES_EXPORT_PROGRESS_STEPS.find(
    (s) => s.id === currentStepId
  );

  const currentIndex = SERIES_EXPORT_PROGRESS_STEPS.findIndex(
    (s) => s.id === currentStepId
  );

  const totalSteps = SERIES_EXPORT_PROGRESS_STEPS.length;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Export progress"
      className="py-4 space-y-4"
    >
      {/* Spinner and current step label */}
      <div className="flex items-center gap-3">
        <Loader2
          className="h-5 w-5 text-primary animate-spin flex-shrink-0"
          aria-hidden="true"
        />
        <span className="text-sm text-foreground font-medium">
          {currentStep?.label ?? 'Preparing your document\u2026'}
        </span>
      </div>

      {/* Progress bar */}
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
