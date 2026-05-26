-- DIAGNOSTIC ONLY -- READ ONLY -- NO SCHEMA CHANGES
-- Purpose: Decide whether a profiles BEFORE INSERT trigger would help or break
-- the live system, and how big the orphan-duplicate problem actually is.
--
-- HOW TO RUN:
--   1. Supabase Dashboard -> SQL Editor -> New query
--   2. Paste this entire file
--   3. Click "Run"
--   4. Each section returns its own result set -- scroll through them
--   5. Paste the results back to Claude Code for analysis
--
-- This script makes ZERO writes. Safe to run anytime.

-- =========================================================================
-- Q1: Does a handle_new_user (or similar) trigger already exist on auth.users?
--      If YES -- a profiles BEFORE INSERT block would reject every new signup.
--      If NO  -- profiles are created elsewhere (frontend, edge function, etc.)
-- =========================================================================
SELECT
  'Q1: triggers on auth.users' AS section,
  t.tgname        AS trigger_name,
  t.tgenabled     AS enabled,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'auth'
  AND c.relname  = 'users'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- =========================================================================
-- Q2: What columns does public.profiles actually have?
--      Confirms whether an 'email' column exists today.
-- =========================================================================
SELECT
  'Q2: public.profiles columns' AS section,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name   = 'profiles'
ORDER BY ordinal_position;

-- =========================================================================
-- Q3: Existing triggers already on public.profiles
--      Avoid clobbering anything already in place.
-- =========================================================================
SELECT
  'Q3: triggers on public.profiles' AS section,
  t.tgname        AS trigger_name,
  t.tgenabled     AS enabled,
  pg_get_triggerdef(t.oid) AS definition
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relname  = 'profiles'
  AND NOT t.tgisinternal
ORDER BY t.tgname;

-- =========================================================================
-- Q4a: How many UNVERIFIED auth.users records exist right now?
--       This is the "orphan" population the proposed fix targets.
-- =========================================================================
SELECT
  'Q4a: unverified auth.users counts' AS section,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL)                                              AS total_unverified,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL AND created_at < now() - interval '24 hours') AS unverified_older_than_24h,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NULL AND created_at < now() - interval '7 days')   AS unverified_older_than_7d,
  COUNT(*) FILTER (WHERE email_confirmed_at IS NOT NULL)                                          AS total_verified
FROM auth.users;

-- =========================================================================
-- Q4b: How many emails appear MORE THAN ONCE across auth.users
--       (the symptom the task is trying to prevent)?
-- =========================================================================
SELECT
  'Q4b: duplicate emails in auth.users' AS section,
  LOWER(email) AS email_lower,
  COUNT(*)     AS account_count,
  SUM(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 ELSE 0 END) AS verified_count,
  SUM(CASE WHEN email_confirmed_at IS NULL     THEN 1 ELSE 0 END) AS unverified_count,
  MIN(created_at) AS first_created,
  MAX(created_at) AS last_created
FROM auth.users
WHERE email IS NOT NULL
GROUP BY LOWER(email)
HAVING COUNT(*) > 1
ORDER BY account_count DESC, last_created DESC
LIMIT 50;

-- =========================================================================
-- Q4c: Of unverified auth.users -- how many have a corresponding profile row?
--       If unverified users already have profiles, a BEFORE INSERT trigger
--       won't retroactively help -- only a cleanup job will.
-- =========================================================================
SELECT
  'Q4c: unverified auth users with/without a profile' AS section,
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) AS unverified_WITH_profile,
  COUNT(*) FILTER (WHERE p.id IS NULL)     AS unverified_WITHOUT_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email_confirmed_at IS NULL;

-- =========================================================================
-- Q5: Is the auth.users.email column itself unique-indexed?
--      Supabase's default is a partial unique index; confirm what's there.
-- =========================================================================
SELECT
  'Q5: indexes on auth.users(email)' AS section,
  i.relname              AS index_name,
  pg_get_indexdef(ix.indexrelid) AS index_definition
FROM pg_index ix
JOIN pg_class  i ON i.oid = ix.indexrelid
JOIN pg_class  t ON t.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = t.relnamespace
WHERE n.nspname = 'auth'
  AND t.relname  = 'users'
  AND EXISTS (
    SELECT 1
    FROM pg_attribute a
    WHERE a.attrelid = t.oid
      AND a.attnum   = ANY(ix.indkey)
      AND a.attname  = 'email'
  )
ORDER BY i.relname;

-- END OF DIAGNOSTIC SCRIPT
