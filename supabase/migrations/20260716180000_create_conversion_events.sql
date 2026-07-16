-- B7 conversion-funnel instrumentation.
-- Pattern B (mirrors guardrail_violations): no INSERT policy for
-- authenticated/anon at all. Writes happen exactly two ways:
--   1. log_conversion_event() RPC (SECURITY DEFINER, below) for the three
--      client-side-only touchpoints (impression, click, decline).
--   2. Direct service-role insert from create-checkout-session for
--      checkout_started -- bypasses RLS the same way generate-lesson's
--      guardrail_violations insert does.
-- Reads: admin sees all rows; a user may SELECT their own rows only.

CREATE TABLE public.conversion_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  trigger_source text,
  tier_at_event text NOT NULL DEFAULT 'unknown',
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Table-level allowlist. This is the ONE enforcement point that protects
  -- BOTH writers (the RPC below, and create-checkout-session's service-role
  -- insert) -- CHECK constraints apply regardless of RLS bypass, unlike
  -- policies. Hand-mirrors src/constants/conversionEvents.ts
  -- CONVERSION_EVENT_TYPES; SQL cannot import TS (same documented pattern
  -- as check_lesson_limit's [1,5,8]/[1..8] arrays, Rule #26). Update both
  -- places together when adding an event type.
  CONSTRAINT conversion_events_event_type_check CHECK (
    event_type IN (
      'upgrade_prompt_impression',
      'upgrade_click',
      'upgrade_declined',
      'checkout_started'
    )
  )
);

-- ON DELETE CASCADE means this table needs no entry in admin-delete-user's
-- manual 30-table cleanup list -- deleting the auth.users row cleans this
-- up automatically.

CREATE INDEX idx_conversion_events_type_created
  ON public.conversion_events (event_type, created_at);
CREATE INDEX idx_conversion_events_user_created
  ON public.conversion_events (user_id, created_at);

ALTER TABLE public.conversion_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_full_access ON public.conversion_events
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY users_select_own ON public.conversion_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

REVOKE ALL ON public.conversion_events FROM anon, authenticated;
GRANT SELECT ON public.conversion_events TO authenticated; -- gated by the two RLS policies above
GRANT ALL ON public.conversion_events TO service_role;

-- ============================================================
-- log_conversion_event RPC -- the only authenticated write path
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_conversion_event(
  p_event_type text,
  p_trigger_source text DEFAULT NULL,
  p_meta jsonb DEFAULT '{}'::jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_tier text;
BEGIN
  -- Never trust a client-supplied user_id -- derive it from the session.
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'log_conversion_event: authentication required';
  END IF;

  -- Client-emittable subset only. checkout_started is deliberately EXCLUDED
  -- here -- it may only be written server-side (create-checkout-session,
  -- service role) so a client can never forge a fake checkout_started row
  -- through this RPC. This is a SECOND, narrower allowlist than the table's
  -- CHECK constraint above, by design -- not duplication for its own sake.
  IF p_event_type NOT IN ('upgrade_prompt_impression', 'upgrade_click', 'upgrade_declined') THEN
    RAISE EXCEPTION 'log_conversion_event: invalid event_type %', p_event_type;
  END IF;

  SELECT subscription_tier INTO v_tier FROM public.profiles WHERE id = v_user_id;

  INSERT INTO public.conversion_events (user_id, event_type, trigger_source, tier_at_event, meta)
  VALUES (v_user_id, p_event_type, p_trigger_source, COALESCE(v_tier, 'unknown'), p_meta);
END;
$$;

REVOKE ALL ON FUNCTION public.log_conversion_event(text, text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.log_conversion_event(text, text, jsonb) TO authenticated;
