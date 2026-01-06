/**
 * useHelpVideo - Custom Hook for Help Video Logic
 * 
 * ARCHITECTURE NOTES:
 * - Handles auto-show on first visit (localStorage-based)
 * - Provides manual trigger for "Help" buttons
 * - Frontend-only state management (no backend involvement)
 * - Respects SSOT registry from helpVideos.ts
 * 
 * USAGE:
 * ```tsx
 * // In a page component
 * const { showVideo, setShowVideo, currentVideo, triggerHelp } = useHelpVideo('lesson.create.ready');
 * 
 * // Auto-show happens automatically on mount if video.autoShow is true
 * // Manual trigger via Help button:
 * <button onClick={triggerHelp}>Help</button>
 * 
 * // Render the modal:
 * <VideoModal open={showVideo} onClose={() => setShowVideo(false)} video={currentVideo} />
 * ```
 * 
 * @lastUpdated 2026-01-06
 */

import { useState, useEffect, useCallback } from 'react';
import {
  type HelpVideo,
  type HelpTriggerState,
  getVideoByTriggerState,
  isVideoSeen,
  markVideoSeen,
} from '@/constants/helpVideos';

interface UseHelpVideoReturn {
  /** Whether the video modal should be shown */
  showVideo: boolean;
  
  /** Function to manually control modal visibility */
  setShowVideo: (show: boolean) => void;
  
  /** The current video object (or null if none for this state) */
  currentVideo: HelpVideo | null;
  
  /** Function to manually trigger the help video (for Help buttons) */
  triggerHelp: () => void;
  
  /** Whether this video has been seen before */
  hasBeenSeen: boolean;
  
  /** Function to reset the "seen" status (for testing) */
  resetSeen: () => void;
}

/**
 * Hook to manage help video display for a specific UI state
 * 
 * @param triggerState - The UI state this hook is managing (from HelpTriggerState)
 * @param options - Optional configuration
 * @param options.disabled - If true, disables auto-show (useful during loading states)
 */
export function useHelpVideo(
  triggerState: HelpTriggerState,
  options?: { disabled?: boolean }
): UseHelpVideoReturn {
  const [showVideo, setShowVideo] = useState(false);
  const [hasBeenSeen, setHasBeenSeen] = useState(true); // Default true to prevent flash
  
  // Get the video for this trigger state
  const currentVideo = getVideoByTriggerState(triggerState) ?? null;
  
  // Check seen status and auto-show on mount
  useEffect(() => {
    if (!currentVideo || options?.disabled) {
      return;
    }
    
    const seen = isVideoSeen(currentVideo);
    setHasBeenSeen(seen);
    
    // Auto-show if configured and not yet seen
    if (currentVideo.autoShow && !seen) {
      // Small delay to let page render first
      const timer = setTimeout(() => {
        setShowVideo(true);
        markVideoSeen(currentVideo);
        setHasBeenSeen(true);
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [currentVideo, options?.disabled]);
  
  // Manual trigger function (for Help buttons)
  const triggerHelp = useCallback(() => {
    if (currentVideo) {
      setShowVideo(true);
      // Mark as seen even on manual trigger
      if (!hasBeenSeen) {
        markVideoSeen(currentVideo);
        setHasBeenSeen(true);
      }
    }
  }, [currentVideo, hasBeenSeen]);
  
  // Reset function (for testing/admin)
  const resetSeen = useCallback(() => {
    if (currentVideo) {
      localStorage.removeItem(currentVideo.storageKey);
      setHasBeenSeen(false);
    }
  }, [currentVideo]);
  
  return {
    showVideo,
    setShowVideo,
    currentVideo,
    triggerHelp,
    hasBeenSeen,
    resetSeen,
  };
}

export default useHelpVideo;
