// ============================================================================
// buildHandoutBooklet.ts
// Location: src/utils/export/buildHandoutBooklet.ts
//
// Phase B: Extracts Section 8 (Student Handout) content from each lesson
// and returns structured handout data for the booklet appendix.
//
// Also exports shared extraction utilities used by buildSeriesDocx,
// buildSeriesPdf, and buildToc:
//   - extractSection8Content() -- pulls Section 8 text from lesson content
//   - stripSection8FromContent() -- removes Section 8 from lesson content
//   - extractCreativeTitle() -- pulls the creative title from lesson content
//
// SSOT: Uses STUDENT_HANDOUT_HEADING_REGEX from lessonShapeProfiles.ts
// for heading detection (handles all shaped + original formats).
// ============================================================================

import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  SERIES_HANDOUT_COPY,
  STUDENT_HANDOUT_SECTION_NUMBER,
} from '@/constants/seriesExportConfig';
import { STUDENT_HANDOUT_HEADING_REGEX } from '@/constants/lessonShapeProfiles';

// ============================================================================
// TYPES
// ============================================================================

export interface HandoutEntry {
  /** 1-based lesson number */
  lessonNumber: number;
  /** Header: "Lesson {n}: {CreativeTitle}" */
  header: string;
  /** Passage reference */
  passage: string;
  /** Raw Section 8 content text (markdown-formatted from lesson generation) */
  content: string;
}

export interface HandoutBookletData {
  /** Appendix title */
  appendixTitle: string;
  /** Appendix subtitle */
  appendixSubtitle: string;
  /** Ordered handout entries (one per lesson) */
  entries: HandoutEntry[];
}

// ============================================================================
// BUILDER
// ============================================================================

/**
 * Build the structured handout booklet data from all lessons in the series.
 * Lessons with no Section 8 content are included with a placeholder note.
 */
export function buildHandoutBookletData(
  series: LessonSeries,
  lessons: Lesson[]
): HandoutBookletData {
  const entries: HandoutEntry[] = lessons.map((lesson, index) => {
    const lessonNumber = index + 1;
    const creativeTitle = extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNumber);
    const passage = resolvePassage(lesson, series, lessonNumber);
    const header = SERIES_HANDOUT_COPY.handoutHeaderPrefix + ' ' + lessonNumber + ': ' + creativeTitle;

    const section8Content = extractSection8Content(lesson);

    return {
      lessonNumber,
      header,
      passage,
      content: section8Content ?? HANDOUT_PLACEHOLDER,
    };
  });

  return {
    appendixTitle: SERIES_HANDOUT_COPY.appendixTitle,
    appendixSubtitle: SERIES_HANDOUT_COPY.appendixSubtitle,
    entries,
  };
}

// ============================================================================
// CREATIVE TITLE EXTRACTION
// ============================================================================

/**
 * Extract the creative lesson title from lesson content.
 *
 * The AI generates a creative title (e.g., "The King Above All Kings")
 * that is distinct from lesson.title (which stores the passage reference).
 *
 * Search priority:
 *   1. Lesson Title label pattern (original format, Section 1)
 *   2. First bold line near the top of content
 *   3. First markdown heading that is not a Section header
 *   4. Returns null (caller falls back to lesson.title)
 */
export function extractCreativeTitle(lesson: Lesson): string | null {
  const rawContent = lesson.shaped_content ?? lesson.original_text;
  if (!rawContent) return null;

  // Pattern 1: **Lesson Title:** The Creative Title Here
  const titleLabelMatch = rawContent.match(
    /\*\*Lesson\s+Title[:\s]*\*\*[:\s]*([^\n]+)/i
  );
  if (titleLabelMatch) {
    return titleLabelMatch[1].trim().replace(/\*\*/g, '');
  }

  // Pattern 2: First bold-only line near the top (within first 500 chars)
  const topContent = rawContent.slice(0, 500);
  const boldLineMatch = topContent.match(
    /(?:^|\n)\*\*([^*\n]{10,})\*\*\s*(?:\n|$)/
  );
  if (boldLineMatch) {
    return boldLineMatch[1].trim();
  }

  // Pattern 3: First markdown heading that is NOT a "Section N" header
  const headingMatch = rawContent.match(
    /(?:^|\n)#{1,3}\s+(?!Section\s+\d)([^\n]+)/
  );
  if (headingMatch) {
    return headingMatch[1].trim().replace(/\*\*/g, '');
  }

  return null;
}

// ============================================================================
// SECTION 8 EXTRACTION
// ============================================================================

/**
 * Extract Section 8 (Student Handout) content from a lesson's text.
 *
 * SSOT: Uses STUDENT_HANDOUT_HEADING_REGEX from lessonShapeProfiles.ts
 * to detect the heading in all formats:
 *   - "## Section 8: Student Handout" (original)
 *   - "STUDENT HANDOUT" (shaped)
 *   - "Student Handout" (mixed)
 *
 * Returns null if Section 8 is not found.
 */
export function extractSection8Content(lesson: Lesson): string | null {
  const rawContent = lesson.shaped_content ?? lesson.original_text;
  if (!rawContent) return null;

  const lines = rawContent.split('\n');
  let headingIndex = -1;

  // Primary: use SSOT regex from lessonShapeProfiles.ts
  for (let i = 0; i < lines.length; i++) {
    if (STUDENT_HANDOUT_HEADING_REGEX.test(lines[i].trim())) {
      headingIndex = i;
      break;
    }
  }

  // Fallback: broader "Section 8" match
  if (headingIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (/Section\s+8\b/i.test(lines[i])) {
        headingIndex = i;
        break;
      }
    }
  }

  if (headingIndex === -1) return null;

  // Capture everything after heading until next section or end
  const contentLines: string[] = [];
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    // Stop at next "Section N" heading
    if (/^(?:#{1,3}\s*)?Section\s+\d+\b/i.test(line.trim())) break;
    // Stop at STUDENT TEASER heading (Section 9)
    if (/^(?:#{1,3}\s*)?(?:STUDENT\s+TEASER|Student\s+Teaser)\b/i.test(line.trim())) break;
    contentLines.push(line);
  }

  const result = contentLines.join('\n').trim();
  return result.length > 0 ? result : null;
}

/**
 * Return lesson content with Section 8 stripped out.
 * Used by chapter builders when omitSection8FromChapters is true.
 *
 * SSOT: Uses STUDENT_HANDOUT_HEADING_REGEX for heading detection.
 */
export function stripSection8FromContent(content: string): string {
  if (!content) return content;

  const lines = content.split('\n');
  let headingIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (STUDENT_HANDOUT_HEADING_REGEX.test(lines[i].trim())) {
      headingIndex = i;
      break;
    }
  }

  // Fallback: broader "Section 8" match
  if (headingIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      if (/Section\s+8\b/i.test(lines[i])) {
        headingIndex = i;
        break;
      }
    }
  }

  if (headingIndex === -1) return content;

  // Find where Section 8 ends
  let endIndex = lines.length;
  for (let i = headingIndex + 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (/^(?:#{1,3}\s*)?Section\s+\d+\b/i.test(line)) {
      endIndex = i;
      break;
    }
    if (/^(?:#{1,3}\s*)?(?:STUDENT\s+TEASER|Student\s+Teaser)\b/i.test(line)) {
      endIndex = i;
      break;
    }
  }

  const before = lines.slice(0, headingIndex);
  const after = lines.slice(endIndex);
  return [...before, ...after].join('\n').trim();
}

// ============================================================================
// HELPERS
// ============================================================================

function resolvePassage(
  lesson: Lesson,
  series: LessonSeries,
  lessonNumber: number
): string {
  if (lesson.filters?.passage) return lesson.filters.passage;

  const summary = series.lesson_summaries?.find(
    (s) => s.lessonNumber === lessonNumber
  );
  if (summary?.passage) return summary.passage;

  if (series.bible_passage) return series.bible_passage;

  return '';
}

const HANDOUT_PLACEHOLDER =
  'Group handout content was not available for this lesson. ' +
  'Please generate the lesson again to include a group handout.';
