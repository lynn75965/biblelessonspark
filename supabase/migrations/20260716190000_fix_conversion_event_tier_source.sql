-- B7 fix: log_conversion_event resolved tier from profiles.subscription_tier,
-- which is only ever written by stripe-webhook on a paid-tier transition
-- (index.ts:325 upgrade, index.ts:461 cancellation) -- it is NULL for any
-- user who has always been free tier (47 of 53 live profiles). The actual
-- tier SSOT is user_subscriptions.tier, the same table check_lesson_limit
-- reads and self-heals to 'free' when no row exists yet. Verified live:
-- test user 09415f5e-c839-49b3-940b-4657361cafb1 had subscription_tier
-- NULL, producing tier_at_event = 'unknown' on every row despite
-- meta.tier correctly reading 'free' client-side.

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
  -- through this RPC.
  IF p_event_type NOT IN ('upgrade_prompt_impression', 'upgrade_click', 'upgrade_declined') THEN
    RAISE EXCEPTION 'log_conversion_event: invalid event_type %', p_event_type;
  END IF;

  SELECT tier INTO v_tier FROM public.user_subscriptions WHERE user_id = v_user_id;

  -- 'unknown' is not a real tier value anywhere else in the app (the
  -- vocabulary is free|personal|starter|growth|full|enterprise). No
  -- user_subscriptions row yet already means free tier, per
  -- check_lesson_limit's own self-heal convention -- mirror that here.
  INSERT INTO public.conversion_events (user_id, event_type, trigger_source, tier_at_event, meta)
  VALUES (v_user_id, p_event_type, p_trigger_source, COALESCE(v_tier, 'free'), p_meta);
END;
$$;
