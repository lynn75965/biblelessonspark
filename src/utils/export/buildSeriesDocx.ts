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
// LAYOUT CHANGES (March 2026):
//   - Eliminated full-page chapter dividers to save paper
//   - Compact inline lesson header at top of content page
//   - Per-lesson page numbering in footer ("Lesson N -- Page X")
//   - Creative title as primary heading (not passage reference)
//   - Tighter spacing throughout to match quarterly-style density
//   - Color scheme resolved dynamically from options.colorSchemeId
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
  EXPORT_SPACING,
  EXPORT_FORMATTING,
  getColorScheme,
} from '@/constants/seriesExportConfig';
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
  heading: string;
  accent: string;
}

// ============================================================================
// PARAGRAPH STYLES (built at runtime with active scheme colors)
// ============================================================================

function buildParagraphStyles(scheme: ActiveScheme) {
  return [
    {
      id: 'Heading1',
      name: 'Heading 1',
      basedOn: 'Normal',
      next: 'Normal',
      run: {
        size: SERIES_COVER_TYPOGRAPHY.subtitleFontHalfPt,
        bold: true,
        color: scheme.heading,
        font: EXPORT_SPACING.fonts.docx,
      },
      paragraph: {
        spacing: {
          before: EXPORT_SPACING.sectionHeader.beforeTwips,
          after: EXPORT_SPACING.sectionHeader.afterTwips,
        },
        outlineLevel: 0,
      },
    },
    {
      id: 'Heading2',
      name: 'Heading 2',
      basedOn: 'Normal',
      next: 'Normal',
      run: {
        size: SERIES_CHAPTER_TYPOGRAPHY.chapterTitleFontHalfPt,
        bold: true,
        color: scheme.heading,
        font: EXPORT_SPACING.fonts.docx,
      },
      paragraph: {
        spacing: {
          before: EXPORT_SPACING.sectionHeader.beforeTwips,
          after: EXPORT_SPACING.sectionHeader.afterTwips,
        },
        outlineLevel: 1,
      },
    },
  ];
}

// ============================================================================
// SHARED PAGE PROPERTIES
// ============================================================================

const SHARED_PAGE_PROPS = {
  size: {
    width: SERIES_PAGE.widthDxa,
    height: SERIES_PAGE.heightDxa,
  },
  margin: {
    top: SERIES_PAGE.marginDxa,
    right: SERIES_PAGE.marginDxa,
    bottom: SERIES_PAGE.marginDxa,
    left: SERIES_PAGE.marginDxa,
  },
};

// ============================================================================
// MAIN BUILDER
// ============================================================================

export async function buildSeriesDocx(
  series: LessonSeries,
  lessons: Lesson[],
  options: SeriesExportOptions,
  setStep: (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  // Resolve color scheme from options (falls back to Forest & Gold)
  const scheme = getColorScheme(options.colorSchemeId);

  const docSections: any[] = [];

  // ---- Section 1: Front Matter (Cover + TOC + Intro, no page numbers) ------
  setStep('cover');
  const coverData = buildCoverPageData(series, lessons, null, null);
  const frontMatterChildren: Paragraph[] = [];

  frontMatterChildren.push(...buildDocxCoverPage(coverData, scheme));

  setStep('toc');
  const tocEntries = buildTocEntries(series, lessons);
  frontMatterChildren.push(...buildDocxToc(tocEntries, scheme));

  frontMatterChildren.push(
    pageBreakParagraph(),
    headingParagraph('Introduction', 'Heading1', scheme.heading),
    bodyParagraph(SERIES_INTRO_PLACEHOLDER)
  );

  docSections.push({
    properties: { page: SHARED_PAGE_PROPS },
    children: frontMatterChildren,
  });

  // ---- Sections 2..N+1: One per lesson (per-lesson page numbering) ---------
  setStep('lessons');
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const lessonNumber = i + 1;
    const creativeTitle = extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNumber);
    const passage = lesson.filters?.passage ?? series.bible_passage ?? '';

    const lessonChildren: Paragraph[] = [];

    // Compact inline lesson header (no full-page divider)
    lessonChildren.push(...buildCompactLessonHeader(lessonNumber, creativeTitle, passage, scheme));

    // Lesson content
    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const content = options.omitSection8FromChapters
      ? stripSection8FromContent(rawContent)
      : rawContent;

    lessonChildren.push(...buildDocxLessonContent(content, scheme));

    // Lesson footer: "Lesson N -- Page X"
    const lessonFooter = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Lesson ' + lessonNumber + ' -- Page ',
              size: EXPORT_SPACING.footer.fontHalfPt,
              font: EXPORT_SPACING.fonts.docx,
              color: EXPORT_SPACING.colors.footerText,
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              size: EXPORT_SPACING.footer.fontHalfPt,
              font: EXPORT_SPACING.fonts.docx,
              color: EXPORT_SPACING.colors.footerText,
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
      footers: { default: lessonFooter },
      children: lessonChildren,
    });
  }

  // ---- Handout Booklet Section ---------------------------------------------
  if (options.includeHandoutBooklet) {
    setStep('handouts');
    const bookletData = buildHandoutBookletData(series, lessons);
    const handoutChildren: Paragraph[] = [];

    handoutChildren.push(
      headingParagraph(bookletData.appendixTitle, 'Heading1', scheme.heading),
      bodyParagraph(bookletData.appendixSubtitle, true)
    );

    for (const entry of bookletData.entries) {
      handoutChildren.push(
        pageBreakParagraph(),
        headingParagraph(entry.header, 'Heading2', scheme.heading)
      );
      if (entry.passage) {
        handoutChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: entry.passage,
                italics: true,
                size: EXPORT_SPACING.metadata.fontHalfPt,
                color: EXPORT_SPACING.colors.metaText,
              }),
            ],
            spacing: { after: EXPORT_SPACING.sectionHeader.afterTwips },
          })
        );
      }
      handoutChildren.push(...buildDocxLessonContent(entry.content, scheme));
    }

    const handoutFooter = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Student Handouts -- Page ',
              size: EXPORT_SPACING.footer.fontHalfPt,
              font: EXPORT_SPACING.fonts.docx,
              color: EXPORT_SPACING.colors.footerText,
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              size: EXPORT_SPACING.footer.fontHalfPt,
              font: EXPORT_SPACING.fonts.docx,
              color: EXPORT_SPACING.colors.footerText,
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
      footers: { default: handoutFooter },
      children: handoutChildren,
    });
  }

  // ---- Back Cover Section (no page numbers) --------------------------------
  docSections.push({
    properties: { page: SHARED_PAGE_PROPS },
    children: buildDocxBackCover(),
  });

  // ---- Assemble Document ---------------------------------------------------
  setStep('finalizing');

  const doc = new Document({
    styles: { paragraphStyles: buildParagraphStyles(scheme) as any },
    sections: docSections,
  });

  return await Packer.toArrayBuffer(doc);
}

// ============================================================================
// COVER PAGE PARAGRAPHS
// ============================================================================

function buildDocxCoverPage(
  coverData: ReturnType<typeof buildCoverPageData>,
  scheme: ActiveScheme
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Vertical spacing (approx 1/3 page)
  for (let i = 0; i < 8; i++) {
    paragraphs.push(new Paragraph({ text: '' }));
  }

  // Series title -- scheme heading color
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: coverData.seriesTitle,
          bold: true,
          size: SERIES_COVER_TYPOGRAPHY.titleFontHalfPt,
          color: scheme.heading,
          font: EXPORT_SPACING.fonts.docx,
        }),
      ],
      spacing: { after: 240 },
    })
  );

  // Subtitle -- scheme accent color
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: coverData.subtitle,
          size: SERIES_COVER_TYPOGRAPHY.subtitleFontHalfPt,
          color: scheme.accent,
          font: EXPORT_SPACING.fonts.docx,
        }),
      ],
      spacing: { after: 480 },
    })
  );

  // Horizontal rule -- scheme accent color
  paragraphs.push(
    new Paragraph({
      text: '',
      border: {
        bottom: {
          color: scheme.accent,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      spacing: { after: 360 },
    })
  );

  // Meta lines -- neutral muted color
  const metaLines = [
    coverData.teacherLine,
    coverData.churchLine,
    coverData.dateRangeLine,
    coverData.lessonCountLine,
  ].filter((l): l is string => l !== null);

  for (const line of metaLines) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: line,
            size: SERIES_COVER_TYPOGRAPHY.metaFontHalfPt,
            color: EXPORT_SPACING.colors.metaText,
            font: EXPORT_SPACING.fonts.docx,
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
  entries: ReturnType<typeof buildTocEntries>,
  scheme: ActiveScheme
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    pageBreakParagraph(),
    headingParagraph('Table of Contents', 'Heading1', scheme.heading)
  );

  for (const entry of entries) {
    // Lesson heading
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: entry.chapterHeading,
            bold: true,
            size: SERIES_TOC_TYPOGRAPHY.entryFontHalfPt,
            font: EXPORT_SPACING.fonts.docx,
            color: EXPORT_SPACING.colors.bodyText,
          }),
        ],
        spacing: { after: 40 },
      })
    );

    // Passage (indented, italic)
    if (entry.passage) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: entry.passage,
              italics: true,
              size: EXPORT_SPACING.metadata.fontHalfPt,
              font: EXPORT_SPACING.fonts.docx,
              color: EXPORT_SPACING.colors.metaText,
            }),
          ],
          indent: { left: 360 },
          spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
        })
      );
    }
  }

  return paragraphs;
}

// ============================================================================
// COMPACT LESSON HEADER (replaces full-page divider)
// ============================================================================

function buildCompactLessonHeader(
  lessonNumber: number,
  title: string,
  passage: string,
  scheme: ActiveScheme
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // "LESSON N" label -- neutral meta color
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: 'LESSON ' + lessonNumber,
          size: SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontHalfPt,
          color: EXPORT_SPACING.colors.metaText,
          font: EXPORT_SPACING.fonts.docx,
          allCaps: true,
        }),
      ],
      spacing: { after: 60 },
    })
  );

  // Creative title -- scheme heading color
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: SERIES_CHAPTER_TYPOGRAPHY.chapterTitleFontHalfPt,
          color: scheme.heading,
          font: EXPORT_SPACING.fonts.docx,
        }),
      ],
      spacing: { after: 60 },
    })
  );

  // Passage reference -- neutral meta color
  if (passage) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: passage,
            italics: true,
            size: SERIES_CHAPTER_TYPOGRAPHY.passageFontHalfPt,
            color: EXPORT_SPACING.colors.metaText,
            font: EXPORT_SPACING.fonts.docx,
          }),
        ],
        spacing: { after: 80 },
      })
    );
  }

  // Thin horizontal rule -- scheme accent color
  paragraphs.push(
    new Paragraph({
      text: '',
      border: {
        bottom: {
          color: scheme.accent,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 4,
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

function buildDocxLessonContent(content: string, scheme: ActiveScheme): Paragraph[] {
  if (!content) return [];

  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip bare markdown heading markers
    if (/^#{1,3}\s*$/.test(line)) continue;

    // Section heading -- scheme heading color
    if (/^#{1,3}\s+/.test(line)) {
      const headingText = line.replace(/^#{1,3}\s+/, '');
      paragraphs.push(
        headingParagraph(headingText, 'Heading2', scheme.heading)
      );
      continue;
    }

    // Bullet list item
    if (/^\s*[*-]\s+/.test(line)) {
      const bulletText = line.replace(/^\s*[*-]\s+/, '');
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: bulletText,
              size: EXPORT_SPACING.body.fontHalfPt,
              font: EXPORT_SPACING.fonts.docx,
              color: EXPORT_SPACING.colors.bodyText,
            }),
          ],
          bullet: { level: 0 },
          spacing: { after: EXPORT_SPACING.listItem.afterTwips },
          indent: { left: EXPORT_SPACING.listItem.indentTwips },
        })
      );
      continue;
    }

    // Empty line -- small spacer
    if (line.trim() === '') {
      paragraphs.push(
        new Paragraph({
          text: '',
          spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
        })
      );
      continue;
    }

    // Body paragraph with inline bold
    paragraphs.push(
      new Paragraph({
        children: parseInlineBold(line),
        spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
      })
    );
  }

  return paragraphs;
}

// ============================================================================
// BACK COVER PARAGRAPHS
// ============================================================================

function buildDocxBackCover(): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < 10; i++) {
    paragraphs.push(new Paragraph({ text: '' }));
  }

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: SERIES_COVER_COPY.generatedBy,
          size: EXPORT_SPACING.footer.fontHalfPt,
          color: EXPORT_SPACING.colors.footerText,
          font: EXPORT_SPACING.fonts.docx,
        }),
      ],
      spacing: { after: 160 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: SERIES_COVER_COPY.website,
          size: EXPORT_SPACING.footer.fontHalfPt,
          color: EXPORT_SPACING.colors.footerText,
          font: EXPORT_SPACING.fonts.docx,
        }),
      ],
      spacing: { after: 160 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: '\u00A9 ' + new Date().getFullYear() + ' BibleLessonSpark. All rights reserved.',
          size: EXPORT_SPACING.footer.fontHalfPt,
          color: EXPORT_SPACING.colors.footerText,
          font: EXPORT_SPACING.fonts.docx,
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
  text: string,
  headingId: 'Heading1' | 'Heading2',
  color: string
): Paragraph {
  return new Paragraph({
    style: headingId,
    children: [
      new TextRun({
        text,
        color,
        font: EXPORT_SPACING.fonts.docx,
      }),
    ],
  });
}

function bodyParagraph(text: string, italic = false): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        italics: italic,
        size: EXPORT_SPACING.body.fontHalfPt,
        font: EXPORT_SPACING.fonts.docx,
        color: EXPORT_SPACING.colors.bodyText,
      }),
    ],
    spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
  });
}

function parseInlineBold(line: string): TextRun[] {
  const runs: TextRun[] = [];
  const parts = line.split(/(\*\*[^*]+\*\*)/g);

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text: part.slice(2, -2),
          bold: true,
          size: EXPORT_SPACING.body.fontHalfPt,
          font: EXPORT_SPACING.fonts.docx,
          color: EXPORT_SPACING.colors.bodyText,
        })
      );
    } else if (part) {
      runs.push(
        new TextRun({
          text: part,
          size: EXPORT_SPACING.body.fontHalfPt,
          font: EXPORT_SPACING.fonts.docx,
          color: EXPORT_SPACING.colors.bodyText,
        })
      );
    }
  }

  return runs.length > 0
    ? runs
    : [
        new TextRun({
          text: line,
          size: EXPORT_SPACING.body.fontHalfPt,
          font: EXPORT_SPACING.fonts.docx,
          color: EXPORT_SPACING.colors.bodyText,
        }),
      ];
}
