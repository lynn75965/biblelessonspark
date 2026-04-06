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
import { useState } from "react";
import { useSubscription } from "@/hooks/useSubscription";
import { TRIAL_CONFIG } from "@/constants/trialConfig";
import { TIER_LESSON_LIMITS } from "@/constants/pricingConfig";
import { UpgradePromptModal } from "@/components/subscription/UpgradePromptModal";

export function UsageDisplay() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const {
    tier,
    lessonsUsed,
    lessonsLimit,
    usagePercentage,
    resetDate,
    isLoading,
    isFreeTier,
    trialFullUsed,
    trialShortUsed,
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

  // Free-tier split: fullRemaining/shortRemaining drive the exhausted banner
  // condition and MUST stay derived from lessonsUsed (the RPC value).
  const fullLimit  = TRIAL_CONFIG.fullLessonsPerPeriod;   // 3
  const shortLimit = TRIAL_CONFIG.shortLessonsPerPeriod;  // 2
  const fullUsed   = Math.min(lessonsUsed, fullLimit);
  const shortUsed  = Math.max(0, lessonsUsed - fullLimit);
  const fullRemaining  = fullLimit  - fullUsed;
  const shortRemaining = shortLimit - shortUsed;

  // Display values: read from profiles (where the Edge Function writes).
  // These are used ONLY for progress bar numbers -- not for exhausted gating.
  const displayFullUsed  = Math.min(trialFullUsed, fullLimit);
  const displayShortUsed = Math.min(trialShortUsed, shortLimit);

  const renderFreeSummary = () => {
    if (fullRemaining === 0 && shortRemaining === 0) {
      return 'No lessons remaining';
    }
    const displayFullRemaining  = fullLimit  - displayFullUsed;
    const displayShortRemaining = shortLimit - displayShortUsed;
    const parts: string[] = [];
    parts.push(`${displayFullRemaining} of ${fullLimit} full`);
    parts.push(`${displayShortRemaining} of ${shortLimit} short`);
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
        {isFreeTier && fullRemaining <= 0 && shortRemaining <= 0 ? (
          /* Fully exhausted -- prominent blocked state */
          <div role="alert" className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3">
            <p className="text-sm font-semibold text-amber-900">You{'\u2019'}ve prepared lessons. You{'\u2019'}ve shown up faithfully.</p>
            <p className="text-xs text-amber-800 mt-1">
              The Personal Plan doesn{'\u2019'}t change what you prepare. It changes what happens to your people.
            </p>
            {resetDate && (
              <p className="text-xs text-amber-700">Resets {formatResetDate(resetDate)}. No long contract.</p>
            )}
            <Button
              size="sm"
              className="w-full bg-primary hover:bg-primary-hover"
              aria-label="Upgrade to Personal Plan and equip your class"
              onClick={() => setShowUpgradeModal(true)}
            >
              <ArrowUpRight className="mr-1 h-3 w-3" aria-hidden="true" />
              Yes {'\u2014'} Equip My Class
            </Button>
            <p className="text-[11px] text-amber-700 text-center">
              Not more curriculum. The difference between a classroom and a community.
            </p>
          </div>
        ) : isFreeTier ? (
          <div className="space-y-2">
            {/* Full lessons bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Full lessons (8 sections)</span>
                <span className="font-medium text-foreground">{displayFullUsed} / {fullLimit}</span>
              </div>
              <Progress
                value={Math.round((displayFullUsed / fullLimit) * 100)}
                className={`h-1.5 ${displayFullUsed >= fullLimit ? '[&>div]:bg-destructive' : displayFullUsed >= 2 ? '[&>div]:bg-secondary' : ''}`}
              />
            </div>
            {/* Short lessons bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Short lessons (3 sections)</span>
                <span className="font-medium text-foreground">{displayShortUsed} / {shortLimit}</span>
              </div>
              <Progress
                value={Math.round((displayShortUsed / shortLimit) * 100)}
                className={`h-1.5 ${displayShortUsed >= shortLimit ? '[&>div]:bg-destructive' : displayShortUsed >= 1 ? '[&>div]:bg-secondary' : ''}`}
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

        {isFreeTier && (fullRemaining > 0 || shortRemaining > 0) && (
          <Button
            variant="outline"
            size="sm"
            className="w-full text-xs"
            onClick={() => setShowUpgradeModal(true)}
          >
            <ArrowUpRight className="mr-1 h-3 w-3" />
            Upgrade for {TIER_LESSON_LIMITS.personal} lessons/month
          </Button>
        )}

        {!isFreeTier && lessonsUsed >= lessonsLimit && (
          <p className="text-xs text-muted-foreground text-center">
            Resets {formatResetDate(resetDate)}
          </p>
        )}
      </CardContent>
      <UpgradePromptModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="limit_reached"
      />
    </Card>
  );
}
