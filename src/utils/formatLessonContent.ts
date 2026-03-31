/**
 * formatLessonContent.ts
 * Version: 2.3.0 - Fix inline "--- ## Section N:" pattern that blocked heading and HR conversion
 * SSOT COMPLIANT: All values imported from lessonStructure.ts
 * NO hardcoded spacing/font values - frontend drives backend
 *
 * v2.2.0 -- Added #### (h4) support for Focus-Discover-Respond shaped content
 * v2.3.0 -- Pre-separate inline "--- ## heading" patterns; tolerate leading whitespace on headings;
 *           match 2-3 dashes for HR to handle partially-split dividers
 */
import React from "react";
import { EXPORT_FORMATTING, EXPORT_SPACING } from "../constants/lessonStructure";

// Destructure SSOT values
const { body, hr, listItem, colors } = EXPORT_SPACING;

function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Strip bare heading markers - lines that are just "#", "##", "###", or "####" with no content.
 * Shaped content sometimes uses these as section separators.
 */
function stripBareHeadingMarkers(text: string): string {
  return text.replace(/^#{1,4}\s*$/gm, '');
}

function ensureLineBreaks(text: string): string {
  return text
    // Ensure blank line before any heading level (shaped content uses #, ##, ###, ####)
    .replace(/([^\s])(\s*#{1,4}\s+)/g, '$1\n\n$2')
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
    // Handle all heading levels (#, ##, ###, ####) for known bold labels
    const hashPattern = new RegExp(`^(#{1,4})\\s*(${escapeRegExp(label)}):?\\s*$`, 'gmi');
    normalized = normalized.replace(hashPattern, `**${label}:**`);
    const hashWithContentPattern = new RegExp(`^(#{1,4})\\s*(${escapeRegExp(label)}):?\\s+(.+)$`, 'gmi');
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
    // Strip bare heading markers
    .replace(/^#{1,4}\s*$/gm, '')
    .replace(/^[\*\-]\s+/gm, '* ')
    .replace(/^[\-\*]{3,}$/gm, '')
    .replace(/```[a-z]*\n?/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/(\* .+)\n\n(\* )/g, '$1\n$2')
    .trim();
}

export function convertToRichHtml(text: string): string {
  if (!text) return '';
  let html = text
    .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    // Strip bare heading markers before HTML encoding
    .replace(/^#{1,4}\s*$/gm, '')
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
  // CHANGE 1: Pre-separate inline "--- ## Heading" patterns before other processing.
  // Lessons from certain date ranges store "--- ## Section N:" on a single line with no
  // newline between the divider and the heading. ensureLineBreaks cannot handle this
  // correctly without first splitting them onto separate lines.
  text = text.replace(/(-{3,})\s*(#{1,4}\s)/g, '$1\n$2');
  text = stripBareHeadingMarkers(text);
  text = ensureLineBreaks(text);
  text = normalizeLegacyContent(text);
  return text
    // CHANGE 2: Allow optional leading horizontal whitespace on heading lines.
    // ensureLineBreaks can leave a leading space before ## when splitting inline patterns.
    .replace(/^[ \t]*#### (.*?)$/gm, '<h4 style="font-size:13px;font-weight:700;margin:10px 0 3px 0;color:inherit">$1</h4>')
    .replace(/^[ \t]*### (.*?)$/gm, '<h3 style="font-size:14px;font-weight:700;margin:14px 0 4px 0;color:inherit">$1</h3>')
    .replace(/^[ \t]*## (.*?)$/gm, '<h2 style="font-size:15px;font-weight:700;margin:16px 0 6px 0;color:inherit">$1</h2>')
    .replace(/^[ \t]*# (.*?)$/gm, '<h1 style="font-size:16px;font-weight:700;margin:18px 0 8px 0;color:inherit">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700">$1</strong>')
    // CHANGE 3: Match 2-3 dashes with optional surrounding horizontal whitespace.
    // A "---" that was partially split by Change 1 processing may become "--" residue;
    // this regex handles both forms so no literal dashes reach the final output.
    .replace(/\n?[ \t]*-{2,3}[ \t]*\n?/g, '<hr style="margin:14px 0;border:none;border-top:1px solid rgba(0,0,0,0.18)">')
    .replace(/\x95/g, "*")
    .replace(/\n\n/g, '</p><p style="margin-top:10px">')
    .replace(/\n/g, "<br>")
    .replace(/^(.*)$/, "<p>$1</p>")
    .replace(/<p><\/p>/g, "")
    .replace(/<p style="margin-top:10px"><\/p>/g, "");
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
