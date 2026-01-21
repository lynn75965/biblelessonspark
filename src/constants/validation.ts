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

// Denomination options for organizations (SSOT)
export const DENOMINATION_OPTIONS = [
  "Southern Baptist Convention",
  "National Baptist",
  "Independent Baptist",
  "Reformed Baptist",
  "General Baptist",
  "Missionary Baptist",
  "Primitive Baptist",
  "Other",
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
