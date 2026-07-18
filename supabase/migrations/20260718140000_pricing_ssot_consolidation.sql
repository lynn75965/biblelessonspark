-- Pricing SSOT consolidation: pricingConfig.ts becomes the sole pricing
-- authority for display, not just checkout/webhook resolution.
--
-- Two backlog items closed in one session (per PROJECT_MASTER.md, July 18,
-- 2026): (1) an orphaned pre-SSOT pricing subsystem (subscription_plans
-- table, PricingPlansManager.tsx admin UI, sync-pricing-from-stripe and
-- seed-stripe-catalog edge functions) using a credits/essentials-pro-
-- premium model that matches no current tier; (2) usePricingPlans.tsx
-- reading live display pricing from the pricing_plans DB table as a
-- second source of truth instead of pricingConfig.ts directly.
--
-- Verified before writing this migration: real money flow (checkout,
-- Stripe webhook) touches neither table -- tier resolution is 100%
-- pricingConfig.ts (Rule #17). All 44 live user_subscriptions rows have
-- plan_id = NULL; zero application code reads or writes it.
-- allocate_monthly_credits() has zero callers (no cron, no .rpc() call
-- anywhere) and has never produced a credits_ledger row
-- (reference_type = 'monthly_allocation' count = 0) -- fully inert given
-- plan_id is always NULL. credits_ledger itself is untouched by this
-- migration; its own retirement (now writer-less and reader-less) is a
-- separate future housekeeping item.
--
-- Order: function -> FK -> column -> tables, so each drop only ever
-- removes something already confirmed to have zero remaining dependents.

-- Drop the orphaned SECURITY DEFINER function first (references both
-- user_subscriptions.plan_id and subscription_plans.id).
DROP FUNCTION IF EXISTS public.allocate_monthly_credits();

-- Drop the FK from user_subscriptions to subscription_plans before
-- dropping the column, then drop the column itself. plan_id has never
-- been used by any application code -- confirmed via repo-wide grep,
-- only the generated types.ts referenced it.
ALTER TABLE public.user_subscriptions
  DROP CONSTRAINT IF EXISTS user_subscriptions_plan_id_fkey;

ALTER TABLE public.user_subscriptions
  DROP COLUMN IF EXISTS plan_id;

-- Drop both pricing tables. Dropping a table drops its RLS policies and
-- grants automatically -- no separate cleanup needed.
--
-- subscription_plans: the orphaned credits-model table. Zero consumers
-- beyond the deleted admin cluster once the FK above is gone.
DROP TABLE IF EXISTS public.subscription_plans;

-- pricing_plans: the live display-pricing table, now superseded by
-- pricingConfig.ts's PRICING_PLANS constant. Confirmed zero remaining
-- consumers (no FK, view, or trigger referenced it; its sole reader,
-- usePricingPlans.tsx, is deleted in this same change). Dropped rather
-- than frozen (Rule #34 precedent) -- unlike events, it held no unique
-- archival data, only 2 rows of config fully duplicated in
-- pricingConfig.ts already.
DROP TABLE IF EXISTS public.pricing_plans;
