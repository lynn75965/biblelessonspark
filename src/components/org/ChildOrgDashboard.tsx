// ============================================================
// ChildOrgDashboard.tsx
// Network tab content — responsive grid of child org cards
// SSOT Source: organizationConfig.ts → PARENT_VISIBILITY
// 
// This is the primary dashboard view for parent Org Managers.
// Shows each direct child org as a card with health indicators.
// Privacy boundary enforced at database level (Phase N2 RLS).
// ============================================================

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Network, RefreshCw, AlertCircle } from "lucide-react";
import { ChildOrgCard } from "@/components/org/ChildOrgCard";
import type { ChildOrgSummary } from "@/hooks/useChildOrgSummaries";

interface ChildOrgDashboardProps {
  children: ChildOrgSummary[];
  loading: boolean;
  error: string | null;
  organizationName: string;
  onRefresh: () => void;
}

/**
 * Summary bar showing aggregate health counts across all children.
 * Gives the parent Org Manager an at-a-glance network health view.
 */
function NetworkHealthSummary({ children }: { children: ChildOrgSummary[] }) {
  const healthy = children.filter(c => c.health_status === 'healthy').length;
  const attention = children.filter(c => c.health_status === 'attention').length;
  const critical = children.filter(c => c.health_status === 'critical').length;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="outline" className="gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#22C55E' }} />
        {healthy} Healthy
      </Badge>
      {attention > 0 && (
        <Badge variant="outline" className="gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
          {attention} Attention
        </Badge>
      )}
      {critical > 0 && (
        <Badge variant="destructive" className="gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#EF4444' }} />
          {critical} Critical
        </Badge>
      )}
    </div>
  );
}

export function ChildOrgDashboard({
  children,
  loading,
  error,
  organizationName,
  onRefresh
}: ChildOrgDashboardProps) {
  // Loading state
  if (loading) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="p-8">
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Loading network data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card className="bg-gradient-card border-destructive/50">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-medium text-destructive">Error loading network data</p>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Empty state (should not normally show since tab is hidden when no children)
  if (children.length === 0) {
    return (
      <Card className="bg-gradient-card">
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <Network className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium">No connected organizations</p>
              <p className="text-sm text-muted-foreground mt-1">
                Child organizations connected to {organizationName} will appear here.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dashboard view
  return (
    <div className="space-y-4">
      {/* Network header with health summary */}
      <Card className="bg-gradient-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Network className="h-5 w-5" />
                Network Overview
              </CardTitle>
              <CardDescription className="mt-1">
                {children.length} organization{children.length !== 1 ? 's' : ''} connected to {organizationName}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <NetworkHealthSummary children={children} />
        </CardContent>
      </Card>

      {/* Child org cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map((child) => (
          <ChildOrgCard key={child.org_id} child={child} />
        ))}
      </div>
    </div>
  );
}
