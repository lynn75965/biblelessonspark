-- 20260616160000_add_team_lessons_resolvers.sql
-- Teaching Team lock-down SESSION 2 of 3 -- the VIEW path (findings paths 2, 3, 5).
--
-- Root cause (live RLS read 2026-06-16, recorded in PROJECT_MASTER):
--   FACT A: the lessons table has NO policy that lets any user SELECT another
--           user's row (only users_select_own = user_id = auth.uid() + admin
--           policies). So the client read in fetchTeamLessons zero-filters to
--           0 rows for BOTH lead and member -> the entire "Team Lessons" view
--           and the single team-lesson read are blocked.
--   FACT C: a member's client read of teaching_team_members returns ONLY their
--           own row (SELECT is user_id = auth.uid(); no co-member read policy),
--           so the member-side roster undercounts to just themselves.
--
-- Fix: three SECURITY DEFINER resolvers that read past RLS and compute the
--      caller's team + accepted peers server-side. Same posture as the four
--      existing Teaching Team resolvers (find_teaching_team_invitee,
--      get_teaching_team_members, get_my_teaching_team, respond_to_team_invitation):
--      SECURITY DEFINER, STABLE, fixed search_path (public, auth), all objects
--      schema-qualified, EXECUTE revoked from PUBLIC/anon and granted to
--      authenticated only.
--
--   1. get_team_lessons()            -- shared lessons of the caller's team peers
--                                       (lead + accepted members), excluding the
--                                       caller. Lightweight list shape. (path 2)
--   2. get_team_lesson(p_lesson_id)  -- a single shared+same-team lesson with the
--                                       full content the viewer renders. (path 3)
--   3. get_teaching_team_members(p_team_id) -- DROP + CREATE to ADD id + team_id
--                                       to the return shape so the member roster
--                                       can be sourced entirely from this resolver
--                                       instead of the RLS-filtered client read. (path 5)
--
-- Authorization boundary (all three): the peer set is computed from the caller's
--   OWN team membership, so a caller with no team gets an empty peer set -> zero
--   rows. No cross-team leakage is possible.
--
-- NOT in this migration (Session 3): leave_teaching_team / member self-DELETE,
--   the {public} -> {authenticated} re-grant, FK CASCADE, re-invite handling.

BEGIN;

-- ============================================================================
-- 1. get_team_lessons() -- list of shared lessons from the caller's team peers
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
    -- The team's lead ...
    SELECT mt.lead_teacher_id AS peer_id
    FROM my_team AS mt
    UNION
    -- ... plus every accepted member of that team.
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
    AND l.user_id <> auth.uid()
  ORDER BY l.created_at DESC;
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_team_lessons() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_team_lessons() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_team_lessons() TO authenticated;

-- ============================================================================
-- 2. get_team_lesson(p_lesson_id) -- one shared+same-team lesson, full content
--    Same peer computation. Returns the get_team_lessons shape PLUS the content
--    fields the viewer (EnhanceLessonForm) renders: original_text, filters,
--    metadata. The read-only guard suppresses every owner-mutation control, so
--    no other lesson columns are needed by the team-lesson viewer.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_team_lesson(p_lesson_id uuid)
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
    l.visibility::text                  AS visibility,
    l.created_at                        AS created_at,
    p.full_name                         AS author_name,
    l.original_text                     AS original_text,
    l.filters                           AS filters,
    l.metadata                          AS metadata
  FROM public.lessons AS l
  JOIN peers AS pe ON pe.peer_id = l.user_id
  LEFT JOIN public.profiles AS p ON p.id = l.user_id
  WHERE l.id = p_lesson_id
    AND l.visibility = 'shared'
    AND l.user_id <> auth.uid();
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_team_lesson(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_team_lesson(uuid) FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_team_lesson(uuid) TO authenticated;

-- ============================================================================
-- 3. get_teaching_team_members(p_team_id) -- ADD id + team_id to the return
--    shape (path 5). Changing the RETURNS TABLE columns requires DROP + CREATE.
--    Body and authorization gate are otherwise identical to migration
--    20260615130000 (caller is the team's lead OR holds ANY membership row).
--    With id + team_id present, useTeachingTeam.fetchMembers can build the full
--    TeachingTeamMember roster from this resolver alone -- removing the
--    RLS-filtered client read that undercounted the roster for members.
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_teaching_team_members(uuid);

CREATE FUNCTION public.get_teaching_team_members(p_team_id uuid)
RETURNS TABLE (
  id           uuid,
  team_id      uuid,
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
    tm.id           AS id,
    tm.team_id      AS team_id,
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
