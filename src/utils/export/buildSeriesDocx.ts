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
//   [Padding sections if booklet layout -- ensures page count divisible by 4]
//
// LAYOUT CHANGES (March 2026):
//   - Eliminated full-page chapter dividers to save paper
//   - Compact inline lesson header at top of content page
//   - Per-lesson page numbering in footer ("Lesson N -- Page X")
//   - Creative title as primary heading (not passage reference)
//   - Tighter spacing throughout to match quarterly-style density
//
// PHASE C ADDITIONS (March 2026):
//   - Layout-aware page dimensions (fullpage / booklet)
//   - Font-aware text rendering (6 font options)
//   - Booklet layout pads to multiple of 4 sections for imposition
//   - Tri-fold is PDF-only; the modal prevents DOCX + trifold combination
// ============================================================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  PageBreak,
  AlignmentType,
  BorderStyle,
  Footer,
  PageNumber,
} from 'docx';

import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  SeriesExportOptions,
  SeriesExportProgressStepId,
  SERIES_LAYOUT_DIMENSIONS,
  SERIES_EXPORT_FONT_OPTIONS,
  FontConfig,
  LayoutDimensions,
  SERIES_COLORS,
  SERIES_COVER_COPY,
  SERIES_INTRO_PLACEHOLDER,
  SERIES_HANDOUT_COPY,
  EXPORT_SPACING,
} from '@/constants/seriesExportConfig';
import { buildCoverPageData } from './buildCoverPage';
import { buildTocEntries } from './buildToc';
import {
  buildHandoutBookletData,
  extractCreativeTitle,
  stripSection8FromContent,
} from './buildHandoutBooklet';

// ============================================================================
// MAIN BUILDER
// ============================================================================

export async function buildSeriesDocx(
  series: LessonSeries,
  lessons: Lesson[],
  options: SeriesExportOptions,
  setStep: (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  // Guard: tri-fold is PDF-only; this should never be called with trifold
  if (options.layout === 'trifold') {
    throw new Error('Tri-Fold layout is not supported for DOCX export.');
  }

  // Resolve layout dimensions and font config from SSOT
  const dims: LayoutDimensions = SERIES_LAYOUT_DIMENSIONS[options.layout];
  const fontConfig: FontConfig =
    SERIES_EXPORT_FONT_OPTIONS.find((f) => f.id === options.font) ??
    SERIES_EXPORT_FONT_OPTIONS[0];

  // Page properties derived from layout dimensions
  const pageProps = {
    size: {
      width:  dims.widthDxa,
      height: dims.heightDxa,
    },
    margin: {
      top:    dims.marginDxa,
      right:  dims.marginDxa,
      bottom: dims.marginDxa,
      left:   dims.marginDxa,
    },
  };

  // Paragraph styles use layout font sizes and font config
  const paragraphStyles = buildParagraphStyles(dims, fontConfig);

  const docSections: object[] = [];

  // ---- Section 1: Front Matter (Cover + TOC + Intro, no page numbers) ------
  setStep('cover');
  const coverData = buildCoverPageData(series, lessons, null, null);
  const frontMatterChildren: Paragraph[] = [];

  frontMatterChildren.push(...buildDocxCoverPage(coverData, dims, fontConfig));

  setStep('toc');
  const tocEntries = buildTocEntries(series, lessons);
  frontMatterChildren.push(...buildDocxToc(tocEntries, dims, fontConfig));

  frontMatterChildren.push(
    pageBreakParagraph(),
    headingParagraph('Introduction', 'Heading1', SERIES_COLORS.tocHeading, fontConfig),
    bodyParagraph(SERIES_INTRO_PLACEHOLDER, false, dims, fontConfig)
  );

  docSections.push({
    properties: { page: pageProps },
    children: frontMatterChildren,
  });

  // ---- Sections 2..N+1: One per lesson (per-lesson page numbering) ---------
  setStep('lessons');
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const lessonNumber = i + 1;
    const creativeTitle =
      extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNumber);
    const passage = lesson.filters?.passage ?? series.bible_passage ?? '';

    const lessonChildren: Paragraph[] = [];

    lessonChildren.push(
      ...buildCompactLessonHeader(lessonNumber, creativeTitle, passage, dims, fontConfig)
    );

    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const content = options.omitSection8FromChapters
      ? stripSection8FromContent(rawContent)
      : rawContent;

    lessonChildren.push(...buildDocxLessonContent(content, dims, fontConfig));

    const lessonFooter = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Lesson ' + lessonNumber + ' -- Page ',
              size: EXPORT_SPACING.footer.fontHalfPt,
              font: fontConfig.docxBody,
              color: EXPORT_SPACING.colors.footerText,
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              size: EXPORT_SPACING.footer.fontHalfPt,
              font: fontConfig.docxBody,
              color: EXPORT_SPACING.colors.footerText,
            }),
          ],
        }),
      ],
    });

    docSections.push({
      properties: {
        page: {
          ...pageProps,
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
      headingParagraph(
        bookletData.appendixTitle,
        'Heading1',
        SERIES_COLORS.handoutHeader,
        fontConfig
      ),
      bodyParagraph(bookletData.appendixSubtitle, true, dims, fontConfig)
    );

    for (const entry of bookletData.entries) {
      handoutChildren.push(
        pageBreakParagraph(),
        headingParagraph(entry.header, 'Heading2', SERIES_COLORS.handoutHeader, fontConfig)
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
                font: fontConfig.docxBody,
              }),
            ],
            spacing: { after: EXPORT_SPACING.sectionHeader.afterTwips },
          })
        );
      }
      handoutChildren.push(...buildDocxLessonContent(entry.content, dims, fontConfig));
    }

    const handoutFooter = new Footer({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: 'Student Handouts -- Page ',
              size: EXPORT_SPACING.footer.fontHalfPt,
              font: fontConfig.docxBody,
              color: EXPORT_SPACING.colors.footerText,
            }),
            new TextRun({
              children: [PageNumber.CURRENT],
              size: EXPORT_SPACING.footer.fontHalfPt,
              font: fontConfig.docxBody,
              color: EXPORT_SPACING.colors.footerText,
            }),
          ],
        }),
      ],
    });

    docSections.push({
      properties: {
        page: {
          ...pageProps,
          pageNumbers: { start: 1 },
        },
      },
      footers: { default: handoutFooter },
      children: handoutChildren,
    });
  }

  // ---- Back Cover Section (no page numbers) --------------------------------
  docSections.push({
    properties: { page: pageProps },
    children: buildDocxBackCover(series, fontConfig),
  });

  // ---- Booklet Padding: pad total section count to a multiple of 4 ---------
  // The docx library does not expose a page count before rendering. We use
  // section count as a proxy. Each content section is at least one page, so
  // adding up to 3 blank padding sections ensures the printed booklet folds
  // correctly. See KNOWN_LIMITATIONS.md for details.
  if (dims.padToMultipleOf4) {
    const remainder = docSections.length % 4;
    const paddingNeeded = remainder === 0 ? 0 : 4 - remainder;
    for (let p = 0; p < paddingNeeded; p++) {
      docSections.push({
        properties: { page: pageProps },
        children: [new Paragraph({ text: '' })],
      });
    }
  }

  // ---- Assemble Document ---------------------------------------------------
  setStep('finalizing');

  const doc = new Document({
    styles: { paragraphStyles: paragraphStyles as never },
    sections: docSections as never,
  });

  return await Packer.toArrayBuffer(doc);
}

// ============================================================================
// PARAGRAPH STYLES (layout + font aware)
// ============================================================================

function buildParagraphStyles(
  dims: LayoutDimensions,
  fontConfig: FontConfig
): object[] {
  return [
    {
      id: 'Heading1',
      name: 'Heading 1',
      basedOn: 'Normal',
      next: 'Normal',
      run: {
        size:  dims.sectionHeaderFontHalfPt,
        bold:  true,
        color: SERIES_COLORS.tocHeading,
        font:  fontConfig.docxHeading,
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
      id: 'Heading2',
      name: 'Heading 2',
      basedOn: 'Normal',
      next: 'Normal',
      run: {
        size:  dims.chapterTitleFontHalfPt,
        bold:  true,
        color: SERIES_COLORS.chapterHeading,
        font:  fontConfig.docxHeading,
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
// COVER PAGE PARAGRAPHS
// ============================================================================

function buildDocxCoverPage(
  coverData: ReturnType<typeof buildCoverPageData>,
  dims: LayoutDimensions,
  fontConfig: FontConfig
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
          text:  coverData.seriesTitle,
          bold:  true,
          size:  dims.coverTitleFontHalfPt,
          color: SERIES_COLORS.coverTitle,
          font:  fontConfig.docxHeading,
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
          text:  coverData.subtitle,
          size:  dims.coverSubtitleFontHalfPt,
          color: SERIES_COLORS.coverSubtitle,
          font:  fontConfig.docxHeading,
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
          size:  6,
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
            text:  line,
            size:  EXPORT_SPACING.metadata.fontHalfPt,
            color: EXPORT_SPACING.colors.metaText,
            font:  fontConfig.docxBody,
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
  dims: LayoutDimensions,
  fontConfig: FontConfig
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  paragraphs.push(
    pageBreakParagraph(),
    headingParagraph('Table of Contents', 'Heading1', SERIES_COLORS.tocHeading, fontConfig)
  );

  for (const entry of entries) {
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text:  entry.chapterHeading,
            bold:  true,
            size:  dims.bodyFontHalfPt,
            font:  fontConfig.docxBody,
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
              font:    fontConfig.docxBody,
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
// COMPACT LESSON HEADER (replaces full-page divider)
// ============================================================================

function buildCompactLessonHeader(
  lessonNumber: number,
  title: string,
  passage: string,
  dims: LayoutDimensions,
  fontConfig: FontConfig
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // "LESSON N" label
  paragraphs.push(
    new Paragraph({
      children: [
        new TextRun({
          text:    'LESSON ' + lessonNumber,
          size:    dims.bodyFontHalfPt,
          color:   EXPORT_SPACING.colors.metaText,
          font:    fontConfig.docxBody,
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
          text:  title,
          bold:  true,
          size:  dims.chapterTitleFontHalfPt,
          color: SERIES_COLORS.chapterHeading,
          font:  fontConfig.docxHeading,
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
            text:    passage,
            italics: true,
            size:    EXPORT_SPACING.metadata.fontHalfPt,
            color:   EXPORT_SPACING.colors.metaText,
            font:    fontConfig.docxBody,
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
  content: string,
  dims: LayoutDimensions,
  fontConfig: FontConfig
): Paragraph[] {
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
        headingParagraph(headingText, 'Heading2', SERIES_COLORS.chapterHeading, fontConfig)
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
              text:  bulletText,
              size:  dims.bodyFontHalfPt,
              font:  fontConfig.docxBody,
              color: EXPORT_SPACING.colors.bodyText,
            }),
          ],
          bullet:  { level: 0 },
          spacing: { after: EXPORT_SPACING.listItem.afterTwips },
          indent:  { left: EXPORT_SPACING.listItem.indentTwips },
        })
      );
      continue;
    }

    // Empty line -- small spacer
    if (line.trim() === '') {
      paragraphs.push(
        new Paragraph({
          text:    '',
          spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
        })
      );
      continue;
    }

    // Body paragraph with inline bold
    paragraphs.push(
      new Paragraph({
        children: parseInlineBold(line, dims, fontConfig),
        spacing:  { after: EXPORT_SPACING.paragraph.afterTwips },
      })
    );
  }

  return paragraphs;
}

// ============================================================================
// BACK COVER PARAGRAPHS
// ============================================================================

function buildDocxBackCover(
  series: LessonSeries,
  fontConfig: FontConfig
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  for (let i = 0; i < 10; i++) {
    paragraphs.push(new Paragraph({ text: '' }));
  }

  paragraphs.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text:  SERIES_COVER_COPY.generatedBy,
          size:  EXPORT_SPACING.footer.fontHalfPt,
          color: EXPORT_SPACING.colors.footerText,
          font:  fontConfig.docxBody,
        }),
      ],
      spacing: { after: 160 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text:  SERIES_COVER_COPY.website,
          size:  EXPORT_SPACING.footer.fontHalfPt,
          color: EXPORT_SPACING.colors.footerText,
          font:  fontConfig.docxBody,
        }),
      ],
      spacing: { after: 160 },
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text:  '\u00A9 ' + new Date().getFullYear() + ' BibleLessonSpark. All rights reserved.',
          size:  EXPORT_SPACING.footer.fontHalfPt,
          color: EXPORT_SPACING.colors.footerText,
          font:  fontConfig.docxBody,
        }),
      ],
    })
  );

  // Suppress unused variable warning -- series is available for future use
  void series;

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
  color: string,
  fontConfig: FontConfig
): Paragraph {
  return new Paragraph({
    style: headingId,
    children: [
      new TextRun({
        text,
        color,
        font: fontConfig.docxHeading,
      }),
    ],
  });
}

function bodyParagraph(
  text: string,
  italic: boolean,
  dims: LayoutDimensions,
  fontConfig: FontConfig
): Paragraph {
  return new Paragraph({
    children: [
      new TextRun({
        text,
        italics: italic,
        size:    dims.bodyFontHalfPt,
        font:    fontConfig.docxBody,
        color:   EXPORT_SPACING.colors.bodyText,
      }),
    ],
    spacing: { after: EXPORT_SPACING.paragraph.afterTwips },
  });
}

function parseInlineBold(
  line: string,
  dims: LayoutDimensions,
  fontConfig: FontConfig
): TextRun[] {
  const runs: TextRun[] = [];
  const parts = line.split(/(\*\*[^*]+\*\*)/g);

  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      runs.push(
        new TextRun({
          text:  part.slice(2, -2),
          bold:  true,
          size:  dims.bodyFontHalfPt,
          font:  fontConfig.docxBody,
          color: EXPORT_SPACING.colors.bodyText,
        })
      );
    } else if (part) {
      runs.push(
        new TextRun({
          text:  part,
          size:  dims.bodyFontHalfPt,
          font:  fontConfig.docxBody,
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
          size:  dims.bodyFontHalfPt,
          font:  fontConfig.docxBody,
          color: EXPORT_SPACING.colors.bodyText,
        }),
      ];
}
