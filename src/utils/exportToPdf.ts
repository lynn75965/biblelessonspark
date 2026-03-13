// src/utils/exportToPdf.ts
// Version: 3.0.0 - Font and color scheme picker support
// SSOT SOURCE: Spacing/formatting from lessonStructure.ts; fonts/colors from seriesExportConfig.ts
// Frontend drives backend - change SSOT = changes PDF output

import jsPDF from "jspdf";
import { EXPORT_FORMATTING, EXPORT_SPACING, isBoldLabel, isSkipLabel, getSection8StandaloneTitle } from "../constants/lessonStructure";
import type { AudienceProfile } from "../constants/audienceConfig";
import { STUDENT_HANDOUT_HEADING_REGEX } from "../constants/lessonShapeProfiles";
import type { FontId, ColorSchemeId } from "../constants/seriesExportConfig";
import { getFontOption, getColorScheme } from "../constants/seriesExportConfig";
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
 * Detect Section 8 / Student Handout heading
 * Matches original format ("Section 8: Student Handout") and shaped variants
 */
const isSection8Line = (line: string): boolean => {
  let cleaned = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^#{1,6}\s*/, '').trim();
  if (/^Section\s+8/i.test(cleaned)) return true;
  if (STUDENT_HANDOUT_HEADING_REGEX.test(cleaned)) return true;
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
}

export const exportToPdf = async ({
  title: inputTitle,
  content,
  metadata: meta,
  teaserContent,
  audienceProfile,
  fontId,
  colorSchemeId,
}: ExportToPdfOptions): Promise<void> => {

  // Resolve font and color scheme from SSOT (defaults: Pagella + Forest & Gold)
  const fontOpt = getFontOption(fontId ?? null);
  const scheme  = getColorScheme(colorSchemeId ?? null);
  const pdfFont = fontOpt.pdfFamily;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  // Load and register custom TTF fonts (no-op for jsPDF built-ins such as times)
  await loadPdfFonts(doc, fontOpt);

  // PDF color palette -- body/meta/footer from EXPORT_SPACING; headings/accents from scheme
  const PDF_COLORS = {
    teaserBg:      hexToRgb(colors.teaserBg),
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
  const contentWidth = pageWidth - MARGIN_LEFT_MM - MARGIN_RIGHT_MM;

  // Footer reservation: footer sits at pdfFooterIn from bottom edge
  const footerY = pageHeight - FOOTER_FROM_BOTTOM_MM;
  // Content must stop above footer with a small gap
  const contentBottomY = footerY - ptToMm(footer.fontPt) - 2;

  // Character tracking: -0.5% at body size (micro-typography)
  doc.setCharSpace(body.fontPt * -0.005);

  let yPosition = MARGIN_TOP_MM;

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

    // -------------------------------------------------------------------
    // Inline label bold: for body text (not headings), split on the first
    // colon. If the portion before the colon is 4 words or fewer and starts
    // with a capital letter, render that portion + colon in bold, remainder
    // in normal weight. This runs at the lowest rendering level so no
    // label can bypass it regardless of which code path called addText.
    // -------------------------------------------------------------------
    if (!isBold) {
      const colonIdx = sanitizedText.indexOf(':');
      if (colonIdx > 0) {
        const beforeColon = sanitizedText.substring(0, colonIdx).trim();
        const wordCount = beforeColon.split(/\s+/).length;
        if (wordCount <= 4 && /^[A-Z]/.test(beforeColon)) {
          const labelStr  = beforeColon + ':';
          const valueStr  = sanitizedText.substring(colonIdx + 1).trimStart();
          doc.setFontSize(fontSize);
          doc.setTextColor(...(textColor ?? PDF_COLORS.bodyText));
          // Measure label width in bold
          doc.setFont(pdfFont, "bold");
          const labelW = doc.getTextWidth(labelStr + ' ');
          const valueWidth = contentWidth - labelW;
          const lineH = ptToMm(fontSize * body.lineHeight);
          // Keep-with-next: label + 2 body lines must fit
          if (yPosition + lineH * 3 > contentBottomY) {
            doc.addPage(); yPosition = MARGIN_TOP_MM;
          }
          // Draw bold label
          doc.text(labelStr, MARGIN_LEFT_MM, yPosition);
          // Switch to normal and draw value
          doc.setFont(pdfFont, "normal");
          const valueLines = doc.splitTextToSize(valueStr, valueWidth);
          if (valueLines.length > 0 && valueLines[0]) {
            doc.text(valueLines[0], MARGIN_LEFT_MM + labelW, yPosition);
          }
          yPosition += lineH;
          // Remaining value lines at full width
          if (valueLines.length > 1) {
            const fullLines = doc.splitTextToSize(
              valueLines.slice(1).join(' '), contentWidth
            );
            for (const ln of fullLines) {
              if (yPosition + lineH > contentBottomY) {
                doc.addPage(); yPosition = MARGIN_TOP_MM;
              }
              doc.text(ln, MARGIN_LEFT_MM, yPosition);
              yPosition += lineH;
            }
          }
          return;
        }
      }
    }

    // --- Standard rendering (no inline label) ---
    doc.setFontSize(fontSize);
    doc.setFont(pdfFont, isBold ? "bold" : "normal");
    doc.setTextColor(...(textColor ?? PDF_COLORS.bodyText));
    const lines = doc.splitTextToSize(sanitizedText, contentWidth);
    if (lines.length === 0) return;
    const lineH = ptToMm(fontSize * body.lineHeight);
    const spaceLeft = contentBottomY - yPosition;
    const linesFit = Math.max(0, Math.floor(spaceLeft / lineH));

    if (linesFit >= lines.length) {
      for (const ln of lines) { doc.text(ln, MARGIN_LEFT_MM, yPosition); yPosition += lineH; }
      return;
    }
    if (linesFit < 2) {
      doc.addPage(); yPosition = MARGIN_TOP_MM;
      for (const ln of lines) { doc.text(ln, MARGIN_LEFT_MM, yPosition); yPosition += lineH; }
      return;
    }
    let linesOnThisPage = linesFit;
    const linesOnNextPage = lines.length - linesOnThisPage;
    if (linesOnNextPage < 2) {
      linesOnThisPage = lines.length - 2;
    }
    const firstPart = lines.slice(0, linesOnThisPage);
    for (const ln of firstPart) { doc.text(ln, MARGIN_LEFT_MM, yPosition); yPosition += lineH; }
    doc.addPage(); yPosition = MARGIN_TOP_MM;
    const secondPart = lines.slice(linesOnThisPage);
    for (const ln of secondPart) { doc.text(ln, MARGIN_LEFT_MM, yPosition); yPosition += lineH; }
  };

  // ---- Helper: Add labeled text (bold label, normal value) ----
  const addLabeledText = (label: string, value: string, fontSize: number = body.fontPt): void => {
    const sanitizedLabel = sanitizeText(label);
    const sanitizedValue = sanitizeText(value);
    doc.setFontSize(fontSize);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(...PDF_COLORS.bodyText);
    const labelWidth     = doc.getTextWidth(sanitizedLabel + " ");
    const remainingWidth = contentWidth - labelWidth;
    const lineH = ptToMm(fontSize * body.lineHeight);
    if (yPosition + lineH > contentBottomY) {
      doc.addPage();
      yPosition = MARGIN_TOP_MM;
    }
    doc.text(sanitizedLabel, MARGIN_LEFT_MM, yPosition);
    doc.setFont(pdfFont, "normal");
    const valueLines = doc.splitTextToSize(sanitizedValue, remainingWidth);
    if (valueLines.length === 1) {
      doc.text(valueLines[0], MARGIN_LEFT_MM + labelWidth, yPosition);
      yPosition += lineH;
    } else {
      doc.text(valueLines[0], MARGIN_LEFT_MM + labelWidth, yPosition);
      yPosition += lineH;
      for (let i = 1; i < valueLines.length; i++) {
        if (yPosition + lineH > contentBottomY) {
          doc.addPage();
          yPosition = MARGIN_TOP_MM;
        }
        doc.text(valueLines[i], MARGIN_LEFT_MM, yPosition);
        yPosition += lineH;
      }
    }
  };

  // ---- Helper: Render body paragraph with inline bold label detection ----
  // If text starts with "Label:" (short, capitalized), renders label bold, rest normal.
  // Otherwise renders entire text in normal weight.
  const addBodyParagraph = (text: string): void => {
    const cleaned = text.replace(/\*\*/g, "").trim();
    if (!cleaned) return;

    // Detect inline label: "Label:" at start, label < 60 chars, starts with capital
    const inlineMatch = cleaned.match(/^([A-Z][^:]{0,58}):\s*(.*)$/);
    if (inlineMatch) {
      const labelPart = inlineMatch[1].trim();
      const valuePart = inlineMatch[2].trim();
      // Keep-with-next: label + 2 body lines must fit
      const keepH = ptToMm(body.fontPt * body.lineHeight * 3);
      if (yPosition + keepH > contentBottomY) {
        doc.addPage();
        yPosition = MARGIN_TOP_MM;
      }
      addLabeledText(labelPart + ":", valuePart, body.fontPt);
      return;
    }

    // No label detected -- render as plain body text
    addText(cleaned, body.fontPt, false);
  };

  // ---- Helper: Add horizontal rule with scheme hr color ----
  // Spec: 0.5pt thick, 6pt above, 4pt below
  const addLine = (): void => {
    yPosition += ptToMm(hr.beforePt);
    if (yPosition + 2 > contentBottomY) {
      doc.addPage();
      yPosition = MARGIN_TOP_MM;
    }
    doc.setDrawColor(...PDF_COLORS.hrLine);
    doc.setLineWidth(ptToMm(hr.thickness));
    doc.line(MARGIN_LEFT_MM, yPosition, pageWidth - MARGIN_RIGHT_MM, yPosition);
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
    const teaserHeight = ptToMm(teaser.fontPt * body.lineHeight * teaserLines.length) + 10;

    if (yPosition + teaserHeight > contentBottomY) {
      doc.addPage();
      yPosition = MARGIN_TOP_MM;
    }

    // Teaser box -- scheme accent for border/text, SSOT teaserBg fill
    doc.setFillColor(...PDF_COLORS.teaserBg);
    doc.setDrawColor(...PDF_COLORS.teaserBorder);
    doc.roundedRect(MARGIN_LEFT_MM, yPosition - 2, contentWidth, teaserHeight, 2, 2, "FD");
    yPosition += 3;

    // Teaser label
    doc.setFontSize(9);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(...PDF_COLORS.teaserText);
    doc.text(EXPORT_FORMATTING.teaserLabel, MARGIN_LEFT_MM + 5, yPosition);
    yPosition += 4;

    // Teaser content
    doc.setFontSize(teaser.fontPt);
    doc.setFont(pdfFont, "italic");
    doc.setTextColor(...PDF_COLORS.teaserText);
    doc.text(teaserLines, MARGIN_LEFT_MM + 5, yPosition);
    yPosition += ptToMm(teaser.fontPt * body.lineHeight * teaserLines.length) + 4;

    doc.setTextColor(...PDF_COLORS.bodyText);
    doc.setFont(pdfFont, "normal");
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
        const headingKeep = ptToMm(sectionHeader.beforePt + sectionHeaderFont.fontPt * body.lineHeight + sectionHeader.afterPt + body.fontPt * body.lineHeight * 3);
        if (yPosition + headingKeep > contentBottomY) {
          doc.addPage();
          yPosition = MARGIN_TOP_MM;
        }
        addSpacing(sectionHeader.beforePt);
        addText(sectionInfo.cleanTitle, sectionHeaderFont.fontPt, true, PDF_COLORS.sectionHeader);
        addSpacing(sectionHeader.afterPt);
        i++;
        continue;
      }

      // Markdown ## headers -- section heading level
      if (trimmedLine.startsWith("## ")) {
        const headingKeep = ptToMm(sectionHeader.beforePt + sectionHeaderFont.fontPt * body.lineHeight + sectionHeader.afterPt + body.fontPt * body.lineHeight * 3);
        if (yPosition + headingKeep > contentBottomY) {
          doc.addPage();
          yPosition = MARGIN_TOP_MM;
        }
        addSpacing(sectionHeader.beforePt);
        addText(trimmedLine.replace("## ", ""), sectionHeaderFont.fontPt, true, PDF_COLORS.sectionHeader);
        addSpacing(sectionHeader.afterPt);
        i++;
        continue;
      }

      // Markdown ### headers -- subheading level (12pt bold, 6pt before, 2pt after)
      // Must stay attached to next paragraph (at least 2 body lines)
      if (trimmedLine.startsWith("### ")) {
        const subKeep = ptToMm(subheading.beforePt + subheading.fontPt * body.lineHeight + subheading.afterPt + body.fontPt * body.lineHeight * 2);
        if (yPosition + subKeep > contentBottomY) {
          doc.addPage();
          yPosition = MARGIN_TOP_MM;
        }
        addSpacing(subheading.beforePt);
        addText(trimmedLine.replace("### ", ""), subheading.fontPt, true);
        addSpacing(subheading.afterPt);
        i++;
        continue;
      }

      // Markdown # headers -- title level
      if (trimmedLine.startsWith("# ")) {
        const headingKeep = ptToMm(sectionHeader.beforePt + title.fontPt * body.lineHeight + sectionHeader.afterPt + body.fontPt * body.lineHeight * 3);
        if (yPosition + headingKeep > contentBottomY) {
          doc.addPage();
          yPosition = MARGIN_TOP_MM;
        }
        addSpacing(sectionHeader.beforePt);
        addText(trimmedLine.replace("# ", ""), title.fontPt, true);
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
        const bulletLineH = ptToMm(body.fontPt * body.lineHeight);
        if (bulletCount >= 2) {
          const twoBulletH = bulletLineH * 2 + ptToMm(listItem.afterPt);
          if (yPosition + twoBulletH > contentBottomY) {
            doc.addPage();
            yPosition = MARGIN_TOP_MM;
          }
        }

        const bulletText = trimmedLine.replace(/^[-**]\s*/, '');
        const boldMatch  = bulletText.match(/^\*\*(.+?):\*\*\s*(.*)$/);
        const bulletIndentMm = ptToMm(listItem.indentPt);
        const textIndentMm = ptToMm(listItem.textIndentPt);
        if (boldMatch) {
          addLabeledText("- " + boldMatch[1] + ":", boldMatch[2], body.fontPt);
        } else {
          doc.setFontSize(body.fontPt);
          doc.setFont(pdfFont, "normal");
          doc.setTextColor(...PDF_COLORS.bodyText);
          // Draw bullet glyph at indent, text at text indent
          const bulletTextWidth = contentWidth - textIndentMm;
          const bulletLines = doc.splitTextToSize(sanitizeText(bulletText), bulletTextWidth);
          if (yPosition + bulletLineH > contentBottomY) {
            doc.addPage();
            yPosition = MARGIN_TOP_MM;
          }
          doc.text("-", MARGIN_LEFT_MM + bulletIndentMm, yPosition);
          for (let bi = 0; bi < bulletLines.length; bi++) {
            if (bi > 0 && yPosition + bulletLineH > contentBottomY) {
              doc.addPage();
              yPosition = MARGIN_TOP_MM;
            }
            doc.text(bulletLines[bi], MARGIN_LEFT_MM + textIndentMm, yPosition);
            yPosition += bulletLineH;
          }
        }
        addSpacing(listItem.afterPt);
        i++;
        continue;
      }

      // Numbered lists
      if (/^\d+[.)]\s/.test(trimmedLine)) {
        addText(trimmedLine, body.fontPt, false);
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
  doc.setFont(pdfFont, "bold");
  doc.setTextColor(...PDF_COLORS.bodyText);
  const titleLines = doc.splitTextToSize(sanitizeText(documentTitle), contentWidth);
  doc.text(titleLines, MARGIN_LEFT_MM, yPosition);
  yPosition += ptToMm(title.fontPt * body.lineHeight * titleLines.length);
  addSpacing(title.afterPt);

  // 2. METADATA LINE
  if (meta) {
    doc.setFontSize(metadata.fontPt);
    doc.setFont(pdfFont, "normal");
    doc.setTextColor(...PDF_COLORS.metaText);
    const metadataParts: string[] = [];
    if (meta.ageGroup)  metadataParts.push(sanitizeText(meta.ageGroup));
    if (meta.theology)  metadataParts.push(sanitizeText(meta.theology));
    if (metadataParts.length > 0) {
      doc.text(metadataParts.join("  |  "), MARGIN_LEFT_MM, yPosition);
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
    doc.setFont(pdfFont, "italic");
    doc.setTextColor(...PDF_COLORS.footerText);
    const copyrightLines = doc.splitTextToSize(copyrightText, contentWidth);
    const copyrightWidth = doc.getTextWidth(copyrightLines[0]);
    doc.text(copyrightLines, (pageWidth - copyrightWidth) / 2, yPosition + 3);
    yPosition += ptToMm(footer.fontPt * body.lineHeight * copyrightLines.length) + 3;
    doc.setTextColor(...PDF_COLORS.bodyText);
    doc.setFont(pdfFont, "normal");
  }

  // 7. SECTION 8 STANDALONE (new page, no pagination)
  let section8StartPage = -1;
  if (section8Lines.length > 0) {
    doc.addPage();
    yPosition         = MARGIN_TOP_MM;
    section8StartPage = doc.getNumberOfPages();

    // Standalone title -- scheme primary color
    doc.setFontSize(sectionHeaderFont.fontPt);
    doc.setFont(pdfFont, "bold");
    doc.setTextColor(...PDF_COLORS.sectionHeader);
    doc.text(getSection8StandaloneTitle(audienceProfile?.participant), MARGIN_LEFT_MM, yPosition);
    yPosition += ptToMm(sectionHeaderFont.fontPt * body.lineHeight);
    addSpacing(sectionHeader.afterPt);

    // Teaser box on Section 8 page
    addTeaserBox();

    // Process Section 8 content (skip the header line since we added it)
    processContentLines(section8Lines, true);
  }

  // 8. ADD SINGLE-LINE FOOTER TO MAIN PAGES ONLY (skip Student Handout pages)
  // Format: Lesson Title | Page X  (centered, 9pt, at footerY)
  const totalPages    = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    if (section8StartPage > 0 && p >= section8StartPage) continue;

    doc.setPage(p);
    doc.setFontSize(footer.fontPt);
    doc.setFont(pdfFont, "normal");
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
