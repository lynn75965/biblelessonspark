// ============================================================================
// buildTrifoldPdf.ts
// Location: src/utils/export/buildTrifoldPdf.ts
//
// Tri-Fold Group Handout PDF builder. One landscape letter sheet per lesson.
// Each sheet has three panels: back, inside-left, inside-right.
//
// Consumers:
//   - SeriesExportModal.tsx (via export pipeline)
//
// SSOT: All layout constants, color schemes, and font options imported from
// seriesExportConfig.ts. Section 8 extraction from buildHandoutBooklet.ts.
// ============================================================================

import jsPDF from 'jspdf';
import { loadPdfFonts } from './loadPdfFonts';
import {
  TRIFOLD_PAGE,
  getColorScheme,
  getFontOption,
  SERIES_EXPORT_PROGRESS_STEPS,
} from '@/constants/seriesExportConfig';
import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';
import type {
  SeriesExportOptions,
  SeriesExportProgressStepId,
} from '@/constants/seriesExportConfig';
import { extractSection8Content } from './buildHandoutBooklet';

// ============================================================================
// HELPERS
// ============================================================================

/** Replace non-ASCII characters with safe ASCII equivalents for PDF output. */
function sanitizeForPdf(text: string): string {
  return text
    .replace(/[\u2610\u2611\u2612\u2713\u2714\u2717\u2718]/g, '')
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u00B7\u00A1]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
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
    // eslint-disable-next-line no-control-regex -- \x00-\x7F is the ASCII range boundary, not a literal control-char match
    .replace(/[^\x00-\x7F]/g, '');
}

/** Convert a hex color string to an RGB tuple. */
function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// ============================================================================
// CONTENT RENDERER
// ============================================================================

/**
 * Render lines of handout content into a single trifold panel.
 * Returns the index of the next unrendered line (or lines.length if done).
 */
function renderTrifoldContent(
  doc: jsPDF,
  lines: string[],
  startLineIndex: number,
  x: number,
  startY: number,
  maxWidth: number,
  maxY: number,
  fontFamily: string,
  primaryRgb: [number, number, number],
  accentRgb: [number, number, number],
): number {
  const lineHeight = 13;
  let y = startY;
  let i = startLineIndex;

  while (i < lines.length) {
    const rawLine = lines[i];

    // -- Empty line: add small vertical spacing --
    if (rawLine.trim() === '') {
      y += 4;
      i++;
      if (y > maxY) return i;
      continue;
    }

    // -- Horizontal rule lines --
    if (/^---$|^\*\*\*$|^___$/.test(rawLine.trim())) {
      if (y + lineHeight > maxY) return i;
      doc.setDrawColor(accentRgb[0], accentRgb[1], accentRgb[2]);
      doc.setLineWidth(0.5);
      doc.line(x, y + 4, x + maxWidth, y + 4);
      y += lineHeight;
      i++;
      continue;
    }

    // -- Heading lines (## or #) --
    if (/^#{1,2}\s/.test(rawLine)) {
      const headingText = rawLine.replace(/^#{1,2}\s+/, '');
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(10);
      doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
      const wrapped = doc.splitTextToSize(sanitizeForPdf(headingText), maxWidth) as string[];
      const blockHeight = wrapped.length * lineHeight;
      if (y + blockHeight > maxY) return i;
      for (const wLine of wrapped) {
        doc.text(wLine, x, y + lineHeight);
        y += lineHeight;
      }
      i++;
      continue;
    }

    // -- Bold-only line (e.g. **Some Label**) --
    const boldOnlyMatch = rawLine.match(/^\*\*(.+?)\*\*\s*$/);
    if (boldOnlyMatch) {
      doc.setFont(fontFamily, 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      const wrapped = doc.splitTextToSize(sanitizeForPdf(boldOnlyMatch[1]), maxWidth) as string[];
      const blockHeight = wrapped.length * lineHeight;
      if (y + blockHeight > maxY) return i;
      for (const wLine of wrapped) {
        doc.text(wLine, x, y + lineHeight);
        y += lineHeight;
      }
      i++;
      continue;
    }

    // -- Lines with inline bold (**text**) --
    if (rawLine.includes('**')) {
      // Pre-calculate height by wrapping the full sanitized text
      doc.setFontSize(9);
      doc.setFont(fontFamily, 'normal');
      const fullText = sanitizeForPdf(rawLine.replace(/\*\*/g, ''));
      const wrapped = doc.splitTextToSize(fullText, maxWidth) as string[];
      const blockHeight = wrapped.length * lineHeight;
      if (y + blockHeight > maxY) return i;

      // Render each wrapped line with inline bold spans
      const segments = rawLine.split(/(\*\*.*?\*\*)/);
      let cursorX = x;
      let cursorY = y + lineHeight;
      doc.setTextColor(0, 0, 0);

      for (const seg of segments) {
        if (!seg) continue;
        const isBold = seg.startsWith('**') && seg.endsWith('**');
        const text = sanitizeForPdf(isBold ? seg.slice(2, -2) : seg);
        if (!text) continue;

        doc.setFont(fontFamily, isBold ? 'bold' : 'normal');
        doc.setFontSize(9);
        const segWidth = doc.getTextWidth(text);

        // If segment would overflow, wrap to next line
        if (cursorX + segWidth > x + maxWidth && cursorX > x) {
          cursorX = x;
          cursorY += lineHeight;
          if (cursorY > maxY + lineHeight) break;
        }

        doc.text(text, cursorX, cursorY);
        cursorX += segWidth;
      }

      y = cursorY - lineHeight + blockHeight;
      i++;
      continue;
    }

    // -- Regular text --
    doc.setFont(fontFamily, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    const wrapped = doc.splitTextToSize(sanitizeForPdf(rawLine), maxWidth) as string[];
    const blockHeight = wrapped.length * lineHeight;
    if (y + blockHeight > maxY) return i;
    for (const wLine of wrapped) {
      doc.text(wLine, x, y + lineHeight);
      y += lineHeight;
    }
    i++;
  }

  return i;
}

// ============================================================================
// MAIN EXPORT
// ============================================================================

export async function buildTrifoldPdf(
  series: LessonSeries,
  lessons: Lesson[],
  options: SeriesExportOptions,
  setStep: (stepId: SeriesExportProgressStepId) => void
): Promise<ArrayBuffer> {
  // -- Setup --
  setStep(SERIES_EXPORT_PROGRESS_STEPS.PREPARING);

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'letter',
  });

  const fontOpt = getFontOption(options.font);
  await loadPdfFonts(doc, fontOpt);

  const scheme = getColorScheme(options.colorSchemeId);
  const primaryRgb = hexToRgb(scheme.primary);
  const accentRgb = hexToRgb(scheme.accent);
  const hrRgb = hexToRgb(scheme.hr);

  const P = TRIFOLD_PAGE;
  const panelContentWidth = P.panelWidthPt - P.marginLeftPt - P.marginRightPt;
  const panelContentTop = P.marginTopPt;
  const panelContentBottom = P.sheetHeightPt - P.marginBottomPt;

  // -- Lesson loop --
  setStep(SERIES_EXPORT_PROGRESS_STEPS.LESSONS);

  for (let i = 0; i < lessons.length; i++) {
    if (i > 0) {
      doc.addPage('letter', 'landscape');
    }

    const lesson = lessons[i];
    const handout =
      extractSection8Content(lesson) ??
      'Group Handout content not available for this lesson.';
    const passage = lesson.filters?.passage || lesson.title || '';
    const lessonNumber = i + 1;

    // ----------------------------------------------------------------
    // PANEL 1 -- Back panel (x origin: 0)
    // ----------------------------------------------------------------

    // Vertical separator at right edge of Panel 1
    doc.setDrawColor(hrRgb[0], hrRgb[1], hrRgb[2]);
    doc.setLineWidth(0.5);
    doc.line(P.panelWidthPt, 0, P.panelWidthPt, P.sheetHeightPt);

    // Series name -- centered in panel
    doc.setFont(fontOpt.pdfFamily, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    const seriesNameLines = doc.splitTextToSize(
      sanitizeForPdf(series.series_name),
      panelContentWidth
    ) as string[];
    const seriesNameX = P.panelWidthPt / 2;
    let backY = panelContentTop + 60;
    for (const line of seriesNameLines) {
      doc.text(line, seriesNameX, backY, { align: 'center' });
      backY += 14;
    }

    // "Lesson N" -- centered
    doc.setFont(fontOpt.pdfFamily, 'normal');
    doc.setFontSize(9);
    doc.setTextColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.text('Lesson ' + lessonNumber, seriesNameX, backY + 20, { align: 'center' });

    // Passage -- centered, italic
    doc.setFont(fontOpt.pdfFamily, 'italic');
    doc.setFontSize(10);
    doc.setTextColor(primaryRgb[0], primaryRgb[1], primaryRgb[2]);
    const passageLines = doc.splitTextToSize(
      sanitizeForPdf(passage),
      panelContentWidth
    ) as string[];
    let passageY = backY + 35;
    for (const line of passageLines) {
      doc.text(line, seriesNameX, passageY, { align: 'center' });
      passageY += 13;
    }

    // Horizontal rule
    const hrY = backY + 50;
    doc.setDrawColor(accentRgb[0], accentRgb[1], accentRgb[2]);
    doc.setLineWidth(0.5);
    doc.line(P.marginLeftPt, hrY, P.panelWidthPt - P.marginRightPt, hrY);

    // Attribution footer
    doc.setFont(fontOpt.pdfFamily, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text(
      'biblelessonspark.com',
      seriesNameX,
      panelContentBottom - 20,
      { align: 'center' }
    );

    // ----------------------------------------------------------------
    // PANEL 2 -- Inside left (x origin: P.panelWidthPt)
    // ----------------------------------------------------------------

    // Vertical separator at right edge of Panel 2
    doc.setDrawColor(hrRgb[0], hrRgb[1], hrRgb[2]);
    doc.setLineWidth(0.5);
    doc.line(P.panelWidthPt * 2, 0, P.panelWidthPt * 2, P.sheetHeightPt);

    // Split handout into lines for rendering
    const contentLines = handout.split('\n');
    const panel2X = P.panelWidthPt + P.marginLeftPt;

    const nextLineIndex = renderTrifoldContent(
      doc,
      contentLines,
      0,
      panel2X,
      panelContentTop,
      panelContentWidth,
      panelContentBottom,
      fontOpt.pdfFamily,
      primaryRgb,
      accentRgb,
    );

    // ----------------------------------------------------------------
    // PANEL 3 -- Inside right (x origin: P.panelWidthPt * 2)
    // ----------------------------------------------------------------

    const panel3X = P.panelWidthPt * 2 + P.marginLeftPt;

    renderTrifoldContent(
      doc,
      contentLines,
      nextLineIndex,
      panel3X,
      panelContentTop,
      panelContentWidth,
      panelContentBottom,
      fontOpt.pdfFamily,
      primaryRgb,
      accentRgb,
    );
  }

  // -- Finalize --
  setStep(SERIES_EXPORT_PROGRESS_STEPS.FINALIZING);

  return doc.output('arraybuffer');
}
