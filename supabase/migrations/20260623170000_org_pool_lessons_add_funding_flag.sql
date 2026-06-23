-- 20260623170000_org_pool_lessons_add_funding_flag.sql
-- Shepherding B6 -- fix the leader "Org Lessons" panel (OrgLessonsPanel), which
-- read lessons via a direct client query that RLS limits to the caller's OWN
-- rows -- so a non-admin leader saw 0 of the members' lessons. The panel will
-- now read via get_org_pool_lessons (past RLS). It needs org_pool_consumed to
-- keep its funding badges and the "override" stat, so add that column here.
--
-- The resolver's set (org_pool_consumed = true OR visibility = 'shared') is
-- exactly what the org manager is allowed to see (shared lessons + org-funded
-- private lessons), so it drops in cleanly. Adding a return column requires
-- DROP + CREATE. Existing callers (Shepherd page B2, Library scope B3) ignore
-- the extra column. Same posture: SECURITY DEFINER, STABLE, caller's-org scoped.

BEGIN;

DROP FUNCTION IF EXISTS public.get_org_pool_lessons();

CREATE FUNCTION public.get_org_pool_lessons()
RETURNS TABLE (
  lesson_id         uuid,
  user_id           uuid,
  title             text,
  bible_passage     text,
  age_group         text,
  theology_profile  text,
  visibility        text,
  created_at        timestamptz,
  author_name       text,
  original_text     text,
  metadata          jsonb,
  org_pool_consumed boolean
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
    l.metadata                          AS metadata,
    COALESCE(l.org_pool_consumed, false) AS org_pool_consumed
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
