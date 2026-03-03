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
// PHASE: A (core export) + B (handout booklet) + C (layout/font options)
//        Phase C adds: Layout picker (Full Page / Booklet / Tri-Fold),
//        Font picker (6 options), and tri-fold PDF rendering path.
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
// LAYOUT OPTIONS  (Phase C addition)
// ============================================================================

export const SERIES_EXPORT_LAYOUTS = {
  FULL_PAGE: 'fullpage',
  BOOKLET:   'booklet',
  TRIFOLD:   'trifold',
} as const;

export type SeriesExportLayout = typeof SERIES_EXPORT_LAYOUTS[keyof typeof SERIES_EXPORT_LAYOUTS];

export const SERIES_EXPORT_LAYOUT_LABELS: Record<SeriesExportLayout, string> = {
  fullpage: 'Full Page (8.5 x 11")',
  booklet:  'Booklet (5.5 x 8.5")',
  trifold:  'Tri-Fold Student Handout',
} as const;

export const SERIES_EXPORT_DEFAULT_LAYOUT: SeriesExportLayout = SERIES_EXPORT_LAYOUTS.FULL_PAGE;

// ============================================================================
// LAYOUT DIMENSIONS  (Phase C addition)
// ============================================================================

export interface LayoutDimensions {
  /** Page width in DXA for DOCX */
  widthDxa: number;
  /** Page height in DXA for DOCX */
  heightDxa: number;
  /** Margin in DXA for DOCX */
  marginDxa: number;
  /** Content width in DXA (width - 2 * margin) */
  contentWidthDxa: number;
  /** Page width in points for PDF */
  widthPt: number;
  /** Page height in points for PDF */
  heightPt: number;
  /** Margin in points for PDF */
  marginPt: number;
  /** Content width in points (width - 2 * margin) */
  contentWidthPt: number;
  /** PDF page orientation */
  pdfOrientation: 'portrait' | 'landscape';
  /** Body font size in points */
  bodyFontPt: number;
  /** Body font size in half-points for DOCX */
  bodyFontHalfPt: number;
  /** Section header font size in points */
  sectionHeaderFontPt: number;
  /** Section header font size in half-points */
  sectionHeaderFontHalfPt: number;
  /** Chapter title font size in points */
  chapterTitleFontPt: number;
  /** Chapter title font size in half-points */
  chapterTitleFontHalfPt: number;
  /** Cover title font size in points */
  coverTitleFontPt: number;
  /** Cover title font size in half-points */
  coverTitleFontHalfPt: number;
  /** Cover subtitle font size in points */
  coverSubtitleFontPt: number;
  /** Cover subtitle font size in half-points */
  coverSubtitleFontHalfPt: number;
  /** Whether this layout supports DOCX format */
  supportsDocx: boolean;
  /** Whether to pad pages to a multiple of 4 (required for booklet printing) */
  padToMultipleOf4: boolean;
}

export const SERIES_LAYOUT_DIMENSIONS: Record<SeriesExportLayout, LayoutDimensions> = {
  fullpage: {
    widthDxa:              12240,
    heightDxa:             15840,
    marginDxa:              1440,
    contentWidthDxa:        9360,
    widthPt:                 612,
    heightPt:                792,
    marginPt:                 72,
    contentWidthPt:          468,
    pdfOrientation:    'portrait',
    bodyFontPt:               11,
    bodyFontHalfPt:           22,
    sectionHeaderFontPt:      14,
    sectionHeaderFontHalfPt:  28,
    chapterTitleFontPt:       16,
    chapterTitleFontHalfPt:   32,
    coverTitleFontPt:         24,
    coverTitleFontHalfPt:     48,
    coverSubtitleFontPt:      14,
    coverSubtitleFontHalfPt:  28,
    supportsDocx:           true,
    padToMultipleOf4:      false,
  },
  booklet: {
    widthDxa:               7920,
    heightDxa:             12240,
    marginDxa:               720,
    contentWidthDxa:        6480,
    widthPt:                 396,
    heightPt:                612,
    marginPt:                 36,
    contentWidthPt:          324,
    pdfOrientation:    'portrait',
    bodyFontPt:               10,
    bodyFontHalfPt:           20,
    sectionHeaderFontPt:      12,
    sectionHeaderFontHalfPt:  24,
    chapterTitleFontPt:       14,
    chapterTitleFontHalfPt:   28,
    coverTitleFontPt:         20,
    coverTitleFontHalfPt:     40,
    coverSubtitleFontPt:      12,
    coverSubtitleFontHalfPt:  24,
    supportsDocx:           true,
    padToMultipleOf4:       true,
  },
  trifold: {
    // DXA values are 0 -- tri-fold is PDF-only; DOCX is blocked by the modal
    widthDxa:                  0,
    heightDxa:                 0,
    marginDxa:                 0,
    contentWidthDxa:           0,
    // Landscape letter: 792 x 612 pt; three equal columns of 264 pt each
    widthPt:                 792,
    heightPt:                612,
    marginPt:                 18,
    contentWidthPt:          228,   // 264 - 2 * 18
    pdfOrientation: 'landscape',
    bodyFontPt:                9,
    bodyFontHalfPt:           18,
    sectionHeaderFontPt:      10,
    sectionHeaderFontHalfPt:  20,
    chapterTitleFontPt:       12,
    chapterTitleFontHalfPt:   24,
    coverTitleFontPt:          0,   // No cover page in tri-fold
    coverTitleFontHalfPt:      0,
    coverSubtitleFontPt:       0,
    coverSubtitleFontHalfPt:   0,
    supportsDocx:          false,
    padToMultipleOf4:      false,
  },
} as const;

// ============================================================================
// FONT OPTIONS  (Phase C addition)
// ============================================================================

export const SERIES_EXPORT_FONTS = {
  CALIBRI:  'calibri',
  GEORGIA:  'georgia',
  CAMBRIA:  'cambria',
  ARIAL:    'arial',
  TIMES:    'times',
  GARAMOND: 'garamond',
} as const;

export type SeriesExportFont = typeof SERIES_EXPORT_FONTS[keyof typeof SERIES_EXPORT_FONTS];

export interface FontConfig {
  id: SeriesExportFont;
  label: string;
  /** Font name for DOCX body text */
  docxBody: string;
  /** Font name for DOCX headings */
  docxHeading: string;
  /** jsPDF built-in font name for PDF body text */
  pdfBody: string;
  /** jsPDF built-in font name for PDF headings */
  pdfHeading: string;
  category: 'serif' | 'sans-serif';
}

/**
 * Ordered font option list for the export modal picker.
 *
 * PDF font names are limited to jsPDF built-ins: 'Helvetica', 'Times-Roman', 'Courier'.
 * Heading font rule: serif body -> sans-serif heading (Calibri/Helvetica);
 *                   sans-serif body -> same font for heading.
 */
export const SERIES_EXPORT_FONT_OPTIONS: FontConfig[] = [
  {
    id: 'calibri',
    label: 'Calibri',
    docxBody: 'Calibri',
    docxHeading: 'Calibri',
    pdfBody: 'Helvetica',
    pdfHeading: 'Helvetica',
    category: 'sans-serif',
  },
  {
    id: 'georgia',
    label: 'Georgia',
    docxBody: 'Georgia',
    docxHeading: 'Calibri',
    pdfBody: 'Times-Roman',
    pdfHeading: 'Helvetica',
    category: 'serif',
  },
  {
    id: 'cambria',
    label: 'Cambria',
    docxBody: 'Cambria',
    docxHeading: 'Calibri',
    pdfBody: 'Times-Roman',
    pdfHeading: 'Helvetica',
    category: 'serif',
  },
  {
    id: 'arial',
    label: 'Arial',
    docxBody: 'Arial',
    docxHeading: 'Arial',
    pdfBody: 'Helvetica',
    pdfHeading: 'Helvetica',
    category: 'sans-serif',
  },
  {
    id: 'times',
    label: 'Times New Roman',
    docxBody: 'Times New Roman',
    docxHeading: 'Calibri',
    pdfBody: 'Times-Roman',
    pdfHeading: 'Helvetica',
    category: 'serif',
  },
  {
    id: 'garamond',
    label: 'Garamond',
    docxBody: 'Garamond',
    docxHeading: 'Calibri',
    pdfBody: 'Times-Roman',
    pdfHeading: 'Helvetica',
    category: 'serif',
  },
];

export const SERIES_EXPORT_DEFAULT_FONT: SeriesExportFont = SERIES_EXPORT_FONTS.CALIBRI;

// ============================================================================
// EXPORT OPTIONS  (updated for Phase C)
// ============================================================================

export interface SeriesExportOptions {
  /** Export format: DOCX or PDF */
  format: SeriesExportFormat;
  /** Page layout: fullpage, booklet, or trifold */
  layout: SeriesExportLayout;
  /** Font selection */
  font: SeriesExportFont;
  /** Include the Student Handout Booklet appendix (Phase B) */
  includeHandoutBooklet: boolean;
  /** When true, Section 8 is omitted from individual lesson chapters */
  omitSection8FromChapters: boolean;
}

export const SERIES_EXPORT_DEFAULT_OPTIONS: SeriesExportOptions = {
  format: SERIES_EXPORT_FORMATS.PDF,
  layout: SERIES_EXPORT_DEFAULT_LAYOUT,
  font:   SERIES_EXPORT_DEFAULT_FONT,
  includeHandoutBooklet: true,
  omitSection8FromChapters: true,
} as const;

// ============================================================================
// DOCUMENT TYPOGRAPHY & LAYOUT
// ============================================================================

/**
 * US Letter page dimensions in DXA (twips). 1 inch = 1440 DXA.
 * Kept for backward compatibility. Builders should prefer SERIES_LAYOUT_DIMENSIONS.
 */
export const SERIES_PAGE = {
  widthDxa:        12240,   // 8.5 inches
  heightDxa:       15840,   // 11 inches
  marginDxa:        1440,   // 1-inch margins (all sides)
  contentWidthDxa:  9360,
} as const;

/**
 * Cover page typography.
 * Kept for backward compatibility. Builders should prefer SERIES_LAYOUT_DIMENSIONS.
 */
export const SERIES_COVER_TYPOGRAPHY = {
  titleFontPt:        24,
  titleFontHalfPt:    48,
  subtitleFontPt:     14,
  subtitleFontHalfPt: 28,
  metaFontPt:         12,
  metaFontHalfPt:     24,
  footerFontPt:     EXPORT_SPACING.footer.fontPt,
  footerFontHalfPt: EXPORT_SPACING.footer.fontHalfPt,
} as const;

/**
 * Chapter/lesson header typography.
 * Kept for backward compatibility. Builders should prefer SERIES_LAYOUT_DIMENSIONS.
 */
export const SERIES_CHAPTER_TYPOGRAPHY = {
  chapterLabelFontPt:     11,
  chapterLabelFontHalfPt: 22,
  chapterTitleFontPt:     16,
  chapterTitleFontHalfPt: 32,
  passageFontPt:          10,
  passageFontHalfPt:      20,
} as const;

/** TOC typography */
export const SERIES_TOC_TYPOGRAPHY = {
  headingFontPt:          16,
  headingFontHalfPt:      32,
  entryFontPt:            EXPORT_SPACING.body.fontPt,
  entryFontHalfPt:        EXPORT_SPACING.body.fontHalfPt,
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
// UI COPY  (updated for Phase C)
// ============================================================================

export const SERIES_EXPORT_UI = {
  buttonLabel: 'Export Series',
  modalTitle: 'Export Curriculum Series',
  modalSubtitle: 'Compile your series into a printable curriculum document.',

  // Layout picker (Phase C)
  layoutLabel: 'Choose Page Layout',
  layoutFullPageLabel: 'Full Page (8.5 x 11")',
  layoutFullPageDescription: 'Standard printing on letter paper',
  layoutBookletLabel: 'Booklet (5.5 x 8.5")',
  layoutBookletDescription: 'Fold-in-half quarterly style',
  layoutBookletSubtitle: 'Print using your printer\'s Booklet setting',
  layoutTrifoldLabel: 'Tri-Fold Student Handout',
  layoutTrifoldDescription: 'Student handout brochure',
  layoutTrifoldSubtitle: 'PDF only \u2014 one page per lesson',
  layoutRequiredHint: 'Please select a page layout to continue.',

  // Format picker (existing)
  formatLabel: 'Choose Export Format',

  // Font picker (Phase C)
  fontLabel: 'Choose Font',

  // Options (existing)
  optionsLabel: 'Document Options',
  handoutBookletLabel: 'Include Student Handout Booklet',
  handoutBookletDescription:
    'Compiles all student handouts into a tear-out appendix. ' +
    'When enabled, individual lesson chapters will not repeat the handout.',

  // Actions (existing)
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
