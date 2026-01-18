/**
 * formatLessonContent.ts
 * SSOT COMPLIANT: All values imported from lessonStructure.ts
 * NO hardcoded spacing/font values - frontend drives backend
 */
import React from "react";
import { EXPORT_FORMATTING, EXPORT_SPACING } from "../constants/lessonStructure";

// Destructure SSOT values
const { sectionHeader, body, hr, listItem, colors } = EXPORT_SPACING;

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
    .replace(/^[\-\*]{3,}$/gm, `<hr style="margin: ${hr.marginPt}pt 0; border: none; border-top: 1px solid #${colors.hrLine};">`)
    .replace(/```[a-z]*\n?/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>');
  html = html.replace(/(<li>.*?<\/li>)(\s*<br>\s*)?(<li>)/g, '$1$3');
  html = html.replace(/(<li>.*?<\/li>)+/g, `<ul style="margin: ${listItem.afterPt}pt 0 ${listItem.afterPt}pt ${listItem.indentPt}pt; padding: 0;">$&</ul>`);
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
 * Format for print - uses SSOT values from EXPORT_SPACING
 */
export function formatLessonContentForPrint(content: string | null | undefined): string {
  if (!content) return "";
  let text = normalizeLineEndings(content);
  text = ensureLineBreaks(text);
  text = normalizeLegacyContent(text);
  
  // SSOT spacing values
  const sectionMargin = `${sectionHeader.beforePt}pt 0 ${sectionHeader.afterPt}pt 0`;
  const hrMargin = `${hr.marginPt}pt 0`;
  
  let html = text
    .replace(/## (.*?)(?=\n|$)/g, `<strong style="display:block;margin:${sectionMargin};">$1</strong>`)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n?---\n?/g, `<hr style="margin:${hrMargin};border:none;border-top:1px solid #${colors.hrLine};">`)
    .replace(/\x95/g, "•")
    .replace(/\n\n/g, "<br>")
    .replace(/\n/g, "<br>");
  
  html = html.replace(/(<br>){3,}/g, '<br><br>');
  html = html.replace(/<strong>(Section\s+\d+[:\s])/gi, `<strong style="display:block;margin:${sectionMargin};">$1`);
  
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
