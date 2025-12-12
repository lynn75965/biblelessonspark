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
 * - Added formatLessonContentForPrint() for print/export (inline styles)
 */

import React from "react";

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
 * 
 * @param content - Raw lesson content (original_text from database)
 * @returns HTML string safe for dangerouslySetInnerHTML
 */
export function formatLessonContentToHtml(content: string | null | undefined): string {
  if (!content) return "";
  
  return content
    // Convert ## headers to styled h2 elements
    .replace(
      /## (.*?)(?=\n|$)/g,
      '<h2 class="text-base font-bold mt-2 mb-1">$1</h2>'
    )
    // Convert **bold** to strong elements
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Convert --- horizontal rules to styled hr elements
    .replace(
      /\n---\n/g,
      '<hr class="my-1.5 border-t border-muted-foreground/20">'
    )
    // Preserve bullet character (if present)
    .replace(/\x95/g, "•")
    // Convert double newlines to breaks
    .replace(/\n\n/g, "<br><br>")
    // Convert single newlines to breaks
    .replace(/\n/g, "<br>");
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
  
  return content
    // Convert ## headers to h2 with inline styles
    .replace(/## (.*?)(?=\n|$)/g, "<h2>$1</h2>")
    // Convert **bold** to strong elements
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    // Convert --- horizontal rules with inline margin
    .replace(/\n---\n/g, '<hr style="margin:18px 0">')
    // Preserve bullet character
    .replace(/\x95/g, "•")
    // Convert newlines to breaks
    .replace(/\n/g, "<br>");
}

/**
 * Container classes for lesson content display (screen)
 * Use these classes on the wrapper div for consistent appearance
 */
export const LESSON_CONTENT_CONTAINER_CLASSES = `
  whitespace-pre-wrap text-sm bg-muted p-2.5 rounded-lg overflow-auto max-h-[600px]
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
  lineHeight: "1.3",
  scrollbarWidth: "thick",
  scrollbarColor: "#38bdf8 #e5e7eb"
};
