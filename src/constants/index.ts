/**
 * LessonSparkUSA Constants - Barrel Export
 * @version 1.1.0
 * @lastUpdated 2025-11-22
 */

// ============================================================================
// TypeScript Contracts (Interfaces & Types)
// ============================================================================
export type {
  LessonSection,
  LessonStructure,
  TeachingProfile,
  AgeGroup,
  TheologicalPreferenceKey,
  SBConfessionVersionKey,
  SBConfessionVersion,
  TheologicalPreference,
  PreferenceOption,
  TeacherPreferences,
  LanguageKey,
  LanguageConfig,
  LessonGenerationRequest,
  LessonContent,
  LessonGenerationResponse,
  LessonFilters,
} from './contracts';

// ============================================================================
// Lesson Structure (Tier 1)
// ============================================================================
export {
  LESSON_SECTIONS,
  LESSON_STRUCTURE_VERSION,
  TOTAL_TARGET_WORD_COUNT,
  getLessonSectionById,
  getLessonSectionByName,
  getRequiredSections,
  getOptionalSections,
} from './lessonStructure';

// ============================================================================
// Age Groups (Tier 2)
// ============================================================================
export {
  AGE_GROUPS,
  AGE_GROUPS_VERSION,
  getAgeGroupById,
  getAgeGroupByLabel,
  getAgeGroupLabels,
  getDefaultAgeGroupLabel,
  isValidAgeGroupLabel,
  getTeachingProfile,
  getDefaultAgeGroup,
} from './ageGroups';

// ============================================================================
// Theological Preferences (Tier 2)
// ============================================================================
export {
  THEOLOGICAL_PREFERENCES,
  SB_CONFESSION_VERSIONS,
  THEOLOGICAL_PREFERENCES_VERSION,
  getTheologicalPreferenceKeys,
  getTheologicalPreference,
  getDefaultTheologicalPreferenceKey,
  getDefaultTheologicalPreference,
  isValidTheologicalPreferenceKey,
  getSBConfessionVersion,
  getDefaultSBConfessionVersionKey,
  isValidSBConfessionVersionKey,
  getDistinctives,
  getTheologicalDisplayLabel,
  getTheologicalPreferenceOptions,
  getSBConfessionVersionOptions,
} from './theologicalPreferences';
