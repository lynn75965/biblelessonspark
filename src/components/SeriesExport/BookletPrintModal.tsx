// ============================================================================
// BookletPrintModal.tsx
// Location: src/components/SeriesExport/BookletPrintModal.tsx
//
// Modal for the Print Class Booklet feature.
// Presents:
//   - Color scheme picker (5 named swatches)
//   - Group Handout toggle
//   - Print instructions hint
//   - Inline progress while building
//
// Opens from BookletPrintButton in SeriesLibrary.
// Calls useBookletExport hook -- same pattern as SeriesExportModal.
// All copy imported from bookletConfig.ts (SSOT).
// ============================================================================

import React, { useState } from 'react';
import { X, BookMarked } from 'lucide-react';
import { toast } from 'sonner';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  BookletOptions,
  BookletColorSchemeKey,
  BOOKLET_COLOR_SCHEMES,
  BOOKLET_DEFAULT_OPTIONS,
  BOOKLET_UI,
  BOOKLET_PROGRESS_STEPS,
} from '@/constants/bookletConfig';
import { useBookletExport } from '@/hooks/useBookletExport';

// ============================================================================
// PROPS
// ============================================================================

interface BookletPrintModalProps {
  series:  LessonSeries;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function BookletPrintModal({
  series,
  onClose,
}: BookletPrintModalProps): React.ReactElement {

  const [colorScheme, setColorScheme] = useState<BookletColorSchemeKey>(
    BOOKLET_DEFAULT_OPTIONS.colorScheme
  );
  const [includeHandout, setIncludeHandout] = useState<boolean>(
    BOOKLET_DEFAULT_OPTIONS.includeHandoutSection
  );

  const { exportBooklet, state, reset } = useBookletExport();

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  async function handlePrint(): Promise<void> {
    const options: BookletOptions = {
      colorScheme,
      includeHandoutSection: includeHandout,
      previewMode: false,   // teachers always get clean print-ready output
    };
    const success = await exportBooklet(series, options);
    if (success) {
      toast.success(BOOKLET_UI.successMessage);
      onClose();
    }
  }

  function handleClose(): void {
    if (!state.isExporting) {
      reset();
      onClose();
    }
  }

  // --------------------------------------------------------------------------
  // Progress label
  // --------------------------------------------------------------------------

  const progressLabel = state.progressStepId
    ? (BOOKLET_PROGRESS_STEPS.find(s => s.id === state.progressStepId)?.label
        ?? BOOKLET_UI.progressLabel)
    : BOOKLET_UI.progressLabel;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="booklet-modal-title"
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/50 backdrop-blur-sm
        p-4
      "
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
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
            aria-label="Close booklet dialog"
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
        <div className="mb-5 flex items-start gap-3">
          <BookMarked className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <h2 id="booklet-modal-title" className="text-lg font-semibold text-foreground">
              {BOOKLET_UI.modalTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {BOOKLET_UI.modalSubtitle}
            </p>
            <p className="mt-1 text-sm font-medium text-foreground truncate">
              {series.series_name}
            </p>
          </div>
        </div>

        {/* Progress (shown while building) */}
        {state.isExporting && (
          <div className="mb-5 space-y-3">
            <p className="text-sm text-muted-foreground">{progressLabel}</p>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-2 rounded-full animate-pulse w-3/4" />
            </div>
            {BOOKLET_PROGRESS_STEPS.map((step) => (
              <div
                key={step.id}
                className={
                  'flex items-center gap-2 text-xs ' +
                  (step.id === state.progressStepId
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground')
                }
              >
                <span className={
                  'h-1.5 w-1.5 rounded-full ' +
                  (step.id === state.progressStepId ? 'bg-primary' : 'bg-muted-foreground/30')
                } />
                {step.label}
              </div>
            ))}
          </div>
        )}

        {/* Error */}
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

        {/* Form (hidden while building) */}
        {!state.isExporting && (
          <div className="space-y-5">

            {/* Color scheme picker */}
            <fieldset>
              <legend className="text-sm font-medium text-foreground mb-1">
                {BOOKLET_UI.colorSchemeLabel}
              </legend>
              <p className="text-xs text-muted-foreground mb-3">
                {BOOKLET_UI.colorSchemeHint}
              </p>
              <div className="space-y-2">
                {(Object.entries(BOOKLET_COLOR_SCHEMES) as [BookletColorSchemeKey, typeof BOOKLET_COLOR_SCHEMES[string]][]).map(
                  ([key, scheme]) => {
                    const isSelected = colorScheme === key;
                    return (
                      <label
                        key={key}
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
                          name="booklet-color-scheme"
                          value={key}
                          checked={isSelected}
                          onChange={() => setColorScheme(key)}
                          className="accent-primary"
                        />
                        {/* Color swatches */}
                        <span className="flex gap-1 shrink-0">
                          <span
                            className="h-4 w-4 rounded-sm border border-black/10"
                            style={{ backgroundColor: scheme.heading }}
                            title="Heading color"
                          />
                          <span
                            className="h-4 w-4 rounded-sm border border-black/10"
                            style={{ backgroundColor: scheme.accent }}
                            title="Accent color"
                          />
                        </span>
                        <span className="text-sm text-foreground">
                          {scheme.label}
                        </span>
                      </label>
                    );
                  }
                )}
              </div>
            </fieldset>

            {/* Student handout toggle */}
            <fieldset>
              <legend className="text-sm font-medium text-foreground mb-2">
                Options
              </legend>
              <label className={
                'flex items-start gap-3 cursor-pointer ' +
                'p-3 rounded-md border transition-colors ' +
                (includeHandout
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50')
              }>
                <input
                  type="checkbox"
                  checked={includeHandout}
                  onChange={(e) => setIncludeHandout(e.target.checked)}
                  className="mt-0.5 accent-primary"
                />
                <div>
                  <span className="text-sm font-medium text-foreground block">
                    {BOOKLET_UI.handoutLabel}
                  </span>
                  <span className="text-xs text-muted-foreground mt-0.5 block">
                    {BOOKLET_UI.handoutDesc}
                  </span>
                </div>
              </label>
            </fieldset>

            {/* Print instructions hint */}
            <p className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2">
              <span className="font-medium text-foreground">To print: </span>
              {BOOKLET_UI.printInstructions}
            </p>

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
                {BOOKLET_UI.cancelButton}
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="
                  flex-1 px-4 py-2 text-sm font-medium rounded-md
                  bg-primary text-primary-foreground
                  hover:bg-primary/90 transition-colors
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                "
              >
                {BOOKLET_UI.printButton}
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
