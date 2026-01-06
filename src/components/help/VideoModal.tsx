/**
 * VideoModal - Reusable Help Video Modal Component
 * 
 * ARCHITECTURE NOTES:
 * - Uses Shadcn/ui Dialog for consistent UI
 * - Receives video data from useHelpVideo hook
 * - Does NOT manage its own state - parent controls open/close
 * - Supports Vimeo embeds (recommended) or YouTube
 * 
 * USAGE:
 * ```tsx
 * const { showVideo, setShowVideo, currentVideo } = useHelpVideo('lesson.create.ready');
 * 
 * return (
 *   <VideoModal
 *     open={showVideo}
 *     onClose={() => setShowVideo(false)}
 *     video={currentVideo}
 *   />
 * );
 * ```
 * 
 * @lastUpdated 2026-01-06
 */

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle, X, Clock } from 'lucide-react';
import type { HelpVideo } from '@/constants/helpVideos';

interface VideoModalProps {
  /** Whether the modal is open */
  open: boolean;
  
  /** Callback when modal should close */
  onClose: () => void;
  
  /** The video to display (from helpVideos registry) */
  video: HelpVideo | null;
}

export function VideoModal({ open, onClose, video }: VideoModalProps) {
  // Don't render if no video provided
  if (!video) return null;
  
  // Format duration for display
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };
  
  // Check if video URL is configured
  const hasVideoUrl = video.url && video.url.length > 0;
  
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-[800px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <HelpCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-slate-900">
                  {video.title}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1 text-sm text-slate-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDuration(video.durationSeconds)}</span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-full"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>
        
        {/* Video Content */}
        <div className="aspect-video bg-slate-900">
          {hasVideoUrl ? (
            <iframe
              src={`${video.url}?autoplay=1&title=0&byline=0&portrait=0`}
              className="w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title={video.title}
            />
          ) : (
            /* Placeholder when video URL not yet configured */
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
              <HelpCircle className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg font-medium">Video Coming Soon</p>
              <p className="text-sm mt-2 text-slate-500 max-w-md text-center px-4">
                {video.description}
              </p>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t bg-slate-50 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {video.description}
          </p>
          <Button onClick={onClose} variant="outline" size="sm">
            Got it
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default VideoModal;
