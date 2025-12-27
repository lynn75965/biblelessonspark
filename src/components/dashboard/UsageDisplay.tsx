// ============================================================
// LESSONSPARK USA - USAGE DISPLAY COMPONENT
// Location: src/components/dashboard/UsageDisplay.tsx
// Shows subscription tier and lesson usage on Dashboard
// ============================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Zap, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";

export function UsageDisplay() {
  const navigate = useNavigate();
  const {
    tier,
    lessonsUsed,
    lessonsLimit,
    usagePercentage,
    lessonsRemaining,
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
          {lessonsRemaining > 0 
            ? `${lessonsRemaining} lesson${lessonsRemaining !== 1 ? 's' : ''} remaining`
            : 'No lessons remaining'
          }
          {resetDate && ` · Resets ${formatResetDate(resetDate)}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Used</span>
            <span className="font-medium">{lessonsUsed} / {lessonsLimit}</span>
          </div>
          <Progress 
            value={usagePercentage} 
            className={`h-2 ${usagePercentage >= 90 ? '[&>div]:bg-destructive' : usagePercentage >= 70 ? '[&>div]:bg-amber-500' : ''}`}
          />
        </div>
        
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
        
        {!isFreeTier && lessonsRemaining === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Resets {formatResetDate(resetDate)}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
