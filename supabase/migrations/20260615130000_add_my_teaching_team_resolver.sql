-- 20260615130000_add_my_teaching_team_resolver.sql
-- Purpose: Fix the "Error loading team data" toast for non-lead Teaching Team
--          members/invitees, AND let pending invitees load the roster.
--
-- Root cause (verified 2026-06-15, code-derived):
--   teaching_teams SELECT is RLS-restricted to the lead teacher
--   (lead_teacher_id = auth.uid()). A non-lead member/invitee's dashboard
--   resolves its team via raw client reads
--   .from('teaching_teams').select('*').eq('id', team_id).single() in
--   useTeachingTeam.tsx fetchTeamData (accepted path ~122-129, pending path
--   ~152-158). RLS zero-filters those rows, .single() raises PGRST116, the
--   fetchTeamData catch fires -> "Error loading team data" toast. (The
--   get_teaching_team_members RPC is NOT the toast source -- fetchMembers
--   swallows its own errors and never rethrows.)
--
-- Fix (SECURITY DEFINER resolver, NOT a teaching_teams RLS SELECT policy --
--   a policy that EXISTS-checks teaching_team_members, whose own policies
--   reference teaching_teams.lead_teacher_id, risks 42P17 mutual recursion):
--
--   1. get_my_teaching_team() -- returns the caller's single team (the one they
--      LEAD, or are a pending/accepted MEMBER of) past RLS, with the lead's
--      full name. Replaces the RLS-blocked teaching_teams reads in fetchTeamData.
--   2. get_teaching_team_members(p_team_id) -- widen the authorization gate so
--      ANY membership row (pending OR accepted), not only accepted, can load the
--      roster. A pending invitee is a legitimate roster member.
--
-- Security: mirrors find_teaching_team_invitee / get_teaching_team_members
--   posture -- SECURITY DEFINER, fixed search_path (public, auth), all objects
--   schema-qualified, EXECUTE revoked from PUBLIC/anon and granted to
--   authenticated only.

BEGIN;

-- ============================================================================
-- 1. get_my_teaching_team() -- resolve the caller's team past teaching_teams RLS
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_my_teaching_team()
RETURNS TABLE (
  team_id         uuid,
  team_name       text,
  lead_teacher_id uuid,
  lead_full_name  text,
  my_status       text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
  SELECT
    q.team_id,
    q.team_name,
    q.lead_teacher_id,
    q.lead_full_name,
    q.my_status
  FROM (
    -- The team the caller LEADS
    SELECT
      t.id              AS team_id,
      t.name            AS team_name,
      t.lead_teacher_id AS lead_teacher_id,
      lp.full_name      AS lead_full_name,
      'lead'::text      AS my_status,
      0                 AS sort_rank,
      NULL::timestamptz AS invited_at
    FROM public.teaching_teams AS t
    LEFT JOIN public.profiles AS lp ON lp.id = t.lead_teacher_id
    WHERE t.lead_teacher_id = auth.uid()

    UNION ALL

    -- The team the caller is a MEMBER of (pending or accepted; declined ignored)
    SELECT
      t.id              AS team_id,
      t.name            AS team_name,
      t.lead_teacher_id AS lead_teacher_id,
      lp.full_name      AS lead_full_name,
      tm.status::text   AS my_status,
      CASE WHEN tm.status = 'accepted' THEN 1 ELSE 2 END AS sort_rank,
      tm.invited_at     AS invited_at
    FROM public.teaching_team_members AS tm
    JOIN public.teaching_teams AS t ON t.id = tm.team_id
    LEFT JOIN public.profiles AS lp ON lp.id = t.lead_teacher_id
    WHERE tm.user_id = auth.uid()
      AND tm.status IN ('pending', 'accepted')
  ) AS q
  ORDER BY q.sort_rank ASC, q.invited_at DESC NULLS LAST
  LIMIT 1;
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_my_teaching_team() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_my_teaching_team() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_my_teaching_team() TO authenticated;

-- ============================================================================
-- 2. get_teaching_team_members(p_team_id) -- widen guard to ANY membership row
--    (pending OR accepted). Body unchanged from migration 20260615120000 except
--    the authorization gate drops the status = 'accepted' restriction.
-- ============================================================================
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
      -- ... OR holds ANY membership row on this team (pending OR accepted).
      OR EXISTS (
        SELECT 1
        FROM public.teaching_team_members AS me
        WHERE me.team_id = p_team_id
          AND me.user_id = auth.uid()
      )
    );
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_teaching_team_members(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_teaching_team_members(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_teaching_team_members(uuid) TO authenticated;

COMMIT;