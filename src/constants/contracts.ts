import type { TeacherPreferences } from './teacherPreferences';

/**
 * BibleLessonSpark — TypeScript Contracts (SSOT)
 * 
 * Single Source of Truth for all shared TypeScript interfaces and types.
 * Every consumer imports from this file. No duplicate definitions.
 * 
 * CHANGELOG v2.0.0 (February 19, 2026):
 * - Replaced legacy 3-key TheologicalPreferenceKey with 10-profile TheologyProfileId
 * - Removed SBConfessionVersion system (superseded by distinct profile IDs)
 * - Added TeachingTeam and TeachingTeamMember interfaces (Phase 27A)
 * - Added LessonShapeId and ReshapeMetrics interfaces (Phase 27B)
 * - Added shaped_content and shape_id to Lesson interface
 * - Updated LessonGenerationRequest, LessonGenerationResponse, LessonFilters
 * - Added UserProfile interface matching profiles table schema
 * - Added BibleVersionKey type for the 9 supported translations
 * 
 * CROSS-FILE DEPENDENCIES:
 * - ageGroups.ts imports: AgeGroup, TeachingProfile
 * - theologyProfiles.ts defines: TheologyProfile (owns that interface)
 * - accessControl.ts defines: Role, OrgRole (owns those types)
 * - validation.ts: no imports from this file
 * 
 * @version 2.0.0
 * @lastUpdated 2026-02-19
 */

// ============================================================================
// TIER 1: Lesson Structure � SSOT is lessonStructure.ts (not here)



// ============================================================================
// TIER 2: Age Group Contracts
// ============================================================================

export interface TeachingProfile {
  vocabularyLevel: 'simple' | 'moderate' | 'advanced' | 'scholarly';
  attentionSpan: number;
  preferredActivities: string[];
  abstractThinking: 'concrete' | 'emerging' | 'developing' | 'mature';
  specialConsiderations: string[];
}

export interface AgeGroup {
  id: string;
  label: string;
  ageMin: number;
  ageMax: number;
  description: string;
  teachingProfile: TeachingProfile;
}

// ============================================================================
// TIER 2: Theology Profile Contracts
// ============================================================================

/**
 * All 10 Baptist theology profile IDs.
 * Must match theologyProfiles.ts THEOLOGY_PROFILES[].id exactly.
 * 
 * NOTE: The TheologyProfile interface itself lives in theologyProfiles.ts
 * (that file owns the full profile shape). This type covers just the ID
 * so other files can reference it without importing the full profiles.
 */
export type TheologyProfileId =
  | 'baptist-core-beliefs'          // 1.  Baptist Core Beliefs (DEFAULT)
  | 'southern-baptist-bfm-1963'     // 2.  Southern Baptist (BF&M 1963)
  | 'southern-baptist-bfm-2000'     // 3.  Southern Baptist (BF&M 2000)
  | 'national-baptist-convention'   // 4.  National Baptist Convention (USA)
  | 'independent-baptist'           // 5.  Independent Baptist
  | 'missionary-baptist'            // 6.  Missionary Baptist
  | 'general-baptist'               // 7.  General Baptist
  | 'free-will-baptist'             // 8.  Free Will Baptist
  | 'primitive-baptist'             // 9.  Primitive Baptist
  | 'reformed-baptist';             // 10. Reformed Baptist

/** The default theology profile ID */
export const DEFAULT_THEOLOGY_PROFILE_ID: TheologyProfileId = 'baptist-core-beliefs';

/**
 * Security doctrine stances across profiles.
 * Used by theologyProfiles.ts in profile definitions.
 */
export type SecurityDoctrine = 'eternal' | 'conditional' | 'perseverance';

/**
 * TULIP stance across profiles.
 * 'anti' = rejects Calvinistic terminology
 * 'pro' = embraces Reformed/TULIP terminology
 */
export type TulipStance = 'anti' | 'pro';

// ============================================================================
// TIER 2: Bible Version Contracts
// ============================================================================

/**
 * Supported Bible translations.
 * Must match bibleVersions.ts definitions exactly.
 * KJV is public domain (direct quotes allowed).
 * All others require paraphrase for copyright compliance.
 */
export type BibleVersionKey = 'kjv' | 'web' | 'nkjv' | 'esv' | 'nasb' | 'niv' | 'csb' | 'nlt' | 'amp';

/** The default Bible version */
export const DEFAULT_BIBLE_VERSION: BibleVersionKey = 'nasb';

// ============================================================================
// TIER 2: Language Configuration Contracts
// ============================================================================

export type LanguageKey = 'en' | 'es' | 'fr';

export interface LanguageConfig {
  id: LanguageKey;
  name: string;
  promptInstruction: string;
}

/** The default language */
export const DEFAULT_LANGUAGE: LanguageKey = 'en';

// ============================================================================
// TIER 2: Lesson Shape Contracts (Phase 27B)
// ============================================================================

/**
 * All 5 lesson shape IDs.
 * Must match lessonShapeProfiles.ts shape definitions exactly.
 * 
 * NOTE: Full shape definitions (prompts, age-group mappings, etc.)
 * live in lessonShapeProfiles.ts. This type covers just the ID.
 */
export type LessonShapeId =
  | 'passage_walkthrough'      // Verse-by-verse guided study
  | 'life_connection'           // Real-life situation → Scripture → response
  | 'gospel_centered'           // Creation–Fall–Redemption–Restoration arc
  | 'focus_discover_respond'    // Three-movement: focus → discover → respond
  | 'story_driven';             // Narrative experience; truth from story

// ============================================================================
// TIER 2: Teacher Preference Contracts
// ============================================================================




// ============================================================================
// TIER 2: Teaching Team Contracts (Phase 27A)
// ============================================================================

/** Status of a teaching team member's invitation */
export type TeachingTeamMemberStatus = 'pending' | 'accepted' | 'declined';

/**
 * Teaching team entity from teaching_teams table.
 * A lead teacher creates one team and invites up to 2 others (3 total).
 */
export interface TeachingTeam {
  id: string;
  name: string;
  lead_teacher_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Teaching team member entity from teaching_team_members table.
 */
export interface TeachingTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  status: TeachingTeamMemberStatus;
  invited_at: string;
  responded_at: string | null;
}

// ============================================================================
// API Request/Response Contracts
// ============================================================================

export interface LessonGenerationRequest {
  passage?: string;
  topic?: string;
  ageGroup: string;
  notes?: string;
  bibleVersion?: BibleVersionKey;
  enhancementType?: 'curriculum' | 'generation';
  teacherPreferences?: TeacherPreferences;
  theologyProfileId: TheologyProfileId;
  language?: LanguageKey;
  extractedContent?: string;
  sessionId?: string;
  uploadId?: string;
  fileHash?: string;
  sourceFile?: string;
}

export interface LessonContent {
  overview: string;
  objectives: string;
  scripture: string;
  background: string;
  openingActivities: string;
  mainContent: string;
  interactiveActivities: string;
  discussionQuestions: string;
  lifeApplications: string;
  assessmentMethods: string;
  takeHomeResources: string;
  teacherNotes: string;
  fullContent: string;
}

export interface LessonGenerationResponse {
  content: LessonContent;
  title: string;
  wordCount: number;
  estimatedDuration: string;
  theologicalLens: string;
  theologyProfileId: TheologyProfileId;
  language: LanguageKey;
}

// ============================================================================
// Lesson Filters Contract (stored in lessons.filters JSON column)
// ============================================================================

export interface LessonFilters {
  ageGroup?: string;
  bibleVersion?: BibleVersionKey;
  theologyProfileId?: TheologyProfileId;
  sessionId?: string | null;
  uploadId?: string | null;
  passage?: string;
  topic?: string;
  notes?: string;
  overview?: string;
  objectives?: string;
  scripture?: string;
  background?: string;
  opening?: string;
  teaching?: string;
  activities?: string;
  discussion?: string;
  applications?: string;
  assessment?: string;
  resources?: string;
  preparation?: string;
}

// ============================================================================
// Database Entity Types (Frontend SSOT)
// ============================================================================

/**
 * Lesson entity from lessons table.
 * Includes Phase 27B shaped content fields.
 */
export interface Lesson {
  id: string;
  title: string | null;
  original_text: string | null;
  source_type: string;
  upload_path: string | null;
  filters: LessonFilters | null;
  created_at: string | null;
  user_id: string;
  organization_id: string | null;
  theology_profile_id?: TheologyProfileId | null;
  /** Reshaped lesson content (null = not reshaped) */
  shaped_content?: string | null;
  /** ID of the shape used for reshaping (e.g., 'passage_walkthrough') */
  shape_id?: LessonShapeId | null;
  metadata?: {
    teaser?: string | null;
    ageGroup?: string;
    theologyProfile?: string;
  } | null;
}

/**
 * Reshape metrics entity from reshape_metrics table.
 * Logged every time a lesson is reshaped (Phase 27B).
 */
export interface ReshapeMetrics {
  id: string;
  lesson_id: string;
  user_id: string;
  shape_id: LessonShapeId;
  age_group: string;
  theology_profile?: string | null;
  processing_time_ms?: number | null;
  input_tokens?: number | null;
  output_tokens?: number | null;
  model: string;
  created_at: string;
}

/**
 * User profile entity from profiles table.
 * 
 * CRITICAL: The column is `full_name`, NOT `display_name`.
 * This has caused a bug before — see PROJECT_MASTER Bug #1.
 */
export interface UserProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  preferred_language: LanguageKey | null;
  default_bible_version: BibleVersionKey | null;
  theology_profile_id: TheologyProfileId | null;
  organization_role: string | null;
  organization_id: string | null;
}

/**
 * Organization entity from organizations table.
 * Includes all database fields for admin and general use.
 */
export interface Organization {
  id: string;
  name: string;
  organization_type?: string;
  denomination?: string | null;
  default_doctrine?: string;
  status?: string;
  description?: string | null;
  website?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  created_at: string;
  updated_at?: string;
  created_by?: string;
  requested_by?: string | null;
  approved_by?: string | null;
  approved_at?: string | null;
  beta_mode?: boolean;
  beta_start_date?: string | null;
  beta_end_date?: string | null;
  beta_activated_by?: string | null;
}

/**
 * Organization member from organization_members table.
 */
export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

