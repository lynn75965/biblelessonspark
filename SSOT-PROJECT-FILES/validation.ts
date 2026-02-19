
// =============================================================================
// ORGANIZATION VALIDATION CONSTANTS
// SSOT Reference: Phase 11-B1 Org Leader Activation
// =============================================================================

export const ORGANIZATION_VALIDATION = {
  // Organization name
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  
  // Organization status values (matches database CHECK constraint)
  STATUS_VALUES: ['pending', 'approved', 'rejected'] as const,
  
  // Shared focus/theme (matches database CHECK constraints)
  FOCUS_PASSAGE_MAX_LENGTH: 200,
  FOCUS_THEME_MAX_LENGTH: 200,
  FOCUS_NOTES_MAX_LENGTH: 1000,
} as const;

export type OrganizationStatus = typeof ORGANIZATION_VALIDATION.STATUS_VALUES[number];

// Re-export ORG_ROLES from accessControl for validation use
export { ORG_ROLES } from './accessControl';

// Denomination options for organizations (SSOT for org signup)
// Cross-reference: theologyProfiles.ts owns theology profile definitions.
// Denomination != theology profile (one denomination may map to multiple profiles,
// e.g., "Southern Baptist Convention" maps to BF&M 1963 and BF&M 2000).
// "Other Baptist" has no dedicated profile — uses Baptist Core Beliefs default.
export const DENOMINATION_OPTIONS = [
  "Southern Baptist Convention",
  "National Baptist",
  "Independent Baptist",
  "Missionary Baptist",
  "General Baptist",
  "Free Will Baptist",
  "Primitive Baptist",
  "Reformed Baptist",
  "Other Baptist",
] as const;

export type DenominationType = typeof DENOMINATION_OPTIONS[number];
// =============================================================================
// PASSWORD VALIDATION CONSTANTS
// SSOT Reference: Phase 12 - Beta User Authentication
// =============================================================================
export const PASSWORD_VALIDATION = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: false,
  SPECIAL_CHARS: '!@#$%^&*()_+-=[]{}|;:,.<>?',
} as const;

export const PASSWORD_REQUIREMENTS_TEXT = [
  `At least ${PASSWORD_VALIDATION.MIN_LENGTH} characters`,
  'At least one uppercase letter (A-Z)',
  'At least one lowercase letter (a-z)',
  'At least one number (0-9)',
  'Special characters allowed (#$%!*@)',
] as const;

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_VALIDATION.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_VALIDATION.MIN_LENGTH} characters`);
  }
  
  if (PASSWORD_VALIDATION.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (PASSWORD_VALIDATION.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (PASSWORD_VALIDATION.REQUIRE_NUMBER && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (PASSWORD_VALIDATION.REQUIRE_SPECIAL && !new RegExp(`[${PASSWORD_VALIDATION.SPECIAL_CHARS.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}]`).test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return { valid: errors.length === 0, errors };
}


// =============================================================================
// TEACHING TEAM VALIDATION CONSTANTS
// SSOT Reference: Phase 27A - Teaching Teams
// Lead teacher + up to 3 invited = 4 total
// =============================================================================

export const TEACHING_TEAM_VALIDATION = {
  TEAM_NAME_MIN_LENGTH: 3,
  TEAM_NAME_MAX_LENGTH: 60,
  MAX_TEAM_MEMBERS: 4,
  MAX_INVITED_MEMBERS: 3,
} as const;

// =============================================================================
// USER PROFILE VALIDATION CONSTANTS
// SSOT Reference: UserProfileModal, Auth forms
// =============================================================================

export const USER_PROFILE_VALIDATION = {
  FULL_NAME_MIN_LENGTH: 2,
  FULL_NAME_MAX_LENGTH: 100,
  EMAIL_MAX_LENGTH: 254,
} as const;

// =============================================================================
// TEACHER PROFILE VALIDATION CONSTANTS
// SSOT Reference: TeacherCustomization, useTeacherProfiles
// =============================================================================

export const TEACHER_PROFILE_VALIDATION = {
  PROFILE_NAME_MIN_LENGTH: 2,
  PROFILE_NAME_MAX_LENGTH: 50,
  MAX_PROFILES: 5,
} as const;

// =============================================================================
// LESSON GENERATION VALIDATION CONSTANTS
// SSOT Reference: EnhanceLessonForm
// =============================================================================

export const LESSON_VALIDATION = {
  PASSAGE_MIN_LENGTH: 3,
  PASSAGE_MAX_LENGTH: 200,
  TOPIC_MAX_LENGTH: 200,
  NOTES_MAX_LENGTH: 1000,
  CURRICULUM_PASTE_MAX_LENGTH: 50000,
  FILE_UPLOAD_MAX_SIZE_MB: 10,
} as const;