/**
 * LessonSparkUSA Constants - Single Export Point
 * 
 * This is the SINGLE SOURCE OF TRUTH for all structural constants.
 * All components should import from here, never directly from individual files.
 * 
 * GOVERNANCE:
 * - Only admin (Lynn) can modify these files
 * - Users select from options, they cannot create new ones
 * - Frontend drives backend - these constants are synced to backend via script
 * 
 * @version 1.0.0
 * @lastUpdated 2025-11-21
 */

// ============================================================
// TIER 1: Supreme/Foundational (UNCHANGING)
// ============================================================
export * from './lessonStructure';

// ============================================================
// TIER 2: Customizations (User selects from Admin options)
// ============================================================
export * from './ageGroups';
// export * from './theologicalPreferences'; // Phase 3
// export * from './teacherPreferences';     // Phase 4
// export * from './bibleVersions';          // Phase 5
// export * from './systemOptions';          // Phase 5

// ============================================================
// CONTRACTS: TypeScript Interfaces
// ============================================================
export * from './contracts';

// ============================================================
// VERSION INFO
// ============================================================
export const CONSTANTS_VERSION = '1.0.0';
export const CONSTANTS_LAST_UPDATED = '2025-11-21';
