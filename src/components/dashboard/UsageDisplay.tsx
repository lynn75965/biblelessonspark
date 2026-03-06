// ============================================================
// BibleLessonSpark - USAGE DISPLAY COMPONENT
// Location: src/components/dashboard/UsageDisplay.tsx
// Shows subscription tier and lesson usage on Dashboard
// Free tier shows split: "X of 3 full and X of 2 short lessons remaining"
// ============================================================
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { TRIAL_CONFIG } from "@/constants/trialConfig";

export function UsageDisplay() {
  const navigate = useNavigate();
  const {
    tier,
    lessonsUsed,
    lessonsLimit,
    usagePercentage,
    resetDate,
    isLoading,
    isFreeTier,
  } = useSubscription();

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Lesson Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const formatResetDate = (date: Date | null) => {
    if (!date) return null;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Free-tier split: full lessons consumed first, short lessons after
  const fullLimit  = TRIAL_CONFIG.fullLessonsPerPeriod;   // 3
  const shortLimit = TRIAL_CONFIG.shortLessonsPerPeriod;  // 2
  const fullUsed   = Math.min(lessonsUsed, fullLimit);
  const shortUsed  = Math.max(0, lessonsUsed - fullLimit);
  const fullRemaining  = fullLimit  - fullUsed;
  const shortRemaining = shortLimit - shortUsed;

  const renderFreeSummary = () => {
    if (fullRemaining === 0 && shortRemaining === 0) {
      return 'No lessons remaining';
    }
    const parts: string[] = [];
    parts.push(`${fullRemaining} of ${fullLimit} full`);
    parts.push(`${shortRemaining} of ${shortLimit} short`);
    return parts.join(' and ') + ' lessons remaining';
  };

  const renderPaidSummary = () => {
    const remaining = lessonsLimit - lessonsUsed;
    if (remaining <= 0) return 'No lessons remaining';
    return `${remaining} lesson${remaining !== 1 ? 's' : ''} remaining`;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <Zap className="h-4 w-4" />
            Lesson Usage
          </CardTitle>
          <Badge variant={isFreeTier ? "secondary" : "default"} className="text-xs">
            {tier === 'free' ? 'Free' : 'Personal'}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {isFreeTier ? renderFreeSummary() : renderPaidSummary()}
          {resetDate && ` \u2014 Resets ${formatResetDate(resetDate)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {isFreeTier ? (
          <div className="space-y-2">
            {/* Full lessons bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Full lessons (8 sections)</span>
                <span className="font-medium text-foreground">{fullUsed} / {fullLimit}</span>
              </div>
              <Progress
                value={Math.round((fullUsed / fullLimit) * 100)}
                className={`h-1.5 ${fullUsed >= fullLimit ? '[&>div]:bg-destructive' : fullUsed >= 2 ? '[&>div]:bg-secondary' : ''}`}
              />
            </div>
            {/* Short lessons bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Short lessons (3 sections)</span>
                <span className="font-medium text-foreground">{shortUsed} / {shortLimit}</span>
              </div>
              <Progress
                value={Math.round((shortUsed / shortLimit) * 100)}
                className={`h-1.5 ${shortUsed >= shortLimit ? '[&>div]:bg-destructive' : shortUsed >= 1 ? '[&>div]:bg-secondary' : ''}`}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Used</span>
              <span className="font-medium">{lessonsUsed} / {lessonsLimit}</span>
            </div>
            <Progress
              value={usagePercentage}
              className={`h-2 ${usagePercentage >= 90 ? '[&>div]:bg-destructive' : usagePercentage >= 70 ? '[&>div]:bg-secondary' : ''}`}
            />
          </div>
        )}

        {isFreeTier && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => navigate("/pricing")}
          >
            <ArrowUpRight className="mr-1 h-3 w-3" />
            Upgrade for 20 lessons/month
          </Button>
        )}

        {!isFreeTier && lessonsUsed >= lessonsLimit && (
          <p className="text-xs text-muted-foreground text-center">
            Resets {formatResetDate(resetDate)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
