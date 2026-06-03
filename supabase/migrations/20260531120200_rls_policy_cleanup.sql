-- =========================================================================
-- MIGRATION 3 -- RLS POLICY CLEANUP
-- Applied 2026-06-03, after Migrations 1 (body hardening) and 2 (EXECUTE
-- revoke). Closes the remaining anon exposures and drops the no-op
-- service_role policies surfaced by Section C. Includes two drift fixes
-- found during the 2026-06-03 pre-apply check (see DRIFT ADDITIONS below).
-- =========================================================================
--
-- WHAT
--   Closes real anon exposures and removes ~25 no-op policies surfaced
--   by section C of the diagnostic. After this migration the Supabase
--   Security Advisor "Policy Always True" warning count drops sharply.
--
-- WHY
--   See SECURITY_ADVISOR_C_FINDINGS.md. The changes here are all
--   Category 2 ("Safe to Harden") -- either real anon-readable / writable
--   policies that do not match current app behavior, OR service_role
--   policies whose USING (true) is a no-op because service_role bypasses
--   RLS in Postgres anyway.
--
-- WHAT IS NOT IN THIS MIGRATION
--   - The 18 hardcoded-UUID admin_full_access policies. Per CLAUDE.md
--     Rule #25 (2026-05-31), those are intentionally retained until Lynn
--     adds a second admin. NO CHANGE.
--   - The ~50 policies that use TO public where TO authenticated was
--     meant. Functionally equivalent today; tighten in a separate
--     maintenance migration.
--   - The duplicate / overlapping SELECT policies on organizations,
--     invites, user_subscriptions. Out of scope here.
--   - tier_config table fate. Independent decision.
--
-- ROLLBACK
--   Each section below contains the original CREATE POLICY statements
--   the diagnostic captured on 2026-05-31. Re-run those to restore.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- FINDING 2a -- DROP anonymous_parable_usage anon SELECT and INSERT
--   The edge function `generate-parable` uses service_role to write;
--   the frontend never queries this table. No legitimate anon caller.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS anon_can_select_usage ON public.anonymous_parable_usage;
DROP POLICY IF EXISTS anon_can_insert_usage ON public.anonymous_parable_usage;

-- -------------------------------------------------------------------------
-- FINDING 2b -- DROP pricing_plans duplicate permissive SELECT
--   Two SELECT policies exist:
--     "Anyone can read active pricing plans"  USING (is_active = true)
--     "Anyone can view pricing plans"         USING (true)
--   The second nullifies the first by allowing inactive/draft plans through.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone can view pricing plans" ON public.pricing_plans;

-- -------------------------------------------------------------------------
-- FINDING 3a -- DROP toolbelt_email_templates mislabeled "service role" SELECT
--   The policy is named "Service role can read" but targets {public},
--   which grants every anon visitor read access. The "Admins full
--   access to toolbelt_email_templates" policy gates legitimate admin
--   reads/writes via has_role.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can read toolbelt_email_templates"
  ON public.toolbelt_email_templates;

-- -------------------------------------------------------------------------
-- FINDING 3b -- DROP toolbelt_email_tracking mislabeled "service role" ALL
--   Same problem: policy targets {public} not {service_role}, granting
--   anon read/write of the email tracking log. Service_role bypasses
--   RLS already; the "Admins full access" policy covers admins.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role can manage toolbelt_email_tracking"
  ON public.toolbelt_email_tracking;

-- -------------------------------------------------------------------------
-- FINDING 3c -- RESTRICT email_sequence_templates to authenticated reads
--   Lynn 2026-05-31: templates should be readable by signed-in users
--   only, not by anonymous visitors. The "Admins full access" policy
--   continues to gate writes via profiles.role = 'admin'.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read access" ON public.email_sequence_templates;
CREATE POLICY "Authenticated read access"
  ON public.email_sequence_templates
  FOR SELECT TO authenticated
  USING (true);

-- -------------------------------------------------------------------------
-- FINDING 4 -- DROP no-op service_role policies
--   service_role bypasses RLS in Postgres. Policies USING (true) WITH
--   CHECK (true) FOR service_role document intent only and trigger
--   "Policy Always True" warnings. Dropping them is a no-op for the
--   service_role caller and silences ~25 advisor findings.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS service_role_access ON public.admin_audit;
DROP POLICY IF EXISTS service_role_access ON public.app_settings;
DROP POLICY IF EXISTS service_role_access ON public.beta_feedback;
DROP POLICY IF EXISTS service_role_access ON public.beta_testers;
DROP POLICY IF EXISTS "Service role full access to blog posts"   ON public.blog_posts;
DROP POLICY IF EXISTS service_role_access ON public.credits_ledger;
DROP POLICY IF EXISTS service_role_access ON public.events;
DROP POLICY IF EXISTS service_role_access ON public.feedback;
DROP POLICY IF EXISTS "Service role can insert violations"        ON public.guardrail_violations;
DROP POLICY IF EXISTS service_role_access ON public.invites;
DROP POLICY IF EXISTS service_role_access ON public.lessons;
DROP POLICY IF EXISTS "Service role full access"                   ON public.modern_parables;
DROP POLICY IF EXISTS service_role_access ON public.notifications;
DROP POLICY IF EXISTS service_role_access ON public.organization_contacts;
DROP POLICY IF EXISTS "Service role full access to organization_focus"  ON public.organization_focus;
DROP POLICY IF EXISTS "Service role full access to organizations"       ON public.organizations;
DROP POLICY IF EXISTS service_role_access ON public.organizations;
DROP POLICY IF EXISTS service_role_access ON public.outputs;
DROP POLICY IF EXISTS service_role_access ON public.profiles;
DROP POLICY IF EXISTS service_role_access ON public.rate_limits;
DROP POLICY IF EXISTS service_role_access ON public.refinements;
DROP POLICY IF EXISTS service_role_access ON public.setup_progress;
DROP POLICY IF EXISTS service_role_access ON public.stripe_events;
DROP POLICY IF EXISTS service_role_access ON public.subscription_plans;
DROP POLICY IF EXISTS service_role_access ON public.user_roles;
DROP POLICY IF EXISTS service_role_access ON public.user_subscriptions;

-- -------------------------------------------------------------------------
-- DRIFT ADDITIONS (found 2026-06-03 during the pre-apply policy check;
-- not in the original 2026-05-31 draft -- the live DB carried two more
-- policies matching patterns this migration already cleans up).
--
--   email_sequence_tracking."Service role full access" -- MISLABELED: the
--   policy NAME says service_role but its role is {public} with cmd ALL,
--   i.e. anonymous users can read/write the email-sequence tracking log via
--   the Data API. Same bug as Findings 3a/3b on the toolbelt_* tables. The
--   table is edge-function-only (service_role bypasses RLS), so dropping
--   this closes the anon exposure with no app impact.
--
--   organization_members.service_role_access -- a no-op service_role policy
--   the Finding 4 list missed; service_role bypasses RLS so it does nothing.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role full access" ON public.email_sequence_tracking;
DROP POLICY IF EXISTS service_role_access ON public.organization_members;

COMMIT;

-- =========================================================================
-- POST-DEPLOY VERIFICATION
--   1. Re-run DIAGNOSE_C_rls_policies.sql. Expected change:
--        - Policies count drops by ~30 (28 service_role no-ops + 4 finding
--          policies dropped + 1 added "Authenticated read access").
--        - PERMISSIVE_USING count for `qual = true` drops substantially.
--   2. Sign out completely. Reload home page. Confirm blog_posts published
--      rows still render (anon SELECT on `published = true`).
--   3. Sign in as a non-admin test account. Confirm:
--        - Anonymous parable generator still works (uses service_role path).
--        - Email templates load in admin UI (only Lynn should see this --
--          non-admin test account need not test).
--        - Toolbelt email capture form still accepts submissions (anon
--          INSERT on toolbelt_email_captures via its own intact policy).
--   4. Sign in as Lynn. Confirm:
--        - Email Sequence Manager loads templates.
--        - Toolbelt Email Manager loads templates and captures list.
--        - Marketing -> Blog Preview admin still loads drafts.
--   5. Edge functions exercise: send a test lesson email, generate a
--      devotional, generate a parable. All must succeed (service_role
--      bypasses every RLS policy regardless of these changes).
-- =========================================================================
