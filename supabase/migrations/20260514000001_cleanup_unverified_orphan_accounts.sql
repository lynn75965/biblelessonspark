-- 20260514000001_cleanup_unverified_orphan_accounts.sql
-- Purpose: One-time cleanup of public.profiles rows that belong to auth.users
--          accounts which have never been verified and are older than 7 days.
--          These accumulated under the prior handle_new_user() behavior, which
--          created a profile on every signup regardless of verification state.
--
-- Scope:   public.profiles only.
--          auth.users rows are managed by Supabase Auth and must NOT be deleted
--          from a SQL migration. To purge the corresponding auth rows, use the
--          Supabase Dashboard (Authentication -> Users) or the admin API.
--
-- Threshold: 7 days. Matches the diagnostic baseline. Profiles tied to auth
--            accounts younger than 7 days remain in place so a teacher who is
--            slow to click the verification link is not punished.
--
-- Idempotent: re-running this migration after the orphan rows are gone is a
--             zero-row no-op.

DELETE FROM public.profiles
WHERE id IN (
  SELECT id
  FROM auth.users
  WHERE email_confirmed_at IS NULL
    AND created_at < now() - interval '7 days'
);
