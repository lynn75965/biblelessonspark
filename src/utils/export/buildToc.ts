// ============================================================================
// buildToc.ts
// Location: src/utils/export/buildToc.ts
//
// Shared Table of Contents data builder used by both buildSeriesDocx and
// buildSeriesPdf. Returns a structured TocEntry array so both builders
// can render the same content without duplicating logic.
//
// TOC entry format:
//   Lesson {n}: {Title}
//   {Passage reference}
// ============================================================================

import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface TocEntry {
  /** 1-based lesson number */
  lessonNumber: number;
  /** Full chapter heading: "Lesson 1: Title" */
  chapterHeading: string;
  /** Passage reference (e.g., "John 3:16-17") or empty string */
  passage: string;
}

// ============================================================================
// BUILDER
// ============================================================================

/**
 * Build the ordered TOC entries from the series and its lessons.
 *
 * @param series - The LessonSeries record (provides lesson_summaries for ordering)
 * @param lessons - Ordered array of full Lesson records
 */
export function buildTocEntries(
  series: LessonSeries,
  lessons: Lesson[]
): TocEntry[] {
  return lessons.map((lesson, index) => {
    const lessonNumber = index + 1;
    const title = lesson.title ?? `Lesson ${lessonNumber}`;
    const passage = resolvePassage(lesson, series, lessonNumber);

    return {
      lessonNumber,
      chapterHeading: `Lesson ${lessonNumber}: ${title}`,
      passage,
    };
  });
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Resolve the passage reference for a lesson.
 * Priority: lesson.filters.passage -> series.lesson_summaries[n].passage
 * -> series.bible_passage -> empty string
 */
function resolvePassage(
  lesson: Lesson,
  series: LessonSeries,
  lessonNumber: number
): string {
  // 1. Lesson-level passage from filters
  if (lesson.filters?.passage) {
    return lesson.filters.passage;
  }

  // 2. Lesson summary passage (stored on the series)
  const summary = series.lesson_summaries?.find(
    (s) => s.lessonNumber === lessonNumber
  );
  if (summary?.passage) {
    return summary.passage;
  }

  // 3. Series-level passage (applies to all lessons in passage-based series)
  if (series.bible_passage) {
    return series.bible_passage;
  }

  return '';
}
