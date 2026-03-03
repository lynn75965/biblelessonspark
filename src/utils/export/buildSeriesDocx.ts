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
  SERIES_COLORS,
  SERIES_COVER_COPY,
  SERIES_INTRO_PLACEHOLDER,
  SERIES_HANDOUT_COPY,
  EXPORT_SPACING,
  EXPORT_FORMATTING,
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
// SHARED STYLES (defined once, used in all sections)
// ============================================================================

const SHARED_PARAGRAPH_STYLES = [
  {
    id: 'Heading1',
    name: 'Heading 1',
    basedOn: 'Normal',
    next: 'Normal',
    run: {
      size: SERIES_COVER_TYPOGRAPHY.subtitleFontHalfPt,
      bold: true,
      color: SERIES_COLORS.tocHeading,
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
      color: SERIES_COLORS.chapterHeading,
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
  const docSections: any[] = [];

  // ---- Section 1: Front Matter (Cover + TOC + Intro, no page numbers) ------
  setStep('cover');
  const coverData = buildCoverPageData(series, lessons, null, null);
  const frontMatterChildren: Paragraph[] = [];

  frontMatterChildren.push(...buildDocxCoverPage(coverData));

  setStep('toc');
  const tocEntries = buildTocEntries(series, lessons);
  frontMatterChildren.push(...buildDocxToc(tocEntries));

  frontMatterChildren.push(
    pageBreakParagraph(),
    headingParagraph('Introduction', 'Heading1', SERIES_COLORS.tocHeading),
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
    lessonChildren.push(...buildCompactLessonHeader(lessonNumber, creativeTitle, passage));

    // Lesson content
    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const content = options.omitSection8FromChapters
      ? stripSection8FromContent(rawContent)
      : rawContent;

    lessonChildren.push(...buildDocxLessonContent(content));

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
      headingParagraph(bookletData.appendixTitle, 'Heading1', SERIES_COLORS.handoutHeader),
      bodyParagraph(bookletData.appendixSubtitle, true)
    );

    for (const entry of bookletData.entries) {
      handoutChildren.push(
        pageBreakParagraph(),
        headingParagraph(entry.header, 'Heading2', SERIES_COLORS.handoutHeader)
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
      handoutChildren.push(...buildDocxLessonContent(entry.content));
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
    children: buildDocxBackCover(series),
  });

  // ---- Assemble Document ---------------------------------------------------
  setStep('finalizing');

  const doc = new Document({
    styles: { paragraphStyles: SHARED_PARAGRAPH_STYLES as any },
    sections: docSections,
  });

  return await Packer.toArrayBuffer(doc);
}

// ============================================================================
// COVER PAGE PARAGRAPHS
// ============================================================================

function buildDocxCoverPage(
  coverData: ReturnType<typeof buildCoverPageData>
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Vertical spacing (approx 1/3 page)
  for (let i = 0; i < 8; i++) {
    paragraphs.push(new Paragraph({ text: '' }));
  }

  // Series title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: coverData.seriesTitle,
          bold: true,
          size: SERIES_COVER_TYPOGRAPHY.titleFontHalfPt,
          color: SERIES_COLORS.coverTitle,
          font: EXPORT_SPACING.fonts.docx,
        }),
      ],
      spacing: { after: 240 },
    })
  );

  // Subtitle
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: coverData.subtitle,
          size: SERIES_COVER_TYPOGRAPHY.subtitleFontHalfPt,
          color: SERIES_COLORS.coverSubtitle,
          font: EXPORT_SPACING.fonts.docx,
        }),
      ],
      spacing: { after: 480 },
    })
  );

  // Horizontal rule
  paragraphs.push(
    new Paragraph({
      text: '',
      border: {
        bottom: {
          color: SERIES_COLORS.hr,
          space: 1,
          style: BorderStyle.SINGLE,
          size: 6,
        },
      },
      spacing: { after: 360 },
    })
  );

  // Meta lines
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
  entries: ReturnType<typeof buildTocEntries>
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    pageBreakParagraph(),
    headingParagraph('Table of Contents', 'Heading1', SERIES_COLORS.tocHeading)
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
  passage: string
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // "LESSON N" label
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

  // Creative title (primary heading)
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: SERIES_CHAPTER_TYPOGRAPHY.chapterTitleFontHalfPt,
          color: SERIES_COLORS.chapterHeading,
          font: EXPORT_SPACING.fonts.docx,
        }),
      ],
      spacing: { after: 60 },
    })
  );

  // Passage reference (italic, secondary)
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

  // Thin horizontal rule
  paragraphs.push(
    new Paragraph({
      text: '',
      border: {
        bottom: {
          color: SERIES_COLORS.hr,
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

function buildDocxLessonContent(content: string): Paragraph[] {
  if (!content) return [];

  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip bare markdown heading markers
    if (/^#{1,3}\s*$/.test(line)) continue;

    // Section heading
    if (/^#{1,3}\s+/.test(line)) {
      const headingText = line.replace(/^#{1,3}\s+/, '');
      paragraphs.push(
        headingParagraph(headingText, 'Heading2', SERIES_COLORS.chapterHeading)
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

function buildDocxBackCover(series: LessonSeries): Paragraph[] {
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
