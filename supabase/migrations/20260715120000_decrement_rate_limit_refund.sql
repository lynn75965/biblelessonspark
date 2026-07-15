-- B4 (model fallback / graceful degradation): quota-refund companion to the
-- existing increment_rate_limit RPC (see 20260618120000_toolbelt_email_hardening.sql).
--
-- Problem: checkRateLimits() in _shared/edgeRateLimit.ts increments its
-- counters atomically as part of the CHECK itself (fail-closed by design --
-- this is intentional and unchanged). But four call sites (generate-parable's
-- anon-IP + global backstop, extract-lesson's user/IP/global caps,
-- toolbelt-reflect's IP/session/global caps, and generate-devotional's global
-- backstop) gate an Anthropic call on that pre-incremented counter with no
-- way to give the count back if the Anthropic call then fails after all
-- retries/fallback are exhausted -- a teacher who hits a transient 529 loses
-- one of her daily/hourly attempts for nothing.
--
-- Fix: a decrement counterpart, called ONLY from the terminal-failure path in
-- supabase/functions/_shared/anthropicRetry.ts (never from a success path --
-- a request that eventually succeeds, even after retries, is never refunded).
-- Floored at 0 so a refund can never push a counter negative or create a
-- larger allowance than was ever actually granted.

CREATE OR REPLACE FUNCTION public.decrement_rate_limit(
  p_endpoint     text,
  p_identifier   text,
  p_window_start timestamptz
) RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE public.rate_limits
  SET request_count = GREATEST(request_count - 1, 0)
  WHERE endpoint = p_endpoint
    AND identifier = p_identifier
    AND window_start = p_window_start
  RETURNING request_count INTO v_count;

  RETURN COALESCE(v_count, 0);
END $$;

REVOKE EXECUTE ON FUNCTION public.decrement_rate_limit(text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.decrement_rate_limit(text, text, timestamptz) TO service_role;

-- ---- Post-state diagnostic (surface in db push output) ----
DO $$
DECLARE
  fn_exists boolean;
  svc_grant text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'decrement_rate_limit'
  ) INTO fn_exists;
  RAISE NOTICE 'POSTCHECK decrement_rate_limit function exists: %', fn_exists;

  SELECT string_agg(privilege_type, ',') INTO svc_grant
  FROM information_schema.role_routine_grants
  WHERE routine_schema = 'public' AND routine_name = 'decrement_rate_limit' AND grantee = 'service_role';
  RAISE NOTICE 'POSTCHECK decrement_rate_limit service_role grants: %', COALESCE(svc_grant, 'none');
END $$;
