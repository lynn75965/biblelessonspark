-- B8 Session 1 -- concurrency admission control for the 5 non-streaming
-- Anthropic-calling functions (reshape-lesson, generate-devotional,
-- generate-parable, extract-lesson, toolbelt-reflect). generate-lesson is
-- explicitly OUT of scope for this migration -- Session 2 wires it in,
-- including a follow-up migration to extend the CHECK constraints below.
--
-- Design: B8_CONCURRENCY_ADMISSION_DESIGN.md, "SESSION 1 PRE-FLIGHT
-- RESOLUTIONS" section (Resolutions 1 and 2).
--
-- Three-table split (Resolution 1):
--   generation_slot_counters -- 2 rows, live state only (lock anchor +
--     cooldown flag). No ceiling column -- caps are SSOT'd in
--     src/constants/concurrencyConfig.ts and passed into the claim RPC as
--     a parameter, never stored here.
--   active_generations -- one row per in-flight Anthropic call, the actual
--     ledger being counted. Reclaimed by the claim RPC itself (Resolution 2)
--     -- no cron/sweep dependency.
--   capacity_events (existing, extended) -- durable history of rejections,
--     for the future Admin Panel (Rule #31). Never overlaps the two tables
--     above: those hold current state only, this holds past events only.

-- ============================================================================
-- 1. generation_slot_counters -- lock anchor + cooldown state, 2 rows
-- ============================================================================

CREATE TABLE public.generation_slot_counters (
  model_bucket   text PRIMARY KEY,
  cooldown_until timestamptz,
  CONSTRAINT generation_slot_counters_bucket_check CHECK (
    model_bucket IN ('default', 'fallback_parable')
  )
);

INSERT INTO public.generation_slot_counters (model_bucket, cooldown_until)
VALUES ('default', NULL), ('fallback_parable', NULL);

ALTER TABLE public.generation_slot_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_full_access ON public.generation_slot_counters
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON public.generation_slot_counters FROM anon, authenticated;
GRANT SELECT ON public.generation_slot_counters TO authenticated; -- gated by admin_full_access above

-- ============================================================================
-- 2. active_generations -- live ledger, one row per in-flight Anthropic call
-- ============================================================================

CREATE TABLE public.active_generations (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source       text NOT NULL,
  model_bucket text NOT NULL REFERENCES public.generation_slot_counters(model_bucket),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at   timestamptz NOT NULL DEFAULT now(),
  expires_at   timestamptz NOT NULL,
  heartbeat_at timestamptz NOT NULL DEFAULT now(),

  -- Session 1 sources only. generate-lesson is added by a Session 2
  -- migration when it's actually wired -- not pre-added here, matching the
  -- "Session 1 ONLY" scope discipline (see file header).
  CONSTRAINT active_generations_source_check CHECK (
    source IN ('reshape-lesson', 'generate-devotional', 'generate-parable', 'extract-lesson', 'toolbelt-reflect')
  )
);

-- Query patterns: count-per-bucket (the claim RPC's hot path) and the
-- stale-row sweep (also the claim RPC's hot path, every single call).
CREATE INDEX idx_active_generations_bucket ON public.active_generations (model_bucket);
CREATE INDEX idx_active_generations_expires ON public.active_generations (expires_at);

ALTER TABLE public.active_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_full_access ON public.active_generations
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON public.active_generations FROM anon, authenticated;
GRANT SELECT ON public.active_generations TO authenticated; -- gated by admin_full_access above

-- No direct service_role GRANT on either table above: all writes happen
-- exclusively through the two SECURITY DEFINER RPCs below, which run as
-- their owner (postgres) regardless of the caller's own table grants --
-- confirmed against the existing increment_rate_limit() precedent
-- (20260618120000_toolbelt_email_hardening.sql), which grants EXECUTE to
-- service_role but never GRANTs the rate_limits table itself.

-- ============================================================================
-- 3. claim_generation_slot() -- atomic claim, stale-slot reclamation inline
-- ============================================================================

CREATE OR REPLACE FUNCTION public.claim_generation_slot(
  p_source       text,
  p_model_bucket text,
  p_user_id      uuid,
  p_ceiling      integer,   -- from concurrencyConfig.ts, never hardcoded here
  p_ttl_seconds  integer    -- from concurrencyConfig.ts, never hardcoded here
) RETURNS TABLE(claimed boolean, slot_id uuid, active_count integer, reason text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cooldown_until timestamptz;
  v_count          integer;
  v_slot_id        uuid;
BEGIN
  -- STEP 1 -- Reclaim orphaned slots FIRST, inline, every call. No cron/sweep
  -- dependency: a slot can only be stale if its owning invocation crashed
  -- (a healthy invocation always releases, or -- generate-lesson only,
  -- Session 2 -- keeps heartbeating) before expires_at.
  DELETE FROM active_generations WHERE expires_at < now();

  -- STEP 2 -- Lock this bucket's row so concurrent claims against the SAME
  -- bucket serialize. This is the whole reason generation_slot_counters
  -- exists as a table (mirrors increment_rate_limit's atomic upsert, but
  -- needs an explicit lock here since this is a threshold-check-then-insert,
  -- not a pure increment).
  SELECT cooldown_until INTO v_cooldown_until
    FROM generation_slot_counters
    WHERE model_bucket = p_model_bucket
    FOR UPDATE;

  -- STEP 3 -- Cooldown short-circuits before the ceiling even matters.
  -- Inert in Session 1 (nothing writes cooldown_until yet -- that's the
  -- anthropicRetry.ts integration, Session 2) but included now per the
  -- approved design so Session 2 never needs to touch this RPC.
  IF v_cooldown_until IS NOT NULL AND v_cooldown_until > now() THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'cooldown'::text;
    RETURN;
  END IF;

  -- STEP 4 -- Count against the now-guaranteed-fresh table (STEP 1 just
  -- swept anything stale), under the same row lock, so no other concurrent
  -- claim for this bucket can insert between this count and this claim's
  -- own insert.
  SELECT count(*) INTO v_count
    FROM active_generations
    WHERE model_bucket = p_model_bucket;

  IF v_count >= p_ceiling THEN
    RETURN QUERY SELECT false, NULL::uuid, v_count, 'at_capacity'::text;
    RETURN;
  END IF;

  -- STEP 5 -- Admit.
  INSERT INTO active_generations (source, model_bucket, user_id, expires_at)
  VALUES (p_source, p_model_bucket, p_user_id, now() + make_interval(secs => p_ttl_seconds))
  RETURNING id INTO v_slot_id;

  RETURN QUERY SELECT true, v_slot_id, v_count + 1, NULL::text;
END $$;

REVOKE EXECUTE ON FUNCTION public.claim_generation_slot(text, text, uuid, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.claim_generation_slot(text, text, uuid, integer, integer) TO service_role;

-- ============================================================================
-- 4. release_generation_slot() -- called on every exit path after a claim
-- ============================================================================

CREATE OR REPLACE FUNCTION public.release_generation_slot(
  p_slot_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM active_generations WHERE id = p_slot_id;
END $$;

REVOKE EXECUTE ON FUNCTION public.release_generation_slot(uuid) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.release_generation_slot(uuid) TO service_role;

-- ============================================================================
-- 5. Extend capacity_events (Rule #31) -- two new sources, two new event
--    types. 'admission_queued' intentionally NOT added -- no Session 1
--    function ever writes it (queueing is generate-lesson-only, Session 2);
--    it's added by that session's own migration when it's actually used.
-- ============================================================================

ALTER TABLE public.capacity_events DROP CONSTRAINT capacity_events_source_check;
ALTER TABLE public.capacity_events ADD CONSTRAINT capacity_events_source_check CHECK (
  source IN ('generate-lesson', 'generate-devotional', 'generate-parable', 'extract-lesson', 'reshape-lesson', 'toolbelt-reflect')
);

ALTER TABLE public.capacity_events DROP CONSTRAINT capacity_events_event_type_check;
ALTER TABLE public.capacity_events ADD CONSTRAINT capacity_events_event_type_check CHECK (
  event_type IN (
    'quota_denied_failclosed',
    'quota_denied',
    'rate_limited',
    'truncated',
    'anthropic_terminal_failure',
    'admission_rejected',
    'admission_cooldown_rejected'
  )
);

-- ---- Post-state diagnostics (surface in db push output) ----
DO $$
DECLARE
  seed_count integer;
BEGIN
  SELECT count(*) INTO seed_count FROM public.generation_slot_counters;
  RAISE NOTICE 'POSTCHECK generation_slot_counters seeded rows: % (expect 2)', seed_count;
END $$;
