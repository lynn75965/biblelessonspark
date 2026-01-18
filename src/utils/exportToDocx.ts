// src/utils/exportToDocx.ts
// SSOT COMPLIANT: All values imported from lessonStructure.ts
// Version: 2.4.0 - Single-line footer, Section 8 standalone page

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
import { EXPORT_FORMATTING, EXPORT_SPACING } from "../constants/lessonStructure";

// SSOT destructure - includes fonts
const { fonts, margins, sectionHeader, body, title, sectionHeaderFont, metadata, teaser, paragraph, listItem, footer, colors } = EXPORT_SPACING;

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
}

/**
 * Detect Section 8 specifically
 */
function isSection8Line(line: string): boolean {
  const cleaned = cleanAllMarkdown(line);
  return /^Section\s+8\s*[:\-–—]?\s*Student\s+Handout/i.test(cleaned);
}

/**
 * Extract lesson title from content
 */
function extractDocTitle(content: string): string | null {
  const lines = content.split('\n');
  for (const line of lines) {
    const cleaned = cleanAllMarkdown(line);
    const match = cleaned.match(/^Lesson\s+Title[:\s]*[""]?(.+?)[""]?\s*$/i);
    if (match) {
      return match[1].replace(/[""\*#]/g, '').trim();
    }
  }
  return null;
}

/**
 * Create styled teaser box - SSOT fonts/colors/spacing
 */
function buildTeaserBox(teaserText: string): Paragraph[] {
  return [
    new Paragraph({
      children: [new TextRun({ 
        text: EXPORT_FORMATTING.teaserLabel, 
        bold: true, 
        color: colors.teaserText, 
        size: teaser.fontHalfPt,
        font: fonts.docx
      })],
      shading: { fill: colors.teaserBg },
      spacing: { before: teaser.marginBeforeTwips, after: paragraph.afterTwips },
      border: {
        top: { color: colors.teaserBorder, size: 6, style: BorderStyle.SINGLE },
        left: { color: colors.teaserBorder, size: 6, style: BorderStyle.SINGLE },
        right: { color: colors.teaserBorder, size: 6, style: BorderStyle.SINGLE }
      }
    }),
    new Paragraph({
      children: [new TextRun({ 
        text: teaserText, 
        italics: true, 
        size: body.fontHalfPt,
        font: fonts.docx
      })],
      spacing: { after: teaser.marginAfterTwips },
      shading: { fill: colors.teaserBg },
      border: {
        bottom: { color: colors.teaserBorder, size: 6, style: BorderStyle.SINGLE },
        left: { color: colors.teaserBorder, size: 6, style: BorderStyle.SINGLE },
        right: { color: colors.teaserBorder, size: 6, style: BorderStyle.SINGLE }
      }
    })
  ];
}

/**
 * Parse text with **bold** markers - SSOT font
 */
function buildTextRuns(text: string, fontSize: number = body.fontHalfPt): TextRun[] {
  if (!text) return [];
  
  const runs: TextRun[] = [];
  let processedText = text.replace(/^#{1,6}\s*/, '');
  const segments = processedText.split(/(\*\*[^*]+\*\*)/g);
  
  for (const seg of segments) {
    if (!seg) continue;
    
    if (seg.startsWith('**') && seg.endsWith('**')) {
      let boldText = seg.slice(2, -2);
      boldText = boldText.replace(/^#{1,6}\s*/, '').trim();
      if (boldText) {
        runs.push(new TextRun({ 
          text: boldText, 
          bold: true, 
          size: fontSize,
          font: fonts.docx
        }));
      }
    } else {
      runs.push(new TextRun({ 
        text: seg, 
        size: fontSize,
        font: fonts.docx
      }));
    }
  }
  
  return runs;
}

/**
 * Create SINGLE-LINE page footer with page numbers and branding
 * Format: BibleLessonSpark.com  •  Page 1 of 7
 */
function createPageFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({
            text: EXPORT_FORMATTING.footerText + '  •  Page ',
            size: footer.fontHalfPt,
            color: colors.footerText,
            font: fonts.docx
          }),
          new TextRun({
            children: [PageNumber.CURRENT],
            size: footer.fontHalfPt,
            color: colors.footerText,
            font: fonts.docx
          }),
          new TextRun({
            text: ' of ',
            size: footer.fontHalfPt,
            color: colors.footerText,
            font: fonts.docx
          }),
          new TextRun({
            children: [PageNumber.TOTAL_PAGES],
            size: footer.fontHalfPt,
            color: colors.footerText,
            font: fonts.docx
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
}

export const exportToDocx = async (options: DocxExportOptions): Promise<void> => {
  const { title: inputTitle, content, metadata: meta, teaserContent } = options;
  
  console.log('[DOCX Export V2.4] Starting export with single-line footer...');
  
  const lessonTitle = extractDocTitle(content);
  const docTitle = lessonTitle || inputTitle;
  
  const paragraphs: Paragraph[] = [];
  
  // 1. DOCUMENT TITLE - SSOT font
  paragraphs.push(new Paragraph({
    children: [new TextRun({ 
      text: docTitle, 
      bold: true, 
      size: title.fontHalfPt,
      font: fonts.docx
    })],
    spacing: { after: title.afterTwips }
  }));
  
  // 2. METADATA LINE - SSOT font
  if (meta) {
    const parts: string[] = [];
    if (meta.ageGroup) parts.push(meta.ageGroup);
    if (meta.theology) parts.push(meta.theology);
    if (parts.length > 0) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ 
          text: parts.join('  |  '), 
          size: metadata.fontHalfPt, 
          color: colors.metaText,
          font: fonts.docx
        })],
        spacing: { after: metadata.afterTwips }
      }));
    }
  }
  
  // 3. STUDENT TEASER AT TOP
  if (teaserContent && teaserContent.trim()) {
    paragraphs.push(...buildTeaserBox(teaserContent));
  }
  
  // 4. SPLIT CONTENT AT SECTION 8
  const allLines = content.split('\n');
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
  for (const line of mainLines) {
    const trimmed = line.trim();
    
    if (!trimmed || trimmed === '---') continue;
    if (/Lesson\s+Title/i.test(cleanAllMarkdown(trimmed))) continue;
    
    const sectionInfo = detectSectionHeader(trimmed);
    if (sectionInfo.isSection) {
      paragraphs.push(new Paragraph({
        children: [new TextRun({ 
          text: sectionInfo.cleanTitle, 
          bold: true, 
          size: sectionHeaderFont.fontHalfPt,
          font: fonts.docx
        })],
        spacing: { before: sectionHeader.beforeTwips, after: sectionHeader.afterTwips }
      }));
      continue;
    }
    
    const withoutBold = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
    if (withoutBold.startsWith('#')) {
      const headerText = cleanAllMarkdown(trimmed);
      paragraphs.push(new Paragraph({
        children: [new TextRun({ 
          text: headerText, 
          bold: true, 
          size: body.fontHalfPt,
          font: fonts.docx
        })],
        spacing: { before: sectionHeader.beforeTwips, after: sectionHeader.afterTwips }
      }));
      continue;
    }
    
    if (/^[-*•]\s/.test(trimmed)) {
      const bulletText = trimmed.replace(/^[-*•]\s*/, '');
      paragraphs.push(new Paragraph({
        children: buildTextRuns(bulletText),
        bullet: { level: 0 },
        spacing: { after: listItem.afterTwips }
      }));
      continue;
    }
    
    if (/^\d+[.)]\s/.test(trimmed)) {
      const itemText = trimmed.replace(/^\d+[.)]\s*/, '');
      paragraphs.push(new Paragraph({
        children: buildTextRuns(itemText),
        spacing: { after: listItem.afterTwips }
      }));
      continue;
    }
    
    paragraphs.push(new Paragraph({
      children: buildTextRuns(trimmed),
      spacing: { after: paragraph.afterTwips }
    }));
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
      border: { top: { color: colors.hrLine, size: 6, style: BorderStyle.SINGLE } }
    }));
    
    paragraphs.push(new Paragraph({
      children: [new TextRun({ 
        text: copyright, 
        size: footer.fontHalfPt, 
        color: colors.footerText, 
        italics: true,
        font: fonts.docx
      })],
      alignment: AlignmentType.CENTER,
      spacing: { before: paragraph.afterTwips, after: paragraph.afterTwips }
    }));
  }
  
  // 7. SECTION 8 STANDALONE (new page)
  if (section8Lines.length > 0) {
    paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
    
    paragraphs.push(new Paragraph({
      children: [new TextRun({ 
        text: EXPORT_FORMATTING.section8Title, 
        bold: true, 
        size: sectionHeaderFont.fontHalfPt,
        font: fonts.docx
      })],
      spacing: { after: sectionHeader.afterTwips }
    }));
    
    if (teaserContent && teaserContent.trim()) {
      paragraphs.push(...buildTeaserBox(teaserContent));
    }
    
    for (let i = 1; i < section8Lines.length; i++) {
      const line = section8Lines[i];
      const trimmed = line.trim();
      
      if (!trimmed || trimmed === '---') continue;
      
      const withoutBold = trimmed.replace(/^\*\*/, '').replace(/\*\*$/, '');
      if (withoutBold.startsWith('#')) {
        const headerText = cleanAllMarkdown(trimmed);
        paragraphs.push(new Paragraph({
          children: [new TextRun({ 
            text: headerText, 
            bold: true, 
            size: body.fontHalfPt,
            font: fonts.docx
          })],
          spacing: { before: sectionHeader.beforeTwips, after: sectionHeader.afterTwips }
        }));
        continue;
      }
      
      if (/^[-*•]\s/.test(trimmed)) {
        const bulletText = trimmed.replace(/^[-*•]\s*/, '');
        paragraphs.push(new Paragraph({
          children: buildTextRuns(bulletText),
          bullet: { level: 0 },
          spacing: { after: listItem.afterTwips }
        }));
        continue;
      }
      
      if (/^\d+[.)]\s/.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+[.)]\s*/, '');
        paragraphs.push(new Paragraph({
          children: buildTextRuns(itemText),
          spacing: { after: listItem.afterTwips }
        }));
        continue;
      }
      
      paragraphs.push(new Paragraph({
        children: buildTextRuns(trimmed),
        spacing: { after: paragraph.afterTwips }
      }));
    }
  }
  
  // 8. CREATE DOCUMENT WITH SSOT MARGINS, DEFAULT FONT, AND SINGLE-LINE FOOTER
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fonts.docx,
            size: body.fontHalfPt
          }
        }
      }
    },
    sections: [{
      properties: {
        page: {
          margin: {
            top: margins.twips,
            right: margins.twips,
            bottom: margins.twips,
            left: margins.twips
          }
        }
      },
      footers: {
        default: createPageFooter(),
      },
      children: paragraphs
    }]
  });
  
  const blob = await Packer.toBlob(doc);
  const safeTitle = docTitle.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_').substring(0, 50);
  saveAs(blob, `${safeTitle}_Lesson.docx`);
  
  console.log('[DOCX Export V2.4] Export complete with single-line footer!');
};
