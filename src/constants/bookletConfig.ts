// ============================================================================
// bookletConfig.ts -- SSOT for Print Series Booklet
// Location: src/constants/bookletConfig.ts
//
// Single Source of Truth for every value that controls booklet output.
// buildBookletPdf.ts imports from THIS FILE EXCLUSIVELY.
// Zero hardcoded numbers or hex strings are permitted in the builder.
//
// ARCHITECTURE GUARANTEE:
//   Same BookletOptions -> identical PDF output, every time, no drift.
//   If a value is not in this file, it does not exist in the booklet.
//
// SSOT IMPORT CHAIN:
//   bookletConfig.ts
//     -> BRANDING from @/config/branding  (site URL, support email)
//     -> EXPORT_SPACING from @/constants/lessonStructure  (re-used base values)
//
// FEATURE GATE: Personal Plan -- see featureFlags.ts -> 'bookletPrint'
//
// Last Updated: 2026-03-04
// ============================================================================

import { BRANDING } from '@/config/branding';
import { EXPORT_SPACING } from '@/constants/lessonStructure';

// ============================================================================
// SHEET & PAGE GEOMETRY  (all values in points -- 1 inch = 72 pt)
// ============================================================================

/**
 * Physical sheet -- landscape 11" x 8.5".
 * Each sheet holds TWO booklet pages side by side.
 * Fold at centre -> 5.5" x 8.5" portrait booklet.
 */
export const BOOKLET_SHEET = {
  widthPt:      792,   // 11.0" x 72
  heightPt:     612,   //  8.5" x 72
  halfWidthPt:  396,   //  5.5" x 72 -- one booklet page width
} as const;

/**
 * Margins -- mirrored so spine side is always slightly wider.
 * Outer (away from fold): 0.40" = 28.8 pt
 * Spine (toward fold):    0.50" = 36.0 pt
 * Top / Bottom:           0.40" = 28.8 pt
 * Footer reservation:     0.20" = 14.4 pt (above bottom margin)
 */
export const BOOKLET_MARGIN = {
  outerPt:   28.8,
  spinePt:   36.0,
  topPt:     28.8,
  bottomPt:  28.8,
  footerPt:  14.4,
} as const;

/**
 * Derived text area -- identical for every booklet page.
 * widthPt  = halfWidth - outer - spine = 396 - 28.8 - 36   = 331.2 pt (~= 4.6")
 * bottomY  = height - bottom - footer  = 612 - 28.8 - 14.4 = 568.8 pt
 * footerY  = height - bottom           = 612 - 28.8         = 583.2 pt
 */
export const BOOKLET_TEXT = {
  widthPt:  331.2,
  topY:      28.8,   // jsPDF Y of first text line (from top of sheet)
  bottomY:  568.8,   // jsPDF Y -- content must not exceed this
  footerY:  583.2,   // jsPDF Y -- footer text baseline
} as const;

/**
 * X origin of the text block for each half of the sheet.
 * LEFT  page: outer margin on left, spine on right -> X = outerPt
 * RIGHT page: spine on left, outer margin on right -> X = halfWidth + spinePt
 */
export const BOOKLET_TEXT_X = {
  left:  BOOKLET_MARGIN.outerPt,
  right: BOOKLET_SHEET.halfWidthPt + BOOKLET_MARGIN.spinePt,
} as const;

// ============================================================================
// SADDLE-STITCH IMPOSITION
// ============================================================================

/**
 * Saddle-stitch formula for N booklet pages (N must be multiple of 4).
 *
 * Sheet k FRONT:  [ N-2k+2  |  2k-1 ]
 * Sheet k BACK:   [ 2k      |  N-2k+1 ]
 *
 * Example -- 8 pages, 2 sheets:
 *   Sheet 1 FRONT: p8 | p1    Sheet 1 BACK: p2 | p7
 *   Sheet 2 FRONT: p6 | p3    Sheet 2 BACK: p4 | p5
 *
 * PDF output order: Sheet1-Front, Sheet1-Back, Sheet2-Front, Sheet2-Back
 * Print duplex on long edge -> fold -> nest inner inside outer -> staple spine.
 */
export interface ImpositionSheet {
  frontLeft:  number;
  frontRight: number;
  backLeft:   number;
  backRight:  number;
}

export function buildImpositionPlan(nPages: number): ImpositionSheet[] {
  assertValidPageCount(nPages);
  const plan: ImpositionSheet[] = [];
  for (let k = 1; k <= nPages / 4; k++) {
    plan.push({
      frontLeft:  nPages - 2 * k + 2,
      frontRight: 2 * k - 1,
      backLeft:   2 * k,
      backRight:  nPages - 2 * k + 1,
    });
  }
  return plan;
}

export function assertValidPageCount(nPages: number): void {
  if (nPages < 4 || nPages % 4 !== 0) {
    throw new Error(
      `BOOKLET: page count must be a positive multiple of 4. Got ${nPages}. ` +
      'Pad with blank pages to reach the next multiple of 4.'
    );
  }
}

// ============================================================================
// TYPOGRAPHY
// ============================================================================

/**
 * jsPDF built-in font families.
 * 'times'      = Times New Roman / Georgia equivalent (serif)
 * 'helvetica'  = Helvetica / Arial equivalent (sans-serif)
 */
export const BOOKLET_FONTS = {
  body: 'times',
  sans: 'helvetica',
} as const;

/**
 * Every font size used in the booklet -- in points.
 * No literal font size may appear in buildBookletPdf.ts.
 */
export const BOOKLET_FONT_SIZES = {
  bodyPt:         12,   // Body text -- 12pt floor per AOA recommendation
  titlePt:        16,   // Lesson title / page header
  labelPt:        10,   // Section labels (ALL CAPS, sans bold)
  scriptureRefPt: 10,   // Scripture reference (sans bold)
  scripturePt:    11,   // Scripture verse (serif italic)
  footerPt:        8,   // Footer (sans)
  metaPt:          9,   // Secondary / caption text
  // Cover-specific
  coverIdentPt:   7.5,  // Spaced caps identity line
  coverSeriesPt:  22,   // Series title -- the centrepiece
  coverPreTitlePt:14,   // Smaller stacked line ("The")
  coverSubPt:     13,   // Scripture reference on cover
  coverMetaPt:     9,   // Meta lines (lessons, theology, dates)
  coverSitePt:     9,   // Site URL on cover
  // TOC
  tocSessionPt:    9,
  tocTitlePt:     12,
  tocScripturePt:  9,
  // Copyright
  copyrightPt:    7.5,
} as const;

/**
 * Line leading -- vertical advance per line, in points.
 */
export const BOOKLET_LEADING = {
  bodyLd:       15,   // 12pt body (tightened for print economy)
  scriptureLd:  14,   // 11pt scripture verse (tightened)
  metaLd:       13,   // 9pt meta
  copyrightLd:  11,   // 7.5pt copyright
} as const;

// ============================================================================
// SPACING  (all in points -- no literal values in the builder)
// ============================================================================

export const BOOKLET_SPACING = {
  afterPageHeader:    22,   // From gold rule below header to first section
  afterSectionLabel:  10,   // From gold rule below label to first content line
  labelRuleOffset:     4,   // Gap from label baseline down to its gold rule
  afterSectionBlock:  12,   // Between major sections
  afterParagraph:      4,   // Between paragraphs within a section
  afterBulletItem:     2,   // Between bullet list items
  afterDiscQuestion:   2,   // Between discussion questions
  afterScripture:     14,   // Below scripture block (verse + reference line)
  memVerseRuleGap:    11,   // From top gold rule down to MEMORY VERSE label
  afterMemVerse:      10,   // Below closing gold rule of memory verse block
  bulletIndent:       14,   // Bullet text X offset from bullet glyph
  discNumIndent:      16,   // Discussion text X offset from number
  discCatIndent:       0,   // Additional X offset for category label
  tocEntryGap:        16,   // Between TOC entries
  coverDoubleRuleGap:  4,   // Between paired gold rules on cover
  coverSectionGap:    20,   // Between structural sections on cover
  coverRuleInset:     30,   // Shorter rules horizontal inset from text edge
  coverTitleLineGap:   5,   // Extra gap added below each cover title line
  ruleThick:         0.8,   // Gold accent rules
  ruleLight:         0.4,   // Light gray divider rules (footer, TOC separator)
  foldLineDash:        3,   // Dash length for fold marker (PREVIEW_MODE only)
  foldLineGap:         4,   // Gap length for fold marker dashes
  foldLineThick:     0.3,   // Fold marker line weight
} as const;

// ============================================================================
// COLOR SCHEMES
// ============================================================================

export interface BookletColorScheme {
  /** Human-readable name shown in the modal */
  label:    string;
  /** Headings, section labels, page title, question numbers, TOC labels */
  heading:  string;
  /** Rules, bullet glyphs, accent lines */
  accent:   string;
  /** All body paragraph text -- always true black for maximum readability */
  body:     string;
  /** Footer, scripture reference label, secondary captions */
  meta:     string;
  /** Light horizontal divider rules */
  rule:     string;
  /** Fold annotation line (PREVIEW_MODE = true only -- never printed) */
  fold:     string;
}

/**
 * All available color schemes.
 * The builder receives ONE resolved scheme -- it never reads this map directly.
 *
 * GRAYSCALE PRINT GUARANTEE (approximate gray value / 255):
 *   heading -> dark   (30--90)   distinct from page white
 *   accent  -> mid    (105--140) distinct from heading and white
 *   body    -> #000000 true black -- maximum contrast on any printer
 */
export const BOOKLET_COLOR_SCHEMES: Record<string, BookletColorScheme> = {

  forestGold: {
    label:   'Forest & Gold',
    heading: '#3D5C3D',   // forest green    gray ~= 67
    accent:  '#B8860B',   // dark goldenrod  gray ~= 128
    body:    '#000000',
    meta:    '#666666',
    rule:    '#CCCCCC',
    fold:    '#BBBBBB',
  },

  navySteel: {
    label:   'Navy & Steel',
    heading: '#1B3A6B',   // deep navy       gray ~= 38
    accent:  '#4A7BA6',   // steel blue      gray ~= 140
    body:    '#000000',
    meta:    '#666666',
    rule:    '#CCCCCC',
    fold:    '#BBBBBB',
  },

  burgundyCopper: {
    label:   'Burgundy & Copper',
    heading: '#6B2737',   // deep burgundy   gray ~= 50
    accent:  '#9B6B3E',   // warm copper     gray ~= 120
    body:    '#000000',
    meta:    '#666666',
    rule:    '#CCCCCC',
    fold:    '#BBBBBB',
  },

  tealBronze: {
    label:   'Deep Teal & Bronze',
    heading: '#1A5C58',   // deep teal       gray ~= 90
    accent:  '#8B6B2E',   // bronze          gray ~= 110
    body:    '#000000',
    meta:    '#666666',
    rule:    '#CCCCCC',
    fold:    '#BBBBBB',
  },

  plumSage: {
    label:   'Plum & Sage',
    heading: '#4A2060',   // deep plum       gray ~= 30
    accent:  '#5A7A5A',   // sage green      gray ~= 105
    body:    '#000000',
    meta:    '#666666',
    rule:    '#CCCCCC',
    fold:    '#BBBBBB',
  },

} as const;

export const BOOKLET_DEFAULT_COLOR_SCHEME = 'forestGold' as const;
export type BookletColorSchemeKey = keyof typeof BOOKLET_COLOR_SCHEMES;

// ============================================================================
// BOOKLET OPTIONS  (what the modal passes to the builder)
// ============================================================================

export interface BookletOptions {
  colorScheme:           BookletColorSchemeKey;
  includeHandoutSection: boolean;
  /**
   * false (default) -> clean print-ready PDF, zero annotations.
   * true            -> fold line + imposition labels visible on screen.
   * Teachers always receive false. Never expose this in the UI.
   */
  previewMode:           boolean;
}

export const BOOKLET_DEFAULT_OPTIONS: BookletOptions = {
  colorScheme:           BOOKLET_DEFAULT_COLOR_SCHEME,
  includeHandoutSection: true,
  previewMode:           false,
} as const;

// ============================================================================
// ALL USER-FACING TEXT  (pastoral voice -- edit here, reflects everywhere)
// ============================================================================

export const BOOKLET_LABELS = {
  sessionPrefix:       'SESSION',
  // Section labels (builder renders ALL CAPS)
  lessonOverview:      'Lesson Overview',
  theologicalBg:       'Theological Background',
  teacherPrep:         'Teacher Preparation',
  keyScriptures:       'Key Scriptures',
  openingActivities:   'Opening Activities',
  gospelConnection:    'Gospel Connection',
  discussionAssess:    'Discussion & Assessment',
  memoryVerse:         'Memory Verse',
  weeklyChallenge:     'Weekly Challenge',
  studentHandout:      'Student Handout',
  // Cover
  coverSeriesLabel:    'A Sunday School Curriculum Series',
  coverIdentLabel:     'B I B L E  L E S S O N  S P A R K',
  // TOC
  tocHeading:          'Table of Contents',
  tocIntroEntry:       'Introduction',
  tocHandoutEntry:     'Student Handout Booklet',
  // Introduction page
  introHeading:        'Introduction',
  introHowToUse:       'How to Use This Booklet',
  introBody:
    'This curriculum series was prepared using BibleLessonSpark.com. ' +
    'Each lesson has been crafted to align with your theology profile, ' +
    'age group, and Bible version, providing a consistent and faithful ' +
    'teaching resource for your class.',
  introClosing:
    'May the Lord use these lessons to encourage growth in His Word.',
  howToBeforeClass:  'Before Class',
  howToBeforeBody:
    'Read the Theological Background and Teacher Preparation sections. ' +
    'These equip you to teach \u2014 they are not read aloud to students.',
  howToDuringClass:  'During Class',
  howToDuringBody:
    'Follow Opening Activities, Main Teaching, and Discussion Questions ' +
    'in order. The Student Handout is distributed at the end of class.',
  howToHandouts:     'Student Handouts',
  howToHandoutsBody:
    'The handout section at the back may be reproduced freely for your ' +
    'class members each week.',
  // Copyright / permissions
  copyrightNote:
    'Student handouts may be reproduced freely for use within your ' +
    'local church Sunday School class.',
  // Footer
  footerSite: BRANDING.urls?.baseUrl ?? 'BibleLessonSpark.com',
  // Back cover
  backCoverLine1: 'Customized curriculum for your class,',
  backCoverLine2: 'your theology, your teachers.',
  backCoverSite:  BRANDING.urls?.baseUrl ?? 'BibleLessonSpark.com',
} as const;

// ============================================================================
// MODAL UI COPY
// ============================================================================

export const BOOKLET_UI = {
  buttonLabel:      'Print Series Booklet',
  modalTitle:       'Print Series Booklet',
  modalSubtitle:
    'Generate a print-ready booklet your class can fold, staple, and keep.',
  colorSchemeLabel: 'Booklet Color Scheme',
  colorSchemeHint:  'All schemes print clearly on black-only printers.',
  handoutLabel:     'Include Student Handout Section',
  handoutDesc:
    'Adds a reproducible handout for each lesson at the back of the booklet.',
  printButton:      'Download Print-Ready PDF',
  cancelButton:     'Cancel',
  progressLabel:    'Building your booklet\u2026',
  successMessage:   'Your booklet PDF is ready to print.',
  errorMessage:
    'We could not build your booklet. Please try again. ' +
    'If the problem continues, contact ' +
    (BRANDING.contact?.supportEmail ?? 'support@biblelessonspark.com') + '.',
  upgradePrompt:
    'Upgrade to Personal Plan to print a class booklet for your series.',
  printInstructions:
    'Print duplex (both sides), flip on long edge. ' +
    'Fold sheets in half, nest inner inside outer, staple the spine.',
} as const;

// ============================================================================
// PROGRESS STEPS
// ============================================================================

export const BOOKLET_PROGRESS_STEPS = [
  { id: 'loading',    label: 'Loading lesson content\u2026'        },
  { id: 'cover',      label: 'Building cover page\u2026'           },
  { id: 'toc',        label: 'Generating table of contents\u2026'  },
  { id: 'lessons',    label: 'Laying out lesson pages\u2026'       },
  { id: 'handouts',   label: 'Adding student handouts\u2026'       },
  { id: 'finalizing', label: 'Finalising booklet\u2026'            },
] as const;

export type BookletProgressStepId =
  typeof BOOKLET_PROGRESS_STEPS[number]['id'];

// ============================================================================
// RESOLVER & UTILITIES  (used only by buildBookletPdf.ts)
// ============================================================================

/**
 * Returns the fully resolved BookletColorScheme for the given options.
 * Falls back to the default scheme silently if the key is not found.
 * The builder calls this ONCE at the top -- never reaches into
 * BOOKLET_COLOR_SCHEMES directly.
 */
export function resolveColorScheme(options: BookletOptions): BookletColorScheme {
  return (
    BOOKLET_COLOR_SCHEMES[options.colorScheme] ??
    BOOKLET_COLOR_SCHEMES[BOOKLET_DEFAULT_COLOR_SCHEME]
  );
}

/**
 * Converts hex color (with or without #) to [r, g, b] 0-255 tuple.
 * Centralised here so the builder never reimplements it.
 */
export function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

