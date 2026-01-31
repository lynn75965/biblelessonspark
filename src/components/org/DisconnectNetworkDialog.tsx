// ============================================================
// DisconnectNetworkDialog.tsx
// Confirmation dialog for disconnecting from a parent network
// SSOT Source: organizationConfig.ts → DISCONNECT_RULES
//
// Shows clearly:
//   - What CHANGES: parent loses visibility, card removed
//   - What DOESN'T change: members, pool, lessons, subscription
//
// Used in two contexts:
//   1. Child org Settings tab: "Disconnect from Network"
//   2. Parent org Network tab: "Disconnect" on a child card
// ============================================================

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Check, X, Loader2 } from "lucide-react";

interface DisconnectNetworkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Name of the org being disconnected */
  orgName: string;
  /** Name of the parent org (network being left) */
  parentOrgName: string;
  /** Who is initiating — affects the messaging */
  initiator: 'child' | 'parent';
  /** True while disconnect is in progress */
  loading?: boolean;
  /** Called when user confirms disconnect */
  onConfirm: () => void;
}

export function DisconnectNetworkDialog({
  open,
  onOpenChange,
  orgName,
  parentOrgName,
  initiator,
  loading = false,
  onConfirm
}: DisconnectNetworkDialogProps) {
  const title = initiator === 'child'
    ? `Disconnect from ${parentOrgName}?`
    : `Disconnect ${orgName}?`;

  const description = initiator === 'child'
    ? `This will remove ${orgName} from the ${parentOrgName} network. ${orgName} will become an independent organization.`
    : `This will remove ${orgName} from your network. They will become an independent organization.`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {/* Impact explanation — SSOT: DISCONNECT_RULES */}
        <div className="space-y-3 my-2">
          {/* What changes */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-destructive flex items-center gap-1.5">
              <X className="h-3.5 w-3.5" />
              What changes:
            </p>
            <ul className="text-sm text-muted-foreground ml-5 space-y-1">
              <li>{parentOrgName} will no longer see {orgName} on their network dashboard</li>
              <li>Network shared focus suggestions will no longer appear</li>
            </ul>
          </div>

          {/* What stays the same */}
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" />
              What stays the same:
            </p>
            <div className="flex flex-wrap gap-1.5 ml-5">
              <Badge variant="secondary" className="text-xs">Members</Badge>
              <Badge variant="secondary" className="text-xs">Lesson Pool</Badge>
              <Badge variant="secondary" className="text-xs">Lessons</Badge>
              <Badge variant="secondary" className="text-xs">Subscription</Badge>
              <Badge variant="secondary" className="text-xs">Shared Focus</Badge>
              <Badge variant="secondary" className="text-xs">Settings</Badge>
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Disconnecting...
              </>
            ) : (
              'Disconnect'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
