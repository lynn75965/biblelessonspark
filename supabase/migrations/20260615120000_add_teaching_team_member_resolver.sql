-- 20260615120000_add_teaching_team_member_resolver.sql
-- Purpose: Fix the Teaching Team member-list rendering "Unknown" bug for
--          non-admin Lead Teachers (and accepted members).
--
-- Root cause (verified 2026-06-15): the member-list render path resolves each
--          member's display name via a client-side read
--          .from('profiles').select('id, full_name, email').in('id', memberIds)
--          in useTeachingTeam.tsx fetchMembers(). That SELECT is subject to the
--          profiles RLS policy `profiles_org_admin_view_all`, which only lets a
--          session read a profile row when is_admin(), id = auth.uid(), or the
--          viewer is admin/owner over the invitee's organization. A non-admin
--          Lead Teacher viewing an unaffiliated invitee matches none of these,
--          so profiles returns zero rows (RLS filters silently; no error) and
--          the row falls back to "Unknown". This is the same RLS class as the
--          2026-06-14 invite bug, but on the list-render path rather than the
--          invite-time lookup.
--
-- Fix:     A SECURITY DEFINER resolver that reads the team roster past RLS:
--          teaching_team_members joined to profiles (full_name) and the email
--          SSOT auth.users (email). An authorization gate inside the function
--          returns rows ONLY when auth.uid() is the team's lead teacher or an
--          accepted member of the team; unauthorized callers get zero rows
--          (no error, no leak). Returns name + email for the team's own roster,
--          which the Lead Teacher already supplied at invite time.
--
-- Security: mirrors find_teaching_team_invitee (Migration 20260614120000).
--   - SECURITY DEFINER with a fixed search_path (public, auth) so the function
--     cannot be hijacked via a caller-controlled search_path, and so it can
--     read auth.users. All objects are schema-qualified.
--   - EXECUTE granted to authenticated only; revoked from PUBLIC and anon,
--     consistent with the 2026-05-31/06-03 security audit (Migrations 2/3).

BEGIN;

CREATE OR REPLACE FUNCTION public.get_teaching_team_members(p_team_id uuid)
RETURNS TABLE (
  user_id      uuid,
  full_name    text,
  email        text,
  status       text,
  invited_at   timestamptz,
  responded_at timestamptz,
  expires_at   timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
  SELECT
    tm.user_id      AS user_id,
    p.full_name     AS full_name,
    u.email::text   AS email,
    tm.status::text AS status,
    tm.invited_at   AS invited_at,
    tm.responded_at AS responded_at,
    tm.expires_at   AS expires_at
  FROM public.teaching_team_members AS tm
  JOIN public.profiles AS p ON p.id = tm.user_id
  JOIN auth.users      AS u ON u.id = tm.user_id
  WHERE tm.team_id = p_team_id
    AND (
      -- Authorization gate: caller is the team's lead teacher ...
      EXISTS (
        SELECT 1
        FROM public.teaching_teams AS t
        WHERE t.id = p_team_id
          AND t.lead_teacher_id = auth.uid()
      )
      -- ... OR an accepted member of this team.
      OR EXISTS (
        SELECT 1
        FROM public.teaching_team_members AS me
        WHERE me.team_id = p_team_id
          AND me.user_id = auth.uid()
          AND me.status = 'accepted'
      )
    );
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_teaching_team_members(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_teaching_team_members(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_teaching_team_members(uuid) TO authenticated;

COMMIT;