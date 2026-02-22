/**
 * BibleLessonSpark Constants - Barrel Export
 * @version 2.0.0
 * @lastUpdated 2026-02-19
 * 
 * SSOT Update v2.0.0:
 * - Added new types from contracts.ts v2.0.0: TeachingTeam, TeachingTeamMember,
 *   TeachingTeamMemberStatus, ReshapeMetrics, UserProfile, Lesson,
 *   Organization, OrganizationMember
 * - contracts.ts no longer duplicates types owned by other SSOT files
 *   (theology profile IDs, bible version IDs, lesson shape IDs live in
 *   their respective SSOT files — not here)
 *   still exported with @deprecated tags for backward compatibility
 */
// ============================================================================
// TypeScript Contracts (Interfaces & Types)
// ============================================================================
export type {
  // Age groups
  TeachingProfile,
  AgeGroup,
  // Language
  LanguageKey,
  LanguageConfig,
  // Teacher preferences
  PreferenceOption,
  TeacherPreferences,
  // Teaching teams (Phase 27A)
  TeachingTeam,
  TeachingTeamMember,
  TeachingTeamMemberStatus,
  // API contracts
  LessonGenerationRequest,
  LessonContent,
  LessonGenerationResponse,
  LessonFilters,
  // Database entities
  Lesson,
  ReshapeMetrics,
  UserProfile,
  Organization,
  OrganizationMember,
  // Legacy (deprecated — migrate to theologyProfiles.ts types)
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
// Theology Profiles (Tier 2) - SSOT for all Baptist theology profiles
// ============================================================================
export type {
  TheologyProfile,
} from './theologyProfiles';

export {
  THEOLOGY_PROFILES,
  THEOLOGY_PROFILE_OPTIONS,
  getTheologyProfile,
  getDefaultTheologyProfile,
  getTheologyProfilesSorted,
  getTheologyProfileOptions,
  generateTheologicalGuardrails,
} from './theologyProfiles';
// ============================================================================
// Teacher Preferences (Tier 3)
// ============================================================================
export type {
  PreferenceOption as TeacherPreferenceOption,
  CheckboxOption,
  TeachingStyleKey,
  AssessmentPreferenceKey,
  ClassSizeKey,
  MeetingFrequencyKey,
  SessionDurationKey,
  PhysicalSpaceKey,
  EngagementLevelKey,
  DiscussionFormatKey,
  ActivityComplexityKey,
  BibleTranslationKey,
  TheologicalEmphasisKey,
  ApplicationFocusKey,
  DepthLevelKey,
  HandoutStyleKey,
  VisualAidPreferenceKey,
  PreparationTimeKey,
  CulturalBackgroundKey,
  SocioeconomicContextKey,
  EducationalBackgroundKey,
  SpiritualMaturityKey,
} from './teacherPreferences';

export {
  // Teacher Profile Options
  TEACHING_STYLES,
  CLASSROOM_MANAGEMENT_STYLES,
  TECH_INTEGRATION_LEVELS,
  ASSESSMENT_PREFERENCES,
  // Class Context Options
  CLASS_SIZES,
  MEETING_FREQUENCIES,
  SESSION_DURATIONS,
  PHYSICAL_SPACES,
  SPECIAL_NEEDS_OPTIONS,
  // Pedagogy Options
  LEARNING_STYLE_OPTIONS,
  ENGAGEMENT_LEVELS,
  DISCUSSION_FORMATS,
  ACTIVITY_COMPLEXITY_LEVELS,
  // Theology Options
  BIBLE_TRANSLATIONS,
  THEOLOGICAL_EMPHASES,
  APPLICATION_FOCUSES,
  DEPTH_LEVELS,
  // Resource Options
  HANDOUT_STYLES,
  VISUAL_AID_PREFERENCES,
  PREPARATION_TIME_OPTIONS,
  TAKEHOME_MATERIAL_OPTIONS,
  // Cultural Context Options
  CULTURAL_BACKGROUNDS,
  SOCIOECONOMIC_CONTEXTS,
  EDUCATIONAL_BACKGROUNDS,
  SPIRITUAL_MATURITY_LEVELS,
  // Defaults & Helpers
  DEFAULT_TEACHER_PREFERENCES,
  getOptionLabel,
  getOptionDescription,
  getCheckboxLabel,
} from './teacherPreferences';

// ============================================================================
// Access Control (SSOT for role-based visibility)
// ============================================================================
export {
  ROLES,
  TAB_ACCESS,
  FEATURE_ACCESS,
  REQUIRES_ORG_CONTEXT,
  canAccessTab,
  canAccessFeature,
  getEffectiveRole,
} from './accessControl';

export type {
  Role,
  TabKey,
  FeatureKey,
} from './accessControl';
