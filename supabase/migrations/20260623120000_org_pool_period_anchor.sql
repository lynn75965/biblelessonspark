-- ============================================================================
-- STAGE A (Shepherding) -- Org pool 30-day rolling refill anchor
-- ============================================================================
-- Adds a window anchor for the Shepherding lesson pool that is INDEPENDENT of
-- the annual Stripe billing boundary (current_period_start / current_period_end).
--
-- The pool refills to full every ORG_POOL.periodDays (30) days. The generate-
-- lesson and reshape-lesson edge functions roll this window LAZILY on read:
-- when now() >= pool_period_start + 30 days, they reset lessons_used_this_period
-- to 0 and re-anchor pool_period_start to now(). No carryover.
--
-- ARCHITECTURE: no pg_cron, no trigger -- the edge function is the only writer
-- (Architecture Principle #2). This column is passive storage only.
-- The 30-day length lives in the frontend SSOT (organizationConfig.ts ORG_POOL),
-- never in SQL.
-- ============================================================================

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS pool_period_start timestamptz;

COMMENT ON COLUMN public.organizations.pool_period_start IS
  'Anchor for the 30-day rolling Shepherding lesson-pool window. Independent of the annual Stripe billing boundary. Rolled forward lazily by the generate-lesson / reshape-lesson edge functions (reset lessons_used_this_period to 0, re-anchor to now) when the window has elapsed. NULL = not yet initialized; the first pool check anchors it to now() without resetting.';
