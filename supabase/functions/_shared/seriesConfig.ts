/**
 * Series Config -- Backend SSOT Mirror
 * Mirrors key constants from src/constants/seriesConfig.ts
 *
 * Frontend SSOT: src/constants/seriesConfig.ts
 * This file exists so backend validation can import instead of hardcoding.
 *
 * HAND-MAINTAINED -- Rule #24. Not in FILES_TO_SYNC. When the frontend
 * adds a runtime export consumed by an Edge Function, it MUST be
 * mirrored here in the same commit.
 *
 * May 19, 2026 -- production hotfix. _shared/freshnessOptions.ts
 * (auto-synced from frontend) re-exports four runtime symbols from
 * this file, and generate-lesson/index.ts imports the same four
 * directly. Adding all four together to prevent another boot error
 * cascade. The other functions in the frontend seriesConfig.ts
 * (continuity, summary parsing, etc.) are not imported by any backend
 * code -- left out per Rule #24 minimal-surface policy.
 */

export const MAX_SERIES_LESSONS = 13;
export const MIN_SERIES_LESSONS = 2;

/**
 * Style metadata captured from a lesson for series consistency.
 * Extracted after Lesson 1 via Claude prompt, stored in
 * lesson_series.style_metadata. Applied to Lessons 2+ to maintain a
 * unified teaching approach.
 *
 * Frontend SSOT: src/constants/seriesConfig.ts L50-61.
 */
export interface SeriesStyleMetadata {
  openingHookType: string;
  illustrationType: string;
  teachingAngle: string;
  activityFormat: string;
  applicationContext: string;
  closingChallengeType: string;
  toneDescriptor: string;
  transitionStyle: string;
  capturedFromLessonId: string;
  capturedAt: string;
}

/**
 * Build consistent style context for series Lessons 2+.
 * Tells Claude to MATCH the established style from Lesson 1.
 *
 * Frontend SSOT: src/constants/seriesConfig.ts L145-167.
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
 * Prompt addition to extract style metadata from a generated lesson.
 * Used when generating Lesson 1 of a series with Consistent Style Mode.
 *
 * Frontend SSOT: src/constants/seriesConfig.ts L215-235.
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
 * Parse style metadata from generated lesson content.
 *
 * Frontend SSOT: src/constants/seriesConfig.ts L265-289.
 */
export function parseStyleMetadata(
  lessonContent: string,
  lessonId: string
): SeriesStyleMetadata | null {
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
    capturedAt: new Date().toISOString(),
  };
}

/**
 * Remove style metadata block from lesson content for display.
 *
 * Frontend SSOT: src/constants/seriesConfig.ts L325-327.
 */
export function removeStyleMetadataFromContent(lessonContent: string): string {
  return lessonContent.replace(/---STYLE_METADATA---[\s\S]*?---END_STYLE_METADATA---/, '').trim();
}
