// ============================================================================
// SERIES EXPORT CONFIGURATION - SSOT
// Location: src/constants/seriesExportConfig.ts
// Last Updated: 2026-03-06
// ============================================================================

import { EXPORT_SPACING, EXPORT_FORMATTING } from '@/constants/lessonStructure';
import { BRANDING } from '@/config/branding';
import type { AudienceProfile } from '@/constants/audienceConfig';
import { resolveAudienceProfile } from '@/constants/audienceConfig';

export { EXPORT_SPACING, EXPORT_FORMATTING };

export const SERIES_EXPORT_SECTIONS = {
  COVER:           'cover',
  TOC:             'toc',
  INTRO:           'intro',
  LESSONS:         'lessons',
  HANDOUT_BOOKLET: 'handout_booklet',
  BACK_COVER:      'back_cover',
} as const;

export type SeriesExportSection = typeof SERIES_EXPORT_SECTIONS[keyof typeof SERIES_EXPORT_SECTIONS];

export const SERIES_EXPORT_FORMATS = {
  DOCX:        'docx',
  PDF:         'pdf',
  BOOKLET_PDF: 'booklet_pdf',
} as const;

export type SeriesExportFormat = typeof SERIES_EXPORT_FORMATS[keyof typeof SERIES_EXPORT_FORMATS];

export const SERIES_EXPORT_FORMAT_LABELS: Record<SeriesExportFormat, string> = {
  docx:        'Word Document (.docx)',
  pdf:         'PDF Document (.pdf)',
  booklet_pdf: 'Booklet PDF -- Print & Fold',
} as const;

export const SERIES_EXPORT_FORMAT_MIME: Record<SeriesExportFormat, string> = {
  docx:        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  pdf:         'application/pdf',
  booklet_pdf: 'application/pdf',
} as const;

export const SERIES_EXPORT_FORMAT_EXT: Record<SeriesExportFormat, string> = {
  docx:        '.docx',
  pdf:         '.pdf',
  booklet_pdf: '.pdf',
} as const;

export const SERIES_EXPORT_RECOMMENDED_FORMAT: SeriesExportFormat = SERIES_EXPORT_FORMATS.PDF;

export const SERIES_EXPORT_FORMAT_SUBTITLES: Partial<Record<SeriesExportFormat, string>> = {
  pdf:         'Recommended for printing',
  booklet_pdf: 'Saddle-stitch -- fold & staple',
} as const;

export interface LayoutDimensions {
  widthDxa:                number;
  heightDxa:               number;
  marginDxa:               number;
  contentWidthDxa:         number;
  bodyFontHalfPt:          number;
  sectionHeaderFontHalfPt: number;
  chapterTitleFontHalfPt:  number;
  padToMultipleOf4?:       boolean;
}

export const SERIES_LAYOUT_DIMENSIONS: Record<string, LayoutDimensions> = {
  fullpage: {
    widthDxa:                12240,
    heightDxa:               15840,
    marginDxa:               1440,
    contentWidthDxa:         9360,
    bodyFontHalfPt:          EXPORT_SPACING.body.fontHalfPt,
    sectionHeaderFontHalfPt: 28,
    chapterTitleFontHalfPt:  32,
  },
} as const;

export interface FontConfig {
  id:          string;
  label:       string;
  docxBody:    string;
  docxHeading: string;
}

export const SERIES_EXPORT_FONT_OPTIONS: FontConfig[] = [
  { id: 'calibri',  label: 'Calibri (Modern)',      docxBody: 'Calibri',           docxHeading: 'Calibri' },
  { id: 'georgia',  label: 'Georgia (Traditional)', docxBody: 'Georgia',           docxHeading: 'Georgia' },
  { id: 'times',    label: 'Times New Roman',       docxBody: 'Times New Roman',   docxHeading: 'Times New Roman' },
  { id: 'arial',    label: 'Arial (Clean)',         docxBody: 'Arial',             docxHeading: 'Arial' },
  { id: 'garamond', label: 'Garamond (Elegant)',    docxBody: 'Garamond',          docxHeading: 'Garamond' },
  { id: 'palatino', label: 'Palatino (Readable)',   docxBody: 'Palatino Linotype', docxHeading: 'Palatino Linotype' },
];

export interface SeriesExportOptions {
  includeHandoutBooklet:    boolean;
  omitSection8FromChapters: boolean;
  format:                   SeriesExportFormat;
  layout:                   string;
  font:                     string;
  audience_profile?:        AudienceProfile;
}

export const SERIES_EXPORT_DEFAULT_OPTIONS: SeriesExportOptions = {
  includeHandoutBooklet:    true,
  omitSection8FromChapters: true,
  format:                   SERIES_EXPORT_FORMATS.PDF,
  layout:                   'fullpage',
  font:                     'calibri',
} as const;

export const SERIES_PAGE = {
  widthDxa:        12240,
  heightDxa:       15840,
  marginDxa:       1440,
  contentWidthDxa: 9360,
} as const;

export const FULLPAGE_PDF = {
  width:        612,
  height:       792,
  margin:       72,
  get contentWidth()  { return this.width  - this.margin * 2; },
  get contentHeight() { return this.height - this.margin * 2; },
  get pageBottom()    { return this.height - this.margin; },
} as const;

export const BOOKLET_PAGE = {
  width:        396,
  height:       612,
  margin:       28.8,
  get contentWidth()  { return this.width  - this.margin * 2; },
  get contentHeight() { return this.height - this.margin * 2; },
} as const;

export const BOOKLET_SHEET = {
  width:  792,
  height: 612,
} as const;

export const BOOKLET_TYPOGRAPHY = {
  bodyFontPt:          9.5,
  bodyLineHeight:      1.42,
  subheadFontPt:       10.5,
  sectionLabelFontPt:  7.5,
  lessonNumFontPt:     7.5,
  lessonTitleFontPt:   14,
  passageFontPt:       8.5,
  coverTitleFontPt:    30,
  coverSubtitleFontPt: 13,
  coverMetaFontPt:     8,
  tocHeadingFontPt:    13,
  tocEntryFontPt:      9.5,
  footerFontPt:        6.5,
  handoutTitleFontPt:  12,
  handoutLabelFontPt:  7.5,
} as const;

export const SERIES_COVER_TYPOGRAPHY = {
  titleFontPt:        24,
  titleFontHalfPt:    48,
  subtitleFontPt:     14,
  subtitleFontHalfPt: 28,
  metaFontPt:         12,
  metaFontHalfPt:     24,
  footerFontPt:       EXPORT_SPACING.footer.fontPt,
  footerFontHalfPt:   EXPORT_SPACING.footer.fontHalfPt,
} as const;

export const SERIES_CHAPTER_TYPOGRAPHY = {
  chapterLabelFontPt:     11,
  chapterLabelFontHalfPt: 22,
  chapterTitleFontPt:     16,
  chapterTitleFontHalfPt: 32,
  passageFontPt:          10,
  passageFontHalfPt:      20,
} as const;

export const SERIES_TOC_TYPOGRAPHY = {
  headingFontPt:          16,
  headingFontHalfPt:      32,
  entryFontPt:            EXPORT_SPACING.body.fontPt,
  entryFontHalfPt:        EXPORT_SPACING.body.fontHalfPt,
  entrySpacingAfterTwips: EXPORT_SPACING.paragraph.afterTwips,
} as const;

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

export const SERIES_COVER_COPY = {
  subtitle:     'A BibleLessonSpark Curriculum Series',
  teacherLabel: 'Prepared by',
  churchLabel:  'For',
  generatedBy:  'Generated by ' + BRANDING.appName,
  website:      BRANDING.urls.baseUrl,
} as const;

export const SERIES_INTRO_PLACEHOLDER =
  'This curriculum series was prepared using BibleLessonSpark.com. ' +
  'Each lesson has been crafted to align with your theology profile, age group, and Bible version, ' +
  'providing a consistent and faithful teaching resource for your class. ' +
  'May the Lord use these lessons to encourage growth in His Word.';

export const SERIES_HANDOUT_COPY = {
  appendixTitle:       'Group Handout Section',
  appendixSubtitle: 'Reproducible handouts for each lesson -- these pages may be freely reproduced for use within your group.',
  handoutHeaderPrefix: 'Lesson',
} as const;

export const GROUP_HANDOUT_SECTION_NUMBER = '8';

export function buildSeriesExportFilename(
  seriesName: string,
  format: SeriesExportFormat
): string {
  const safeName = seriesName
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '-')
    .slice(0, 60);
  const date   = new Date().toISOString().slice(0, 10);
  const ext    = SERIES_EXPORT_FORMAT_EXT[format];
  const suffix = format === SERIES_EXPORT_FORMATS.BOOKLET_PDF ? '_Booklet' : '';
  return safeName + suffix + '_' + date + ext;
}

export const SERIES_EXPORT_PROGRESS_STEPS = [
  { id: 'loading',    label: 'Loading lesson content...' },
  { id: 'cover',      label: 'Building cover page...' },
  { id: 'toc',        label: 'Generating table of contents...' },
  { id: 'lessons',    label: 'Compiling lesson chapters...' },
  { id: 'handouts',   label: 'Assembling handout section...' },
  { id: 'imposing',   label: 'Imposing booklet layout...' },
  { id: 'finalizing', label: 'Finalizing document...' },
] as const;

export type SeriesExportProgressStepId =
  typeof SERIES_EXPORT_PROGRESS_STEPS[number]['id'];

export const SERIES_EXPORT_UI = {
  buttonLabel:               'Export Series',
  modalTitle:                'Export Curriculum Series',
  modalSubtitle:             'Compile your series into a printable curriculum document.',
  formatLabel:               'Choose Export Format',
  optionsLabel:              'Document Options',
  handoutBookletLabel:       'Include Group Handout Section',
  handoutBookletDescription: 'Compiles all group handouts into a tear-out appendix. When enabled, individual lesson chapters will not repeat the handout.',
  exportButton:              'Export Series',
  cancelButton:              'Cancel',
  upgradePrompt:             'Upgrade to Personal Plan to export your series as a complete curriculum document.',
  successMessage:            'Your curriculum series has been exported successfully.',
  errorMessage:              'We were unable to export your series. Please try again. If the problem continues, contact support at ' + BRANDING.contact.supportEmail + '.',
  emptySeriesWarning:        'This series does not have any completed lessons yet. Generate at least one lesson before exporting.',
  formatRequiredHint:        'Please select a format to continue.',
  bookletPrintNote:          'The Booklet PDF includes the Group Handout Section. Print double-sided, fold in half, and staple at the spine.',
} as const;

// ============================================================================
// AUDIENCE TERMINOLOGY RESOLVER
// ============================================================================

export function resolveExportTerminology(
  audienceProfile?: AudienceProfile
): { assemblyLabel: string; participantLabel: string } {
  const profile = resolveAudienceProfile(audienceProfile);
  return {
    assemblyLabel:    profile.assembly,
    participantLabel: profile.participant,
  };
}
