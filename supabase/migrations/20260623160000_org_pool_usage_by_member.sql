-- 20260623160000_org_pool_usage_by_member.sql
-- Shepherding B5 -- leader pool-monitoring. Lynn's requirement: the Shepherd
-- group leader must be able to monitor each member's use of the shared pool.
--
-- The data already exists on lessons rows (user_id + organization_id +
-- org_pool_consumed + created_at). This SECURITY DEFINER resolver aggregates it
-- per member for the caller's org -- but ONLY for a LEADER (leader / co-leader /
-- legacy 'owner'). A non-leader caller's my_org CTE is empty, so the function
-- returns zero rows: members cannot see the roster's usage, no cross-org leakage.
--
-- "This period" = draws since the org's 30-day rolling pool window started
-- (organizations.pool_period_start); "total" = all-time pool draws. Every member
-- of the org is returned (LEFT JOIN), including those with zero draws.
--
-- Same posture as the other org/team resolvers: SECURITY DEFINER, STABLE, fixed
-- search_path, schema-qualified, EXECUTE granted to authenticated only.

BEGIN;

CREATE OR REPLACE FUNCTION public.get_org_pool_usage()
RETURNS TABLE (
  user_id                  uuid,
  full_name                text,
  pool_lessons_this_period bigint,
  pool_lessons_total       bigint,
  last_pool_lesson_at      timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $fn$
  WITH my_org AS (
    -- Caller's org -- ONLY resolves for a leader/co-leader/owner.
    SELECT p.organization_id AS org_id, o.pool_period_start
    FROM public.profiles AS p
    JOIN public.organizations AS o ON o.id = p.organization_id
    WHERE p.id = auth.uid()
      AND p.organization_id IS NOT NULL
      AND p.organization_role IN ('leader', 'co-leader', 'owner')
  )
  SELECT
    m.id        AS user_id,
    m.full_name AS full_name,
    COUNT(l.id) FILTER (
      WHERE l.org_pool_consumed = true
        AND (mo.pool_period_start IS NULL OR l.created_at >= mo.pool_period_start)
    )::bigint AS pool_lessons_this_period,
    COUNT(l.id) FILTER (WHERE l.org_pool_consumed = true)::bigint AS pool_lessons_total,
    MAX(l.created_at) FILTER (WHERE l.org_pool_consumed = true)   AS last_pool_lesson_at
  FROM my_org AS mo
  JOIN public.profiles AS m ON m.organization_id = mo.org_id
  LEFT JOIN public.lessons AS l
    ON l.user_id = m.id AND l.organization_id = mo.org_id
  GROUP BY m.id, m.full_name, mo.pool_period_start
  ORDER BY pool_lessons_this_period DESC, m.full_name ASC;
$fn$;

REVOKE EXECUTE ON FUNCTION public.get_org_pool_usage() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_org_pool_usage() FROM anon;
GRANT  EXECUTE ON FUNCTION public.get_org_pool_usage() TO authenticated;

COMMIT;
