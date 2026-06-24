-- ============================================================================
-- STAGE C: per-group lesson sharing (Team and Shepherd independently)
-- ----------------------------------------------------------------------------
-- Replaces the single conflated lessons.visibility ('private'|'shared') flag --
-- which made a "shared" lesson appear to BOTH the author's Team AND their
-- Shepherd org at once -- with two independent booleans:
--     shared_with_team  -> surfaces via get_team_lessons / get_team_lesson
--     shared_with_org   -> surfaces via get_org_pool_lessons
--
-- The old `visibility` column is KEPT (frozen, no longer read or written) and
-- will be dropped in a follow-up migration after production verification, so a
-- missed reader degrades gracefully instead of crashing.
--
-- Backfill (preserves exactly what is visible today):
--   visibility = 'shared'      -> BOTH flags true (today 'shared' = both groups)
--   org_pool_consumed = true   -> shared_with_org true (Option B: pool-funded
--                                 lessons are group content regardless of share)
--
-- Resolver rewrites: WHERE predicates move off `visibility` onto the new flags.
-- Return SHAPES are unchanged (CREATE OR REPLACE, no DROP). The returned
-- `visibility` column is now DERIVED as the constant 'shared' -- every row a
-- resolver returns is, by definition, shared to that group, and a lesson shared
-- only to one group must NOT leak its raw 'private'/'shared' value to the other.
-- ============================================================================

-- 1. COLUMNS ----------------------------------------------------------------
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS shared_with_team boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS shared_with_org  boolean NOT NULL DEFAULT false;

-- 2. BACKFILL ---------------------------------------------------------------
UPDATE public.lessons
  SET shared_with_team = true, shared_with_org = true
  WHERE visibility = 'shared';

UPDATE public.lessons
  SET shared_with_org = true
  WHERE org_pool_consumed = true;

-- 3. RESOLVERS --------------------------------------------------------------

-- get_team_lessons: list of the caller's team peers' team-shared lessons.
CREATE OR REPLACE FUNCTION public.get_team_lessons()
 RETURNS TABLE(lesson_id uuid, user_id uuid, title text, bible_passage text, age_group text, theology_profile text, visibility text, created_at timestamp with time zone, author_name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  WITH my_team AS (
    SELECT team_id, lead_teacher_id
    FROM (
      SELECT t.id AS team_id, t.lead_teacher_id, 0 AS rank
      FROM public.teaching_teams AS t
      WHERE t.lead_teacher_id = auth.uid()
      UNION ALL
      SELECT t.id AS team_id, t.lead_teacher_id, 1 AS rank
      FROM public.teaching_team_members AS tm
      JOIN public.teaching_teams AS t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'accepted'
    ) ranked
    ORDER BY rank
    LIMIT 1
  ),
  peers AS (
    SELECT mt.lead_teacher_id AS peer_id
    FROM my_team AS mt
    UNION
    SELECT tm.user_id AS peer_id
    FROM public.teaching_team_members AS tm
    JOIN my_team AS mt ON mt.team_id = tm.team_id
    WHERE tm.status = 'accepted'
  )
  SELECT
    l.id                                AS lesson_id,
    l.user_id                           AS user_id,
    l.title                             AS title,
    (l.filters->>'bible_passage')       AS bible_passage,
    (l.filters->>'age_group')           AS age_group,
    (l.filters->>'theology_profile_id') AS theology_profile,
    'shared'::text                      AS visibility,
    l.created_at                        AS created_at,
    p.full_name                         AS author_name
  FROM public.lessons AS l
  JOIN peers AS pe ON pe.peer_id = l.user_id
  LEFT JOIN public.profiles AS p ON p.id = l.user_id
  WHERE l.shared_with_team = true
    AND l.reshape_of IS NULL
  ORDER BY l.created_at DESC;
$function$;

-- get_team_lesson: single team-shared lesson body (for the read-only viewer).
CREATE OR REPLACE FUNCTION public.get_team_lesson(p_lesson_id uuid)
 RETURNS TABLE(lesson_id uuid, user_id uuid, title text, bible_passage text, age_group text, theology_profile text, visibility text, created_at timestamp with time zone, author_name text, original_text text, filters jsonb, metadata jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
  WITH my_team AS (
    SELECT team_id, lead_teacher_id
    FROM (
      SELECT t.id AS team_id, t.lead_teacher_id, 0 AS rank
      FROM public.teaching_teams AS t
      WHERE t.lead_teacher_id = auth.uid()
      UNION ALL
      SELECT t.id AS team_id, t.lead_teacher_id, 1 AS rank
      FROM public.teaching_team_members AS tm
      JOIN public.teaching_teams AS t ON t.id = tm.team_id
      WHERE tm.user_id = auth.uid()
        AND tm.status = 'accepted'
    ) ranked
    ORDER BY rank
    LIMIT 1
  ),
  peers AS (
    SELECT mt.lead_teacher_id AS peer_id
    FROM my_team AS mt
    UNION
    SELECT tm.user_id AS peer_id
    FROM public.teaching_team_members AS tm
    JOIN my_team AS mt ON mt.team_id = tm.team_id
    WHERE tm.status = 'accepted'
  )
  SELECT
    l.id                                AS lesson_id,
    l.user_id                           AS user_id,
    l.title                             AS title,
    (l.filters->>'bible_passage')       AS bible_passage,
    (l.filters->>'age_group')           AS age_group,
    (l.filters->>'theology_profile_id') AS theology_profile,
    'shared'::text                      AS visibility,
    l.created_at                        AS created_at,
    p.full_name                         AS author_name,
    l.original_text                     AS original_text,
    l.filters                           AS filters,
    l.metadata                          AS metadata
  FROM public.lessons AS l
  JOIN peers AS pe ON pe.peer_id = l.user_id
  LEFT JOIN public.profiles AS p ON p.id = l.user_id
  WHERE l.id = p_lesson_id
    AND l.shared_with_team = true
    AND l.user_id <> auth.uid();
$function$;

-- get_org_pool_lessons: org pool content -- pool-funded OR org-shared lessons
-- of any member of the caller's organization.
CREATE OR REPLACE FUNCTION public.get_org_pool_lessons()
 RETURNS TABLE(lesson_id uuid, user_id uuid, title text, bible_passage text, age_group text, theology_profile text, visibility text, created_at timestamp with time zone, author_name text, original_text text, metadata jsonb, org_pool_consumed boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth'
AS $function$
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
    'shared'::text                      AS visibility,
    l.created_at                        AS created_at,
    p.full_name                         AS author_name,
    l.original_text                     AS original_text,
    l.metadata                          AS metadata,
    COALESCE(l.org_pool_consumed, false) AS org_pool_consumed
  FROM public.lessons AS l
  JOIN org_member AS om ON om.member_id = l.user_id
  LEFT JOIN public.profiles AS p ON p.id = l.user_id
  WHERE l.org_pool_consumed = true
     OR l.shared_with_org = true
  ORDER BY l.created_at DESC;
$function$;
