/**
 * BibleLessonSpark — Audience Configuration (SSOT)
 *
 * Single Source of Truth for all role, assembly, and participant language
 * across the platform. Every UI label, export heading, AI prompt injection,
 * and filter dimension resolves from this file — never from hardcoded strings.
 *
 * PLATFORM LANGUAGE PRINCIPLE:
 * BLS serves leaders, pastors, and teachers across many contexts — not only
 * Sunday School classrooms. Hardcoded terms like "Teacher," "Student,"
 * "Sunday School," and "Class" are prohibited in UI strings, export labels,
 * and generated content. Always resolve from the active AudienceProfile.
 *
 * THE TRIAD:
 *   Role        — the person leading the session  (Teacher | Pastor | Leader)
 *   Assembly    — the group gathering             (Class | Study Group | Congregation)
 *   Participant — a member of that group          (Student | Member | Attendee)
 *
 * USAGE:
 *   import { DEFAULT_AUDIENCE_PROFILE, AUDIENCE_ROLES } from '@/constants/audienceConfig';
 *
 * @version 1.0.0
 * @lastUpdated 2026-03-06
 */

// ============================================================================
// String Literal Types
// ============================================================================

/** All valid role values. Must match AUDIENCE_ROLES array exactly. */
export type AudienceRole = 'Teacher' | 'Pastor' | 'Leader';

/** All valid assembly values. Must match AUDIENCE_ASSEMBLIES array exactly. */
export type AudienceAssembly = 'Class' | 'Study Group' | 'Congregation';

/** All valid participant values. Must match AUDIENCE_PARTICIPANTS array exactly. */
export type AudienceParticipant = 'Student' | 'Member' | 'Attendee';

// ============================================================================
// AudienceProfile Interface
// ============================================================================

/**
 * The active triad describing the ministry context for a session or lesson.
 *
 * Stored as jsonb in:
 *   - user_profiles.audience_profile  (user default)
 *   - lessons.audience_profile         (override at generation time)
 *   - series.audience_profile          (override at series creation time)
 *
 * Fields use string (not the union types above) so values round-trip cleanly
 * through JSON/DB without type-assertion noise at call sites. Validate with
 * isValidAudienceProfile() when reading from DB.
 */
export interface AudienceProfile {
  role: string;
  assembly: string;
  participant: string;
}

// ============================================================================
// Value Arrays (used to populate dropdowns and validate incoming values)
// ============================================================================

/** All valid Role options, in display order. */
export const AUDIENCE_ROLES: readonly AudienceRole[] = [
  'Teacher',
  'Pastor',
  'Leader',
] as const;

/** All valid Assembly options, in display order. */
export const AUDIENCE_ASSEMBLIES: readonly AudienceAssembly[] = [
  'Class',
  'Study Group',
  'Congregation',
] as const;

/** All valid Participant options, in display order. */
export const AUDIENCE_PARTICIPANTS: readonly AudienceParticipant[] = [
  'Student',
  'Member',
  'Attendee',
] as const;

// ============================================================================
// Default Profile
// ============================================================================

/**
 * Platform-wide default AudienceProfile.
 * Applied when a user has no saved profile preference.
 * Pre-fills all audience dropdowns on first visit to Build Lesson and Profile.
 */
export const DEFAULT_AUDIENCE_PROFILE: AudienceProfile = {
  role: 'Teacher',
  assembly: 'Class',
  participant: 'Student',
} as const;

// ============================================================================
// Validation Helpers
// ============================================================================

/** Returns true if the given string is a valid AudienceRole. */
export function isValidAudienceRole(value: string): value is AudienceRole {
  return (AUDIENCE_ROLES as readonly string[]).includes(value);
}

/** Returns true if the given string is a valid AudienceAssembly. */
export function isValidAudienceAssembly(value: string): value is AudienceAssembly {
  return (AUDIENCE_ASSEMBLIES as readonly string[]).includes(value);
}

/** Returns true if the given string is a valid AudienceParticipant. */
export function isValidAudienceParticipant(value: string): value is AudienceParticipant {
  return (AUDIENCE_PARTICIPANTS as readonly string[]).includes(value);
}

/**
 * Returns true if all three triad fields are valid values.
 * Use when reading audience_profile jsonb from Supabase to guard against
 * stale or manually-edited DB data.
 */
export function isValidAudienceProfile(profile: unknown): profile is AudienceProfile {
  if (!profile || typeof profile !== 'object') return false;
  const p = profile as Record<string, unknown>;
  return (
    typeof p.role === 'string' && isValidAudienceRole(p.role) &&
    typeof p.assembly === 'string' && isValidAudienceAssembly(p.assembly) &&
    typeof p.participant === 'string' && isValidAudienceParticipant(p.participant)
  );
}

/**
 * Returns a valid AudienceProfile, falling back to DEFAULT_AUDIENCE_PROFILE
 * for any field that is missing or invalid.
 * Safe to call on any raw DB value without crashing.
 */
export function resolveAudienceProfile(raw: unknown): AudienceProfile {
  if (isValidAudienceProfile(raw)) return raw;

  const fallback = { ...DEFAULT_AUDIENCE_PROFILE };
  if (raw && typeof raw === 'object') {
    const p = raw as Record<string, unknown>;
    if (typeof p.role === 'string' && isValidAudienceRole(p.role)) {
      fallback.role = p.role;
    }
    if (typeof p.assembly === 'string' && isValidAudienceAssembly(p.assembly)) {
      fallback.assembly = p.assembly;
    }
    if (typeof p.participant === 'string' && isValidAudienceParticipant(p.participant)) {
      fallback.participant = p.participant;
    }
  }
  return fallback;
}
