-- 20260718120000_feedback_popup_eligibility.sql
-- Feedback popup trigger fix: server-authoritative eligibility, replacing the
-- localStorage modulo-5 counter previously in Dashboard.tsx.
--
-- Popup eligibility (should_show_feedback_popup) requires ALL of:
--   1. profiles.first_lesson_generated_at is still NULL for this user (see
--      below for exactly when/how this gets stamped).
--   2. At the moment it gets stamped, this user's non-reshape lesson count
--      is exactly 1 (a genuine first-timer) rather than >1 (a pre-existing
--      user backfilling the flag retroactively, who is marked ineligible
--      since their real first-lesson moment already passed before this
--      column existed).
--   3. No existing row in public.feedback for this user (idx_feedback_user_id
--      makes this an indexed lookup, not a table scan).
--   4. profiles.feedback_popup_dismissed is not true.
--
-- first_lesson_generated_at is written inside should_show_feedback_popup()
-- itself, exactly once per user, the first time that RPC is called for them
-- with at least one non-reshape lesson already on record. Once stamped, all
-- future calls short-circuit to false immediately -- this is what makes the
-- "never appear again" rule survive a later deletion of that first lesson
-- (a live COUNT alone would reset to 1 and re-trigger the popup after a
-- delete-then-regenerate; the timestamp does not).
--
-- Posture mirrors the Teaching Team resolvers (20260616170000): SECURITY
-- DEFINER, fixed search_path, EXECUTE revoked from PUBLIC/anon and granted
-- to authenticated only. auth.uid() is the security boundary inside each
-- function body -- a caller can only ever read/write their own row.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS feedback_popup_dismissed boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_lesson_generated_at timestamp with time zone;

-- ============================================================================
-- should_show_feedback_popup() -- eligibility check + one-time lifetime stamp
-- ============================================================================
CREATE OR REPLACE FUNCTION public.should_show_feedback_popup()
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_user_id uuid := auth.uid();
  v_first_lesson_at timestamp with time zone;
  v_dismissed boolean;
  v_lesson_count integer;
  v_has_feedback boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT first_lesson_generated_at, feedback_popup_dismissed
  INTO v_first_lesson_at, v_dismissed
  FROM public.profiles
  WHERE id = v_user_id;

  IF v_first_lesson_at IS NOT NULL THEN
    -- First-lesson moment already resolved (shown before, or backfilled for
    -- a pre-existing user). Never eligible again past this point.
    RETURN false;
  END IF;

  SELECT COUNT(*) INTO v_lesson_count
  FROM public.lessons
  WHERE user_id = v_user_id
    AND reshape_of IS NULL;

  IF v_lesson_count = 0 THEN
    -- Defensive: this RPC is only ever called right after a successful
    -- generation, so this should not happen. Do not stamp yet -- wait for
    -- the real first-lesson call.
    RETURN false;
  END IF;

  -- Stamp exactly once, right now, regardless of the count value below.
  UPDATE public.profiles
  SET first_lesson_generated_at = now()
  WHERE id = v_user_id;

  IF v_lesson_count <> 1 THEN
    -- Pre-existing user with lesson history already on record: their real
    -- first-lesson moment already passed before this feature existed.
    RETURN false;
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.feedback WHERE user_id = v_user_id
  ) INTO v_has_feedback;

  IF v_has_feedback THEN
    RETURN false;
  END IF;

  RETURN COALESCE(v_dismissed, false) = false;
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.should_show_feedback_popup() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.should_show_feedback_popup() FROM anon;
GRANT  EXECUTE ON FUNCTION public.should_show_feedback_popup() TO authenticated;

-- ============================================================================
-- dismiss_feedback_popup() -- caller permanently suppresses their own popup
-- ============================================================================
-- Security boundary: WHERE id = auth.uid() -- a caller can only ever set
-- their own flag. A dismissal is a permanent "no," per business rule 2.
CREATE OR REPLACE FUNCTION public.dismiss_feedback_popup()
RETURNS void
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  UPDATE public.profiles
  SET feedback_popup_dismissed = true
  WHERE id = auth.uid();
END;
$fn$;

REVOKE EXECUTE ON FUNCTION public.dismiss_feedback_popup() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.dismiss_feedback_popup() FROM anon;
GRANT  EXECUTE ON FUNCTION public.dismiss_feedback_popup() TO authenticated;

COMMIT;
