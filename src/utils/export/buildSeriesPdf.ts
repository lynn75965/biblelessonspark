// ============================================================================
// buildSeriesPdf.ts
// Location: src/utils/export/buildSeriesPdf.ts
//
// PDF document builders for the Series Curriculum Export.
//
// EXPORTS:
//   buildSeriesPdf()    -- US Letter, full-page, 1" margins
//   buildBookletPdf()   -- Saddle-stitch booklet:
//                           1. Builds half-letter (5.5"x8.5") content pages
//                              with 0.4" mirror margins via jsPDF
//                           2. Imposes 2-up onto landscape letter sheets
//                              via pdf-lib for print-and-fold delivery
//
// Document structure (both formats):
//   1. Cover Page
//   2. Table of Contents
//   3. Introduction
//   4. Lesson Chapters
//   5. Group Handout Section
//   6. Back Cover
//
// ============================================================================

import jsPDF from 'jspdf';
import { PDFDocument } from 'pdf-lib';
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
  BOOKLET_PAGE,
  BOOKLET_SHEET,
  BOOKLET_TYPOGRAPHY,
  resolveExportTerminology,
} from '@/constants/seriesExportConfig';
import { buildCoverPageData } from './buildCoverPage';
import { buildTocEntries } from './buildToc';
import {
  buildHandoutBookletData,
  extractCreativeTitle,
  stripSection8FromContent,
} from './buildHandoutBooklet';

// ============================================================================
// SHARED CONSTANTS
// ============================================================================

const FP_PAGE_WIDTH    = 612;
const FP_PAGE_HEIGHT   = 792;
const FP_PAGE_MARGIN   = 72;
const FP_CONTENT_WIDTH = FP_PAGE_WIDTH - FP_PAGE_MARGIN * 2;
const FP_PAGE_BOTTOM   = FP_PAGE_HEIGHT - FP_PAGE_MARGIN;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ============================================================================
// PAGE TRACKER
// ============================================================================

interface PageRange {
  label: string;
  startPage: number;
  endPage: number;
}

// ============================================================================
// FULL-PAGE PDF BUILDER  (US Letter, 1" margins)
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

  let currentY   = FP_PAGE_MARGIN;
  let currentPage = 1;
  const lessonRanges: PageRange[]  = [];
  const frontMatterPages: number[] = [];
  const terminology = resolveExportTerminology(options.audience_profile);

  // -- helpers ----------------------------------------------------------------

  function addPage(): void {
    doc.addPage('letter', 'portrait');
    currentY = FP_PAGE_MARGIN;
    currentPage++;
  }

  function ensureSpace(minHeight: number): void {
    if (currentY + minHeight > FP_PAGE_BOTTOM) addPage();
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
    const lines = doc.splitTextToSize(text, FP_CONTENT_WIDTH) as string[];
    const lineH = EXPORT_SPACING.body.fontPt * EXPORT_SPACING.body.lineHeight;
    for (const line of lines) {
      ensureSpace(lineH);
      doc.text(line, FP_PAGE_MARGIN, currentY);
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
    doc.text(text, FP_PAGE_MARGIN, currentY);
    currentY += SERIES_TOC_TYPOGRAPHY.headingFontPt + 8;
    resetStyle();
  }

  function renderSubheading(text: string): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.chapterHeading);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt + 2);
    doc.setTextColor(r, g, b);
    ensureSpace(24);
    const lines = doc.splitTextToSize(text, FP_CONTENT_WIDTH) as string[];
    for (const line of lines) {
      doc.text(line, FP_PAGE_MARGIN, currentY);
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
    doc.text(text, FP_PAGE_MARGIN, currentY);
    currentY += EXPORT_SPACING.metadata.fontPt + 6;
    resetStyle();
  }

  function renderLessonContent(content: string): void {
    if (!content) return;
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trimEnd();
      if (/^#{1,3}\s*$/.test(line)) continue;
      if (/^#{1,3}\s+/.test(line)) {
        renderSubheading(line.replace(/^#{1,3}\s+/, ''));
        continue;
      }
      if (/^\s*[*-]\s+/.test(line)) {
        renderBodyText('\u2022  ' + line.replace(/^\s*[*-]\s+/, ''));
        continue;
      }
      if (line.trim() === '') {
        currentY += EXPORT_SPACING.paragraph.afterPt;
        continue;
      }
      renderBodyText(line.replace(/\*\*([^*]+)\*\*/g, '$1'));
    }
  }

  // -- Cover ------------------------------------------------------------------
  setStep('cover');
  frontMatterPages.push(currentPage);
  const coverData = buildCoverPageData(series, lessons, null, null);
  currentY = FP_PAGE_HEIGHT / 3;

  const [tr, tg, tb] = hexToRgb(SERIES_COLORS.coverTitle);
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
  doc.setFontSize(SERIES_COVER_TYPOGRAPHY.titleFontPt);
  doc.setTextColor(tr, tg, tb);
  for (const tl of doc.splitTextToSize(coverData.seriesTitle, FP_CONTENT_WIDTH) as string[]) {
    doc.text(tl, FP_PAGE_WIDTH / 2, currentY, { align: 'center' });
    currentY += SERIES_COVER_TYPOGRAPHY.titleFontPt + 4;
  }
  currentY += 8;

  const [sr, sg, sb] = hexToRgb(SERIES_COLORS.coverSubtitle);
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  doc.setFontSize(SERIES_COVER_TYPOGRAPHY.subtitleFontPt);
  doc.setTextColor(sr, sg, sb);
  doc.text(coverData.subtitle, FP_PAGE_WIDTH / 2, currentY, { align: 'center' });
  currentY += SERIES_COVER_TYPOGRAPHY.subtitleFontPt + 24;

  const [hr1r, hr1g, hr1b] = hexToRgb(SERIES_COLORS.hr);
  doc.setDrawColor(hr1r, hr1g, hr1b);
  doc.setLineWidth(0.5);
  doc.line(FP_PAGE_MARGIN, currentY, FP_PAGE_WIDTH - FP_PAGE_MARGIN, currentY);
  currentY += 24;

  const [mr, mg, mb_] = hexToRgb(EXPORT_SPACING.colors.metaText);
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  doc.setFontSize(SERIES_COVER_TYPOGRAPHY.metaFontPt);
  doc.setTextColor(mr, mg, mb_);
  for (const ml of [coverData.teacherLine, coverData.churchLine,
                    coverData.dateRangeLine, coverData.lessonCountLine]
                    .filter((l): l is string => l !== null)) {
    doc.text(ml, FP_PAGE_WIDTH / 2, currentY, { align: 'center' });
    currentY += SERIES_COVER_TYPOGRAPHY.metaFontPt + 6;
  }

  // -- TOC --------------------------------------------------------------------
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
    doc.text(entry.chapterHeading, FP_PAGE_MARGIN, currentY);
    currentY += SERIES_TOC_TYPOGRAPHY.entryFontPt + 4;
    if (entry.passage) {
      const [pr2, pg2, pb2] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
      doc.setFontSize(EXPORT_SPACING.metadata.fontPt);
      doc.setTextColor(pr2, pg2, pb2);
      doc.text('    ' + entry.passage, FP_PAGE_MARGIN, currentY);
      currentY += EXPORT_SPACING.metadata.fontPt + 4;
    }
    currentY += 4;
  }

  // -- Introduction -----------------------------------------------------------
  addPage();
  frontMatterPages.push(currentPage);
  renderSectionHeading('Introduction');
  renderBodyText(SERIES_INTRO_PLACEHOLDER);

  // -- Lesson Chapters --------------------------------------------------------
  setStep('lessons');
  for (let i = 0; i < lessons.length; i++) {
    const lesson      = lessons[i];
    const lessonNum   = i + 1;
    const title       = extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNum);
    const passage     = lesson.filters?.passage ?? series.bible_passage ?? '';

    addPage();
    const startPage = currentPage;

    const [lr, lg, lb] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
    doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt);
    doc.setTextColor(lr, lg, lb);
    doc.text('LESSON ' + lessonNum, FP_PAGE_MARGIN, currentY);
    currentY += SERIES_CHAPTER_TYPOGRAPHY.chapterLabelFontPt + 4;

    const [ct_r, ct_g, ct_b] = hexToRgb(SERIES_COLORS.chapterHeading);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.chapterTitleFontPt);
    doc.setTextColor(ct_r, ct_g, ct_b);
    for (const ctl of doc.splitTextToSize(title, FP_CONTENT_WIDTH) as string[]) {
      doc.text(ctl, FP_PAGE_MARGIN, currentY);
      currentY += SERIES_CHAPTER_TYPOGRAPHY.chapterTitleFontPt + 4;
    }

    if (passage) {
      const [psr, psg, psb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
      doc.setFontSize(SERIES_CHAPTER_TYPOGRAPHY.passageFontPt);
      doc.setTextColor(psr, psg, psb);
      doc.text(passage, FP_PAGE_MARGIN, currentY);
      currentY += SERIES_CHAPTER_TYPOGRAPHY.passageFontPt + 6;
    }

    const [hr2r, hr2g, hr2b] = hexToRgb(SERIES_COLORS.hr);
    doc.setDrawColor(hr2r, hr2g, hr2b);
    doc.setLineWidth(0.4);
    doc.line(FP_PAGE_MARGIN, currentY, FP_PAGE_WIDTH - FP_PAGE_MARGIN, currentY);
    currentY += 10;
    resetStyle();

    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const content    = options.omitSection8FromChapters
      ? stripSection8FromContent(rawContent)
      : rawContent;
    renderLessonContent(content);

    lessonRanges.push({ label: 'Lesson ' + lessonNum, startPage, endPage: currentPage });
  }

  // -- Group Handout Section --------------------------------------------------
  let handoutRange: PageRange | null = null;
  if (options.includeHandoutBooklet) {
    setStep('handouts');
    const bookletData = buildHandoutBookletData(series, lessons);
    addPage();
    const handoutStart = currentPage;
    renderSectionHeading(terminology.assemblyLabel + ' Handout Section');
    renderBodyText(bookletData.appendixSubtitle, true);
    for (const entry of bookletData.entries) {
      addPage();
      renderSubheading(entry.header);
      if (entry.passage) renderMetaText(entry.passage);
      renderLessonContent(entry.content);
    }
    handoutRange = { label: 'Group Handouts', startPage: handoutStart, endPage: currentPage };
  }

  // -- Back Cover -------------------------------------------------------------
  addPage();
  const backCoverPage = currentPage;
  currentY = FP_PAGE_HEIGHT * 0.75;
  const [fr, fg, fb] = hexToRgb(EXPORT_SPACING.colors.footerText);
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  doc.setFontSize(EXPORT_SPACING.footer.fontPt + 2);
  doc.setTextColor(fr, fg, fb);
  doc.text(SERIES_COVER_COPY.generatedBy, FP_PAGE_WIDTH / 2, currentY, { align: 'center' });
  currentY += EXPORT_SPACING.footer.fontPt + 8;
  doc.text(SERIES_COVER_COPY.website, FP_PAGE_WIDTH / 2, currentY, { align: 'center' });
  currentY += EXPORT_SPACING.footer.fontPt + 8;
  doc.text('\u00A9 ' + new Date().getFullYear() + ' BibleLessonSpark. All rights reserved.',
           FP_PAGE_WIDTH / 2, currentY, { align: 'center' });

  // -- Per-lesson page numbers ------------------------------------------------
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
        footerText = range.label + ' -- Page ' + (p - range.startPage + 1);
        break;
      }
    }
    if (!footerText && handoutRange && p >= handoutRange.startPage && p <= handoutRange.endPage) {
      footerText = handoutRange.label + ' -- Page ' + (p - handoutRange.startPage + 1);
    }
    if (footerText) {
      doc.text(footerText, FP_PAGE_WIDTH / 2, FP_PAGE_HEIGHT - 36, { align: 'center' });
    }
  }

  setStep('finalizing');
  return doc.output('arraybuffer');
}

// ============================================================================
// BOOKLET PDF BUILDER -- half-letter content + saddle-stitch imposition
// ============================================================================

export async function buildBookletPdf(
  series: LessonSeries,
  lessons: Lesson[],
  options: SeriesExportOptions,
  setStep: (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  // Step 1: Build content pages at half-letter size
  const contentBuffer = await _buildBookletContent(series, lessons, options, setStep);

  // Step 2: Impose 2-up onto landscape letter sheets
  setStep('imposing');
  const imposedBuffer = await _imposeBooklet(contentBuffer);

  setStep('finalizing');
  return imposedBuffer;
}

// ----------------------------------------------------------------------------
// _buildBookletContent -- generates half-letter jsPDF with mirror margins
// ----------------------------------------------------------------------------

async function _buildBookletContent(
  series: LessonSeries,
  lessons: Lesson[],
  options: SeriesExportOptions,
  setStep: (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  const BK  = BOOKLET_PAGE;
  const TYP = BOOKLET_TYPOGRAPHY;
  const terminology = resolveExportTerminology(options.audience_profile);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [BK.width, BK.height],
  });

  let currentY    = BK.margin;
  let currentPage = 1;   // 1-indexed; page 1 = cover (recto)

  const frontMatterPages: number[] = [];
  const lessonRanges: PageRange[]  = [];

  // -- helpers ----------------------------------------------------------------

  const PAGE_BOTTOM_BK = BK.height - BK.margin;

  function isRecto(): boolean { return currentPage % 2 === 1; }

  /** Left margin: gutter on recto, outer on verso -- both = BK.margin (0.4") */
  function leftX(): number { return BK.margin; }

  function addPageBk(): void {
    doc.addPage([BK.width, BK.height], 'portrait');
    currentY = BK.margin;
    currentPage++;
  }

  function ensureSpaceBk(minH: number): void {
    if (currentY + minH > PAGE_BOTTOM_BK) addPageBk();
  }

  function resetStyleBk(): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
    doc.setFontSize(TYP.bodyFontPt);
    doc.setTextColor(r, g, b);
  }

  function renderBodyBk(text: string, italic?: boolean): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, italic ? 'italic' : 'normal');
    doc.setFontSize(TYP.bodyFontPt);
    doc.setTextColor(r, g, b);
    const lines = doc.splitTextToSize(text, BK.contentWidth) as string[];
    const lineH = TYP.bodyFontPt * TYP.bodyLineHeight;
    for (const line of lines) {
      ensureSpaceBk(lineH);
      doc.text(line, leftX(), currentY);
      currentY += lineH;
    }
    currentY += 3;
    resetStyleBk();
  }

  function renderSectionHeadingBk(text: string): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.tocHeading);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(TYP.tocHeadingFontPt);
    doc.setTextColor(r, g, b);
    ensureSpaceBk(24);
    doc.text(text, leftX(), currentY);
    currentY += TYP.tocHeadingFontPt + 6;
    _drawRuleBk();
    resetStyleBk();
  }

  function renderSubheadingBk(text: string): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.chapterHeading);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(TYP.subheadFontPt);
    doc.setTextColor(r, g, b);
    ensureSpaceBk(20);
    const lines = doc.splitTextToSize(text, BK.contentWidth) as string[];
    for (const line of lines) {
      doc.text(line, leftX(), currentY);
      currentY += TYP.subheadFontPt + 4;
    }
    currentY += 2;
    resetStyleBk();
  }

  function renderSectionLabelBk(text: string): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.chapterHeading);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(TYP.sectionLabelFontPt);
    doc.setTextColor(r, g, b);
    ensureSpaceBk(20);
    currentY += 8;
    doc.text(text.toUpperCase(), leftX(), currentY);
    currentY += TYP.sectionLabelFontPt + 3;
    _drawRuleBk();
    resetStyleBk();
  }

  function renderMetaBk(text: string): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
    doc.setFontSize(TYP.passageFontPt);
    doc.setTextColor(r, g, b);
    ensureSpaceBk(TYP.passageFontPt + 3);
    doc.text(text, leftX(), currentY);
    currentY += TYP.passageFontPt + 4;
    resetStyleBk();
  }

  function _drawRuleBk(): void {
    const [r, g, b] = hexToRgb(SERIES_COLORS.hr);
    doc.setDrawColor(r, g, b);
    doc.setLineWidth(0.4);
    doc.line(leftX(), currentY, BK.width - BK.margin, currentY);
    currentY += 5;
  }

  function renderLessonContentBk(content: string): void {
    if (!content) return;
    for (const rawLine of content.split('\n')) {
      const line = rawLine.trimEnd();
      if (/^#{1,3}\s*$/.test(line)) continue;
      if (/^#{1,3}\s+/.test(line)) {
        renderSectionLabelBk(line.replace(/^#{1,3}\s+/, ''));
        continue;
      }
      if (/^\s*[*-]\s+/.test(line)) {
        renderBodyBk('\u2022  ' + line.replace(/^\s*[*-]\s+/, ''));
        continue;
      }
      if (line.trim() === '') {
        currentY += 3;
        continue;
      }
      renderBodyBk(line.replace(/\*\*([^*]+)\*\*/g, '$1'));
    }
  }

  function drawFooterBk(): void {
    const [r, g, b] = hexToRgb(EXPORT_SPACING.colors.footerText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
    doc.setFontSize(TYP.footerFontPt);
    doc.setTextColor(r, g, b);
    const fy = BK.height - BK.margin + 10;
    const seriesShort = (series.series_name ?? SERIES_COVER_COPY.subtitle).slice(0, 36);
    const pgNum = String(currentPage - 1); // offset cover
    if (isRecto()) {
      doc.text(seriesShort, leftX(), fy);
      doc.text(pgNum, BK.width - BK.margin, fy, { align: 'right' });
    } else {
      doc.text(pgNum, leftX(), fy);
      doc.text(seriesShort, BK.width - BK.margin, fy, { align: 'right' });
    }
  }

  // -- Cover (recto, page 1) --------------------------------------------------
  setStep('cover');
  frontMatterPages.push(currentPage);

  const coverData = buildCoverPageData(series, lessons, null, null);
  const [tr, tg, tb] = hexToRgb(SERIES_COLORS.coverTitle);

  doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  doc.setFontSize(TYP.bodyFontPt);
  doc.setTextColor(
    ...hexToRgb(EXPORT_SPACING.colors.metaText) as [number, number, number]
  );
  const coverY_label = BK.height * 0.30;
  doc.text(SERIES_COVER_COPY.subtitle, BK.width / 2, coverY_label, { align: 'center' });

  doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
  doc.setFontSize(TYP.coverTitleFontPt);
  doc.setTextColor(tr, tg, tb);
  const titleLines = doc.splitTextToSize(coverData.seriesTitle, BK.contentWidth) as string[];
  let coverY = BK.height * 0.42;
  for (const tl of titleLines) {
    doc.text(tl, BK.width / 2, coverY, { align: 'center' });
    coverY += TYP.coverTitleFontPt + 4;
  }
  coverY += 6;

  const [sr, sg, sb] = hexToRgb(SERIES_COLORS.coverSubtitle);
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  doc.setFontSize(TYP.coverSubtitleFontPt);
  doc.setTextColor(sr, sg, sb);
  doc.text(coverData.subtitle, BK.width / 2, coverY, { align: 'center' });
  coverY += TYP.coverSubtitleFontPt + 14;

  const [hrCr, hrCg, hrCb] = hexToRgb(SERIES_COLORS.hr);
  doc.setDrawColor(hrCr, hrCg, hrCb);
  doc.setLineWidth(0.4);
  doc.line(BK.margin + 20, coverY, BK.width - BK.margin - 20, coverY);

  const [metaR, metaG, metaB] = hexToRgb(EXPORT_SPACING.colors.metaText);
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  doc.setFontSize(TYP.coverMetaFontPt);
  doc.setTextColor(metaR, metaG, metaB);
  let mY = coverY + 14;
  for (const ml of [coverData.teacherLine, coverData.churchLine,
                    coverData.dateRangeLine, coverData.lessonCountLine]
                    .filter((l): l is string => l !== null)) {
    doc.text(ml, BK.width / 2, mY, { align: 'center' });
    mY += TYP.coverMetaFontPt + 5;
  }

  // domain footer on cover
  doc.setFontSize(TYP.footerFontPt);
  doc.setTextColor(metaR, metaG, metaB);
  doc.text(SERIES_COVER_COPY.website, BK.width / 2, BK.height - BK.margin + 10, { align: 'center' });

  // -- TOC --------------------------------------------------------------------
  setStep('toc');
  addPageBk();
  frontMatterPages.push(currentPage);
  currentY = BK.margin;

  const tocEntries = buildTocEntries(series, lessons);
  renderSectionHeadingBk('Table of Contents');
  for (const entry of tocEntries) {
    ensureSpaceBk(TYP.bodyFontPt * 2 + 10);
    const [er, eg, eb] = hexToRgb(EXPORT_SPACING.colors.bodyText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(TYP.tocEntryFontPt);
    doc.setTextColor(er, eg, eb);
    const hLines = doc.splitTextToSize(entry.chapterHeading, BK.contentWidth) as string[];
    for (const hl of hLines) {
      doc.text(hl, leftX(), currentY);
      currentY += TYP.tocEntryFontPt + 3;
    }
    if (entry.passage) {
      const [pr2, pg2, pb2] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
      doc.setFontSize(TYP.passageFontPt);
      doc.setTextColor(pr2, pg2, pb2);
      doc.text('  ' + entry.passage, leftX(), currentY);
      currentY += TYP.passageFontPt + 3;
    }
    currentY += 4;
  }
  drawFooterBk();

  // -- Introduction -----------------------------------------------------------
  addPageBk();
  frontMatterPages.push(currentPage);
  currentY = BK.margin;
  renderSectionHeadingBk('Introduction');
  renderBodyBk(SERIES_INTRO_PLACEHOLDER);
  drawFooterBk();

  // -- Lesson Chapters --------------------------------------------------------
  setStep('lessons');
  for (let i = 0; i < lessons.length; i++) {
    const lesson    = lessons[i];
    const lessonNum = i + 1;
    const title     = extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNum);
    const passage   = lesson.filters?.passage ?? series.bible_passage ?? '';

    addPageBk();
    const startPage = currentPage;
    currentY = BK.margin;

    // Lesson label
    const [lr, lg, lb] = hexToRgb(EXPORT_SPACING.colors.metaText);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
    doc.setFontSize(TYP.lessonNumFontPt);
    doc.setTextColor(lr, lg, lb);
    doc.text('LESSON ' + lessonNum, leftX(), currentY);
    currentY += TYP.lessonNumFontPt + 3;

    // Lesson title
    const [ct_r, ct_g, ct_b] = hexToRgb(SERIES_COLORS.chapterHeading);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(TYP.lessonTitleFontPt);
    doc.setTextColor(ct_r, ct_g, ct_b);
    for (const ctl of doc.splitTextToSize(title, BK.contentWidth) as string[]) {
      doc.text(ctl, leftX(), currentY);
      currentY += TYP.lessonTitleFontPt + 3;
    }

    // Passage
    if (passage) {
      const [psr, psg, psb] = hexToRgb(EXPORT_SPACING.colors.metaText);
      doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
      doc.setFontSize(TYP.passageFontPt);
      doc.setTextColor(psr, psg, psb);
      doc.text(passage, leftX(), currentY);
      currentY += TYP.passageFontPt + 4;
    }

    _drawRuleBk();
    resetStyleBk();

    // Content
    const rawContent = lesson.shaped_content ?? lesson.original_text ?? '';
    const content    = options.omitSection8FromChapters
      ? stripSection8FromContent(rawContent)
      : rawContent;
    renderLessonContentBk(content);

    lessonRanges.push({ label: 'Lesson ' + lessonNum, startPage, endPage: currentPage });

    // Draw footer on all pages in this lesson
    const endPage = currentPage;
    for (let p = startPage; p <= endPage; p++) {
      doc.setPage(p);
      drawFooterBk();
    }
    doc.setPage(endPage);
  }

  // -- Group Handout Section --------------------------------------------------
  setStep('handouts');
  const bookletData = buildHandoutBookletData(series, lessons);

  // Handout divider page
  addPageBk();
  frontMatterPages.push(currentPage);
  const divY = BK.height / 2;
  const [dvR, dvG, dvB] = hexToRgb(SERIES_COLORS.hr);
  doc.setDrawColor(dvR, dvG, dvB);
  doc.setLineWidth(0.8);
  doc.line(BK.margin, divY - 36, BK.width - BK.margin, divY - 36);
  doc.setLineWidth(0.3);
  doc.line(BK.margin, divY - 31, BK.width - BK.margin, divY - 31);

  doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...hexToRgb(EXPORT_SPACING.colors.bodyText) as [number, number, number]);
  doc.text(terminology.assemblyLabel + ' Handout Section', BK.width / 2, divY - 8, { align: 'center' });

  doc.setFont(EXPORT_SPACING.fonts.pdf, 'italic');
  doc.setFontSize(9);
  doc.setTextColor(...hexToRgb(EXPORT_SPACING.colors.metaText) as [number, number, number]);
  doc.text('Reproducible handouts for each lesson', BK.width / 2, divY + 10, { align: 'center' });

  doc.setDrawColor(dvR, dvG, dvB);
  doc.setLineWidth(0.3);
  doc.line(BK.margin + 40, divY + 22, BK.width - BK.margin - 40, divY + 22);

  doc.setFontSize(7.5);
  doc.text('These pages may be freely reproduced for use within your group.',
           BK.width / 2, divY + 35, { align: 'center' });

  doc.setLineWidth(0.3);
  doc.line(BK.margin, divY + 50, BK.width - BK.margin, divY + 50);
  doc.setLineWidth(0.8);
  doc.line(BK.margin, divY + 55, BK.width - BK.margin, divY + 55);

  // Individual handouts -- each starts on a new page
  for (const entry of bookletData.entries) {
    addPageBk();
    currentY = BK.margin;

    // Handout label
    const [hlR, hlG, hlB] = hexToRgb(SERIES_COLORS.handoutHeader);
    doc.setFont(EXPORT_SPACING.fonts.pdf, 'bold');
    doc.setFontSize(TYP.handoutLabelFontPt);
    doc.setTextColor(hlR, hlG, hlB);
    doc.text(('LESSON ' + entry.lessonNumber + ' \u00B7 ' + terminology.assemblyLabel + ' HANDOUT').toUpperCase(),
             leftX(), currentY);
    currentY += TYP.handoutLabelFontPt + 3;

    // Handout title
    doc.setFontSize(TYP.handoutTitleFontPt);
    for (const htl of doc.splitTextToSize(entry.header.replace(/^Lesson \d+:\s*/, ''),
                                           BK.contentWidth) as string[]) {
      doc.text(htl, leftX(), currentY);
      currentY += TYP.handoutTitleFontPt + 3;
    }

    // Passage
    if (entry.passage) renderMetaBk(entry.passage);

    _drawRuleBk();
    resetStyleBk();

    // Full Section 8 content -- exactly as generated
    renderLessonContentBk(entry.content);

    // Footer on all handout pages
    const hoEnd = currentPage;
    const hoStart = currentPage; // single-pass; multi-page handled by renderLessonContentBk
    for (let p = hoStart; p <= hoEnd; p++) {
      doc.setPage(p);
      drawFooterBk();
    }
    doc.setPage(hoEnd);
  }

  // -- Back Cover (verso of last sheet) --------------------------------------
  addPageBk();
  const bcY = BK.height * 0.70;
  doc.setFont(EXPORT_SPACING.fonts.pdf, 'normal');
  doc.setFontSize(TYP.coverMetaFontPt);
  doc.setTextColor(...hexToRgb(EXPORT_SPACING.colors.metaText) as [number, number, number]);
  doc.text(SERIES_COVER_COPY.generatedBy, BK.width / 2, bcY, { align: 'center' });
  doc.text(SERIES_COVER_COPY.website, BK.width / 2, bcY + 14, { align: 'center' });
  doc.text('\u00A9 ' + new Date().getFullYear() + ' BibleLessonSpark. All rights reserved.',
           BK.width / 2, bcY + 28, { align: 'center' });

  return doc.output('arraybuffer');
}

// ----------------------------------------------------------------------------
// _imposeBooklet -- saddle-stitch 2-up imposition via pdf-lib
//
// Imposition order (0-indexed, n = padded page count, multiple of 4):
//   Sheet i front: left = pages[n-1-2i],  right = pages[2i]
//   Sheet i back:  left = pages[2i+1],    right = pages[n-2-2i]
//
// Output: landscape letter (11" x 8.5") sheets, one per side.
// Print double-sided, fold in half, staple at the spine.
// ----------------------------------------------------------------------------

async function _imposeBooklet(contentBuffer: ArrayBuffer): Promise<ArrayBuffer> {
  const srcDoc  = await PDFDocument.load(contentBuffer);
  const nContent = srcDoc.getPageCount();

  // Pad to next multiple of 4
  let n = nContent;
  while (n % 4 !== 0) n++;

  const outDoc = await PDFDocument.create();

  // Embed all source pages at once (most efficient)
  const embedded = await outDoc.embedPdf(srcDoc);

  const PAGE_W  = BOOKLET_PAGE.width;   // 396pt (5.5")
  const PAGE_H  = BOOKLET_PAGE.height;  // 612pt (8.5")
  const SHEET_W = BOOKLET_SHEET.width;  // 792pt (11")
  const SHEET_H = BOOKLET_SHEET.height; // 612pt (8.5")

  const nSheets = n / 4;

  for (let i = 0; i < nSheets; i++) {
    const pairs: [number, number][] = [
      [n - 1 - 2 * i, 2 * i],           // front: left, right
      [2 * i + 1,     n - 2 - 2 * i],   // back:  left, right
    ];

    for (const [leftIdx, rightIdx] of pairs) {
      const sheet = outDoc.addPage([SHEET_W, SHEET_H]);

      // Left slot (verso position)
      if (leftIdx < nContent) {
        sheet.drawPage(embedded[leftIdx], {
          x: 0,
          y: 0,
          width:  PAGE_W,
          height: PAGE_H,
        });
      }

      // Right slot (recto position)
      if (rightIdx < nContent) {
        sheet.drawPage(embedded[rightIdx], {
          x: PAGE_W,
          y: 0,
          width:  PAGE_W,
          height: PAGE_H,
        });
      }
    }
  }

  const bytes = await outDoc.save();
  return bytes.buffer as ArrayBuffer;
}
