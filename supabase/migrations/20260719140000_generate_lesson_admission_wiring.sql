-- B8 Session 2 -- wires generate-lesson (the streaming outlier) into the
-- admission control infrastructure Session 1 built. Extends CHECK
-- constraints for the new source/event-types Session 2 introduces, and
-- adds the two RPCs the heartbeat-renewal and cooldown-writer mechanisms
-- need. No new tables. Design: B8_CONCURRENCY_ADMISSION_DESIGN.md,
-- "SESSION 1 PRE-FLIGHT RESOLUTIONS" section, plus the Session 2
-- pre-implementation report (chat record) covering the heartbeat/release/
-- renewal-failure decisions made this session.

-- ============================================================================
-- 1. Extend active_generations' source allowlist -- generate-lesson was
--    deliberately excluded from this in Session 1 (scope discipline: don't
--    imply a source is wired before it actually is).
-- ============================================================================

ALTER TABLE public.active_generations DROP CONSTRAINT active_generations_source_check;
ALTER TABLE public.active_generations ADD CONSTRAINT active_generations_source_check CHECK (
  source IN ('generate-lesson', 'reshape-lesson', 'generate-devotional', 'generate-parable', 'extract-lesson', 'toolbelt-reflect')
);

-- ============================================================================
-- 2. Extend capacity_events' event_type allowlist -- two new signals:
--    'admission_queued'         -- a generate-lesson request had to poll for
--                                  a slot (Session 1 never wrote this; only
--                                  generate-lesson's queue policy uses it).
--    'admission_heartbeat_lost' -- a heartbeat tick found its own slot
--                                  already gone (stale-swept). Should be
--                                  rare/never under normal operation; a
--                                  dedicated type (not reused/overloaded
--                                  metadata on an existing type) so the
--                                  future Admin Panel can filter/alert on
--                                  it unambiguously as its own anomaly
--                                  category, not conflated with ordinary
--                                  rejections.
-- ============================================================================

ALTER TABLE public.capacity_events DROP CONSTRAINT capacity_events_event_type_check;
ALTER TABLE public.capacity_events ADD CONSTRAINT capacity_events_event_type_check CHECK (
  event_type IN (
    'quota_denied_failclosed',
    'quota_denied',
    'rate_limited',
    'truncated',
    'anthropic_terminal_failure',
    'admission_rejected',
    'admission_cooldown_rejected',
    'admission_queued',
    'admission_heartbeat_lost'
  )
);

-- ============================================================================
-- 3. renew_generation_slot() -- heartbeat renewal, generate-lesson only.
--    Renewal window is a PARAMETER (from concurrencyConfig.ts), never
--    hardcoded here, matching claim_generation_slot()'s p_ttl_seconds
--    pattern. Returns whether a row was actually found/updated -- the
--    caller uses this to detect an unexpected stale-sweep (see design
--    doc / Session 2 chat record for the log-and-continue decision; this
--    RPC itself doesn't decide behavior, only reports the fact).
-- ============================================================================

CREATE OR REPLACE FUNCTION public.renew_generation_slot(
  p_slot_id          uuid,
  p_renewal_seconds  integer
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row_count integer;
BEGIN
  UPDATE active_generations
    SET heartbeat_at = now(), expires_at = now() + make_interval(secs => p_renewal_seconds)
    WHERE id = p_slot_id;
  GET DIAGNOSTICS v_row_count = ROW_COUNT;
  RETURN v_row_count > 0;
END $$;

REVOKE EXECUTE ON FUNCTION public.renew_generation_slot(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.renew_generation_slot(uuid, integer) TO service_role;

-- ============================================================================
-- 4. set_model_cooldown() -- the cooldown WRITER (Session 1 only built the
--    reader, inside claim_generation_slot()). Called from
--    _shared/anthropicRetry.ts's give-up path when retries+fallback are
--    exhausted on 'overloaded' or 'rate_limit' only. Extends the cooldown
--    forward (GREATEST), never resets it backward, so repeated overload
--    signals don't shorten an already-longer cooldown from a prior signal.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_model_cooldown(
  p_model_bucket  text,
  p_seconds       integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE generation_slot_counters
    SET cooldown_until = GREATEST(COALESCE(cooldown_until, now()), now() + make_interval(secs => p_seconds))
    WHERE model_bucket = p_model_bucket;
END $$;

REVOKE EXECUTE ON FUNCTION public.set_model_cooldown(text, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.set_model_cooldown(text, integer) TO service_role;

-- ---- Post-state diagnostics ----
DO $$
DECLARE
  src_def  text;
  evt_def  text;
BEGIN
  SELECT pg_get_constraintdef(oid) INTO src_def
    FROM pg_constraint WHERE conname = 'active_generations_source_check';
  SELECT pg_get_constraintdef(oid) INTO evt_def
    FROM pg_constraint WHERE conname = 'capacity_events_event_type_check';
  RAISE NOTICE 'POSTCHECK active_generations_source_check: %', src_def;
  RAISE NOTICE 'POSTCHECK capacity_events_event_type_check: %', evt_def;
END $$;
