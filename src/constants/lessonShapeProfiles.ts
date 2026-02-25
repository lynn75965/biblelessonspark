// src/constants/lessonShapeProfiles.ts
// SSOT: Single Source of Truth for Lesson Shapes feature
// Frontend drives backend -- all shape definitions, prompts, and mappings defined here
//
// ARCHITECTURE:
// - Shape definitions: ID, labels, descriptions, visible structure rules
// - Prompt blocks: Universal guardrail + per-shape reshape instructions
// - Age-group mappings: Recommended shape ordering keyed to ageGroups.ts IDs
// - Helper functions: Lookups, prompt assembly, dropdown population
//
// PATTERN: Matches theologyProfiles.ts (interface + data array + helpers)
// CONSUMED BY: Reshape UI components, Edge Function call (frontend assembles prompt)
//
// Updated: February 2026

export const LESSON_SHAPES_VERSION = "1.0.0";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Valid shape IDs -- used as discriminated union throughout the app
 */
export type ShapeId =
  | 'passage_walkthrough'
  | 'life_connection'
  | 'gospel_centered'
  | 'focus_discover_respond'
  | 'story_driven';

/**
 * A single Lesson Shape definition
 */
export interface LessonShape {
  /** Internal identifier -- stored in lessons.shape_id */
  id: ShapeId;
  /** Teacher-facing label shown in UI */
  name: string;
  /** Short label for compact displays (tabs, toggles) */
  shortName: string;
  /** Display order in menus when no age-group recommendation applies */
  displayOrder: number;
  /** One-line teacher-facing posture statement */
  posture: string;
  /** Teacher-facing description of what this shape does */
  description: string;
  /** What the competitive curriculum equivalent feels like */
  competitiveFeel: string;
  /** What headings appear in the reshaped output */
  visibleStructure: string;
  /** The full reshape prompt block sent to Claude API */
  reshapePrompt: string;
}

/**
 * Age-group shape recommendation -- ordered list of shape IDs
 * All five shapes always present; order determines "recommended" surfacing
 */
export interface AgeGroupShapeMapping {
  /** Must match an id from ageGroups.ts */
  ageGroupId: string;
  /** Ordered shape IDs -- first is "best fit," all five always included */
  recommendedOrder: ShapeId[];
}

// ============================================================================
// UNIVERSAL RESHAPE GUARDRAIL
// ============================================================================

/**
 * Prepended to EVERY reshape prompt -- protects theological integrity
 * This is the reshape equivalent of the theology guardrails in generation
 *
 * The base guardrail is constant. Theology and age-group context are injected
 * by assembleReshapePrompt() when available -- the caller passes display names
 * from theologyProfiles.ts and ageGroups.ts so this file stays dependency-free.
 */
export const RESHAPE_UNIVERSAL_GUARDRAIL = `You are receiving a completed Bible study lesson that has already been theologically vetted and age-calibrated. Your task is to re-present this content in a specific teaching format. You must preserve every piece of Scripture, every doctrinal statement, every application point, and every discussion question from the original. Redistribute content into the new structure -- do not discard any substantive material. If a section from the original does not map cleanly to the new format, fold its content into the most appropriate location rather than dropping it. You may reorganize, merge, reword for flow, and change the visible structure. You may not add new theological claims, remove any scriptural content, or alter the doctrinal position. The teacher's preparation content and the student-facing content should both reflect the selected format naturally.

CRITICAL: The student-facing section of the reshaped lesson MUST use the exact heading "STUDENT HANDOUT" (all capitals, on its own line). Do not use any other heading such as "Student Experience", "Student Material", or "Student Section". This heading is required for the platform's export and email systems to detect and format the student content correctly.`;

/**
 * SSOT: Regex pattern for detecting student handout headings in both
 * original format ("Section 8: Student Handout") and shaped format
 * ("STUDENT HANDOUT"). Used by all export utilities and the email Edge Function.
 * Safety-net also catches variants Claude might generate despite the guardrail.
 */
export const STUDENT_HANDOUT_HEADING_REGEX = /^(?:#{1,3}\s*)?(?:Section\s*8[:\s]*)?(?:Student\s+(?:Handout|Experience|Material|Section)|STUDENT\s+(?:HANDOUT|EXPERIENCE|MATERIAL|SECTION))(?:\s*[:---\-].*)?$/im;

/**
 * SSOT: Title displayed on the standalone Student Handout page in exports.
 * Teachers distribute this page to students, so it omits "Section 8:" prefix.
 */
export const STUDENT_HANDOUT_STANDALONE_TITLE = "Student Handout";

// ============================================================================
// LESSON SHAPES DATA
// ============================================================================

export const LESSON_SHAPES: LessonShape[] = [
  // ---------------------------------------------------------------------------
  // 1. PASSAGE WALK-THROUGH
  // ---------------------------------------------------------------------------
  {
    id: 'passage_walkthrough',
    name: 'Passage Walk-Through',
    shortName: 'Walk-Through',
    displayOrder: 1,
    posture: "Let's walk through the passage together.",
    description: 'A verse-by-verse guided study that follows the natural flow of the Scripture passage. The text determines the outline.',
    competitiveFeel: 'Explore the Bible (Lifeway)',
    visibleStructure: 'Structure follows the passage itself -- no original section headings. Headings emerge from the text (e.g., verse groupings, paragraph divisions).',
    reshapePrompt: `Present this lesson as a verse-by-verse guided study of the primary Scripture passage. Open with brief historical and literary context that orients the teacher to the passage -- who wrote it, to whom, and why it matters. Then move through the passage sequentially, surfacing theological insights, teaching points, and application moments as they naturally emerge from the text. The teacher's transcript should sound like someone walking a class through an open Bible: 'Now look at verse 12. Notice what Paul says here...' Weave discussion questions into the flow at natural pause points rather than grouping them separately. The student handout should present the passage with study notes alongside the text. Do not use the original section headings. The visible structure should follow the passage itself -- the text determines the outline.`,
  },

  // ---------------------------------------------------------------------------
  // 2. LIFE CONNECTION
  // ---------------------------------------------------------------------------
  {
    id: 'life_connection',
    name: 'Life Connection',
    shortName: 'Life Connection',
    displayOrder: 2,
    posture: "Here's a real-life tension -- and how Scripture speaks to it.",
    description: 'Opens with a vivid real-life situation, then introduces Scripture as God\'s voice speaking into that reality, landing on concrete next steps.',
    competitiveFeel: 'Bible Studies for Life (Lifeway)',
    visibleStructure: 'No original section headings. Visible structure follows the life-to-Scripture-to-response arc.',
    reshapePrompt: `Present this lesson as a journey from a shared human experience into Scripture and back out to practical response. Open with a vivid, age-appropriate real-life situation that creates tension or raises a question the class will recognize from their own lives. Do not open with Scripture -- open with life. Then introduce the biblical passage as God's voice speaking into that reality. Weave the theological depth into the explanation of why this passage matters for this situation rather than presenting it as separate background study. The teacher's transcript should sound relational and pastoral: 'Have you ever felt like nobody noticed what you were going through? Open to Psalm 139...' Land the lesson on concrete, specific next steps the class can take this week. The student handout should lead with the real-life hook and close with actionable application. Do not use the original section headings. The visible structure should follow the life-to-Scripture-to-response arc.`,
  },

  // ---------------------------------------------------------------------------
  // 3. GOSPEL-CENTERED
  // ---------------------------------------------------------------------------
  {
    id: 'gospel_centered',
    name: 'Gospel-Centered',
    shortName: 'Gospel-Centered',
    displayOrder: 3,
    posture: 'Every story points to Jesus.',
    description: 'Locates the passage within Creation-Fall-Redemption-Restoration and explicitly connects every teaching point to Christ.',
    competitiveFeel: 'The Gospel Project (Lifeway)',
    visibleStructure: 'No original section headings. Visible structure follows the redemptive narrative arc.',
    reshapePrompt: `Present this lesson by locating it within the overarching story of Scripture -- Creation, Fall, Redemption, Restoration. Open by establishing where this passage sits in the biblical narrative and why it matters in God's redemptive plan. Every teaching point should explicitly connect to Christ -- either pointing forward to Him, fulfilled in Him, or flowing from His finished work. The theological depth should emphasize how this particular text reveals something about the gospel. The teacher's transcript should make the connections overt: 'This isn't just a story about David's courage -- it's pointing forward to a greater King.' Include a clear gospel presentation moment within the lesson flow appropriate to the age group. The student handout should include a 'Big Picture' element showing where this lesson fits in the sweep of Scripture. Do not use the original section headings. The visible structure should follow the redemptive narrative arc.`,
  },

  // ---------------------------------------------------------------------------
  // 4. FOCUS-DISCOVER-RESPOND
  // ---------------------------------------------------------------------------
  {
    id: 'focus_discover_respond',
    name: 'Focus-Discover-Respond',
    shortName: 'Focus-Disc-Resp',
    displayOrder: 4,
    posture: 'Three clean movements.',
    description: 'Exactly three sections: Focus (opening hook), Discover (core Bible study), and Respond (application and commitment). Clean and rhythmic.',
    competitiveFeel: 'Scripture Press (David C Cook)',
    visibleStructure: 'Exactly three headings: Focus, Discover, Respond. No other headings.',
    reshapePrompt: `Present this lesson in exactly three movements: Focus, Discover, and Respond. Use only these three headings. Focus is the opening hook -- an activity, question, scenario, or illustration that captures attention and surfaces the topic. Keep it brief and engaging. Discover is the core Bible study -- Scripture reading, exploration, theological insight, and teaching content. This is the largest section and carries all the doctrinal weight. Respond is the application -- what the class does with what they've learned. Include discussion questions, personal reflection, a weekly challenge, and a closing prayer or commitment moment. Fold all content from the original lesson into these three movements seamlessly. The teacher's transcript should feel clean and rhythmic -- three beats, no clutter. The student handout should mirror the same three-movement structure.`,
  },

  // ---------------------------------------------------------------------------
  // 5. STORY-DRIVEN
  // ---------------------------------------------------------------------------
  {
    id: 'story_driven',
    name: 'Story-Driven',
    shortName: 'Story-Driven',
    displayOrder: 5,
    posture: 'Let me tell you a story.',
    description: 'A flowing narrative experience with no section headings. Teaching points emerge from the story rather than being declared as exposition.',
    competitiveFeel: 'Gospel Light / narrative curriculum',
    visibleStructure: 'No headings at all -- one continuous narrative arc with natural movement from story to truth to response.',
    reshapePrompt: `Present this lesson as a narrative experience. Open inside a story -- either a vivid retelling of the biblical narrative or a modern parallel that creates emotional engagement. Do not introduce the passage academically. Let the class feel the scene before they analyze it. Build tension or curiosity within the narrative before drawing out the theological truth. The teaching points should emerge from the story rather than being declared as exposition. The teacher's transcript should read like preparation for a storyteller: vivid description, pacing cues, emotional beats, moments of silence. Weave discussion and application into the narrative flow naturally rather than separating them. The student handout should capture the story and let the truth emerge from it -- no section headings, no bulleted doctrine, just narrative with embedded reflection questions. Do not use any section headings in either the teacher or student material. The visible structure should feel like one continuous narrative arc with natural movement from story to truth to response.`,
  },
];

// ============================================================================
// AGE-GROUP SHAPE RECOMMENDATIONS
// ============================================================================

/**
 * Recommended shape ordering by age group
 * All five shapes are ALWAYS available -- ordering determines which appear first
 * Keyed to ageGroups.ts IDs (SSOT for age group definitions)
 *
 * Rationale documented in LESSON_SHAPES_HANDOFF.md
 */
export const AGE_GROUP_SHAPE_MAPPINGS: AgeGroupShapeMapping[] = [
  {
    ageGroupId: 'preschool',
    recommendedOrder: ['story_driven', 'focus_discover_respond', 'life_connection', 'gospel_centered', 'passage_walkthrough'],
  },
  {
    ageGroupId: 'elementary',
    recommendedOrder: ['story_driven', 'focus_discover_respond', 'life_connection', 'gospel_centered', 'passage_walkthrough'],
  },
  {
    ageGroupId: 'preteen',
    recommendedOrder: ['life_connection', 'story_driven', 'focus_discover_respond', 'gospel_centered', 'passage_walkthrough'],
  },
  {
    ageGroupId: 'highschool',
    recommendedOrder: ['life_connection', 'gospel_centered', 'story_driven', 'focus_discover_respond', 'passage_walkthrough'],
  },
  {
    ageGroupId: 'college',
    recommendedOrder: ['life_connection', 'gospel_centered', 'passage_walkthrough', 'focus_discover_respond', 'story_driven'],
  },
  {
    ageGroupId: 'youngadult',
    recommendedOrder: ['life_connection', 'passage_walkthrough', 'gospel_centered', 'focus_discover_respond', 'story_driven'],
  },
  {
    ageGroupId: 'midlife',
    recommendedOrder: ['passage_walkthrough', 'life_connection', 'gospel_centered', 'focus_discover_respond', 'story_driven'],
  },
  {
    ageGroupId: 'experienced',
    recommendedOrder: ['passage_walkthrough', 'gospel_centered', 'life_connection', 'focus_discover_respond', 'story_driven'],
  },
  {
    ageGroupId: 'activesenior',
    recommendedOrder: ['passage_walkthrough', 'gospel_centered', 'focus_discover_respond', 'life_connection', 'story_driven'],
  },
  {
    ageGroupId: 'senior',
    recommendedOrder: ['passage_walkthrough', 'focus_discover_respond', 'gospel_centered', 'life_connection', 'story_driven'],
  },
  {
    ageGroupId: 'mixed',
    recommendedOrder: ['life_connection', 'focus_discover_respond', 'story_driven', 'gospel_centered', 'passage_walkthrough'],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a shape by ID
 */
export function getShapeById(id: ShapeId): LessonShape | undefined {
  return LESSON_SHAPES.find(shape => shape.id === id);
}

/**
 * Get all shapes sorted by display order (default ordering)
 */
export function getShapesSorted(): LessonShape[] {
  return [...LESSON_SHAPES].sort((a, b) => a.displayOrder - b.displayOrder);
}

/**
 * Get shapes ordered by age-group recommendation
 * Returns all five shapes -- recommended ones first
 * Falls back to displayOrder if age group not found
 */
export function getShapesForAgeGroup(ageGroupId: string): LessonShape[] {
  const mapping = AGE_GROUP_SHAPE_MAPPINGS.find(m => m.ageGroupId === ageGroupId);

  if (!mapping) {
    return getShapesSorted();
  }

  return mapping.recommendedOrder
    .map(shapeId => LESSON_SHAPES.find(s => s.id === shapeId))
    .filter((shape): shape is LessonShape => shape !== undefined);
}

/**
 * Get the recommended shape ordering for a given age group
 * Returns just the IDs in recommended order
 */
export function getRecommendedShapeOrder(ageGroupId: string): ShapeId[] {
  const mapping = AGE_GROUP_SHAPE_MAPPINGS.find(m => m.ageGroupId === ageGroupId);
  if (!mapping) {
    return LESSON_SHAPES.map(s => s.id);
  }
  return mapping.recommendedOrder;
}

/**
 * Get user-facing shape options for dropdowns/selectors
 * Ordered by age-group recommendation if ageGroupId provided
 */
export function getShapeOptions(ageGroupId?: string): Array<{
  id: ShapeId;
  name: string;
  shortName: string;
  posture: string;
  description: string;
}> {
  const shapes = ageGroupId ? getShapesForAgeGroup(ageGroupId) : getShapesSorted();
  return shapes.map(shape => ({
    id: shape.id,
    name: shape.name,
    shortName: shape.shortName,
    posture: shape.posture,
    description: shape.description,
  }));
}

/**
 * Assemble the complete reshape prompt for a given shape
 * This is what the frontend sends to the Edge Function
 *
 * Structure: Universal guardrail + theology context + age-group context + shape-specific prompt
 * The Edge Function receives this as a complete instruction block
 *
 * @param shapeId - Which shape to reshape into
 * @param options.theologyProfileName - Display name from theologyProfiles.ts (e.g., "Reformed Baptist")
 * @param options.ageGroupLabel - Display label from ageGroups.ts (e.g., "Young Adults (25-35)")
 * @param options.vocabularyLevel - From ageGroup.teachingProfile.vocabularyLevel
 */
export function assembleReshapePrompt(
  shapeId: ShapeId,
  options?: {
    theologyProfileName?: string;
    ageGroupLabel?: string;
    vocabularyLevel?: string;
  }
): string | null {
  const shape = getShapeById(shapeId);
  if (!shape) return null;

  // Build context blocks only when data is available
  const contextBlocks: string[] = [];

  if (options?.theologyProfileName) {
    contextBlocks.push(
      `## THEOLOGICAL CONTEXT\nThis lesson was generated under the "${options.theologyProfileName}" theological perspective. Maintain this doctrinal lens throughout the reshaped output. Do not soften, generalize, or shift the theological position.`
    );
  }

  if (options?.ageGroupLabel || options?.vocabularyLevel) {
    const ageParts: string[] = [];
    if (options?.ageGroupLabel) {
      ageParts.push(`This lesson targets the "${options.ageGroupLabel}" age group.`);
    }
    if (options?.vocabularyLevel) {
      ageParts.push(`Vocabulary level: ${options.vocabularyLevel}.`);
    }
    ageParts.push('Maintain age-appropriate vocabulary, illustrations, activities, and discussion complexity. Do not shift the reading level or maturity of examples.');
    contextBlocks.push(`## AGE-GROUP CONTEXT\n${ageParts.join(' ')}`);
  }

  const contextSection = contextBlocks.length > 0
    ? `\n\n${contextBlocks.join('\n\n')}\n`
    : '';

  return `${RESHAPE_UNIVERSAL_GUARDRAIL}
${contextSection}
---

## RESHAPE FORMAT: ${shape.name}

${shape.reshapePrompt}`;
}

/**
 * Validate that a string is a valid ShapeId
 */
export function isValidShapeId(value: string): value is ShapeId {
  return LESSON_SHAPES.some(shape => shape.id === value);
}

/**
 * Get all valid shape IDs (for validation, database checks, etc.)
 */
export function getAllShapeIds(): ShapeId[] {
  return LESSON_SHAPES.map(shape => shape.id);
}
