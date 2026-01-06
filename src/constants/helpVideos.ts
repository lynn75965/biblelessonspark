/**
 * Help Videos Registry - SSOT for Explainer Video System
 * 
 * ARCHITECTURE NOTES:
 * - This file is the Single Source of Truth for all explainer videos
 * - Videos are triggered by frontend UI state, NOT routes or backend logic
 * - Frontend controls when help is allowed; backend never pushes videos
 * - Videos explain UI actions, not system/database logic
 * 
 * MODIFICATION RULES:
 * 1. Add new videos here ONLY after UI state is finalized
 * 2. Each video maps to ONE specific UI state
 * 3. Update this file BEFORE recording new videos
 * 4. Review videos when triggerState UI changes
 * 
 * @lastUpdated 2026-01-06
 * @version 1.0.0
 */

// ============================================================================
// TYPES
// ============================================================================

export interface HelpVideo {
  /** Unique identifier for the video */
  id: string;
  
  /** Display title shown in modal header */
  title: string;
  
  /** Vimeo embed URL (unlisted) - format: https://player.vimeo.com/video/XXXXXXX */
  url: string;
  
  /** localStorage key for tracking "seen" state */
  storageKey: string;
  
  /** Frontend UI state that triggers this video */
  triggerState: HelpTriggerState;
  
  /** If true, auto-shows on first visit to trigger state */
  autoShow: boolean;
  
  /** Estimated duration in seconds (for UI display) */
  durationSeconds: number;
  
  /** Brief description for Help menu listings */
  description: string;
}

export type HelpTriggerState =
  | 'lesson.create.ready'        // User on Create Lesson page, ready to generate
  | 'lesson.output.ready'        // Lesson generation complete, viewing output
  | 'credits.exhausted'          // User has no credits remaining
  | 'subscription.upgrade'       // User viewing pricing/upgrade options
  | 'export.ready'               // User about to export lesson
  | 'profile.setup'              // First-time profile configuration
  | 'dashboard.empty'            // Dashboard with no lessons yet
  | 'organization.setup';        // Org leader first-time setup

// ============================================================================
// VIDEO REGISTRY
// ============================================================================

export const HELP_VIDEOS: Record<string, HelpVideo> = {
  createFirstLesson: {
    id: 'create_first_lesson',
    title: 'Create Your First Lesson',
    url: '', // TODO: Add Vimeo embed URL after recording
    storageKey: 'ls_help_create_first_lesson_seen',
    triggerState: 'lesson.create.ready',
    autoShow: true,
    durationSeconds: 60,
    description: 'Learn how to generate a customized Bible study lesson in under 2 minutes.',
  },
  
  understandingOutput: {
    id: 'understanding_output',
    title: 'Understanding Your Lesson',
    url: '', // TODO: Add Vimeo embed URL after recording
    storageKey: 'ls_help_understanding_output_seen',
    triggerState: 'lesson.output.ready',
    autoShow: true,
    durationSeconds: 45,
    description: 'See how to navigate and use your generated lesson sections.',
  },
  
  creditsAndUsage: {
    id: 'credits_usage',
    title: 'Credits & Subscription',
    url: '', // TODO: Add Vimeo embed URL after recording
    storageKey: 'ls_help_credits_usage_seen',
    triggerState: 'credits.exhausted',
    autoShow: true,
    durationSeconds: 30,
    description: 'Understand your lesson credits and subscription options.',
  },
  
  exportLesson: {
    id: 'export_lesson',
    title: 'Export & Share Your Lesson',
    url: '', // TODO: Add Vimeo embed URL after recording
    storageKey: 'ls_help_export_lesson_seen',
    triggerState: 'export.ready',
    autoShow: false, // Manual trigger only - export flow is straightforward
    durationSeconds: 30,
    description: 'Download your lesson as PDF or Word document.',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get a help video by its trigger state
 */
export function getVideoByTriggerState(state: HelpTriggerState): HelpVideo | undefined {
  return Object.values(HELP_VIDEOS).find(video => video.triggerState === state);
}

/**
 * Get a help video by its ID
 */
export function getVideoById(id: string): HelpVideo | undefined {
  return Object.values(HELP_VIDEOS).find(video => video.id === id);
}

/**
 * Get all videos that should auto-show (for preloading or analytics)
 */
export function getAutoShowVideos(): HelpVideo[] {
  return Object.values(HELP_VIDEOS).filter(video => video.autoShow);
}

/**
 * Get all available help videos (for Help menu)
 */
export function getAllHelpVideos(): HelpVideo[] {
  return Object.values(HELP_VIDEOS);
}

/**
 * Check if a video has been seen (localStorage)
 */
export function isVideoSeen(video: HelpVideo): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(video.storageKey) === 'true';
}

/**
 * Mark a video as seen (localStorage)
 */
export function markVideoSeen(video: HelpVideo): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(video.storageKey, 'true');
}

/**
 * Reset a video's seen status (for testing or re-onboarding)
 */
export function resetVideoSeen(video: HelpVideo): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(video.storageKey);
}

/**
 * Reset all video seen statuses (admin/testing utility)
 */
export function resetAllVideosSeen(): void {
  if (typeof window === 'undefined') return;
  Object.values(HELP_VIDEOS).forEach(video => {
    localStorage.removeItem(video.storageKey);
  });
}
