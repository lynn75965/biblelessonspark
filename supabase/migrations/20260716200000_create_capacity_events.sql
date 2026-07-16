-- B8 capacity/rejection event log (Rule #31: admin-observable by design).
-- Records every quota rejection, rate-limit breach, output truncation,
-- fail-closed denial, and terminal Anthropic failure across the four
-- content generators (generate-lesson, generate-devotional,
-- generate-parable, extract-lesson), so the future Admin Panel can read
-- surge/capacity health without a retrofit.
--
-- Pattern B (mirrors conversion_events/guardrail_violations): no INSERT
-- policy for authenticated/anon at all -- every row is written by a
-- service-role client inside the edge function itself, the same way
-- generate-lesson's guardrail_violations insert does. This is stricter
-- than conversion_events (which also has a client-callable RPC) --
-- capacity_events has zero client-side writers, by design, avoiding the
-- RLS gap found in the legacy `events` table (B7 adjacent finding #1).
--
-- Reads: admin only. Unlike conversion_events, this table has no
-- current user-facing consumer, so no users_select_own policy -- add
-- one trivially later if a self-service diagnostics view is ever built.

CREATE TABLE public.capacity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL,
  event_type text NOT NULL,
  tier_at_event text NOT NULL DEFAULT 'unknown',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Table-level allowlists -- the one enforcement point that protects
  -- every service-role writer, since CHECK constraints apply regardless
  -- of RLS bypass, unlike policies. Update this list when a new
  -- generator or event type is added.
  CONSTRAINT capacity_events_source_check CHECK (
    source IN ('generate-lesson', 'generate-devotional', 'generate-parable', 'extract-lesson')
  ),
  CONSTRAINT capacity_events_event_type_check CHECK (
    event_type IN (
      'quota_denied_failclosed',
      'quota_denied',
      'rate_limited',
      'truncated',
      'anthropic_terminal_failure'
    )
  )
);

-- user_id is nullable (ON DELETE SET NULL, not CASCADE) for anonymous
-- generate-parable rejections, which have no auth.users row at all --
-- unlike conversion_events, a deleted user's capacity history is kept
-- (as an orphaned row) rather than dropped, since this is operational
-- telemetry, not per-user product data.

CREATE INDEX idx_capacity_events_source_type_created
  ON public.capacity_events (source, event_type, created_at);
CREATE INDEX idx_capacity_events_user_created
  ON public.capacity_events (user_id, created_at)
  WHERE user_id IS NOT NULL;

ALTER TABLE public.capacity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_full_access ON public.capacity_events
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

REVOKE ALL ON public.capacity_events FROM anon, authenticated;
GRANT SELECT ON public.capacity_events TO authenticated; -- gated by admin_full_access above
GRANT ALL ON public.capacity_events TO service_role;
