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
// Last Updated: 2026-03-02
// ============================================================================

import { EXPORT_SPACING, EXPORT_FORMATTING } from '@/constants/lessonStructure';
import { BRANDING } from '@/config/branding';

// ============================================================================
// RE-EXPORT SSOT DEPENDENCIES
// Consumers of this file import series-export values from here only.
// They do not need to reach into lessonStructure.ts or branding.ts directly
// for series-export-specific usage.
// ============================================================================

export { EXPORT_SPACING, EXPORT_FORMATTING };

// ============================================================================
// DOCUMENT STRUCTURE
// Defines the ordered sections of the exported curriculum document.
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
  docx: 'Microsoft Word (.docx)',
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

// ============================================================================
// EXPORT OPTIONS
// User-selectable options shown in SeriesExportModal.
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
  format: SERIES_EXPORT_FORMATS.DOCX,
} as const;

// ============================================================================
// DOCUMENT TYPOGRAPHY & LAYOUT
// All values import from EXPORT_SPACING (lessonStructure.ts SSOT).
// Series-specific overrides are defined here.
// ============================================================================

/** US Letter page dimensions in DXA (twips). 1 inch = 1440 DXA. */
export const SERIES_PAGE = {
  widthDxa:   12240,   // 8.5 inches
  heightDxa:  15840,   // 11 inches
  marginDxa:  1440,    // 1-inch margins (all sides)
  /** Usable content width = page width - left margin - right margin */
  contentWidthDxa: 9360,
} as const;

/** Cover page typography (series-specific, larger than single-lesson export) */
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

/** Chapter divider page typography */
export const SERIES_CHAPTER_TYPOGRAPHY = {
  chapterLabelFontPt:    12,
  chapterLabelFontHalfPt: 24,
  chapterTitleFontPt:    18,
  chapterTitleFontHalfPt: 36,
  passageFontPt:         12,
  passageFontHalfPt:     24,
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
// Series-specific accent colors (hex without # prefix, matching EXPORT_SPACING.colors pattern).
// Body/meta/footer colors delegate to EXPORT_SPACING.colors.
// ============================================================================

export const SERIES_COLORS = {
  /** Cover page title text -- forest green (BLS primary) */
  coverTitle:     '3D5C3D',
  /** Cover page subtitle text -- antique gold (BLS secondary) */
  coverSubtitle:  'B8860B',
  /** Chapter divider heading -- forest green */
  chapterHeading: '3D5C3D',
  /** TOC heading -- forest green */
  tocHeading:     '3D5C3D',
  /** TOC entry text -- body text */
  tocEntry:       EXPORT_SPACING.colors.bodyText,
  /** Handout booklet header -- forest green */
  handoutHeader:  '3D5C3D',
  /** Back cover text -- muted */
  backCoverText:  EXPORT_SPACING.colors.metaText,
  /** Horizontal rule */
  hr:             EXPORT_SPACING.colors.hrLine,
} as const;

// ============================================================================
// COVER PAGE COPY
// All user-facing text strings for the cover page.
// ============================================================================

export const SERIES_COVER_COPY = {
  /** Subtitle shown below series title on cover page */
  subtitle: 'A BibleLessonSpark Curriculum Series',
  /** Label preceding teacher name on cover page */
  teacherLabel: 'Prepared by',
  /** Label preceding church/organization name */
  churchLabel: 'For',
  /** Generated-by attribution line on back cover */
  generatedBy: `Generated by ${BRANDING.appName}`,
  /** Website attribution on back cover */
  website: BRANDING.urls.baseUrl,
} as const;

// ============================================================================
// INTRODUCTION PLACEHOLDER
// Phase A uses a static placeholder. Phase C will replace this with an
// AI-generated introduction via Edge Function call to Claude.
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
  /** Appendix section title */
  appendixTitle: 'Student Handout Booklet',
  /** Subtitle shown under appendix title */
  appendixSubtitle: 'Reproducible handouts for each lesson in this series',
  /** Header prefix for each individual handout page */
  handoutHeaderPrefix: 'Lesson',
} as const;

/** Section number for the Student Handout (matches pricingConfig.ts SECTION_NAMES) */
export const STUDENT_HANDOUT_SECTION_NUMBER = '8';

// ============================================================================
// FILENAME CONVENTION
// Pattern: {SeriesName}_{YYYY-MM-DD}.{ext}
// Spaces and special characters replaced with underscores.
// ============================================================================

/**
 * Generate a safe filename for the exported series document.
 * Strips non-alphanumeric characters (except hyphens) and collapses whitespace.
 */
export function buildSeriesExportFilename(
  seriesName: string,
  format: SeriesExportFormat
): string {
  const safeName = seriesName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .slice(0, 60); // cap at 60 chars before date suffix

  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const ext = SERIES_EXPORT_FORMAT_EXT[format];
  return `${safeName}_${date}${ext}`;
}

// ============================================================================
// PROGRESS STEPS
// Used by SeriesExportProgress to show compilation status.
// ============================================================================

export const SERIES_EXPORT_PROGRESS_STEPS = [
  { id: 'loading',   label: 'Loading lesson content\u2026' },
  { id: 'cover',     label: 'Building cover page\u2026' },
  { id: 'toc',       label: 'Generating table of contents\u2026' },
  { id: 'lessons',   label: 'Compiling lesson chapters\u2026' },
  { id: 'handouts',  label: 'Assembling handout booklet\u2026' },
  { id: 'finalizing', label: 'Finalizing document\u2026' },
] as const;

export type SeriesExportProgressStepId =
  typeof SERIES_EXPORT_PROGRESS_STEPS[number]['id'];

// ============================================================================
// UI COPY
// All user-facing strings for SeriesExportButton, SeriesExportModal,
// and SeriesExportProgress. Pastoral voice per bls-theological-tone.
// ============================================================================

export const SERIES_EXPORT_UI = {
  /** Button label in Library series view */
  buttonLabel: 'Export Series',
  /** Modal title */
  modalTitle: 'Export Curriculum Series',
  /** Modal subtitle */
  modalSubtitle: 'Compile your series into a printable curriculum document.',
  /** Format picker section label */
  formatLabel: 'Export Format',
  /** Options section label */
  optionsLabel: 'Document Options',
  /** Handout booklet checkbox label */
  handoutBookletLabel: 'Include Student Handout Booklet',
  /** Handout booklet checkbox description */
  handoutBookletDescription:
    'Compiles all student handouts into a tear-out appendix. ' +
    'When enabled, individual lesson chapters will not repeat the handout.',
  /** Primary action button label */
  exportButton: 'Export Series',
  /** Cancel button label */
  cancelButton: 'Cancel',
  /** Upgrade prompt for free-tier users */
  upgradePrompt:
    'Upgrade to Personal Plan to export your series as a complete curriculum document.',
  /** Success toast message */
  successMessage: 'Your curriculum series has been exported successfully.',
  /** Generic error message (pastoral voice -- no technical details) */
  errorMessage:
    'We were unable to export your series. Please try again. ' +
    'If the problem continues, contact support at ' + BRANDING.contact.supportEmail + '.',
  /** Empty series warning */
  emptySeriesWarning:
    'This series does not have any completed lessons yet. ' +
    'Generate at least one lesson before exporting.',
} as const;
