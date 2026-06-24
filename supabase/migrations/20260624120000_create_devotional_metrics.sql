-- ============================================================================
-- devotional_metrics
-- ----------------------------------------------------------------------------
-- Per-attempt telemetry for the generate-devotional Edge Function.
--
-- Mirrors public.generation_metrics (the lesson-generation telemetry table) so
-- devotional generation has the same visibility lessons already have. Before
-- this table, a failed devotional (timeout, AI error, DB error) left NO record
-- anywhere -- the content table (public.devotionals) is written ONLY on success.
-- That blind spot is what this table closes.
--
-- Lifecycle (written by generate-devotional with the service-role key, which
-- bypasses RLS):
--   1. status='started'   inserted before the Anthropic call
--   2. status='completed' on success (duration + tokens stamped)
--   3. status='timeout'   when the in-function AbortController fires
--   4. status='error'     on any other handled failure (AI / DB / limit)
--
-- RLS mirrors generation_metrics exactly: admins may read; nobody else. All
-- writes happen server-side via the service role, so no INSERT/UPDATE policy
-- is required (service role is not subject to RLS).
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.devotional_metrics (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL,
  source_lesson_id       uuid,
  organization_id        uuid,
  user_agent             text,
  device_type            text NOT NULL DEFAULT 'unknown',
  browser                text,
  os                     text,
  generation_start       timestamptz NOT NULL DEFAULT now(),
  generation_end         timestamptz,
  generation_duration_ms integer,
  target_id              text,
  length_id              text,
  status                 text NOT NULL,
  error_message          text,
  tokens_input           integer,
  tokens_output          integer,
  anthropic_model        text,
  rate_limited           boolean DEFAULT false,
  created_at             timestamptz DEFAULT now()
);

-- Query patterns: "recent failures" and "this user's attempts".
CREATE INDEX IF NOT EXISTS devotional_metrics_start_idx
  ON public.devotional_metrics (generation_start DESC);

CREATE INDEX IF NOT EXISTS devotional_metrics_user_idx
  ON public.devotional_metrics (user_id, generation_start DESC);

ALTER TABLE public.devotional_metrics ENABLE ROW LEVEL SECURITY;

-- Mirror of generation_metrics' "Admins can view all metrics" policy.
DROP POLICY IF EXISTS "Admins can view all devotional metrics" ON public.devotional_metrics;
CREATE POLICY "Admins can view all devotional metrics"
  ON public.devotional_metrics
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));
