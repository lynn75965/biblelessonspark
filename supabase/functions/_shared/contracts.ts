/**
 * LessonSparkUSA Constants - TypeScript Contracts
 * 
 * These interfaces define the shape of all constants.
 * They enforce type safety and consistency across the application.
 * 
 * GOVERNANCE: Only admin can modify these contracts.
 * Changes here affect the entire system.
 * 
 * @version 1.0.0
 * @lastUpdated 2025-11-21
 */

// ============================================================
// TIER 1: Lesson Structure Contracts
// ============================================================

/**
 * Defines a single section in the 12-section lesson structure.
 * These are UNCHANGING - the foundation of every lesson.
 */
export interface LessonSection {
  /** Unique identifier (1-12) */
  id: number;
  /** Section name as displayed to users */
  name: string;
  /** Brief description of section purpose */
  description: string;
  /** Whether this section is required in every lesson */
  required: boolean;
  /** Approximate word count target for this section */
  targetWordCount: number;
  /** Key elements that MUST be included */
  requiredElements: string[];
}

/**
 * The complete lesson structure definition
 */
export interface LessonStructure {
  version: string;
  sections: LessonSection[];
}

// ============================================================
// TIER 2: Age Group Contracts
// ============================================================

/**
 * Teaching profile that shapes how content is generated for an age group
 */
export interface TeachingProfile {
  /** Vocabulary complexity level */
  vocabularyLevel: 'simple' | 'moderate' | 'advanced' | 'scholarly';
  /** Typical attention span in minutes */
  attentionSpan: number;
  /** Types of activities that work best */
  preferredActivities: string[];
  /** Abstract vs concrete thinking capability */
  abstractThinking: 'concrete' | 'emerging' | 'developing' | 'mature';
  /** Special considerations for this age group */
  specialConsiderations: string[];
}

/**
 * Complete age group definition with teaching profile
 */
export interface AgeGroup {
  /** Unique identifier (e.g., 'preschool', 'elementary') */
  id: string;
  /** Display label (e.g., 'Preschoolers (Ages 3-5)') */
  label: string;
  /** Age range start */
  ageMin: number;
  /** Age range end */
  ageMax: number;
  /** Detailed description for UI tooltips */
  description: string;
  /** Teaching profile for AI content generation */
  teachingProfile: TeachingProfile;
}

// ============================================================
// TIER 2: Theological Preference Contracts
// ============================================================

/**
 * A theological lens that shapes content generation
 */
export interface TheologicalPreference {
  /** Unique identifier (e.g., 'sbc-bfm2000', 'reformed-baptist') */
  id: string;
  /** Display label */
  label: string;
  /** Full name of the tradition */
  fullName: string;
  /** Brief description */
  description: string;
  /** Key theological emphases */
  emphases: string[];
  /** Associated confession/statement, if any */
  confessionId?: string;
}

/**
 * A confession of faith or doctrinal statement
 */
export interface ConfessionVersion {
  /** Unique identifier (e.g., 'bfm-1963', 'bfm-2000') */
  id: string;
  /** Display label */
  label: string;
  /** Full official name */
  fullName: string;
  /** Year adopted/published */
  year: number;
  /** Brief description of distinctives */
  description: string;
}

// ============================================================
// TIER 2: Teacher Preference Contracts
// ============================================================

/**
 * Generic option type for teacher preferences
 */
export interface PreferenceOption {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Description shown in UI */
  description?: string;
}

/**
 * Class size option
 */
export interface ClassSizeOption extends PreferenceOption {
  /** Minimum class size */
  min: number;
  /** Maximum class size */
  max: number;
}

/**
 * Session duration option
 */
export interface SessionDurationOption extends PreferenceOption {
  /** Duration in minutes */
  minutes: number;
}

/**
 * All teacher preference categories
 */
export interface TeacherPreferences {
  classSizes: ClassSizeOption[];
  sessionDurations: SessionDurationOption[];
  learningStyles: PreferenceOption[];
  engagementLevels: PreferenceOption[];
  discussionFormats: PreferenceOption[];
  activityComplexities: PreferenceOption[];
  handoutStyles: PreferenceOption[];
  visualAidPreferences: PreferenceOption[];
  preparationTimes: PreferenceOption[];
}

// ============================================================
// TIER 2: Bible Version Contracts
// ============================================================

/**
 * Bible translation/version
 */
export interface BibleVersion {
  /** API.Bible ID */
  id: string;
  /** Display abbreviation (e.g., 'KJV', 'NIV') */
  abbreviation: string;
  /** Full name */
  name: string;
  /** Reading level description */
  readingLevel?: string;
}

// ============================================================
// TIER 2: System Options Contracts
// ============================================================

/**
 * Enhancement type for lesson generation
 */
export interface EnhancementType extends PreferenceOption {
  /** Whether this is the default selection */
  isDefault?: boolean;
}

/**
 * Source type for lesson content
 */
export interface SourceType extends PreferenceOption {
  /** File extensions accepted, if applicable */
  acceptedExtensions?: string[];
}

/**
 * Language option for lesson generation
 */
export interface LanguageOption extends PreferenceOption {
  /** ISO language code */
  isoCode: string;
}

/**
 * All system options
 */
export interface SystemOptions {
  enhancementTypes: EnhancementType[];
  sourceTypes: SourceType[];
  languages: LanguageOption[];
}

// ============================================================
// UTILITY TYPES
// ============================================================

/**
 * Type for looking up any constant by ID
 */
export type ConstantId = string;

/**
 * Result of a lookup operation
 */
export interface LookupResult<T> {
  found: boolean;
  value?: T;
  fallbackUsed?: boolean;
}
