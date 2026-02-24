import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BetaFeedbackForm } from "@/components/feedback/BetaFeedbackForm";
import { useSystemSettings } from "@/hooks/useSystemSettings";
import { isBetaMode } from "@/constants/systemSettings";

interface BetaFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId?: string;
}

export const BetaFeedbackModal = ({ open, onOpenChange, lessonId }: BetaFeedbackModalProps) => {
  const { settings } = useSystemSettings();
  const isInBetaMode = isBetaMode(settings.current_phase as string);

  const handleSuccess = () => {
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  // Mode-aware text
  const title = isInBetaMode ? "Beta Feedback" : "Share Your Feedback";
  const description = isInBetaMode 
    ? "Help us improve BibleLessonSpark by sharing your beta experience"
    : "Help us improve BibleLessonSpark by sharing your experience";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <BetaFeedbackForm 
          lessonId={lessonId} 
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
};
