// ============================================================================
// buildSeriesDocx.ts
// Location: src/utils/export/buildSeriesDocx.ts
//
// DOCX document builder for the Series Curriculum Export.
//
// Document structure:
//   Section 1: Cover Page + Table of Contents + Introduction (no page numbers)
//   Section 2..N+1: One section per lesson (per-lesson page numbering)
//   Section N+2: Student Handout Booklet (own page numbering)
//   Section N+3: Back Cover (no page numbers)
//
// SSOT IMPORTS:
//   - EXPORT_SPACING (colors, spacing, typography) <- lessonStructure.ts
//   - Color scheme, font, export options          <- seriesExportConfig.ts
//   - App name, website URL                       <- branding.ts
// ============================================================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  PageBreak,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  LevelFormat,
  Footer,
  Header,
  PageNumber,
  convertInchesToTwip,
} from 'docx';

import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  SeriesExportOptions,
  SeriesExportProgressStepId,
  SERIES_PAGE,
  SERIES_COVER_TYPOGRAPHY,
  SERIES_CHAPTER_TYPOGRAPHY,
  SERIES_TOC_TYPOGRAPHY,
  SERIES_COVER_COPY,
  SERIES_INTRO_PLACEHOLDER,
  SERIES_HANDOUT_COPY,
  getColorScheme,
  getFontOption,
} from '@/constants/seriesExportConfig';
import { EXPORT_SPACING } from '@/constants/lessonStructure';
import { BRANDING } from '@/config/branding';
import { buildCoverPageData } from './buildCoverPage';
import { buildTocEntries } from './buildToc';
import {
  buildHandoutBookletData,
  extractSection8Content,
  extractCreativeTitle,
  stripSection8FromContent,
} from './buildHandoutBooklet';

// ============================================================================
// COLOR SCHEME TYPE (local alias for clarity)
// ============================================================================

interface ActiveScheme {
  primary: string;
  accent:  string;
}

// ============================================================================
// PAGE DIMENSIONS (DXA -- computed from SERIES_PAGE points, 1pt = 20 DXA)
// ============================================================================

const SHARED_PAGE_PROPS = {
  size: {
    width:  SERIES_PAGE.width  * 20,
    height: SERIES_PAGE.height * 20,
  },
  margin: {
    top:    SERIES_PAGE.marginTop    * 20,
    right:  SERIES_PAGE.marginRight  * 20,
    bottom: SERIES_PAGE.marginBottom * 20,
    left:   SERIES_PAGE.marginLeft   * 20,
  },
};

// ============================================================================
// PARAGRAPH STYLES (built at runtime with active scheme + font)
// ============================================================================

function buildParagraphStyles(scheme: ActiveScheme, fontName: string) {
  return [
    {
      id:      'Heading1',
      name:    'Heading 1',
      basedOn: 'Normal',
      next:    'Normal',
      run: {
        size:  SERIES_COVER_TYPOGRAPHY.subtitleSize * 2,
        bold:  true,
        color: scheme.primary,
        font:  fontName,
      },
      paragraph: {
        spacing: {
          before: EXPORT_SPACING.sectionHeader.beforeTwips,
          after:  EXPORT_SPACING.sectionHeader.afterTwips,
        },
        outlineLevel: 0,
      },
    },
    {
      id:      'Heading2',
      name:    'Heading 2',
      basedOn: 'Normal',
      next:    'Normal',
      run: {
        size:  SERIES_CHAPTER_TYPOGRAPHY.titleSize * 2,
        bold:  true,
        color: scheme.primary,
        font:  fontName,
      },
      paragraph: {
        spacing: {
          before: EXPORT_SPACING.sectionHeader.beforeTwips,
          after:  EXPORT_SPACING.sectionHeader.afterTwips,
        },
        outlineLevel: 1,
      },
    },
  ];
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

export async function buildSeriesDocx(
  series:   LessonSeries,
  lessons:  Lesson[],
  options:  SeriesExportOptions,
  setStep:  (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  const scheme  = getColorScheme(options.colorSchemeId);
  const fontOpt = getFontOption(options.font);
  const fontName = fontOpt.docxName;

  const activeScheme: ActiveScheme = {
    primary: scheme.primary,
    accent:  scheme.accent,
  };

  const docSections: any[] = [];

  // ---- Section 1: Front Matter (Cover + TOC + Intro) -----------------------
  setStep('cover');
  const coverData = buildCoverPageData(series, lessons, null, null);
  const frontMatterChildren: Paragraph[] = [];

  frontMatterChildren.push(...buildDocxCoverPage(coverData, activeScheme, fontName));

  setStep('toc');
  const tocEntries = buildTocEntries(series, lessons);
  frontMatterChildren.push(...buildDocxToc(tocEntries, activeScheme, fontName));

  frontMatterChildren.push(
    pageBreakParagraph(),
    headingParagraph('Introduction', 'Heading1', activeScheme.primary, fontName),
    bodyParagraph(SERIES_INTRO_PLACEHOLDER, false, fontName)
  );

  docSections.push({
    properties: { page: SHARED_PAGE_PROPS },
    children:   frontMatterChildren,
  });

  // ---- Sections 2..N+1: One per lesson ------------------------------------
  setStep('lessons');
  for (let i = 0; i < lessons.length; i++) {
    const lesson        = lessons[i];
    const lessonNumber  = i + 1;
    const creativeTitle = extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNumber);
    const passage       = lesson.filters?.passage ?? series.bible_passage ?? '';

    const lessonChildren: Paragraph[] = [];

    lessonChildren.push(
      ...buildCompactLessonHeader(lessonNumber, creativeTitle, passage, activeScheme, fontName)
    );

    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const content    = options.omitSection8FromChapters
      ? stripSection8FromContent(rawContent)
      : rawContent;

    lessonChildren.push(...buildDocxLessonContent(content, activeScheme, fontName));

    const lessonFooter = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text:  'Lesson ' + lessonNumber + ' -- Page ',
              size:  EXPORT_SPACING.footer.fontHalfPt,
              font:  fontName,
              color: EXPORT_SPACING.colors.footerText,
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              size:     EXPORT_SPACING.footer.fontHalfPt,
              font:     fontName,
              color:    EXPORT_SPACING.colors.footerText,
            }),
          ],
        }),
      ],
    });

    docSections.push({
      properties: {
        page: {
          ...SHARED_PAGE_PROPS,
          pageNumbers: { start: 1 },
        },
      },
      footers:  { default: lessonFooter },
      children: lessonChildren,
    });
  }

  // ---- Handout Booklet Section ---------------------------------------------
  if (options.includeHandoutBooklet) {
    setStep('handout');
    const bookletData    = buildHandoutBookletData(series, lessons);
    const handoutChildren: Paragraph[] = [];

    handoutChildren.push(
      headingParagraph(bookletData.appendixTitle, 'Heading1', activeScheme.primary, fontName),
      bodyParagraph(bookletData.appendixSubtitle, true, fontName)
    );

    for (const entry of bookletData.entries) {
      handoutChildren.push(
        pageBreakParagraph(),
        headingParagraph(entry.header, 'Heading2', activeScheme.primary, fontName)
      );
      if (entry.passage) {
        handoutChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text:    entry.passage,
                italics: true,
                size:    EXPORT_SPACING.metadata.fontHalfPt,
                color:   EXPORT_SPACING.colors.metaText,
                font:    fontName,
              }),
            ],
            spacing: { after: EXPORT_SPACING.sectionHeader.afterTwips },
          })
        );
      }
      handoutChildren.push(...buildDocxLessonContent(entry.content, activeScheme, fontName));
    }

    const handoutFooter = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text:  'Group Handouts -- Page ',
              size:  EXPORT_SPACING.footer.fontHalfPt,
              font:  fontName,
              color: EXPORT_SPACING.colors.footerText,
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              size:     EXPORT_SPACING.footer.fontHalfPt,
              font:     fontName,
              color:    EXPORT_SPACING.colors.footerText,
            }),
          ],
        }),
      ],
    });

    docSections.push({
      properties: {
        page: {
          ...SHARED_PAGE_PROPS,
          pageNumbers: { start: 1 },
        },
      },
      footers:  { default: handoutFooter },
      children: handoutChildren,
    });
  }

  // ---- Back Cover Section --------------------------------------------------
  docSections.push({
    properties: { page: SHARED_PAGE_PROPS },
    children:   buildDocxBackCover(fontName),
  });

  // ---- Assemble Document ---------------------------------------------------
  setStep('finalizing');

  const doc = new Document({
    styles:   { paragraphStyles: buildParagraphStyles(activeScheme, fontName) as any },
    sections: docSections,
  });

  return await Packer.toArrayBuffer(doc);
}

// ============================================================================
// COVER PAGE PARAGRAPHS
// ============================================================================

function buildDocxCoverPage(
  coverData: ReturnType<typeof buildCoverPageData>,
  scheme:    ActiveScheme,
  fontName:  string
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < 8; i++) {
    paragraphs.push(new Paragraph({ text: '' }));
  }

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text:  coverData.seriesTitle,
          bold:  true,
          size:  SERIES_COVER_TYPOGRAPHY.titleSize * 2,
          color: scheme.primary,
          font:  fontName,
        }),
      ],
      spacing: { after: 240 },
    })
  );

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text:  coverData.subtitle,
          size:  SERIES_COVER_TYPOGRAPHY.subtitleSize * 2,
          color: scheme.accent,
          font:  fontName,
        }),
      ],
      spacing: { after: 480 },
    })
  );

  paragraphs.push(
    new Paragraph({
      text: '',
      border: {
        bottom: {
          color: scheme.accent,
          space: 1,
          style: BorderStyle.SINGLE,
          size:  6,
        },
      },
      spacing: { after: 360 },
    })
  );

  const metaLines = [
    coverData.teacherLine,
    coverData.churchLine,
    coverData.lessonCountLine,
  ].filter((l): l is string => l !== null);

  for (const line of metaLines) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text:  line,
            size:  SERIES_COVER_TYPOGRAPHY.bodySize * 2,
            color: EXPORT_SPACING.colors.metaText,
            font:  fontName,
          }),
        ],
        spacing: { after: 160 },
      })
    );
  }

  return paragraphs;
}

// ============================================================================
// TABLE OF CONTENTS PARAGRAPHS
// ============================================================================

function buildDocxToc(
  entries:  ReturnType<typeof buildTocEntries>,
  scheme:   ActiveScheme,
  fontName: string
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    pageBreakParagraph(),
    headingParagraph('Table of Contents', 'Heading1', scheme.primary, fontName)
  );

  for (const entry of entries) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text:  entry.chapterHeading,
            bold:  true,
            size:  SERIES_TOC_TYPOGRAPHY.entrySize * 2,
            font:  fontName,
            color: EXPORT_SPACING.colors.bodyText,
          }),
        ],
        spacing: { after: 40 },
      })
    );

    if (entry.passage) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text:    entry.passage,
              italics: true,
              size:    EXPORT_SPACING.metadata.fontHalfPt,
              font:    fontName,
              color:   EXPORT_SPACING.colors.metaText,
            }),
          ],
          indent:  { left: 360 },
          spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
        })
      );
    }
  }

  return paragraphs;
}

// ============================================================================
// COMPACT LESSON HEADER
// ============================================================================

function buildCompactLessonHeader(
  lessonNumber: number,
  title:        string,
  passage:      string,
  scheme:       ActiveScheme,
  fontName:     string
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text:    'LESSON ' + lessonNumber,
          size:    SERIES_CHAPTER_TYPOGRAPHY.chapterLabelSize * 2,
          color:   EXPORT_SPACING.colors.metaText,
          font:    fontName,
          allCaps: true,
        }),
      ],
      spacing: { after: 60 },
    })
  );

  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text:  title,
          bold:  true,
          size:  SERIES_CHAPTER_TYPOGRAPHY.titleSize * 2,
          color: scheme.primary,
          font:  fontName,
        }),
      ],
      spacing: { after: 60 },
    })
  );

  if (passage) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text:    passage,
            italics: true,
            size:    SERIES_CHAPTER_TYPOGRAPHY.subtitleSize * 2,
            color:   EXPORT_SPACING.colors.metaText,
            font:    fontName,
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  paragraphs.push(
    new Paragraph({
      text: '',
      border: {
        bottom: {
          color: scheme.accent,
          space: 1,
          style: BorderStyle.SINGLE,
          size:  4,
        },
      },
      spacing: { after: 120 },
    })
  );

  return paragraphs;
}

// ============================================================================
// LESSON CONTENT PARAGRAPHS
// ============================================================================

function buildDocxLessonContent(
  content:  string,
  scheme:   ActiveScheme,
  fontName: string
): Paragraph[] {
  if (!content) return [];

  const lines      = content.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Strip markdown horizontal rules
    if (line.trim() === '---') continue;

    if (/^#{1,3}\s*$/.test(line)) continue;

    if (/^#{1,3}\s+/.test(line)) {
      const headingText = line.replace(/^#{1,3}\s+/, '');
      paragraphs.push(
        headingParagraph(headingText, 'Heading2', scheme.primary, fontName)
      );
      continue;
    }

    // Plain-text section labels: e.g. "Literary Context:"
    if (/^[A-Z][^:\n]{2,48}:$/.test(line.trim())) {
      paragraphs.push(
        headingParagraph(line.trim(), 'Heading2', scheme.primary, fontName)
      );
      continue;
    }

    if (/^\s*[*-]\s+/.test(line)) {
      const bulletText = line.replace(/^\s*[*-]\s+/, '');
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text:  bulletText,
              size:  EXPORT_SPACING.body.fontHalfPt,
              font:  fontName,
              color: EXPORT_SPACING.colors.bodyText,
            }),
          ],
          bullet:  { level: 0 },
          spacing: { after: EXPORT_SPACING.listItem.afterTwips },
          indent:  { left:  EXPORT_SPACING.listItem.indentTwips },
        })
      );
      continue;
    }

    if (line.trim() === '') {
      paragraphs.push(
        new Paragraph({
          text:    '',
          spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
        })
      );
      continue;
    }

    paragraphs.push(
      new Paragraph({
        children: parseInlineBold(line, fontName),
        spacing:  { after: EXPORT_SPACING.paragraph.afterTwips },
      })
    );
  }

  return paragraphs;
}

// ============================================================================
// BACK COVER PARAGRAPHS
// ============================================================================

function buildDocxBackCover(fontName: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < 10; i++) {
    paragraphs.push(new Paragraph({ text: '' }));
  }

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text:  'Generated by ' + BRANDING.appName,
          size:  EXPORT_SPACING.footer.fontHalfPt,
          color: EXPORT_SPACING.colors.footerText,
          font:  fontName,
        }),
      ],
      spacing: { after: 160 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text:  BRANDING.urls.baseUrl,
          size:  EXPORT_SPACING.footer.fontHalfPt,
          color: EXPORT_SPACING.colors.footerText,
          font:  fontName,
        }),
      ],
      spacing: { after: 160 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text:  '\u00A9 ' + new Date().getFullYear() + ' ' + BRANDING.appName + '. All rights reserved.',
          size:  EXPORT_SPACING.footer.fontHalfPt,
          color: EXPORT_SPACING.colors.footerText,
          font:  fontName,
        }),
      ],
    })
  );

  return paragraphs;
}

// ============================================================================
// UTILITY PARAGRAPH BUILDERS
// ============================================================================

function pageBreakParagraph(): Paragraph {
  return new Paragraph({
    children: [new PageBreak()],
  });
}

function headingParagraph(
  text:     string,
  headingId:'Heading1' | 'Heading2',
  color:    string,
  fontName: string
): Paragraph {
  return new Paragraph({
    style: headingId,
    keepNext: true,
    children: [
      new TextRun({
        text,
        color,
        font: fontName,
      }),
    ],
  });
}

function bodyParagraph(text: string, italic = false, fontName: string): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        italics: italic,
        size:    EXPORT_SPACING.body.fontHalfPt,
        font:    fontName,
        color:   EXPORT_SPACING.colors.bodyText,
      }),
    ],
    spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
  });
}

function parseInlineBold(line: string, fontName: string): TextRun[] {
  const runs:  TextRun[] = [];
  const parts = line.split(/(\*\*[^*]+\*\*)/g);

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text:  part.slice(2, -2),
          bold:  true,
          size:  EXPORT_SPACING.body.fontHalfPt,
          font:  fontName,
          color: EXPORT_SPACING.colors.bodyText,
        })
      );
    } else if (part) {
      runs.push(
        new TextRun({
          text:  part,
          size:  EXPORT_SPACING.body.fontHalfPt,
          font:  fontName,
          color: EXPORT_SPACING.colors.bodyText,
        })
      );
    }
  }

  return runs.length > 0
    ? runs
    : [
        new TextRun({
          text:  line,
          size:  EXPORT_SPACING.body.fontHalfPt,
          font:  fontName,
          color: EXPORT_SPACING.colors.bodyText,
        }),
      ];
}
