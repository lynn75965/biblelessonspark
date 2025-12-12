/**
 * formatLessonContent.ts
 *
 * SINGLE SOURCE OF TRUTH for lesson content HTML formatting.
 *
 * This utility converts markdown-style lesson content to formatted HTML.
 * Used by: EnhanceLessonForm, AllLessonsPanel, LessonExportButtons, and any future lesson viewers.
 *
 * SSOT Compliance:
 * - One location for all lesson content formatting logic
 * - Any changes here apply everywhere lessons are displayed
 * - Supports potential export from Lovable.dev (pure TypeScript, no dependencies)
 *
 * Updated: December 2025
 * - Added line ending normalization for cross-platform compatibility
 * - Added pre-processing to handle content lacking line breaks
 */
import React from "react";

/**
 * Normalizes line endings to Unix-style (\n)
 * Handles Windows (\r\n), old Mac (\r), and mixed formats
 */
function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Pre-processes content to ensure markdown markers have proper line breaks
 * Handles AI-generated content that may lack line breaks between sections
 */
function ensureLineBreaks(text: string): string {
  return text
    // Add line break before ## if preceded by non-whitespace (except at start)
    .replace(/([^\s])(\s*## )/g, '$1\n\n$2')
    // Add line breaks around --- separators if missing
    .replace(/([^\n])(\s*---\s*)/g, '$1\n$2')
    .replace(/(---\s*)([^\n])/g, '$1\n$2')
    // Clean up any excessive whitespace
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Converts markdown-style lesson content to HTML for screen display
 * Uses Tailwind CSS classes for styling
 *
 * Handles:
 * - ## headers → <h2> with Tailwind classes
 * - **bold** → <strong>
 * - --- horizontal rules → styled <hr> with Tailwind classes
 * - Bullet character preservation
 * - Line break handling
 * - Content with missing line breaks (AI-generated)
 *
 * @param content - Raw lesson content (original_text from database)
 * @returns HTML string safe for dangerouslySetInnerHTML
 */
export function formatLessonContentToHtml(content: string | null | undefined): string {
  if (!content) return "";
  
  // Step 1: Normalize line endings (handles Windows \r\n, old Mac \r)
  let text = normalizeLineEndings(content);
  
  // Step 2: Ensure markdown markers have line breaks (handles AI content)
  text = ensureLineBreaks(text);
  
  // Step 3: Apply markdown to HTML conversions
  return text
    // Convert ## headers to styled h2 elements
    .replace(
      /## (.*?)(?=\n|$)/g,
      '<h2 class="text-lg font-bold mt-4 mb-2 text-primary">$1</h2>'
    )
    // Convert **bold** to strong elements
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Convert --- horizontal rules to styled hr elements
    .replace(
      /\n?---\n?/g,
      '<hr class="my-4 border-t-2 border-muted-foreground/30">'
    )
    // Preserve bullet character (if present)
    .replace(/\x95/g, "•")
    // Convert double newlines to paragraph breaks
    .replace(/\n\n/g, "</p><p class='mt-2'>")
    // Convert single newlines to line breaks
    .replace(/\n/g, "<br>")
    // Wrap in paragraph tags
    .replace(/^(.*)$/, "<p>$1</p>")
    // Clean up empty paragraphs
    .replace(/<p><\/p>/g, "")
    .replace(/<p class='mt-2'><\/p>/g, "");
}

/**
 * Converts markdown-style lesson content to HTML for print/export
 * Uses inline styles instead of Tailwind classes for cross-browser print compatibility
 *
 * @param content - Raw lesson content (original_text from database)
 * @returns HTML string with inline styles for printing
 */
export function formatLessonContentForPrint(content: string | null | undefined): string {
  if (!content) return "";
  
  // Step 1: Normalize line endings
  let text = normalizeLineEndings(content);
  
  // Step 2: Ensure markdown markers have line breaks
  text = ensureLineBreaks(text);
  
  // Step 3: Apply markdown to HTML conversions with inline styles
  return text
    // Convert ## headers to h2 with inline styles
    .replace(
      /## (.*?)(?=\n|$)/g,
      '<h2 style="font-size:1.125rem;font-weight:bold;margin-top:1rem;margin-bottom:0.5rem;color:#1e40af;">$1</h2>'
    )
    // Convert **bold** to strong elements
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Convert --- horizontal rules with inline styles
    .replace(
      /\n?---\n?/g,
      '<hr style="margin:1rem 0;border-top:2px solid #d1d5db;">'
    )
    // Preserve bullet character
    .replace(/\x95/g, "•")
    // Convert newlines to breaks
    .replace(/\n\n/g, "<br><br>")
    .replace(/\n/g, "<br>");
}

/**
 * Container classes for lesson content display (screen)
 * Use these classes on the wrapper div for consistent appearance
 */
export const LESSON_CONTENT_CONTAINER_CLASSES = `
  text-sm bg-muted p-4 rounded-lg overflow-auto max-h-[600px]
  md:[&::-webkit-scrollbar]:w-4 md:[&::-webkit-scrollbar-track]:bg-gray-200
  md:[&::-webkit-scrollbar-track]:rounded-full md:[&::-webkit-scrollbar-thumb]:bg-sky-400
  md:[&::-webkit-scrollbar-thumb]:rounded-full md:[&::-webkit-scrollbar-thumb]:border-2
  md:[&::-webkit-scrollbar-thumb]:border-gray-200 hover:md:[&::-webkit-scrollbar-thumb]:bg-sky-500
`.trim().replace(/\s+/g, ' ');

/**
 * Inline styles for lesson content container (screen)
 * Apply via style prop for scrollbar customization
 */
export const LESSON_CONTENT_CONTAINER_STYLES: React.CSSProperties = {
  lineHeight: "1.6",
  scrollbarWidth: "thick",
  scrollbarColor: "#38bdf8 #e5e7eb"
};