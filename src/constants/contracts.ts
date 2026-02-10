/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/contracts.ts
 * Generated: 2026-01-28T22:25:06.622Z
 */
﻿/**
 * LessonSparkUSA Constants - TypeScript Contracts
 * @version 1.1.0
 * @lastUpdated 2025-11-22
 */

// ============================================================================
// TIER 1: Lesson Structure Contracts
// ============================================================================

export interface LessonSection {
  id: number;
  name: string;
  description: string;
  required: boolean;
  targetWordCount: number;
  requiredElements: string[];
}

export interface LessonStructure {
  version: string;
  sections: LessonSection[];
}

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
// TIER 2: Theological Preference Contracts
// ============================================================================

export type TheologicalPreferenceKey = 'southern_baptist' | 'reformed_baptist' | 'independent_baptist';

export type SBConfessionVersionKey = 'bfm_1963' | 'bfm_2000';

export interface SBConfessionVersion {
  id: SBConfessionVersionKey;
  label: string;
  year: number;
  distinctives: string[];
}

export interface TheologicalPreference {
  id: TheologicalPreferenceKey;
  name: string;
  short: string;
  label: string;
  description: string;
  distinctives: string[];
  hasVersions: boolean;
  versions?: Record<SBConfessionVersionKey, SBConfessionVersion>;
  defaultVersion?: SBConfessionVersionKey;
  contextDescription: string;
}

// ============================================================================
// TIER 2: Teacher Preference Contracts
// ============================================================================

export interface PreferenceOption {
  id: string;
  label: string;
  description?: string;
}

export interface TeacherPreferences {
  teachingStyle: string;
  classroomManagement: string;
  techIntegration: string;
  classSize: string;
  sessionDuration: string;
  learnerTypes: string[];
  accessibilityNeeds: string[];
}

// ============================================================================
// TIER 2: Language Configuration Contracts
// ============================================================================

export type LanguageKey = 'en' | 'es' | 'fr';

export interface LanguageConfig {
  id: LanguageKey;
  name: string;
  promptInstruction: string;
}

// ============================================================================
// API Request/Response Contracts
// ============================================================================

export interface LessonGenerationRequest {
  passage?: string;
  topic?: string;
  ageGroup: string;
  notes?: string;
  bibleVersion?: string;
  enhancementType?: 'curriculum' | 'generation';
  teacherPreferences?: TeacherPreferences;
  theologicalPreference: TheologicalPreferenceKey;
  sbConfessionVersion?: SBConfessionVersionKey;
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
  language: LanguageKey;
  sbConfessionVersion?: SBConfessionVersionKey;
}

// ============================================================================
// Lesson Filters Contract (stored in lessons.filters JSON column)
// ============================================================================

export interface LessonFilters {
  ageGroup?: string;
  bibleVersion?: string;
  theologicalPreference?: TheologicalPreferenceKey;
  sbConfessionVersion?: SBConfessionVersionKey;
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
 * Lesson entity from lessons table
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
  visibility: 'private' | 'shared';
  theology_profile_id?: string | null;
  /** Phase 27: Lesson Shapes — reshaped content from reshape-lesson Edge Function */
  shaped_content?: string | null;
  /** Phase 27: Lesson Shapes — which shape was applied (ShapeId from lessonShapeProfiles.ts) */
  shape_id?: string | null;
  metadata?: {
    teaser?: string | null;
    ageGroup?: string;
    theologyProfile?: string;
  } | null;
}

/**
 * Organization entity from organizations table
 * Includes all database fields for admin and general use
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
  // Beta program fields
  beta_mode?: boolean;
  beta_start_date?: string | null;
  beta_end_date?: string | null;
  beta_activated_by?: string | null;
}

/**
 * Organization member from organization_members table
 */
export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  joined_at: string;
}

// ============================================================================
// Phase 27: Teaching Team Contracts
// ============================================================================

/**
 * Teaching Team entity from teaching_teams table
 * A lead teacher creates a team and invites up to 3 members.
 * Members see each other's shared lessons only.
 */
export interface TeachingTeam {
  id: string;
  name: string;
  lead_teacher_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * Teaching Team Member entity from teaching_team_members table
 */
export type TeamMemberStatus = 'pending' | 'accepted' | 'declined';

export interface TeachingTeamMember {
  id: string;
  team_id: string;
  user_id: string;
  status: TeamMemberStatus;
  invited_at: string;
  responded_at: string | null;
}

/**
 * Extended team member with profile info (for display)
 * Populated by joining teaching_team_members with profiles
 */
export interface TeachingTeamMemberWithProfile extends TeachingTeamMember {
  display_name: string | null;
  email: string | null;
}

/**
 * Pending invitation view (for the invitee's dashboard banner)
 */
export interface PendingTeamInvitation {
  membership_id: string;
  team_id: string;
  team_name: string;
  lead_teacher_name: string | null;
  invited_at: string;
}
