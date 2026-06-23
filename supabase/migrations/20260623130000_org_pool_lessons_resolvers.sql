-- 20260623130000_org_pool_lessons_resolvers.sql
-- Shepherding B2 -- member access to the group's pool-funded lessons (Option B:
-- pool-funded lessons are group-visible).
--
-- Root cause (live RLS read 2026-06-23): the lessons table has NO policy that
-- lets a user SELECT another user's row (only users_select_own = user_id =
-- auth.uid() + the admin policy). So a member's client read of the group's
-- lessons zero-filters to their own rows. Same FACT A that blocked Team Lessons.
--
-- Fix: two SECURITY DEFINER resolvers, identical posture to the Teaching Team
-- resolvers (get_team_lessons / get_team_lesson, migration 20260616160000):
-- SECURITY DEFINER, STABLE, fixed search_path (public, auth), schema-qualified,
-- EXECUTE revoked from PUBLIC/anon and granted to authenticated only.
--
--   1. get_org_pool_lessons()           -- list of the caller's org's pool-funded
--                                          lessons (org_pool_consumed = true).
--   2. get_org_pool_lesson(p_lesson_id) -- one such lesson with full content for
--                                          the read-only viewer.
--
-- Authorization boundary (both): the org is computed from the CALLER'S OWN
-- profile.organization_id, so a caller with no org gets zero rows and no
-- cross-org leakage is possible. A caller only ever sees their own org's pool.
--
-- NOTE: this returns pool-funded lessons regardless of the visibility flag --
-- the group paid for them, so they are group-visible (Lynn's Option B). The
-- per-lesson lock/share popup for PERSONAL lessons arrives in Stage C and will
-- layer onto, not replace, this resolver.

BEGIN;

-- ============================================================================
-- 1. get_org_pool_lessons() -- list of the caller's org pool-funded lessons
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_org_pool_lessons()
RETURNS TABLE (
  lesson_id        uuid,
  user_id          uuid,
  title            text,
  bible_passage    text,
  age_group        text,
  theology_profile text,
  visibility       text,
  created_at       timestamptz,
  author_name      text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
  WITH my_org AS (
    SELECT organization_id AS org_id
    FROM public.profiles
    WHERE id = auth.uid()
      AND organization_id IS NOT NULL
  )
  SELECT
    l.id                                AS lesson_id,
    l.user_id                           AS user_id,
    l.title                             AS title,
    (l.filters->>'bible_passage')       AS bible_passage,
    (l.filters->>'age_group')           AS age_group,
    (l.filters->>'theology_profile_id') AS theology_profile,
    l.visibility::text                  AS visibility,
    l.created_at                        AS created_at,
    p.full_name                         AS author_name
  FROM public.lessons AS l
  JOIN my_org AS mo ON mo.org_id = l.organization_id
  LEFT JOIN public.profiles AS p ON p.id = l.user_id
  WHERE l.org_pool_consumed = true
  ORDER BY l.created_at DESC;
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_org_pool_lessons() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_org_pool_lessons() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_org_pool_lessons() TO authenticated;

-- ============================================================================
-- 2. get_org_pool_lesson(p_lesson_id) -- one pool-funded lesson, full content
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_org_pool_lesson(p_lesson_id uuid)
RETURNS TABLE (
  lesson_id        uuid,
  user_id          uuid,
  title            text,
  bible_passage    text,
  age_group        text,
  theology_profile text,
  visibility       text,
  created_at       timestamptz,
  author_name      text,
  original_text    text,
  filters          jsonb,
  metadata         jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
  WITH my_org AS (
    SELECT organization_id AS org_id
    FROM public.profiles
    WHERE id = auth.uid()
      AND organization_id IS NOT NULL
  )
  SELECT
    l.id                                AS lesson_id,
    l.user_id                           AS user_id,
    l.title                             AS title,
    (l.filters->>'bible_passage')       AS bible_passage,
    (l.filters->>'age_group')           AS age_group,
    (l.filters->>'theology_profile_id') AS theology_profile,
    l.visibility::text                  AS visibility,
    l.created_at                        AS created_at,
    p.full_name                         AS author_name,
    l.original_text                     AS original_text,
    l.filters                           AS filters,
    l.metadata                          AS metadata
  FROM public.lessons AS l
  JOIN my_org AS mo ON mo.org_id = l.organization_id
  LEFT JOIN public.profiles AS p ON p.id = l.user_id
  WHERE l.id = p_lesson_id
    AND l.org_pool_consumed = true;
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_org_pool_lesson(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_org_pool_lesson(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_org_pool_lesson(uuid) TO authenticated;

COMMIT;
