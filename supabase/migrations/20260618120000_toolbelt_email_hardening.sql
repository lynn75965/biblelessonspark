-- Toolbelt email hardening: content lock + rate-limit infrastructure
-- Supports the send-toolbelt-reflection hardening (public lead-gen endpoint).
--   1) Persist the AI-generated reflection on toolbelt_usage so the email body
--      is a server source-of-truth (content lock), not caller-supplied text.
--   2) Lock toolbelt_usage against direct anon/authenticated writes so an
--      attacker cannot forge a reflection row (service-role still bypasses RLS).
--   3) Ensure a unique index on rate_limits for atomic ON CONFLICT upserts.
--   4) Atomic SECURITY DEFINER increment_rate_limit RPC, service_role only.

-- ---- Pre-state diagnostics (surface in db push output) ----
DO $$
DECLARE
  idx_exists  boolean;
  anon_grants text;
  auth_grants text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'rate_limits'
      AND indexdef ILIKE '%(endpoint, identifier, window_start)%'
  ) INTO idx_exists;
  RAISE NOTICE 'PRECHECK rate_limits (endpoint,identifier,window_start) unique index exists: %', idx_exists;

  SELECT string_agg(privilege_type, ',') INTO anon_grants
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' AND table_name = 'toolbelt_usage' AND grantee = 'anon';
  SELECT string_agg(privilege_type, ',') INTO auth_grants
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' AND table_name = 'toolbelt_usage' AND grantee = 'authenticated';
  RAISE NOTICE 'PRECHECK toolbelt_usage grants BEFORE -- anon: [%], authenticated: [%]',
    COALESCE(anon_grants, 'none'), COALESCE(auth_grants, 'none');
END $$;

-- 1) Reflection text column (server source-of-truth for the email body)
ALTER TABLE public.toolbelt_usage ADD COLUMN IF NOT EXISTS reflection_text text;

-- 2) Lock toolbelt_usage from direct anon/authenticated Data API writes.
--    Service-role (used by toolbelt-reflect and send-toolbelt-reflection)
--    bypasses RLS, so legitimate writes are unaffected.
REVOKE ALL ON public.toolbelt_usage FROM anon, authenticated;

-- 3) Unique index for atomic per-scope rate-limit upserts
CREATE UNIQUE INDEX IF NOT EXISTS rate_limits_scope_window_uidx
  ON public.rate_limits (endpoint, identifier, window_start);

-- 4) Atomic increment + read RPC (service_role only)
CREATE OR REPLACE FUNCTION public.increment_rate_limit(
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
  INSERT INTO public.rate_limits (endpoint, identifier, window_start, request_count)
  VALUES (p_endpoint, p_identifier, p_window_start, 1)
  ON CONFLICT (endpoint, identifier, window_start)
  DO UPDATE SET request_count = public.rate_limits.request_count + 1
  RETURNING request_count INTO v_count;
  RETURN v_count;
END $$;

REVOKE EXECUTE ON FUNCTION public.increment_rate_limit(text, text, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.increment_rate_limit(text, text, timestamptz) TO service_role;

-- ---- Post-state diagnostics ----
DO $$
DECLARE
  idx_exists  boolean;
  anon_grants text;
  auth_grants text;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE schemaname = 'public' AND tablename = 'rate_limits'
      AND indexname = 'rate_limits_scope_window_uidx'
  ) INTO idx_exists;
  RAISE NOTICE 'POSTCHECK rate_limits unique index present: %', idx_exists;

  SELECT string_agg(privilege_type, ',') INTO anon_grants
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' AND table_name = 'toolbelt_usage' AND grantee = 'anon';
  SELECT string_agg(privilege_type, ',') INTO auth_grants
  FROM information_schema.role_table_grants
  WHERE table_schema = 'public' AND table_name = 'toolbelt_usage' AND grantee = 'authenticated';
  RAISE NOTICE 'POSTCHECK toolbelt_usage grants AFTER -- anon: [%], authenticated: [%]',
    COALESCE(anon_grants, 'none'), COALESCE(auth_grants, 'none');
END $$;
