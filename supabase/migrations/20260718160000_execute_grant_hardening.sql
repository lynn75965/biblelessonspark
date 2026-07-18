-- 20260718160000_execute_grant_hardening.sql
-- SECURITY: least-privilege EXECUTE hardening -- functions across public
-- schema. Direct sequel to the grant hardening sweep (Rule #36, commit
-- 91e2459), which closed table/view grants and logged the functions/
-- EXECUTE gap. Extends the June migration
-- (20260531120100_security_definer_execute_revoke.sql, 40 functions) to
-- the remaining functions created since June 3 that never got audited.
--
-- SCOPE BOUNDARY: EXECUTE grants only. Zero function bodies touched,
-- redefined, or backfilled -- Item C (backfilling routine bodies into
-- migration files) remains its own deferred session.
--
-- Full inventory verified live: 71 public-schema functions (50+
-- SECURITY DEFINER, matching the June audit's ~55-routine count plus
-- growth since). Of these, June's 40-function sweep remains correct and
-- unchanged (spot-verified: RLS-helper functions like get_managed_org_ids,
-- is_org_manager, is_team_lead_of, get_user_org_id are still genuinely
-- referenced inside live RLS policy USING clauses today). Everything
-- else created since June 3 was already born correctly narrow (no
-- PUBLIC/anon leakage) EXCEPT the 8 functions below.
--
-- REVOKE/GRANT are idempotent: re-running this migration is harmless.

BEGIN;

-- -------------------------------------------------------------------------
-- invite_team_member: real, live authenticated-only RPC
-- (useTeachingTeam.tsx:429 -- team lead inviting a member; SECURITY
-- DEFINER, DB-enforces the team cap). Currently PUBLIC+anon+authenticated
-- -- revoke PUBLIC and anon, keep authenticated.
-- -------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.invite_team_member(uuid, uuid) FROM PUBLIC, anon;

-- -------------------------------------------------------------------------
-- Trigger functions created after the June 3 sweep -- never audited.
-- Same treatment as June's B-7 category: these run via Postgres triggers,
-- which use the table-owner's privileges, not the caller's. Revoking
-- EXECUTE does not stop the trigger from firing; it only blocks direct
-- invocation via the Data API. No legitimate caller exists outside the
-- trigger system for any of the 7 below.
-- -------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.check_max_profiles_per_user()      FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_profile()    FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_tenant_config_updated_at()     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_branding_config_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_feedback_questions_timestamp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_modern_parables_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_teacher_profile_updated_at() FROM PUBLIC, anon, authenticated;

-- -------------------------------------------------------------------------
-- FUTURE FUNCTIONS: born locked. Supabase explicitly provisions default
-- EXECUTE grants to PUBLIC, anon, AND authenticated on every new function
-- created by the postgres role (verified via pg_default_acl -- this goes
-- beyond plain PostgreSQL's implicit PUBLIC-only default). After this,
-- a new function needs an EXPLICIT GRANT EXECUTE TO <role> in its own
-- migration, matching what the June migration and Rule #36 already
-- require for every RPC and table respectively.
--
-- service_role is deliberately NOT revoked -- it must retain default
-- access to new functions, matching its existing blanket access
-- everywhere else in the schema.
--
-- A separate default ACL exists for `supabase_admin` (verified via
-- pg_default_acl) that this statement does NOT alter -- same documented
-- gap as Rule #36's table-sweep note: that role is not this project's
-- actual function-creation path (Rule #20 mandates migration files,
-- executed as postgres), and altering it was not verified safe.
-- -------------------------------------------------------------------------
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC, anon, authenticated;

COMMIT;
