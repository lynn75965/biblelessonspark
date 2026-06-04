-- =========================================================================
-- CLEANUP: drop the dead increment_parable_usage RPC
-- Applied 2026-06-03.
--
-- This SECURITY DEFINER function INSERTs into public.user_parable_usage, which
-- is a non-writable aggregating VIEW (SELECT user_id, count(*), max(created_at)
-- FROM parable_usage GROUP BY user_id) -- so it has ALWAYS errored when called.
-- No active code invokes it (only a .backup file referenced it); the live
-- parable 7/month cap counts modern_parables directly (FIX 69ad40d). It was
-- hardened in Migration 1 (20260531120000) and grant-adjusted in Migration 2
-- (20260531120100) only as part of the bulk passes, never as a working path.
-- Dropping it removes dead, broken surface.
-- =========================================================================

DROP FUNCTION IF EXISTS public.increment_parable_usage(uuid);
