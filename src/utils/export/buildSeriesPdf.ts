// ============================================================================
// buildSeriesPdf.ts
// Location: src/utils/export/buildSeriesPdf.ts
//
// PDF document builder for the Series Curriculum Export.
//
// Document structure mirrors buildSeriesDocx.ts:
//   1. Cover Page (no page numbers)
//   2. Table of Contents (no page numbers)
//   3. Introduction (no page numbers)
//   4. Lesson Chapters with per-lesson page numbering
//   5. Student Handout Booklet (own page numbering)
//   6. Back Cover (no page numbers)
//
// LAYOUT CHANGES (March 2026):
//   - Eliminated full-page chapter dividers to save paper
//   - Compact inline lesson header at top of content page
//   - Per-lesson page numbering in footer
//   - Creative title as primary heading (not passage reference)
// ============================================================================

import jsPDF from 'jspdf';
import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  SeriesExportOptions,
  SeriesExportProgressStepId,
  SERIES_COVER_TYPOGRAPHY,
  SERIES_CHAPTER_TYPOGRAPHY,
  SERIES_TOC_TYPOGRAPHY,
  SERIES_COLORS,
  SERIES_COVER_COPY,
  SERIES_INTRO_PLACEHOLDER,
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
// CONSTANTS
// ============================================================================

const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const PAGE_MARGIN = 72;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const PAGE_BOTTOM = PAGE_HEIGHT - PAGE_MARGIN;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ============================================================================
// LESSON PAGE TRACKER
// ============================================================================

interface PageRange {
  label: string;
  startPage: number;
  endPage: number;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

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

  let currentY = PAGE_MARGIN;
  let currentPage = 1;
  const lessonRanges: PageRange[] = [];
  const frontMatterPages: number[] = [];

  // --- Helper functions (closures over doc, currentY, currentPage) ----------

  function addPage(): void {
    doc.addPage('letter', 'portrait');
    currentY = PAGE_MARGIN;
    currentPage++;
  }

  function ensureSpace(minHeight: number): void {
    if (currentY + minHeight > PAGE_BOTTOM) {
      addPage();
    }
  }

  function resetStyle(): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
    doc.setFontSize(EXPORT_SPACING.body.fontPt);
    doc.setTextColor(r, g, b);
  }

  function renderBodyText(text: string, italic?: boolean): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, italic ? 'italic' : 'normal');
    doc.setFontSize(EXPORT_SPACING.body.fontPt);
    doc.setTextColor(r, g, b);

    const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    const lineH = EXPORT_SPACING.body.fontPt * EXPORT_SPACING.body.lineHeight;

    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, PAGE_MARGIN, currentY);
      currentY += lineH;
    }
    currentY += EXPORT_SPACING.paragraph.afterPt;
    resetStyle();
  }

  function renderSectionHeading(text: string): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.tocHeading);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(SERIES_TOC_TYPOGRAPHY.headingFontPt);
    doc.setTextColor(r, g, b);
    ensureSpace(30);
    doc.text(text, PAGE_MARGIN, currentY);
    currentY += SERIES_TOC_TYPOGRAPHY.headingFontPt + 8;
    resetStyle();
  }

  function renderSubheading(text: string): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.chapterHeading);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt + 2);
    doc.setTextColor(r, g, b);
    ensureSpace(24);
    const lines = doc.splitTextToSize(text, CONTENT_WIDTH) as string[];
    for (const line of lines) {
      doc.text(line, PAGE_MARGIN, currentY);
      currentY += SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt + 6;
    }
    currentY += 4;
    resetStyle();
  }

  function renderMetaText(text: string): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
    doc.setFontSize(EXPORT_SPACING.metadata.fontPt);
    doc.setTextColor(r, g, b);
    ensureSpace(EXPORT_SPACING.metadata.fontPt + 4);
    doc.text(text, PAGE_MARGIN, currentY);
    currentY += EXPORT_SPACING.metadata.fontPt + 6;
    resetStyle();
  }

  function renderLessonContent(content: string): void {
    if (!content) return;
    const lines = content.split('\n');

    for (const rawLine of lines) {
      const line = rawLine.trimEnd();
      if (/^#{1,3}\s*$/.test(line)) continue;

      if (/^#{1,3}\s+/.test(line)) {
        const headingText = line.replace(/^#{1,3}\s+/, '');
        ensureSpace(24);
        renderSubheading(headingText);
        continue;
      }

      if (/^\s*[*-]\s+/.test(line)) {
        const bulletText = '\u2022  ' + line.replace(/^\s*[*-]\s+/, '');
        renderBodyText(bulletText);
        continue;
      }

      if (line.trim() === '') {
        currentY += EXPORT_SPACING.paragraph.afterPt;
        continue;
      }

      const plainText = line.replace(/\*\*([^*]+)\*\*/g, '$1');
      renderBodyText(plainText);
    }
  }

  // ---- Cover Page ----------------------------------------------------------
  setStep('cover');
  frontMatterPages.push(currentPage);

  const coverData = buildCoverPageData(series, lessons, null, null);
  currentY = PAGE_HEIGHT / 3;

  const [tr, tg, tb] = hexToRgb(SERIES_COLORS.coverTitle);
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
  doc.setFontSize(SERIES_COVER_TYPOGRAPHY.titleFontPt);
  doc.setTextColor(tr, tg, tb);
  const titleLines = doc.splitTextToSize(coverData.seriesTitle, CONTENT_WIDTH) as string[];
  for (const tl of titleLines) {
    doc.text(tl, PAGE_WIDTH / 2, currentY, { align: 'center' });
    currentY += SERIES_COVER_TYPOGRAPHY.titleFontPt + 4;
  }
  currentY += 8;

  const [sr, sg, sb] = hexToRgb(SERIES_COLORS.coverSubtitle);
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  doc.setFontSize(SERIES_COVER_TYPOGRAPHY.subtitleFontPt);
  doc.setTextColor(sr, sg, sb);
  doc.text(coverData.subtitle, PAGE_WIDTH / 2, currentY, { align: 'center' });
  currentY += SERIES_COVER_TYPOGRAPHY.subtitleFontPt + 24;

  const [hr1, hg1, hb1] = hexToRgb(SERIES_COLORS.hr);
  doc.setDrawColor(hr1, hg1, hb1);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
  currentY += 24;

  const [mr, mg, mb] = hexToRgb(EXPORT_SPACING.colors.metaText);
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  doc.setFontSize(SERIES_COVER_TYPOGRAPHY.metaFontPt);
  doc.setTextColor(mr, mg, mb);

  const metaLines = [
    coverData.teacherLine,
    coverData.churchLine,
    coverData.dateRangeLine,
    coverData.lessonCountLine,
  ].filter((l): l is string => l !== null);

  for (const ml of metaLines) {
    doc.text(ml, PAGE_WIDTH / 2, currentY, { align: 'center' });
    currentY += SERIES_COVER_TYPOGRAPHY.metaFontPt + 6;
  }

  // ---- Table of Contents ---------------------------------------------------
  setStep('toc');
  addPage();
  frontMatterPages.push(currentPage);
  const tocEntries = buildTocEntries(series, lessons);

  renderSectionHeading('Table of Contents');

  for (const entry of tocEntries) {
    ensureSpace(EXPORT_SPACING.body.fontPt * 2 + 12);

    const [er, eg, eb] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(SERIES_TOC_TYPOGRAPHY.entryFontPt);
    doc.setTextColor(er, eg, eb);
    doc.text(entry.chapterHeading, PAGE_MARGIN, currentY);
    currentY += SERIES_TOC_TYPOGRAPHY.entryFontPt + 4;

    if (entry.passage) {
      const [pr, pg2, pb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
      doc.setFontSize(EXPORT_SPACING.metadata.fontPt);
      doc.setTextColor(pr, pg2, pb);
      doc.text('    ' + entry.passage, PAGE_MARGIN, currentY);
      currentY += EXPORT_SPACING.metadata.fontPt + 4;
    }

    currentY += 4;
  }

  // ---- Introduction --------------------------------------------------------
  addPage();
  frontMatterPages.push(currentPage);
  renderSectionHeading('Introduction');
  renderBodyText(SERIES_INTRO_PLACEHOLDER);

  // ---- Lesson Chapters -----------------------------------------------------
  setStep('lessons');
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const lessonNumber = i + 1;
    const creativeTitle = extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNumber);
    const passage = lesson.filters?.passage ?? series.bible_passage ?? '';

    addPage();
    const startPage = currentPage;

    // Compact inline header
    const [lr, lg, lb] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
    doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt);
    doc.setTextColor(lr, lg, lb);
    doc.text('LESSON ' + lessonNumber, PAGE_MARGIN, currentY);
    currentY += SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt + 4;

    const [ct_r, ct_g, ct_b] = hexToRgb(SERIES_COLORS.chapterHeading);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.chapterTitleFontPt);
    doc.setTextColor(ct_r, ct_g, ct_b);
    const ctLines = doc.splitTextToSize(creativeTitle, CONTENT_WIDTH) as string[];
    for (const ctl of ctLines) {
      doc.text(ctl, PAGE_MARGIN, currentY);
      currentY += SERIES_CHAPTER_TYPOGRAPHY.chapterTitleFontPt + 4;
    }

    if (passage) {
      const [psr, psg, psb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
      doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.passageFontPt);
      doc.setTextColor(psr, psg, psb);
      doc.text(passage, PAGE_MARGIN, currentY);
      currentY += SERIES_CHAPTER_TYPOGRAPHY.passageFontPt + 6;
    }

    const [hr2, hg2, hb2] = hexToRgb(SERIES_COLORS.hr);
    doc.setDrawColor(hr2, hg2, hb2);
    doc.setLineWidth(0.4);
    doc.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
    currentY += 10;
    resetStyle();

    // Lesson content
    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const content = options.omitSection8FromChapters
      ? stripSection8FromContent(rawContent)
      : rawContent;
    renderLessonContent(content);

    lessonRanges.push({
      label: 'Lesson ' + lessonNumber,
      startPage,
      endPage: currentPage,
    });
  }

  // ---- Student Handout Booklet ---------------------------------------------
  let handoutRange: PageRange | null = null;
  if (options.includeHandoutBooklet) {
    setStep('handouts');
    const bookletData = buildHandoutBookletData(series, lessons);

    addPage();
    const handoutStart = currentPage;
    renderSectionHeading(bookletData.appendixTitle);
    renderBodyText(bookletData.appendixSubtitle, true);

    for (const entry of bookletData.entries) {
      addPage();
      renderSubheading(entry.header);
      if (entry.passage) {
        renderMetaText(entry.passage);
      }
      renderLessonContent(entry.content);
    }

    handoutRange = {
      label: 'Student Handouts',
      startPage: handoutStart,
      endPage: currentPage,
    };
  }

  // ---- Back Cover ----------------------------------------------------------
  addPage();
  const backCoverPage = currentPage;

  currentY = PAGE_HEIGHT * 0.75;
  const [fr, fg, fb] = hexToRgb(EXPORT_SPACING.colors.footerText);
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  doc.setFontSize(EXPORT_SPACING.footer.fontPt + 2);
  doc.setTextColor(fr, fg, fb);

  doc.text(SERIES_COVER_COPY.generatedBy, PAGE_WIDTH / 2, currentY, { align: 'center' });
  currentY += EXPORT_SPACING.footer.fontPt + 8;
  doc.text(SERIES_COVER_COPY.website, PAGE_WIDTH / 2, currentY, { align: 'center' });
  currentY += EXPORT_SPACING.footer.fontPt + 8;
  doc.text(
    '\u00A9 ' + new Date().getFullYear() + ' BibleLessonSpark. All rights reserved.',
    PAGE_WIDTH / 2,
    currentY,
    { align: 'center' }
  );

  // ---- Per-Lesson Page Numbers (added AFTER all pages exist) ---------------
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    if (frontMatterPages.includes(p)) continue;
    if (p === backCoverPage) continue;

    doc.setPage(p);
    const [fnr, fng, fnb] = hexToRgb(EXPORT_SPACING.colors.footerText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
    doc.setFontSize(EXPORT_SPACING.footer.fontPt);
    doc.setTextColor(fnr, fng, fnb);

    let footerText = '';
    for (const range of lessonRanges) {
      if (p >= range.startPage && p <= range.endPage) {
        const localPage = p - range.startPage + 1;
        footerText = range.label + ' -- Page ' + localPage;
        break;
      }
    }

    if (!footerText && handoutRange && p >= handoutRange.startPage && p <= handoutRange.endPage) {
      const localPage = p - handoutRange.startPage + 1;
      footerText = handoutRange.label + ' -- Page ' + localPage;
    }

    if (footerText) {
      doc.text(footerText, PAGE_WIDTH / 2, PAGE_HEIGHT - 36, { align: 'center' });
    }
  }

  // ---- Return ArrayBuffer --------------------------------------------------
  setStep('finalizing');
  return doc.output('arraybuffer');
}
