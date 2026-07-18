-- ============================================================================
-- ROLLBACK SCRIPT -- NOT A MIGRATION.
-- Do NOT place this file in supabase/migrations/ -- `npx supabase db push
-- --linked` only applies files in that directory, and this script is
-- deliberately kept out of it so it is never accidentally applied.
--
-- Companion to: supabase/migrations/20260718150000_grant_hardening_sweep.sql
--
-- Restores the exact pre-migration grant state (full Supabase-default
-- suite on the tables that had it, Section F's original narrower state
-- on the 6 Category-2 tables). Run manually only if the grant hardening
-- sweep breaks a live user flow post-deploy:
--
--   npx supabase db query --linked --file scripts/rollback_20260718150000_grant_hardening_sweep.sql
--
-- (or paste directly via `npx supabase db query --linked "<sql>"` for a
-- single-table emergency restore instead of the full rollback.)
-- ============================================================================

BEGIN;

-- ---- Category 2: restore Section F's original state (anon already
-- ---- correctly zero from Section F, unchanged; authenticated back to
-- ---- full default) ----
GRANT ALL ON public.events                   TO authenticated;
GRANT ALL ON public.notifications            TO authenticated;
GRANT ALL ON public.feedback_questions       TO authenticated;
GRANT ALL ON public.generation_metrics       TO authenticated;
GRANT ALL ON public.toolbelt_email_captures  TO authenticated;
GRANT ALL ON public.toolbelt_email_templates TO authenticated;

-- ---- Category 2 addendum: toolbelt_usage restores to its PRE-migration
-- ---- state, which was ZERO grants for both roles (this migration is
-- ---- what FIXED the toolbelt_usage bug -- rolling back re-breaks the
-- ---- admin Toolbelt Usage Report, restoring the pre-existing bug, not
-- ---- new breakage). blog_posts and email_sequence_templates restore to
-- ---- their prior full-default state like everything else below. ----
REVOKE ALL ON public.toolbelt_usage FROM anon, authenticated;
GRANT ALL ON public.blog_posts                TO anon, authenticated;
GRANT ALL ON public.email_sequence_templates   TO anon, authenticated;

-- ---- Category 3a: restore full default to both roles ----
GRANT ALL ON public.bible_versions        TO anon, authenticated;
GRANT ALL ON public.branding_config       TO anon, authenticated;
GRANT ALL ON public.credits_ledger        TO anon, authenticated;
GRANT ALL ON public.devotional_metrics    TO anon, authenticated;
GRANT ALL ON public.devotional_usage      TO anon, authenticated;
GRANT ALL ON public.organization_contacts TO anon, authenticated;
GRANT ALL ON public.organization_focus    TO anon, authenticated;
GRANT ALL ON public.outputs               TO anon, authenticated;
GRANT ALL ON public.parable_usage         TO anon, authenticated;
GRANT ALL ON public.refinements           TO anon, authenticated;
GRANT ALL ON public.tier_config           TO anon, authenticated;
GRANT ALL ON public.user_parable_usage    TO anon, authenticated;

-- ---- Category 3b: restore full default to both roles ----
GRANT ALL ON public.beta_feedback_view       TO anon, authenticated;
GRANT ALL ON public.production_feedback_view TO anon, authenticated;

-- ---- Category 3c: restore full default to both roles ----
GRANT ALL ON public.profiles                   TO anon, authenticated;
GRANT ALL ON public.lessons                    TO anon, authenticated;
GRANT ALL ON public.lesson_series              TO anon, authenticated;
GRANT ALL ON public.organizations              TO anon, authenticated;
GRANT ALL ON public.organization_members       TO anon, authenticated;
GRANT ALL ON public.invites                    TO anon, authenticated;
GRANT ALL ON public.devotional_series          TO anon, authenticated;
GRANT ALL ON public.teacher_preference_profiles TO anon, authenticated;
GRANT ALL ON public.teaching_teams             TO anon, authenticated;
GRANT ALL ON public.setup_progress             TO anon, authenticated;
GRANT ALL ON public.email_rosters              TO anon, authenticated;
GRANT ALL ON public.org_shared_focus           TO anon, authenticated;
GRANT ALL ON public.beta_feedback              TO anon, authenticated;
GRANT ALL ON public.feedback                   TO anon, authenticated;

-- ---- Category 3d: restore full default to both roles ----
GRANT ALL ON public.devotionals           TO anon, authenticated;
GRANT ALL ON public.user_subscriptions    TO anon, authenticated;
GRANT ALL ON public.teaching_team_members TO anon, authenticated;
GRANT ALL ON public.transfer_requests     TO anon, authenticated;
GRANT ALL ON public.beta_testers          TO anon, authenticated;

-- ---- Category 3e: restore full default to both roles ----
GRANT ALL ON public.system_settings TO anon, authenticated;
GRANT ALL ON public.tenant_config   TO anon, authenticated;

-- ---- Future tables: restore Supabase's original auto-grant default ----
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated;

COMMIT;
