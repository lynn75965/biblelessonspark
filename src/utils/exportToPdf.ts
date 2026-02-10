// src/utils/exportToPdf.ts
// Version: 2.5.0 - Standalone Student Handout title, broadened detection, no pagination on handout page
// SSOT SOURCE: All values from EXPORT_SPACING in lessonStructure.ts
// Frontend drives backend - change SSOT = changes PDF output

import jsPDF from "jspdf";
import { EXPORT_FORMATTING, EXPORT_SPACING, isBoldLabel, isSkipLabel } from "../constants/lessonStructure";

// ============================================================================
// SSOT IMPORTS - All values from lessonStructure.ts
// ============================================================================
const {
  fonts,
  margins,
  sectionHeader,
  body,
  title,
  sectionHeaderFont,
  metadata,
  teaser,
  footer,
  paragraph,
  listItem,
  colors,
} = EXPORT_SPACING;

// ============================================================================
// SSOT-DERIVED CONVERSIONS (computed from SSOT values, not hardcoded)
// ============================================================================

// Convert SSOT margin (inches) to mm for jsPDF
const MARGIN_MM = margins.inches * 25.4;

// Convert SSOT hex color (without #) to RGB array for jsPDF
const hexToRgb = (hex: string): [number, number, number] => {
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return [r, g, b];
};

// SSOT colors converted to RGB (derived, not hardcoded)
const PDF_COLORS = {
  teaserBg: hexToRgb(colors.teaserBg),
  teaserBorder: hexToRgb(colors.teaserBorder),
  teaserText: hexToRgb(colors.teaserText),
  bodyText: hexToRgb(colors.bodyText),
  metaText: hexToRgb(colors.metaText),
  footerText: hexToRgb(colors.footerText),
  hrLine: hexToRgb(colors.hrLine),
};

// Convert SSOT points to mm for jsPDF positioning
const ptToMm = (pt: number): number => pt / 2.83;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const sanitizeText = (text: string): string => {
  if (!text) return "";
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013/g, "-")
    .replace(/\u2014/g, "--")
    .replace(/\u2026/g, "...")
    .replace(/\u2728/g, "*")
    .replace(/\u2713/g, "[x]")
    .replace(/\u2714/g, "[x]")
    .replace(/\u2717/g, "[ ]")
    .replace(/\u2718/g, "[ ]")
    .replace(/\u2022/g, "-")
    .replace(/\u25CF/g, "-")
    .replace(/\u25CB/g, "o")
    .replace(/\u2192/g, "->")
    .replace(/\u2190/g, "<-")
    .replace(/\u2191/g, "^")
    .replace(/\u2193/g, "v")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x00-\xFF]/g, "");
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
  const match = cleaned.match(/^Section\s+(\d+)\s*[:\-–—]?\s*(.*)$/i);
  
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
 * ("STUDENT HANDOUT", "Student Experience", "Student Material", etc.)
 */
const isSection8Line = (line: string): boolean => {
  let cleaned = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/^#{1,6}\s*/, '').trim();
  // Original format: "Section 8: Student Handout"
  if (/^Section\s+8/i.test(cleaned)) return true;
  // Shaped formats: "STUDENT HANDOUT", "Student Experience", "Student Material", etc.
  if (/^(?:STUDENT\s+(?:HANDOUT|EXPERIENCE|MATERIAL|SECTION)|Student\s+(?:Handout|Experience|Material|Section))\s*$/i.test(cleaned)) return true;
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
}

export const exportToPdf = async ({ title: inputTitle, content, metadata: meta, teaserContent }: ExportToPdfOptions): Promise<void> => {
  console.log('[PDF Export V2.5] Starting export with standalone Student Handout...');
  
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - MARGIN_MM * 2;
  
  // Single-line footer space (smaller now)
  const footerHeightMm = ptToMm(footer.fontPt) + 6;
  
  let yPosition = MARGIN_MM;

  const lessonTitle = extractLessonTitle(content);
  const documentTitle = lessonTitle || inputTitle;

  // ---- Helper: Add text with SSOT line height ----
  const addText = (text: string, fontSize: number, isBold: boolean = false): void => {
    const sanitizedText = sanitizeText(text);
    doc.setFontSize(fontSize);
    doc.setFont(fonts.pdf, isBold ? "bold" : "normal");
    doc.setTextColor(...PDF_COLORS.bodyText);
    const lines = doc.splitTextToSize(sanitizedText, contentWidth);
    const textHeight = ptToMm(fontSize * body.lineHeight * lines.length);
    if (yPosition + textHeight > pageHeight - MARGIN_MM - footerHeightMm) {
      doc.addPage();
      yPosition = MARGIN_MM;
    }
    doc.text(lines, MARGIN_MM, yPosition);
    yPosition += textHeight;
  };

  // ---- Helper: Add labeled text ----
  const addLabeledText = (label: string, value: string, fontSize: number = body.fontPt): void => {
    const sanitizedLabel = sanitizeText(label);
    const sanitizedValue = sanitizeText(value);
    doc.setFontSize(fontSize);
    doc.setFont(fonts.pdf, "bold");
    doc.setTextColor(...PDF_COLORS.bodyText);
    const labelWidth = doc.getTextWidth(sanitizedLabel + " ");
    const remainingWidth = contentWidth - labelWidth;
    if (yPosition + 5 > pageHeight - MARGIN_MM - footerHeightMm) {
      doc.addPage();
      yPosition = MARGIN_MM;
    }
    doc.text(sanitizedLabel, MARGIN_MM, yPosition);
    doc.setFont(fonts.pdf, "normal");
    const valueLines = doc.splitTextToSize(sanitizedValue, remainingWidth);
    if (valueLines.length === 1) {
      doc.text(valueLines[0], MARGIN_MM + labelWidth, yPosition);
      yPosition += ptToMm(fontSize * body.lineHeight);
    } else {
      doc.text(valueLines[0], MARGIN_MM + labelWidth, yPosition);
      yPosition += ptToMm(fontSize * body.lineHeight);
      for (let i = 1; i < valueLines.length; i++) {
        if (yPosition + 5 > pageHeight - MARGIN_MM - footerHeightMm) {
          doc.addPage();
          yPosition = MARGIN_MM;
        }
        doc.text(valueLines[i], MARGIN_MM, yPosition);
        yPosition += ptToMm(fontSize * body.lineHeight);
      }
    }
  };

  // ---- Helper: Add horizontal rule with SSOT color ----
  const addLine = (): void => {
    if (yPosition + 3 > pageHeight - MARGIN_MM - footerHeightMm) {
      doc.addPage();
      yPosition = MARGIN_MM;
    }
    doc.setDrawColor(...PDF_COLORS.hrLine);
    doc.line(MARGIN_MM, yPosition, pageWidth - MARGIN_MM, yPosition);
    yPosition += 3;
  };

  // ---- Helper: Add spacing from SSOT points ----
  const addSpacing = (points: number): void => {
    yPosition += ptToMm(points);
  };

  // ---- Helper: Add teaser box ----
  const addTeaserBox = (): void => {
    if (!teaserContent || !teaserContent.trim()) return;
    
    const teaserText = sanitizeText(teaserContent);
    doc.setFontSize(teaser.fontPt);
    const teaserLines = doc.splitTextToSize(teaserText, contentWidth - 10);
    const teaserHeight = ptToMm(teaser.fontPt * body.lineHeight * teaserLines.length) + 10;
    
    if (yPosition + teaserHeight > pageHeight - MARGIN_MM - footerHeightMm) {
      doc.addPage();
      yPosition = MARGIN_MM;
    }
    
    // Teaser box with SSOT colors
    doc.setFillColor(...PDF_COLORS.teaserBg);
    doc.setDrawColor(...PDF_COLORS.teaserBorder);
    doc.roundedRect(MARGIN_MM, yPosition - 2, contentWidth, teaserHeight, 2, 2, "FD");
    yPosition += 3;
    
    // Teaser label
    doc.setFontSize(9);
    doc.setFont(fonts.pdf, "bold");
    doc.setTextColor(...PDF_COLORS.teaserText);
    doc.text(EXPORT_FORMATTING.teaserLabel, MARGIN_MM + 5, yPosition);
    yPosition += 4;
    
    // Teaser content
    doc.setFontSize(teaser.fontPt);
    doc.setFont(fonts.pdf, "italic");
    doc.setTextColor(...PDF_COLORS.teaserText);
    doc.text(teaserLines, MARGIN_MM + 5, yPosition);
    yPosition += ptToMm(teaser.fontPt * body.lineHeight * teaserLines.length) + 4;
    
    doc.setTextColor(...PDF_COLORS.bodyText);
    doc.setFont(fonts.pdf, "normal");
    addLine();
    addSpacing(paragraph.afterPt);
  };

  // ---- Helper: Process content lines ----
  const processContentLines = (lines: string[], skipSection8Header: boolean = false): void => {
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        addSpacing(paragraph.afterPt);
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
      
      // Section headers (SSOT: sectionHeaderFont.fontPt)
      const sectionInfo = isSectionHeader(trimmedLine);
      if (sectionInfo.isSection) {
        // Skip Section 8 header if processing Section 8 content (we add it separately)
        if (skipSection8Header && sectionInfo.num === 8) {
          i++;
          continue;
        }
        addSpacing(sectionHeader.beforePt);
        addText(sectionInfo.cleanTitle, sectionHeaderFont.fontPt, true);
        addSpacing(sectionHeader.afterPt);
        i++;
        continue;
      }
      
      // Markdown ## headers
      if (trimmedLine.startsWith("## ")) {
        addSpacing(sectionHeader.beforePt);
        addText(trimmedLine.replace("## ", ""), sectionHeaderFont.fontPt, true);
        addSpacing(sectionHeader.afterPt);
        i++;
        continue;
      }
      
      // Markdown ### headers
      if (trimmedLine.startsWith("### ")) {
        addSpacing(sectionHeader.beforePt);
        addText(trimmedLine.replace("### ", ""), body.fontPt, true);
        addSpacing(sectionHeader.afterPt);
        i++;
        continue;
      }
      
      // Markdown # headers
      if (trimmedLine.startsWith("# ")) {
        addSpacing(sectionHeader.beforePt);
        addText(trimmedLine.replace("# ", ""), title.fontPt, true);
        addSpacing(sectionHeader.afterPt);
        i++;
        continue;
      }
      
      // Bullet points
      if (trimmedLine.startsWith("- ") || trimmedLine.startsWith("* ") || trimmedLine.startsWith("• ")) {
        const bulletText = trimmedLine.replace(/^[-*•]\s*/, '');
        const boldMatch = bulletText.match(/^\*\*(.+?):\*\*\s*(.*)$/);
        if (boldMatch) {
          addLabeledText("• " + boldMatch[1] + ":", boldMatch[2], body.fontPt);
        } else {
          doc.setFontSize(body.fontPt);
          doc.setFont(fonts.pdf, "normal");
          doc.setTextColor(...PDF_COLORS.bodyText);
          const bulletLines = doc.splitTextToSize("• " + sanitizeText(bulletText), contentWidth - 5);
          if (yPosition + 5 > pageHeight - MARGIN_MM - footerHeightMm) {
            doc.addPage();
            yPosition = MARGIN_MM;
          }
          doc.text(bulletLines, MARGIN_MM + 3, yPosition);
          yPosition += ptToMm(body.fontPt * body.lineHeight * bulletLines.length);
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
      
      // Bold label: value pattern
      const labelMatch = trimmedLine.match(/^(?:\*\*)?([^:]+):(?:\*\*)?\s*(.*)$/);
      if (labelMatch) {
        const label = labelMatch[1].trim();
        const value = labelMatch[2].trim();
        if (isSkipLabel(label)) {
          i++;
          continue;
        }
        if (isBoldLabel(label)) {
          addLabeledText(label + ":", value, body.fontPt);
          addSpacing(paragraph.afterPt);
          i++;
          continue;
        }
        addText(trimmedLine.replace(/\*\*/g, ""), body.fontPt, false);
        addSpacing(paragraph.afterPt);
        i++;
        continue;
      }
      
      // Regular paragraph
      const cleanedLine = trimmedLine.replace(/\*\*/g, "");
      addText(cleanedLine, body.fontPt, false);
      addSpacing(paragraph.afterPt);
      i++;
    }
  };

  // ============================================================================
  // BUILD DOCUMENT
  // ============================================================================

  // 1. DOCUMENT TITLE
  doc.setFontSize(title.fontPt);
  doc.setFont(fonts.pdf, "bold");
  doc.setTextColor(...PDF_COLORS.bodyText);
  const titleLines = doc.splitTextToSize(sanitizeText(documentTitle), contentWidth);
  doc.text(titleLines, MARGIN_MM, yPosition);
  yPosition += ptToMm(title.fontPt * body.lineHeight * titleLines.length);
  addSpacing(title.afterPt);

  // 2. METADATA LINE
  if (meta) {
    doc.setFontSize(metadata.fontPt);
    doc.setFont(fonts.pdf, "normal");
    doc.setTextColor(...PDF_COLORS.metaText);
    const metadataParts: string[] = [];
    if (meta.ageGroup) metadataParts.push(sanitizeText(meta.ageGroup));
    if (meta.theology) metadataParts.push(sanitizeText(meta.theology));
    if (metadataParts.length > 0) {
      doc.text(metadataParts.join("  |  "), MARGIN_MM, yPosition);
      addSpacing(metadata.afterPt);
    }
    doc.setTextColor(...PDF_COLORS.bodyText);
  }

  addLine();
  addSpacing(paragraph.afterPt);

  // 3. STUDENT TEASER BOX (at top)
  addTeaserBox();

  // 4. SPLIT CONTENT AT SECTION 8
  const allLines = content.split("\n");
  const mainLines: string[] = [];
  const section8Lines: string[] = [];
  let foundSection8 = false;
  
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
    doc.setFont(fonts.pdf, "italic");
    doc.setTextColor(...PDF_COLORS.footerText);
    const copyrightLines = doc.splitTextToSize(copyrightText, contentWidth);
    const copyrightWidth = doc.getTextWidth(copyrightLines[0]);
    doc.text(copyrightLines, (pageWidth - copyrightWidth) / 2, yPosition + 3);
    yPosition += ptToMm(footer.fontPt * body.lineHeight * copyrightLines.length) + 3;
    doc.setTextColor(...PDF_COLORS.bodyText);
    doc.setFont(fonts.pdf, "normal");
  }

  // 7. SECTION 8 STANDALONE (new page, no pagination)
  let section8StartPage = -1;
  if (section8Lines.length > 0) {
    doc.addPage();
    yPosition = MARGIN_MM;
    section8StartPage = doc.getNumberOfPages();
    
    // Standalone title: "Student Handout" (no "Section 8:" prefix)
    doc.setFontSize(sectionHeaderFont.fontPt);
    doc.setFont(fonts.pdf, "bold");
    doc.setTextColor(...PDF_COLORS.bodyText);
    doc.text(EXPORT_FORMATTING.section8StandaloneTitle, MARGIN_MM, yPosition);
    yPosition += ptToMm(sectionHeaderFont.fontPt * body.lineHeight);
    addSpacing(sectionHeader.afterPt);
    
    // Teaser box on Section 8 page
    addTeaserBox();
    
    // Process Section 8 content (skip the header line since we added it)
    processContentLines(section8Lines, true);
  }

  // 8. ADD SINGLE-LINE FOOTER TO MAIN PAGES ONLY (skip Student Handout pages)
  // Format: BibleLessonSpark.com  •  Page 1 of 7
  const totalPages = doc.getNumberOfPages();
  const mainPageCount = section8StartPage > 0 ? section8StartPage - 1 : totalPages;
  for (let p = 1; p <= totalPages; p++) {
    // Skip footer on Student Handout pages (teachers distribute these to students)
    if (section8StartPage > 0 && p >= section8StartPage) continue;
    
    doc.setPage(p);
    doc.setFontSize(footer.fontPt);
    doc.setFont(fonts.pdf, "normal");
    doc.setTextColor(...PDF_COLORS.footerText);
    
    const footerText = `${EXPORT_FORMATTING.footerText}  •  Page ${p} of ${mainPageCount}`;
    const footerWidth = doc.getTextWidth(footerText);
    doc.text(footerText, (pageWidth - footerWidth) / 2, pageHeight - 10);
  }

  // 9. SAVE FILE
  const sanitizedTitle = sanitizeText(documentTitle).replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_").substring(0, 50);
  const filename = `${sanitizedTitle}_Lesson.pdf`;
  doc.save(filename);
  
  console.log('[PDF Export V2.5] Export complete!');
};
