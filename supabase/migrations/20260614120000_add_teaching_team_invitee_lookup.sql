-- 20260614120000_add_teaching_team_invitee_lookup.sql
-- Purpose: Fix the Teaching Team invite "No BibleLessonSpark account found"
--          bug for non-admin Lead Teachers.
--
-- Root cause (verified 2026-06-14): NOT a missing email value. profiles.email
--          is populated (confirmed for the test invitee, lowercase, exact
--          match, verified). The real cause is the profiles RLS SELECT policy
--          `profiles_org_admin_view_all`, which only lets a session read a
--          profile row when is_admin(), id = auth.uid(), or the viewer is an
--          admin/owner over the invitee's organization. A non-admin Lead
--          Teacher inviting an individual teacher matches none of these, so
--          the frontend lookup .from('profiles').eq('email', ...) returned
--          zero rows (RLS filters silently; no error) -> "No account found".
--
-- Fix:     A SECURITY DEFINER resolver that reads the email SSOT
--          (auth.users.email) joined to profiles for full_name, bypassing RLS,
--          and returns ONLY { id, full_name } -- no email, tier, or other PII.
--
-- Security:
--   - SECURITY DEFINER with a fixed search_path (public, auth) so the function
--     cannot be hijacked via a caller-controlled search_path, and so it can
--     read auth.users. All objects are additionally schema-qualified.
--   - EXECUTE granted to authenticated only; revoked from PUBLIC and anon,
--     consistent with the 2026-05-31/06-03 security audit (Migrations 2/3).
--   - Returns at most one row: exact normalized (lower(trim())) email match,
--     LIMIT 1 with a deterministic ORDER BY. auth.users enforces email
--     uniqueness for verified accounts, so more than one match is not
--     expected; the LIMIT makes the result deterministic if it ever occurs
--     (earliest-created account wins).

BEGIN;

CREATE OR REPLACE FUNCTION public.find_teaching_team_invitee(p_email text)
RETURNS TABLE (id uuid, full_name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
  SELECT u.id AS id, p.full_name AS full_name
  FROM auth.users AS u
  JOIN public.profiles AS p ON p.id = u.id
  WHERE lower(trim(u.email)) = lower(trim(p_email))
  ORDER BY u.created_at ASC
  LIMIT 1;
$fn$;

REVOKE EXECUTE ON FUNCTION public.find_teaching_team_invitee(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.find_teaching_team_invitee(text) FROM anon;
GRANT  EXECUTE ON FUNCTION public.find_teaching_team_invitee(text) TO authenticated;

COMMIT;
