/**
 * Customization Directives Generator
 * 
 * Transforms user selections into explicit instructions for Claude.
 * This ensures customizations ACTUALLY affect lesson output.
 * 
 * Location: supabase/functions/_shared/customizationDirectives.ts
 * 
 * =============================================================================
 * SSOT COMPLIANCE (January 2026 Refactor)
 * =============================================================================
 * This file reads directive strings from the SSOT source:
 *   teacherPreferences.ts
 * 
 * Architecture: Frontend drives backend
 * - Dropdown options AND their directives are defined in teacherPreferences.ts
 * - This file is a thin function that assembles directives from SSOT
 * - No hardcoded directive mappings - all read from shared SSOT
 * 
 * Phase 1 Enhancements:
 * - Education Experience directives (field existed but was unused)
 * - Strengthened Activity Type directives (rich multi-sentence)
 * - Verification Checklist (self-audit for Claude)
 * - Priority Rules (conflict resolution guidance)
 * - Section Application Hints (which sections each directive affects)
 * 
 * Phase 2 Enhancements:
 * - Emotional Entry Point field handling
 * - Theological Lens field handling
 * =============================================================================
 */

import {
  TEACHING_STYLES,
  LEARNING_STYLES,
  LESSON_LENGTHS,
  GROUP_SIZES,
  LEARNING_ENVIRONMENTS,
  STUDENT_EXPERIENCE_LEVELS,
  EDUCATION_EXPERIENCES,
  CULTURAL_CONTEXTS,
  SPECIAL_NEEDS_OPTIONS,
  LESSON_SEQUENCE_OPTIONS,
  ASSESSMENT_STYLES,
  LANGUAGE_OPTIONS,
  ACTIVITY_TYPE_OPTIONS,
  EMOTIONAL_ENTRY_OPTIONS,
  THEOLOGICAL_LENS_OPTIONS,
  getOptionDirective,
  getCheckboxDirective,
} from './teacherPreferences.ts';

// ============================================================================
// PRIORITY RULES
// Guidance for Claude when directives might conflict
// ============================================================================

const PRIORITY_RULES = `
DIRECTIVE PRIORITY (when conflicts arise):
1. Special Needs accommodations override all other stylistic choices
2. Lesson Length constraints override activity complexity and quantity
3. Student Experience level overrides assumed knowledge in all sections
4. Education Level determines vocabulary complexity throughout
5. Group Size determines activity feasibility and design
6. Emotional Entry Point shapes the opening (Section 1) and overall tone
7. Theological Lens shapes application focus throughout all sections
`;

// ============================================================================
// SECTION APPLICATION HINTS
// Tells Claude which lesson sections each directive type affects most
// ============================================================================

const SECTION_APPLICATION_HINTS = `
APPLY DIRECTIVES TO SECTIONS:
- Teaching Style: Primarily affects Teacher's Script (Section 3) and overall flow
- Learning Style: Primarily affects Activity (Section 5) and Engagement (Section 2)
- Education Level: Affects vocabulary and complexity in ALL sections
- Cultural Context: Primarily affects Illustrations (Section 4) and Application (Section 6)
- Student Experience: Affects assumed knowledge and explanations in ALL sections
- Assessment Style: Primarily affects Closing (Section 8)
- Special Needs: Must be applied consistently across ALL sections
- Activity Types: Primarily affects Activity (Section 5) but may influence other sections
- Emotional Entry Point: Primarily affects Opening (Section 1) and sets overall emotional tone
- Theological Lens: Shapes Application (Section 6) and influences emphasis throughout
`;

// ============================================================================
// INPUT INTERFACE
// ============================================================================

export interface CustomizationInput {
  teaching_style?: string;
  learning_style?: string;
  lesson_length?: string;
  class_setting?: string;       // Maps to GROUP_SIZES
  learning_environment?: string;
  student_experience?: string;
  education_experience?: string;
  cultural_context?: string;
  special_needs?: string;
  lesson_sequence?: string;
  assessment_style?: string;
  activity_types?: string[];
  language?: string;
  // Phase 2 fields
  emotional_entry?: string;
  theological_lens?: string;
}

// ============================================================================
// VERIFICATION CHECKLIST BUILDER
// Creates self-audit checklist based on selected options
// ============================================================================

function buildVerificationChecklist(input: CustomizationInput): string {
  const checks: string[] = [];
  
  // Teaching Style checks
  if (input.teaching_style === 'discussion') {
    checks.push('☐ Every section contains at least 2 open-ended questions');
  }
  if (input.teaching_style === 'socratic') {
    checks.push('☐ Conclusions are discovered through questions, never stated directly');
  }
  if (input.teaching_style === 'storytelling') {
    checks.push('☐ Each main point is framed through narrative');
  }
  
  // Learning Style checks
  if (input.learning_style === 'kinesthetic') {
    checks.push('☐ Every section includes a movement or hands-on element');
  }
  if (input.learning_style === 'visual') {
    checks.push('☐ Visual aids or diagram descriptions included in each section');
  }
  
  // Lesson Length checks
  if (input.lesson_length === '15') {
    checks.push('☐ Content fits within 15 minutes (single point, one brief activity)');
  }
  if (input.lesson_length === '30') {
    checks.push('☐ Content fits within 30 minutes (one main point, one activity)');
  }
  
  // Cultural Context checks
  if (input.cultural_context === 'rural') {
    checks.push('☐ Illustrations reference agricultural, small-town, or nature themes');
  }
  if (input.cultural_context === 'urban') {
    checks.push('☐ Illustrations reference city life, diversity, fast-paced environments');
  }
  if (input.cultural_context === 'international') {
    checks.push('☐ No American-specific references; universally understood illustrations');
  }
  
  // Student Experience checks
  if (input.student_experience === 'new-believers') {
    checks.push('☐ All theological terms are defined on first use');
  }
  if (input.student_experience === 'seekers') {
    checks.push('☐ No church jargon; all concepts explained accessibly');
  }
  
  // Education Level checks
  if (input.education_experience === 'preschool') {
    checks.push('☐ Vocabulary uses simple 1-2 syllable words; heavy repetition');
  }
  if (input.education_experience === 'elementary') {
    checks.push('☐ Language is clear and age-appropriate for children');
  }
  if (input.education_experience === 'doctorate') {
    checks.push('☐ Academic vocabulary and scholarly depth included');
  }
  
  // Special Needs checks
  if (input.special_needs === 'learning-disabilities') {
    checks.push('☐ Short sentences; information chunked; multi-sensory reinforcement');
  }
  if (input.special_needs === 'esl') {
    checks.push('☐ Simple sentence structures; idioms explained; visual supports');
  }
  if (input.special_needs === 'visual-impaired') {
    checks.push('☐ All visual content has verbal descriptions');
  }
  if (input.special_needs === 'hearing-impaired') {
    checks.push('☐ All audio content has visual/written alternatives');
  }
  if (input.special_needs === 'mobility') {
    checks.push('☐ All activities can be done seated; no movement required');
  }
  
  // Group Size checks
  if (input.class_setting === 'one-on-one') {
    checks.push('☐ Content is personalized for individual conversation');
  }
  if (input.class_setting === 'large-group') {
    checks.push('☐ Activities designed for 13+ people; breakout instructions included');
  }
  
  // Learning Environment checks
  if (input.learning_environment === 'worship-center') {
    checks.push('☐ All activities work without tables; pew-friendly design');
    checks.push('☐ No activities requiring students to spread out materials on a surface');
  }
  
  // Activity Type checks
  if (input.activity_types?.includes('drama')) {
    checks.push('☐ At least one dramatic element (reader\'s theater, role-play, reenactment)');
  }
  if (input.activity_types?.includes('music')) {
    checks.push('☐ Specific hymn or worship song referenced by name');
  }
  if (input.activity_types?.includes('prayer')) {
    checks.push('☐ Structured prayer format included (ACTS, lectio divina, etc.)');
  }
  
  // Phase 2: Emotional Entry checks
  if (input.emotional_entry === 'curiosity') {
    checks.push('☐ Opening creates mystery or poses unanswered questions');
  }
  if (input.emotional_entry === 'conviction') {
    checks.push('☐ Opening makes bold truth claims with urgency');
  }
  if (input.emotional_entry === 'comfort') {
    checks.push('☐ Opening emphasizes assurance, safety, and grace');
  }
  if (input.emotional_entry === 'challenge') {
    checks.push('☐ Opening disrupts assumptions and calls to growth');
  }
  if (input.emotional_entry === 'celebration') {
    checks.push('☐ Opening leads with gratitude, joy, and praise');
  }
  
  // Phase 2: Theological Lens checks
  if (input.theological_lens === 'obedience') {
    checks.push('☐ Application focuses on faithful response and next steps');
  }
  if (input.theological_lens === 'grace') {
    checks.push('☐ Emphasis on what God has done, not human effort');
  }
  if (input.theological_lens === 'mission') {
    checks.push('☐ Application includes outward witness and sharing faith');
  }
  if (input.theological_lens === 'evangelism') {
    checks.push('☐ Gospel message is woven naturally into lesson content');
    checks.push('☐ Application equips students to share faith with specific people');
  }
  if (input.theological_lens === 'worship') {
    checks.push('☐ Content leads toward awe, reverence, and praise');
  }
  if (input.theological_lens === 'community') {
    checks.push('☐ "One another" relationships emphasized throughout');
  }
  if (input.theological_lens === 'discipleship') {
    checks.push('☐ Focus on spiritual growth, disciplines, and maturity');
  }
  
  if (checks.length === 0) {
    return '';
  }
  
  return '\n\nVERIFICATION CHECKLIST (Confirm before finalizing):\n' + checks.join('\n');
}

// ============================================================================
// MAIN DIRECTIVE BUILDER
// Assembles all directives from SSOT sources
// ============================================================================

export function buildCustomizationDirectives(input: CustomizationInput): string {
  const directives: string[] = [];

  // Teaching Style - from SSOT
  if (input.teaching_style) {
    const directive = getOptionDirective(TEACHING_STYLES, input.teaching_style);
    if (directive) directives.push(directive);
  }

  // Learning Style - from SSOT
  if (input.learning_style) {
    const directive = getOptionDirective(LEARNING_STYLES, input.learning_style);
    if (directive) directives.push(directive);
  }

  // Lesson Length - from SSOT
  if (input.lesson_length) {
    const directive = getOptionDirective(LESSON_LENGTHS, input.lesson_length);
    if (directive) directives.push(directive);
  }

  // Group Size (class_setting) - from SSOT
  if (input.class_setting) {
    const directive = getOptionDirective(GROUP_SIZES, input.class_setting);
    if (directive) directives.push(directive);
  }

  // Learning Environment - from SSOT
  if (input.learning_environment) {
    const directive = getOptionDirective(LEARNING_ENVIRONMENTS, input.learning_environment);
    if (directive) directives.push(directive);
  }

  // Student Experience - from SSOT
  if (input.student_experience) {
    const directive = getOptionDirective(STUDENT_EXPERIENCE_LEVELS, input.student_experience);
    if (directive) directives.push(directive);
  }

  // Education Experience - from SSOT
  if (input.education_experience) {
    const directive = getOptionDirective(EDUCATION_EXPERIENCES, input.education_experience);
    if (directive) directives.push(directive);
  }

  // Cultural Context - from SSOT
  if (input.cultural_context) {
    const directive = getOptionDirective(CULTURAL_CONTEXTS, input.cultural_context);
    if (directive) directives.push(directive);
  }

  // Special Needs - from SSOT
  if (input.special_needs) {
    const directive = getOptionDirective(SPECIAL_NEEDS_OPTIONS, input.special_needs);
    if (directive) directives.push(directive);
  }

  // Lesson Sequence - from SSOT
  if (input.lesson_sequence) {
    const directive = getOptionDirective(LESSON_SEQUENCE_OPTIONS, input.lesson_sequence);
    if (directive) directives.push(directive);
  }

  // Assessment Style - from SSOT
  if (input.assessment_style) {
    const directive = getOptionDirective(ASSESSMENT_STYLES, input.assessment_style);
    if (directive) directives.push(directive);
  }

  // Phase 2: Emotional Entry Point - from SSOT
  if (input.emotional_entry) {
    const directive = getOptionDirective(EMOTIONAL_ENTRY_OPTIONS, input.emotional_entry);
    if (directive) directives.push(directive);
  }

  // Phase 2: Theological Lens - from SSOT
  if (input.theological_lens) {
    const directive = getOptionDirective(THEOLOGICAL_LENS_OPTIONS, input.theological_lens);
    if (directive) directives.push(directive);
  }

  // Activity Types (checkboxes) - from SSOT
  if (input.activity_types && input.activity_types.length > 0) {
    const activityDirectives = input.activity_types
      .map(type => getCheckboxDirective(ACTIVITY_TYPE_OPTIONS, type))
      .filter(Boolean);
    if (activityDirectives.length > 0) {
      directives.push('ACTIVITIES:\n' + activityDirectives.join('\n'));
    }
  }

  // Language - from SSOT
  if (input.language) {
    const directive = getOptionDirective(LANGUAGE_OPTIONS, input.language);
    if (directive) directives.push(directive);
  }

  // If no customizations selected, return empty string
  if (directives.length === 0) {
    return '';
  }

  // Build final output with all enhancements
  let output = '\nCUSTOMIZATION DIRECTIVES:\n' + directives.join('\n\n');
  
  // Add Priority Rules
  output += '\n' + PRIORITY_RULES;
  
  // Add Section Application Hints
  output += '\n' + SECTION_APPLICATION_HINTS;
  
  // Add Verification Checklist (conditional based on selections)
  output += buildVerificationChecklist(input);

  return output;
}

export default buildCustomizationDirectives;
