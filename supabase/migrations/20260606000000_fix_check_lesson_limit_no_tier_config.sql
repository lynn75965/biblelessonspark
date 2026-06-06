-- 20260606000000_fix_check_lesson_limit_no_tier_config.sql
-- FIX (Rule #17 / Architecture Principle #2 -- Frontend Drives Backend):
-- Replace every tier_config table query inside check_lesson_limit() with
-- hardcoded constants that mirror src/constants/pricingConfig.ts (and its
-- hand-maintained _shared/ copy) exactly. The RPC must never read tier_config.
--
-- WHAT CHANGED (data source only -- gating logic, signature, and return shape
-- are byte-identical to the prior live definition):
--   * lessons_limit: admin 9999, free 5            (was tier_config rows)
--   * sections_allowed: free [1,5,8], all others [1-8]  (was tier_config.sections_allowed)
--   * includes_teaser: free FALSE, all others TRUE      (was tier_config.includes_teaser)
--   * reset interval: INTERVAL '30 days' everywhere      (was tier_config.reset_interval / '1 month';
--     now consistent with the 2026-06-05 stripe-webhook reset_date fix)
--
-- Constant values verified 2026-06-06 against the live tier_config rows
-- (admin/free/personal) AND TIER_LESSON_LIMITS / TIER_SECTIONS in
-- _shared/pricingConfig.ts (which is identical to src/ -- no drift).
-- Return shape preserved exactly: all 9 columns, same names, same types
-- (consumed in full by src/hooks/useSubscription.tsx).
--
-- CREATE OR REPLACE is idempotent: re-running this migration is harmless.

BEGIN;

CREATE OR REPLACE FUNCTION public.check_lesson_limit(p_user_id uuid)
 RETURNS TABLE(
   can_generate boolean,
   lessons_used integer,
   lessons_limit integer,
   tier text,
   sections_allowed integer[],
   includes_teaser boolean,
   reset_date timestamp with time zone,
   upgrade_needed boolean,
   billing_interval text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin BOOLEAN := FALSE;
  v_subscription RECORD;
BEGIN
  -- Admin bypass (unchanged): check user_roles for the 'admin' role.
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role = 'admin'
  ) INTO v_is_admin;

  -- Admin gets unlimited config. SSOT: hardcoded (was the legacy config-table
  -- 'admin' row: lessons_limit 9999, sections [1-8], includes_teaser TRUE).
  IF v_is_admin THEN
    RETURN QUERY SELECT
      TRUE::BOOLEAN,
      0::INTEGER,
      9999::INTEGER,
      'admin'::TEXT,
      ARRAY[1, 2, 3, 4, 5, 6, 7, 8]::INTEGER[],
      TRUE::BOOLEAN,
      NULL::TIMESTAMPTZ,
      FALSE::BOOLEAN,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Get subscription for non-admin users.
  SELECT * INTO v_subscription
  FROM user_subscriptions
  WHERE user_id = p_user_id;

  -- No subscription record: create a default free row.
  -- SSOT: free lessons_limit = 5 (pricingConfig TIER_LESSON_LIMITS.free);
  -- reset interval = 30 days (was the legacy config-table reset interval).
  IF v_subscription IS NULL THEN
    INSERT INTO user_subscriptions (user_id, tier, lessons_limit, lessons_used, reset_date)
    VALUES (p_user_id, 'free', 5, 0, NOW() + INTERVAL '30 days')
    ON CONFLICT (user_id) DO NOTHING
    RETURNING * INTO v_subscription;

    -- If INSERT did nothing due to conflict, fetch the existing record.
    IF v_subscription IS NULL THEN
      SELECT * INTO v_subscription
      FROM user_subscriptions
      WHERE user_id = p_user_id;
    END IF;
  END IF;

  -- Self-heal (unchanged logic): if past reset_date, zero usage and advance.
  -- Interval source only: now INTERVAL '30 days' (was the legacy config-table interval).
  IF v_subscription.reset_date IS NOT NULL AND v_subscription.reset_date < NOW() THEN
    UPDATE user_subscriptions
    SET lessons_used = 0,
        reset_date = NOW() + INTERVAL '30 days'
    WHERE user_id = p_user_id
    RETURNING * INTO v_subscription;
  END IF;

  -- Return subscription status. sections_allowed + includes_teaser are now
  -- derived from the tier via SSOT constants (was a legacy config-table lookup).
  RETURN QUERY SELECT
    (v_subscription.lessons_used < v_subscription.lessons_limit)::BOOLEAN,
    v_subscription.lessons_used::INTEGER,
    v_subscription.lessons_limit::INTEGER,
    v_subscription.tier::TEXT,
    (CASE v_subscription.tier
       WHEN 'free'       THEN ARRAY[1, 5, 8]
       WHEN 'personal'   THEN ARRAY[1, 2, 3, 4, 5, 6, 7, 8]
       WHEN 'starter'    THEN ARRAY[1, 2, 3, 4, 5, 6, 7, 8]
       WHEN 'growth'     THEN ARRAY[1, 2, 3, 4, 5, 6, 7, 8]
       WHEN 'full'       THEN ARRAY[1, 2, 3, 4, 5, 6, 7, 8]
       WHEN 'enterprise' THEN ARRAY[1, 2, 3, 4, 5, 6, 7, 8]
       ELSE ARRAY[1, 5, 8]  -- fail-safe to free sections for any unknown tier
     END)::INTEGER[],
    (v_subscription.tier <> 'free')::BOOLEAN,
    v_subscription.reset_date::TIMESTAMPTZ,
    (v_subscription.lessons_used >= v_subscription.lessons_limit)::BOOLEAN,
    v_subscription.billing_interval::TEXT;
END;
$function$;

COMMIT;
