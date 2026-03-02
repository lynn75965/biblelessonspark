// ============================================================================
// buildHandoutBooklet.ts
// Location: src/utils/export/buildHandoutBooklet.ts
//
// Phase B: Extracts Section 8 (Student Handout) content from each lesson
// and returns structured handout data for the booklet appendix.
//
// Used by both buildSeriesDocx and buildSeriesPdf to:
//   1. Compile all Section 8 content into an ordered array
//   2. Each entry gets a page break before it (tear-out friendly)
//
// SMART SECTION 8 OMISSION:
//   When options.omitSection8FromChapters is true, the lesson chapter
//   builders call extractSection8Content() to strip Section 8 from the
//   per-lesson content before rendering. The booklet builder then
//   assembles the stripped content here.
// ============================================================================

import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';
import {
  SERIES_HANDOUT_COPY,
  STUDENT_HANDOUT_SECTION_NUMBER,
} from '@/constants/seriesExportConfig';
import { EXPORT_FORMATTING } from '@/constants/lessonStructure';

// ============================================================================
// TYPES
// ============================================================================

export interface HandoutEntry {
  /** 1-based lesson number */
  lessonNumber: number;
  /** Header: "Lesson {n}: {Title}" */
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
 *
 * @param series - The LessonSeries record
 * @param lessons - Ordered array of full Lesson records
 */
export function buildHandoutBookletData(
  series: LessonSeries,
  lessons: Lesson[]
): HandoutBookletData {
  const entries: HandoutEntry[] = lessons.map((lesson, index) => {
    const lessonNumber = index + 1;
    const title = lesson.title ?? `Lesson ${lessonNumber}`;
    const passage = resolvePassage(lesson, series, lessonNumber);
    const header = `${SERIES_HANDOUT_COPY.handoutHeaderPrefix} ${lessonNumber}: ${title}`;

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
// SECTION 8 EXTRACTION
// ============================================================================

/**
 * Extract Section 8 (Student Handout) content from a lesson's text.
 *
 * The lesson content (original_text or shaped_content) is a single
 * markdown-formatted string. Section 8 is identified by its heading
 * pattern. Returns null if Section 8 is not found.
 *
 * SSOT: Uses EXPORT_FORMATTING.section8Title for the heading match pattern.
 * This mirrors the pattern used in exportToDocx.ts and exportToPdf.ts.
 */
export function extractSection8Content(lesson: Lesson): string | null {
  const rawContent = lesson.shaped_content ?? lesson.original_text;
  if (!rawContent) return null;

  // Match "Section 8" heading (with or without colon, case-insensitive)
  // and capture everything until the next "Section N" heading or end of string.
  // This mirrors the heading detection logic in the existing export utilities.
  const section8Pattern = /(?:^|\n)(#{1,3}\s*)?Section\s+8\b[^\n]*\n([\s\S]*?)(?=\n(?:#{1,3}\s*)?Section\s+\d+\b|\s*$)/i;

  const match = rawContent.match(section8Pattern);
  if (!match) return null;

  return match[2].trim();
}

/**
 * Return lesson content with Section 8 stripped out.
 * Used by chapter builders when omitSection8FromChapters is true.
 */
export function stripSection8FromContent(content: string): string {
  // Remove from "Section 8" heading to the next "Section N" heading or end
  return content
    .replace(
      /\n(?:#{1,3}\s*)?Section\s+8\b[^\n]*\n[\s\S]*?(?=\n(?:#{1,3}\s*)?Section\s+\d+\b|\s*$)/i,
      ''
    )
    .trim();
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Resolve the passage reference for a lesson (same logic as buildToc.ts).
 */
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

/** Placeholder shown when a lesson has no Section 8 content */
const HANDOUT_PLACEHOLDER =
  'Student handout content was not available for this lesson. ' +
  'Please generate the lesson again to include a student handout.';
