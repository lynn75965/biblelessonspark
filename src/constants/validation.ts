
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
