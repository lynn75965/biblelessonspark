-- =========================================================================
-- DRAFT MIGRATION 1 -- SECURITY DEFINER BODY HARDENING
-- DO NOT APPLY. This file lives at the repo root, NOT in supabase/migrations/.
-- Move it into supabase/migrations/ only after Lynn's explicit approval.
-- =========================================================================
--
-- WHAT
--   Replaces 13 SECURITY DEFINER function bodies to add an internal
--   admin / auth / role check at the top of each one. After this
--   migration, anon callers cannot mutate or read cross-user data via
--   the Data API even though the broad EXECUTE grant still exists.
--
-- WHY
--   The body diagnostic (DIAGNOSE_BODIES_security_definer_admin_rpcs.sql)
--   confirmed that 12 of 19 inspected functions had no internal admin or
--   auth check despite being callable by anon. See
--   SECURITY_ADVISOR_BODIES_FINDINGS.md for the per-function risk
--   summary. This migration closes those holes BEFORE any EXECUTE grant
--   is revoked, so the REVOKE migration (Migration 2) becomes pure
--   defense-in-depth instead of a behavior change.
--
-- SCOPE
--   This migration ONLY rewrites function bodies. It does NOT touch:
--     - EXECUTE grants (handled by Migration 2)
--     - RLS policies (handled by Migration 3)
--     - The three confirmed safe functions (get_all_users_for_admin,
--       get_all_users_with_stats, get_user_lessons_admin already gate
--       internally; left as-is)
--     - allocate_monthly_credits and cleanup_old_rate_limits, which are
--       presumed cron-driven and handled by Migration 2's REVOKE.
--
-- EVERY function below preserves its original signature, return shape,
-- search_path, and existing body. The only change is a guard clause
-- inserted at the top of BEGIN. If you diff against the body diagnostic
-- CSV from 2026-05-31 you should see ONLY the guard added.
--
-- ROLLBACK
--   This migration is BACKWARDS COMPATIBLE if rolled back: removing the
--   guard returns the function to its previous behavior. Roll back by
--   re-running the original CREATE OR REPLACE statements captured in the
--   2026-05-31 body diagnostic CSV.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- TIER 1: MUTATION FUNCTIONS -- admin-only or self-only
-- -------------------------------------------------------------------------

-- bulk_extend_trials -- admin-only
CREATE OR REPLACE FUNCTION public.bulk_extend_trials(
  p_new_expiration timestamp with time zone,
  p_extend_mode text DEFAULT 'active_only'::text
)
RETURNS TABLE(affected_count bigint, new_expiration timestamp with time zone)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count BIGINT;
BEGIN
  -- 2026-05-31 hardening: admin-only
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  IF p_extend_mode = 'active_only' THEN
    UPDATE profiles
    SET
      trial_full_lesson_granted_until = p_new_expiration,
      updated_at = NOW()
    WHERE trial_full_lesson_granted_until > NOW();
  ELSE
    UPDATE profiles
    SET
      trial_full_lesson_granted_until = p_new_expiration,
      updated_at = NOW();
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count, p_new_expiration;
END;
$function$;

-- bulk_revoke_trials -- admin-only
CREATE OR REPLACE FUNCTION public.bulk_revoke_trials()
RETURNS TABLE(affected_count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_count BIGINT;
BEGIN
  -- 2026-05-31 hardening: admin-only
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  UPDATE profiles
  SET
    trial_full_lesson_granted_until = NULL,
    updated_at = NOW()
  WHERE trial_full_lesson_granted_until IS NOT NULL
    AND trial_full_lesson_granted_until > NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN QUERY SELECT v_count;
END;
$function$;

-- increment_lesson_usage -- self OR admin OR service_role
CREATE OR REPLACE FUNCTION public.increment_lesson_usage(p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 2026-05-31 hardening: caller must be the user themselves, an admin,
  -- or the service_role (used by edge functions via service-key JWT).
  IF auth.role() <> 'service_role'
     AND (
       auth.uid() IS NULL
       OR (p_user_id <> auth.uid()
           AND NOT public.has_role(auth.uid(), 'admin'::app_role))
     )
  THEN
    RAISE EXCEPTION 'Access denied: cannot increment usage for another user';
  END IF;

  UPDATE user_subscriptions
  SET lessons_used = lessons_used + 1, updated_at = now()
  WHERE user_id = p_user_id;
  RETURN FOUND;
END;
$function$;

-- increment_devotional_usage -- self OR admin OR service_role
CREATE OR REPLACE FUNCTION public.increment_devotional_usage(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_period_start TIMESTAMPTZ;
  v_new_count INTEGER;
BEGIN
  -- 2026-05-31 hardening: caller must be self / admin / service_role.
  IF auth.role() <> 'service_role'
     AND (
       auth.uid() IS NULL
       OR (p_user_id <> auth.uid()
           AND NOT public.has_role(auth.uid(), 'admin'::app_role))
     )
  THEN
    RAISE EXCEPTION 'Access denied: cannot increment usage for another user';
  END IF;

  v_period_start := date_trunc('month', now());

  INSERT INTO public.devotional_usage (user_id, period_start, period_end, devotionals_generated)
  VALUES (p_user_id, v_period_start, v_period_start + interval '1 month', 1)
  ON CONFLICT (user_id, period_start)
  DO UPDATE SET
    devotionals_generated = devotional_usage.devotionals_generated + 1,
    updated_at = now()
  RETURNING devotionals_generated INTO v_new_count;

  RETURN v_new_count;
END;
$function$;

-- increment_parable_usage -- self OR admin OR service_role
CREATE OR REPLACE FUNCTION public.increment_parable_usage(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 2026-05-31 hardening: caller must be self / admin / service_role.
  IF auth.role() <> 'service_role'
     AND (
       auth.uid() IS NULL
       OR (p_user_id <> auth.uid()
           AND NOT public.has_role(auth.uid(), 'admin'::app_role))
     )
  THEN
    RAISE EXCEPTION 'Access denied: cannot increment usage for another user';
  END IF;

  INSERT INTO user_parable_usage (user_id, parables_this_month, updated_at)
  VALUES (p_user_id, 1, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    parables_this_month = user_parable_usage.parables_this_month + 1,
    updated_at = NOW();
END;
$function$;

-- log_security_event -- authenticated or service_role only
CREATE OR REPLACE FUNCTION public.log_security_event(
  event_type text,
  user_id uuid DEFAULT auth.uid(),
  metadata jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 2026-05-31 hardening: prevent anon callers from forging audit log
  -- entries. Triggers and service_role still permitted.
  IF auth.uid() IS NULL AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'Access denied: authentication required';
  END IF;

  BEGIN
    INSERT INTO public.events (event, user_id, meta, created_at)
    VALUES (
      'security_' || event_type,
      COALESCE(user_id, auth.uid()),
      metadata,
      now()
    );
  EXCEPTION WHEN undefined_table THEN
    NULL;
  END;
END;
$function$;

-- deduct_credits -- admin OR service_role only
CREATE OR REPLACE FUNCTION public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_reference_type text DEFAULT NULL::text,
  p_reference_id uuid DEFAULT NULL::uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  current_balance integer;
BEGIN
  -- 2026-05-31 hardening: only service_role (edge functions / cron) or
  -- an admin may deduct credits. Direct user calls are not permitted.
  IF auth.role() <> 'service_role'
     AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: service_role or admin required';
  END IF;

  current_balance := public.get_credits_balance(p_user_id);

  IF current_balance < p_amount THEN
    RETURN false;
  END IF;

  INSERT INTO public.credits_ledger (user_id, amount, reference_type, reference_id)
  VALUES (p_user_id, -p_amount, p_reference_type, p_reference_id);

  RETURN true;
END;
$function$;

-- -------------------------------------------------------------------------
-- TIER 2: INFORMATION-DISCLOSURE FUNCTIONS -- admin-only
-- -------------------------------------------------------------------------

-- get_trial_stats -- admin-only
CREATE OR REPLACE FUNCTION public.get_trial_stats()
RETURNS TABLE(active_trials bigint, expiring_soon bigint, no_trial bigint, total_users bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 2026-05-31 hardening: admin-only.
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE p.trial_full_lesson_granted_until > NOW()) as active_trials,
    COUNT(*) FILTER (
      WHERE p.trial_full_lesson_granted_until > NOW()
        AND p.trial_full_lesson_granted_until <= NOW() + INTERVAL '7 days'
    ) as expiring_soon,
    COUNT(*) FILTER (
      WHERE p.trial_full_lesson_granted_until IS NULL
         OR p.trial_full_lesson_granted_until <= NOW()
    ) as no_trial,
    COUNT(*) as total_users
  FROM profiles p;
END;
$function$;

-- get_beta_feedback_analytics -- admin-only
CREATE OR REPLACE FUNCTION public.get_beta_feedback_analytics(
  p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
  total_count INTEGER;
  would_pay_positive INTEGER;
  ease_of_use_positive INTEGER;
BEGIN
  -- 2026-05-31 hardening: admin-only.
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE would_pay_for IN ('yes-definitely', 'yes-probably')),
    COUNT(*) FILTER (WHERE ease_of_use IN ('very-easy', 'easy'))
  INTO total_count, would_pay_positive, ease_of_use_positive
  FROM feedback
  WHERE is_beta_feedback = true
    AND rating IS NOT NULL
    AND (p_start_date IS NULL OR submitted_at >= p_start_date)
    AND (p_end_date IS NULL OR submitted_at <= p_end_date);

  SELECT json_build_object(
    'totalFeedback', total_count,
    'averageRating', COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    'averageNPS', COALESCE(ROUND(AVG(nps_score)::numeric, 2), 0),
    'wouldPayPercentage', CASE
      WHEN total_count > 0
      THEN ROUND((would_pay_positive::numeric / total_count) * 100, 1)
      ELSE 0
    END,
    'avgMinutesSaved', COALESCE(ROUND(AVG(minutes_saved)::numeric, 0), 0),
    'easeOfUsePositive', CASE
      WHEN total_count > 0
      THEN ROUND((ease_of_use_positive::numeric / total_count) * 100, 1)
      ELSE 0
    END,
    'promoters', COUNT(*) FILTER (WHERE nps_score >= 9),
    'passives', COUNT(*) FILTER (WHERE nps_score >= 7 AND nps_score < 9),
    'detractors', COUNT(*) FILTER (WHERE nps_score < 7),
    'ratingDistribution', json_build_object(
      '1', COUNT(*) FILTER (WHERE rating = 1),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '5', COUNT(*) FILTER (WHERE rating = 5)
    ),
    'easeOfUseDistribution', json_build_object(
      'very-easy', COUNT(*) FILTER (WHERE ease_of_use = 'very-easy'),
      'easy', COUNT(*) FILTER (WHERE ease_of_use = 'easy'),
      'moderate', COUNT(*) FILTER (WHERE ease_of_use = 'moderate'),
      'difficult', COUNT(*) FILTER (WHERE ease_of_use = 'difficult'),
      'very-difficult', COUNT(*) FILTER (WHERE ease_of_use = 'very-difficult')
    ),
    'lessonQualityDistribution', json_build_object(
      'excellent', COUNT(*) FILTER (WHERE lesson_quality = 'excellent'),
      'good', COUNT(*) FILTER (WHERE lesson_quality = 'good'),
      'fair', COUNT(*) FILTER (WHERE lesson_quality = 'fair'),
      'poor', COUNT(*) FILTER (WHERE lesson_quality = 'poor')
    ),
    'timeSavedDistribution', json_build_object(
      '15', COUNT(*) FILTER (WHERE minutes_saved = 15),
      '30', COUNT(*) FILTER (WHERE minutes_saved = 30),
      '60', COUNT(*) FILTER (WHERE minutes_saved = 60),
      '120', COUNT(*) FILTER (WHERE minutes_saved = 120)
    ),
    'wouldPayDistribution', json_build_object(
      'yes-definitely', COUNT(*) FILTER (WHERE would_pay_for = 'yes-definitely'),
      'yes-probably', COUNT(*) FILTER (WHERE would_pay_for = 'yes-probably'),
      'maybe', COUNT(*) FILTER (WHERE would_pay_for = 'maybe'),
      'no', COUNT(*) FILTER (WHERE would_pay_for = 'no')
    )
  ) INTO result
  FROM feedback
  WHERE is_beta_feedback = true
    AND rating IS NOT NULL
    AND (p_start_date IS NULL OR submitted_at >= p_start_date)
    AND (p_end_date IS NULL OR submitted_at <= p_end_date);

  RETURN result;
END;
$function$;

-- get_production_feedback_analytics -- admin-only
CREATE OR REPLACE FUNCTION public.get_production_feedback_analytics(
  p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result JSON;
  total_count INTEGER;
BEGIN
  -- 2026-05-31 hardening: admin-only.
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  SELECT COUNT(*)
  INTO total_count
  FROM feedback
  WHERE is_beta_feedback = false
    AND (p_start_date IS NULL OR submitted_at >= p_start_date)
    AND (p_end_date IS NULL OR submitted_at <= p_end_date);

  SELECT json_build_object(
    'totalFeedback', total_count,
    'averageRating', COALESCE(ROUND(AVG(rating)::numeric, 2), 0),
    'qualityExcellentPercentage', CASE
      WHEN total_count > 0
      THEN ROUND((COUNT(*) FILTER (WHERE lesson_quality = 'excellent')::numeric / total_count) * 100, 1)
      ELSE 0
    END,
    'theologicalAccuratePercentage', CASE
      WHEN total_count > 0
      THEN ROUND((COUNT(*) FILTER (WHERE theological_accuracy IN ('accurate', 'mostly-accurate'))::numeric / total_count) * 100, 1)
      ELSE 0
    END,
    'ageAppropriatePercentage', CASE
      WHEN total_count > 0
      THEN ROUND((COUNT(*) FILTER (WHERE age_appropriateness = true)::numeric / total_count) * 100, 1)
      ELSE 0
    END,
    'issuesCount', COUNT(*) FILTER (WHERE has_issue = true),
    'ratingDistribution', json_build_object(
      '1', COUNT(*) FILTER (WHERE rating = 1),
      '2', COUNT(*) FILTER (WHERE rating = 2),
      '3', COUNT(*) FILTER (WHERE rating = 3),
      '4', COUNT(*) FILTER (WHERE rating = 4),
      '5', COUNT(*) FILTER (WHERE rating = 5)
    ),
    'qualityDistribution', json_build_object(
      'excellent', COUNT(*) FILTER (WHERE lesson_quality = 'excellent'),
      'good', COUNT(*) FILTER (WHERE lesson_quality = 'good'),
      'fair', COUNT(*) FILTER (WHERE lesson_quality = 'fair'),
      'poor', COUNT(*) FILTER (WHERE lesson_quality = 'poor')
    ),
    'theologicalAccuracyDistribution', json_build_object(
      'accurate', COUNT(*) FILTER (WHERE theological_accuracy = 'accurate'),
      'mostly-accurate', COUNT(*) FILTER (WHERE theological_accuracy = 'mostly-accurate'),
      'needs-review', COUNT(*) FILTER (WHERE theological_accuracy = 'needs-review'),
      'inaccurate', COUNT(*) FILTER (WHERE theological_accuracy = 'inaccurate')
    )
  ) INTO result
  FROM feedback
  WHERE is_beta_feedback = false
    AND (p_start_date IS NULL OR submitted_at >= p_start_date)
    AND (p_end_date IS NULL OR submitted_at <= p_end_date);

  RETURN result;
END;
$function$;

-- get_feedback_analytics -- admin-only (delegates to one of the two above,
-- both of which now also gate themselves; double-gate is intentional so a
-- partial deploy state never permits anon delegation through this entry).
CREATE OR REPLACE FUNCTION public.get_feedback_analytics(
  p_mode text DEFAULT 'beta'::text,
  p_start_date timestamp with time zone DEFAULT NULL::timestamp with time zone,
  p_end_date timestamp with time zone DEFAULT NULL::timestamp with time zone
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 2026-05-31 hardening: admin-only.
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  IF p_mode = 'beta' THEN
    RETURN public.get_beta_feedback_analytics(p_start_date, p_end_date);
  ELSE
    RETURN public.get_production_feedback_analytics(p_start_date, p_end_date);
  END IF;
END;
$function$;

-- get_all_feedback_questions -- admin-only (returns drafts and inactive too)
CREATE OR REPLACE FUNCTION public.get_all_feedback_questions(p_mode text DEFAULT 'beta'::text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- 2026-05-31 hardening: admin-only. The non-admin variant for the
  -- live feedback form is public.get_feedback_questions(text), which
  -- filters is_active = true and is intentionally not admin-gated.
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  RETURN (
    SELECT json_agg(
      json_build_object(
        'id', id,
        'questionKey', question_key,
        'columnName', column_name,
        'label', label,
        'description', description,
        'placeholder', placeholder,
        'type', question_type,
        'options', options,
        'required', is_required,
        'minValue', min_value,
        'maxValue', max_value,
        'maxLength', max_length,
        'displayOrder', display_order,
        'isActive', is_active,
        'createdAt', created_at,
        'updatedAt', updated_at
      )
      ORDER BY display_order
    )
    FROM feedback_questions
    WHERE feedback_mode = p_mode
  );
END;
$function$;

-- debug_admin_check -- admin-only (the function's purpose is to reveal
-- admin internals; legitimate use is admin self-diagnosis only).
CREATE OR REPLACE FUNCTION public.debug_admin_check()
RETURNS TABLE(step text, result text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _uid UUID;
BEGIN
  -- 2026-05-31 hardening: admin-only.
  IF NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
    RAISE EXCEPTION 'Access denied: Admin role required';
  END IF;

  _uid := auth.uid();

  RETURN QUERY SELECT 'auth.uid()'::TEXT, COALESCE(_uid::TEXT, 'NULL');

  RETURN QUERY SELECT 'has_role result'::TEXT,
    CASE WHEN public.has_role(_uid, 'admin'::app_role) THEN 'TRUE' ELSE 'FALSE' END;

  RETURN QUERY SELECT 'direct query'::TEXT,
    CASE WHEN EXISTS(SELECT 1 FROM user_roles WHERE user_id = _uid AND role = 'admin')
    THEN 'TRUE' ELSE 'FALSE' END;
END;
$function$;

COMMIT;

-- =========================================================================
-- POST-DEPLOY VERIFICATION (manual, run as Lynn through the app)
--   1. Admin panel -> Beta Analytics: confirm get_trial_stats,
--      get_feedback_analytics still return data when called as you (admin).
--   2. Admin panel -> Bulk Trial Actions: confirm bulk_extend_trials and
--      bulk_revoke_trials still execute for you.
--   3. Generate a lesson as Lynn (admin): confirm increment_lesson_usage
--      still increments. Then generate as a non-admin test account:
--      confirm the same.
--   4. Generate a devotional / parable as non-admin: same.
--   5. Open browser dev console and try a bare POST to the rpc endpoint
--      WITHOUT being logged in:
--        POST /rest/v1/rpc/bulk_revoke_trials   -> expect 403 / RAISE
--        POST /rest/v1/rpc/get_trial_stats      -> expect 403 / RAISE
--      If either succeeds, ABORT and roll back.
-- =========================================================================
