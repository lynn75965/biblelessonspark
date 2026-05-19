/**
 * lessonDeletion.ts -- Session C (May 19, 2026)
 *
 * Pure helpers for cascade-aware lesson deletion. No React, no Supabase.
 *
 * Sessions A and B turned reshapes into first-class lessons rows with a
 * reshape_of back-link to the parent. Before Session C, deleting an
 * original lesson left its reshape children orphaned (reshape_of -> NULL
 * via ON DELETE SET NULL) without any user warning. This module composes
 * the cascade-info, confirmation-dialog text, and success-toast wording
 * that the delete flow uses at every call site (library card + viewer
 * action row) so the wording stays identical.
 *
 * Title-extraction regex deliberately ignores curly quotes -- the deploy
 * ASCII guard rejects any non-ASCII source byte and the curly-quote case
 * is rare. If a title is wrapped in curly quotes they survive into the
 * dialog message intact -- still readable, still unambiguous.
 */

import type { Lesson } from "@/constants/contracts";

// Structural subset of LessonSeries so callers can pass anything that
// has these two fields without dragging in the full type.
export interface SeriesLite {
  id: string;
  series_name: string;
}

export interface CascadeInfo {
  lesson: Lesson;
  reshapeChildren: Lesson[];
  seriesName: string | null;
  isReshape: boolean;
}

/**
 * Find the "Lesson Title:" line in the body and return the rest of the
 * line. Mirrors the lookup LessonLibrary uses for card titles. Strips
 * surrounding straight quotes and bold markers; curly quotes pass
 * through unchanged (see file header).
 */
const extractTitleFromBody = (body: string | null | undefined): string | null => {
  if (!body) return null;
  const lines = body.split("\n");
  for (const line of lines) {
    const match = line.match(/^(?:\*\*)?Lesson Title:?(?:\*\*)?\s*"?(.+?)"?\s*$/i);
    if (match) {
      return match[1].replace(/["\*]/g, "").trim();
    }
  }
  return null;
};

const displayTitle = (l: Pick<Lesson, "title" | "original_text">): string => {
  const fromBody = extractTitleFromBody(l.original_text);
  if (fromBody) return fromBody;
  const fromRow = l.title?.trim();
  return fromRow ? fromRow : "Untitled Lesson";
};

/**
 * Build cascade info from already-loaded local data. No network calls.
 * A reshape (reshape_of != null) never has children of its own.
 * If a lesson's series_id refers to a series not in allSeries (e.g. the
 * series is archived and excluded from the IN_PROGRESS/COMPLETED filter
 * used by useSeriesManager), seriesName falls back to null and the
 * dialog uses the no-series branch -- intentional graceful degrade.
 */
export const buildCascadeInfo = (
  lesson: Lesson,
  allLessons: Lesson[],
  allSeries: SeriesLite[],
): CascadeInfo => {
  const isReshape = !!lesson.reshape_of;
  const reshapeChildren = isReshape
    ? []
    : allLessons.filter((l) => l.reshape_of === lesson.id);
  const seriesName = lesson.series_id
    ? (allSeries.find((s) => s.id === lesson.series_id)?.series_name ?? null)
    : null;
  return { lesson, reshapeChildren, seriesName, isReshape };
};

/**
 * Compose the full window.confirm() message. Single dialog with every
 * applicable warning -- never chain prompts (Rule DEL2).
 */
export const buildDeleteConfirmation = (info: CascadeInfo): string => {
  if (info.isReshape) {
    return info.seriesName
      ? `Deleting this reshape will remove it from the series "${info.seriesName}". The original lesson and other reshapes are not affected. This cannot be undone.`
      : `Delete this reshape permanently? The original lesson and other reshapes are not affected. This cannot be undone.`;
  }

  const title = displayTitle(info.lesson);
  const hasChildren = info.reshapeChildren.length > 0;
  const inSeries = !!info.seriesName;
  const childCount = info.reshapeChildren.length;
  const childPlural = childCount === 1 ? "reshape" : "reshapes";
  const childList = info.reshapeChildren
    .map((c) => `  - ${displayTitle(c)}`)
    .join("\n");

  if (inSeries && hasChildren) {
    return [
      `Deleting "${title}" will also:`,
      `- Remove it from the series "${info.seriesName}"`,
      `- Permanently delete ${childCount} ${childPlural}:`,
      childList,
      `This cannot be undone.`,
    ].join("\n");
  }
  if (inSeries) {
    return `Deleting "${title}" will remove it from the series "${info.seriesName}". This cannot be undone.`;
  }
  if (hasChildren) {
    return [
      `Deleting "${title}" will also permanently delete ${childCount} ${childPlural}:`,
      childList,
      `This cannot be undone.`,
    ].join("\n");
  }
  return `Delete "${title}" permanently? This cannot be undone.`;
};

/**
 * Pick the success-toast wording per Rule DEL6.
 */
export const buildDeleteSuccessToast = (info: CascadeInfo): { title: string } => {
  if (info.isReshape) return { title: "Reshape deleted" };
  if (info.reshapeChildren.length > 0) {
    const n = info.reshapeChildren.length;
    return { title: `Lesson and ${n} ${n === 1 ? "reshape" : "reshapes"} deleted` };
  }
  return { title: "Lesson deleted" };
};
