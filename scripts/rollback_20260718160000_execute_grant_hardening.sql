-- ============================================================================
-- ROLLBACK SCRIPT -- NOT A MIGRATION.
-- Do NOT place this file in supabase/migrations/ -- `npx supabase db push
-- --linked` only applies files in that directory, and this script is
-- deliberately kept out of it so it is never accidentally applied.
--
-- Companion to: supabase/migrations/20260718160000_execute_grant_hardening.sql
--
-- Restores the exact pre-migration EXECUTE grant state. Run manually only
-- if the EXECUTE hardening breaks a live user flow post-deploy:
--
--   npx supabase db query --linked --file scripts/rollback_20260718160000_execute_grant_hardening.sql
-- ============================================================================

BEGIN;

-- Restore invite_team_member to PUBLIC+anon+authenticated.
GRANT EXECUTE ON FUNCTION public.invite_team_member(uuid, uuid) TO PUBLIC;

-- Restore the 7 trigger functions to PUBLIC+anon+authenticated.
GRANT EXECUTE ON FUNCTION public.check_max_profiles_per_user()       TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_single_default_profile()     TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_tenant_config_updated_at()      TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_branding_config_updated_at() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_feedback_questions_timestamp() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_modern_parables_updated_at() TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_teacher_profile_updated_at() TO PUBLIC;

-- Restore Supabase's original default: new functions auto-grant EXECUTE
-- to PUBLIC, anon, and authenticated again.
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT EXECUTE ON FUNCTIONS TO PUBLIC, anon, authenticated;

COMMIT;
