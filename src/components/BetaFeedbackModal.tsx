import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

interface BetaFeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId?: string;
}

export const BetaFeedbackModal = ({ open, onOpenChange, lessonId }: BetaFeedbackModalProps) => {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [category, setCategory] = useState<string>("general_feedback");
  const [feedbackText, setFeedbackText] = useState("");
  const [allowFollowup, setAllowFollowup] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      toast({
        title: "Feedback Required",
        description: "Please share your thoughts before submitting.",
        variant: "destructive",
      });
      return;
    }

    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please rate your experience.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { error } = await supabase.from("beta_feedback").insert({
        user_id: user.id,
        lesson_id: lessonId || null,
        rating,
        category,
        feedback_text: feedbackText,
        allow_followup: allowFollowup,
      });

      if (error) throw error;

      toast({
        title: "Thank You! ??",
        description: "Your feedback helps us improve LessonSparkUSA.",
      });

      // Reset form
      setRating(0);
      setCategory("general_feedback");
      setFeedbackText("");
      setAllowFollowup(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Beta Feedback</DialogTitle>
          <DialogDescription>
            Help us improve LessonSparkUSA by sharing your experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-2">
            <Label>How would you rate this experience?</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Feedback Type</Label>
            <RadioGroup value={category} onValueChange={setCategory}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="general_feedback" id="general" />
                <Label htmlFor="general" className="cursor-pointer">
                  General Feedback
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bug_report" id="bug" />
                <Label htmlFor="bug" className="cursor-pointer">
                  Bug Report
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="feature_request" id="feature" />
                <Label htmlFor="feature" className="cursor-pointer">
                  Feature Request
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Your Feedback</Label>
            <Textarea
              id="feedback"
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Share your thoughts, suggestions, or issues..."
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Follow-up Checkbox */}
          <div className="flex items-start space-x-3">
            <Checkbox
              id="followup"
              checked={allowFollowup}
              onCheckedChange={(checked) => setAllowFollowup(checked as boolean)}
            />
            <Label htmlFor="followup" className="text-sm cursor-pointer leading-relaxed">
              I'm willing to have a follow-up conversation about this feedback
            </Label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
