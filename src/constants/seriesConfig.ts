/**
 * Series/Theme Mode SSOT
 * Single Source of Truth for Series/Theme Mode feature (Phase 24)
 *
 * Architecture: Frontend drives backend
 * This file syncs to: supabase/functions/_shared/seriesConfig.ts
 *
 * PURPOSE: Enable multi-week sequential lesson planning with style consistency.
 * Teachers name a series, set total lessons, and the system captures/applies
 * style metadata to maintain a unified teaching approach across the series.
 *
 * CREATED: January 2026 (Phase 24)
 * MIGRATED FROM: freshnessOptions.ts (SeriesStyleMetadata + related functions)
 */

// ============================================================================
// SERIES LIMITS
// ============================================================================

export const SERIES_LIMITS = {
  minLessons: 2,
  maxLessons: 12,
  maxSeriesNameLength: 100,
  maxActiveSeries: 10, // Per user - prevent unbounded growth
} as const;

// ============================================================================
// SERIES STATUS
// ============================================================================

export const SERIES_STATUSES = {
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  ABANDONED: 'abandoned',
} as const;

export type SeriesStatus = typeof SERIES_STATUSES[keyof typeof SERIES_STATUSES];

// ============================================================================
// INTERFACES
// ============================================================================

/**
 * Style metadata captured from a lesson for series consistency.
 * Extracted after Lesson 1 via Claude prompt, stored in lesson_series.style_metadata.
 * Applied to Lessons 2+ to maintain unified teaching approach.
 *
 * MIGRATED from freshnessOptions.ts -- this is now the single owner.
 */
export interface SeriesStyleMetadata {
  openingHookType: string;
  illustrationType: string;
  teachingAngle: string;
  activityFormat: string;
  applicationContext: string;
  closingChallengeType: string;
  toneDescriptor: string;
  transitionStyle: string;       // Phase 24 addition: how lessons connect
  capturedFromLessonId: string;
  capturedAt: string;
}

/**
 * Summary of a generated lesson within a series.
 * Stored in lesson_series.lesson_summaries (JSONB array).
 * Fed to Claude for content continuity -- prevents redundancy,
 * enables callbacks to previous lessons.
 */
export interface SeriesLessonSummary {
  lessonNumber: number;
  lessonId: string;
  passage: string;
  mainPoint: string;
  keyIllustration: string;
  applicationFocus: string;
  generatedAt: string;
}

/**
 * Shape of a lesson_series row as returned from Supabase.
 * Used by useSeriesManager hook and UI components.
 */
export interface LessonSeries {
  id: string;
  user_id: string;
  org_id: string | null;
  series_name: string;
  total_lessons: number;
  bible_passage: string | null;
  focused_topic: string | null;
  theology_profile_id: string | null;
  age_group: string | null;
  style_metadata: SeriesStyleMetadata | null;
  lesson_summaries: SeriesLessonSummary[];
  status: SeriesStatus;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// DISPLAY HELPERS
// ============================================================================

/**
 * Format series for dropdown display.
 * Example: "Romans: Gospel of Grace (2 of 4 complete)"
 */
export function formatSeriesLabel(series: LessonSeries): string {
  const completedCount = series.lesson_summaries?.length || 0;
  return `${series.series_name} (${completedCount} of ${series.total_lessons} complete)`;
}

/**
 * Determine the next lesson number for a series.
 */
export function getNextLessonNumber(series: LessonSeries): number {
  const completedCount = series.lesson_summaries?.length || 0;
  return Math.min(completedCount + 1, series.total_lessons);
}

/**
 * Check if this is the final lesson in the series.
 */
export function isFinalLesson(series: LessonSeries, lessonNumber: number): boolean {
  return lessonNumber === series.total_lessons;
}

/**
 * Check if series is ready for completion (all lessons generated).
 */
export function isSeriesComplete(series: LessonSeries): boolean {
  const completedCount = series.lesson_summaries?.length || 0;
  return completedCount >= series.total_lessons;
}

// ============================================================================
// PROMPT BUILDERS (Frontend drives backend -- these define what Claude receives)
// ============================================================================

/**
 * Build consistent style context for series Lessons 2+.
 * Tells Claude to MATCH the established style from Lesson 1.
 */
export function buildConsistentStyleContext(
  styleMetadata: SeriesStyleMetadata
): string {
  return `
-------------------------------------------------------------------------------
CONSISTENT STYLE MODE: ACTIVE (Series Lesson)
-------------------------------------------------------------------------------

You MUST match the established series style from Lesson 1:

* OPENING HOOK TYPE: Use a "${styleMetadata.openingHookType}" approach (same as Lesson 1)
* ILLUSTRATION STYLE: Feature "${styleMetadata.illustrationType}" examples (same as Lesson 1)
* TEACHING ANGLE: Maintain the "${styleMetadata.teachingAngle}" perspective
* ACTIVITY FORMAT: Use "${styleMetadata.activityFormat}" style activities
* APPLICATION CONTEXT: Focus on "${styleMetadata.applicationContext}" applications
* CLOSING CHALLENGE: End with a "${styleMetadata.closingChallengeType}" challenge
* TONE: Maintain a "${styleMetadata.toneDescriptor}" tone throughout
${styleMetadata.transitionStyle ? `* TRANSITIONS: Use "${styleMetadata.transitionStyle}" transitions between sections` : ''}

This ensures continuity across all lessons in this series.
Do NOT vary these elements - keep them consistent with the established style.
`;
}

/**
 * Build lesson continuity context from previous lesson summaries.
 * Tells Claude what has been covered so far -- prevents redundancy,
 * enables callbacks ("Last week we discussed...").
 */
export function buildSeriesContinuityContext(
  summaries: SeriesLessonSummary[],
  currentLessonNumber: number,
  totalLessons: number,
  seriesName: string
): string {
  if (!summaries || summaries.length === 0) return '';

  const summaryLines = summaries.map(s =>
    `  Lesson ${s.lessonNumber}: "${s.passage}" -- ${s.mainPoint} (Key illustration: ${s.keyIllustration})`
  ).join('\n');

  const isFinal = currentLessonNumber === totalLessons;

  return `
-------------------------------------------------------------------------------
SERIES CONTINUITY: "${seriesName}" -- Lesson ${currentLessonNumber} of ${totalLessons}
-------------------------------------------------------------------------------

PREVIOUS LESSONS IN THIS SERIES:
${summaryLines}

CONTINUITY REQUIREMENTS:
* Reference previous lessons naturally: "Last week we explored..." or "Building on our discussion of..."
* Do NOT repeat key illustrations or main points already used
* Build on previous applications -- show progression in spiritual growth
* Use the same vocabulary and terminology established in earlier lessons
${isFinal ? `
FINAL LESSON INSTRUCTIONS:
* This is the LAST lesson in the "${seriesName}" series
* Include a brief series recap in Section 1 (Opening Hook)
* In Section 7 (Application), tie together themes from ALL lessons
* Close with a cumulative challenge that synthesizes the entire series journey
* Reference specific moments from previous lessons as callback anchors
` : ''}`;
}

/**
 * Prompt addition to extract style metadata from a generated lesson.
 * Used when generating Lesson 1 of a series with Consistent Style Mode.
 */
export function buildStyleExtractionPrompt(): string {
  return `

STYLE METADATA EXTRACTION (For Series Continuity):
After generating this lesson, identify and report the style choices you made:

At the very end of your response, add this section:
---STYLE_METADATA---
OPENING_HOOK_TYPE: [describe the type of opening hook used]
ILLUSTRATION_TYPE: [describe the main illustration style]
TEACHING_ANGLE: [describe the teaching perspective]
ACTIVITY_FORMAT: [describe the activity format used]
APPLICATION_CONTEXT: [describe the application focus area]
CLOSING_CHALLENGE_TYPE: [describe the type of closing challenge]
TONE_DESCRIPTOR: [2-3 words describing the overall tone]
TRANSITION_STYLE: [describe how you transition between sections]
---END_STYLE_METADATA---

This metadata will be used to maintain consistency in subsequent series lessons.
`;
}

/**
 * Prompt addition to extract a lesson summary for series continuity.
 * Used after generating ANY lesson in a series (Lesson 1 through N).
 */
export function buildSummaryExtractionPrompt(): string {
  return `

LESSON SUMMARY EXTRACTION (For Series Continuity):
After generating this lesson, provide a brief summary for continuity tracking:

After the style metadata section (if present), add:
---LESSON_SUMMARY---
MAIN_POINT: [One sentence describing the central teaching point]
KEY_ILLUSTRATION: [The primary illustration or story used]
APPLICATION_FOCUS: [The main application area emphasized]
---END_LESSON_SUMMARY---

This summary will help future lessons in this series build on what was covered.
`;
}

// ============================================================================
// PARSERS (Extract structured data from Claude's response)
// ============================================================================

/**
 * Parse style metadata from generated lesson content.
 */
export function parseStyleMetadata(lessonContent: string, lessonId: string): SeriesStyleMetadata | null {
  const metadataMatch = lessonContent.match(/---STYLE_METADATA---([\s\S]*?)---END_STYLE_METADATA---/);
  if (!metadataMatch) return null;

  const metadataBlock = metadataMatch[1];

  const extractValue = (key: string): string => {
    const regex = new RegExp(`${key}:\\s*(.+?)(?:\\n|$)`, 'i');
    const match = metadataBlock.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    openingHookType: extractValue('OPENING_HOOK_TYPE'),
    illustrationType: extractValue('ILLUSTRATION_TYPE'),
    teachingAngle: extractValue('TEACHING_ANGLE'),
    activityFormat: extractValue('ACTIVITY_FORMAT'),
    applicationContext: extractValue('APPLICATION_CONTEXT'),
    closingChallengeType: extractValue('CLOSING_CHALLENGE_TYPE'),
    toneDescriptor: extractValue('TONE_DESCRIPTOR'),
    transitionStyle: extractValue('TRANSITION_STYLE'),
    capturedFromLessonId: lessonId,
    capturedAt: new Date().toISOString()
  };
}

/**
 * Parse lesson summary from generated lesson content.
 */
export function parseLessonSummary(
  lessonContent: string,
  lessonId: string,
  lessonNumber: number,
  passage: string
): SeriesLessonSummary | null {
  const summaryMatch = lessonContent.match(/---LESSON_SUMMARY---([\s\S]*?)---END_LESSON_SUMMARY---/);
  if (!summaryMatch) return null;

  const summaryBlock = summaryMatch[1];

  const extractValue = (key: string): string => {
    const regex = new RegExp(`${key}:\\s*(.+?)(?:\\n|$)`, 'i');
    const match = summaryBlock.match(regex);
    return match ? match[1].trim() : '';
  };

  return {
    lessonNumber,
    lessonId,
    passage,
    mainPoint: extractValue('MAIN_POINT'),
    keyIllustration: extractValue('KEY_ILLUSTRATION'),
    applicationFocus: extractValue('APPLICATION_FOCUS'),
    generatedAt: new Date().toISOString()
  };
}

/**
 * Remove style metadata block from lesson content for display.
 */
export function removeStyleMetadataFromContent(lessonContent: string): string {
  return lessonContent.replace(/---STYLE_METADATA---[\s\S]*?---END_STYLE_METADATA---/, '').trim();
}

/**
 * Remove lesson summary block from lesson content for display.
 */
export function removeSummaryFromContent(lessonContent: string): string {
  return lessonContent.replace(/---LESSON_SUMMARY---[\s\S]*?---END_LESSON_SUMMARY---/, '').trim();
}

/**
 * Remove all extraction blocks from lesson content for display.
 */
export function removeAllExtractionBlocks(lessonContent: string): string {
  let cleaned = removeStyleMetadataFromContent(lessonContent);
  cleaned = removeSummaryFromContent(cleaned);
  return cleaned;
}
