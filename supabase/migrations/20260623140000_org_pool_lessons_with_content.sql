-- 20260623140000_org_pool_lessons_with_content.sql
-- Shepherding B2 follow-up: the member Shepherding page needs the same per-lesson
-- actions as the Library (view / copy / download / email -- NO edit). Those
-- actions (LessonExportButtons) need the full lesson content, so the list
-- resolver now returns original_text + metadata directly. The single-lesson
-- resolver get_org_pool_lesson is therefore redundant and is dropped.
--
-- Changing the RETURNS TABLE shape requires DROP + CREATE (CREATE OR REPLACE
-- cannot alter the return signature). Same posture as before: SECURITY DEFINER,
-- STABLE, fixed search_path, schema-qualified, EXECUTE granted to authenticated
-- only, scoped strictly to the caller's own organization.

BEGIN;

DROP FUNCTION IF EXISTS public.get_org_pool_lesson(uuid);
DROP FUNCTION IF EXISTS public.get_org_pool_lessons();

CREATE FUNCTION public.get_org_pool_lessons()
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
  JOIN my_org AS mo ON mo.org_id = l.organization_id
  LEFT JOIN public.profiles AS p ON p.id = l.user_id
  WHERE l.org_pool_consumed = true
  ORDER BY l.created_at DESC;
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_org_pool_lessons() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_org_pool_lessons() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_org_pool_lessons() TO authenticated;

COMMIT;
