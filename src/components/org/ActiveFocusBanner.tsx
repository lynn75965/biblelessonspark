/**
 * ActiveFocusBanner Component
 * 
 * Displays the organization's active shared focus to members with a "Use Focus" button.
 * When clicked, applies ALL org defaults to the lesson form:
 * - Shared Focus passage and/or theme
 * - Organization's default_bible_version  
 * - Organization's default_doctrine (theology profile)
 * 
 * SSOT: src/constants/sharedFocusConfig.ts
 */

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Target, BookOpen, Lightbulb, Calendar, ChevronRight, X } from "lucide-react";
import { useState } from "react";
import {
  FOCUS_TYPES,
  FOCUS_STATUS,
  formatDateRange,
  type SharedFocus,
  type FocusTypeKey,
  type FocusStatusKey,
} from "@/constants/sharedFocusConfig";
import { getBibleVersion } from "@/constants/bibleVersions";
import { getTheologyProfile } from "@/constants/theologyProfiles";

// ============================================================================
// TYPES
// ============================================================================

export interface FocusApplicationData {
  passage: string;
  theme: string;
  bibleVersionId: string | null;
  theologyProfileId: string | null;
}

interface ActiveFocusBannerProps {
  /** The active shared focus */
  focus: SharedFocus;
  /** Focus status (active, upcoming, expired) */
  status: FocusStatusKey;
  /** Organization name */
  organizationName: string;
  /** Organization's default Bible version ID */
  defaultBibleVersion: string | null;
  /** Organization's default theology profile ID */
  defaultDoctrine: string | null;
  /** Callback when user clicks "Use Focus" */
  onUseFocus: (data: FocusApplicationData) => void;
  /** Optional: Allow dismissing the banner */
  dismissible?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ActiveFocusBanner({
  focus,
  status,
  organizationName,
  defaultBibleVersion,
  defaultDoctrine,
  onUseFocus,
  dismissible = false,
}: ActiveFocusBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  // Only show for active focuses
  if (status !== "active") return null;

  const typeConfig = FOCUS_TYPES[focus.focus_type as FocusTypeKey];
  const statusConfig = FOCUS_STATUS[status];

  // Get friendly names for org defaults
  const bibleVersionName = defaultBibleVersion 
    ? getBibleVersion(defaultBibleVersion)?.abbreviation || defaultBibleVersion
    : null;
  const theologyProfileName = defaultDoctrine
    ? getTheologyProfile(defaultDoctrine)?.shortName || defaultDoctrine
    : null;

  // Get icon for focus type
  const getFocusIcon = () => {
    switch (focus.focus_type) {
      case "passage": return <BookOpen className="h-5 w-5" />;
      case "theme": return <Lightbulb className="h-5 w-5" />;
      case "both": return <Calendar className="h-5 w-5" />;
      default: return <Target className="h-5 w-5" />;
    }
  };

  const handleUseFocus = () => {
    onUseFocus({
      passage: focus.passage || "",
      theme: focus.theme || "",
      bibleVersionId: defaultBibleVersion,
      theologyProfileId: defaultDoctrine,
    });
  };

  return (
    <Alert className="border-primary bg-primary/5 mb-6">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
          {getFocusIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <AlertTitle className="text-base font-semibold">
              {organizationName} Shared Focus
            </AlertTitle>
            <Badge variant={statusConfig.badgeVariant} className="text-xs">
              {statusConfig.label}
            </Badge>
          </div>

          <AlertDescription className="mt-1">
            {/* Focus Details */}
            <div className="space-y-1 text-sm">
              {focus.passage && (
                <div>
                  <span className="font-medium">Passage:</span> {focus.passage}
                </div>
              )}
              {focus.theme && (
                <div>
                  <span className="font-medium">Theme:</span> {focus.theme}
                </div>
              )}
              <div className="text-muted-foreground text-xs">
                {formatDateRange(focus.start_date, focus.end_date)}
              </div>
            </div>

            {/* Org Defaults Info */}
            {(bibleVersionName || theologyProfileName) && (
              <div className="mt-2 pt-2 border-t border-primary/20">
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Organization defaults:</span>
                  {bibleVersionName && <span className="ml-2">📖 {bibleVersionName}</span>}
                  {theologyProfileName && <span className="ml-2">⛪ {theologyProfileName}</span>}
                </div>
              </div>
            )}

            {/* Notes if any */}
            {focus.notes && (
              <div className="mt-2 text-xs text-muted-foreground italic">
                {focus.notes}
              </div>
            )}
          </AlertDescription>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            size="sm" 
            onClick={handleUseFocus}
            className="gap-1"
          >
            Use Focus
            <ChevronRight className="h-4 w-4" />
          </Button>
          
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}

// ============================================================================
// COMPACT VARIANT (for sidebar or smaller spaces)
// ============================================================================

interface CompactFocusBannerProps {
  focus: SharedFocus;
  organizationName: string;
  onUseFocus: () => void;
}

export function CompactFocusBanner({
  focus,
  organizationName,
  onUseFocus,
}: CompactFocusBannerProps) {
  return (
    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Target className="h-4 w-4 text-primary flex-shrink-0" />
          <div className="truncate">
            <span className="text-sm font-medium">{organizationName} Focus</span>
            <p className="text-xs text-muted-foreground truncate">
              {focus.passage || focus.theme}
            </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={onUseFocus}>
          Use
        </Button>
      </div>
    </div>
  );
}
