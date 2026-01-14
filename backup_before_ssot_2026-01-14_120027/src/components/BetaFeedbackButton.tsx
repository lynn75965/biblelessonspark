import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";

interface BetaFeedbackButtonProps {
  onClick: () => void;
}

export const BetaFeedbackButton = ({ onClick }: BetaFeedbackButtonProps) => {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="gap-2"
    >
      <MessageSquare className="w-4 h-4" />
      Give Feedback
    </Button>
  );
};
