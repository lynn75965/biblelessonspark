/**
 * formatLessonContent.ts
 * SSOT COMPLIANT: All values imported from lessonStructure.ts
 * NO hardcoded spacing/font values - frontend drives backend
 * FIXED: Properly strips ## markdown from all output
 */
import React from "react";
import { EXPORT_FORMATTING, EXPORT_SPACING } from "../constants/lessonStructure";

// Destructure SSOT values
const { sectionHeader, body, hr } = EXPORT_SPACING;

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function ensureLineBreaks(text: string): string {
  return text
    .replace(/([^\s])(\s*## )/g, '$1\n\n$2')
    .replace(/([^\n])(\s*---\s*)/g, '$1\n$2')
    .replace(/(---\s*)([^\n])/g, '$1\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeLegacyContent(text: string): string {
  if (!text) return text;
  let normalized = text;
  EXPORT_FORMATTING.boldLabels.forEach(label => {
    const hashPattern = new RegExp(`^(#{1,2})\\s*(${escapeRegExp(label)}):?\\s*$`, 'gmi');
    normalized = normalized.replace(hashPattern, `**${label}:**`);
    const hashWithContentPattern = new RegExp(`^(#{1,2})\\s*(${escapeRegExp(label)}):?\\s+(.+)$`, 'gmi');
    normalized = normalized.replace(hashWithContentPattern, `**${label}:** $3`);
  });
  normalized = normalized.replace(/^\*\*(\d+)\.\*\*\s*/gm, '**$1)** ');
  normalized = normalized.replace(/^\*\*(\d+)\)\*\*\s*/gm, '**$1)** ');
  normalized = normalized.replace(/^(\d+)\.\s+/gm, '**$1)** ');
  return normalized;
}

export function stripMarkdown(text: string): string {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/(?<!\n)\*([^*\n]+)\*(?!\*)/g, '$1')
    .replace(/(?<![a-zA-Z])_([^_\n]+)_(?![a-zA-Z])/g, '$1')
    .replace(/^#{1,6}\s+(.+)$/gm, '$1')
    .replace(/^[\*\-]\s+/gm, '• ')
    .replace(/^[\-\*]{3,}$/gm, '')
    .replace(/```[a-z]*\n?/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(• .+)\n\n(• )/g, '$1\n$2')
    .trim();
}

export function convertToRichHtml(text: string): string {
  if (!text) return '';
  let html = text
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^#{1,6}\s+(Section \d+:.+)$/gm, '<p><strong>$1</strong></p>')
    .replace(/^#{1,6}\s+(.+)$/gm, '<p><strong>$1</strong></p>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/(?<!\n)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>')
    .replace(/(?<![a-zA-Z])_([^_\n]+)_(?![a-zA-Z])/g, '<em>$1</em>')
    .replace(/^[\*\-]\s+(.+)$/gm, '<li>$1</li>')
    .replace(/^[\-\*]{3,}$/gm, `<hr style="margin: ${hr.marginPt}pt 0; border: none; border-top: 1px solid #ccc;">`)
    .replace(/```[a-z]*\n?/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>');
  html = html.replace(/(<li>.*?<\/li>)(\s*<br>\s*)?(<li>)/g, '$1$3');
  html = html.replace(/(<li>.*?<\/li>)+/g, '<ul style="margin: 4pt 0 4pt 18pt; padding: 0;">$&</ul>');
  if (!html.startsWith('<p>') && !html.startsWith('<ul>') && !html.startsWith('<hr')) {
    html = '<p>' + html + '</p>';
  }
  html = html
    .replace(/<p><\/p>/g, '')
    .replace(/<p>\s*<br>\s*<\/p>/g, '')
    .replace(/<br>\s*<\/p>/g, '</p>')
    .replace(/<p>\s*<br>/g, '<p>')
    .replace(/<\/p>\s*<p>/g, '</p><p>')
    .replace(/<p>\s*(<ul>)/g, '$1')
    .replace(/(<\/ul>)\s*<\/p>/g, '$1')
    .replace(/<p>\s*(<hr[^>]*>)/g, '$1')
    .replace(/(<hr[^>]*>)\s*<\/p>/g, '$1');
  return html;
}

export function formatLessonContentToHtml(content: string | null | undefined): string {
  if (!content) return "";
  let text = normalizeLineEndings(content);
  text = ensureLineBreaks(text);
  text = normalizeLegacyContent(text);
  return text
    .replace(/## (.*?)(?=\n|$)/g, '<h2 class="text-lg font-bold mt-4 mb-2 text-primary">$1</h2>')
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n?---\n?/g, '<hr class="my-4 border-t-2 border-muted-foreground/30">')
    .replace(/\x95/g, "•")
    .replace(/\n\n/g, "</p><p class='mt-2'>")
    .replace(/\n/g, "<br>")
    .replace(/^(.*)$/, "<p>$1</p>")
    .replace(/<p><\/p>/g, "")
    .replace(/<p class='mt-2'><\/p>/g, "");
}

/**
 * FIXED: Clean section header text by stripping ** and ## markdown
 * Handles **## Section X: Title** format correctly
 */
function cleanSectionHeader(text: string): string {
  let clean = text;
  // Step 1: Remove outer bold markers
  clean = clean.replace(/^\*\*/, '').replace(/\*\*$/, '');
  clean = clean.replace(/^__/, '').replace(/__$/, '');
  // Step 2: Remove any leading # ## ### etc
  clean = clean.replace(/^#{1,6}\s*/, '');
  return clean.trim();
}

/**
 * Format for print - uses SSOT values from EXPORT_SPACING
 * FIXED: Properly strips ## from section headers and bold content
 */
export function formatLessonContentForPrint(content: string | null | undefined): string {
  if (!content) return "";
  let text = normalizeLineEndings(content);
  text = ensureLineBreaks(text);
  text = normalizeLegacyContent(text);
  
  // SSOT spacing values
  const sectionMargin = `${sectionHeader.beforePt}pt 0 ${sectionHeader.afterPt}pt 0`;
  const hrMargin = `${hr.marginPt}pt 0`;
  
  // FIXED: Process line by line to properly handle **## Section X** pattern
  const lines = text.split('\n');
  const processedLines: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip empty lines and horizontal rules
    if (!trimmed) {
      processedLines.push('');
      continue;
    }
    if (/^-{3,}$/.test(trimmed)) {
      processedLines.push(`<hr style="margin:${hrMargin};border:none;border-top:1px solid #ccc;">`);
      continue;
    }
    
    // Check for **## Section X: Title** pattern (AI-generated section headers)
    const sectionMatch = trimmed.match(/^\*\*##\s*Section\s*(\d+)\s*[:\s\-\u2013\u2014]*\s*(.*)?\*\*$/i);
    if (sectionMatch) {
      const sectionNum = sectionMatch[1];
      const titlePart = sectionMatch[2] ? sectionMatch[2].replace(/\*\*$/, '').trim() : '';
      const cleanTitle = `Section ${sectionNum}${titlePart ? ': ' + titlePart : ''}`;
      processedLines.push(`<strong style="display:block;margin:${sectionMargin};">${cleanTitle}</strong>`);
      continue;
    }
    
    // Check for ## Section X: Title pattern (without outer **)
    const plainSectionMatch = trimmed.match(/^##\s*Section\s*(\d+)\s*[:\s\-\u2013\u2014]*\s*(.*)$/i);
    if (plainSectionMatch) {
      const sectionNum = plainSectionMatch[1];
      const titlePart = plainSectionMatch[2] ? plainSectionMatch[2].trim() : '';
      const cleanTitle = `Section ${sectionNum}${titlePart ? ': ' + titlePart : ''}`;
      processedLines.push(`<strong style="display:block;margin:${sectionMargin};">${cleanTitle}</strong>`);
      continue;
    }
    
    // Check for other **## Header** patterns (non-section headers)
    const boldHeaderMatch = trimmed.match(/^\*\*##\s*(.+?)\*\*$/);
    if (boldHeaderMatch) {
      const cleanHeader = boldHeaderMatch[1].trim();
      processedLines.push(`<strong style="display:block;margin:${sectionMargin};">${cleanHeader}</strong>`);
      continue;
    }
    
    // Check for plain ## Header patterns
    const plainHeaderMatch = trimmed.match(/^##\s*(.+)$/);
    if (plainHeaderMatch) {
      const cleanHeader = plainHeaderMatch[1].trim();
      processedLines.push(`<strong style="display:block;margin:${sectionMargin};">${cleanHeader}</strong>`);
      continue;
    }
    
    // Process bold text within the line - strip any ## inside bold markers
    let processedLine = trimmed;
    // Replace **## text** with just **text** (bold with ## inside)
    processedLine = processedLine.replace(/\*\*##\s*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Replace remaining **text** with bold
    processedLine = processedLine.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Handle bullet character
    processedLine = processedLine.replace(/\x95/g, '•');
    
    processedLines.push(processedLine);
  }
  
  // Join lines and handle paragraph breaks
  let html = processedLines.join('\n');
  
  // Convert double newlines to paragraph breaks, single newlines to <br>
  html = html
    .replace(/\n\n+/g, '<br><br>')
    .replace(/\n/g, '<br>');
  
  // Clean up excessive breaks
  html = html.replace(/(<br>){3,}/g, '<br><br>');
  
  return html;
}

export const LESSON_CONTENT_CONTAINER_CLASSES = `
  text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[600px]
  md:[&::-webkit-scrollbar]:w-4 md:[&::-webkit-scrollbar-track]:bg-gray-200
  md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-sky-400
  md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:border-2
  md:[&::-webkit-scrollbar-thumb]:border-gray-200 hover:md:[&::-webkit-scrollbar-thumb]:bg-sky-500
`.trim().replace(/\s+/g, ' ');

export const LESSON_CONTENT_CONTAINER_STYLES: React.CSSProperties = {
  lineHeight: String(body.lineHeight),
  scrollbarWidth: "thick",
  scrollbarColor: "#38bdf8 #e5e7eb"
};
