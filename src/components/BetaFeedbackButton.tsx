import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare } from "lucide-react";
import { BetaFeedbackModal } from "./BetaFeedbackModal";

export const BetaFeedbackButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        Beta Feedback
      </Button>
      <BetaFeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
};
