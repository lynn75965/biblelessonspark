// ============================================================================
// buildCoverPage.ts
// Location: src/utils/export/buildCoverPage.ts
//
// Shared cover page data builder used by both buildSeriesDocx and
// buildSeriesPdf. Returns a structured CoverPageData object so both
// builders can render the same content without duplicating logic.
//
// Cover page layout (top to bottom):
//   [Series Title -- 24pt]
//   [Subtitle: "A BibleLessonSpark Curriculum Series" -- 14pt]
//   [Horizontal rule]
//   [Teacher name line]
//   [Church/org name line]
//   [Date range line]
//   [Lesson count line]
// ============================================================================

import type { LessonSeries } from '@/constants/seriesConfig';
import type { Lesson } from '@/constants/contracts';
import {
  SERIES_COVER_COPY,
} from '@/constants/seriesExportConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface CoverPageData {
  /** Series title (24pt on cover) */
  seriesTitle: string;
  /** Fixed subtitle line */
  subtitle: string;
  /** "Prepared by {teacherName}" or omitted if name unavailable */
  teacherLine: string | null;
  /** "For {churchName}" or omitted if org name unavailable */
  churchLine: string | null;
  /** Date range derived from lesson created_at timestamps */
  dateRangeLine: string | null;
  /** "X Lessons" */
  lessonCountLine: string;
}

// ============================================================================
// BUILDER
// ============================================================================

/**
 * Build the structured data for the cover page.
 *
 * @param series - The LessonSeries record
 * @param lessons - Ordered array of full Lesson records
 * @param teacherName - Display name from the user's profile (full_name)
 * @param churchName - Organization name (if the user belongs to one)
 */
export function buildCoverPageData(
  series: LessonSeries,
  lessons: Lesson[],
  teacherName: string | null,
  churchName: string | null
): CoverPageData {
  const seriesTitle = series.series_name;
  const subtitle = SERIES_COVER_COPY.subtitle;

  const teacherLine = teacherName
    ? `${SERIES_COVER_COPY.teacherLabel} ${teacherName}`
    : null;

  const churchLine = churchName
    ? `${SERIES_COVER_COPY.churchLabel} ${churchName}`
    : null;

  const dateRangeLine = buildDateRange(lessons);

  const lessonCountLine = `${lessons.length} ${lessons.length === 1 ? 'Lesson' : 'Lessons'}`;

  return {
    seriesTitle,
    subtitle,
    teacherLine,
    churchLine,
    dateRangeLine,
    lessonCountLine,
  };
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Derive a human-readable date range from lesson created_at timestamps.
 * Returns null if no lessons have timestamps.
 * Example: "January 2026 \u2013 March 2026"
 */
function buildDateRange(lessons: Lesson[]): string | null {
  const timestamps = lessons
    .map((l) => l.created_at)
    .filter((t): t is string => t !== null && t !== undefined)
    .map((t) => new Date(t).getTime())
    .filter((t) => !isNaN(t));

  if (timestamps.length === 0) return null;

  const earliest = new Date(Math.min(...timestamps));
  const latest = new Date(Math.max(...timestamps));

  const fmt = (d: Date): string =>
    d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (earliest.getMonth() === latest.getMonth() &&
      earliest.getFullYear() === latest.getFullYear()) {
    return fmt(earliest);
  }

  return `${fmt(earliest)} \u2013 ${fmt(latest)}`;
}
