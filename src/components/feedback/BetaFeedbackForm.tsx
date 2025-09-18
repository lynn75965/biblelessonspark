import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, Heart, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';
import { supabase } from '@/integrations/supabase/client';

interface BetaFeedbackFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonId?: string;
}

export function BetaFeedbackForm({ open, onOpenChange, lessonId }: BetaFeedbackFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [npsScore, setNpsScore] = useState<number>(0);
  const [wouldPayFor, setWouldPayFor] = useState<string>('');
  const [minutesSaved, setMinutesSaved] = useState<string>('');
  const [engagementImproved, setEngagementImproved] = useState<boolean | null>(null);
  const [positiveComments, setPositiveComments] = useState('');
  const [improvements, setImprovements] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);

    try {
      const feedbackData = {
        user_id: user.id,
        lesson_id: lessonId,
        rating,
        minutes_saved: minutesSaved ? parseInt(minutesSaved) : null,
        engagement_improved: engagementImproved,
        comments: JSON.stringify({
          positive: positiveComments,
          improvements,
          nps_score: npsScore,
          would_pay_for: wouldPayFor,
          would_recommend: wouldRecommend
        })
      };

      const { error } = await supabase
        .from('feedback')
        .insert(feedbackData);

      if (error) throw error;

      // Track feedback submission
      trackEvent('feedback_submitted', lessonId, {
        rating,
        nps_score: npsScore,
        would_recommend: wouldRecommend,
        engagement_improved: engagementImproved,
        minutes_saved: minutesSaved
      });

      toast({
        title: "Feedback submitted successfully!",
        description: "Thank you for helping us improve LessonSpark USA.",
      });

      onOpenChange(false);
      
      // Reset form
      setRating(0);
      setNpsScore(0);
      setPositiveComments('');
      setImprovements('');
      setWouldRecommend(null);
      setEngagementImproved(null);
      setMinutesSaved('');
      setWouldPayFor('');
      
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: "Error submitting feedback",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-primary" />
            Beta User Feedback
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Overall Rating */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Overall Experience</CardTitle>
              <CardDescription>How would you rate LessonSpark USA overall?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 rounded-full hover:bg-accent transition-colors"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        star <= rating 
                          ? 'fill-yellow-400 text-yellow-400' 
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating > 0 && `${rating}/5 stars`}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* NPS Score */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recommendation Score
              </CardTitle>
              <CardDescription>
                How likely are you to recommend LessonSpark USA to other teachers? (0 = Not at all, 10 = Extremely likely)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-11 gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setNpsScore(score)}
                    className={`p-2 text-sm rounded-lg border transition-colors ${
                      npsScore === score 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'hover:bg-accent border-border'
                    }`}
                  >
                    {score}
                  </button>
                ))}
              </div>
              {npsScore !== null && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {npsScore}/10
                </p>
              )}
            </CardContent>
          </Card>

          {/* Value Questions */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Time Savings</CardTitle>
                <CardDescription>How many minutes does LessonSpark USA save you per lesson?</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={minutesSaved} onValueChange={setMinutesSaved}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="15" id="15min" />
                    <Label htmlFor="15min">15 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="30" id="30min" />
                    <Label htmlFor="30min">30 minutes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="60" id="60min" />
                    <Label htmlFor="60min">1 hour</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="120" id="120min" />
                    <Label htmlFor="120min">2+ hours</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Willingness to Pay
                </CardTitle>
                <CardDescription>Would you pay $19/month for LessonSpark USA?</CardDescription>
              </CardHeader>
              <CardContent>
                <RadioGroup value={wouldPayFor} onValueChange={setWouldPayFor}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes-definitely" id="yes-def" />
                    <Label htmlFor="yes-def">Yes, definitely</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes-probably" id="yes-prob" />
                    <Label htmlFor="yes-prob">Yes, probably</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="maybe" id="maybe" />
                    <Label htmlFor="maybe">Maybe</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="no" />
                    <Label htmlFor="no">No, too expensive</Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* Engagement Question */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Student Engagement</CardTitle>
              <CardDescription>Has LessonSpark USA improved student engagement in your classes?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={engagementImproved === true}
                    onCheckedChange={() => setEngagementImproved(true)}
                  />
                  <Label>Yes, engagement has improved</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    checked={engagementImproved === false}
                    onCheckedChange={() => setEngagementImproved(false)}
                  />
                  <Label>No significant change</Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Open-ended Feedback */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="positive">What's working well?</Label>
              <Textarea
                id="positive"
                value={positiveComments}
                onChange={(e) => setPositiveComments(e.target.value)}
                placeholder="Tell us what you love about LessonSpark USA..."
                className="min-h-[100px]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="improvements">What could be improved?</Label>
              <Textarea
                id="improvements"
                value={improvements}
                onChange={(e) => setImprovements(e.target.value)}
                placeholder="Suggestions for making LessonSpark USA even better..."
                className="min-h-[100px]"
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              variant="default"
              className="flex-1"
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}