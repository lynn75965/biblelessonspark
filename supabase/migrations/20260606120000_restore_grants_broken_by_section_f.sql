-- 20260606120000_restore_grants_broken_by_section_f.sql
-- FIX (regression): restore authenticated SELECT on user_roles and modern_parables.
--
-- Root cause: migration 20260605100000 (Section F grant hardening, commit ed1a230)
-- did REVOKE ALL ON these tables FROM anon, authenticated, on the assumption that
-- they are reached only via SECURITY DEFINER helpers or service_role. That was
-- wrong for two access paths:
--
--   1. user_roles is read INLINE by RLS policies on other tables, e.g.
--      lessons "Admins can view all lessons" and profiles "Admins can view all
--      profiles": EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid()
--      AND role = 'admin'). Inline RLS subqueries run with the CALLER's
--      privileges, so revoking authenticated's SELECT made every authenticated
--      lessons/profiles query fail with "permission denied for table user_roles"
--      (SQLSTATE 42501). Admin.tsx also SELECTs user_roles directly.
--   2. modern_parables is read directly by the authenticated browser in
--      ParableGenerator.tsx (monthly usage count, .eq('user_id', user.id)).
--
-- Safety: RLS stays enabled on both tables and still row-filters --
--   user_roles: users_select_own (own row) + admin_full_access;
--   modern_parables: "Users can view own parables" (auth.uid() = user_id) +
--     "Admin can view all parables" via has_role() (SECURITY DEFINER).
-- So SELECT exposes only the caller's own rows -- no enumeration. anon stays
-- revoked (preserving the original anti-enumeration intent), and
-- INSERT/UPDATE/DELETE stay revoked from authenticated (writes go through
-- service_role / admin RPCs). The Section F revokes on all other tables are
-- left in place -- an audit confirmed no inline RLS subquery or direct
-- frontend query references them as anon/authenticated.
--
-- GRANT is idempotent: re-running this migration is harmless.

BEGIN;

GRANT SELECT ON public.user_roles      TO authenticated;
GRANT SELECT ON public.modern_parables TO authenticated;

COMMIT;
