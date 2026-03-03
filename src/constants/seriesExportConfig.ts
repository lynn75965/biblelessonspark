// ============================================================================
// SERIES EXPORT CONFIGURATION - SSOT
// Location: src/constants/seriesExportConfig.ts
//
// Single Source of Truth for the Series eBook / Curriculum Quarterly Export
// feature. All series export constants, labels, and option definitions live
// here. Import from this file -- never duplicate these values.
//
// SSOT IMPORT CHAIN:
//   seriesExportConfig.ts (series-specific)
//     -> imports EXPORT_SPACING, EXPORT_FORMATTING from lessonStructure.ts
//     -> imports LessonSeries type from seriesConfig.ts
//     -> imports Lesson type from contracts.ts
//     -> imports BRANDING from @/config/branding
//
// TIER: Personal Plan only (gated in featureFlags.ts)
// PHASE: A (core export) + B (handout booklet) -- see KNOWN_LIMITATIONS.md
//        for Phase C (AI intro) and Phase D (devotionals, admin cover options)
//
// Last Updated: 2026-03-03
// ============================================================================

import { EXPORT_SPACING, EXPORT_FORMATTING } from '@/constants/lessonStructure';
import { BRANDING } from '@/config/branding';

// ============================================================================
// RE-EXPORT SSOT DEPENDENCIES
// ============================================================================

export { EXPORT_SPACING, EXPORT_FORMATTING };

// ============================================================================
// DOCUMENT STRUCTURE
// ============================================================================

export const SERIES_EXPORT_SECTIONS = {
  COVER:    'cover',
  TOC:      'toc',
  INTRO:    'intro',
  LESSONS:  'lessons',
  HANDOUT_BOOKLET: 'handout_booklet',
  BACK_COVER: 'back_cover',
} as const;

export type SeriesExportSection = typeof SERIES_EXPORT_SECTIONS[keyof typeof SERIES_EXPORT_SECTIONS];

// ============================================================================
// EXPORT FORMAT OPTIONS
// ============================================================================

export const SERIES_EXPORT_FORMATS = {
  DOCX: 'docx',
  PDF:  'pdf',
} as const;

export type SeriesExportFormat = typeof SERIES_EXPORT_FORMATS[keyof typeof SERIES_EXPORT_FORMATS];

export const SERIES_EXPORT_FORMAT_LABELS: Record<SeriesExportFormat, string> = {
  docx: 'Word Document (.docx)',
  pdf:  'PDF Document (.pdf)',
} as const;

export const SERIES_EXPORT_FORMAT_MIME: Record<SeriesExportFormat, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf:  'application/pdf',
} as const;

export const SERIES_EXPORT_FORMAT_EXT: Record<SeriesExportFormat, string> = {
  docx: '.docx',
  pdf:  '.pdf',
} as const;

/** Recommended format for volunteer teachers (shown with label in modal) */
export const SERIES_EXPORT_RECOMMENDED_FORMAT: SeriesExportFormat = SERIES_EXPORT_FORMATS.PDF;

/** Subtitle labels for format picker (only the recommended format gets one) */
export const SERIES_EXPORT_FORMAT_SUBTITLES: Partial<Record<SeriesExportFormat, string>> = {
  pdf: 'Recommended for printing',
} as const;

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface SeriesExportOptions {
  /** Include the Student Handout Booklet appendix (Phase B) */
  includeHandoutBooklet: boolean;
  /** When true, Section 8 is omitted from individual lesson chapters */
  omitSection8FromChapters: boolean;
  /** Export format: DOCX or PDF */
  format: SeriesExportFormat;
}

export const SERIES_EXPORT_DEFAULT_OPTIONS: SeriesExportOptions = {
  includeHandoutBooklet: true,
  omitSection8FromChapters: true,
  format: SERIES_EXPORT_FORMATS.PDF,
} as const;

// ============================================================================
// DOCUMENT TYPOGRAPHY & LAYOUT
// ============================================================================

/** US Letter page dimensions in DXA (twips). 1 inch = 1440 DXA. */
export const SERIES_PAGE = {
  widthDxa:   12240,   // 8.5 inches
  heightDxa:  15840,   // 11 inches
  marginDxa:  1440,    // 1-inch margins (all sides)
  contentWidthDxa: 9360,
} as const;

/** Cover page typography */
export const SERIES_COVER_TYPOGRAPHY = {
  titleFontPt:      24,
  titleFontHalfPt:  48,
  subtitleFontPt:   14,
  subtitleFontHalfPt: 28,
  metaFontPt:       12,
  metaFontHalfPt:   24,
  footerFontPt:     EXPORT_SPACING.footer.fontPt,
  footerFontHalfPt: EXPORT_SPACING.footer.fontHalfPt,
} as const;

/** Chapter/lesson header typography */
export const SERIES_CHAPTER_TYPOGRAPHY = {
  chapterLabelFontPt:    11,
  chapterLabelFontHalfPt: 22,
  chapterTitleFontPt:    16,
  chapterTitleFontHalfPt: 32,
  passageFontPt:         10,
  passageFontHalfPt:     20,
} as const;

/** TOC typography */
export const SERIES_TOC_TYPOGRAPHY = {
  headingFontPt:     16,
  headingFontHalfPt: 32,
  entryFontPt:       EXPORT_SPACING.body.fontPt,
  entryFontHalfPt:   EXPORT_SPACING.body.fontHalfPt,
  entrySpacingAfterTwips: EXPORT_SPACING.paragraph.afterTwips,
} as const;

// ============================================================================
// COLORS
// ============================================================================

export const SERIES_COLORS = {
  coverTitle:     '3D5C3D',
  coverSubtitle:  'B8860B',
  chapterHeading: '3D5C3D',
  tocHeading:     '3D5C3D',
  tocEntry:       EXPORT_SPACING.colors.bodyText,
  handoutHeader:  '3D5C3D',
  backCoverText:  EXPORT_SPACING.colors.metaText,
  hr:             EXPORT_SPACING.colors.hrLine,
} as const;

// ============================================================================
// COVER PAGE COPY
// ============================================================================

export const SERIES_COVER_COPY = {
  subtitle: 'A BibleLessonSpark Curriculum Series',
  teacherLabel: 'Prepared by',
  churchLabel: 'For',
  generatedBy: 'Generated by ' + BRANDING.appName,
  website: BRANDING.urls.baseUrl,
} as const;

// ============================================================================
// INTRODUCTION PLACEHOLDER
// ============================================================================

export const SERIES_INTRO_PLACEHOLDER =
  'This curriculum series was prepared using BibleLessonSpark.com. ' +
  'Each lesson has been crafted to align with your theology profile, age group, and Bible version, ' +
  'providing a consistent and faithful teaching resource for your class. ' +
  'May the Lord use these lessons to encourage growth in His Word.';

// ============================================================================
// HANDOUT BOOKLET COPY
// ============================================================================

export const SERIES_HANDOUT_COPY = {
  appendixTitle: 'Student Handout Booklet',
  appendixSubtitle: 'Reproducible handouts for each lesson in this series',
  handoutHeaderPrefix: 'Lesson',
} as const;

export const STUDENT_HANDOUT_SECTION_NUMBER = '8';

// ============================================================================
// FILENAME CONVENTION
// ============================================================================

export function buildSeriesExportFilename(
  seriesName: string,
  format: SeriesExportFormat
): string {
  const safeName = seriesName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .slice(0, 60);

  const date = new Date().toISOString().slice(0, 10);
  const ext = SERIES_EXPORT_FORMAT_EXT[format];
  return safeName + '_' + date + ext;
}

// ============================================================================
// PROGRESS STEPS
// ============================================================================

export const SERIES_EXPORT_PROGRESS_STEPS = [
  { id: 'loading',    label: 'Loading lesson content...' },
  { id: 'cover',      label: 'Building cover page...' },
  { id: 'toc',        label: 'Generating table of contents...' },
  { id: 'lessons',    label: 'Compiling lesson chapters...' },
  { id: 'handouts',   label: 'Assembling handout booklet...' },
  { id: 'finalizing', label: 'Finalizing document...' },
] as const;

export type SeriesExportProgressStepId =
  typeof SERIES_EXPORT_PROGRESS_STEPS[number]['id'];

// ============================================================================
// UI COPY
// ============================================================================

export const SERIES_EXPORT_UI = {
  buttonLabel: 'Export Series',
  modalTitle: 'Export Curriculum Series',
  modalSubtitle: 'Compile your series into a printable curriculum document.',
  formatLabel: 'Choose Export Format',
  optionsLabel: 'Document Options',
  handoutBookletLabel: 'Include Student Handout Booklet',
  handoutBookletDescription:
    'Compiles all student handouts into a tear-out appendix. ' +
    'When enabled, individual lesson chapters will not repeat the handout.',
  exportButton: 'Export Series',
  cancelButton: 'Cancel',
  upgradePrompt:
    'Upgrade to Personal Plan to export your series as a complete curriculum document.',
  successMessage: 'Your curriculum series has been exported successfully.',
  errorMessage:
    'We were unable to export your series. Please try again. ' +
    'If the problem continues, contact support at ' + BRANDING.contact.supportEmail + '.',
  emptySeriesWarning:
    'This series does not have any completed lessons yet. ' +
    'Generate at least one lesson before exporting.',
  /** Shown when user has not yet picked a format */
  formatRequiredHint: 'Please select a format to continue.',
} as const;
