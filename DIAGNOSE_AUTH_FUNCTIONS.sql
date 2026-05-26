-- DIAGNOSTIC ONLY -- READ ONLY -- NO SCHEMA CHANGES
-- Purpose: Read the actual bodies of the three auth.users trigger functions
-- and their trigger definitions verbatim, so the migration that modifies
-- handle_new_user() preserves every existing side effect and the plan's
-- assumption about on_email_verified can be confirmed (or disproved) before
-- we touch the live database.
--
-- HOW TO RUN:
--   1. Supabase Dashboard -> SQL Editor -> New query
--   2. Paste this entire file
--   3. Click "Run"
--   4. Paste the four result sets back to Claude Code
--
-- Zero writes. Safe to run anytime.

-- =========================================================================
-- A: Full body of handle_new_user()
--    We MUST preserve every side effect this function performs (not just
--    the profile INSERT) when we rewrite it.
-- =========================================================================
SELECT
  'A: handle_new_user() body' AS section,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'handle_new_user'
ORDER BY n.nspname;

-- =========================================================================
-- B: Full body of add_user_to_email_sequence()
--    Confirms (or disproves) the assumption that this function creates the
--    profile on email verification. If it does NOT, the plan needs a new
--    code path that creates the profile when email is verified.
-- =========================================================================
SELECT
  'B: add_user_to_email_sequence() body' AS section,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'add_user_to_email_sequence'
ORDER BY n.nspname;

-- =========================================================================
-- C: Full body of sync_user_email()
--    Likely unrelated to this fix but included so we know what fires when
--    a user changes their email -- in case it also touches profiles.
-- =========================================================================
SELECT
  'C: sync_user_email() body' AS section,
  n.nspname AS schema_name,
  p.proname AS function_name,
  pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname = 'sync_user_email'
ORDER BY n.nspname;

-- =========================================================================
-- D: Full trigger definitions for all three auth.users triggers,
--    including any WHEN (...) guard clauses we need to mirror.
-- =========================================================================
SELECT
  'D: auth.users trigger definitions' AS section,
  t.tgname                  AS trigger_name,
  pg_get_triggerdef(t.oid)  AS definition
FROM pg_trigger t
JOIN pg_class c    ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth'
  AND c.relname  = 'users'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- END OF DIAGNOSTIC SCRIPT
