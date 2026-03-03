// ============================================================================
// buildSeriesPdf.ts
// Location: src/utils/export/buildSeriesPdf.ts
//
// PDF document builder for the Series eBook / Curriculum Quarterly Export.
// Uses jspdf (already a project dependency).
//
// Document structure mirrors buildSeriesDocx.ts exactly:
//   1. Cover Page
//   2. Table of Contents
//   3. Introduction (Phase A placeholder)
//   4. Lesson Chapters (loop) -- each with divider page + all sections
//   5. Student Handout Booklet (if options.includeHandoutBooklet)
//   6. Back Cover
//
// PDF APPROACH:
//   - US Letter (8.5 x 11 in), 1-inch margins
//   - jspdf does not natively support Calibri; uses Helvetica as per
//     EXPORT_SPACING.fonts.pdf (lessonStructure.ts SSOT)
//   - BLS brand colors from SERIES_COLORS (hex strings converted to RGB)
//   - Page numbers added to footer of each page
//   - Text wrapping handled via doc.splitTextToSize()
// ============================================================================

import jsPDF from 'jspdf';
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
} from '@/constants/seriesExportConfig';
import { buildCoverPageData } from './buildCoverPage';
import { buildTocEntries } from './buildToc';
import {
  buildHandoutBookletData,
  stripSection8FromContent,
} from './buildHandoutBooklet';

// ============================================================================
// CONSTANTS
// ============================================================================

/** Page dimensions in points (jspdf uses points: 1pt = 1/72 inch) */
const PAGE = {
  width:  612,  // 8.5 inches * 72
  height: 792,  // 11 inches * 72
  margin: 72,   // 1 inch * 72
  get contentWidth() { return this.width - this.margin * 2; },
  get contentHeight() { return this.height - this.margin * 2; },
  get top() { return this.margin; },
  get left() { return this.margin; },
  get bottom() { return this.height - this.margin; },
  get right() { return this.width - this.margin; },
} as const;

/** Convert a 6-char hex color string (no #) to [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

/**
 * Build a PDF ArrayBuffer for the complete series curriculum document.
 *
 * @param series - The LessonSeries record
 * @param lessons - Ordered array of full Lesson records
 * @param options - User-selected export options
 * @param setStep - Progress step callback from useSeriesExport
 */
export async function buildSeriesPdf(
  series: LessonSeries,
  lessons: Lesson[],
  options: SeriesExportOptions,
  setStep: (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const ctx = new PdfContext(doc);

  // ---- Cover Page ----------------------------------------------------------
  setStep('cover');
  const coverData = buildCoverPageData(series, lessons, null, null);
  renderPdfCoverPage(ctx, coverData);

  // ---- Table of Contents ---------------------------------------------------
  setStep('toc');
  const tocEntries = buildTocEntries(series, lessons);
  ctx.addPage();
  renderPdfToc(ctx, tocEntries);

  // ---- Introduction --------------------------------------------------------
  ctx.addPage();
  ctx.renderSectionHeading('Introduction');
  ctx.renderBodyText(SERIES_INTRO_PLACEHOLDER);

  // ---- Lesson Chapters -----------------------------------------------------
  setStep('lessons');
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const lessonNumber = i + 1;
    const title = lesson.title ?? `Lesson ${lessonNumber}`;
    const passage = lesson.filters?.passage ?? series.bible_passage ?? '';

    ctx.addPage();
    renderPdfChapterDivider(ctx, lessonNumber, title, passage);

    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const content = options.omitSection8FromChapters
      ? stripSection8FromContent(rawContent)
      : rawContent;

    ctx.addPage();
    renderPdfLessonContent(ctx, content);
  }

  // ---- Student Handout Booklet ---------------------------------------------
  if (options.includeHandoutBooklet) {
    setStep('handouts');
    const bookletData = buildHandoutBookletData(series, lessons);

    ctx.addPage();
    ctx.renderSectionHeading(bookletData.appendixTitle);
    ctx.renderBodyText(bookletData.appendixSubtitle, true);

    for (const entry of bookletData.entries) {
      ctx.addPage();
      ctx.renderSubheading(entry.header);
      if (entry.passage) {
        ctx.renderMetaText(entry.passage);
      }
      renderPdfLessonContent(ctx, entry.content);
    }
  }

  // ---- Back Cover ----------------------------------------------------------
  ctx.addPage();
  renderPdfBackCover(ctx);

  // ---- Page Numbers --------------------------------------------------------
  ctx.addPageNumbers();

  // ---- Return ArrayBuffer --------------------------------------------------
  setStep('finalizing');
  const arrayBuffer = doc.output('arraybuffer');
  return arrayBuffer;
}

// ============================================================================
// PDF CONTEXT HELPER
// Encapsulates cursor position and common rendering operations.
// ============================================================================

class PdfContext {
  doc: jsPDF;
  y: number;
  pageNumber: number;

  constructor(doc: jsPDF) {
    this.doc = doc;
    this.y = PAGE.top;
    this.pageNumber = 1;
  }

  addPage(): void {
    this.doc.addPage('letter', 'portrait');
    this.y = PAGE.top;
    this.pageNumber++;
  }

  /** Check if remaining space is less than minHeight; add page if needed */
  ensureSpace(minHeight: number): void {
    if (this.y + minHeight > PAGE.bottom) {
      this.addPage();
    }
  }

  renderSectionHeading(text: string): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.tocHeading);
    this.doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    this.doc.setFontSize(SERIES_TOC_TYPOGRAPHY.headingFontPt);
    this.doc.setTextColor(r, g, b);
    this.ensureSpace(30);
    this.doc.text(text, PAGE.left, this.y);
    this.y += SERIES_TOC_TYPOGRAPHY.headingFontPt + 8;
    this.resetTextStyle();
  }

  renderSubheading(text: string): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.chapterHeading);
    this.doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    this.doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt + 2);
    this.doc.setTextColor(r, g, b);
    this.ensureSpace(24);
    this.doc.text(text, PAGE.left, this.y);
    this.y += SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt + 10;
    this.resetTextStyle();
  }

  renderBodyText(text: string, italic = false): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    this.doc.setFont(EXPORT_SPACING.fonts.pdf, italic ? 'italic' : 'normal');
    this.doc.setFontSize(EXPORT_SPACING.body.fontPt);
    this.doc.setTextColor(r, g, b);

    const lines = this.doc.splitTextToSize(text, PAGE.contentWidth) as string[];
    const lineHeight = EXPORT_SPACING.body.fontPt * EXPORT_SPACING.body.lineHeight;

    for (const line of lines) {
      this.ensureSpace(lineHeight);
      this.doc.text(line, PAGE.left, this.y);
      this.y += lineHeight;
    }
    this.y += EXPORT_SPACING.paragraph.afterPt;
    this.resetTextStyle();
  }

  renderMetaText(text: string): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.metaText);
    this.doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
    this.doc.setFontSize(EXPORT_SPACING.metadata.fontPt);
    this.doc.setTextColor(r, g, b);
    this.ensureSpace(EXPORT_SPACING.metadata.fontPt + 4);
    this.doc.text(text, PAGE.left, this.y);
    this.y += EXPORT_SPACING.metadata.fontPt + 6;
    this.resetTextStyle();
  }

  resetTextStyle(): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    this.doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
    this.doc.setFontSize(EXPORT_SPACING.body.fontPt);
    this.doc.setTextColor(r, g, b);
  }

  addPageNumbers(): void {
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.footerText);
      this.doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
      this.doc.setFontSize(EXPORT_SPACING.footer.fontPt);
      this.doc.setTextColor(r, g, b);
      this.doc.text(
        `${i} / ${totalPages}`,
        PAGE.width / 2,
        PAGE.height - 36,
        { align: 'center' }
      );
    }
  }
}

// ============================================================================
// PAGE RENDERERS
// ============================================================================

function renderPdfCoverPage(
  ctx: PdfContext,
  coverData: ReturnType<typeof buildCoverPageData>
): void {
  // Vertical centering: start ~1/3 down the page
  ctx.y = PAGE.height / 3;

  // Series title
  const [tr, tg, tb] = hexToRgb(SERIES_COLORS.coverTitle);
  ctx.doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
  ctx.doc.setFontSize(SERIES_COVER_TYPOGRAPHY.titleFontPt);
  ctx.doc.setTextColor(tr, tg, tb);
  ctx.doc.text(coverData.seriesTitle, PAGE.width / 2, ctx.y, { align: 'center' });
  ctx.y += SERIES_COVER_TYPOGRAPHY.titleFontPt + 12;

  // Subtitle
  const [sr, sg, sb] = hexToRgb(SERIES_COLORS.coverSubtitle);
  ctx.doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  ctx.doc.setFontSize(SERIES_COVER_TYPOGRAPHY.subtitleFontPt);
  ctx.doc.setTextColor(sr, sg, sb);
  ctx.doc.text(coverData.subtitle, PAGE.width / 2, ctx.y, { align: 'center' });
  ctx.y += SERIES_COVER_TYPOGRAPHY.subtitleFontPt + 24;

  // Horizontal rule
  const [hr, hg, hb] = hexToRgb(SERIES_COLORS.hr);
  ctx.doc.setDrawColor(hr, hg, hb);
  ctx.doc.setLineWidth(0.5);
  ctx.doc.line(PAGE.left, ctx.y, PAGE.right, ctx.y);
  ctx.y += 24;

  // Meta lines
  const [mr, mg, mb] = hexToRgb(EXPORT_SPACING.colors.metaText);
  ctx.doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  ctx.doc.setFontSize(SERIES_COVER_TYPOGRAPHY.metaFontPt);
  ctx.doc.setTextColor(mr, mg, mb);

  const metaLines = [
    coverData.teacherLine,
    coverData.churchLine,
    coverData.dateRangeLine,
    coverData.lessonCountLine,
  ].filter((l): l is string => l !== null);

  for (const line of metaLines) {
    ctx.doc.text(line, PAGE.width / 2, ctx.y, { align: 'center' });
    ctx.y += SERIES_COVER_TYPOGRAPHY.metaFontPt + 6;
  }

  ctx.resetTextStyle();
}

function renderPdfToc(
  ctx: PdfContext,
  entries: ReturnType<typeof buildTocEntries>
): void {
  ctx.renderSectionHeading('Table of Contents');

  for (const entry of entries) {
    ctx.ensureSpace(EXPORT_SPACING.body.fontPt * 2 + 12);

    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    ctx.doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    ctx.doc.setFontSize(SERIES_TOC_TYPOGRAPHY.entryFontPt);
    ctx.doc.setTextColor(r, g, b);
    ctx.doc.text(entry.chapterHeading, PAGE.left, ctx.y);
    ctx.y += SERIES_TOC_TYPOGRAPHY.entryFontPt + 4;

    if (entry.passage) {
      const [mr, mg, mb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      ctx.doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
      ctx.doc.setFontSize(EXPORT_SPACING.metadata.fontPt);
      ctx.doc.setTextColor(mr, mg, mb);
      ctx.doc.text(`    ${entry.passage}`, PAGE.left, ctx.y);
      ctx.y += EXPORT_SPACING.metadata.fontPt + 4;
    }

    ctx.y += 4;
  }

  ctx.resetTextStyle();
}

function renderPdfChapterDivider(
  ctx: PdfContext,
  lessonNumber: number,
  title: string,
  passage: string
): void {
  ctx.y = PAGE.height / 3;

  // "LESSON N" label
  const [lr, lg, lb] = hexToRgb(EXPORT_SPACING.colors.metaText);
  ctx.doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  ctx.doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt);
  ctx.doc.setTextColor(lr, lg, lb);
  ctx.doc.text(`LESSON ${lessonNumber}`, PAGE.width / 2, ctx.y, { align: 'center' });
  ctx.y += SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt + 10;

  // Lesson title
  const [tr, tg, tb] = hexToRgb(SERIES_COLORS.chapterHeading);
  ctx.doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
  ctx.doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.chapterTitleFontPt);
  ctx.doc.setTextColor(tr, tg, tb);
  const titleLines = ctx.doc.splitTextToSize(title, PAGE.contentWidth) as string[];
  for (const line of titleLines) {
    ctx.doc.text(line, PAGE.width / 2, ctx.y, { align: 'center' });
    ctx.y += SERIES_CHAPTER_TYPOGRAPHY.chapterTitleFontPt + 4;
  }
  ctx.y += 8;

  // Passage
  if (passage) {
    const [pr, pg, pb] = hexToRgb(EXPORT_SPACING.colors.metaText);
    ctx.doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
    ctx.doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.passageFontPt);
    ctx.doc.setTextColor(pr, pg, pb);
    ctx.doc.text(passage, PAGE.width / 2, ctx.y, { align: 'center' });
    ctx.y += SERIES_CHAPTER_TYPOGRAPHY.passageFontPt + 24;
  }

  // Horizontal rule
  const [hr, hg, hb] = hexToRgb(SERIES_COLORS.hr);
  ctx.doc.setDrawColor(hr, hg, hb);
  ctx.doc.setLineWidth(0.5);
  ctx.doc.line(PAGE.left, ctx.y, PAGE.right, ctx.y);

  ctx.resetTextStyle();
}

function renderPdfLessonContent(ctx: PdfContext, content: string): void {
  if (!content) return;

  const lines = content.split('\n');

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Skip bare markdown heading markers
    if (/^#{1,3}\s*$/.test(line)) continue;

    // Section heading
    if (/^#{1,3}\s+/.test(line)) {
      const headingText = line.replace(/^#{1,3}\s+/, '');
      ctx.ensureSpace(SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt + 16);
      ctx.renderSubheading(headingText);
      continue;
    }

    // Bullet list item
    if (/^\s*[*-]\s+/.test(line)) {
      const bulletText = '\u2022  ' + line.replace(/^\s*[*-]\s+/, '');
      ctx.renderBodyText(bulletText);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      ctx.y += EXPORT_SPACING.paragraph.afterPt;
      continue;
    }

    // Body paragraph (strip inline ** bold markers for PDF -- bold not parsed per-run)
    const plainText = line.replace(/\*\*([^*]+)\*\*/g, '$1');
    ctx.renderBodyText(plainText);
  }
}

function renderPdfBackCover(ctx: PdfContext): void {
  ctx.y = PAGE.height * 0.75;

  const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.footerText);
  ctx.doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  ctx.doc.setFontSize(EXPORT_SPACING.footer.fontPt + 2);
  ctx.doc.setTextColor(r, g, b);

  ctx.doc.text(SERIES_COVER_COPY.generatedBy, PAGE.width / 2, ctx.y, { align: 'center' });
  ctx.y += EXPORT_SPACING.footer.fontPt + 8;

  ctx.doc.text(SERIES_COVER_COPY.website, PAGE.width / 2, ctx.y, { align: 'center' });
  ctx.y += EXPORT_SPACING.footer.fontPt + 8;

  ctx.doc.text(
    `\u00A9 ${new Date().getFullYear()} BibleLessonSpark. All rights reserved.`,
    PAGE.width / 2,
    ctx.y,
    { align: 'center' }
  );

  ctx.resetTextStyle();
}
