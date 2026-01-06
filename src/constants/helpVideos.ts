/**
 * Help Videos Registry - SSOT for Explainer Video System
 * 
 * ARCHITECTURE NOTES:
 * - This file provides helper functions and types for the help video system
 * - Video configuration is stored in BRANDING.helpVideos (src/config/branding.ts)
 * - White-label tenants customize videos via their branding config
 * - Frontend controls when help is allowed; backend never pushes videos
 * 
 * SSOT COMPLIANCE:
 * - Master config: src/config/branding.ts → helpVideos section
 * - This file: Helper functions and type definitions
 * - No backend mirror needed (frontend-only feature)
 * 
 * @lastUpdated 2026-01-06
 * @version 2.0.0
 */

import { BRANDING } from '@/config/branding';

// ============================================================================
// TYPES
// ============================================================================

export interface HelpVideo {
  /** Unique identifier for the video */
  id: string;
  
  /** Display title shown in modal header */
  title: string;
  
  /** Brief description for Help menu listings */
  description: string;
  
  /** Vimeo/YouTube embed URL */
  url: string;
  
  /** Estimated duration in seconds (for UI display) */
  durationSeconds: number;
  
  /** localStorage key for tracking "seen" state */
  storageKey: string;
}

export type HelpVideoKey = keyof typeof BRANDING.helpVideos.videos;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if help videos feature is enabled
 */
export function isHelpVideosEnabled(): boolean {
  return BRANDING.helpVideos.enabled;
}

/**
 * Check if the help banner should be shown
 */
export function shouldShowHelpBanner(): boolean {
  return BRANDING.helpVideos.enabled && BRANDING.helpVideos.showBanner;
}

/**
 * Check if the floating help button should be shown
 */
export function shouldShowFloatingButton(): boolean {
  return BRANDING.helpVideos.enabled && BRANDING.helpVideos.showFloatingButton;
}

/**
 * Check if auto-play on first visit is enabled
 */
export function shouldAutoPlayOnFirstVisit(): boolean {
  return BRANDING.helpVideos.enabled && BRANDING.helpVideos.autoPlayOnFirstVisit;
}

/**
 * Get a help video by its key
 */
export function getVideo(key: HelpVideoKey): HelpVideo | null {
  if (!BRANDING.helpVideos.enabled) return null;
  
  const videoConfig = BRANDING.helpVideos.videos[key];
  if (!videoConfig) return null;
  
  return {
    id: videoConfig.id,
    title: videoConfig.title,
    description: videoConfig.description,
    url: videoConfig.url,
    durationSeconds: videoConfig.durationSeconds,
    storageKey: videoConfig.storageKey,
  };
}

/**
 * Get the primary "Create Lesson" video (most commonly used)
 */
export function getCreateLessonVideo(): HelpVideo | null {
  return getVideo('createLesson');
}

/**
 * Get all available help videos
 */
export function getAllVideos(): HelpVideo[] {
  if (!BRANDING.helpVideos.enabled) return [];
  
  return Object.keys(BRANDING.helpVideos.videos).map(key => 
    getVideo(key as HelpVideoKey)
  ).filter((v): v is HelpVideo => v !== null);
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
  
  Object.values(BRANDING.helpVideos.videos).forEach(video => {
    localStorage.removeItem(video.storageKey);
  });
}

/**
 * Check if a video has a valid URL configured
 */
export function hasVideoUrl(video: HelpVideo): boolean {
  return Boolean(video.url && video.url.length > 0);
}

/**
 * Get banner styles from branding config
 */
export function getBannerStyles() {
  return BRANDING.helpVideos.bannerStyles;
}

/**
 * Get floating button styles from branding config
 */
export function getFloatingButtonStyles() {
  return BRANDING.helpVideos.floatingButtonStyles;
}
