// ============================================================================
// SeriesExportModal.tsx
// Location: src/components/SeriesExport/SeriesExportModal.tsx
//
// Two-step modal for series export.
//   Step 1: Configure layout, color scheme, font, format, options
//           with a live HTML/CSS preview thumbnail.
//   Step 2: Progress indicator while building the document.
//
// SSOT: All labels, options, and defaults from seriesExportConfig.ts
// AudienceConfig: "Group Handout" -- never "Student Handout"
// ============================================================================

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  SeriesExportOptions,
  SeriesExportFormat,
  SeriesExportLayout,
  ColorSchemeId,
  FontId,
  SERIES_EXPORT_FORMATS,
  SERIES_EXPORT_FORMAT_LABELS,
  SERIES_EXPORT_FORMAT_SUBTITLES,
  SERIES_EXPORT_LAYOUTS,
  SERIES_EXPORT_LAYOUT_LABELS,
  SERIES_EXPORT_LAYOUT_DESCRIPTIONS,
  BOOKLET_COLOR_SCHEMES,
  SERIES_EXPORT_FONT_OPTIONS,
  SERIES_EXPORT_DEFAULT_COLOR_SCHEME,
  SERIES_EXPORT_DEFAULT_FONT,
  SERIES_EXPORT_UI,
  getColorScheme,
  getFontOption,
} from '@/constants/seriesExportConfig';
import { useSeriesExport } from '@/hooks/useSeriesExport';
import { SeriesExportProgress } from './SeriesExportProgress';

// ============================================================================
// GOOGLE FONTS -- loaded once for the preview panel
// EB Garamond and Crimson Text are on Google Fonts.
// Pagella/Times/Calibri use system font stacks -- no load needed.
// ============================================================================

const GOOGLE_FONTS_URL =
  'https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,700;1,400&display=swap';

function ensureGoogleFonts(): void {
  if (document.getElementById('bls-gfonts')) return;
  const link = document.createElement('link');
  link.id   = 'bls-gfonts';
  link.rel  = 'stylesheet';
  link.href = GOOGLE_FONTS_URL;
  document.head.appendChild(link);
}

// ============================================================================
// PROPS
// ============================================================================

interface SeriesExportModalProps {
  series:  LessonSeries;
  onClose: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SeriesExportModal({
  series,
  onClose,
}: SeriesExportModalProps): React.ReactElement {

  const [selectedLayout,      setSelectedLayout]      = useState<SeriesExportLayout>(SERIES_EXPORT_LAYOUTS.FULL_PAGE);
  const [selectedColorScheme, setSelectedColorScheme] = useState<ColorSchemeId>(SERIES_EXPORT_DEFAULT_COLOR_SCHEME);
  const [selectedFont,        setSelectedFont]        = useState<FontId>(SERIES_EXPORT_DEFAULT_FONT);
  const [selectedFormat,      setSelectedFormat]      = useState<SeriesExportFormat | null>(null);
  const [includeHandout,      setIncludeHandout]      = useState(true);

  const { exportSeries, state, reset } = useSeriesExport();

  useEffect(() => {
    ensureGoogleFonts();
  }, []);

  const isTrifold = selectedLayout === SERIES_EXPORT_LAYOUTS.TRIFOLD;
  useEffect(() => {
    if (isTrifold) setSelectedFormat(SERIES_EXPORT_FORMATS.PDF);
  }, [isTrifold]);

  const scheme    = getColorScheme(selectedColorScheme);
  const fontOpt   = getFontOption(selectedFont);
  const canExport = selectedFormat !== null;

  const exportButtonLabel =
    selectedFormat === SERIES_EXPORT_FORMATS.PDF
      ? SERIES_EXPORT_UI.exportButtonPdf
      : SERIES_EXPORT_UI.exportButtonDocx;

  function handleClose(): void {
    if (!state.isExporting) { reset(); onClose(); }
  }

  async function handleExport(): Promise<void> {
    if (!selectedFormat) return;
    const options: SeriesExportOptions = {
      format:                   selectedLayout === SERIES_EXPORT_LAYOUTS.BOOKLET
                                  ? SERIES_EXPORT_FORMATS.BOOKLET
                                  : selectedFormat,
      layout:                   selectedLayout,
      colorSchemeId:            selectedColorScheme,
      font:                     selectedFont,
      includeHandoutBooklet:    isTrifold ? false : includeHandout,
      omitSection8FromChapters: isTrifold ? false : includeHandout,
    };
    const success = await exportSeries(series, options);
    if (success) { toast.success(SERIES_EXPORT_UI.successMessage); onClose(); }
  }

  // --------------------------------------------------------------------------
  // PREVIEW PANEL
  // --------------------------------------------------------------------------

  const primaryHex = '#' + scheme.primary;
  const accentHex  = '#' + scheme.accent;

  const pw: Record<string, React.CSSProperties> = {
    wrapper: {
      border: '1px solid #d1d5db', borderRadius: '6px', overflow: 'hidden',
      background: '#ffffff', padding: '16px 18px',
      fontFamily: fontOpt.cssFamily, fontSize: '9px', lineHeight: '13.5px', color: '#1a1a1a',
    },
    lessonLabel: {
      fontSize: '7px', fontWeight: 400, letterSpacing: '0.08em',
      textTransform: 'uppercase' as const, color: '#888888', marginBottom: '3px',
    },
    lessonTitle: {
      fontSize: '13px', fontWeight: 700, color: primaryHex,
      lineHeight: '16px', marginBottom: '3px',
    },
    scripture: { fontSize: '8px', fontStyle: 'italic', color: '#555555', marginBottom: '6px' },
    rule:      { height: '1px', background: accentHex, opacity: 0.6, marginBottom: '8px' },
    sectionLabel: {
      fontSize: '7px', fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase' as const, color: primaryHex, marginBottom: '4px',
    },
    body: { fontSize: '9px', lineHeight: '13.5px', color: '#1a1a1a', marginBottom: '6px' },
    scriptureBlock: {
      fontSize: '8.5px', fontStyle: 'italic', lineHeight: '13px', color: '#333333',
      borderLeft: '2px solid ' + accentHex, paddingLeft: '8px', marginLeft: '4px',
    },
    footerRow: {
      display: 'flex', justifyContent: 'space-between',
      marginTop: '10px', paddingTop: '5px', borderTop: '1px solid #e5e7eb',
    },
    footerText: { fontSize: '6.5px', color: '#9ca3af' },
    schemeTag: {
      display: 'inline-block', fontSize: '6px', fontWeight: 600,
      letterSpacing: '0.05em', textTransform: 'uppercase' as const,
      color: '#ffffff', background: primaryHex,
      borderRadius: '2px', padding: '1px 4px', marginBottom: '8px',
    },
  };

  function PreviewPanel(): React.ReactElement {
    const shortName = series.series_name.length > 28
      ? series.series_name.slice(0, 28) + '...'
      : series.series_name;
    return (
      <div style={pw.wrapper}>
        <div style={pw.schemeTag}>{scheme.label} -- {fontOpt.label.split('(')[0].trim()}</div>
        <div style={pw.lessonLabel}>Lesson 1</div>
        <div style={pw.lessonTitle}>The King Above All Kings: God&apos;s Sovereignty</div>
        <div style={pw.scripture}>Daniel 4:34-37</div>
        <div style={pw.rule} />
        <div style={pw.sectionLabel}>Main Teaching</div>
        <div style={pw.body}>
          Nebuchadnezzar lifted his eyes toward heaven, and his reason returned.
          He blessed the Most High and praised and honored him who lives forever,
          whose dominion is an everlasting dominion.
        </div>
        <div style={pw.scriptureBlock}>
          &ldquo;His dominion is an everlasting dominion, and his kingdom endures
          from generation to generation.&rdquo; -- Daniel 4:34
        </div>
        <div style={pw.footerRow}>
          <span style={pw.footerText}>{shortName}</span>
          <span style={pw.footerText}>biblelessonspark.com -- 1</span>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------------

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="series-export-modal-title"
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto"
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div className="relative w-full max-w-2xl my-8 bg-card text-card-foreground rounded-lg shadow-xl p-6">

        {!state.isExporting && (
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close export dialog"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}

        <div className="mb-5">
          <h2 id="series-export-modal-title" className="text-lg font-semibold text-foreground">
            {SERIES_EXPORT_UI.modalTitle}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{SERIES_EXPORT_UI.modalSubtitle}</p>
          <p className="mt-1 text-sm font-medium text-foreground truncate">{series.series_name}</p>
        </div>

        {state.isExporting && state.progressStepId && (
          <SeriesExportProgress currentStepId={state.progressStepId} />
        )}

        {state.error && !state.isExporting && (
          <div role="alert" className="mb-4 px-4 py-3 rounded-md bg-destructive/10 border border-destructive/30 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {!state.isExporting && (series.lesson_summaries?.length ?? 0) >= 10 && (
          <div role="note" className="mb-4 px-4 py-3 rounded-md bg-amber-50 border border-amber-200 text-sm text-amber-800">
            <span className="font-medium">Large series detected ({series.lesson_summaries?.length} lessons).</span>
            {' '}Building this export may take 30\u201360 seconds. Please keep this tab active until the download begins. You can proceed normally.
          </div>
        )}

        {!state.isExporting && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* LEFT COLUMN */}
            <div className="space-y-5">

              {/* Layout */}
              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">{SERIES_EXPORT_UI.layoutLabel}</legend>
                <div className="space-y-2">
                  {(Object.values(SERIES_EXPORT_LAYOUTS) as SeriesExportLayout[]).map((layout) => (
                    <label
                      key={layout}
                      className={'flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors ' +
                        (selectedLayout === layout ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50')}
                    >
                      <input
                        type="radio" name="series-export-layout" value={layout}
                        checked={selectedLayout === layout}
                        onChange={() => setSelectedLayout(layout)}
                        className="mt-0.5 accent-primary"
                      />
                      <div>
                        <span className="text-sm font-medium text-foreground block">{SERIES_EXPORT_LAYOUT_LABELS[layout]}</span>
                        <span className="text-xs text-muted-foreground block mt-0.5">{SERIES_EXPORT_LAYOUT_DESCRIPTIONS[layout]}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Color scheme */}
              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-1">{SERIES_EXPORT_UI.colorSchemeLabel}</legend>
                <p className="text-xs text-muted-foreground mb-2">{SERIES_EXPORT_UI.colorSchemeSubNote}</p>
                <div className="space-y-1.5">
                  {BOOKLET_COLOR_SCHEMES.map((cs) => (
                    <label
                      key={cs.id}
                      className={'flex items-center gap-3 cursor-pointer px-3 py-2 rounded-md border transition-colors ' +
                        (selectedColorScheme === cs.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50')}
                    >
                      <input
                        type="radio" name="series-export-color" value={cs.id}
                        checked={selectedColorScheme === cs.id}
                        onChange={() => setSelectedColorScheme(cs.id as ColorSchemeId)}
                        className="accent-primary"
                      />
                      <span className="flex gap-1">
                        <span style={{ background: '#' + cs.primary }} className="inline-block w-5 h-5 rounded-sm border border-black/10" aria-hidden="true" />
                        <span style={{ background: '#' + cs.accent  }} className="inline-block w-5 h-5 rounded-sm border border-black/10" aria-hidden="true" />
                      </span>
                      <span className="text-sm text-foreground">{cs.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Font */}
              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">{SERIES_EXPORT_UI.fontLabel}</legend>
                <div className="space-y-1.5">
                  {SERIES_EXPORT_FONT_OPTIONS.map((f) => (
                    <label
                      key={f.id}
                      className={'flex items-center gap-3 cursor-pointer px-3 py-2 rounded-md border transition-colors ' +
                        (selectedFont === f.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50')}
                    >
                      <input
                        type="radio" name="series-export-font" value={f.id}
                        checked={selectedFont === f.id}
                        onChange={() => setSelectedFont(f.id as FontId)}
                        className="accent-primary"
                      />
                      <span style={{ fontFamily: f.cssFamily, fontSize: '14px' }} className="text-foreground">
                        {f.label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {/* Format */}
              <fieldset>
                <legend className="text-sm font-medium text-foreground mb-2">{SERIES_EXPORT_UI.formatLabel}</legend>
                <div className="space-y-2">
                  {([SERIES_EXPORT_FORMATS.PDF, SERIES_EXPORT_FORMATS.DOCX] as SeriesExportFormat[]).map((fmt) => {
                    const isDisabled = isTrifold && fmt === SERIES_EXPORT_FORMATS.DOCX;
                    return (
                      <label
                        key={fmt}
                        className={'flex items-center gap-3 px-3 py-2 rounded-md border transition-colors ' +
                          (isDisabled
                            ? 'border-border opacity-40 cursor-not-allowed'
                            : 'cursor-pointer ' + (selectedFormat === fmt ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'))}
                      >
                        <input
                          type="radio" name="series-export-format" value={fmt}
                          checked={selectedFormat === fmt} disabled={isDisabled}
                          onChange={() => !isDisabled && setSelectedFormat(fmt)}
                          className="accent-primary"
                        />
                        <div>
                          <span className="text-sm text-foreground">{SERIES_EXPORT_FORMAT_LABELS[fmt]}</span>
                          {SERIES_EXPORT_FORMAT_SUBTITLES[fmt] && (
                            <span className="text-xs text-emerald-600 ml-2 font-medium">{SERIES_EXPORT_FORMAT_SUBTITLES[fmt]}</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
                {!canExport && (
                  <p className="text-xs text-muted-foreground mt-2">{SERIES_EXPORT_UI.formatRequiredHint}</p>
                )}
              </fieldset>

              {/* Group Handout checkbox -- hidden for trifold */}
              {!isTrifold && (
                <fieldset>
                  <legend className="text-sm font-medium text-foreground mb-2">{SERIES_EXPORT_UI.optionsLabel}</legend>
                  <label className={'flex items-start gap-3 cursor-pointer p-3 rounded-md border transition-colors ' +
                    (includeHandout ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50')}>
                    <input
                      type="checkbox" checked={includeHandout}
                      onChange={(e) => setIncludeHandout(e.target.checked)}
                      className="mt-0.5 accent-primary"
                    />
                    <div>
                      <span className="text-sm font-medium text-foreground block">{SERIES_EXPORT_UI.handoutBookletLabel}</span>
                      <span className="text-xs text-muted-foreground mt-0.5 block">{SERIES_EXPORT_UI.handoutBookletDescription}</span>
                    </div>
                  </label>
                </fieldset>
              )}

              {/* Print instructions -- PDF only */}
              {selectedFormat === SERIES_EXPORT_FORMATS.PDF && (
                <p className="text-xs text-muted-foreground border border-border rounded-md p-3">
                  <span className="font-medium text-foreground">To print: </span>
                  {SERIES_EXPORT_UI.printInstructions}
                </p>
              )}

            </div>

            {/* RIGHT COLUMN -- live preview */}
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-foreground">Preview</p>
              <PreviewPanel />
              <p className="text-xs text-muted-foreground">Preview reflects your font and color scheme selections.</p>

              <div className="flex gap-3 mt-auto pt-4">
                <button
                  type="button" onClick={handleClose}
                  className="flex-1 px-4 py-2 text-sm font-medium rounded-md border border-border text-foreground bg-background hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {SERIES_EXPORT_UI.cancelButton}
                </button>
                <button
                  type="button" onClick={handleExport} disabled={!canExport}
                  className={'flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
                    (canExport ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-muted text-muted-foreground cursor-not-allowed')}
                >
                  {canExport ? exportButtonLabel : SERIES_EXPORT_UI.exportButtonPdf}
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
