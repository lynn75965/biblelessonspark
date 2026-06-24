-- ============================================================================
-- FIX: check_devotional_limit -- "column reference period_start is ambiguous"
-- ----------------------------------------------------------------------------
-- The function RETURNS TABLE(..., period_start timestamptz, period_end timestamptz),
-- which makes period_start / period_end PL/pgSQL variables for the whole body.
-- The upsert then wrote:
--
--     ON CONFLICT (user_id, period_start) DO NOTHING
--
-- where `period_start` matches BOTH the OUT variable and the devotional_usage
-- column -> Postgres error 42702 (ambiguous column reference). Admins never hit
-- it (they RETURN early with a 9999 limit); EVERY non-admin call crashed, the
-- generate-devotional Edge Function fail-closed to HTTP 503, and the user saw
-- "Edge Function returned a non-2xx status code". Net effect: devotional
-- generation was broken for all paying non-admin users.
--
-- Fix: reference the unique constraint BY NAME in the ON CONFLICT clause
-- (devotional_usage_user_id_period_start_key). This is unambiguous, keeps the
-- exact same idempotent upsert + race safety, and changes nothing else. The
-- function had no prior migration (created via the Dashboard pre-Rule #20); this
-- is now its authoritative definition.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_devotional_limit(p_user_id uuid)
 RETURNS TABLE(can_generate boolean, devotionals_used integer, devotionals_limit integer, period_start timestamp with time zone, period_end timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_is_admin BOOLEAN;
  v_limit INTEGER := 7;
  v_used INTEGER := 0;
  v_period_start TIMESTAMPTZ;
  v_period_end TIMESTAMPTZ;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = p_user_id AND role = 'admin'
  ) INTO v_is_admin;

  IF v_is_admin THEN
    RETURN QUERY SELECT true, 0, 9999, now(), now() + interval '1 month';
    RETURN;
  END IF;

  v_period_start := date_trunc('month', now());
  v_period_end := v_period_start + interval '1 month';

  INSERT INTO public.devotional_usage (user_id, period_start, period_end, devotionals_generated)
  VALUES (p_user_id, v_period_start, v_period_end, 0)
  ON CONFLICT ON CONSTRAINT devotional_usage_user_id_period_start_key DO NOTHING;

  SELECT devotionals_generated INTO v_used
  FROM public.devotional_usage du
  WHERE du.user_id = p_user_id AND du.period_start = v_period_start;

  RETURN QUERY SELECT (v_used < v_limit), v_used, v_limit, v_period_start, v_period_end;
END;
$function$;
