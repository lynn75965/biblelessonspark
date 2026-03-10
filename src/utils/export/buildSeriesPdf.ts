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
  SERIES_COVER_COPY,
  SERIES_INTRO_PLACEHOLDER,
  EXPORT_SPACING,
  BOOKLET_PAGE,
  getColorScheme,
  getFontOption,
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

const PAGE_WIDTH  = 612;
const PAGE_HEIGHT = 792;
const PAGE_MARGIN = 72;
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const PAGE_BOTTOM   = PAGE_HEIGHT - PAGE_MARGIN;

/** Strip characters jsPDF built-in fonts cannot render. */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u2610\u2611\u2612\u2713\u2714\u2717\u2718]/g, '')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u00B7\u00A1]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"' )
    .replace(/[\u2013]/g, '--')
    .replace(/[\u2014]/g, '---')
    .replace(/[\u2026]/g, '...')
    .replace(/[\u2192\u21D2]/g, '->')
    .replace(/[\u2190\u21D0]/g, '<-')
    .replace(/[\u2191]/g, '^')
    .replace(/[\u2193]/g, 'v')
    .replace(/[\u00D7]/g, 'x')
    .replace(/[\u00F7]/g, '/')
    .replace(/[\u00B1]/g, '+/-')
    .replace(/[\u2248]/g, '~')
    .replace(/[\u2260]/g, '!=')
    .replace(/[\u2264]/g, '<=')
    .replace(/[\u2265]/g, '>=')
    .replace(/[\u00BD]/g, '1/2')
    .replace(/[\u00BC]/g, '1/4')
    .replace(/[\u00BE]/g, '3/4')
    .replace(/[^\x00-\x7F]/g, '');
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ============================================================================
// LESSON PAGE TRACKER
// ============================================================================

interface PageRange {
  label:     string;
  startPage: number;
  endPage:   number;
}

// ============================================================================
// MAIN BUILDER
// ============================================================================

export async function buildSeriesPdf(
  series:   LessonSeries,
  lessons:  Lesson[],
  options:  SeriesExportOptions,
  setStep:  (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit:        'pt',
    format:      'letter',
  });

  // Resolve color scheme and font from user options (SSOT-driven)
  const scheme  = getColorScheme(options.colorSchemeId);
  const pdfFont = getFontOption(options.font).pdfFamily;

  let currentY   = PAGE_MARGIN;
  let currentPage = 1;
  const lessonRanges:     PageRange[] = [];
  const frontMatterPages: number[]    = [];

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
    doc.setFont(pdfFont, 'normal');
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

    // Widow prevention: if multiple lines and only 1 fits, advance page first
    if (lines.length > 1) {
      const spaceLeft = PAGE_BOTTOM - currentY;
      const linesFit = Math.floor(spaceLeft / lineH);
      if (linesFit < 2) {
        addPage();
      }
    }

    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, PAGE_MARGIN, currentY);
      currentY += lineH;
    }
    currentY += EXPORT_SPACING.paragraph.afterPt;
    resetStyle();
  }

  function renderSectionHeading(text: string): void {
    const [r, g, b] = hexToRgb(scheme.primary);
    doc.setFont(pdfFont, 'bold');
    doc.setFontSize(SERIES_TOC_TYPOGRAPHY.headingSize);
    doc.setTextColor(r, g, b);
    ensureSpace(30);
    doc.text(text, PAGE_MARGIN, currentY);
    currentY += SERIES_TOC_TYPOGRAPHY.headingSize + 8;
    resetStyle();
  }

  function renderSubheading(text: string): void {
    const [r, g, b] = hexToRgb(scheme.primary);
    doc.setFont(pdfFont, 'bold');
    doc.setFontSize(13);
    doc.setTextColor(r, g, b);
    const lines = doc.splitTextToSize(sanitizeForPdf(text), CONTENT_WIDTH) as string[];
    for (const line of lines) {
      doc.text(line, PAGE_MARGIN, currentY);
      currentY += 19;
    }
    currentY += 4;
    resetStyle();
  }

  function renderMetaText(text: string): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(pdfFont, 'italic');
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

      // FIX 1: Skip markdown horizontal rules
      if (line.trim() === '---') continue;

      if (/^#{1,3}\s*$/.test(line)) continue;

      if (/^#{1,3}\s+/.test(line)) {
        const headingText = line.replace(/^#{1,3}\s+/, '');
        ensureSpace(60);
        renderSubheading(headingText);
        continue;
      }

      if (/^\s*[*-]\s+/.test(line)) {
        const bulletText = '- ' + line.replace(/^\s*[*-]\s+/, '');
        renderBodyText(bulletText);
        continue;
      }

      if (line.trim() === '') {
        currentY += EXPORT_SPACING.paragraph.afterPt;
        continue;
      }

      // Detect AI-generated checklist bullets: lines beginning with % (e.g. %- or %u00A1)
      if (/^%/.test(line.trim())) {
        const bulletText = '- ' + line.replace(/^%[^\s]*\s*/, '');
        renderBodyText(bulletText);
        continue;
      }

      // Detect plain-text section labels: e.g. "Literary Context:"
      // Short line, starts with capital, ends with colon, no markdown prefix
      if (/^[A-Z][^:\n]{2,48}:$/.test(line.trim())) {
        ensureSpace(60);
        renderSubheading(line.trim());
        continue;
      }

      // FIX 2: Strip **bold** and *italic* markers; normalize Unicode bullets
      const plainText = line
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/[\u2022\u2023\u25E6\u2043\u2219\u00B7\u00A1]/g, '-')
        .replace(/%[-]/g, '- ')
        .replace(/^%\s*/g, '- ');
      renderBodyText(plainText);
    }
  }

  // ---- Cover Page ----------------------------------------------------------
  setStep('cover');
  frontMatterPages.push(currentPage);

  const coverData = buildCoverPageData(series, lessons, null, null);
  currentY = PAGE_HEIGHT / 3;

  const [tr, tg, tb] = hexToRgb(scheme.primary);
  doc.setFont(pdfFont, 'bold');
  doc.setFontSize(SERIES_COVER_TYPOGRAPHY.titleSize);
  doc.setTextColor(tr, tg, tb);
  const titleLines = doc.splitTextToSize(sanitizeForPdf(coverData.seriesTitle), CONTENT_WIDTH) as string[];
  for (const tl of titleLines) {
    doc.text(tl, PAGE_WIDTH / 2, currentY, { align: 'center' });
    currentY += SERIES_COVER_TYPOGRAPHY.titleSize + 4;
  }
  currentY += 8;

  const [sr, sg, sb] = hexToRgb(scheme.accent);
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(SERIES_COVER_TYPOGRAPHY.subtitleSize);
  doc.setTextColor(sr, sg, sb);
  doc.text(coverData.subtitle, PAGE_WIDTH / 2, currentY, { align: 'center' });
  currentY += SERIES_COVER_TYPOGRAPHY.subtitleSize + 24;

  const [hr1, hg1, hb1] = hexToRgb(scheme.hr);
  doc.setDrawColor(hr1, hg1, hb1);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
  currentY += 24;

  const [mr, mg, mb] = hexToRgb(EXPORT_SPACING.colors.metaText);
  doc.setFont(pdfFont, 'normal');
  doc.setFontSize(SERIES_COVER_TYPOGRAPHY.bodySize);
  doc.setTextColor(mr, mg, mb);

  const metaLines = [
    coverData.teacherLine,
    coverData.churchLine,
    coverData.lessonCountLine,
  ].filter((l): l is string => l !== null);

  for (const ml of metaLines) {
    doc.text(ml, PAGE_WIDTH / 2, currentY, { align: 'center' });
    currentY += SERIES_COVER_TYPOGRAPHY.bodySize + 6;
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
    doc.setFont(pdfFont, 'bold');
    doc.setFontSize(SERIES_TOC_TYPOGRAPHY.entrySize);
    doc.setTextColor(er, eg, eb);
    doc.text(entry.chapterHeading, PAGE_MARGIN, currentY);
    currentY += SERIES_TOC_TYPOGRAPHY.entrySize + 4;

    if (entry.passage) {
      const [pr, pg2, pb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(pdfFont, 'italic');
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
    const lesson       = lessons[i];
    const lessonNumber = i + 1;
    const creativeTitle = extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNumber);
    const passage = lesson.filters?.passage ?? series.bible_passage ?? '';

    addPage();
    const startPage = currentPage;

    // FIX 4: More readable label font size with modest spacing
    const [lr, lg, lb] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(pdfFont, 'normal');
    doc.setFontSize(11);
    doc.setTextColor(lr, lg, lb);
    doc.text('LESSON ' + lessonNumber, PAGE_MARGIN, currentY);
    currentY += 11 + 8;

    const [ct_r, ct_g, ct_b] = hexToRgb(scheme.primary);
    doc.setFont(pdfFont, 'bold');
    doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.titleSize);
    doc.setTextColor(ct_r, ct_g, ct_b);
    const ctLines = doc.splitTextToSize(sanitizeForPdf(creativeTitle), CONTENT_WIDTH) as string[];
    for (const ctl of ctLines) {
      doc.text(ctl, PAGE_MARGIN, currentY);
      currentY += SERIES_CHAPTER_TYPOGRAPHY.titleSize + 4;
    }

    if (passage) {
      const [psr, psg, psb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(pdfFont, 'italic');
      doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.subtitleSize);
      doc.setTextColor(psr, psg, psb);
      doc.text(passage, PAGE_MARGIN, currentY);
      currentY += SERIES_CHAPTER_TYPOGRAPHY.subtitleSize + 6;
    }

    const [hr2, hg2, hb2] = hexToRgb(scheme.hr);
    doc.setDrawColor(hr2, hg2, hb2);
    doc.setLineWidth(0.4);
    doc.line(PAGE_MARGIN, currentY, PAGE_WIDTH - PAGE_MARGIN, currentY);
    currentY += 10;
    resetStyle();

    // FIX 5: Strip duplicate title heading from start of lesson content
    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const rawStripped = options.omitSection8FromChapters
      ? stripSection8FromContent(rawContent)
      : rawContent;
    const content = rawStripped.replace(/^\s*#{1,3}\s+[^\n]*\n?/, '');
    renderLessonContent(content);

    // FIX 6: Include creative title in footer label
    lessonRanges.push({
      label:     'Lesson ' + lessonNumber + ': ' + creativeTitle,
      startPage,
      endPage:   currentPage,
    });
  }

  // ---- Group Handout Section -----------------------------------------------
  let handoutRange: PageRange | null = null;
  if (options.includeHandoutBooklet) {
    setStep('handout');
    const bookletData = buildHandoutBookletData(series, lessons);

    addPage();
    const handoutStart = currentPage;

    // FIX 7: Styled section divider -- clear, distinct, appendix-weight
    currentY = PAGE_HEIGHT * 0.38;

    const [sdhr, sdhg, sdhb] = hexToRgb(scheme.hr);
    doc.setDrawColor(sdhr, sdhg, sdhb);
    doc.setLineWidth(1.5);
    doc.line(PAGE_MARGIN + 40, currentY, PAGE_WIDTH - PAGE_MARGIN - 40, currentY);
    currentY += 28;

    const [sdtr, sdtg, sdtb] = hexToRgb(scheme.primary);
    doc.setFont(pdfFont, 'bold');
    doc.setFontSize(20);
    doc.setTextColor(sdtr, sdtg, sdtb);
    doc.text(bookletData.appendixTitle, PAGE_WIDTH / 2, currentY, { align: 'center' });
    currentY += 28;

    doc.setDrawColor(sdhr, sdhg, sdhb);
    doc.setLineWidth(1.5);
    doc.line(PAGE_MARGIN + 40, currentY, PAGE_WIDTH - PAGE_MARGIN - 40, currentY);
    currentY += 22;

    const [sdsr, sdsg, sdsb] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(pdfFont, 'italic');
    doc.setFontSize(11);
    doc.setTextColor(sdsr, sdsg, sdsb);
    doc.text(bookletData.appendixSubtitle, PAGE_WIDTH / 2, currentY, { align: 'center' });
    resetStyle();

    for (const entry of bookletData.entries) {
      addPage();
      renderSubheading(entry.header);
      if (entry.passage) {
        renderMetaText(entry.passage);
      }
      renderLessonContent(entry.content);
    }

    handoutRange = {
      label:     'Group Handout',
      startPage: handoutStart,
      endPage:   currentPage,
    };
  }

  // ---- Back Cover ----------------------------------------------------------
  addPage();
  const backCoverPage = currentPage;

  currentY = PAGE_HEIGHT * 0.75;
  const [fr, fg, fb] = hexToRgb(EXPORT_SPACING.colors.footerText);
  doc.setFont(pdfFont, 'normal');
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
    doc.setFont(pdfFont, 'normal');
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

// ============================================================================
// BOOKLET PDF BUILDER
// Produces 5.5 x 8.5" content pages then imposes them 2-up onto landscape
// letter sheets (11 x 8.5") for saddle-stitch (fold-and-staple) printing.
// ============================================================================

export async function buildBookletPdf(
  series:  LessonSeries,
  lessons: Lesson[],
  options: SeriesExportOptions,
  setStep: (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  const BK_W     = BOOKLET_PAGE.width;        // 396pt = 5.5"
  const BK_H     = BOOKLET_PAGE.height;       // 612pt = 8.5"
  const BK_M     = BOOKLET_PAGE.marginLeft;   // 18pt spine/inner margin (0.25")
  const BK_OUTER = BOOKLET_PAGE.marginRight;  // 28.8pt outer margin (0.40")
  const BK_CW    = BK_W - BK_M - BK_OUTER;   // content width 349.2pt
  const BK_BOT   = BK_H - BOOKLET_PAGE.marginBottom;

  const scheme   = getColorScheme(options.colorSchemeId);
  const pdfFont  = getFontOption(options.font).pdfFamily;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [BK_W, BK_H] });

  let cy = BOOKLET_PAGE.marginTop;
  let cp = 1;
  const lessonRanges: { label: string; startPage: number; endPage: number }[] = [];
  const fmPages: number[] = [];

  function bkPage(): void { doc.addPage([BK_W, BK_H], 'portrait'); cy = BOOKLET_PAGE.marginTop; cp++; }
  function bkEnsure(h: number): void { if (cy + h > BK_BOT) bkPage(); }
  function bkReset(): void {
    const [r,g,b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(pdfFont,'normal'); doc.setFontSize(EXPORT_SPACING.body.fontPt); doc.setTextColor(r,g,b);
  }

  function bkBody(text: string, italic?: boolean): void {
    const [r,g,b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(pdfFont, italic ? 'italic' : 'normal');
    doc.setFontSize(EXPORT_SPACING.body.fontPt); doc.setTextColor(r,g,b);
    const lines = doc.splitTextToSize(sanitizeForPdf(text), BK_CW) as string[];
    const lh = EXPORT_SPACING.body.fontPt * EXPORT_SPACING.body.lineHeight;
    for (const line of lines) { bkEnsure(lh); doc.text(line, BK_M, cy); cy += lh; }
    cy += EXPORT_SPACING.paragraph.afterPt;
    bkReset();
  }

  function bkSubhead(text: string): void {
    const [r,g,b] = hexToRgb(scheme.primary);
    doc.setFont(pdfFont,'bold'); doc.setFontSize(11); doc.setTextColor(r,g,b);
    const lines = doc.splitTextToSize(sanitizeForPdf(text), BK_CW) as string[];
    for (const line of lines) { doc.text(line, BK_M, cy); cy += 16; }
    cy += 3; bkReset();
  }

  function bkMeta(text: string): void {
    const [r,g,b] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(pdfFont,'italic'); doc.setFontSize(EXPORT_SPACING.metadata.fontPt); doc.setTextColor(r,g,b);
    bkEnsure(EXPORT_SPACING.metadata.fontPt + 4);
    doc.text(text, BK_M, cy); cy += EXPORT_SPACING.metadata.fontPt + 6; bkReset();
  }

  function bkContent(content: string): void {
    if (!content) return;
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trimEnd();
      if (line.trim() === '---') continue;
      if (/^#{1,3}\s*$/.test(line)) continue;
      if (/^#{1,3}\s+/.test(line)) { bkEnsure(50); bkSubhead(line.replace(/^#{1,3}\s+/,'')); continue; }
      if (/^\s*[*-]\s+/.test(line)) { bkBody('- ' + line.replace(/^\s*[*-]\s+/,'')); continue; }
      if (line.trim() === '') { cy += EXPORT_SPACING.paragraph.afterPt; continue; }
      if (/^%/.test(line.trim())) { bkBody('- ' + line.replace(/^%[^\s]*\s*/,'')); continue; }
      if (/^[A-Z][^:\n]{2,48}:$/.test(line.trim())) { bkEnsure(50); bkSubhead(line.trim()); continue; }
      if (/^>\s*/.test(line.trim())) { bkBody(sanitizeForPdf(line.replace(/^>\s*/,''))); continue; }
      bkBody(sanitizeForPdf(line.replace(/\*\*([^*]+)\*\*/g,'$1').replace(/\*([^*]+)\*/g,'$1').replace(/_([^_]+)_/g,'$1')));
    }
  }

  // -- Cover ------------------------------------------------------------------
  setStep('cover');
  fmPages.push(cp);
  const coverData = buildCoverPageData(series, lessons, null, null);
  cy = BK_H / 3;
  const [tr,tg,tb] = hexToRgb(scheme.primary);
  doc.setFont(pdfFont,'bold'); doc.setFontSize(20); doc.setTextColor(tr,tg,tb);
  for (const tl of (doc.splitTextToSize(sanitizeForPdf(coverData.seriesTitle), BK_CW) as string[])) {
    doc.text(tl, BK_W/2, cy, { align:'center' }); cy += 24;
  }
  cy += 6;
  const [sr,sg,sb] = hexToRgb(scheme.accent);
  doc.setFont(pdfFont,'normal'); doc.setFontSize(11); doc.setTextColor(sr,sg,sb);
  doc.text(coverData.subtitle, BK_W/2, cy, { align:'center' }); cy += 20;
  const [hr1,hg1,hb1] = hexToRgb(scheme.hr);
  doc.setDrawColor(hr1,hg1,hb1); doc.setLineWidth(0.5);
  doc.line(BK_M, cy, BK_W - BK_OUTER, cy); cy += 14;
  const [mr,mg,mb] = hexToRgb(EXPORT_SPACING.colors.metaText);
  doc.setFont(pdfFont,'normal'); doc.setFontSize(9); doc.setTextColor(mr,mg,mb);
  for (const ml of ([coverData.teacherLine, coverData.churchLine, coverData.lessonCountLine].filter((l): l is string => l !== null))) {
    doc.text(ml, BK_W/2, cy, { align:'center' }); cy += 14;
  }

  // -- TOC --------------------------------------------------------------------
  setStep('toc');
  bkPage(); fmPages.push(cp);
  const tocEntries = buildTocEntries(series, lessons);
  const [th,tgh,tbh] = hexToRgb(scheme.primary);
  doc.setFont(pdfFont,'bold'); doc.setFontSize(14); doc.setTextColor(th,tgh,tbh);
  doc.text('Table of Contents', BK_M, cy); cy += 20; bkReset();
  for (const entry of tocEntries) {
    bkEnsure(24);
    const [er,eg,eb] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(pdfFont,'bold'); doc.setFontSize(EXPORT_SPACING.body.fontPt); doc.setTextColor(er,eg,eb);
    doc.text(entry.chapterHeading, BK_M, cy); cy += EXPORT_SPACING.body.fontPt + 4;
    if (entry.passage) {
      const [pr,pg2,pb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(pdfFont,'italic'); doc.setFontSize(9); doc.setTextColor(pr,pg2,pb);
      doc.text('  ' + entry.passage, BK_M, cy); cy += 13;
    }
    cy += 3;
  }

  // -- Intro ------------------------------------------------------------------
  bkPage(); fmPages.push(cp);
  bkSubhead('Introduction'); bkBody(SERIES_INTRO_PLACEHOLDER);

  // -- Lessons ----------------------------------------------------------------
  setStep('lessons');
  for (let i = 0; i < lessons.length; i++) {
    const lesson = lessons[i];
    const n = i + 1;
    const creativeTitle = extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + n);
    const passage = lesson.filters?.passage ?? series.bible_passage ?? '';
    bkPage();
    const startPage = cp;
    const [lr,lg,lb] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(pdfFont,'normal'); doc.setFontSize(9); doc.setTextColor(lr,lg,lb);
    doc.text('LESSON ' + n, BK_M, cy); cy += 13;
    const [ctr,ctg,ctb] = hexToRgb(scheme.primary);
    doc.setFont(pdfFont,'bold'); doc.setFontSize(15); doc.setTextColor(ctr,ctg,ctb);
    for (const ctl of (doc.splitTextToSize(sanitizeForPdf(creativeTitle), BK_CW) as string[])) {
      doc.text(ctl, BK_M, cy); cy += 18;
    }
    if (passage) {
      const [psr,psg,psb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(pdfFont,'italic'); doc.setFontSize(10); doc.setTextColor(psr,psg,psb);
      doc.text(passage, BK_M, cy); cy += 14;
    }
    const [hr2,hg2,hb2] = hexToRgb(scheme.hr);
    doc.setDrawColor(hr2,hg2,hb2); doc.setLineWidth(0.4);
    doc.line(BK_M, cy, BK_W - BK_OUTER, cy); cy += 8; bkReset();
    const raw = lesson.shaped_content ?? lesson.original_text ?? '';
    bkContent((options.omitSection8FromChapters ? stripSection8FromContent(raw) : raw).replace(/^\s*#{1,3}\s+[^\n]*\n?/,''));
    lessonRanges.push({ label: 'Lesson ' + n + ': ' + creativeTitle, startPage, endPage: cp });
  }

  // -- Group Handout ----------------------------------------------------------
  let handoutStart = -1;
  if (options.includeHandoutBooklet) {
    setStep('handout');
    const bookletData = buildHandoutBookletData(series, lessons);
    bkPage(); handoutStart = cp;
    cy = BK_H * 0.38;
    const [sdhr,sdhg,sdhb] = hexToRgb(scheme.hr);
    doc.setDrawColor(sdhr,sdhg,sdhb); doc.setLineWidth(1);
    doc.line(BK_M + 20, cy, BK_W - BK_OUTER - 20, cy); cy += 18;
    const [sdtr,sdtg,sdtb] = hexToRgb(scheme.primary);
    doc.setFont(pdfFont,'bold'); doc.setFontSize(16); doc.setTextColor(sdtr,sdtg,sdtb);
    doc.text(bookletData.appendixTitle, BK_W/2, cy, { align:'center' }); cy += 20;
    doc.setDrawColor(sdhr,sdhg,sdhb);
    doc.line(BK_M + 20, cy, BK_W - BK_OUTER - 20, cy); bkReset();
    for (const entry of bookletData.entries) {
      bkPage(); bkSubhead(entry.header);
      if (entry.passage) bkMeta(entry.passage);
      bkContent(entry.content);
    }
  }

  // -- Back Cover -------------------------------------------------------------
  bkPage();
  const backCoverPage = cp;
  cy = BK_H * 0.75;
  const [fr,fg,fb] = hexToRgb(EXPORT_SPACING.colors.footerText);
  doc.setFont(pdfFont,'normal'); doc.setFontSize(8); doc.setTextColor(fr,fg,fb);
  doc.text(SERIES_COVER_COPY.generatedBy, BK_W/2, cy, { align:'center' }); cy += 12;
  doc.text(SERIES_COVER_COPY.website,     BK_W/2, cy, { align:'center' }); cy += 12;
  doc.text('\u00A9 ' + new Date().getFullYear() + ' BibleLessonSpark. All rights reserved.', BK_W/2, cy, { align:'center' });

  // -- Footers ----------------------------------------------------------------
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    if (fmPages.includes(p) || p === backCoverPage) continue;
    doc.setPage(p);
    const [fnr,fng,fnb] = hexToRgb(EXPORT_SPACING.colors.footerText);
    doc.setFont(pdfFont,'normal'); doc.setFontSize(8); doc.setTextColor(fnr,fng,fnb);
    let ft = '';
    for (const range of lessonRanges) {
      if (p >= range.startPage && p <= range.endPage) {
        ft = range.label + ' -- Page ' + (p - range.startPage + 1); break;
      }
    }
    if (!ft && handoutStart > 0 && p >= handoutStart)
      ft = 'Group Handout -- Page ' + (p - handoutStart + 1);
    if (ft) doc.text(ft, BK_W/2, BK_H - 28, { align:'center' });
  }

  // -- Impose 2-up ------------------------------------------------------------
  setStep('finalizing');
  return await _imposeBooklet(doc.output('arraybuffer'));
}

// ============================================================================
// SADDLE-STITCH IMPOSITION
// Takes half-letter content pages, pairs them onto landscape letter sheets.
// Print double-sided, fold, staple at spine.
//
// Imposition order (n = page count padded to multiple of 4):
//   Sheet i front: left=pages[n-1-2i],  right=pages[2i]
//   Sheet i back:  left=pages[2i+1],    right=pages[n-2-2i]
// ============================================================================

async function _imposeBooklet(contentBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const { PDFDocument } = await import('pdf-lib');
  const srcDoc   = await PDFDocument.load(contentBuffer);
  const nContent = srcDoc.getPageCount();
  let n = nContent;
  while (n % 4 !== 0) n++;
  const outDoc   = await PDFDocument.create();
  const srcBytes = await srcDoc.save();
  const allIndices = Array.from({ length: nContent }, (_, i) => i);
  const embedded = await outDoc.embedPdf(srcBytes, allIndices);
  const PW = BOOKLET_PAGE.width;   // 396pt (5.5")
  const PH = BOOKLET_PAGE.height;  // 612pt (8.5")
  const SW = PW * 2;               // 792pt (11") landscape sheet width
  const nSheets = n / 4;
  for (let i = 0; i < nSheets; i++) {
    const pairs: [number, number][] = [
      [n - 1 - 2 * i, 2 * i],
      [2 * i + 1,     n - 2 - 2 * i],
    ];
    for (const [leftIdx, rightIdx] of pairs) {
      const sheet = outDoc.addPage([SW, PH]);
      if (leftIdx < nContent)  sheet.drawPage(embedded[leftIdx],  { x: 0,  y: 0, width: PW, height: PH });
      if (rightIdx < nContent) sheet.drawPage(embedded[rightIdx], { x: PW, y: 0, width: PW, height: PH });
    }
  }
  const bytes = await outDoc.save();
  return bytes.buffer as ArrayBuffer;
}