/**
 * TutorialsModal - Multi-video tutorial picker
 *
 * Shown from the dashboard welcome banner. Lists all BibleLessonSpark tutorial
 * videos and plays the selected one inline. Videos come from the
 * TRAINING_VIDEOS SSOT in src/config/trainingVideos.ts.
 *
 * Parent controls open state via props (controlled component).
 */

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { GraduationCap, X, Play } from "lucide-react";
import { VimeoEmbed } from "@/components/VimeoEmbed";
import { TRAINING_VIDEOS } from "@/config/trainingVideos";

interface TutorialsModalProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when modal should open/close */
  onOpenChange: (open: boolean) => void;
}

export function TutorialsModal({ open, onOpenChange }: TutorialsModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Reset to the first video each time the modal reopens
  useEffect(() => {
    if (open) setSelectedIndex(0);
  }, [open]);

  const activeVideo = TRAINING_VIDEOS[selectedIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
                <GraduationCap className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-foreground text-left">
                  Tutorial Videos
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground text-left mt-0.5">
                  Watch a short walkthrough of each part of BibleLessonSpark.
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 rounded-full shrink-0"
              aria-label="Close tutorial videos"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Body: video + title list */}
        <div className="grid md:grid-cols-5 gap-0">
          {/* Video column */}
          <div className="md:col-span-3 bg-foreground">
            <VimeoEmbed
              key={selectedIndex}
              videoId={activeVideo.id}
              hash={activeVideo.hash}
              title={activeVideo.title}
              autoplay={false}
            />
          </div>

          {/* Title list column */}
          <div
            className="md:col-span-2 border-t md:border-t-0 md:border-l bg-background max-h-[420px] overflow-y-auto"
            role="list"
            aria-label="Tutorial videos"
          >
            {TRAINING_VIDEOS.map((video, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={video.id}
                  type="button"
                  role="listitem"
                  onClick={() => setSelectedIndex(index)}
                  aria-current={isSelected ? "true" : undefined}
                  aria-label={`Play tutorial: ${video.title}`}
                  className={`w-full text-left px-4 py-3 border-b transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset ${
                    isSelected
                      ? "bg-amber-50 border-l-4 border-l-primary"
                      : "hover:bg-muted border-l-4 border-l-transparent"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                      aria-hidden="true"
                    >
                      {isSelected ? (
                        <Play className="h-3.5 w-3.5 fill-current" />
                      ) : (
                        <span className="text-xs font-semibold">{index + 1}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm font-semibold ${
                          isSelected ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {video.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {video.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/50 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {selectedIndex + 1} of {TRAINING_VIDEOS.length}
          </p>
          <Button onClick={() => onOpenChange(false)} variant="outline" size="sm">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TutorialsModal;
