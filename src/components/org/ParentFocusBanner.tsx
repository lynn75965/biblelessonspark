// ============================================================
// ParentFocusBanner.tsx
// Banner shown to child org managers when parent has active focus
// SSOT Source: organizationConfig.ts → SHARED_FOCUS_INHERITANCE
//
// States:
//   1. Loading → hidden
//   2. No parent focus → hidden
//   3. Parent has focus, not adopted → blue banner with "Adopt" button
//   4. Parent has focus, already adopted → green confirmation banner
//
// PRINCIPLE: Suggestion, never enforcement. "Tap to adopt" not "must comply."
// ============================================================

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Check,
  BookOpen,
  Calendar,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useParentSharedFocus } from "@/hooks/useParentSharedFocus";
import { useToast } from "@/hooks/use-toast";

interface ParentFocusBannerProps {
  /** The child org's ID */
  childOrgId: string;
  /** Callback after successful adoption (e.g., refresh focus list) */
  onAdopted?: () => void;
}

/**
 * Builds the human-readable focus label from passage/theme.
 */
function buildFocusLabel(passage: string | null, theme: string | null): string {
  if (passage && theme) return `${passage} — ${theme}`;
  return passage || theme || 'Shared Focus';
}

/**
 * Formats a date range for display.
 */
function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
}

export function ParentFocusBanner({ childOrgId, onAdopted }: ParentFocusBannerProps) {
  const {
    parentFocus,
    loading,
    hasParentFocus,
    adopt
  } = useParentSharedFocus(childOrgId);
  const [adopting, setAdopting] = useState(false);
  const { toast } = useToast();

  // Don't render anything if loading, no parent, or no active focus
  if (loading || !hasParentFocus || !parentFocus) return null;

  const focusLabel = buildFocusLabel(parentFocus.passage, parentFocus.theme);
  const dateRange = formatDateRange(parentFocus.start_date, parentFocus.end_date);

  const handleAdopt = async () => {
    setAdopting(true);
    const success = await adopt();
    setAdopting(false);

    if (success) {
      toast({
        title: "Focus Adopted",
        description: "The network shared focus has been copied to your organization. You can modify it freely."
      });
      onAdopted?.();
    } else {
      toast({
        title: "Error",
        description: "Could not adopt focus. Please try again.",
        variant: "destructive"
      });
    }
  };

  // ── Already Adopted State ──────────────────────────────────────────
  if (parentFocus.already_adopted) {
    return (
      <Card className="mb-4 border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 shrink-0 mt-0.5">
              <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Network Focus Adopted
              </p>
              <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">
                From {parentFocus.parent_org_name}
              </p>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-white/80 dark:bg-background/80 text-xs">
                  <BookOpen className="h-3 w-3 mr-1" />
                  {focusLabel}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 inline mr-1" />
                  {dateRange}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Available to Adopt State ───────────────────────────────────────
  return (
    <Card className="mb-4 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 shrink-0 mt-0.5">
            <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Network Shared Focus
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              {parentFocus.parent_org_name} suggests this focus for the network:
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="bg-white/80 dark:bg-background/80 text-xs">
                <BookOpen className="h-3 w-3 mr-1" />
                {focusLabel}
              </Badge>
              <span className="text-xs text-muted-foreground">
                <Calendar className="h-3 w-3 inline mr-1" />
                {dateRange}
              </span>
            </div>
            {parentFocus.notes && (
              <p className="text-xs text-muted-foreground mt-1.5 italic">
                {parentFocus.notes}
              </p>
            )}
            <div className="mt-3">
              <Button
                size="sm"
                onClick={handleAdopt}
                disabled={adopting}
                className="gap-1.5"
              >
                {adopting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <ArrowRight className="h-3 w-3" />
                )}
                Adopt This Focus
              </Button>
              <span className="text-xs text-muted-foreground ml-3">
                Creates a copy you can modify freely
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
