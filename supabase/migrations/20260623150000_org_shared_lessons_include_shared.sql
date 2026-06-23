-- 20260623150000_org_shared_lessons_include_shared.sql
-- Shepherding B4 follow-up: the group's "Shepherd Lessons" view must include BOTH
--   (a) pool-funded lessons (org_pool_consumed = true)  -- Option B, automatic
--   (b) PERSONAL lessons a member has SHARED (visibility = 'shared')
-- Previously get_org_pool_lessons keyed on lessons.organization_id, which a
-- shared personal lesson never carries (its organization_id is NULL -- only
-- pool-funded lessons get tagged). So sharing a personal lesson never surfaced
-- it to the group.
--
-- Fix: key on the AUTHOR'S org membership (profiles.organization_id), exactly
-- like get_team_lessons keys on team peers, then return pool-funded OR shared
-- lessons by any member of the caller's own org. Return shape is unchanged, so
-- CREATE OR REPLACE is sufficient (no DROP). Still SECURITY DEFINER, STABLE,
-- scoped strictly to the caller's own org -- no cross-org leakage.
--
-- (Sharing a personal lesson does NOT consume the pool; the pool is the
-- generation budget. This only affects group VISIBILITY. Per-group share targets
-- -- Team vs Shepherd independently -- arrive in Stage C; today a shared lesson
-- shows in every group the author belongs to, which matches Lynn's spec.)

BEGIN;

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
  author_name      text,
  original_text    text,
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
  ),
  org_member AS (
    -- Every member of the caller's organization (the author set).
    SELECT p.id AS member_id
    FROM public.profiles AS p
    JOIN my_org AS mo ON mo.org_id = p.organization_id
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
    l.metadata                          AS metadata
  FROM public.lessons AS l
  JOIN org_member AS om ON om.member_id = l.user_id
  LEFT JOIN public.profiles AS p ON p.id = l.user_id
  WHERE l.org_pool_consumed = true
     OR l.visibility = 'shared'
  ORDER BY l.created_at DESC;
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_org_pool_lessons() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_org_pool_lessons() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_org_pool_lessons() TO authenticated;

COMMIT;
