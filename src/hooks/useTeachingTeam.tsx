import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import {
  TeachingTeam,
  TeachingTeamMember,
  TeachingTeamMemberWithProfile,
  TeachingTeamMemberStatus,
  PendingTeamInvitation,
  MAX_TEAM_MEMBERS,
  INVITATION_EXPIRY_DAYS,
} from '@/constants/contracts';

/**
 * Phase 27: Teaching Team Hook
 *
 * Manages all Teaching Team operations:
 * - Create / rename / disband team (Lead Teacher)
 * - Invite / remove members (Lead Teacher)
 * - Accept / decline invitations (Invitee)
 * - Leave team (Member)
 * - Fetch team data and pending invitations
 *
 * One team at a time per teacher (lead or member, not both).
 *
 * SSOT: profiles table uses `full_name` column (not display_name).
 * Frontend interface uses `display_name` for UI display; this hook
 * maps full_name -> display_name at the query boundary.
 *
 * INVITATION EXPIRY (March 2026):
 * Pending invitations expire after INVITATION_EXPIRY_DAYS days.
 * Expired invites are excluded from slot counts, member lists,
 * and the invitee's pending banner. isInviteExpired() is the
 * single helper for all expiry checks in this hook.
 */

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Returns true if a pending invitation has passed its expiry date.
 * Null expires_at = legacy row created before expiry was implemented;
 * treated as NOT expired for backward compatibility.
 */
function isInviteExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

// ============================================================================
// HOOK
// ============================================================================

export function useTeachingTeam() {
  const [team, setTeam] = useState<TeachingTeam | null>(null);
  const [members, setMembers] = useState<TeachingTeamMemberWithProfile[]>([]);
  const [pendingInvitation, setPendingInvitation] = useState<PendingTeamInvitation | null>(null);
  const [isLeadTeacher, setIsLeadTeacher] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  // -- Fetch team data on mount ------------------------------------------

  useEffect(() => {
    if (user) {
      fetchTeamData();
    } else {
      resetState();
      setLoading(false);
    }
  }, [user]);

  const resetState = () => {
    setTeam(null);
    setMembers([]);
    setPendingInvitation(null);
    setIsLeadTeacher(false);
    setIsMember(false);
  };

  /**
   * Master fetch: determines if user is a lead teacher, accepted member,
   * or has a pending (non-expired) invitation.
   */
  const fetchTeamData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Resolve the caller's team past RLS. teaching_teams SELECT is restricted
      // to the lead teacher, so a non-lead member/invitee cannot read their team
      // row directly -- a raw .from('teaching_teams').single() zero-filters under
      // RLS and throws PGRST116, which previously surfaced as the page-level
      // "Error loading team data" toast. get_my_teaching_team (SECURITY DEFINER,
      // migration 20260615130000) returns the single team the caller leads or is
      // a pending/accepted member of, with the lead's name.
      const { data: myTeamRows, error: myTeamError } = await supabase.rpc(
        'get_my_teaching_team'
      );

      if (myTeamError) throw myTeamError;

      const my = (Array.isArray(myTeamRows) ? myTeamRows[0] : myTeamRows) as
        | {
            team_id: string;
            team_name: string;
            lead_teacher_id: string;
            lead_full_name: string | null;
            my_status: string;
          }
        | null
        | undefined;

      // No team involvement -- clean slate, NOT an error (no toast).
      if (!my) {
        resetState();
        return;
      }

      // teaching_teams timestamps are not surfaced by the resolver and are not
      // read by any consumer; placeholders keep the TeachingTeam shape complete.
      const teamObj: TeachingTeam = {
        id: my.team_id,
        name: my.team_name,
        lead_teacher_id: my.lead_teacher_id,
        created_at: '',
        updated_at: '',
      };

      // LEAD TEACHER
      if (my.my_status === 'lead') {
        setTeam(teamObj);
        setIsLeadTeacher(true);
        setIsMember(false);
        setPendingInvitation(null);
        await fetchMembers(my.team_id);
        return;
      }

      // ACCEPTED MEMBER
      if (my.my_status === 'accepted') {
        setTeam(teamObj);
        setIsLeadTeacher(false);
        setIsMember(true);
        setPendingInvitation(null);
        await fetchMembers(my.team_id);
        return;
      }

      // PENDING INVITEE -- the resolver gives team + lead name past RLS, but the
      // membership id / invited_at / expires_at come from the invitee's OWN
      // teaching_team_members row, which RLS DOES allow (user_id = auth.uid()).
      const { data: pendingMembership, error: pendingError } = await supabase
        .from('teaching_team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('team_id', my.team_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (pendingError) throw pendingError;

      // Ignore if expired -- treat as if no invitation exists.
      if (pendingMembership && !isInviteExpired(pendingMembership.expires_at)) {
        setPendingInvitation({
          membership_id: pendingMembership.id,
          team_id: my.team_id,
          team_name: my.team_name,
          lead_teacher_name: my.lead_full_name || 'A fellow teacher',
          invited_at: pendingMembership.invited_at,
        });
        setTeam(null);
        setIsLeadTeacher(false);
        setIsMember(false);
      } else {
        // No team involvement, or only an expired invite.
        resetState();
      }
    } catch (error) {
      console.error('Error fetching teaching team data:', error);
      toast({
        title: 'Error loading team data',
        description: 'Failed to load your Teaching Team information. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  /**
   * Fetch all members for a given team (with profile names).
   * Excludes expired pending invitations -- they no longer occupy slots
   * or appear in the lead teacher's member list.
   * SSOT: profiles table uses full_name; mapped to display_name for UI.
   */
  const fetchMembers = async (teamId: string) => {
    try {
      // FACT C (live RLS read 2026-06-16): a member's client read of
      // teaching_team_members returns ONLY their own row -- SELECT is
      // user_id = auth.uid() and there is no co-member read policy -- so the
      // member-side roster undercounted to just themselves (count showed
      // "2 members" regardless of true size). Source the FULL roster from the
      // get_teaching_team_members resolver (SECURITY DEFINER, migration
      // 20260616160000 now returns id + team_id alongside name/email/status),
      // which is authorized to the team's lead teacher AND any member. One read,
      // correct for lead and member alike -- no raw teaching_team_members client
      // read remains on this path. This also supplies full_name/email past the
      // profiles RLS that previously rendered rows as "Unknown".
      const { data: roster, error } = await supabase.rpc(
        'get_teaching_team_members',
        { p_team_id: teamId }
      );

      if (error) throw error;

      const rosterRows = (Array.isArray(roster) ? roster : []) as Array<{
        id: string;
        team_id: string;
        user_id: string;
        full_name: string | null;
        email: string | null;
        status: string;
        invited_at: string;
        responded_at: string | null;
        expires_at: string | null;
      }>;

      // Exclude expired pending invites -- accepted members always included.
      const activeRows = rosterRows.filter(m =>
        m.status === 'accepted' || !isInviteExpired(m.expires_at)
      );

      // Map full_name -> display_name for the frontend interface.
      const enrichedMembers: TeachingTeamMemberWithProfile[] = activeRows.map(m => ({
        id: m.id,
        team_id: m.team_id,
        user_id: m.user_id,
        status: m.status as TeachingTeamMemberStatus,
        invited_at: m.invited_at,
        responded_at: m.responded_at,
        expires_at: m.expires_at,
        display_name: m.full_name,
        email: m.email,
      }));

      setMembers(enrichedMembers);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  // -- Lead Teacher Actions ----------------------------------------------

  /**
   * Create a new Teaching Team
   */
  const createTeam = async (teamName: string) => {
    if (!user) return { error: 'Not authenticated' };

    try {
      const { data, error } = await supabase
        .from('teaching_teams')
        .insert([{ name: teamName.trim(), lead_teacher_id: user.id }])
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast({
            title: 'Already leading a team',
            description: 'You already have a Teaching Team. Disband it first to create a new one.',
            variant: 'destructive',
          });
          return { error: 'Already leading a team' };
        }
        throw error;
      }

      setTeam(data);
      setIsLeadTeacher(true);
      setMembers([]);
      toast({
        title: 'Teaching Team created',
        description: `"${data.name}" is ready. Invite up to ${MAX_TEAM_MEMBERS} fellow teachers!`,
      });
      return { error: null };
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: 'Error creating team',
        description: 'Failed to create your Teaching Team. Please try again.',
        variant: 'destructive',
      });
      return { error };
    }
  };

  /**
   * Rename the team (Lead Teacher only)
   */
  const renameTeam = async (newName: string) => {
    if (!user || !team || !isLeadTeacher) return;

    try {
      const { error } = await supabase
        .from('teaching_teams')
        .update({ name: newName.trim(), updated_at: new Date().toISOString() })
        .eq('id', team.id)
        .eq('lead_teacher_id', user.id);

      if (error) throw error;

      setTeam(prev => prev ? { ...prev, name: newName.trim() } : null);
      toast({
        title: 'Team renamed',
        description: `Team is now "${newName.trim()}"`,
      });
    } catch (error) {
      console.error('Error renaming team:', error);
      toast({
        title: 'Error renaming team',
        description: 'Failed to rename your team. Please try again.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Invite a teacher by email address (Lead Teacher only).
   * Sets expires_at = now + INVITATION_EXPIRY_DAYS on insert.
   * Slot count excludes expired pending invitations.
   * SSOT: profiles table uses full_name (not display_name).
   */
  const inviteMember = async (email: string): Promise<{ error: boolean; message: string }> => {
    if (!user || !team || !isLeadTeacher) {
      return { error: true, message: 'Not authorized' };
    }

    // Slot count: accepted always count; pending only if not expired
    const activeSlots = members.filter(m =>
      m.status === 'accepted' ||
      (m.status === 'pending' && !isInviteExpired(m.expires_at))
    );
    if (activeSlots.length >= MAX_TEAM_MEMBERS) {
      return { error: true, message: `Team is full (${MAX_TEAM_MEMBERS} members maximum).` };
    }

    try {
      // Look up the invitee by email via the SECURITY DEFINER resolver
      // find_teaching_team_invitee (migration 20260614120000). The email SSOT
      // is auth.users.email; the resolver reads it directly and bypasses the
      // profiles RLS SELECT policy (profiles_org_admin_view_all) that hides
      // other users' rows from a non-admin Lead Teacher's session -- the real
      // cause of the "No account found" bug. It returns only { id, full_name }.
      const { data: lookupRows, error: lookupError } = await supabase.rpc(
        'find_teaching_team_invitee',
        { p_email: email }
      );

      if (lookupError) throw lookupError;

      const inviteeProfile = (Array.isArray(lookupRows) ? lookupRows[0] : lookupRows) as
        | { id: string; full_name: string | null }
        | null
        | undefined;

      if (!inviteeProfile) {
        return {
          error: true,
          message: 'No BibleLessonSpark account found for that email. Ask them to sign up at biblelessonspark.com, then try again.',
        };
      }

      if (inviteeProfile.id === user.id) {
        return { error: true, message: 'You cannot invite yourself to your own team.' };
      }

      // Check if invitee already leads a team
      const { data: existingLead } = await supabase
        .from('teaching_teams')
        .select('id')
        .eq('lead_teacher_id', inviteeProfile.id)
        .maybeSingle();

      if (existingLead) {
        return {
          error: true,
          message: `${inviteeProfile.full_name || 'That teacher'} already leads a Teaching Team.`,
        };
      }

      // Check if invitee is already an accepted member of any team,
      // or has a non-expired pending invite on any team
      const { data: existingMembership } = await supabase
        .from('teaching_team_members')
        .select('id, status, expires_at')
        .eq('user_id', inviteeProfile.id)
        .in('status', ['accepted', 'pending'])
        .maybeSingle();

      if (existingMembership) {
        // A pending invite that has expired does not block re-inviting
        const isBlocker =
          existingMembership.status === 'accepted' ||
          (existingMembership.status === 'pending' && !isInviteExpired(existingMembership.expires_at));

        if (isBlocker) {
          return {
            error: true,
            message: `${inviteeProfile.full_name || 'That teacher'} is already on a teaching team.`,
          };
        }
      }

      // Compute expiry for the OPTIMISTIC local row. The authoritative value is
      // set server-side by invite_team_member to the same now + INVITATION_EXPIRY_DAYS.
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

      // Stage D: the pending invite is created ONLY through invite_team_member
      // (SECURITY DEFINER), which DB-ENFORCES the team cap + all invite checks and
      // handles declined/expired-row reuse (unique_member_per_team). Direct client
      // INSERT/UPDATE on teaching_team_members is no longer permitted by RLS.
      const { data: newMemberId, error: rpcError } = await supabase.rpc('invite_team_member', {
        p_team_id: team.id,
        p_invitee_id: inviteeProfile.id,
      });

      if (rpcError) {
        const code = rpcError.message || '';
        let message = 'Failed to send the invitation. Please try again.';
        if (code.includes('TEAM_FULL')) {
          message = `Team is full (${MAX_TEAM_MEMBERS} members maximum).`;
        } else if (code.includes('ALREADY_ON_TEAM')) {
          message = `${inviteeProfile.full_name || 'That teacher'} is already on a teaching team.`;
        } else if (code.includes('CANNOT_INVITE_SELF')) {
          message = 'You cannot invite yourself to your own team.';
        } else if (code.includes('NOT_TEAM_LEAD')) {
          message = 'Only the lead teacher can invite members.';
        }
        return { error: true, message };
      }

      const newMember = {
        id: newMemberId as string,
        team_id: team.id,
        user_id: inviteeProfile.id,
        status: 'pending' as const,
        invited_at: new Date().toISOString(),
        responded_at: null,
        expires_at: expiresAt.toISOString(),
      };

      // Fire-and-forget: email notification via Edge Function
      supabase.functions
        .invoke('notify-team-invitation', {
          body: { team_member_id: newMember.id },
        })
        .then(({ error: fnError }) => {
          if (fnError) {
            console.error('Email notification failed (non-blocking):', fnError);
          }
        })
        .catch(emailErr => {
          console.error('Email notification failed (non-blocking):', emailErr);
        });

      // Add to local state with profile info (map full_name -> display_name)
      const enriched: TeachingTeamMemberWithProfile = {
        ...newMember,
        display_name: inviteeProfile.full_name,
        email: email.trim().toLowerCase(),
      };
      setMembers(prev => [...prev, enriched]);

      toast({
        title: 'Invitation sent',
        description: `${inviteeProfile.full_name || email} has been invited and will receive an email notification.`,
      });
      return { error: false, message: 'Invitation sent' };
    } catch (error) {
      console.error('Error inviting member:', error);
      toast({
        title: 'Error sending invitation',
        description: 'Failed to send the invitation. Please try again.',
        variant: 'destructive',
      });
      return { error: true, message: 'Failed to send the invitation.' };
    }
  };

  /**
   * Remove a member from the team (Lead Teacher only)
   */
  const removeMember = async (memberId: string) => {
    if (!user || !team || !isLeadTeacher) return;

    try {
      const { error } = await supabase
        .from('teaching_team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_id', team.id);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberId));
      toast({
        title: 'Member removed',
        description: 'Team member has been removed.',
      });
    } catch (error) {
      console.error('Error removing member:', error);
      toast({
        title: 'Error removing member',
        description: 'Failed to remove the team member. Please try again.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Disband the entire team (Lead Teacher only).
   * CASCADE on teaching_teams deletes all member rows automatically.
   */
  const disbandTeam = async () => {
    if (!user || !team || !isLeadTeacher) return;

    try {
      const { error } = await supabase
        .from('teaching_teams')
        .delete()
        .eq('id', team.id)
        .eq('lead_teacher_id', user.id);

      if (error) throw error;

      resetState();
      toast({
        title: 'Team disbanded',
        description: 'Your Teaching Team has been disbanded. All members have been released.',
      });
    } catch (error) {
      console.error('Error disbanding team:', error);
      toast({
        title: 'Error disbanding team',
        description: 'Failed to disband the team. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // -- Invitee / Member Actions ------------------------------------------

  /**
   * Accept a pending invitation.
   * Returns true on a confirmed accept so the caller can navigate the new
   * member to /teaching-team (which remounts AppShell and unlocks the sidebar).
   *
   * The write goes through the SECURITY DEFINER resolver respond_to_team_invitation
   * (migration 20260615140000), NOT a client UPDATE: a non-lead invitee has no
   * verified RLS UPDATE policy on teaching_team_members, so a raw UPDATE could
   * silently affect zero rows. The resolver enforces (own row AND still pending)
   * internally and returns the affected team_id, or null when nothing matched.
   */
  const acceptInvitation = async (): Promise<boolean> => {
    if (!user || !pendingInvitation) return false;

    try {
      const { data: teamId, error } = await supabase.rpc(
        'respond_to_team_invitation',
        { p_membership_id: pendingInvitation.membership_id, p_accept: true }
      );

      if (error) throw error;

      // Null return = nothing updated (already responded, expired, or not theirs).
      if (!teamId) {
        toast({
          title: 'Invitation no longer pending',
          description: 'This invitation has already been responded to or is no longer available.',
        });
        await fetchTeamData();
        return false;
      }

      toast({
        title: `You joined ${pendingInvitation.team_name}`,
        description: 'You can now see shared lessons from your team members.',
      });

      await fetchTeamData();
      return true;
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error accepting invitation',
        description: 'Failed to accept the invitation. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  /**
   * Decline a pending invitation. Returns true on a confirmed decline.
   * Uses the same SECURITY DEFINER resolver (p_accept = false).
   */
  const declineInvitation = async (): Promise<boolean> => {
    if (!user || !pendingInvitation) return false;

    try {
      const { data: teamId, error } = await supabase.rpc(
        'respond_to_team_invitation',
        { p_membership_id: pendingInvitation.membership_id, p_accept: false }
      );

      if (error) throw error;

      // Clear the banner either way -- the invitation is no longer actionable.
      setPendingInvitation(null);

      if (!teamId) {
        // Already responded / not theirs: benign no-op, no hard error.
        await fetchTeamData();
        return false;
      }

      toast({
        title: 'Invitation declined',
        description: 'The team invitation has been declined.',
      });
      return true;
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error declining invitation',
        description: 'Failed to decline the invitation. Please try again.',
        variant: 'destructive',
      });
      return false;
    }
  };

  /**
   * Leave a team (Member only, not Lead Teacher)
   */
  const leaveTeam = async () => {
    if (!user || !team || !isMember) return;

    // FACT B (Session 1 diagnosis): teaching_team_members has SELECT-own and
    // UPDATE-own member policies but NO DELETE-own policy, so the previous raw
    // client DELETE matched no policy -> silent 0-row no-op (the row survived and
    // the team reappeared on refetch). leave_teaching_team() (SECURITY DEFINER,
    // migration 20260616170000) deletes the caller's own accepted row past RLS and
    // returns the affected team_id, or null when nothing matched.
    const teamName = team.name;
    try {
      const { data: teamId, error } = await supabase.rpc('leave_teaching_team');

      if (error) throw error;

      if (!teamId) {
        // Nothing matched (already left, or not an accepted member): benign no-op.
        await fetchTeamData();
        toast({
          title: 'Not on a team',
          description: 'Your membership was already removed.',
        });
        return;
      }

      resetState();
      toast({
        title: 'Left team',
        description: `You have left "${teamName}".`,
      });
    } catch (error) {
      console.error('Error leaving team:', error);
      toast({
        title: 'Error leaving team',
        description: 'Failed to leave the team. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // -- Team Lessons Query (for LessonLibrary) ----------------------------

  /**
   * Fetch shared lessons from all team members (including lead teacher).
   * Returns lessons where visibility = 'shared' for all team participants
   * INCLUDING the current user -- the caller's own shared lessons appear in the
   * Team Lessons view alongside everyone else's (changed 2026-06-17, migration
   * 20260617120000; previously the caller's own rows were excluded).
   */
  const fetchTeamLessons = async (): Promise<{ data: any[]; error: any }> => {
    if (!user || !team) return { data: [], error: null };

    try {
      // FACT A (live RLS read 2026-06-16): the lessons table has NO policy that
      // lets any user SELECT another user's row, so a client read of teammates'
      // shared lessons zero-filtered to 0 rows for BOTH lead and member. The
      // get_team_lessons resolver (SECURITY DEFINER, migrations 20260616160000
      // + 20260617120000) computes the caller's team peers (lead + accepted
      // members, a set that already includes the caller) server-side and returns
      // their visibility='shared' lessons, the caller's own rows included.
      const { data, error } = await supabase.rpc('get_team_lessons');

      if (error) throw error;

      const rows = (Array.isArray(data) ? data : []) as Array<{
        lesson_id: string;
        user_id: string;
        title: string | null;
        bible_passage: string | null;
        age_group: string | null;
        theology_profile: string | null;
        visibility: string | null;
        created_at: string | null;
        author_name: string | null;
      }>;

      // Reshape the flat resolver rows into the lesson-shaped objects that
      // LessonLibrary's transformToDisplay expects. The flat passage/age/theology
      // columns are folded back into a synthesized `filters` object; the full body
      // (original_text) is intentionally omitted here and fetched on demand by the
      // viewer via get_team_lesson (path 3).
      const shaped = rows.map(r => ({
        id: r.lesson_id,
        user_id: r.user_id,
        title: r.title,
        original_text: null as string | null,
        visibility: r.visibility,
        created_at: r.created_at,
        filters: {
          bible_passage: r.bible_passage,
          age_group: r.age_group,
          theology_profile_id: r.theology_profile,
        },
        author_name: r.author_name,
        isTeamLesson: true,
      }));

      return { data: shaped, error: null };
    } catch (error) {
      console.error('Error fetching team lessons:', error);
      return { data: [], error };
    }
  };

  return {
    // State
    team,
    members,
    pendingInvitation,
    isLeadTeacher,
    isMember,
    loading,
    hasTeam: !!team,
    maxMembers: MAX_TEAM_MEMBERS,

    // Lead Teacher actions
    createTeam,
    renameTeam,
    inviteMember,
    removeMember,
    disbandTeam,

    // Member / Invitee actions
    acceptInvitation,
    declineInvitation,
    leaveTeam,

    // Shared
    fetchTeamLessons,
    refetch: fetchTeamData,
  };
}
