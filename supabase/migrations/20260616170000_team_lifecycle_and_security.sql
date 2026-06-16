-- 20260616170000_team_lifecycle_and_security.sql
-- Teaching Team lock-down -- SESSION 3 of 3: lifecycle mutation + RLS role hardening.
--
-- LIVE READS (Supabase SQL Editor, 2026-06-16 -- authoritative for this migration):
--   * FK teaching_team_members_team_id_fkey -> teaching_teams(id): confdeltype 'c' = CASCADE.
--   * FK teaching_team_members_user_id_fkey -> auth.users(id):      confdeltype 'c' = CASCADE.
--       => Disband (DELETE of the teaching_teams row) already cascade-deletes member rows.
--          Path 4c requires NO DDL -- this is logged confirmation only.
--   * UNIQUE unique_member_per_team (team_id, user_id) exists on teaching_team_members.
--   * respond_to_team_invitation decline branch SETs status='declined' (it does NOT delete the row).
--       => A declined row physically survives carrying (team_id, user_id), so a fresh INSERT
--          on re-invite collides with unique_member_per_team (23505). Path 6b is fixed in the
--          frontend (inviteMember UPDATE-reuses the surviving row) -- no DDL here.
--
-- THIS MIGRATION DOES TWO THINGS:
--   4a. leave_teaching_team() SECURITY DEFINER resolver -- a member deletes their OWN accepted
--       membership row past RLS (teaching_team_members has SELECT-own and UPDATE-own for members
--       but NO DELETE-own policy; the previous raw client DELETE matched no policy -> silent
--       0-row no-op -- the FACT B bug from the Session 1 diagnosis).
--   4d. Re-grant the 5 teaching_teams / teaching_team_members policies from role {public}
--       to {authenticated}. Authorization quals are UNCHANGED; only the role binding tightens
--       so anon can never reach these tables directly. SECURITY DEFINER resolvers and
--       service_role both bypass RLS, so the resolvers are unaffected.
--
-- Posture mirrors the other Teaching Team resolvers: SECURITY DEFINER, fixed search_path
-- (public, auth), all objects schema-qualified, EXECUTE revoked from PUBLIC/anon and granted
-- to authenticated only.

BEGIN;

-- ============================================================================
-- 4a. leave_teaching_team() -- member self-removes their accepted membership row
-- ============================================================================
-- Security boundary: the DELETE predicate (user_id = auth.uid() AND status = 'accepted')
-- is the authorization gate -- a caller can only remove their OWN accepted membership.
-- Returns the affected team_id, or NULL when nothing matched (already left, only a
-- pending invite, or not a member) so the caller treats it as a benign no-op.
CREATE OR REPLACE FUNCTION public.leave_teaching_team()
RETURNS uuid
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
DECLARE
  v_team_id uuid;
BEGIN
  DELETE FROM public.teaching_team_members AS tm
  WHERE tm.user_id = auth.uid()
    AND tm.status = 'accepted'
  RETURNING tm.team_id INTO v_team_id;

  RETURN v_team_id;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.leave_teaching_team() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leave_teaching_team() FROM anon;
GRANT  EXECUTE ON FUNCTION public.leave_teaching_team() TO authenticated;

-- ============================================================================
-- 4c. FK ON DELETE CASCADE -- confirmed live (confdeltype 'c' on both FKs). No DDL needed.
-- ============================================================================

-- ============================================================================
-- 4d. Re-grant team policies {public} -> {authenticated}. Quals unchanged.
-- ============================================================================
-- teaching_team_members --------------------------------------------------------
-- ALL policy: original WITH CHECK was null (Postgres defaults the check to the USING
-- expression for FOR ALL), so we recreate with USING only to preserve exact behavior.
DROP POLICY "Lead teacher can manage team members" ON public.teaching_team_members;
CREATE POLICY "Lead teacher can manage team members" ON public.teaching_team_members
  FOR ALL TO authenticated
  USING (is_team_lead_of(team_id));

DROP POLICY "Users can read own membership" ON public.teaching_team_members;
CREATE POLICY "Users can read own membership" ON public.teaching_team_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY "Users can update own membership" ON public.teaching_team_members;
CREATE POLICY "Users can update own membership" ON public.teaching_team_members
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- teaching_teams ---------------------------------------------------------------
DROP POLICY "Lead teacher can manage own team" ON public.teaching_teams;
CREATE POLICY "Lead teacher can manage own team" ON public.teaching_teams
  FOR ALL TO authenticated
  USING (lead_teacher_id = auth.uid());

DROP POLICY "Members can read their team" ON public.teaching_teams;
CREATE POLICY "Members can read their team" ON public.teaching_teams
  FOR SELECT TO authenticated
  USING (is_team_member_of(id));

COMMIT;