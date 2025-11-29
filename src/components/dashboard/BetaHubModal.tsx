import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, MessageSquare, Gift, Newspaper, Users, TrendingUp, Rocket, ExternalLink, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PROGRAM_CONFIG, isBetaMode } from "@/constants/programConfig";

interface FeedbackEntry {
  id: string;
  rating: number;
  feedback_text: string;
  created_at: string;
}

interface BetaTester {
  id: string;
  full_name: string | null;
  created_at: string;
}

interface BetaHubModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lessonsCreated: number;
  totalPlatformUsers: number;
  onNavigateToAnalytics: () => void;
}

export function BetaHubModal({ 
  open, 
  onOpenChange, 
  lessonsCreated,
  totalPlatformUsers,
  onNavigateToAnalytics 
}: BetaHubModalProps) {
  const { user } = useAuth();
  const [feedbackCount, setFeedbackCount] = useState(0);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalLessons, setTotalLessons] = useState(0);
  const [recentFeedback, setRecentFeedback] = useState<FeedbackEntry[]>([]);
  const [betaTesters, setBetaTesters] = useState<BetaTester[]>([]);
  const [showTesterList, setShowTesterList] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      // Get feedback count and calculate average rating
      const { data: allFeedback, count: fbCount } = await supabase
        .from("beta_feedback")
        .select("rating", { count: "exact" });
      
      setFeedbackCount(fbCount || 0);
      
      if (allFeedback && allFeedback.length > 0) {
        const validRatings = allFeedback.filter(f => f.rating !== null && f.rating > 0);
        if (validRatings.length > 0) {
          const sum = validRatings.reduce((acc, f) => acc + f.rating, 0);
          setAverageRating(Math.round((sum / validRatings.length) * 10) / 10);
        }
      }

      // Get recent feedback (3 most recent)
      const { data: fbData } = await supabase
        .from("beta_feedback")
        .select("id, rating, feedback_text, created_at")
        .order("created_at", { ascending: false })
        .limit(3);
      
      setRecentFeedback(fbData || []);

      // Get total lessons count
      const { count: lessonCount } = await supabase
        .from("lessons")
        .select("*", { count: "exact", head: true });
      
      setTotalLessons(lessonCount || 0);

      // Get beta testers list
      const { data: testers } = await supabase
        .from("profiles")
        .select("id, full_name, created_at")
        .order("created_at", { ascending: false });
      
      setBetaTesters(testers || []);
    };

    if (open) {
      fetchStats();
    }
  }, [open, user]);

  const handleViewAllFeedback = () => {
    onOpenChange(false);
    onNavigateToAnalytics();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric"
    });
  };

  const renderStars = (rating: number) => {
    return "★".repeat(rating) + "☆".repeat(5 - rating);
  };

  const title = isBetaMode() ? "Private Beta Hub" : PROGRAM_CONFIG.production.adminHubTitle;
  const description = isBetaMode() 
    ? "Managing the beta program and tester feedback" 
    : "Platform administration and analytics";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Platform Stats Row */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-gradient-card">
              <CardContent className="p-3 text-center">
                <Users className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{totalPlatformUsers}</p>
                <p className="text-xs text-muted-foreground">Total Users</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card">
              <CardContent className="p-3 text-center">
                <BookOpen className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{totalLessons}</p>
                <p className="text-xs text-muted-foreground">Lessons Created</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-card">
              <CardContent className="p-3 text-center">
                <MessageSquare className="h-5 w-5 mx-auto mb-1 text-primary" />
                <p className="text-xl font-bold">{feedbackCount}</p>
                <p className="text-xs text-muted-foreground">Feedback Received</p>
              </CardContent>
            </Card>
          </div>

          {/* Average Rating - Enhancement A */}
          {averageRating !== null && (
            <div className="flex items-center justify-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
              <span className="text-lg font-bold text-yellow-700 dark:text-yellow-400">{averageRating}</span>
              <span className="text-sm text-yellow-600 dark:text-yellow-500">average rating from {feedbackCount} responses</span>
            </div>
          )}

          {/* Beta-specific content */}
          {isBetaMode() && (
            <>
              {/* Phase indicator */}
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{PROGRAM_CONFIG.beta.currentPhase}</span>
                </div>
                <Badge variant="outline">Target: {PROGRAM_CONFIG.beta.targetLaunch}</Badge>
              </div>

              {/* Beta Benefits */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Gift className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Beta Tester Benefits</h3>
                  </div>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    {PROGRAM_CONFIG.beta.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary">•</span>
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}

          {/* Beta Tester List - Enhancement E */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Beta Testers</h3>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setShowTesterList(!showTesterList)}
                >
                  {showTesterList ? "Hide" : "Show"} ({betaTesters.length})
                </Button>
              </div>
              {showTesterList && (
                <ul className="text-sm space-y-2 max-h-40 overflow-y-auto">
                  {betaTesters.map((tester) => (
                    <li key={tester.id} className="flex items-center justify-between py-1 border-b border-muted last:border-0">
                      <span className="text-muted-foreground truncate max-w-[200px]">{tester.full_name || "Unnamed User"}</span>
                      <Badge variant="outline" className="text-xs shrink-0">Joined {formatDate(tester.created_at)}</Badge>
                    </li>
                  ))}
                  {betaTesters.length === 0 && (
                    <li className="text-muted-foreground">No testers yet</li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Recent Feedback Preview */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Recent Feedback</h3>
                </div>
                <Badge variant="secondary">{feedbackCount} total</Badge>
              </div>
              {recentFeedback.length > 0 ? (
                <ul className="text-sm space-y-3">
                  {recentFeedback.map((fb) => (
                    <li key={fb.id} className="border-b border-muted pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-yellow-500">{renderStars(fb.rating)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(fb.created_at)}</span>
                      </div>
                      <p className="text-muted-foreground text-xs line-clamp-2">
                        {fb.feedback_text || "No comment provided"}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No feedback received yet</p>
              )}
            </CardContent>
          </Card>

          {/* Recent Updates / Changelog */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Newspaper className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">
                  {isBetaMode() ? "Recent Updates" : "Changelog"}
                </h3>
              </div>
              <ul className="text-sm space-y-2 text-muted-foreground">
                {(isBetaMode() ? PROGRAM_CONFIG.beta.recentUpdates : PROGRAM_CONFIG.production.recentUpdates).map((update, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Badge variant="outline" className="text-xs shrink-0">{update.date}</Badge>
                    <span>{update.text}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* View All Feedback Button */}
          <Button 
            onClick={handleViewAllFeedback} 
            className="w-full" 
            variant="default"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View Full Analytics Dashboard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

