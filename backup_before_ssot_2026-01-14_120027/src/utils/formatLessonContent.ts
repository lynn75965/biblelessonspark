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
 * Updated: January 2026
 * - Added legacy content normalization for consistent display
 * - Converts ## headers to **Bold:** format
 * - Converts numbered lists to parentheses format to avoid list styling
 * - Exported normalizeLegacyContent for use in other components
 */
import React from "react";

/**
 * Labels that should be rendered as bold
 * Used for legacy content normalization (## Label → **Label:**)
 */
const BOLD_LABELS = [
  "Theological Profile", "Lesson Summary", "Main Theme", "Key Takeaway", "Audience Insight",
  "Learning Objectives", "Primary Scripture", "Primary Scripture Passage", "Supporting Passages",
  "Teacher Preparation Checklist", "Memory Verse", "Gospel Connection", "Weekly Challenge",
  "Doctrinal Framework", "Theological Significance", "Interpretive Framework", "Literary Context",
  "Historical Context", "Transition Statement", "Key Idea", "Key Truth", "Big Points",
  "Big Points to Remember", "Reflection Questions", "Personal Reflection", "Personal Reflection Questions",
  "Prayer Prompt", "Prayer", "Comprehension Check", "Spiritual Indicators", "Closing Reflection",
  "Discussion Questions", "Recall", "Understanding", "Application", "Analysis",
  "This Week's Challenge", "Comprehension Questions", "Application Questions", "Recall Questions",
  "Understanding Questions", "Comprehension Indicators", "Spiritual Reflection", "Spiritual Application Indicators"
];

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
 * Escape special regex characters in a string
 */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Normalize legacy lesson content to new format
 * Converts old markdown patterns to new bold format for consistent display
 * 
 * Transforms:
 * - ## Label or # Label → **Label:**
 * - Plain 1. 2. 3. at line start → **1)** **2)** **3)** (parentheses to avoid list styling)
 * 
 * @param text - Raw content string
 * @returns Normalized content string
 */
export function normalizeLegacyContent(text: string): string {
  if (!text) return text;
  
  let normalized = text;
  
  // Convert ## Label or # Label to **Label:** for known labels
  BOLD_LABELS.forEach(label => {
    // Match ## Label or # Label (with or without trailing colon) at start of line
    // Case insensitive matching
    const hashPattern = new RegExp(`^(#{1,2})\\s*(${escapeRegExp(label)}):?\\s*$`, 'gmi');
    normalized = normalized.replace(hashPattern, `**${label}:**`);
    
    // Handle case where ## Label is followed by content on same line
    const hashWithContentPattern = new RegExp(`^(#{1,2})\\s*(${escapeRegExp(label)}):?\\s+(.+)$`, 'gmi');
    normalized = normalized.replace(hashWithContentPattern, `**${label}:** $3`);
  });
  
  // Convert numbered lists to parentheses format to avoid triggering list CSS styling
  // Handles various formats:
  // - "1. Question" → "**1)** Question"
  // - "**1.** Question" → "**1)** Question"
  // - "1. **Recall:** Question" → "**1)** **Recall:** Question"
  
  // First normalize any existing bold number formats
  normalized = normalized.replace(/^\*\*(\d+)\.\*\*\s*/gm, '**$1)** ');
  normalized = normalized.replace(/^\*\*(\d+)\)\*\*\s*/gm, '**$1)** ');
  
  // Then convert plain numbered lists (1. 2. 3.) to bold parentheses format
  normalized = normalized.replace(/^(\d+)\.\s+/gm, '**$1)** ');
  
  return normalized;
}

/**
 * Converts markdown-style lesson content to HTML for screen display
 * Uses Tailwind CSS classes for styling
 *
 * Handles:
 * - Legacy content normalization (## headers → **bold:**)
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
  
  // Step 3: Normalize legacy content (## headers → **bold:**, 1. → **1)**)
  text = normalizeLegacyContent(text);
  
  // Step 4: Apply markdown to HTML conversions
  return text
    // Convert any remaining ## headers to styled h2 elements (fallback)
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
  
  // Step 3: Normalize legacy content
  text = normalizeLegacyContent(text);
  
  // Step 4: Apply markdown to HTML conversions with inline styles
  return text
    // Convert any remaining ## headers to h2 with inline styles (fallback)
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
