// ============================================================================
// buildToc.ts
// Location: src/utils/export/buildToc.ts
//
// Shared Table of Contents data builder used by both buildSeriesDocx and
// buildSeriesPdf.
//
// TOC entry format:
//   Lesson {n}: {Creative Title}
//   {Passage reference}
//
// UPDATED: Uses extractCreativeTitle() from buildHandoutBooklet.ts to show
// the AI-generated creative title (e.g., "The King Above All Kings") as the
// primary heading, with the passage reference as secondary metadata.
// ============================================================================

import type { Lesson } from '@/constants/contracts';
import type { LessonSeries } from '@/constants/seriesConfig';
import { extractCreativeTitle } from './buildHandoutBooklet';

// ============================================================================
// TYPES
// ============================================================================

export interface TocEntry {
  /** 1-based lesson number */
  lessonNumber: number;
  /** Full chapter heading: "Lesson 1: Creative Title" */
  chapterHeading: string;
  /** Passage reference (e.g., "John 3:16-17") or empty string */
  passage: string;
}

// ============================================================================
// BUILDER
// ============================================================================

/**
 * Build the ordered TOC entries from the series and its lessons.
 */
export function buildTocEntries(
  series: LessonSeries,
  lessons: Lesson[]
): TocEntry[] {
  return lessons.map((lesson, index) => {
    const lessonNumber = index + 1;
    const creativeTitle = extractCreativeTitle(lesson) ?? lesson.title ?? ('Lesson ' + lessonNumber);
    const passage = resolvePassage(lesson, series, lessonNumber);

    return {
      lessonNumber,
      chapterHeading: 'Lesson ' + lessonNumber + ': ' + creativeTitle,
      passage,
    };
  });
}

// ============================================================================
// HELPERS
// ============================================================================

function resolvePassage(
  lesson: Lesson,
  series: LessonSeries,
  lessonNumber: number
): string {
  if (lesson.filters?.passage) {
    return lesson.filters.passage;
  }

  const summary = series.lesson_summaries?.find(
    (s) => s.lessonNumber === lessonNumber
  );
  if (summary?.passage) {
    return summary.passage;
  }

  if (series.bible_passage) {
    return series.bible_passage;
  }

  return '';
}
