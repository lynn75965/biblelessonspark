-- devotional_metrics never had a real FK to auth.users -- rows survived
-- account deletion forever, fully identified, contradicting Privacy
-- Policy Section 10's promise to "delete or de-identify... within 30
-- days." Fixes the gap using the same de-identification precedent as
-- capacity_events (ON DELETE SET NULL, not CASCADE, since this is
-- operational/diagnostic telemetry, not per-user product data).
--
-- No admin-delete-user manual-list entry needed: Step 4 of that function
-- (admin-delete-user/index.ts:175) calls auth.admin.deleteUser(), which
-- fires this FK's ON DELETE SET NULL automatically and unconditionally
-- -- the same reasoning already documented for conversion_events
-- (20260716180000_create_conversion_events.sql:1-8).
--
-- Pre-flight check (2026-07-16): 0 existing rows reference an
-- already-deleted account, so Step 1 below is a no-op today -- kept
-- anyway as a defensive de-identification pass for any future replay.

-- Step 1: de-identify existing rows belonging to already-deleted accounts
-- (created before this FK existed, under the old no-cleanup behavior).
UPDATE public.devotional_metrics dm
SET user_id = NULL
WHERE user_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM auth.users u WHERE u.id = dm.user_id);

-- Step 2: the column must be nullable for ON DELETE SET NULL to ever apply.
ALTER TABLE public.devotional_metrics ALTER COLUMN user_id DROP NOT NULL;

-- Step 3: add the FK.
ALTER TABLE public.devotional_metrics
  ADD CONSTRAINT devotional_metrics_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
