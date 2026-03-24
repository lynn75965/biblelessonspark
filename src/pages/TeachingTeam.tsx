import { AppShell } from "@/components/layout/AppShell";
import { TeachingTeamCard } from "@/components/dashboard/TeachingTeamCard";
import { useTeachingTeam } from "@/hooks/useTeachingTeam";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/constants/routes";
import { Users } from "lucide-react";

/**
 * Phase 27: Teaching Team Page
 *
 * Dedicated page for Teaching Team management, accessible via
 * the sidebar navigation.
 *
 * Wraps TeachingTeamCard with AppShell layout.
 */
export default function TeachingTeam() {
  const {
    team,
    members,
    isLeadTeacher,
    isMember,
    maxMembers,
    loading,
    createTeam,
    renameTeam,
    inviteMember,
    removeMember,
    disbandTeam,
    leaveTeam,
    hasTeam,
  } = useTeachingTeam();

  const { isPaidTier } = useSubscription();
  const navigate = useNavigate();

  return (
    <AppShell conditions={{ hasTeam }}>
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
            <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Teaching Team</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Share lessons with fellow teachers
            </p>
          </div>
        </div>

        {/* Teaching Team Card -- handles all 3 states */}
        <TeachingTeamCard
          team={team}
          members={members}
          isLeadTeacher={isLeadTeacher}
          isMember={isMember}
          maxMembers={maxMembers}
          loading={loading}
          onCreateTeam={createTeam}
          onRenameTeam={renameTeam}
          onInviteMember={inviteMember}
          onRemoveMember={removeMember}
          onDisbandTeam={disbandTeam}
          onLeaveTeam={leaveTeam}
          isPaidUser={isPaidTier}
          onUpgrade={() => navigate(ROUTES.PRICING)}
        />
      </div>
    </AppShell>
  );
}
