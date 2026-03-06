// ============================================================================
// SeriesExportModal.tsx
// Location: src/components/SeriesExport/SeriesExportModal.tsx
//
// Modal dialog for series export. Presents:
//   - Format picker (DOCX / PDF / Booklet PDF radio buttons)
//   - "Recommended for printing" / "Saddle-stitch" labels on PDF options
//   - Option checkboxes (handout booklet — hidden when Booklet PDF selected,
//     because the Booklet PDF format IS the handout booklet)
//   - Export button disabled until format is chosen
//   - Inline progress indicator while exporting
//
// Opens from SeriesExportButton. Calls useSeriesExport hook.
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  SeriesExportOptions,
  SeriesExportFormat,
  SERIES_EXPORT_FORMATS,
  SERIES_EXPORT_FORMAT_LABELS,
  SERIES_EXPORT_FORMAT_SUBTITLES,
  SERIES_EXPORT_UI,
} from '@/constants/seriesExportConfig';
import { useSeriesExport } from '@/hooks/useSeriesExport';
import { SeriesExportProgress } from './SeriesExportProgress';

// ============================================================================
// PROPS
// ============================================================================

interface SeriesExportModalProps {
  series: LessonSeries;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SeriesExportModal({
  series,
  onClose,
}: SeriesExportModalProps): React.ReactElement {
  const [selectedFormat, setSelectedFormat] = useState<SeriesExportFormat | null>(null);
  const [includeHandoutBooklet, setIncludeHandoutBooklet] = useState(true);

  const { exportSeries, state, reset } = useSeriesExport();

  // When Booklet PDF is selected, the handout section is always included
  // (the format IS the booklet). Auto-enforce this silently.
  const isBookletFormat = selectedFormat === SERIES_EXPORT_FORMATS.BOOKLET_PDF;

  useEffect(() => {
    if (isBookletFormat) {
      setIncludeHandoutBooklet(true);
    }
  }, [isBookletFormat]);

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  function handleFormatChange(format: SeriesExportFormat): void {
    setSelectedFormat(format);
  }

  function handleHandoutBookletChange(
    e: React.ChangeEvent<HTMLInputElement>
  ): void {
    setIncludeHandoutBooklet(e.target.checked);
  }

  async function handleExport(): Promise<void> {
    if (!selectedFormat) return;

    const options: SeriesExportOptions = {
      format: selectedFormat,
      // Booklet PDF always includes handouts and omits Section 8 from chapters
      includeHandoutBooklet: isBookletFormat ? true : includeHandoutBooklet,
      omitSection8FromChapters: isBookletFormat ? true : includeHandoutBooklet,
    };

    const success = await exportSeries(series, options);
    if (success) {
      toast.success(SERIES_EXPORT_UI.successMessage);
      onClose();
    }
  }

  function handleClose(): void {
    if (!state.isExporting) {
      reset();
      onClose();
    }
  }

  const canExport = selectedFormat !== null;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    /* Backdrop */
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="series-export-modal-title"
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50 backdrop-blur-sm
        p-4
      "
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      {/* Panel */}
      <div className="
        relative w-full max-w-md
        bg-card text-card-foreground
        rounded-lg shadow-xl
        p-6
      ">
        {/* Close button */}
        {!state.isExporting && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close export dialog"
            className="
              absolute top-4 right-4
              text-muted-foreground hover:text-foreground
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
              rounded-sm transition-colors
            "
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        {/* Header */}
        <div className="mb-5">
          <h2
            id="series-export-modal-title"
            className="text-lg font-semibold text-foreground"
          >
            {SERIES_EXPORT_UI.modalTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {SERIES_EXPORT_UI.modalSubtitle}
          </p>
          <p className="mt-1 text-sm font-medium text-foreground truncate">
            {series.series_name}
          </p>
        </div>

        {/* Progress indicator */}
        {state.isExporting && state.progressStepId && (
          <SeriesExportProgress currentStepId={state.progressStepId} />
        )}

        {/* Error message */}
        {state.error && !state.isExporting && (
          <div
            role="alert"
            className="
              mb-4 px-4 py-3 rounded-md
              bg-destructive/10 border border-destructive/30
              text-sm text-destructive
            "
          >
            {state.error}
          </div>
        )}

        {/* Form */}
        {!state.isExporting && (
          <div className="space-y-5">
            {/* Format picker */}
            <fieldset>
              <legend className="text-sm font-medium text-foreground mb-2">
                {SERIES_EXPORT_UI.formatLabel}
              </legend>
              <div className="space-y-2">
                {(
                  Object.values(SERIES_EXPORT_FORMATS) as SeriesExportFormat[]
                ).map((fmt) => {
                  const subtitle  = SERIES_EXPORT_FORMAT_SUBTITLES[fmt];
                  const isSelected = selectedFormat === fmt;
                  return (
                    <label
                      key={fmt}
                      className={
                        'flex items-center gap-3 cursor-pointer ' +
                        'p-3 rounded-md border transition-colors ' +
                        (isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50')
                      }
                    >
                      <input
                        type="radio"
                        name="series-export-format"
                        value={fmt}
                        checked={isSelected}
                        onChange={() => handleFormatChange(fmt)}
                        className="accent-primary"
                      />
                      <div>
                        <span className="text-sm text-foreground">
                          {SERIES_EXPORT_FORMAT_LABELS[fmt]}
                        </span>
                        {subtitle && (
                          <span className="text-xs text-emerald-600 ml-2 font-medium">
                            {subtitle}
                          </span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              {!canExport && (
                <p className="text-xs text-muted-foreground mt-2">
                  {SERIES_EXPORT_UI.formatRequiredHint}
                </p>
              )}
            </fieldset>

            {/* Options — hidden when Booklet PDF is selected (always includes handouts) */}
            {!isBookletFormat && (
              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">
                  {SERIES_EXPORT_UI.optionsLabel}
                </legend>
                <label className={
                  'flex items-start gap-3 cursor-pointer ' +
                  'p-3 rounded-md border transition-colors ' +
                  (includeHandoutBooklet
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50')
                }>
                  <input
                    type="checkbox"
                    checked={includeHandoutBooklet}
                    onChange={handleHandoutBookletChange}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">
                      {SERIES_EXPORT_UI.handoutBookletLabel}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">
                      {SERIES_EXPORT_UI.handoutBookletDescription}
                    </span>
                  </div>
                </label>
              </fieldset>
            )}

            {/* Booklet note — shown when Booklet PDF is selected */}
            {isBookletFormat && (
              <p className="text-xs text-muted-foreground px-1">
                The Booklet PDF includes the Group Handout Section. Print double-sided,
                fold in half, and staple at the spine.
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleClose}
                className="
                  flex-1 px-4 py-2 text-sm font-medium rounded-md
                  border border-border
                  text-foreground bg-background
                  hover:bg-muted transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                "
              >
                {SERIES_EXPORT_UI.cancelButton}
              </button>
              <button
                type="button"
                onClick={handleExport}
                disabled={!canExport}
                className={
                  'flex-1 px-4 py-2 text-sm font-medium rounded-md ' +
                  'transition-colors ' +
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
                  (canExport
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed')
                }
              >
                {SERIES_EXPORT_UI.exportButton}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
