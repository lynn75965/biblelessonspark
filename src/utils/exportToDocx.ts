// src/utils/exportToDocx.ts
// Version: 3.0.0 - Font and color scheme picker support
// SSOT COMPLIANT: All spacing values from lessonStructure.ts
//                 All fonts/color schemes from seriesExportConfig.ts

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  AlignmentType,
  BorderStyle,
  PageBreak,
  Footer,
  PageNumber
} from "docx";
import { saveAs } from "file-saver";
import { EXPORT_FORMATTING, EXPORT_SPACING, getSection8StandaloneTitle } from "../constants/lessonStructure";
import type { AudienceProfile } from "../constants/audienceConfig";
import { STUDENT_HANDOUT_HEADING_REGEX } from "../constants/lessonShapeProfiles";
import type { FontId, ColorSchemeId, ColorScheme } from "../constants/seriesExportConfig";
import { getFontOption, getColorScheme } from "../constants/seriesExportConfig";

// SSOT destructure
const {
  fonts,
  margins,
  sectionHeader,
  body,
  title,
  sectionHeaderFont,
  metadata,
  teaser,
  paragraph,
  listItem,
  footer,
  colors,
} = EXPORT_SPACING;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * BULLETPROOF markdown stripper - removes ALL markdown artifacts
 */
function cleanAllMarkdown(text: string): string {
  if (!text) return '';
  let result = text.trim();

  while (result.startsWith('**') || result.startsWith('__')) {
    if (result.startsWith('**')) result = result.slice(2);
    if (result.startsWith('__')) result = result.slice(2);
  }
  while (result.endsWith('**') || result.endsWith('__')) {
    if (result.endsWith('**')) result = result.slice(0, -2);
    if (result.endsWith('__')) result = result.slice(0, -2);
  }

  result = result.replace(/^#{1,6}\s*/, '');
  return result.trim();
}

/**
 * Detect if line is a Section header
 */
function detectSectionHeader(line: string): { isSection: boolean; num: number; cleanTitle: string } {
  const cleaned = cleanAllMarkdown(line);
  const match   = cleaned.match(/^Section\s+(\d+)\s*[:\----]?\s*(.*)$/i);

  if (match) {
    const num      = parseInt(match[1], 10);
    const subtitle = match[2] ? match[2].trim() : '';
    return {
      isSection:  true,
      num:        num,
      cleanTitle: subtitle ? `Section ${num}: ${subtitle}` : `Section ${num}`
    };
  }

  return { isSection: false, num: 0, cleanTitle: '' };
}

/**
 * Detect Section 8 / Student Handout heading
 */
function isSection8Line(line: string): boolean {
  const cleaned = cleanAllMarkdown(line);
  if (/^Section\s+8/i.test(cleaned)) return true;
  if (STUDENT_HANDOUT_HEADING_REGEX.test(cleaned)) return true;
  return false;
}

/**
 * Extract lesson title from content
 */
function extractDocTitle(content: string): string | null {
  const lines = content.split('\n');
  for (const line of lines) {
    const cleaned = cleanAllMarkdown(line);
    const match   = cleaned.match(/^Lesson\s+Title[:\s]*[""]?(.+?)[""]?\s*$/i);
    if (match) {
      return match[1].replace(/[""\*#]/g, '').trim();
    }
  }
  return null;
}

/**
 * Create styled teaser box -- scheme accent for borders/text
 */
function buildTeaserBox(teaserText: string, docxFont: string, accentColor: string): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({
        text:  EXPORT_FORMATTING.teaserLabel,
        bold:  true,
        color: accentColor,
        size:  teaser.fontHalfPt,
        font:  docxFont,
      })],
      shading:  { fill: colors.teaserBg },
      spacing:  { before: teaser.marginBeforeTwips, after: paragraph.afterTwips },
      border: {
        top:   { color: accentColor, size: 6, style: BorderStyle.SINGLE },
        left:  { color: accentColor, size: 6, style: BorderStyle.SINGLE },
        right: { color: accentColor, size: 6, style: BorderStyle.SINGLE },
      },
    }),
    new Paragraph({
      children: [new TextRun({
        text:    teaserText,
        italics: true,
        size:    body.fontHalfPt,
        font:    docxFont,
      })],
      spacing: { after: teaser.marginAfterTwips },
      shading: { fill: colors.teaserBg },
      border: {
        bottom: { color: accentColor, size: 6, style: BorderStyle.SINGLE },
        left:   { color: accentColor, size: 6, style: BorderStyle.SINGLE },
        right:  { color: accentColor, size: 6, style: BorderStyle.SINGLE },
      },
    }),
  ];
}

/**
 * Parse text with **bold** markers
 */
function buildTextRuns(
  text:     string,
  fontSize: number = body.fontHalfPt,
  docxFont: string = fonts.docx
): TextRun[] {
  if (!text) return [];

  const runs: TextRun[] = [];
  let processedText     = text.replace(/^#{1,6}\s*/, '');
  const segments        = processedText.split(/(\*\*[^*]+\*\*)/g);

  for (const seg of segments) {
    if (!seg) continue;

    if (seg.startsWith('**') && seg.endsWith('**')) {
      let boldText = seg.slice(2, -2);
      boldText     = boldText.replace(/^#{1,6}\s*/, '').trim();
      if (boldText) {
        runs.push(new TextRun({
          text: boldText,
          bold: true,
          size: fontSize,
          font: docxFont,
        }));
      }
    } else {
      runs.push(new TextRun({
        text: seg,
        size: fontSize,
        font: docxFont,
      }));
    }
  }

  return runs;
}

/**
 * Create SINGLE-LINE page footer
 * Format: BibleLessonSpark.com  *  Page 1 of 7
 */
function createPageFooter(docxFont: string): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text:  EXPORT_FORMATTING.footerText + '  *  Page ',
            size:  footer.fontHalfPt,
            color: colors.footerText,
            font:  docxFont,
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size:     footer.fontHalfPt,
            color:    colors.footerText,
            font:     docxFont,
          }),
          new TextRun({
            text:  ' of ',
            size:  footer.fontHalfPt,
            color: colors.footerText,
            font:  docxFont,
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size:     footer.fontHalfPt,
            color:    colors.footerText,
            font:     docxFont,
          }),
        ],
      }),
    ],
  });
}

// ============================================================================
// MAIN EXPORT FUNCTION
// ============================================================================

interface DocxExportOptions {
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

export const exportToDocx = async (options: DocxExportOptions): Promise<void> => {
  const {
    title: inputTitle,
    content,
    metadata: meta,
    teaserContent,
    audienceProfile,
    fontId,
    colorSchemeId,
  } = options;

  // Resolve font and color scheme from SSOT (defaults: Pagella + Forest & Gold)
  const fontOpt  = getFontOption(fontId ?? null);
  const scheme   = getColorScheme(colorSchemeId ?? null);
  const docxFont = fontOpt.docxName;

  const lessonTitle = extractDocTitle(content);
  const docTitle    = lessonTitle || inputTitle;

  const paragraphs: Paragraph[] = [];

  // 1. DOCUMENT TITLE
  paragraphs.push(new Paragraph({
    children: [new TextRun({
      text: docTitle,
      bold: true,
      size: title.fontHalfPt,
      font: docxFont,
    })],
    spacing: { after: title.afterTwips },
  }));

  // 2. METADATA LINE
  if (meta) {
    const parts: string[] = [];
    if (meta.ageGroup) parts.push(meta.ageGroup);
    if (meta.theology) parts.push(meta.theology);
    if (parts.length > 0) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({
          text:  parts.join('  |  '),
          size:  metadata.fontHalfPt,
          color: colors.metaText,
          font:  docxFont,
        })],
        spacing: { after: metadata.afterTwips },
      }));
    }
  }

  // 3. STUDENT TEASER AT TOP
  if (teaserContent && teaserContent.trim()) {
    paragraphs.push(...buildTeaserBox(teaserContent, docxFont, scheme.accent));
  }

  // 4. SPLIT CONTENT AT SECTION 8
  const allLines:      string[] = content.split('\n');
  const mainLines:     string[] = [];
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

  // ---- Shared line renderer ----
  const renderLine = (trimmed: string): void => {
    if (!trimmed || trimmed === '---') return;
    if (/^#{1,3}$/.test(trimmed)) return;  // skip bare heading markers
    if (/Lesson\s+Title/i.test(cleanAllMarkdown(trimmed))) return;

    const sectionInfo = detectSectionHeader(trimmed);
    if (sectionInfo.isSection) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({
          text:  sectionInfo.cleanTitle,
          bold:  true,
          size:  sectionHeaderFont.fontHalfPt,
          color: scheme.primary,
          font:  docxFont,
        })],
        spacing: { before: sectionHeader.beforeTwips, after: sectionHeader.afterTwips },
      }));
      return;
    }

    const withoutBold = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
    if (withoutBold.startsWith('#')) {
      const headerText = cleanAllMarkdown(trimmed);
      paragraphs.push(new Paragraph({
        children: [new TextRun({
          text:  headerText,
          bold:  true,
          size:  body.fontHalfPt,
          color: scheme.primary,
          font:  docxFont,
        })],
        spacing: { before: sectionHeader.beforeTwips, after: sectionHeader.afterTwips },
      }));
      return;
    }

    // Standalone ## / # headings from shaped content
    if (/^#{1,3}\s+/.test(trimmed)) {
      const headerText = trimmed.replace(/^#{1,3}\s+/, '').replace(/\*\*/g, '').trim();
      paragraphs.push(new Paragraph({
        children: [new TextRun({
          text:  headerText,
          bold:  true,
          size:  body.fontHalfPt,
          color: scheme.primary,
          font:  docxFont,
        })],
        spacing: { before: sectionHeader.beforeTwips, after: sectionHeader.afterTwips },
      }));
      return;
    }

    // Standalone bold headings from shaped content
    if (/^\*\*[^*]+\*?\*?:?\s*$/.test(trimmed) && trimmed.length < 80) {
      const headerText = trimmed.replace(/\*\*/g, '').trim();
      paragraphs.push(new Paragraph({
        children: [new TextRun({
          text:  headerText,
          bold:  true,
          size:  body.fontHalfPt,
          color: scheme.primary,
          font:  docxFont,
        })],
        spacing: { before: sectionHeader.beforeTwips, after: sectionHeader.afterTwips },
      }));
      return;
    }

    if (/^[-**]\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-**]\s*/, '');
      paragraphs.push(new Paragraph({
        children: buildTextRuns(bulletText, body.fontHalfPt, docxFont),
        bullet:   { level: 0 },
        spacing:  { after: listItem.afterTwips },
      }));
      return;
    }

    if (/^\d+[.)]\s/.test(trimmed)) {
      const itemText = trimmed.replace(/^\d+[.)]\s*/, '');
      paragraphs.push(new Paragraph({
        children: buildTextRuns(itemText, body.fontHalfPt, docxFont),
        spacing:  { after: listItem.afterTwips },
      }));
      return;
    }

    paragraphs.push(new Paragraph({
      children: buildTextRuns(trimmed, body.fontHalfPt, docxFont),
      spacing:  { after: paragraph.afterTwips },
    }));
  };

  // 5. PROCESS MAIN CONTENT (Sections 1-7)
  for (const line of mainLines) {
    renderLine(line.trim());
  }

  // 6. COPYRIGHT NOTICE (end of main content, before Section 8)
  let copyright = '';
  if (meta?.copyrightNotice) {
    copyright = meta.copyrightNotice;
  } else if (meta?.bibleVersion) {
    copyright = `Scripture quotations are from the ${meta.bibleVersion}${meta.bibleVersionAbbreviation ? ` (${meta.bibleVersionAbbreviation})` : ''}.`;
  }

  if (copyright) {
    paragraphs.push(new Paragraph({
      spacing: { before: footer.marginTopTwips },
      border:  { top: { color: scheme.hr, size: 6, style: BorderStyle.SINGLE } },
    }));

    paragraphs.push(new Paragraph({
      children: [new TextRun({
        text:    copyright,
        size:    footer.fontHalfPt,
        color:   colors.footerText,
        italics: true,
        font:    docxFont,
      })],
      alignment: AlignmentType.CENTER,
      spacing:   { before: paragraph.afterTwips, after: paragraph.afterTwips },
    }));
  }

  // 7. SECTION 8 STANDALONE (new page, standalone title)
  if (section8Lines.length > 0) {
    paragraphs.push(new Paragraph({ children: [new PageBreak()] }));

    // Standalone title -- scheme primary color
    paragraphs.push(new Paragraph({
      children: [new TextRun({
        text:  getSection8StandaloneTitle(audienceProfile?.participant),
        bold:  true,
        size:  sectionHeaderFont.fontHalfPt,
        color: scheme.primary,
        font:  docxFont,
      })],
      spacing: { after: sectionHeader.afterTwips },
    }));

    if (teaserContent && teaserContent.trim()) {
      paragraphs.push(...buildTeaserBox(teaserContent, docxFont, scheme.accent));
    }

    // Process Section 8 content (skip header line -- added above)
    for (let i = 1; i < section8Lines.length; i++) {
      renderLine(section8Lines[i].trim());
    }
  }

  // 8. CREATE DOCUMENT WITH SSOT MARGINS, SELECTED FONT, AND FOOTER
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: docxFont,
            size: body.fontHalfPt,
          },
        },
      },
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top:    margins.topTwips ?? margins.twips,
            right:  margins.rightTwips ?? margins.twips,
            bottom: margins.bottomTwips ?? margins.twips,
            left:   margins.leftTwips ?? margins.twips,
          },
        },
      },
      footers: {
        default: createPageFooter(docxFont),
      },
      children: paragraphs,
    }],
  });

  const blob      = await Packer.toBlob(doc);
  const safeTitle = docTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
  saveAs(blob, `${safeTitle}_Lesson.docx`);

};
