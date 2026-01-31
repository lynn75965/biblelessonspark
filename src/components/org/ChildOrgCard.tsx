// ============================================================
// ChildOrgCard.tsx
// Displays a single child organization's summary data
// SSOT Source: organizationConfig.ts → PARENT_VISIBILITY, CHILD_ORG_HEALTH
// 
// Shows ONLY fields allowed by PARENT_VISIBILITY:
//   org name, Org Manager name, member count, lessons/month,
//   pool %, subscription tier, health status
//
// Phase N6: Added focus adoption indicator (Target icon)
// ============================================================

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Layers, Mail, Target } from "lucide-react";
import type { ChildOrgSummary } from "@/hooks/useChildOrgSummaries";
import { ORG_TYPES } from "@/constants/organizationConfig";

interface ChildOrgCardProps {
  child: ChildOrgSummary;
}

/**
 * Health indicator dot with color from database function.
 * Maps health_status to readable labels per SSOT.
 */
function HealthIndicator({ status, color }: { status: string; color: string }) {
  const labels: Record<string, string> = {
    healthy: 'Healthy',
    attention: 'Needs Attention',
    critical: 'Critical'
  };

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="h-3 w-3 rounded-full shrink-0"
        style={{ backgroundColor: color }}
        title={labels[status] || status}
      />
      <span className="text-xs text-muted-foreground">
        {labels[status] || status}
      </span>
    </div>
  );
}

/**
 * Pool usage bar showing percentage remaining.
 * Color matches health thresholds from SSOT:
 *   > 25% = green, 10-25% = yellow, < 10% = red
 */
function PoolBar({ percentage }: { percentage: number }) {
  const barColor =
    percentage > 25 ? '#22C55E' :
    percentage > 10 ? '#F59E0B' :
    '#EF4444';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-muted-foreground">Pool Remaining</span>
        <span className="text-xs font-medium">{percentage}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${percentage}%`,
            backgroundColor: barColor
          }}
        />
      </div>
    </div>
  );
}

/**
 * Looks up the display label for an org_type from SSOT.
 * Falls back to the raw type if not found.
 */
function getOrgTypeLabel(orgType: string): string {
  const found = ORG_TYPES.find(t => t.id === orgType);
  return found?.label || orgType;
}

export function ChildOrgCard({ child }: ChildOrgCardProps) {
  return (
    <Card className="bg-gradient-card hover:shadow-md transition-shadow">
      <CardContent className="p-4 space-y-3">
        {/* Header: Org name + health light */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate" title={child.org_name}>
              {child.org_name}
            </h3>
            <Badge variant="outline" className="text-[10px] mt-1">
              {getOrgTypeLabel(child.org_type)}
            </Badge>
          </div>
          <HealthIndicator status={child.health_status} color={child.health_color} />
        </div>

        {/* Manager email */}
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Mail className="h-3 w-3 shrink-0" />
          <span className="truncate" title={child.manager_email}>
            {child.manager_email || 'No manager assigned'}
          </span>
        </div>

        {/* Phase N6: Focus adoption indicator — only shown when data is present */}
        {child.has_adopted_focus !== undefined && (
          <div className="flex items-center gap-1.5">
            {child.has_adopted_focus ? (
              <>
                <Target className="h-3 w-3 text-green-500 shrink-0" />
                <span className="text-xs text-green-600 dark:text-green-400">Focus adopted</span>
              </>
            ) : (
              <>
                <Target className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                <span className="text-xs text-muted-foreground/40">Focus not adopted</span>
              </>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">{child.member_count}</span>
            <span className="text-xs text-muted-foreground">members</span>
          </div>
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-sm font-medium">{child.lessons_this_month}</span>
            <span className="text-xs text-muted-foreground">this month</span>
          </div>
        </div>

        {/* Subscription tier */}
        {child.subscription_tier && (
          <div className="flex items-center gap-1.5">
            <Layers className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">Tier:</span>
            <Badge variant="secondary" className="text-[10px]">
              {child.subscription_tier}
            </Badge>
            {child.subscription_status === 'past_due' && (
              <Badge variant="destructive" className="text-[10px]">
                Past Due
              </Badge>
            )}
          </div>
        )}

        {/* Pool bar */}
        {child.pool_total > 0 && (
          <PoolBar percentage={child.pool_percentage} />
        )}
      </CardContent>
    </Card>
  );
}
