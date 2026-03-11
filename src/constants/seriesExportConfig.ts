// ============================================================================
// SERIES EXPORT CONFIGURATION - SSOT
// Location: src/constants/seriesExportConfig.ts
//
// All series export constants, types, color schemes, fonts, layouts, and
// UI copy live here. All consumers import from this file only.
//
// Consumers:
//   - SeriesExportModal.tsx
//   - buildSeriesDocx.ts
//   - buildSeriesPdf.ts
//   - buildHandoutBooklet.ts
// ============================================================================

// ============================================================================
// EXPORT FORMAT
// ============================================================================

export const SERIES_EXPORT_FORMATS = {
  PDF:     'pdf',
  DOCX:    'docx',
  BOOKLET: 'booklet_pdf',
} as const;

export type SeriesExportFormat =
  (typeof SERIES_EXPORT_FORMATS)[keyof typeof SERIES_EXPORT_FORMATS];

export const SERIES_EXPORT_FORMAT_LABELS: Record<SeriesExportFormat, string> = {
  [SERIES_EXPORT_FORMATS.PDF]:     'PDF Document',
  [SERIES_EXPORT_FORMATS.DOCX]:    'Word Document (.docx)',
  [SERIES_EXPORT_FORMATS.BOOKLET]: 'Booklet PDF (saddle-stitch)',
};

export const SERIES_EXPORT_FORMAT_SUBTITLES: Record<SeriesExportFormat, string> = {
  [SERIES_EXPORT_FORMATS.PDF]:     'Recommended for printing',
  [SERIES_EXPORT_FORMATS.DOCX]:    'Opens in Google Docs, LibreOffice, Word, and more',
  [SERIES_EXPORT_FORMATS.BOOKLET]: 'Saddle-stitch / fold-and-staple',
};

// ============================================================================
// LAYOUT
// ============================================================================

export const SERIES_EXPORT_LAYOUTS = {
  FULL_PAGE: 'fullpage',
  BOOKLET:   'booklet',
  TRIFOLD:   'trifold',
} as const;

export type SeriesExportLayout =
  (typeof SERIES_EXPORT_LAYOUTS)[keyof typeof SERIES_EXPORT_LAYOUTS];

export const SERIES_EXPORT_LAYOUT_LABELS: Record<SeriesExportLayout, string> = {
  [SERIES_EXPORT_LAYOUTS.FULL_PAGE]: 'Full Page (8.5 x 11")',
  [SERIES_EXPORT_LAYOUTS.BOOKLET]:   'Booklet (5.5 x 8.5")',
  [SERIES_EXPORT_LAYOUTS.TRIFOLD]:   'Tri-Fold Group Handout',
};

export const SERIES_EXPORT_LAYOUT_DESCRIPTIONS: Record<SeriesExportLayout, string> = {
  [SERIES_EXPORT_LAYOUTS.FULL_PAGE]: 'Standard printing on letter paper',
  [SERIES_EXPORT_LAYOUTS.BOOKLET]:   'Fold-in-half quarterly style',
  [SERIES_EXPORT_LAYOUTS.TRIFOLD]:   'PDF only -- one page per lesson',
};

export const SERIES_LAYOUT_DIMENSIONS = {
  fullpage: { widthIn: 8.5,  heightIn: 11.0 },
  booklet:  { widthIn: 5.5,  heightIn:  8.5 },
} as const;

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export interface ColorScheme {
  id:      string;
  label:   string;
  primary: string;   // hex without #  -- controls headings
  accent:  string;   // hex without #  -- controls subtitle/labels/rules
  hr:      string;   // hex without #  -- horizontal rule lines
}

export const BOOKLET_COLOR_SCHEMES: ColorScheme[] = [
  { id: 'forest_gold',      label: 'Forest & Gold',     primary: '3D5C3D', accent: 'B8860B', hr: 'B8860B' },
  { id: 'navy_steel',       label: 'Navy & Steel',       primary: '1B3A5C', accent: '607D8B', hr: '607D8B' },
  { id: 'burgundy_copper',  label: 'Burgundy & Copper',  primary: '6B2737', accent: 'B5651D', hr: 'B5651D' },
  { id: 'deep_teal_bronze', label: 'Deep Teal & Bronze', primary: '1A5F5A', accent: 'A0522D', hr: 'A0522D' },
  { id: 'plum_sage',        label: 'Plum & Sage',        primary: '5B2C6F', accent: '5F8575', hr: '5F8575' },
];

export type ColorSchemeId = typeof BOOKLET_COLOR_SCHEMES[number]['id'];

export const SERIES_EXPORT_DEFAULT_COLOR_SCHEME: ColorSchemeId = 'forest_gold';

export function getColorScheme(id?: ColorSchemeId | null): ColorScheme {
  return (
    BOOKLET_COLOR_SCHEMES.find((s) => s.id === id) ??
    BOOKLET_COLOR_SCHEMES[0]
  );
}

// ============================================================================
// FONTS
// ============================================================================

export interface PdfFontFiles {
  regular:    string;   // URL path under /fonts/ served from public/fonts/
  bold:       string;
  italic:     string;
  boldItalic: string;
}

export interface FontOption {
  id:           string;
  label:        string;
  cssFamily:    string;      // CSS font-family stack for modal preview
  docxName:     string;      // Exact name for DOCX TextRun font
  pdfFamily:    string;      // Registered name in jsPDF (or built-in: 'times' | 'helvetica')
  pdfFontFiles?: PdfFontFiles; // Omit for built-in fonts (times, helvetica)
}

export const SERIES_EXPORT_FONT_OPTIONS: FontOption[] = [
  {
    id:        'pagella',
    label:     'TeX Gyre Pagella (Palatino)',
    cssFamily: '"TeX Gyre Pagella", "Palatino Linotype", "Book Antiqua", Palatino, serif',
    docxName:  'Palatino Linotype',
    pdfFamily: 'Pagella',
    pdfFontFiles: {
      regular:    '/fonts/Pagella-Regular.ttf',
      bold:       '/fonts/Pagella-Bold.ttf',
      italic:     '/fonts/Pagella-Italic.ttf',
      boldItalic: '/fonts/Pagella-BoldItalic.ttf',
    },
  },
  {
    id:        'garamond',
    label:     'EB Garamond',
    cssFamily: '"EB Garamond", Garamond, "Times New Roman", serif',
    docxName:  'Garamond',
    pdfFamily: 'EBGaramond',
    pdfFontFiles: {
      regular:    '/fonts/EBGaramond-Regular.ttf',
      bold:       '/fonts/EBGaramond-Bold.ttf',
      italic:     '/fonts/EBGaramond-Italic.ttf',
      boldItalic: '/fonts/EBGaramond-BoldItalic.ttf',
    },
  },
  {
    id:        'crimson',
    label:     'Crimson Pro',
    cssFamily: '"Crimson Pro", "Crimson Text", Georgia, serif',
    docxName:  'Crimson Pro',
    pdfFamily: 'CrimsonPro',
    pdfFontFiles: {
      regular:    '/fonts/CrimsonPro-Regular.ttf',
      bold:       '/fonts/CrimsonPro-Bold.ttf',
      italic:     '/fonts/CrimsonPro-Italic.ttf',
      boldItalic: '/fonts/CrimsonPro-BoldItalic.ttf',
    },
  },
  {
    id:        'times',
    label:     'Times New Roman',
    cssFamily: '"Times New Roman", Times, serif',
    docxName:  'Times New Roman',
    pdfFamily: 'times',
    // No pdfFontFiles -- uses jsPDF built-in Times-Roman
  },
  {
    id:        'calibri',
    label:     'Calibri (Carlito)',
    cssFamily: 'Calibri, "Gill Sans", "Trebuchet MS", sans-serif',
    docxName:  'Calibri',
    pdfFamily: 'Carlito',
    pdfFontFiles: {
      regular:    '/fonts/Carlito-Regular.ttf',
      bold:       '/fonts/Carlito-Bold.ttf',
      italic:     '/fonts/Carlito-Italic.ttf',
      boldItalic: '/fonts/Carlito-BoldItalic.ttf',
    },
  },
];

export type FontId = typeof SERIES_EXPORT_FONT_OPTIONS[number]['id'];

export const SERIES_EXPORT_DEFAULT_FONT: FontId = 'pagella';

export function getFontOption(id?: FontId | null): FontOption {
  return (
    SERIES_EXPORT_FONT_OPTIONS.find((f) => f.id === id) ??
    SERIES_EXPORT_FONT_OPTIONS[0]
  );
}

// ============================================================================
// EXPORT OPTIONS INTERFACE
// ============================================================================

export interface SeriesExportOptions {
  format:                    SeriesExportFormat;
  layout?:                   SeriesExportLayout;
  colorSchemeId?:            ColorSchemeId;
  font?:                     FontId;
  includeHandoutBooklet?:    boolean;
  omitSection8FromChapters?: boolean;
  audience_profile?: {
    role:        string;
    assembly:    string;
    participant: string;
  };
}

export const SERIES_EXPORT_DEFAULT_OPTIONS: Partial<SeriesExportOptions> = {
  format:        SERIES_EXPORT_FORMATS.PDF,
  layout:        SERIES_EXPORT_LAYOUTS.FULL_PAGE,
  colorSchemeId: SERIES_EXPORT_DEFAULT_COLOR_SCHEME,
  font:          SERIES_EXPORT_DEFAULT_FONT,
  includeHandoutBooklet:    true,
  omitSection8FromChapters: true,
};

// ============================================================================
// PROGRESS STEPS
// ============================================================================

export const SERIES_EXPORT_PROGRESS_STEPS = {
  PREPARING:  'preparing',
  COVER:      'cover',
  TOC:        'toc',
  LESSONS:    'lessons',
  HANDOUT:    'handout',
  FINALIZING: 'finalizing',
} as const;

export type SeriesExportProgressStepId =
  (typeof SERIES_EXPORT_PROGRESS_STEPS)[keyof typeof SERIES_EXPORT_PROGRESS_STEPS];

export const SERIES_EXPORT_PROGRESS_STEP_LABELS: Record<SeriesExportProgressStepId, string> = {
  [SERIES_EXPORT_PROGRESS_STEPS.PREPARING]:  'Preparing document...',
  [SERIES_EXPORT_PROGRESS_STEPS.COVER]:      'Building cover page...',
  [SERIES_EXPORT_PROGRESS_STEPS.TOC]:        'Building table of contents...',
  [SERIES_EXPORT_PROGRESS_STEPS.LESSONS]:    'Formatting lessons...',
  [SERIES_EXPORT_PROGRESS_STEPS.HANDOUT]:    'Preparing group handout...',
  [SERIES_EXPORT_PROGRESS_STEPS.FINALIZING]: 'Finalizing document...',
};

// ============================================================================
// PAGE DIMENSIONS (points -- 72pt per inch)
// ============================================================================

export const FULLPAGE_PDF = {
  width:        612,
  height:       792,
  marginTop:    72,
  marginBottom: 72,
  marginLeft:   72,
  marginRight:  57.6,
} as const;

export const BOOKLET_PAGE = {
  width:        396,
  height:       612,
  marginTop:    28.8,
  marginBottom: 28.8,
  marginLeft:   18,
  marginRight:  28.8,
} as const;

// ============================================================================
// TYPOGRAPHY (legacy -- builders migrate to getColorScheme + getFontOption)
// ============================================================================

export const SERIES_PAGE = {
  width:        612,
  height:       792,
  marginTop:    72,
  marginBottom: 72,
  marginLeft:   72,
  marginRight:  57.6,
  textWidth:    482.4,
} as const;

export const SERIES_COVER_TYPOGRAPHY = {
  titleSize:    28,
  subtitleSize: 14,
  bodySize:     11,
  lineHeight:   1.35,
} as const;

export const SERIES_CHAPTER_TYPOGRAPHY = {
  chapterLabelSize: 9,
  titleSize:        18,
  subtitleSize:     12,
  bodySize:         11,
  lineHeight:       1.35,
} as const;

export const SERIES_TOC_TYPOGRAPHY = {
  headingSize:  14,
  entrySize:    11,
  lineHeight:   1.4,
} as const;

// ============================================================================
// COLORS (legacy fallback -- Forest & Gold)
// Builders should prefer: getColorScheme(options.colorSchemeId)
// ============================================================================

export const SERIES_COLORS = {
  primary:       '3D5C3D',
  accent:        'B8860B',
  bodyText:      '1A1A1A',
  mutedText:     '666666',
  border:        'D1D5DB',
  handoutHeader: '3D5C3D',
  coverBg:       'FFFFFF',
} as const;

// ============================================================================
// SPACING AND FORMATTING
// ============================================================================

export const EXPORT_SPACING = {
  afterTitle:       200,
  afterHeading:     120,
  afterParagraph:   80,
  afterSection:     160,
  beforeSection:    120,
  lineSpacing:      276,
  fonts: {
    pdf:  'helvetica',
    docx: 'Palatino Linotype',
  },
  colors: {
    bodyText:   '1A1A1A',
    metaText:   '666666',
    footerText: '999999',
  },
  body: {
    fontPt:     11,
    lineHeight: 1.4,
  },
  paragraph: {
    afterPt: 8,
  },
  metadata: {
    fontPt: 10,
  },
  footer: {
    fontPt: 9,
  },
} as const;

export const EXPORT_FORMATTING = {
  maxLineLength: 90,
  indentSize:    360,
  bulletIndent:  720,
} as const;

// ============================================================================
// COPY CONSTANTS
// ============================================================================

export const SERIES_COVER_COPY = {
  preparedBy:   'Prepared by',
  seriesLabel:  'Teaching Series',
  lessonCount:  (n: number) => n === 1 ? '1 Lesson' : n + ' Lessons',
  generatedBy:  'Generated by BibleLessonSpark',
  website:      'biblelessonspark.com',
  subtitle:     'A BibleLessonSpark Curriculum Series',
  teacherLabel: 'Prepared by',
  churchLabel:  'For',
} as const;

export const SERIES_INTRO_PLACEHOLDER =
  'This curriculum was prepared to equip teachers for faithful, engaging Bible instruction. ' +
  'Each lesson is designed to be taught in a single session and includes teaching content, ' +
  'discussion questions, and a reproducible group handout.';

export const SERIES_HANDOUT_COPY = {
  appendixTitle:       'Group Handout Section',
  appendixSubtitle:    'Reproducible handouts for each lesson -- these pages may be freely reproduced for use within your group.',
  handoutHeaderPrefix: 'Lesson',
} as const;

export const STUDENT_HANDOUT_SECTION_NUMBER = 8;

// ============================================================================
// UI COPY
// ============================================================================

export const SERIES_EXPORT_UI = {
  modalTitle:                'Export Series',
  modalSubtitle:             'Download your teaching series as a print-ready document.',
  step1Title:                'Configure Your Export',
  layoutLabel:               'Layout',
  colorSchemeLabel:          'Color Scheme',
  colorSchemeSubNote:        'Applies to headings and decorative elements.',
  fontLabel:                 'Body Font',
  formatLabel:               'File Format',
  formatRequiredHint:        'Please select a format to continue.',
  optionsLabel:              'Options',
  handoutBookletLabel:       'Include Group Handout',
  handoutBookletDescription: 'Appends reproducible handout pages for each lesson.',
  printInstructions:         'Open in your PDF viewer, select duplex (two-sided) printing, and staple along the left edge.',
  exportButtonPdf:           'Download Print-Ready PDF',
  exportButtonDocx:          'Download Document',
  cancelButton:              'Cancel',
  successMessage:            'Series exported successfully.',
  buttonLabel:               'Export Series',
  upgradePrompt:             'Upgrade to Personal Plan to export your series as a complete curriculum document.',
} as const;

// ============================================================================
// AUDIENCE TERMINOLOGY RESOLVER
// ============================================================================

export function resolveExportTerminology(audience?: {
  role?:        string;
  assembly?:    string;
  participant?: string;
}): { role: string; assembly: string; participant: string } {
  return {
    role:        audience?.role        ?? 'Teacher',
    assembly:    audience?.assembly    ?? 'Class',
    participant: audience?.participant ?? 'Student',
  };
}

// ============================================================================
// FILENAME BUILDER
// ============================================================================

export function buildSeriesExportFilename(
  seriesName: string,
  format: SeriesExportFormat
): string {
  const slug = seriesName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  const ext = format === SERIES_EXPORT_FORMATS.DOCX ? 'docx' : 'pdf';
  return slug + '.' + ext;
}

// ============================================================================
// MIME TYPES
// ============================================================================

export const SERIES_EXPORT_FORMAT_MIME: Record<SeriesExportFormat, string> = {
  [SERIES_EXPORT_FORMATS.PDF]:     'application/pdf',
  [SERIES_EXPORT_FORMATS.DOCX]:    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  [SERIES_EXPORT_FORMATS.BOOKLET]: 'application/pdf',
};
