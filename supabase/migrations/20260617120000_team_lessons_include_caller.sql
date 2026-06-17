-- 20260617120000_team_lessons_include_caller.sql
-- Teaching Team -- Team Lessons view: include the caller's OWN shared lessons.
--
-- Change of behavior (2026-06-17):
--   The original get_team_lessons() (migration 20260616160000) deliberately
--   EXCLUDED the caller's own rows via `AND l.user_id <> auth.uid()`, on the
--   assumption that a teacher's own lessons are "already in their library".
--   Lynn's decision: the Team Lessons view should show the caller's own shared
--   lessons ALONGSIDE everyone else's, so the team sees one unified roster of
--   shared material -- the lead's contributions included.
--
-- What changed vs 20260616160000:
--   * REMOVED the WHERE condition `AND l.user_id <> auth.uid()`.
--
-- What is intentionally UNCHANGED:
--   * The peers CTE already includes the caller in BOTH roles -- as the lead
--     (peers selects lead_teacher_id, which equals auth.uid() for a lead) and
--     as an accepted member (the caller appears in the status='accepted' union).
--     So no addition to the peer set was required; the caller's user_id is
--     already present and the JOIN `pe.peer_id = l.user_id` now matches the
--     caller's own rows once the WHERE exclusion is gone.
--   * l.visibility = 'shared'  (only shared lessons surface)
--   * l.reshape_of IS NULL     (reshape children are never standalone cards)
--   * SECURITY DEFINER, STABLE, SET search_path = public, auth
--   * The RETURNS TABLE shape is identical (no column changes).
--   * REVOKE from PUBLIC/anon, GRANT to authenticated (unchanged posture).
--
-- Authorization boundary is unchanged: the peer set is still computed from the
--   caller's OWN single team (lead OR accepted member). A caller with no team
--   gets an empty peer set -> zero rows. No cross-team leakage is possible.

BEGIN;

-- ============================================================================
-- get_team_lessons() -- shared lessons from the caller's team peers, now
-- INCLUDING the caller's own shared lessons.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_team_lessons()
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
  WITH my_team AS (
    -- The single team the caller LEADS or is an ACCEPTED member of.
    -- (One team at a time per teacher; lead row preferred if both ever exist.)
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
    -- The team's lead (this is the caller themselves when the caller leads) ...
    SELECT mt.lead_teacher_id AS peer_id
    FROM my_team AS mt
    UNION
    -- ... plus every accepted member of that team (which includes the caller
    -- when the caller is an accepted member). The caller's own user_id is
    -- therefore always present in this set -- so their own shared lessons now
    -- match the JOIN below and surface in the Team Lessons view.
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
    l.visibility::text                  AS visibility,
    l.created_at                        AS created_at,
    p.full_name                         AS author_name
  FROM public.lessons AS l
  JOIN peers AS pe ON pe.peer_id = l.user_id
  LEFT JOIN public.profiles AS p ON p.id = l.user_id
  WHERE l.visibility = 'shared'
    AND l.reshape_of IS NULL
  ORDER BY l.created_at DESC;
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_team_lessons() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_team_lessons() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_team_lessons() TO authenticated;

COMMIT;
