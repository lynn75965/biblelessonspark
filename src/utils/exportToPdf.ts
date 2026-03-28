// src/utils/exportToPdf.ts
// Version: 3.0.0 - Font and color scheme picker support
// SSOT SOURCE: Spacing/formatting from lessonStructure.ts; fonts/colors from seriesExportConfig.ts
// Frontend drives backend - change SSOT = changes PDF output

import jsPDF from "jspdf";
import { EXPORT_FORMATTING, EXPORT_SPACING, isBoldLabel, isSkipLabel, getSection8StandaloneTitle } from "../constants/lessonStructure";
import type { AudienceProfile } from "../constants/audienceConfig";
import { GROUP_HANDOUT_HEADING_REGEX } from "../constants/lessonShapeProfiles";
import type { FontId, ColorSchemeId } from "../constants/seriesExportConfig";
import { getFontOption, getColorScheme, ECONOMICAL_PRINT } from "../constants/seriesExportConfig";
import { loadPdfFonts } from "./export/loadPdfFonts";

// ============================================================================
// SSOT IMPORTS - All spacing values from lessonStructure.ts
// ============================================================================
const {
  fonts,
  margins,
  sectionHeader,
  body,
  title,
  sectionHeaderFont,
  subheading,
  metadata,
  teaser,
  footer,
  paragraph,
  listItem,
  hr,
  colors,
} = EXPORT_SPACING;

// ============================================================================
// SSOT-DERIVED CONVERSIONS (computed from SSOT values, not hardcoded)
// ============================================================================

// Compact Curriculum Layout margins (asymmetric)
const MARGIN_TOP_MM    = (margins.pdfTopIn    ?? margins.inches) * 25.4;
const MARGIN_BOTTOM_MM = (margins.pdfBottomIn ?? margins.inches) * 25.4;
const MARGIN_LEFT_MM   = (margins.pdfLeftIn   ?? margins.inches) * 25.4;
const MARGIN_RIGHT_MM  = (margins.pdfRightIn  ?? margins.inches) * 25.4;
const FOOTER_FROM_BOTTOM_MM = (margins.pdfFooterIn ?? 0.40) * 25.4;
// Legacy alias for callers that still reference MARGIN_MM
const MARGIN_MM = MARGIN_LEFT_MM;

// Convert SSOT hex color (without #) to RGB array for jsPDF
const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
};

// Convert SSOT points to mm for jsPDF positioning
const ptToMm = (pt: number): number => pt / 2.83;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const sanitizeText = (text: string): string => {
  if (!text) return "";
  return text
    // Smart quotes and primes
    .replace(/[\u2018\u2019\u2032]/g, "'")
    .replace(/[\u201C\u201D\u2033]/g, '"')
    .replace(/[\u00AB\u00BB]/g, '"')
    // Dashes
    .replace(/[\u2013\u2012]/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/\u2026/g, "...")
    // Checkboxes
    .replace(/[\u2713\u2714\u2611]/g, "[x]")
    .replace(/[\u2717\u2718\u2610\u2612]/g, "[ ]")
    // Bullets and list markers
    .replace(/[\u2022\u2023\u25E6\u2043\u2219\u00B7\u00A1]/g, "-")
    .replace(/\u25CF/g, "-")
    .replace(/\u25CB/g, "o")
    // Arrows
    .replace(/[\u2192\u21D2]/g, "->")
    .replace(/[\u2190\u21D0]/g, "<-")
    .replace(/\u2191/g, "^")
    .replace(/\u2193/g, "v")
    // Math symbols
    .replace(/\u00D7/g, "x")
    .replace(/\u00F7/g, "/")
    .replace(/\u00B1/g, "+/-")
    .replace(/\u00BD/g, "1/2")
    .replace(/\u00BC/g, "1/4")
    .replace(/\u00BE/g, "3/4")
    // Whitespace normalization
    .replace(/\u00A0/g, " ")
    .replace(/[\u200B-\u200F\u202A-\u202E\uFEFF]/g, "")
    // Strip decorative symbols, emoji, and all non-ASCII
    // (jsPDF built-in fonts only render ASCII reliably)
    .replace(/[^\x00-\x7F]/g, "");
};

const extractLessonTitle = (content: string): string | null => {
  const lines = content.split("\n");
  for (const line of lines) {
    const match = line.match(/^(?:\*\*)?Lesson Title:?(?:\*\*)?\s*[""]?(.+?)[""]?\s*$/i);
    if (match) return match[1].replace(/[""\*]/g, "").trim();
  }
  return null;
};

/**
 * Detect Section header lines (Section 1: Title, etc.)
 */
const isSectionHeader = (line: string): { isSection: boolean; num: number; cleanTitle: string } => {
  let cleaned = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^#{1,6}\s*/, '').trim();
  const match = cleaned.match(/^Section\s+(\d+)\s*[:\----]?\s*(.*)$/i);

  if (match) {
    const num = parseInt(match[1], 10);
    const subtitle = match[2] ? match[2].trim() : '';
    return {
      isSection: true,
      num: num,
      cleanTitle: subtitle ? `Section ${num}: ${subtitle}` : `Section ${num}`
    };
  }

  return { isSection: false, num: 0, cleanTitle: '' };
};

/**
 * Detect Section 8 / Group Handout heading
 * Matches original format ("Section 8: Group Handout") and shaped variants
 */
const isSection8Line = (line: string): boolean => {
  let cleaned = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^#{1,6}\s*/, '').trim();
  if (/^Section\s+8/i.test(cleaned)) return true;
  if (GROUP_HANDOUT_HEADING_REGEX.test(cleaned)) return true;
  return false;
};

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

interface ExportToPdfOptions {
  title: string;
  content: string;
  metadata?: {
    passage?: string;
    ageGroup?: string;
    theology?: string;
    bibleVersion?: string;
    bibleVersionAbbreviation?: string;
    copyrightNotice?: string;
  };
  teaserContent?: string;
  audienceProfile?: AudienceProfile;
  /** Font selection from seriesExportConfig SSOT (default: pagella) */
  fontId?: FontId;
  /** Color scheme from seriesExportConfig SSOT (default: forest_gold) */
  colorSchemeId?: ColorSchemeId;
  /** Economical print: smaller body font (10pt) and tighter line spacing */
  economicalPrint?: boolean;
}

export const exportToPdf = async ({
  title: inputTitle,
  content,
  metadata: meta,
  teaserContent,
  audienceProfile,
  fontId,
  colorSchemeId,
  economicalPrint,
}: ExportToPdfOptions): Promise<void> => {

  // Resolve font and color scheme from SSOT (defaults: Pagella + Forest & Gold)
  const fontOpt = getFontOption(fontId ?? null);
  const scheme  = getColorScheme(colorSchemeId ?? null);
  const pdfFont = fontOpt.pdfFamily;

  // Economical print: override body font size, line height, and margins from SSOT
  const bodyFontPt = economicalPrint ? ECONOMICAL_PRINT.fontPt : body.fontPt;
  const bodyLineH  = economicalPrint ? ECONOMICAL_PRINT.lineHeight : body.lineHeight;

  // Margins: economical uses SSOT points->mm; standard uses lessonStructure values
  const mTopMm    = economicalPrint ? ptToMm(ECONOMICAL_PRINT.margins.top)    : MARGIN_TOP_MM;
  const mBottomMm = economicalPrint ? ptToMm(ECONOMICAL_PRINT.margins.bottom) : MARGIN_BOTTOM_MM;
  const mLeftMm   = economicalPrint ? ptToMm(ECONOMICAL_PRINT.margins.left)   : MARGIN_LEFT_MM;
  const mRightMm  = economicalPrint ? ptToMm(ECONOMICAL_PRINT.margins.right)  : MARGIN_RIGHT_MM;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  // Load and register custom TTF fonts (no-op for jsPDF built-ins such as times)
  await loadPdfFonts(doc, fontOpt);

  // PDF color palette -- body/meta/footer from EXPORT_SPACING; headings/accents from scheme
  // Teaser background: light tint derived from scheme accent (10% opacity over white)
  const accentRgb = hexToRgb(scheme.accent);
  const teaserBgHex = [
    Math.round(255 + (accentRgb[0] - 255) * 0.08),
    Math.round(255 + (accentRgb[1] - 255) * 0.08),
    Math.round(255 + (accentRgb[2] - 255) * 0.08),
  ] as [number, number, number];

  const PDF_COLORS = {
    teaserBg:      teaserBgHex,
    teaserBorder:  hexToRgb(scheme.accent),
    teaserText:    hexToRgb(scheme.accent),
    bodyText:      hexToRgb(colors.bodyText),
    metaText:      hexToRgb(colors.metaText),
    footerText:    hexToRgb(colors.footerText),
    hrLine:        hexToRgb(scheme.hr),
    sectionHeader: hexToRgb(scheme.primary),
  };

  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - mLeftMm - mRightMm;

  // Footer reservation: footer sits at pdfFooterIn from bottom edge
  const footerY = pageHeight - FOOTER_FROM_BOTTOM_MM;
  // Content must stop above footer with a small gap
  const contentBottomY = footerY - ptToMm(footer.fontPt) - 2;

  // Character tracking: -0.5% at body size (micro-typography)
  doc.setCharSpace(bodyFontPt * -0.005);

  let yPosition = mTopMm;

  // Font setter: always resets PDF text rendering mode to fill-only (0 Tr).
  // This prevents strikethrough artifacts and yellow highlight bleeding from
  // stale fill-then-stroke state. Bold weight comes from the TTF bold variant
  // registered by loadPdfFonts -- no synthetic stroke needed.
  const setPdfFont = (style: 'bold' | 'normal' | 'italic'): void => {
    doc.setFont(pdfFont, style);
    (doc as any).internal.write('0 Tr'); // fill only -- never stroke text
  };

  const lessonTitle   = extractLessonTitle(content);
  const documentTitle = lessonTitle || inputTitle;

  // ---- Helper: Add text with widow/orphan protection ----
  // Spec: min 2 lines at bottom of page, min 2 lines at top of next page
  const addText = (
    text: string,
    fontSize: number,
    isBold: boolean = false,
    textColor?: [number, number, number]
  ): void => {
    const sanitizedText = sanitizeText(text);
    if (!sanitizedText) return;

    // --- Standard rendering ---
    doc.setFontSize(fontSize);
    if (isBold) {
      setPdfFont("bold");
    } else {
      setPdfFont("normal");
    }
    doc.setTextColor(...(textColor ?? PDF_COLORS.bodyText));
    const lines = doc.splitTextToSize(sanitizedText, contentWidth);
    if (lines.length === 0) return;
    const lineH = ptToMm(fontSize * bodyLineH);
    const spaceLeft = contentBottomY - yPosition;
    const linesFit = Math.max(0, Math.floor(spaceLeft / lineH));

    if (linesFit >= lines.length) {
      for (const ln of lines) { doc.text(ln, mLeftMm, yPosition); yPosition += lineH; }
      return;
    }
    if (linesFit < 2) {
      doc.addPage(); yPosition = mTopMm;
      for (const ln of lines) { doc.text(ln, mLeftMm, yPosition); yPosition += lineH; }
      return;
    }
    let linesOnThisPage = linesFit;
    const linesOnNextPage = lines.length - linesOnThisPage;
    if (linesOnNextPage < 2) {
      linesOnThisPage = lines.length - 2;
    }
    const firstPart = lines.slice(0, linesOnThisPage);
    for (const ln of firstPart) { doc.text(ln, mLeftMm, yPosition); yPosition += lineH; }
    doc.addPage(); yPosition = mTopMm;
    const secondPart = lines.slice(linesOnThisPage);
    for (const ln of secondPart) { doc.text(ln, mLeftMm, yPosition); yPosition += lineH; }
  };

  // ---- Helper: Add labeled text (bold label, normal value) ----
  // Bold mechanism: identical to section headings (doc.setFont + doc.text)
  // plus double-draw at 0.15mm offset for guaranteed visible bold weight.
  const addLabeledText = (label: string, value: string, fontSize: number = bodyFontPt): void => {
    const sanitizedLabel = sanitizeText(label);
    const sanitizedValue = sanitizeText(value);
    const lineH = ptToMm(fontSize * bodyLineH);

    // --- Bold label ---
    doc.setFontSize(fontSize);
    setPdfFont("bold");
    doc.setTextColor(...PDF_COLORS.bodyText);
    const labelWidth     = doc.getTextWidth(sanitizedLabel + " ");
    const remainingWidth = contentWidth - labelWidth;
    if (yPosition + lineH > contentBottomY) {
      doc.addPage();
      yPosition = mTopMm;
    }
    doc.text(sanitizedLabel, mLeftMm, yPosition);

    // --- Normal value: switch to normal, draw after label ---
    setPdfFont("normal");
    const valueLines = doc.splitTextToSize(sanitizedValue, remainingWidth);
    if (valueLines.length >= 1 && valueLines[0]) {
      doc.text(valueLines[0], mLeftMm + labelWidth, yPosition);
    }
    yPosition += lineH;
    for (let vi = 1; vi < valueLines.length; vi++) {
      if (yPosition + lineH > contentBottomY) {
        doc.addPage();
        yPosition = mTopMm;
      }
      doc.text(valueLines[vi], mLeftMm, yPosition);
      yPosition += lineH;
    }
  };

  // ---- Helper: Render body paragraph with inline bold spans ----
  // Splits text on **bold** markers and renders each span in the correct weight.
  // Mixed lines like "**Label:** normal text" render Label: bold and text normal.
  //
  // Strategy: break text into word-level chunks each tagged bold/normal, then
  // draw word-by-word, wrapping to next line when x exceeds contentWidth.
  // This avoids the fragile splitTextToSize character-offset approach.
  const addBodyParagraph = (text: string): void => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // If no bold markers, use the simple addText path
    if (!trimmed.includes('**')) {
      const cleaned = sanitizeText(trimmed);
      if (!cleaned) return;
      addText(cleaned, bodyFontPt, false);
      return;
    }

    // Split on ** markers: odd-indexed segments are bold, even are normal
    const segments = trimmed.split(/\*\*/).map((s, idx) => ({
      text: sanitizeText(s),
      bold: idx % 2 === 1,
    })).filter(s => s.text.length > 0);

    if (segments.length === 0) return;

    const fontSize = bodyFontPt;
    const lineH = ptToMm(fontSize * bodyLineH);
    doc.setFontSize(fontSize);

    // Page break if needed
    if (yPosition + lineH > contentBottomY) {
      doc.addPage();
      yPosition = mTopMm;
    }

    // Break each segment into words, preserving bold flag
    const words: { word: string; bold: boolean }[] = [];
    for (const seg of segments) {
      const segWords = seg.text.split(/(\s+)/);
      for (const w of segWords) {
        if (w.length > 0) words.push({ word: w, bold: seg.bold });
      }
    }

    // Render word-by-word with line wrapping
    let xPos = mLeftMm;
    const rightEdge = mLeftMm + contentWidth;
    for (const chunk of words) {
      setPdfFont(chunk.bold ? "bold" : "normal");
      doc.setFontSize(fontSize);
      const wWidth = doc.getTextWidth(chunk.word);

      // If this word would exceed the line, wrap
      if (xPos > mLeftMm && xPos + wWidth > rightEdge) {
        yPosition += lineH;
        xPos = mLeftMm;
        if (yPosition + lineH > contentBottomY) {
          doc.addPage();
          yPosition = mTopMm;
        }
        // Skip leading whitespace at start of new line
        if (chunk.word.trim().length === 0) continue;
      }

      doc.setTextColor(...PDF_COLORS.bodyText);
      doc.text(chunk.word, xPos, yPosition);
      xPos += wWidth;
    }

    // Advance past the last line
    yPosition += lineH;
    setPdfFont("normal");
  };

  // ---- Helper: Add horizontal rule with scheme hr color ----
  // Spec: 0.5pt thick, 6pt above, 4pt below
  const addLine = (): void => {
    yPosition += ptToMm(hr.beforePt);
    if (yPosition + 2 > contentBottomY) {
      doc.addPage();
      yPosition = mTopMm;
    }
    doc.setDrawColor(...PDF_COLORS.hrLine);
    doc.setLineWidth(ptToMm(hr.thickness));
    doc.line(mLeftMm, yPosition, pageWidth - mRightMm, yPosition);
    yPosition += ptToMm(hr.afterPt);
  };

  // ---- Helper: Add spacing from SSOT points ----
  const addSpacing = (points: number): void => {
    yPosition += ptToMm(points);
  };

  // ---- Helper: Add teaser box ----
  const addTeaserBox = (): void => {
    if (!teaserContent || !teaserContent.trim()) return;

    const teaserText  = sanitizeText(teaserContent);
    doc.setFontSize(teaser.fontPt);
    const teaserLines  = doc.splitTextToSize(teaserText, contentWidth - 10);
    const teaserHeight = ptToMm(teaser.fontPt * bodyLineH * teaserLines.length) + 10;

    if (yPosition + teaserHeight > contentBottomY) {
      doc.addPage();
      yPosition = mTopMm;
    }

    // Teaser box -- scheme accent for border/text, SSOT teaserBg fill
    doc.setFillColor(...PDF_COLORS.teaserBg);
    doc.setDrawColor(...PDF_COLORS.teaserBorder);
    doc.roundedRect(mLeftMm, yPosition - 2, contentWidth, teaserHeight, 2, 2, "FD");
    yPosition += 3;

    // Teaser label
    doc.setFontSize(9);
    setPdfFont("bold");
    doc.setTextColor(...PDF_COLORS.teaserText);
    doc.text(EXPORT_FORMATTING.teaserLabel, mLeftMm + 5, yPosition);
    yPosition += 4;

    // Teaser content
    doc.setFontSize(teaser.fontPt);
    setPdfFont("italic");
    doc.setTextColor(...PDF_COLORS.teaserText);
    doc.text(teaserLines, mLeftMm + 5, yPosition);
    yPosition += ptToMm(teaser.fontPt * bodyLineH * teaserLines.length) + 4;

    doc.setTextColor(...PDF_COLORS.bodyText);
    setPdfFont("normal");
    addLine();
    addSpacing(paragraph.afterPt);
  };

  // ---- Helper: Process content lines ----
  const processContentLines = (lines: string[], skipSection8Header: boolean = false): void => {
    let i = 0;
    while (i < lines.length) {
      const line        = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine) {
        addSpacing(paragraph.afterPt);
        i++;
        continue;
      }

      // Skip bare heading markers (shaped content uses these as section separators)
      if (/^#{1,3}$/.test(trimmedLine)) {
        i++;
        continue;
      }

      if (trimmedLine === "---" || trimmedLine === "***" || trimmedLine === "___") {
        addLine();
        i++;
        continue;
      }

      // Skip "Lesson Title:" lines
      if (/^(?:\*\*)?Lesson\s+Title/i.test(trimmedLine)) {
        i++;
        continue;
      }

      // Section N headers -- 13pt bold, scheme primary, 10pt before, 4pt after
      // Keep-with-next: heading must fit with at least 3 following paragraphs (2 body lines min)
      const sectionInfo = isSectionHeader(trimmedLine);
      if (sectionInfo.isSection) {
        if (skipSection8Header && sectionInfo.num === 8) {
          i++;
          continue;
        }
        const headingKeep = ptToMm(sectionHeader.beforePt + sectionHeaderFont.fontPt * bodyLineH + sectionHeader.afterPt + bodyFontPt * bodyLineH * 3);
        if (yPosition + headingKeep > contentBottomY) {
          doc.addPage();
          yPosition = mTopMm;
        }
        addSpacing(sectionHeader.beforePt);
        addText(sectionInfo.cleanTitle, sectionHeaderFont.fontPt, true, PDF_COLORS.sectionHeader);
        addSpacing(sectionHeader.afterPt);
        i++;
        continue;
      }

      // Markdown ## headers -- section heading level
      if (trimmedLine.startsWith("## ")) {
        const headingKeep = ptToMm(sectionHeader.beforePt + sectionHeaderFont.fontPt * bodyLineH + sectionHeader.afterPt + bodyFontPt * bodyLineH * 3);
        if (yPosition + headingKeep > contentBottomY) {
          doc.addPage();
          yPosition = mTopMm;
        }
        addSpacing(sectionHeader.beforePt);
        addText(trimmedLine.replace("## ", "").replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1'), sectionHeaderFont.fontPt, true, PDF_COLORS.sectionHeader);
        addSpacing(sectionHeader.afterPt);
        i++;
        continue;
      }

      // Markdown ### headers -- subheading level (12pt bold, 6pt before, 2pt after)
      // Must stay attached to next paragraph (at least 2 body lines)
      if (trimmedLine.startsWith("### ")) {
        const subKeep = ptToMm(subheading.beforePt + subheading.fontPt * bodyLineH + subheading.afterPt + bodyFontPt * bodyLineH * 2);
        if (yPosition + subKeep > contentBottomY) {
          doc.addPage();
          yPosition = mTopMm;
        }
        addSpacing(subheading.beforePt);
        addText(trimmedLine.replace("### ", "").replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1'), subheading.fontPt, true);
        addSpacing(subheading.afterPt);
        i++;
        continue;
      }

      // Markdown # headers -- title level
      if (trimmedLine.startsWith("# ")) {
        const headingKeep = ptToMm(sectionHeader.beforePt + title.fontPt * bodyLineH + sectionHeader.afterPt + bodyFontPt * bodyLineH * 3);
        if (yPosition + headingKeep > contentBottomY) {
          doc.addPage();
          yPosition = mTopMm;
        }
        addSpacing(sectionHeader.beforePt);
        addText(trimmedLine.replace("# ", "").replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1'), title.fontPt, true);
        addSpacing(sectionHeader.afterPt);
        i++;
        continue;
      }

      // Bullet points -- with list protection
      // Spec: bullet indent 0.18", text indent 0.35", 2pt after, no break after first bullet
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ") || trimmedLine.startsWith("* ")) {
        // Look ahead to count consecutive bullets for protection
        let bulletCount = 0;
        for (let j = i; j < lines.length; j++) {
          const t = lines[j].trim();
          if (t.startsWith("- ") || t.startsWith("* ")) bulletCount++;
          else break;
        }
        // If this is the first bullet and we can't fit at least 2, move to next page
        const bulletLineH = ptToMm(bodyFontPt * bodyLineH);
        if (bulletCount >= 2) {
          const twoBulletH = bulletLineH * 2 + ptToMm(listItem.afterPt);
          if (yPosition + twoBulletH > contentBottomY) {
            doc.addPage();
            yPosition = mTopMm;
          }
        }

        const bulletText = trimmedLine.replace(/^[-**]\s*/, '');
        const boldMatch  = bulletText.match(/^\*\*(.+?):\*\*\s*(.*)$/);
        const bulletIndentMm = ptToMm(listItem.indentPt);
        const textIndentMm = ptToMm(listItem.textIndentPt);
        if (boldMatch) {
          addLabeledText("- " + boldMatch[1] + ":", boldMatch[2], bodyFontPt);
        } else {
          doc.setFontSize(bodyFontPt);
          setPdfFont("normal");
          doc.setTextColor(...PDF_COLORS.bodyText);
          // Draw bullet glyph at indent, text at text indent
          const bulletTextWidth = contentWidth - textIndentMm;
          const bulletLines = doc.splitTextToSize(sanitizeText(bulletText.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*]+)\*/g, '$1')), bulletTextWidth);
          if (yPosition + bulletLineH > contentBottomY) {
            doc.addPage();
            yPosition = mTopMm;
          }
          doc.text("-", mLeftMm + bulletIndentMm, yPosition);
          for (let bi = 0; bi < bulletLines.length; bi++) {
            if (bi > 0 && yPosition + bulletLineH > contentBottomY) {
              doc.addPage();
              yPosition = mTopMm;
            }
            doc.text(bulletLines[bi], mLeftMm + textIndentMm, yPosition);
            yPosition += bulletLineH;
          }
        }
        addSpacing(listItem.afterPt);
        i++;
        continue;
      }

      // Numbered lists
      if (/^\d+[.)]\s/.test(trimmedLine)) {
        addText(trimmedLine, bodyFontPt, false);
        addSpacing(listItem.afterPt);
        i++;
        continue;
      }

      // Skip labels (e.g. "Lesson Title:")
      const skipMatch = trimmedLine.match(/^(?:\*\*)?([^:]+):(?:\*\*)?\s*(.*)$/);
      if (skipMatch && isSkipLabel(skipMatch[1].trim())) {
        i++;
        continue;
      }

      // Body paragraph -- addBodyParagraph handles inline bold label detection
      // (renders "Label:" portion bold, remainder normal weight)
      // Also includes keep-with-next protection for labeled paragraphs
      addBodyParagraph(trimmedLine);
      addSpacing(paragraph.afterPt);
      i++;
    }
  };

  // ============================================================================
  // BUILD DOCUMENT
  // ============================================================================

  // 1. DOCUMENT TITLE
  doc.setFontSize(title.fontPt);
  setPdfFont("bold");
  doc.setTextColor(...PDF_COLORS.bodyText);
  const titleLines = doc.splitTextToSize(sanitizeText(documentTitle), contentWidth);
  doc.text(titleLines, mLeftMm, yPosition);
  yPosition += ptToMm(title.fontPt * bodyLineH * titleLines.length);
  addSpacing(title.afterPt);

  // 2. METADATA LINE
  if (meta) {
    doc.setFontSize(metadata.fontPt);
    setPdfFont("normal");
    doc.setTextColor(...PDF_COLORS.metaText);
    const metadataParts: string[] = [];
    if (meta.ageGroup)  metadataParts.push(sanitizeText(meta.ageGroup));
    if (meta.theology)  metadataParts.push(sanitizeText(meta.theology));
    if (metadataParts.length > 0) {
      doc.text(metadataParts.join("  |  "), mLeftMm, yPosition);
      addSpacing(metadata.afterPt);
    }
    doc.setTextColor(...PDF_COLORS.bodyText);
  }

  addLine();
  addSpacing(paragraph.afterPt);

  // 3. STUDENT TEASER BOX (at top)
  addTeaserBox();

  // 4. SPLIT CONTENT AT SECTION 8
  const allLines     = content.split("\n");
  const mainLines:     string[] = [];
  const section8Lines: string[] = [];
  let foundSection8  = false;

  for (const line of allLines) {
    if (isSection8Line(line)) {
      foundSection8 = true;
      section8Lines.push(line);
    } else if (foundSection8) {
      section8Lines.push(line);
    } else {
      mainLines.push(line);
    }
  }

  // 5. PROCESS MAIN CONTENT (Sections 1-7)
  processContentLines(mainLines);

  // 6. COPYRIGHT NOTICE (end of main content, before Section 8)
  let copyrightText = '';
  if (meta?.copyrightNotice) {
    copyrightText = sanitizeText(meta.copyrightNotice);
  } else if (meta?.bibleVersion) {
    copyrightText = `Scripture quotations are from the ${sanitizeText(meta.bibleVersion)}${meta.bibleVersionAbbreviation ? ` (${sanitizeText(meta.bibleVersionAbbreviation)})` : ''}.`;
  }

  if (copyrightText) {
    addSpacing(footer.marginTopPt);
    addLine();
    doc.setFontSize(footer.fontPt);
    setPdfFont("italic");
    doc.setTextColor(...PDF_COLORS.footerText);
    const copyrightLines = doc.splitTextToSize(copyrightText, contentWidth);
    const copyrightWidth = doc.getTextWidth(copyrightLines[0]);
    doc.text(copyrightLines, (pageWidth - copyrightWidth) / 2, yPosition + 3);
    yPosition += ptToMm(footer.fontPt * bodyLineH * copyrightLines.length) + 3;
    doc.setTextColor(...PDF_COLORS.bodyText);
    setPdfFont("normal");
  }

  // 7. SECTION 8 STANDALONE (new page, no pagination)
  let section8StartPage = -1;
  if (section8Lines.length > 0) {
    doc.addPage();
    yPosition         = mTopMm;
    section8StartPage = doc.getNumberOfPages();

    // Standalone title -- scheme primary color
    doc.setFontSize(sectionHeaderFont.fontPt);
    setPdfFont("bold");
    doc.setTextColor(...PDF_COLORS.sectionHeader);
    doc.text(getSection8StandaloneTitle(audienceProfile?.participant), mLeftMm, yPosition);
    yPosition += ptToMm(sectionHeaderFont.fontPt * bodyLineH);
    addSpacing(sectionHeader.afterPt);

    // Teaser box on Section 8 page
    addTeaserBox();

    // Process Section 8 content (skip the header line since we added it)
    processContentLines(section8Lines, true);
  }

  // 8. ADD SINGLE-LINE FOOTER TO MAIN PAGES ONLY (skip Group Handout pages)
  // Format: Lesson Title | Page X  (centered, 9pt, at footerY)
  const totalPages    = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    if (section8StartPage > 0 && p >= section8StartPage) continue;

    doc.setPage(p);
    doc.setFontSize(footer.fontPt);
    setPdfFont("normal");
    doc.setTextColor(...PDF_COLORS.footerText);

    const footerText  = `${sanitizeText(documentTitle)} | Page ${p}`;
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, footerY);
  }

  // 9. SAVE FILE
  const sanitizedTitle = sanitizeText(documentTitle).replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 50);
  const filename = `${sanitizedTitle}_Lesson.pdf`;
  doc.save(filename);

};
