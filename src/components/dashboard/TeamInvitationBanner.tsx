import { useState } from "react";
import { Users, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PendingTeamInvitation } from "@/constants/contracts";

interface TeamInvitationBannerProps {
  invitation: PendingTeamInvitation;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
}

/**
 * Phase 27: Teaching Team Invitation Banner
 *
 * Shown at top of Dashboard when the current user has a pending invitation.
 * Provides Accept / Decline buttons with loading states.
 */
export function TeamInvitationBanner({ invitation, onAccept, onDecline }: TeamInvitationBannerProps) {
  const [responding, setResponding] = useState(false);

  const handleAccept = async () => {
    setResponding(true);
    try {
      await onAccept();
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    setResponding(true);
    try {
      await onDecline();
    } finally {
      setResponding(false);
    }
  };

  return (
    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 shrink-0">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="font-medium text-blue-900">
              You've been invited to join a Teaching Team
            </p>
            <p className="text-sm text-blue-700">
              <span className="font-semibold">{invitation.team_name}</span>
              {" led by "}
              <span className="font-semibold">{invitation.lead_teacher_name}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={handleAccept}
            disabled={responding}
            size="sm"
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            {responding ? "Joining..." : "Accept"}
          </Button>
          <Button
            onClick={handleDecline}
            disabled={responding}
            variant="outline"
            size="sm"
            className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <XCircle className="h-4 w-4 mr-1" />
            Decline
          </Button>
        </div>
      </div>
    </div>
  );
}
