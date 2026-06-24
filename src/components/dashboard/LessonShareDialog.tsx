/**
 * LessonShareDialog -- Stage C per-group sharing popup.
 *
 * Replaces the old single Private/Shared toggle. The author chooses, with
 * independent checkboxes, whether a lesson is shared with their Team and/or
 * their Shepherd group. Both off = private (visible only to the author).
 *
 * Rules:
 * - A checkbox is shown only for a group the author actually belongs to
 *   (hasTeam / hasOrganization).
 * - Pool-funded lessons (org_pool_consumed) are group content by design: the
 *   Shepherd checkbox is checked AND locked on -- the author cannot hide what
 *   the group funded.
 *
 * Accessibility (Rule #22): built on the accessible Radix Dialog + Checkbox.
 * Each checkbox has an explicit <Label htmlFor>; the locked checkbox uses
 * aria-disabled (not the disabled attribute) so it stays focusable and its
 * reason is announced. Decorative icons are aria-hidden.
 */

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Users, Heart, Lock } from "lucide-react";

export interface LessonShareTarget {
  id: string;
  title?: string | null;
  shared_with_team?: boolean | null;
  shared_with_org?: boolean | null;
  org_pool_consumed?: boolean | null;
}

interface LessonShareDialogProps {
  lesson: LessonShareTarget | null;
  hasTeam: boolean;
  hasOrganization: boolean;
  onClose: () => void;
  onSave: (shares: { shared_with_team: boolean; shared_with_org: boolean }) => Promise<void> | void;
}

export function LessonShareDialog({
  lesson,
  hasTeam,
  hasOrganization,
  onClose,
  onSave,
}: LessonShareDialogProps) {
  const isOpen = lesson !== null;
  const poolLocked = !!lesson?.org_pool_consumed;

  const [teamChecked, setTeamChecked] = useState(false);
  const [orgChecked, setOrgChecked] = useState(false);
  const [saving, setSaving] = useState(false);

  // Re-seed the checkboxes each time a lesson is opened. Pool-funded lessons
  // force the Shepherd box on.
  useEffect(() => {
    if (lesson) {
      setTeamChecked(!!lesson.shared_with_team);
      setOrgChecked(poolLocked ? true : !!lesson.shared_with_org);
    }
  }, [lesson, poolLocked]);

  const handleSave = async () => {
    if (!lesson) return;
    setSaving(true);
    try {
      await onSave({
        shared_with_team: hasTeam ? teamChecked : false,
        shared_with_org: hasOrganization ? (poolLocked ? true : orgChecked) : false,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const noGroups = !hasTeam && !hasOrganization;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share this lesson</DialogTitle>
          <DialogDescription>
            Choose who can see this lesson. It stays private until you share it.
          </DialogDescription>
        </DialogHeader>

        {noGroups ? (
          <p className="text-sm text-muted-foreground py-2">
            You are not part of a Teaching Team or a Shepherd group yet, so there
            is no one to share with. Join or start a team to share your lessons.
          </p>
        ) : (
          <div className="space-y-4 py-2">
            {hasTeam && (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="share-team"
                  checked={teamChecked}
                  onCheckedChange={(v) => setTeamChecked(v === true)}
                  className="mt-1"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="share-team" className="flex items-center gap-2 font-medium">
                    <Users className="h-4 w-4 text-primary" aria-hidden="true" />
                    Share with my Teaching Team
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Your co-teachers can view this lesson (read-only).
                  </p>
                </div>
              </div>
            )}

            {hasOrganization && (
              <div className="flex items-start gap-3">
                <Checkbox
                  id="share-org"
                  checked={orgChecked}
                  onCheckedChange={(v) => { if (!poolLocked) setOrgChecked(v === true); }}
                  aria-disabled={poolLocked || undefined}
                  aria-label={
                    poolLocked
                      ? "Share with my Shepherd group, locked on because the group funded this lesson"
                      : undefined
                  }
                  className="mt-1"
                />
                <div className="space-y-0.5">
                  <Label htmlFor="share-org" className="flex items-center gap-2 font-medium">
                    <Heart className="h-4 w-4 text-amber-500" aria-hidden="true" />
                    Share with my Shepherd group
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {poolLocked ? (
                      <span className="inline-flex items-center gap-1">
                        <Lock className="h-3 w-3" aria-hidden="true" />
                        Always shared -- your group funded this lesson.
                      </span>
                    ) : (
                      "Members of your Shepherd group can view this lesson (read-only)."
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          {!noGroups && (
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save sharing"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
