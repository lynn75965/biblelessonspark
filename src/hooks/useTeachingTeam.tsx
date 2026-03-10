import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import {
  TeachingTeam,
  TeachingTeamMember,
  TeachingTeamMemberWithProfile,
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
      // 1. Check if user is a lead teacher
      const { data: leadTeam, error: leadError } = await supabase
        .from('teaching_teams')
        .select('*')
        .eq('lead_teacher_id', user.id)
        .maybeSingle();

      if (leadError) throw leadError;

      if (leadTeam) {
        setTeam(leadTeam);
        setIsLeadTeacher(true);
        setIsMember(false);
        setPendingInvitation(null);
        await fetchMembers(leadTeam.id);
        setLoading(false);
        return;
      }

      // 2. Check if user is an accepted member of a team
      const { data: membership, error: memberError } = await supabase
        .from('teaching_team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'accepted')
        .maybeSingle();

      if (memberError) throw memberError;

      if (membership) {
        const { data: memberTeam, error: teamError } = await supabase
          .from('teaching_teams')
          .select('*')
          .eq('id', membership.team_id)
          .single();

        if (teamError) throw teamError;

        setTeam(memberTeam);
        setIsLeadTeacher(false);
        setIsMember(true);
        setPendingInvitation(null);
        await fetchMembers(memberTeam.id);
        setLoading(false);
        return;
      }

      // 3. Check for a pending invitation that has not expired
      const { data: pendingMembership, error: pendingError } = await supabase
        .from('teaching_team_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .maybeSingle();

      if (pendingError) throw pendingError;

      // Ignore if expired -- treat as if no invitation exists
      if (pendingMembership && !isInviteExpired(pendingMembership.expires_at)) {
        const { data: inviteTeam, error: inviteTeamError } = await supabase
          .from('teaching_teams')
          .select('*')
          .eq('id', pendingMembership.team_id)
          .single();

        if (inviteTeamError) throw inviteTeamError;

        const { data: leadProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', inviteTeam.lead_teacher_id)
          .single();

        setPendingInvitation({
          membership_id: pendingMembership.id,
          team_id: inviteTeam.id,
          team_name: inviteTeam.name,
          lead_teacher_name: leadProfile?.full_name || 'A fellow teacher',
          invited_at: pendingMembership.invited_at,
        });
        setTeam(null);
        setIsLeadTeacher(false);
        setIsMember(false);
      } else {
        // No team involvement, or only an expired invite
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
      const { data: memberRows, error } = await supabase
        .from('teaching_team_members')
        .select('*')
        .eq('team_id', teamId)
        .in('status', ['pending', 'accepted'])
        .order('invited_at', { ascending: true });

      if (error) throw error;

      // Exclude expired pending invites -- accepted members always included
      const activeRows = (memberRows || []).filter(m =>
        m.status === 'accepted' || !isInviteExpired(m.expires_at)
      );

      const memberIds = activeRows.map(m => m.user_id);
      let profileMap: Record<string, { full_name: string | null; email: string | null }> = {};

      if (memberIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .in('id', memberIds);

        if (profiles) {
          profiles.forEach(p => {
            profileMap[p.id] = { full_name: p.full_name, email: p.email };
          });
        }
      }

      // Map full_name -> display_name for frontend interface
      const enrichedMembers: TeachingTeamMemberWithProfile[] = activeRows.map(m => ({
        ...m,
        display_name: profileMap[m.user_id]?.full_name || null,
        email: profileMap[m.user_id]?.email || null,
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
        description: `"${data.name}" is ready. Invite up to ${MAX_TEAM_MEMBERS - 1} fellow teachers!`,
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
      // Look up the invitee by email (SSOT: full_name, email)
      const { data: inviteeProfile, error: lookupError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (lookupError) throw lookupError;

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

      // Compute expiry date (SSOT: INVITATION_EXPIRY_DAYS from contracts.ts)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

      // All checks passed -- create invitation with expiry
      const { data: newMember, error: insertError } = await supabase
        .from('teaching_team_members')
        .insert([{
          team_id: team.id,
          user_id: inviteeProfile.id,
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        }])
        .select()
        .single();

      if (insertError) throw insertError;

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
        email: inviteeProfile.email,
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
   * Accept a pending invitation
   */
  const acceptInvitation = async () => {
    if (!user || !pendingInvitation) return;

    try {
      const { error } = await supabase
        .from('teaching_team_members')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', pendingInvitation.membership_id)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: `You joined ${pendingInvitation.team_name}`,
        description: 'You can now see shared lessons from your team members.',
      });

      await fetchTeamData();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error accepting invitation',
        description: 'Failed to accept the invitation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Decline a pending invitation
   */
  const declineInvitation = async () => {
    if (!user || !pendingInvitation) return;

    try {
      const { error } = await supabase
        .from('teaching_team_members')
        .update({
          status: 'declined',
          responded_at: new Date().toISOString(),
        })
        .eq('id', pendingInvitation.membership_id)
        .eq('user_id', user.id);

      if (error) throw error;

      setPendingInvitation(null);
      toast({
        title: 'Invitation declined',
        description: 'The team invitation has been declined.',
      });
    } catch (error) {
      console.error('Error declining invitation:', error);
      toast({
        title: 'Error declining invitation',
        description: 'Failed to decline the invitation. Please try again.',
        variant: 'destructive',
      });
    }
  };

  /**
   * Leave a team (Member only, not Lead Teacher)
   */
  const leaveTeam = async () => {
    if (!user || !team || !isMember) return;

    try {
      const { error } = await supabase
        .from('teaching_team_members')
        .delete()
        .eq('team_id', team.id)
        .eq('user_id', user.id);

      if (error) throw error;

      resetState();
      toast({
        title: 'Left team',
        description: `You have left "${team.name}".`,
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
   * EXCEPT the current user (their own lessons are already in their library).
   */
  const fetchTeamLessons = async (): Promise<{ data: any[]; error: any }> => {
    if (!user || !team) return { data: [], error: null };

    try {
      const teamUserIds: string[] = [];

      if (team.lead_teacher_id !== user.id) {
        teamUserIds.push(team.lead_teacher_id);
      }

      members
        .filter(m => m.status === 'accepted' && m.user_id !== user.id)
        .forEach(m => teamUserIds.push(m.user_id));

      if (teamUserIds.length === 0) return { data: [], error: null };

      const { data, error } = await supabase
        .from('lessons')
        .select('*')
        .in('user_id', teamUserIds)
        .eq('visibility', 'shared')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
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
