/**
 * AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
 *
 * Source: src/constants/teacherPreferences.ts
 * Generated: 2025-12-28T20:08:56.714Z
 */
/**
 * Teacher Preferences SSOT
 * Single Source of Truth for all teacher customization options
 *
 * Architecture: Frontend drives backend
 * This file syncs to: supabase/functions/_shared/teacherPreferences.ts
 *
 * UPDATED: December 2025
 * - Reduced to 13 active profile fields
 * - Added: lessonSequence, language, activityTypes
 * - Added: 15 minutes to LESSON_LENGTHS
 * - Lesson Sequence moved to last position in UI
 */

// ============================================================================
// OPTION INTERFACES
// ============================================================================

export interface PreferenceOption {
  id: string;
  label: string;
  description?: string;
  tooltip?: string;
}

export interface CheckboxOption {
  id: string;
  label: string;
}

// ============================================================================
// TEACHING STYLE OPTIONS
// ============================================================================

export const TEACHING_STYLES: PreferenceOption[] = [
  { id: "lecture", label: "Lecture-Based", description: "Teacher-led instruction with structured content delivery" },
  { id: "discussion", label: "Discussion-Based", description: "Emphasizes dialogue and student participation" },
  { id: "interactive", label: "Interactive/Hands-On", description: "Hands-on learning through activities and exercises" },
  { id: "storytelling", label: "Storytelling", description: "Narrative-driven teaching using stories and examples" },
  { id: "socratic", label: "Socratic Method", description: "Teaching through probing questions that lead students to discover truth themselves", tooltip: "Teaching through asking probing questions that lead students to discover truth themselves, rather than directly telling them answers" },
  { id: "mixed", label: "Mixed", description: "Balanced combination of teaching methods" },
] as const;

// ============================================================================
// LEARNING STYLE OPTIONS
// ============================================================================

export const LEARNING_STYLES: PreferenceOption[] = [
  { id: "visual", label: "Visual Learners", description: "Learn best through images, diagrams, and visual aids" },
  { id: "auditory", label: "Auditory Learners", description: "Learn best through listening and discussion" },
  { id: "kinesthetic", label: "Kinesthetic/Hands-On", description: "Learn best through physical activities and movement" },
  { id: "reading-writing", label: "Reading/Writing", description: "Learn best through reading and written exercises" },
  { id: "mixed", label: "Mixed Learning Styles", description: "Accommodate multiple learning preferences" },
] as const;

// ============================================================================
// LESSON LENGTH OPTIONS
// Updated: Added 15 minutes option for short devotionals/preschool
// ============================================================================

export const LESSON_LENGTHS: PreferenceOption[] = [
  { id: "15", label: "15 minutes", description: "Very brief session, preschool or quick devotional" },
  { id: "30", label: "30 minutes", description: "Brief session, typically children's classes" },
  { id: "45", label: "45 minutes", description: "Standard Sunday School timeframe" },
  { id: "60", label: "60 minutes", description: "Extended class period" },
  { id: "75", label: "75 minutes", description: "In-depth study session" },
  { id: "90", label: "90 minutes", description: "Extended study or workshop format" },
] as const;

// ============================================================================
// GROUP SIZE OPTIONS
// ============================================================================

export const GROUP_SIZES: PreferenceOption[] = [
  { id: "small-group", label: "Small Group (3-12)", description: "Intimate setting allowing individual attention" },
  { id: "large-group", label: "Large Group (13+)", description: "Larger group requiring structured activities" },
  { id: "one-on-one", label: "One-on-One", description: "Individual mentoring or tutoring" },
  { id: "family", label: "Family Setting", description: "Multi-generational family worship" },
  { id: "mixed", label: "Mixed Groups", description: "Variable group sizes" },
] as const;

// ============================================================================
// LEARNING ENVIRONMENT OPTIONS
// ============================================================================

export const LEARNING_ENVIRONMENTS: PreferenceOption[] = [
  { id: "classroom", label: "Church Classroom", description: "Standard room with chairs/tables" },
  { id: "fellowship-hall", label: "Fellowship Hall", description: "Larger multipurpose room" },
  { id: "home", label: "Home Setting", description: "Small group in residential setting" },
  { id: "outdoor", label: "Outdoor/Nature", description: "Outside venue or nature setting" },
  { id: "virtual", label: "Virtual/Online", description: "Remote video conferencing" },
  { id: "mixed", label: "Mixed Environments", description: "Variable locations" },
] as const;

// ============================================================================
// STUDENT EXPERIENCE LEVEL OPTIONS
// ============================================================================

export const STUDENT_EXPERIENCE_LEVELS: PreferenceOption[] = [
  { id: "new-believers", label: "New Believers", description: "Recently accepted Christ" },
  { id: "growing", label: "Growing Christians", description: "Developing in faith journey" },
  { id: "mature", label: "Mature Christians", description: "Established, seasoned Christians" },
  { id: "seekers", label: "Seekers/Non-Believers", description: "Exploring faith questions" },
  { id: "mixed", label: "Mixed Experience Levels", description: "Variety of spiritual maturity" },
] as const;

// ============================================================================
// EDUCATION EXPERIENCE OPTIONS
// ============================================================================

export const EDUCATION_EXPERIENCES: PreferenceOption[] = [
  { id: "preschool", label: "Preschool", description: "Early childhood education" },
  { id: "elementary", label: "Elementary Education", description: "Elementary school level" },
  { id: "middle", label: "Middle School", description: "Middle school level" },
  { id: "high-school", label: "High School", description: "High school level" },
  { id: "some-college", label: "Some College", description: "Partial college education" },
  { id: "associates", label: "Associate's Degree", description: "Two-year college degree" },
  { id: "bachelors", label: "Bachelor's Degree", description: "Four-year college degree" },
  { id: "masters", label: "Master's Degree", description: "Graduate degree" },
  { id: "doctorate", label: "Doctoral/Advanced Degree", description: "Doctoral or professional degree" },
  { id: "mixed", label: "Mixed Education Levels", description: "Diverse educational backgrounds" },
] as const;

// ============================================================================
// CULTURAL CONTEXT OPTIONS
// ============================================================================

export const CULTURAL_CONTEXTS: PreferenceOption[] = [
  { id: "urban", label: "Urban", description: "City or metropolitan area context" },
  { id: "suburban", label: "Suburban", description: "Residential areas outside city centers" },
  { id: "rural", label: "Rural", description: "Country or small-town setting" },
  { id: "international", label: "International", description: "Multicultural or missionary context" },
  { id: "multicultural", label: "Multicultural", description: "Diverse cultural backgrounds" },
  { id: "mixed", label: "Mixed Contexts", description: "Variable cultural settings" },
] as const;

// ============================================================================
// SPECIAL NEEDS OPTIONS
// ============================================================================

export const SPECIAL_NEEDS_OPTIONS: PreferenceOption[] = [
  { id: "none", label: "None", description: "No special accommodations needed" },
  { id: "learning-disabilities", label: "Learning Disabilities", description: "Dyslexia, ADHD, etc." },
  { id: "visual-impaired", label: "Visual Impairment", description: "Low vision or blindness" },
  { id: "hearing-impaired", label: "Hearing Impairment", description: "Hard of hearing or deaf" },
  { id: "esl", label: "ESL/English Learners", description: "English as second language" },
  { id: "mobility", label: "Mobility Challenges", description: "Physical movement limitations" },
  { id: "mixed", label: "Mixed Needs", description: "Multiple accommodation needs" },
] as const;

// ============================================================================
// ASSESSMENT STYLE OPTIONS
// ============================================================================

export const ASSESSMENT_STYLES: PreferenceOption[] = [
  { id: "discussion", label: "Informal Discussion", description: "Conversational assessment through dialogue" },
  { id: "written", label: "Written Reflection", description: "Journaling and written responses" },
  { id: "quiz", label: "Quiz/Test", description: "Written tests and quizzes" },
  { id: "questionnaire", label: "Questionnaire", description: "Structured question formats" },
  { id: "presentation", label: "Student Presentation", description: "Oral presentations and sharing" },
  { id: "project", label: "Group Project", description: "Collaborative demonstrations" },
  { id: "observation", label: "Observation Only", description: "Teacher observes without formal assessment" },
] as const;

// ============================================================================
// LANGUAGE OPTIONS
// ============================================================================

export const LANGUAGE_OPTIONS: PreferenceOption[] = [
  { id: "english", label: "English", description: "Generate lesson in English" },
  { id: "spanish", label: "Spanish", description: "Generate lesson in Spanish" },
  { id: "french", label: "French", description: "Generate lesson in French" },
] as const;

// ============================================================================
// LESSON SEQUENCE OPTIONS
// Note: This appears LAST in the UI grid so "Part of Series" inputs flow naturally
// ============================================================================

export const LESSON_SEQUENCE_OPTIONS: PreferenceOption[] = [
  { id: "single_lesson", label: "Single Lesson", description: "Complete standalone lesson with all 8 sections" },
  { id: "part_of_series", label: "Part of Series", description: "One lesson in a connected series (7 max)" },
] as const;

// ============================================================================
// ACTIVITY TYPE OPTIONS (Checkboxes)
// ============================================================================

export const ACTIVITY_TYPE_OPTIONS: CheckboxOption[] = [
  { id: "written", label: "Written reflection" },
  { id: "verbal", label: "Verbal interaction" },
  { id: "creative", label: "Creative arts" },
  { id: "drama", label: "Drama & role-play" },
  { id: "games", label: "Games & movement" },
  { id: "music", label: "Music & worship" },
  { id: "prayer", label: "Prayer practices" },
] as const;

// ============================================================================
// TEACHER PREFERENCES INTERFACE
// Defines the shape of saved profile data (13 fields)
// ============================================================================

export interface TeacherPreferences {
  // Core teaching settings
  teachingStyle: string;
  learningStyle: string;
  lessonLength: string;
  groupSize: string;
  learningEnvironment: string;

  // Student context
  studentExperience: string;
  educationExperience: string;
  culturalContext: string;
  specialNeeds: string;

  // Lesson format
  assessmentStyle: string;
  language: string;
  lessonSequence: string;

  // Activity preferences (multi-select)
  activityTypes: string[];
}

// ============================================================================
// DEFAULT PREFERENCES
// Used when no profile is loaded
// ============================================================================

export const DEFAULT_TEACHER_PREFERENCES: TeacherPreferences = {
  teachingStyle: "",
  learningStyle: "",
  lessonLength: "",
  groupSize: "",
  learningEnvironment: "",
  studentExperience: "",
  educationExperience: "",
  culturalContext: "",
  specialNeeds: "",
  assessmentStyle: "",
  language: "english",
  lessonSequence: "",
  activityTypes: [],
} as const;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getOptionLabel(options: readonly PreferenceOption[], id: string): string {
  return options.find(opt => opt.id === id)?.label ?? id;
}

export function getOptionDescription(options: readonly PreferenceOption[], id: string): string | undefined {
  return options.find(opt => opt.id === id)?.description;
}

export function getOptionTooltip(options: readonly PreferenceOption[], id: string): string | undefined {
  return options.find(opt => opt.id === id)?.tooltip;
}

export function getCheckboxLabel(options: readonly CheckboxOption[], id: string): string {
  return options.find(opt => opt.id === id)?.label ?? id;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TeachingStyleKey = typeof TEACHING_STYLES[number]["id"];
export type LearningStyleKey = typeof LEARNING_STYLES[number]["id"];
export type LessonLengthKey = typeof LESSON_LENGTHS[number]["id"];
export type GroupSizeKey = typeof GROUP_SIZES[number]["id"];
export type LearningEnvironmentKey = typeof LEARNING_ENVIRONMENTS[number]["id"];
export type StudentExperienceKey = typeof STUDENT_EXPERIENCE_LEVELS[number]["id"];
export type EducationExperienceKey = typeof EDUCATION_EXPERIENCES[number]["id"];
export type CulturalContextKey = typeof CULTURAL_CONTEXTS[number]["id"];
export type SpecialNeedsKey = typeof SPECIAL_NEEDS_OPTIONS[number]["id"];
export type AssessmentStyleKey = typeof ASSESSMENT_STYLES[number]["id"];
export type LanguageKey = typeof LANGUAGE_OPTIONS[number]["id"];
export type LessonSequenceKey = typeof LESSON_SEQUENCE_OPTIONS[number]["id"];
export type ActivityTypeKey = typeof ACTIVITY_TYPE_OPTIONS[number]["id"];
