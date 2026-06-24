-- ============================================================================
-- Share reshapes with the Teaching Team (parity with the Shepherd group)
-- ----------------------------------------------------------------------------
-- Stage C wired per-group sharing (shared_with_team / shared_with_org) onto every
-- lessons row, INCLUDING reshape rows -- a reshape inherits its parent's two
-- flags at creation and the author can change them independently.
--
-- The Shepherd resolver (get_org_pool_lessons) already surfaces reshapes: it has
-- no reshape_of guard. The Team list resolver (get_team_lessons) did NOT -- it
-- carried `AND l.reshape_of IS NULL`, so a team-shared reshape never reached a
-- teammate. That is the ONLY thing this migration changes: it removes that one
-- predicate so a reshape the author chose to share with the Team is listed for
-- the Team, exactly the way the Shepherd group already sees its shared reshapes.
--
-- Everything else is identical to migration 20260624140000:
--   * RETURNS shape unchanged (CREATE OR REPLACE, no DROP) -- no types.ts edit.
--   * `visibility` still DERIVED as the constant 'shared'.
--   * The single-lesson view RPC (get_team_lesson) already has no reshape guard,
--     so opening a team reshape body already works -- it needs no change.
-- ============================================================================

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
  ORDER BY l.created_at DESC;
$function$;
