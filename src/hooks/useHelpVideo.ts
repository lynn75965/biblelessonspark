/**
 * useHelpVideo - Custom Hook for Help Video Logic
 * 
 * ARCHITECTURE NOTES:
 * - Checks BRANDING.helpVideos.enabled before any action
 * - Handles auto-show on first visit (localStorage-based)
 * - Provides manual trigger for "Help" buttons
 * - Frontend-only state management (no backend involvement)
 * 
 * USAGE:
 * ```tsx
 * const { showVideo, setShowVideo, currentVideo, triggerHelp, isEnabled } = useHelpVideo();
 * 
 * // Only render help UI if enabled
 * {isEnabled && <VideoModal ... />}
 * ```
 * 
 * @lastUpdated 2026-01-06
 * @version 2.0.0
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type HelpVideo,
  getCreateLessonVideo,
  isHelpVideosEnabled,
  shouldAutoPlayOnFirstVisit,
  isVideoSeen,
  markVideoSeen,
} from '@/constants/helpVideos';

interface UseHelpVideoReturn {
  /** Whether the video modal should be shown */
  showVideo: boolean;
  
  /** Function to manually control modal visibility */
  setShowVideo: (show: boolean) => void;
  
  /** The current video object (or null if disabled/not configured) */
  currentVideo: HelpVideo | null;
  
  /** Function to manually trigger the help video (for Help buttons) */
  triggerHelp: () => void;
  
  /** Whether this video has been seen before */
  hasBeenSeen: boolean;
  
  /** Function to reset the "seen" status (for testing) */
  resetSeen: () => void;
  
  /** Whether help videos feature is enabled */
  isEnabled: boolean;
}

/**
 * Hook to manage help video display
 * 
 * @param options - Optional configuration
 * @param options.disabled - If true, disables auto-show (useful during loading states)
 */
export function useHelpVideo(
  options?: { disabled?: boolean }
): UseHelpVideoReturn {
  const [showVideo, setShowVideo] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(true); // Default true to prevent flash
  
  // Check if feature is enabled
  const isEnabled = isHelpVideosEnabled();
  
  // Get the create lesson video (primary onboarding video)
  const currentVideo = isEnabled ? getCreateLessonVideo() : null;
  
  // Check seen status and auto-show on mount
  useEffect(() => {
    if (!isEnabled || !currentVideo || options?.disabled) {
      return;
    }
    
    const seen = isVideoSeen(currentVideo);
    setHasBeenSeen(seen);
    
    // Auto-show if configured and not yet seen
    if (shouldAutoPlayOnFirstVisit() && !seen) {
      // Small delay to let page render first
      const timer = setTimeout(() => {
        setShowVideo(true);
        markVideoSeen(currentVideo);
        setHasBeenSeen(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [isEnabled, currentVideo, options?.disabled]);
  
  // Manual trigger function (for Help buttons)
  const triggerHelp = useCallback(() => {
    if (!isEnabled || !currentVideo) return;
    
    setShowVideo(true);
    // Mark as seen even on manual trigger
    if (!hasBeenSeen) {
      markVideoSeen(currentVideo);
      setHasBeenSeen(true);
    }
  }, [isEnabled, currentVideo, hasBeenSeen]);
  
  // Reset function (for testing/admin)
  const resetSeen = useCallback(() => {
    if (!currentVideo) return;
    
    localStorage.removeItem(currentVideo.storageKey);
    setHasBeenSeen(false);
  }, [currentVideo]);
  
  return {
    showVideo,
    setShowVideo,
    currentVideo,
    triggerHelp,
    hasBeenSeen,
    resetSeen,
    isEnabled,
  };
}

export default useHelpVideo;
