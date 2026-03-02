// ============================================================================
// buildSeriesDocx.ts
// Location: src/utils/export/buildSeriesDocx.ts
//
// DOCX document builder for the Series eBook / Curriculum Quarterly Export.
// Uses the `docx` npm library (already a project dependency).
//
// Document structure (in order):
//   1. Cover Page
//   2. Table of Contents
//   3. Introduction (Phase A placeholder)
//   4. Lesson Chapters (loop) -- each with divider page + all sections
//   5. Student Handout Booklet (if options.includeHandoutBooklet)
//   6. Back Cover
//
// DOCX CONSTRAINTS (from task brief):
//   - US Letter: 12240 x 15840 DXA, 1-inch margins (1440 DXA each side)
//   - Never use \n for line breaks -- use separate Paragraph elements
//   - Never use unicode bullet characters -- use LevelFormat.BULLET
//   - Table width: WidthType.DXA only, never WidthType.PERCENTAGE
//   - ShadingType.CLEAR for cell shading, never SOLID
//   - Override heading styles with exact IDs: "Heading1", "Heading2", etc.
//   - Include outlineLevel on heading styles (required for TOC)
//   - PageBreak must be inside a Paragraph
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
  stripSection8FromContent,
} from './buildHandoutBooklet';

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build a DOCX ArrayBuffer for the complete series curriculum document.
 *
 * @param series - The LessonSeries record
 * @param lessons - Ordered array of full Lesson records
 * @param options - User-selected export options
 * @param setStep - Progress step callback from useSeriesExport
 */
export async function buildSeriesDocx(
  series: LessonSeries,
  lessons: Lesson[],
  options: SeriesExportOptions,
  setStep: (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  const sections: Paragraph[] = [];

  // ---- Cover Page ----------------------------------------------------------
  setStep('cover');
  const coverData = buildCoverPageData(series, lessons, null, null);
  sections.push(...buildDocxCoverPage(coverData));

  // ---- Table of Contents ---------------------------------------------------
  setStep('toc');
  const tocEntries = buildTocEntries(series, lessons);
  sections.push(...buildDocxToc(tocEntries));

  // ---- Introduction --------------------------------------------------------
  sections.push(
    pageBreakParagraph(),
    headingParagraph('Introduction', 'Heading1', SERIES_COLORS.tocHeading),
    bodyParagraph(SERIES_INTRO_PLACEHOLDER)
  );

  // ---- Lesson Chapters -----------------------------------------------------
  setStep('lessons');
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const lessonNumber = i + 1;
    const title = lesson.title ?? `Lesson ${lessonNumber}`;
    const passage = lesson.filters?.passage ?? series.bible_passage ?? '';

    // Chapter divider page
    sections.push(
      pageBreakParagraph(),
      ...buildDocxChapterDivider(lessonNumber, title, passage)
    );

    // Lesson content
    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const content = options.omitSection8FromChapters
      ? stripSection8FromContent(rawContent)
      : rawContent;

    sections.push(...buildDocxLessonContent(content));
  }

  // ---- Student Handout Booklet ---------------------------------------------
  if (options.includeHandoutBooklet) {
    setStep('handouts');
    const bookletData = buildHandoutBookletData(series, lessons);

    sections.push(
      pageBreakParagraph(),
      headingParagraph(
        bookletData.appendixTitle,
        'Heading1',
        SERIES_COLORS.handoutHeader
      ),
      bodyParagraph(bookletData.appendixSubtitle, true)
    );

    for (const entry of bookletData.entries) {
      sections.push(
        pageBreakParagraph(),
        headingParagraph(entry.header, 'Heading2', SERIES_COLORS.handoutHeader)
      );
      if (entry.passage) {
        sections.push(
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
      sections.push(...buildDocxLessonContent(entry.content));
    }
  }

  // ---- Back Cover ----------------------------------------------------------
  sections.push(
    pageBreakParagraph(),
    ...buildDocxBackCover(series)
  );

  // ---- Assemble Document ---------------------------------------------------
  setStep('finalizing');

  const doc = new Document({
    styles: {
      paragraphStyles: [
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
      ],
    },
    sections: [
      {
        properties: {
          page: {
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
          },
        },
        children: sections,
      },
    ],
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

  // Vertical spacing before title (approx 1/3 page)
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

  // Horizontal rule (empty paragraph with bottom border)
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
      spacing: { after: 480 },
    })
  );

  // Meta lines (teacher, church, date range, lesson count)
  const metaLines: (string | null)[] = [
    coverData.teacherLine,
    coverData.churchLine,
    coverData.dateRangeLine,
    coverData.lessonCountLine,
  ];

  for (const line of metaLines) {
    if (line) {
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
  }

  return paragraphs;
}

// ============================================================================
// TABLE OF CONTENTS PARAGRAPHS
// ============================================================================

function buildDocxToc(
  entries: ReturnType<typeof buildTocEntries>
): Paragraph[] {
  const paragraphs: Paragraph[] = [
    pageBreakParagraph(),
    headingParagraph('Table of Contents', 'Heading1', SERIES_COLORS.tocHeading),
  ];

  for (const entry of entries) {
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
        spacing: { after: SERIES_TOC_TYPOGRAPHY.entrySpacingAfterTwips },
      })
    );

    if (entry.passage) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `    ${entry.passage}`,
              italics: true,
              size: EXPORT_SPACING.metadata.fontHalfPt,
              color: EXPORT_SPACING.colors.metaText,
              font: EXPORT_SPACING.fonts.docx,
            }),
          ],
          spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
        })
      );
    }
  }

  return paragraphs;
}

// ============================================================================
// CHAPTER DIVIDER PARAGRAPHS
// ============================================================================

function buildDocxChapterDivider(
  lessonNumber: number,
  title: string,
  passage: string
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Vertical spacing
  for (let i = 0; i < 6; i++) {
    paragraphs.push(new Paragraph({ text: '' }));
  }

  // "Lesson N" label
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Lesson ${lessonNumber}`,
          size: SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontHalfPt,
          color: EXPORT_SPACING.colors.metaText,
          font: EXPORT_SPACING.fonts.docx,
          allCaps: true,
        }),
      ],
      spacing: { after: 160 },
    })
  );

  // Lesson title
  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: title,
          bold: true,
          size: SERIES_CHAPTER_TYPOGRAPHY.chapterTitleFontHalfPt,
          color: SERIES_COLORS.chapterHeading,
          font: EXPORT_SPACING.fonts.docx,
        }),
      ],
      spacing: { after: 240 },
    })
  );

  // Passage reference
  if (passage) {
    paragraphs.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: passage,
            italics: true,
            size: SERIES_CHAPTER_TYPOGRAPHY.passageFontHalfPt,
            color: EXPORT_SPACING.colors.metaText,
            font: EXPORT_SPACING.fonts.docx,
          }),
        ],
        spacing: { after: 480 },
      })
    );
  }

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
    })
  );

  return paragraphs;
}

// ============================================================================
// LESSON CONTENT PARAGRAPHS
// ============================================================================

/**
 * Convert raw lesson markdown text into DOCX Paragraph elements.
 * Handles bold labels (from EXPORT_FORMATTING.boldLabels), bullet lists,
 * and plain body paragraphs. Does not use \n -- each line becomes a Paragraph.
 */
function buildDocxLessonContent(content: string): Paragraph[] {
  if (!content) return [];

  const lines = content.split('\n');
  const paragraphs: Paragraph[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip bare markdown heading markers (# ## ###)
    if (/^#{1,3}\s*$/.test(line)) continue;

    // Section heading (e.g., "## Section 3: Theological Background")
    if (/^#{1,3}\s+/.test(line)) {
      const headingText = line.replace(/^#{1,3}\s+/, '');
      paragraphs.push(
        headingParagraph(headingText, 'Heading2', SERIES_COLORS.chapterHeading)
      );
      continue;
    }

    // Bullet list item (* or -)
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

    // Empty line -- small spacer paragraph
    if (line.trim() === '') {
      paragraphs.push(
        new Paragraph({
          text: '',
          spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
        })
      );
      continue;
    }

    // Body paragraph -- parse inline bold (**text**)
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
          text: `\u00A9 ${new Date().getFullYear()} BibleLessonSpark. All rights reserved.`,
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

/**
 * Parse a line with inline **bold** markers into an array of TextRun elements.
 * Handles interleaved bold and normal segments.
 */
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
