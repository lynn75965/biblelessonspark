-- ============================================================================
-- STAGE D: DB-enforce the Teaching Team member cap (lead + MAX_TEAM_MEMBERS)
-- ----------------------------------------------------------------------------
-- The 4-member cap (lead + 3 invited) was enforced ONLY in the frontend
-- (useTeachingTeam.tsx). This migration makes it a database invariant via the
-- RPC layer (Architecture Principle #2 forbids triggers), and locks down the
-- table so the cap-checking RPCs are the ONLY way to create or accept a member.
--
-- Three parts:
--   1. invite_team_member()        -- the only path that creates a pending invite;
--                                     enforces the cap + all invite validations.
--   2. respond_to_team_invitation()-- hardened: rejects EXPIRED invites and
--                                     re-checks the cap before accepting.
--   3. RLS lockdown                -- the lead's broad ALL policy is narrowed to
--                                     SELECT + DELETE (no direct INSERT/UPDATE),
--                                     and the unused member self-UPDATE hole
--                                     (which allowed direct self-accept) is dropped.
--
-- The cap (3) and expiry (30 days) are hardcoded SQL MIRRORS of the frontend SSOT
-- (MAX_TEAM_MEMBERS, INVITATION_EXPIRY_DAYS in src/constants/contracts.ts) -- SQL
-- cannot import TS; this is the same documented mirror pattern as the lesson
-- section arrays (CLAUDE.md Rule #26).
-- ============================================================================

-- 1. invite_team_member -------------------------------------------------------
-- The single authoritative path to create/refresh a pending invite. Raises a
-- coded exception (TEAM_FULL / ALREADY_ON_TEAM / etc.) the frontend maps to a
-- friendly message. SECURITY DEFINER -> bypasses RLS to write the row.
CREATE OR REPLACE FUNCTION public.invite_team_member(p_team_id uuid, p_invitee_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  c_max_members CONSTANT integer := 3;   -- mirror MAX_TEAM_MEMBERS (invited; excludes lead)
  c_expiry_days CONSTANT integer := 30;  -- mirror INVITATION_EXPIRY_DAYS
  v_active_slots integer;
  v_prior_id     uuid;
  v_member_id    uuid;
  v_expires_at   timestamptz := now() + make_interval(days => c_expiry_days);
BEGIN
  -- Caller must lead this team.
  IF NOT public.is_team_lead_of(p_team_id) THEN
    RAISE EXCEPTION 'NOT_TEAM_LEAD';
  END IF;

  -- Cannot invite yourself.
  IF p_invitee_id = auth.uid() THEN
    RAISE EXCEPTION 'CANNOT_INVITE_SELF';
  END IF;

  -- Invitee must not already lead a team.
  IF EXISTS (SELECT 1 FROM public.teaching_teams WHERE lead_teacher_id = p_invitee_id) THEN
    RAISE EXCEPTION 'ALREADY_ON_TEAM';
  END IF;

  -- Invitee must not already be accepted, nor hold a non-expired pending invite,
  -- on ANY team. (A declined or expired row does NOT block a fresh invite.)
  IF EXISTS (
    SELECT 1 FROM public.teaching_team_members
    WHERE user_id = p_invitee_id
      AND (status = 'accepted'
           OR (status = 'pending' AND (expires_at IS NULL OR expires_at > now())))
  ) THEN
    RAISE EXCEPTION 'ALREADY_ON_TEAM';
  END IF;

  -- THE CAP: active slots = accepted + non-expired pending on THIS team.
  SELECT count(*) INTO v_active_slots
  FROM public.teaching_team_members
  WHERE team_id = p_team_id
    AND (status = 'accepted'
         OR (status = 'pending' AND (expires_at IS NULL OR expires_at > now())));

  IF v_active_slots >= c_max_members THEN
    RAISE EXCEPTION 'TEAM_FULL';
  END IF;

  -- Reuse a surviving declined/expired row for this (team, invitee) -- the
  -- unique_member_per_team constraint makes a fresh INSERT collide -- else INSERT.
  SELECT id INTO v_prior_id
  FROM public.teaching_team_members
  WHERE team_id = p_team_id AND user_id = p_invitee_id;

  IF v_prior_id IS NOT NULL THEN
    UPDATE public.teaching_team_members
    SET status = 'pending', invited_at = now(), responded_at = NULL, expires_at = v_expires_at
    WHERE id = v_prior_id
    RETURNING id INTO v_member_id;
  ELSE
    INSERT INTO public.teaching_team_members (team_id, user_id, status, invited_at, expires_at)
    VALUES (p_team_id, p_invitee_id, 'pending', now(), v_expires_at)
    RETURNING id INTO v_member_id;
  END IF;

  RETURN v_member_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.invite_team_member(uuid, uuid) TO authenticated;

-- 2. respond_to_team_invitation (hardened) -----------------------------------
-- Accept now rejects EXPIRED invites (closes the loophole where an expired
-- pending invite -- which does not count toward the cap -- could be accepted to
-- push the team over the limit) and re-checks the accepted-count cap as a
-- backstop. Decline is unchanged in effect.
CREATE OR REPLACE FUNCTION public.respond_to_team_invitation(p_membership_id uuid, p_accept boolean)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
DECLARE
  c_max_members CONSTANT integer := 3;   -- mirror MAX_TEAM_MEMBERS
  v_team_id uuid;
  v_accepted_count integer;
BEGIN
  IF p_accept THEN
    -- Resolve the team for this caller's pending, NON-EXPIRED invite.
    SELECT tm.team_id INTO v_team_id
    FROM public.teaching_team_members AS tm
    WHERE tm.id = p_membership_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'pending'
      AND (tm.expires_at IS NULL OR tm.expires_at > now());

    -- No live invite (wrong owner, not pending, or expired) -> signal failure.
    IF v_team_id IS NULL THEN
      RETURN NULL;
    END IF;

    -- Backstop: never let accepted members exceed the cap.
    SELECT count(*) INTO v_accepted_count
    FROM public.teaching_team_members
    WHERE team_id = v_team_id AND status = 'accepted';

    IF v_accepted_count >= c_max_members THEN
      RAISE EXCEPTION 'TEAM_FULL';
    END IF;

    UPDATE public.teaching_team_members AS tm
    SET status = 'accepted', responded_at = now()
    WHERE tm.id = p_membership_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'pending'
    RETURNING tm.team_id INTO v_team_id;
  ELSE
    UPDATE public.teaching_team_members AS tm
    SET status = 'declined', responded_at = now()
    WHERE tm.id = p_membership_id
      AND tm.user_id = auth.uid()
      AND tm.status = 'pending'
    RETURNING tm.team_id INTO v_team_id;
  END IF;

  RETURN v_team_id;
END;
$function$;

-- 3. RLS lockdown ------------------------------------------------------------
-- Remove direct INSERT/UPDATE paths so members can only be created via
-- invite_team_member and accepted via respond_to_team_invitation (both
-- cap-enforcing, SECURITY DEFINER). The lead keeps SELECT + DELETE (read the
-- roster, remove a member). Members keep SELECT of their own row (existing
-- "Users can read own membership" policy, untouched). Leaving still goes through
-- leave_teaching_team (SECURITY DEFINER).
DROP POLICY IF EXISTS "Lead teacher can manage team members" ON public.teaching_team_members;
DROP POLICY IF EXISTS "Users can update own membership" ON public.teaching_team_members;

CREATE POLICY "Lead teacher can read team members"
  ON public.teaching_team_members
  FOR SELECT
  TO authenticated
  USING (public.is_team_lead_of(team_id));

CREATE POLICY "Lead teacher can remove team members"
  ON public.teaching_team_members
  FOR DELETE
  TO authenticated
  USING (public.is_team_lead_of(team_id));
