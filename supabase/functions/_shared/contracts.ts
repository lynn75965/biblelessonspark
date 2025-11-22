/**
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