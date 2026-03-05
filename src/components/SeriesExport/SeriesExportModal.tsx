// ============================================================================
// SeriesExportModal.tsx
// Location: src/components/SeriesExport/SeriesExportModal.tsx
//
// Modal for series export. Section order:
//   1. Page Layout   (required -- Full Page / Booklet / Tri-Fold)
//   2. Document Style (color scheme + font -- cohesive single section)
//   3. Export Format  (required -- PDF / DOCX)
//   4. Document Options (handout checkbox -- hidden for Tri-Fold)
//   5. Actions
//
// Color and font are presented as one unified "Document Style" decision,
// not as separate afterthought fields. Default: Forest & Gold / Calibri.
// ============================================================================

import React, { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import type { LessonSeries } from "@/constants/seriesConfig";
import {
  SeriesExportOptions,
  SeriesExportFormat,
  SeriesExportLayout,
  SeriesExportFont,
  SeriesColorSchemeId,
  SERIES_EXPORT_FORMATS,
  SERIES_EXPORT_LAYOUTS,
  SERIES_EXPORT_FORMAT_LABELS,
  SERIES_EXPORT_FORMAT_SUBTITLES,
  SERIES_EXPORT_FONT_OPTIONS,
  SERIES_EXPORT_DEFAULT_FONT,
  SERIES_COLOR_SCHEMES,
  SERIES_DEFAULT_COLOR_SCHEME,
  SERIES_EXPORT_UI,
} from "@/constants/seriesExportConfig";
import { useSeriesExport } from "@/hooks/useSeriesExport";
import { SeriesExportProgress } from "./SeriesExportProgress";

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
  const [selectedLayout, setSelectedLayout] = useState<SeriesExportLayout | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<SeriesExportFormat | null>(null);
  const [selectedFont, setSelectedFont] = useState<SeriesExportFont>(SERIES_EXPORT_DEFAULT_FONT);
  const [selectedScheme, setSelectedScheme] = useState<SeriesColorSchemeId>(SERIES_DEFAULT_COLOR_SCHEME);
  const [includeHandoutBooklet, setIncludeHandoutBooklet] = useState(true);

  const { exportSeries, state, reset } = useSeriesExport();
  const isTrifold = selectedLayout === SERIES_EXPORT_LAYOUTS.TRIFOLD;

  // --------------------------------------------------------------------------
  // Handlers
  // --------------------------------------------------------------------------

  function handleLayoutChange(layout: SeriesExportLayout): void {
    setSelectedLayout(layout);
    if (layout === SERIES_EXPORT_LAYOUTS.TRIFOLD) {
      setSelectedFormat(SERIES_EXPORT_FORMATS.PDF);
    }
  }

  function handleFormatChange(format: SeriesExportFormat): void {
    if (isTrifold && format === SERIES_EXPORT_FORMATS.DOCX) return;
    setSelectedFormat(format);
  }

  async function handleExport(): Promise<void> {
    if (!selectedLayout || !selectedFormat) return;
    const effectiveBooklet = isTrifold ? false : includeHandoutBooklet;
    const options: SeriesExportOptions = {
      format: selectedFormat,
      layout: selectedLayout,
      font: selectedFont,
      colorScheme: selectedScheme,
      includeHandoutBooklet: effectiveBooklet,
      omitSection8FromChapters: effectiveBooklet,
    };
    const success = await exportSeries(series, options);
    if (success) {
      toast.success(SERIES_EXPORT_UI.successMessage);
      onClose();
    }
  }

  function handleClose(): void {
    if (!state.isExporting) { reset(); onClose(); }
  }

  const canExport = selectedLayout !== null && selectedFormat !== null;

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="series-export-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full max-w-lg bg-card text-card-foreground rounded-lg shadow-xl p-6 max-h-[90vh] overflow-y-auto">

        {/* Close button */}
        {!state.isExporting && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close export dialog"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm transition-colors"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        {/* Header */}
        <div className="mb-5">
          <h2 id="series-export-modal-title" className="text-lg font-semibold text-foreground">
            {SERIES_EXPORT_UI.modalTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{SERIES_EXPORT_UI.modalSubtitle}</p>
          <p className="mt-1 text-sm font-medium text-foreground truncate">{series.series_name}</p>
        </div>

        {/* Progress */}
        {state.isExporting && state.progressStepId && (
          <SeriesExportProgress currentStepId={state.progressStepId} />
        )}

        {/* Error */}
        {state.error && !state.isExporting && (
          <div role="alert" className="mb-4 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {/* Form */}
        {!state.isExporting && (
          <div className="space-y-5">

            {/* ---- 1. Page Layout ----------------------------------------- */}
            <fieldset>
              <legend className="text-sm font-medium text-foreground mb-2">
                {SERIES_EXPORT_UI.layoutLabel}
              </legend>
              <div className="space-y-2">

                {/* Full Page */}
                <label className={
                  "flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors " +
                  (selectedLayout === SERIES_EXPORT_LAYOUTS.FULL_PAGE
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50")
                }>
                  <input
                    type="radio" name="series-export-layout"
                    value={SERIES_EXPORT_LAYOUTS.FULL_PAGE}
                    checked={selectedLayout === SERIES_EXPORT_LAYOUTS.FULL_PAGE}
                    onChange={() => handleLayoutChange(SERIES_EXPORT_LAYOUTS.FULL_PAGE)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <span className="text-sm text-foreground block">{SERIES_EXPORT_UI.layoutFullPageLabel}</span>
                    <span className="text-xs text-muted-foreground block">{SERIES_EXPORT_UI.layoutFullPageDescription}</span>
                  </div>
                </label>

                {/* Booklet */}
                <label className={
                  "flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors " +
                  (selectedLayout === SERIES_EXPORT_LAYOUTS.BOOKLET
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50")
                }>
                  <input
                    type="radio" name="series-export-layout"
                    value={SERIES_EXPORT_LAYOUTS.BOOKLET}
                    checked={selectedLayout === SERIES_EXPORT_LAYOUTS.BOOKLET}
                    onChange={() => handleLayoutChange(SERIES_EXPORT_LAYOUTS.BOOKLET)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <span className="text-sm text-foreground block">{SERIES_EXPORT_UI.layoutBookletLabel}</span>
                    <span className="text-xs text-muted-foreground block">{SERIES_EXPORT_UI.layoutBookletDescription}</span>
                    <span className="text-xs text-emerald-600 block font-medium">{SERIES_EXPORT_UI.layoutBookletSubtitle}</span>
                  </div>
                </label>

                {/* Tri-Fold */}
                <label className={
                  "flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors " +
                  (isTrifold
                    ? "border-primary bg-primary/5"
                    : "border-border hover:bg-muted/50")
                }>
                  <input
                    type="radio" name="series-export-layout"
                    value={SERIES_EXPORT_LAYOUTS.TRIFOLD}
                    checked={isTrifold}
                    onChange={() => handleLayoutChange(SERIES_EXPORT_LAYOUTS.TRIFOLD)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <span className="text-sm text-foreground block">{SERIES_EXPORT_UI.layoutTrifoldLabel}</span>
                    <span className="text-xs text-muted-foreground block">{SERIES_EXPORT_UI.layoutTrifoldDescription}</span>
                    <span className="text-xs text-amber-600 block font-medium">{SERIES_EXPORT_UI.layoutTrifoldSubtitle}</span>
                  </div>
                </label>

              </div>
              {selectedLayout === null && (
                <p className="text-xs text-muted-foreground mt-2">{SERIES_EXPORT_UI.layoutRequiredHint}</p>
              )}
            </fieldset>

            {/* ---- 2. Document Style (color + font together) --------------- */}
            <fieldset className="rounded-md border border-border p-4">
              <legend className="text-sm font-semibold text-foreground px-1">
                {SERIES_EXPORT_UI.styleLabel}
              </legend>

              {/* Color Scheme */}
              <p className="text-xs text-muted-foreground mb-2">{SERIES_EXPORT_UI.colorSchemeLabel}</p>
              <div className="space-y-1.5 mb-4">
                {SERIES_COLOR_SCHEMES.map((scheme) => {
                  const isSelected = selectedScheme === scheme.id;
                  return (
                    <label
                      key={scheme.id}
                      className={
                        "flex items-center gap-3 cursor-pointer px-3 py-2 rounded-md border transition-colors " +
                        (isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50")
                      }
                    >
                      <input
                        type="radio" name="series-color-scheme"
                        value={scheme.id}
                        checked={isSelected}
                        onChange={() => setSelectedScheme(scheme.id as SeriesColorSchemeId)}
                        className="accent-primary"
                      />
                      <span className="flex items-center gap-1.5">
                        <span
                          className="inline-block w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: "#" + scheme.primary }}
                        />
                        <span
                          className="inline-block w-3.5 h-3.5 rounded-full border border-black/10 flex-shrink-0"
                          style={{ backgroundColor: "#" + scheme.accent }}
                        />
                      </span>
                      <span className="text-sm text-foreground">{scheme.label}</span>
                    </label>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="border-t border-border my-3" />

              {/* Font */}
              <p className="text-xs text-muted-foreground mb-2">{SERIES_EXPORT_UI.fontLabel}</p>
              <div className="grid grid-cols-2 gap-2">
                {SERIES_EXPORT_FONT_OPTIONS.map((fontOpt) => {
                  const isSelected = selectedFont === fontOpt.id;
                  return (
                    <label
                      key={fontOpt.id}
                      className={
                        "flex items-center gap-2 cursor-pointer px-3 py-2 rounded-md border transition-colors " +
                        (isSelected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-muted/50")
                      }
                    >
                      <input
                        type="radio" name="series-export-font"
                        value={fontOpt.id}
                        checked={isSelected}
                        onChange={() => setSelectedFont(fontOpt.id)}
                        className="accent-primary"
                      />
                      <span className="text-sm text-foreground">{fontOpt.label}</span>
                    </label>
                  );
                })}
              </div>

            </fieldset>

            {/* ---- 3. Export Format --------------------------------------- */}
            <fieldset>
              <legend className="text-sm font-medium text-foreground mb-2">
                {SERIES_EXPORT_UI.formatLabel}
              </legend>
              <div className="space-y-2">
                {(Object.values(SERIES_EXPORT_FORMATS) as SeriesExportFormat[]).map((fmt) => {
                  const subtitle = SERIES_EXPORT_FORMAT_SUBTITLES[fmt];
                  const isSelected = selectedFormat === fmt;
                  const isDisabled = isTrifold && fmt === SERIES_EXPORT_FORMATS.DOCX;
                  return (
                    <label
                      key={fmt}
                      className={
                        "flex items-center gap-3 p-3 rounded-md border transition-colors " +
                        (isDisabled
                          ? "opacity-40 cursor-not-allowed border-border"
                          : "cursor-pointer " + (isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/50"))
                      }
                    >
                      <input
                        type="radio" name="series-export-format"
                        value={fmt}
                        checked={isSelected}
                        disabled={isDisabled}
                        onChange={() => handleFormatChange(fmt)}
                        className="accent-primary"
                      />
                      <div>
                        <span className="text-sm text-foreground">{SERIES_EXPORT_FORMAT_LABELS[fmt]}</span>
                        {subtitle && !isDisabled && (
                          <span className="text-xs text-emerald-600 ml-2 font-medium">{subtitle}</span>
                        )}
                        {isDisabled && (
                          <span className="text-xs text-muted-foreground ml-2">Not available for Tri-Fold</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
              {selectedLayout !== null && selectedFormat === null && (
                <p className="text-xs text-muted-foreground mt-2">{SERIES_EXPORT_UI.formatRequiredHint}</p>
              )}
            </fieldset>

            {/* ---- 4. Document Options (hidden for tri-fold) -------------- */}
            {!isTrifold && (
              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">
                  {SERIES_EXPORT_UI.optionsLabel}
                </legend>
                <label className={
                  "flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors " +
                  (includeHandoutBooklet ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50")
                }>
                  <input
                    type="checkbox"
                    checked={includeHandoutBooklet}
                    onChange={(e) => setIncludeHandoutBooklet(e.target.checked)}
                    className="mt-0.5 accent-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-foreground block">{SERIES_EXPORT_UI.handoutBookletLabel}</span>
                    <span className="text-xs text-muted-foreground mt-0.5 block">{SERIES_EXPORT_UI.handoutBookletDescription}</span>
                  </div>
                </label>
              </fieldset>
            )}

            {/* ---- 5. Actions -------------------------------------------- */}
            <div className="flex gap-3 pt-1">
              <button
                type="button" onClick={handleClose}
                className="flex-1 px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground bg-background hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SERIES_EXPORT_UI.cancelButton}
              </button>
              <button
                type="button" onClick={handleExport} disabled={!canExport}
                className={
                  "flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
                  (canExport
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "bg-muted text-muted-foreground cursor-not-allowed")
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
