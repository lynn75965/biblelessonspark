// ============================================================================
// buildSeriesPdf.ts
// Location: src/utils/export/buildSeriesPdf.ts
//
// PDF document builder for the Series Curriculum Export.
//
// Document structure (fullpage / booklet layouts):
//   1. Cover Page (no page numbers)
//   2. Table of Contents (no page numbers)
//   3. Introduction (no page numbers)
//   4. Lesson Chapters with per-lesson page numbering
//   5. Student Handout Booklet (own page numbering)
//   6. Back Cover (no page numbers)
//   [Blank padding pages if booklet layout -- ensures count divisible by 4]
//
// Tri-fold layout (PDF only):
//   One landscape page per lesson, divided into 3 equal columns.
//   Renders Section 8 (Student Handout) content only.
//   No cover, no TOC, no lesson chapters.
//
// LAYOUT CHANGES (March 2026):
//   - Eliminated full-page chapter dividers to save paper
//   - Compact inline lesson header at top of content page
//   - Per-lesson page numbering in footer
//   - Creative title as primary heading (not passage reference)
//
// PHASE C ADDITIONS (March 2026):
//   - Layout-aware page dimensions (fullpage / booklet / trifold)
//   - Font-aware text rendering (6 font options)
//   - Booklet layout pads to multiple of 4 pages
//   - Tri-fold rendering path: 3-column landscape handout per lesson
//
// ASCII-CLEAN: No literal Unicode characters. Use escape sequences.
//   \u00A9 = copyright, \u2014 = em dash. Bullets use '- ' prefix.
// ============================================================================

import jsPDF from 'jspdf';
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
  EXPORT_SPACING,
} from '@/constants/seriesExportConfig';
import { buildCoverPageData } from './buildCoverPage';
import { buildTocEntries } from './buildToc';
import {
  buildHandoutBookletData,
  extractCreativeTitle,
  extractSection8Content,
  stripSection8FromContent,
} from './buildHandoutBooklet';

// ============================================================================
// HELPERS
// ============================================================================

/** Strip Unicode characters that jsPDF built-in fonts cannot render. */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u2610\u2611\u2612\u2713\u2714\u2717\u2718]/g, '')
    .replace(/%\u00A1/g, '- ')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219]/g, '- ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013]/g, '--')
    .replace(/[\u2014]/g, '---')
    .replace(/[\u2026]/g, '...')
    .replace(/[^\x00-\x7F]/g, '');
}
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

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
  const dims: LayoutDimensions = SERIES_LAYOUT_DIMENSIONS[options.layout];
  const fontConfig: FontConfig =
    SERIES_EXPORT_FONT_OPTIONS.find((f) => f.id === options.font) ??
    SERIES_EXPORT_FONT_OPTIONS[0];

  // Route to the tri-fold renderer when that layout is selected
  if (options.layout === 'trifold') {
    return buildTrifoldPdf(series, lessons, dims, fontConfig, setStep);
  }

  // ---- Standard portrait layout (fullpage or booklet) ----------------------

  // Booklet inset: render 5.5x8.5 content centered on landscape letter pages
  // so PDF viewers display the booklet within visible letter-page boundaries.
  const isBookletInset = options.layout === 'booklet';
  const xOff = isBookletInset ? Math.round((792 - dims.widthPt) / 2) : 0;
  const yOff = 0; // booklet height matches landscape letter height exactly

  const pageWidth  = isBookletInset ? 792 : dims.widthPt;
  const pageHeight = isBookletInset ? 612 : dims.heightPt;
  const pdfOrientation = isBookletInset ? 'landscape' : 'portrait';
  const margin     = xOff + dims.marginPt;         // left/right from page edge
  const topMargin  = yOff + dims.marginPt;          // top from page edge
  const contentW   = dims.contentWidthPt;            // usable text width (unchanged)
  const pageBottom = yOff + dims.heightPt - dims.marginPt; // max y before break
  const footerY    = isBookletInset
    ? yOff + dims.heightPt - 18
    : pageHeight - 36;

  const doc = new jsPDF({
    orientation: pdfOrientation,
    unit: 'pt',
    format: 'letter',
  });

  doc.setDisplayMode('fullwidth', 'continuous', 'UseNone');

  /** Draw a thin gray frame around the booklet content area on letter pages */
  function drawBookletFrame(): void {
    if (!isBookletInset) return;
    doc.setDrawColor(190, 190, 190);
    doc.setLineWidth(0.5);
    doc.rect(xOff, yOff, dims.widthPt, dims.heightPt);
  }

  drawBookletFrame(); // first page

  let currentY = topMargin;
  let currentPage = 1;
  const lessonRanges: PageRange[] = [];
  const frontMatterPages: number[] = [];

  // ---- Closure helpers -----------------------------------------------------

  function addPage(): void {
    doc.addPage('letter', pdfOrientation);
    currentY = topMargin;
    currentPage++;
    drawBookletFrame();
  }

  function ensureSpace(minHeight: number): void {
    if (currentY + minHeight > pageBottom) {
      addPage();
    }
  }

  function resetStyle(): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(fontConfig.pdfBody, 'normal');
    doc.setFontSize(dims.bodyFontPt);
    doc.setTextColor(r, g, b);
  }

  function renderBodyText(text: string, italic?: boolean): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(fontConfig.pdfBody, italic ? 'italic' : 'normal');
    doc.setFontSize(dims.bodyFontPt);
    doc.setTextColor(r, g, b);

    const lines = doc.splitTextToSize(sanitizeForPdf(text), contentW) as string[];
    const lineH = dims.bodyFontPt * EXPORT_SPACING.body.lineHeight;

    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, margin, currentY);
      currentY += lineH;
    }
    currentY += EXPORT_SPACING.paragraph.afterPt;
    resetStyle();
  }

  function renderSectionHeading(text: string): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.tocHeading);
    doc.setFont(fontConfig.pdfHeading, 'bold');
    doc.setFontSize(dims.sectionHeaderFontPt);
    doc.setTextColor(r, g, b);
    ensureSpace(30);
    doc.text(text, margin, currentY);
    currentY += dims.sectionHeaderFontPt + 8;
    resetStyle();
  }

  function renderSubheading(text: string): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.chapterHeading);
    doc.setFont(fontConfig.pdfHeading, 'bold');
    doc.setFontSize(dims.chapterTitleFontPt - 2);
    doc.setTextColor(r, g, b);
    ensureSpace(24);
    const lines = doc.splitTextToSize(sanitizeForPdf(text), contentW) as string[];
    for (const line of lines) {
      doc.text(line, margin, currentY);
      currentY += dims.chapterTitleFontPt;
    }
    currentY += 4;
    resetStyle();
  }

  function renderMetaText(text: string): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(fontConfig.pdfBody, 'italic');
    doc.setFontSize(EXPORT_SPACING.metadata.fontPt);
    doc.setTextColor(r, g, b);
    ensureSpace(EXPORT_SPACING.metadata.fontPt + 4);
    doc.text(text, margin, currentY);
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
        // ASCII-clean bullet: use '- ' prefix, never \u2022
        const bulletText = '- ' + line.replace(/^\s*[*-]\s+/, '');
        renderBodyText(bulletText);
        continue;
      }

      if (line.trim() === '') {
        currentY += EXPORT_SPACING.paragraph.afterPt;
        continue;
      }

      const plainText = sanitizeForPdf(line.replace(/\*\*([^*]+)\*\*/g, '$1'));
      renderBodyText(plainText);
    }
  }

  // ---- Cover Page ----------------------------------------------------------
  setStep('cover');
  frontMatterPages.push(currentPage);

  const coverData = buildCoverPageData(series, lessons, null, null);
  currentY = yOff + dims.heightPt / 3;

  const [tr, tg, tb] = hexToRgb(SERIES_COLORS.coverTitle);
  doc.setFont(fontConfig.pdfHeading, 'bold');
  doc.setFontSize(dims.coverTitleFontPt);
  doc.setTextColor(tr, tg, tb);
  const titleLines = doc.splitTextToSize(coverData.seriesTitle, contentW) as string[];
  for (const tl of titleLines) {
    doc.text(tl, pageWidth / 2, currentY, { align: 'center' });
    currentY += dims.coverTitleFontPt + 4;
  }
  currentY += 8;

  const [sr, sg, sb] = hexToRgb(SERIES_COLORS.coverSubtitle);
  doc.setFont(fontConfig.pdfHeading, 'normal');
  doc.setFontSize(dims.coverSubtitleFontPt);
  doc.setTextColor(sr, sg, sb);
  doc.text(coverData.subtitle, pageWidth / 2, currentY, { align: 'center' });
  currentY += dims.coverSubtitleFontPt + 24;

  const [hr1, hg1, hb1] = hexToRgb(SERIES_COLORS.hr);
  doc.setDrawColor(hr1, hg1, hb1);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 24;

  const [mr, mg, mb] = hexToRgb(EXPORT_SPACING.colors.metaText);
  doc.setFont(fontConfig.pdfBody, 'normal');
  doc.setFontSize(EXPORT_SPACING.metadata.fontPt);
  doc.setTextColor(mr, mg, mb);

  const metaLines = [
    coverData.teacherLine,
    coverData.churchLine,
    coverData.dateRangeLine,
    coverData.lessonCountLine,
  ].filter((l): l is string => l !== null);

  for (const ml of metaLines) {
    doc.text(ml, pageWidth / 2, currentY, { align: 'center' });
    currentY += EXPORT_SPACING.metadata.fontPt + 6;
  }

  // Booklet: add print instruction at bottom of cover page
  if (options.layout === 'booklet') {
    const [fiR, fiG, fiB] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(fontConfig.pdfBody, 'italic');
    doc.setFontSize(8);
    doc.setTextColor(fiR, fiG, fiB);
    doc.text(
      'Booklet Format (5.5 x 8.5 in) - Print using your printer\'s Booklet setting',
      pageWidth / 2,
      footerY,
      { align: 'center' }
    );
  }

  // ---- Table of Contents ---------------------------------------------------
  setStep('toc');
  addPage();
  frontMatterPages.push(currentPage);
  const tocEntries = buildTocEntries(series, lessons);

  renderSectionHeading('Table of Contents');

  for (const entry of tocEntries) {
    ensureSpace(dims.bodyFontPt * 2 + 12);

    const [er, eg, eb] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(fontConfig.pdfBody, 'bold');
    doc.setFontSize(dims.bodyFontPt);
    doc.setTextColor(er, eg, eb);
    doc.text(entry.chapterHeading, margin, currentY);
    currentY += dims.bodyFontPt + 4;

    if (entry.passage) {
      const [pr, pg2, pb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(fontConfig.pdfBody, 'italic');
      doc.setFontSize(EXPORT_SPACING.metadata.fontPt);
      doc.setTextColor(pr, pg2, pb);
      doc.text('    ' + entry.passage, margin, currentY);
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
    const creativeTitle =
      extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNumber);
    const passage = lesson.filters?.passage ?? series.bible_passage ?? '';

    addPage();
    const startPage = currentPage;

    // Compact inline header
    const [lr, lg, lb] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(fontConfig.pdfBody, 'normal');
    doc.setFontSize(dims.bodyFontPt);
    doc.setTextColor(lr, lg, lb);
    doc.text('LESSON ' + lessonNumber, margin, currentY);
    currentY += dims.bodyFontPt + 4;

    const [ct_r, ct_g, ct_b] = hexToRgb(SERIES_COLORS.chapterHeading);
    doc.setFont(fontConfig.pdfHeading, 'bold');
    doc.setFontSize(dims.chapterTitleFontPt);
    doc.setTextColor(ct_r, ct_g, ct_b);
    const ctLines = doc.splitTextToSize(creativeTitle, contentW) as string[];
    for (const ctl of ctLines) {
      doc.text(ctl, margin, currentY);
      currentY += dims.chapterTitleFontPt + 4;
    }

    if (passage) {
      const [psr, psg, psb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(fontConfig.pdfBody, 'italic');
      doc.setFontSize(EXPORT_SPACING.metadata.fontPt);
      doc.setTextColor(psr, psg, psb);
      doc.text(passage, margin, currentY);
      currentY += EXPORT_SPACING.metadata.fontPt + 6;
    }

    const [hr2, hg2, hb2] = hexToRgb(SERIES_COLORS.hr);
    doc.setDrawColor(hr2, hg2, hb2);
    doc.setLineWidth(0.4);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;
    resetStyle();

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

  currentY = yOff + dims.heightPt * 0.75;
  const [fr, fg, fb] = hexToRgb(EXPORT_SPACING.colors.footerText);
  doc.setFont(fontConfig.pdfBody, 'normal');
  doc.setFontSize(EXPORT_SPACING.footer.fontPt + 2);
  doc.setTextColor(fr, fg, fb);

  doc.text(SERIES_COVER_COPY.generatedBy, pageWidth / 2, currentY, { align: 'center' });
  currentY += EXPORT_SPACING.footer.fontPt + 8;
  doc.text(SERIES_COVER_COPY.website, pageWidth / 2, currentY, { align: 'center' });
  currentY += EXPORT_SPACING.footer.fontPt + 8;
  doc.text(
    '\u00A9 ' + new Date().getFullYear() + ' BibleLessonSpark. All rights reserved.',
    pageWidth / 2,
    currentY,
    { align: 'center' }
  );

  // ---- Booklet Padding: pad total page count to a multiple of 4 ------------
  if (dims.padToMultipleOf4) {
    const totalBeforePad = doc.getNumberOfPages();
    const remainder = totalBeforePad % 4;
    const paddingNeeded = remainder === 0 ? 0 : 4 - remainder;
    for (let p = 0; p < paddingNeeded; p++) {
      doc.addPage('letter', pdfOrientation);
      drawBookletFrame();
    }
  }

  // ---- Per-Lesson Page Numbers (added AFTER all pages exist) ---------------
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    if (frontMatterPages.includes(p)) continue;
    if (p === backCoverPage) continue;

    doc.setPage(p);
    const [fnr, fng, fnb] = hexToRgb(EXPORT_SPACING.colors.footerText);
    doc.setFont(fontConfig.pdfBody, 'normal');
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

    if (
      !footerText &&
      handoutRange !== null &&
      p >= handoutRange.startPage &&
      p <= handoutRange.endPage
    ) {
      const localPage = p - handoutRange.startPage + 1;
      footerText = handoutRange.label + ' -- Page ' + localPage;
    }

    if (footerText) {
      doc.text(footerText, pageWidth / 2, footerY, { align: 'center' });
    }
  }

  // ---- Return ArrayBuffer --------------------------------------------------
  setStep('finalizing');
  return doc.output('arraybuffer');
}

// ============================================================================
// TRI-FOLD RENDERER
// ============================================================================

/**
 * Renders one landscape page per lesson, divided into three equal columns.
 * Each page is a complete tri-fold student handout for that lesson.
 * Content is drawn from Section 8 (Student Handout) of each lesson.
 *
 * Column layout (left to right):
 *   Panel 1: Lesson Title, Passage, Key Idea, Memory Verse
 *   Panel 2: Big Points, Gospel Connection
 *   Panel 3: Reflection Questions, Weekly Challenge, Prayer
 */
async function buildTrifoldPdf(
  series: LessonSeries,
  lessons: Lesson[],
  dims: LayoutDimensions,
  fontConfig: FontConfig,
  setStep: (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  setStep('handouts');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter',
  });

  // Tri-fold: open showing the full page so all three panels are visible
  doc.setDisplayMode('fullpage', 'continuous', 'UseNone');

  // Landscape letter: 792 x 612 pt
  const pageW   = 792;
  const pageH   = 612;
  const colW    = pageW / 3;          // 264 pt per column
  const colMargin = dims.marginPt;    // 18 pt
  const usableW = colW - colMargin * 2; // 228 pt usable per column

  // X offsets for the left edge of each column's content area
  const colX: [number, number, number] = [
    colMargin,
    colW + colMargin,
    colW * 2 + colMargin,
  ];

  const bodyFontPt    = dims.bodyFontPt;
  const labelFontPt   = dims.sectionHeaderFontPt;
  const titleFontPt   = dims.chapterTitleFontPt;
  const lineH         = bodyFontPt * EXPORT_SPACING.body.lineHeight;
  const labelLineH    = labelFontPt * 1.3;

  let isFirstLesson = true;

  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const lessonNumber = i + 1;

    if (!isFirstLesson) {
      doc.addPage('letter', 'landscape');
    }
    isFirstLesson = false;

    const creativeTitle =
      extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNumber);
    const passage = lesson.filters?.passage ?? series.bible_passage ?? '';

    // Extract and parse Section 8 content
    const section8 = extractSection8Content(lesson) ?? '';
    const parsed   = parseTrifoldContent(section8);

    // Draw column dividers (light gray vertical lines)
    const [dvr, dvg, dvb] = hexToRgb(SERIES_COLORS.hr);
    doc.setDrawColor(dvr, dvg, dvb);
    doc.setLineWidth(0.5);
    doc.line(colW,     0, colW,     pageH);
    doc.line(colW * 2, 0, colW * 2, pageH);

    // ---- Panel 1: Title, Passage, Key Idea, Memory Verse -------------------
    let y1 = colMargin + titleFontPt;

    const [titleR, titleG, titleB] = hexToRgb(SERIES_COLORS.coverTitle);
    doc.setFont(fontConfig.pdfHeading, 'bold');
    doc.setFontSize(titleFontPt);
    doc.setTextColor(titleR, titleG, titleB);
    const titleWrapped = doc.splitTextToSize(creativeTitle, usableW) as string[];
    for (const tl of titleWrapped) {
      doc.text(tl, colX[0], y1);
      y1 += titleFontPt + 2;
    }
    y1 += 4;

    if (passage) {
      const [mr, mg, mb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(fontConfig.pdfBody, 'italic');
      doc.setFontSize(bodyFontPt);
      doc.setTextColor(mr, mg, mb);
      doc.text(passage, colX[0], y1);
      y1 += bodyFontPt + 6;
    }

    // Thin rule under title block
    const [hrR, hrG, hrB] = hexToRgb(SERIES_COLORS.hr);
    doc.setDrawColor(hrR, hrG, hrB);
    doc.setLineWidth(0.4);
    doc.line(colX[0], y1, colX[0] + usableW, y1);
    y1 += 8;

    y1 = renderTrifoldBlock(
      doc, 'Key Idea', parsed.keyIdea,
      colX[0], y1, usableW, labelFontPt, bodyFontPt, labelLineH, lineH,
      fontConfig, pageH, colMargin
    );

    renderTrifoldBlock(
      doc, 'Memory Verse', parsed.memoryVerse,
      colX[0], y1, usableW, labelFontPt, bodyFontPt, labelLineH, lineH,
      fontConfig, pageH, colMargin
    );

    // ---- Panel 2: Big Points, Gospel Connection ----------------------------
    let y2 = colMargin + labelLineH;

    y2 = renderTrifoldBlock(
      doc, 'Big Points', parsed.bigPoints,
      colX[1], y2, usableW, labelFontPt, bodyFontPt, labelLineH, lineH,
      fontConfig, pageH, colMargin
    );

    renderTrifoldBlock(
      doc, 'Gospel Connection', parsed.gospelConnection,
      colX[1], y2, usableW, labelFontPt, bodyFontPt, labelLineH, lineH,
      fontConfig, pageH, colMargin
    );

    // ---- Panel 3: Reflection Questions, Weekly Challenge, Prayer -----------
    let y3 = colMargin + labelLineH;

    y3 = renderTrifoldBlock(
      doc, 'Reflection Questions', parsed.reflectionQuestions,
      colX[2], y3, usableW, labelFontPt, bodyFontPt, labelLineH, lineH,
      fontConfig, pageH, colMargin
    );

    y3 = renderTrifoldBlock(
      doc, 'Weekly Challenge', parsed.weeklyChallenge,
      colX[2], y3, usableW, labelFontPt, bodyFontPt, labelLineH, lineH,
      fontConfig, pageH, colMargin
    );

    renderTrifoldBlock(
      doc, 'Prayer', parsed.prayer,
      colX[2], y3, usableW, labelFontPt, bodyFontPt, labelLineH, lineH,
      fontConfig, pageH, colMargin
    );
    // ---- Footer: Lesson X of Y centered at bottom of page ------------------
    const [footR, footG, footB] = hexToRgb(EXPORT_SPACING.colors.footerText);
    doc.setFont(fontConfig.pdfBody, 'normal');
    doc.setFontSize(bodyFontPt - 1);
    doc.setTextColor(footR, footG, footB);
    doc.text(
      'Lesson ' + lessonNumber + ' of ' + lessons.length,
      pageW / 2,
      pageH - colMargin,
      { align: 'center' }
    );
  }

  setStep('finalizing');
  return doc.output('arraybuffer');
}

// ============================================================================
// TRI-FOLD CONTENT PARSER
// ============================================================================

interface TrifoldContent {
  keyIdea:             string;
  memoryVerse:         string;
  bigPoints:           string;
  gospelConnection:    string;
  reflectionQuestions: string;
  weeklyChallenge:     string;
  prayer:              string;
}

/**
 * Parse Section 8 markdown content into labeled blocks for tri-fold panels.
 * Looks for **Label:** patterns as defined in the Student Handout format spec
 * (see lessonStructure.ts LESSON_SECTIONS id 8 contentRules).
 */
function parseTrifoldContent(content: string): TrifoldContent {
  function extractBlock(label: string): string {
    // Match **Label:** or **Label** followed by content until the next **Label
    const pattern = new RegExp(
      '\\*\\*' + label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
      '[:\\s]*\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*[A-Z][a-zA-Z\\s]+[:\\s]*\\*\\*|$)',
      'i'
    );
    const match = content.match(pattern);
    if (!match) return '';
    return match[1].trim();
  }

  return {
    keyIdea:             extractBlock('Key Idea'),
    memoryVerse:         extractBlock('Memory Verse'),
    bigPoints:           extractBlock('Big Points'),
    gospelConnection:    extractBlock('Gospel Connection'),
    reflectionQuestions: extractBlock('Reflection Questions'),
    weeklyChallenge:     extractBlock('Weekly Challenge'),
    prayer:              extractBlock('Prayer'),
  };
}

// ============================================================================
// TRI-FOLD BLOCK RENDERER
// ============================================================================

/**
 * Render a labeled content block into a tri-fold panel column.
 * Returns the new Y position after rendering.
 * Clips content at the bottom margin to prevent overflow onto the next column.
 */
function renderTrifoldBlock(
  doc: jsPDF,
  label: string,
  content: string,
  x: number,
  y: number,
  usableW: number,
  labelFontPt: number,
  bodyFontPt: number,
  labelLineH: number,
  lineH: number,
  fontConfig: FontConfig,
  pageH: number,
  colMargin: number
): number {
  if (!content && label !== 'Prayer') {
    // Skip empty blocks (except Prayer which may be a short placeholder)
    if (!content) return y;
  }

  const maxY = pageH - colMargin;

  // Label
  if (y + labelLineH > maxY) return y;
  const [lr, lg, lb] = hexToRgb(SERIES_COLORS.chapterHeading);
  doc.setFont(fontConfig.pdfHeading, 'bold');
  doc.setFontSize(labelFontPt);
  doc.setTextColor(lr, lg, lb);
  doc.text(label, x, y);
  y += labelLineH;

  if (!content) return y;

  // Content lines
  const [cr, cg, cb] = hexToRgb(EXPORT_SPACING.colors.bodyText);
  doc.setFont(fontConfig.pdfBody, 'normal');
  doc.setFontSize(bodyFontPt);
  doc.setTextColor(cr, cg, cb);

  const rawLines = content.split('\n');
  for (const rawLine of rawLines) {
    const line = rawLine.trimEnd();
    if (line.trim() === '') {
      y += lineH * 0.4;
      continue;
    }

    // Strip markdown bold markers for clean rendering
    const cleanLine = line
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/^\s*[*-]\s+/, '- ');

    const wrapped = doc.splitTextToSize(cleanLine, usableW) as string[];
    for (const wl of wrapped) {
      if (y + lineH > maxY) return y;
      doc.text(wl, x, y);
      y += lineH;
    }
  }

  y += lineH * 0.5; // spacing after block
  return y;
}

