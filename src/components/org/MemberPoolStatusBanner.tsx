/**
 * MemberPoolStatusBanner Component
 * 
 * Compact pool status display for organization members showing:
 * - Current pool balance
 * - Usage warnings at 80% and 100%
 * - Days until pool reset
 * 
 * Phase 13.8: Member Pool Awareness
 * 
 * SSOT: Pool data from organizations table via useOrgPoolStatus hook
 * 
 * @location src/components/org/MemberPoolStatusBanner.tsx
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Calendar,
  TrendingUp,
  Info
} from "lucide-react";
import { useOrgPoolStatus, getTierDisplayName } from "@/hooks/useOrgPoolStatus";

// ============================================================================
// TYPES
// ============================================================================

interface MemberPoolStatusBannerProps {
  organizationId: string;
  organizationName: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function MemberPoolStatusBanner({
  organizationId,
  organizationName,
}: MemberPoolStatusBannerProps) {
  const { poolStatus, tierConfigs, loading, error } = useOrgPoolStatus(organizationId);

  // ============================================================================
  // LOADING STATE
  // ============================================================================

  if (loading) {
    return (
      <div className="p-4 border rounded-lg bg-muted/30">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-2 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // ERROR STATE
  // ============================================================================

  if (error) {
    return null; // Silently fail for members - don't show error
  }

  // ============================================================================
  // NO SUBSCRIPTION STATE
  // ============================================================================

  if (!poolStatus?.subscriptionTier) {
    // Organization has no subscription - members use individual tier
    return (
      <Alert className="border-muted bg-muted/30">
        <Info className="h-4 w-4" />
        <AlertTitle className="text-sm font-medium">
          {organizationName} Lesson Pool
        </AlertTitle>
        <AlertDescription className="text-xs text-muted-foreground">
          Your organization doesn't have an active lesson pool subscription. 
          Lessons use your personal account allocation.
        </AlertDescription>
      </Alert>
    );
  }

  // ============================================================================
  // DETERMINE WARNING LEVEL
  // ============================================================================

  const usagePercent = poolStatus.usagePercentage;
  const totalAvailable = poolStatus.totalAvailable;

  // Warning levels
  const isExhausted = totalAvailable === 0;
  const isCritical = usagePercent >= 90 && !isExhausted;
  const isWarning = usagePercent >= 80 && usagePercent < 90;
  const isHealthy = usagePercent < 80;

  // Styling based on status
  const getAlertVariant = () => {
    if (isExhausted) return "destructive";
    if (isCritical) return "destructive";
    if (isWarning) return "default";
    return "default";
  };

  const getAlertClasses = () => {
    if (isExhausted) return "border-destructive/50 bg-destructive/10";
    if (isCritical) return "border-destructive/50 bg-destructive/10";
    if (isWarning) return "border-yellow-500/50 bg-yellow-500/10";
    return "border-primary/30 bg-primary/5";
  };

  const getIcon = () => {
    if (isExhausted || isCritical) return <AlertTriangle className="h-4 w-4 text-destructive" />;
    if (isWarning) return <TrendingUp className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle2 className="h-4 w-4 text-primary" />;
  };

  const getProgressColor = () => {
    if (isExhausted || isCritical) return "bg-destructive";
    if (isWarning) return "bg-yellow-500";
    return "bg-primary";
  };

  const tierName = getTierDisplayName(poolStatus.subscriptionTier, tierConfigs);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <Alert className={getAlertClasses()}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <AlertTitle className="text-sm font-medium flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" />
              {organizationName} Lesson Pool
            </AlertTitle>
            <Badge variant="outline" className="text-xs">
              {tierName}
            </Badge>
          </div>

          {/* Pool Status Message */}
          <AlertDescription className="space-y-2">
            {isExhausted ? (
              <p className="text-sm text-destructive font-medium">
                Pool exhausted! Lessons will use your personal account until the pool resets.
              </p>
            ) : isCritical ? (
              <p className="text-sm text-destructive">
                Pool nearly exhausted ({totalAvailable} lessons remaining). 
                Contact your org leader if you need more.
              </p>
            ) : isWarning ? (
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                Pool running low ({totalAvailable} of {poolStatus.lessonsLimit} remaining).
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {totalAvailable} lessons available this period.
              </p>
            )}

            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress 
                value={usagePercent} 
                className="h-1.5"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  {poolStatus.lessonsUsedThisPeriod} of {poolStatus.lessonsLimit} used
                  {poolStatus.bonusLessons > 0 && (
                    <span className="ml-1">(+{poolStatus.bonusLessons} bonus)</span>
                  )}
                </span>
                {poolStatus.daysUntilReset !== null && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Resets in {poolStatus.daysUntilReset} days
                  </span>
                )}
              </div>
            </div>

            {/* Fallback Notice when exhausted */}
            {isExhausted && (
              <p className="text-xs text-muted-foreground mt-2 pt-2 border-t border-destructive/20">
                Don't worry - you can still generate lessons using your personal account tier.
              </p>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

// ============================================================================
// COMPACT VARIANT (for sidebar or dashboard widget)
// ============================================================================

interface CompactPoolStatusProps {
  organizationId: string;
  organizationName: string;
}

export function CompactPoolStatus({
  organizationId,
  organizationName,
}: CompactPoolStatusProps) {
  const { poolStatus, loading } = useOrgPoolStatus(organizationId);

  if (loading || !poolStatus?.subscriptionTier) {
    return null;
  }

  const totalAvailable = poolStatus.totalAvailable;
  const isLow = poolStatus.usagePercentage >= 80;

  return (
    <div className={`
      flex items-center gap-2 px-3 py-2 rounded-lg text-sm
      ${isLow ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' : 'bg-muted/50'}
    `}>
      <Layers className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{organizationName}</span>
      <Badge 
        variant={isLow ? "destructive" : "secondary"} 
        className="ml-auto text-xs"
      >
        {totalAvailable} left
      </Badge>
    </div>
  );
}
