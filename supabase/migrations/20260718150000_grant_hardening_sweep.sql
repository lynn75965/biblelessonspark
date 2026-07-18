-- 20260718150000_grant_hardening_sweep.sql
-- SECURITY: least-privilege grant hardening -- anon/authenticated across
-- public schema. Extends the Section F posture (20260605100000) to the
-- ENTIRE schema.
--
-- Section F revoked the full Supabase-default grant suite
-- (DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE) on 23 tables,
-- but on 6 of them (events, notifications, feedback_questions,
-- generation_metrics, toolbelt_email_captures, toolbelt_email_templates)
-- it only removed anon, leaving authenticated at the full default suite.
-- This migration finishes that narrowing and extends the same discipline
-- to every remaining public-schema table.
--
-- Every grant below is derived from what application code ACTUALLY does
-- per table (grep across src/ and supabase/functions/, cross-checked
-- against RLS policies and pg_policies), not from what RLS merely
-- permits. Full evidence trail: PROJECT_MASTER.md, grant hardening
-- sweep session, July 18 2026. RLS remains the real authorization
-- boundary in every case -- these grants are defense-in-depth so a
-- future RLS mistake is not a full write compromise via the PostgREST
-- Data API.
--
-- Column-limited exception (untouched by this migration): guardrail_
-- violations and guardrail_suppressions already carry precise,
-- column-limited grants from the July 17 review-system work (Rule #32
-- precedent) -- role_table_grants hides column-limited grants entirely,
-- which is why they show as "SELECT only" in a naive query. Verified via
-- role_column_grants before writing this migration; both are correct
-- as-is.
--
-- Sequences: zero anon/authenticated sequence grants exist today (this
-- schema uses UUID primary keys throughout, no serial/bigserial
-- columns) -- nothing to revoke, but the ALTER DEFAULT PRIVILEGES clause
-- at the end covers sequences too for forward-compatibility.
--
-- REVOKE/GRANT are idempotent: re-running this migration is harmless.

BEGIN;

-- ============================================================
-- CATEGORY 2: finish Section F's authenticated-side narrowing.
-- anon is already zero on all 6 (Section F, 20260605100000); the
-- REVOKE ALL FROM anon below is defensive/idempotent, not a new action.
-- ============================================================

-- events: admin_full_access is RLS-gated to admin role; the only live
-- non-admin read path is AdminSecurityPanel.tsx (SELECT only).
REVOKE ALL ON public.events FROM anon, authenticated;
GRANT SELECT ON public.events TO authenticated;

-- notifications: notifications-list/notifications-mark-read edge
-- functions run as the caller's own JWT (SELECT, UPDATE read_at).
-- INSERT is service_role only (seed-notifications, seed-test-
-- notifications) and bypasses these grants entirely.
REVOKE ALL ON public.notifications FROM anon, authenticated;
GRANT SELECT, UPDATE ON public.notifications TO authenticated;

-- feedback_questions: FeedbackQuestionsManager.tsx does full admin CRUD.
-- Public/anon reads go through the get_feedback_questions() SECURITY
-- DEFINER RPC, which bypasses grants entirely -- anon needs nothing here.
REVOKE ALL ON public.feedback_questions FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_questions TO authenticated;

-- generation_metrics: SystemAnalyticsDashboard.tsx SELECT only.
REVOKE ALL ON public.generation_metrics FROM anon, authenticated;
GRANT SELECT ON public.generation_metrics TO authenticated;

-- toolbelt_email_captures: ToolbeltEmailCaptures.tsx SELECT only. RLS
-- carries a dormant "Admins can update" policy with zero corroborating
-- code found anywhere -- NOT granting UPDATE. If that feature is real
-- and just not yet grepped correctly, it will surface as a clean
-- "permission denied" (Rule #32) rather than a silent data issue, and
-- the fix is a one-line GRANT, not a re-audit.
REVOKE ALL ON public.toolbelt_email_captures FROM anon, authenticated;
GRANT SELECT ON public.toolbelt_email_captures TO authenticated;

-- toolbelt_email_templates: ToolbeltEmailManager.tsx full admin CRUD.
REVOKE ALL ON public.toolbelt_email_templates FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.toolbelt_email_templates TO authenticated;

-- ============================================================
-- CATEGORY 2 (addendum): found during post-approval verification --
-- toolbelt_usage has ZERO grants for either role today, yet
-- ToolbeltUsageReport.tsx:41 does a live admin SELECT against it. This
-- is a pre-existing production bug (Rule #32 pattern), not something
-- this migration introduces -- fixed here. Writer is 3 service-role edge
-- functions (send-toolbelt-reflection, send-toolbelt-sequence,
-- toolbelt-reflect), matching toolbelt_email_captures' pattern exactly.
-- ============================================================

REVOKE ALL ON public.toolbelt_usage FROM anon, authenticated;
GRANT SELECT ON public.toolbelt_usage TO authenticated;

-- blog_posts: admin (BlogPreviewPanel.tsx) does SELECT/UPDATE/DELETE --
-- no client-side INSERT found; posts are created via the
-- create-blog-post edge function (service_role). Public pages
-- (Blog.tsx, BlogPost.tsx) do SELECT only, filtered to published=true.
REVOKE ALL ON public.blog_posts FROM anon, authenticated;
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT, UPDATE, DELETE ON public.blog_posts TO authenticated;

-- email_sequence_templates: EmailSequenceManager.tsx full admin CRUD.
REVOKE ALL ON public.email_sequence_templates FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_sequence_templates TO authenticated;

-- ============================================================
-- CATEGORY 3a: zero live frontend usage anywhere -- revoke to zero for
-- both roles. Edge-function/service-role-only, or dead.
-- ============================================================

REVOKE ALL ON public.bible_versions        FROM anon, authenticated;
REVOKE ALL ON public.branding_config       FROM anon, authenticated;
REVOKE ALL ON public.credits_ledger        FROM anon, authenticated;
REVOKE ALL ON public.devotional_metrics    FROM anon, authenticated;
REVOKE ALL ON public.devotional_usage      FROM anon, authenticated;
REVOKE ALL ON public.organization_contacts FROM anon, authenticated;
REVOKE ALL ON public.organization_focus    FROM anon, authenticated;
REVOKE ALL ON public.outputs               FROM anon, authenticated;
REVOKE ALL ON public.parable_usage         FROM anon, authenticated;
REVOKE ALL ON public.refinements           FROM anon, authenticated;
REVOKE ALL ON public.tier_config           FROM anon, authenticated;

-- user_parable_usage: a VIEW. Its own consumer's code comment
-- (ParableGenerator.tsx) calls it "the old user_parable_usage view" --
-- confirmed dead, not just unused.
REVOKE ALL ON public.user_parable_usage FROM anon, authenticated;

-- ============================================================
-- CATEGORY 3b: admin-read-only views.
-- ============================================================

REVOKE ALL ON public.beta_feedback_view FROM anon, authenticated;
GRANT SELECT ON public.beta_feedback_view TO authenticated;

REVOKE ALL ON public.production_feedback_view FROM anon, authenticated;
GRANT SELECT ON public.production_feedback_view TO authenticated;

-- ============================================================
-- CATEGORY 3c: full user-owned-row CRUD, authenticated only, zero anon.
-- Matches each table's "ALL" RLS policy shape (admin_full_access +
-- individual users_*_own policies); INSERT/SELECT/UPDATE/DELETE
-- spot-verified via grep across src/.
-- ============================================================

REVOKE ALL ON public.profiles                     FROM anon, authenticated;
REVOKE ALL ON public.lessons                       FROM anon, authenticated;
REVOKE ALL ON public.lesson_series                 FROM anon, authenticated;
REVOKE ALL ON public.organizations                 FROM anon, authenticated;
REVOKE ALL ON public.organization_members          FROM anon, authenticated;
REVOKE ALL ON public.invites                       FROM anon, authenticated;
REVOKE ALL ON public.devotional_series             FROM anon, authenticated;
REVOKE ALL ON public.teacher_preference_profiles   FROM anon, authenticated;
REVOKE ALL ON public.teaching_teams                FROM anon, authenticated;
REVOKE ALL ON public.setup_progress                FROM anon, authenticated;
REVOKE ALL ON public.email_rosters                 FROM anon, authenticated;
REVOKE ALL ON public.org_shared_focus              FROM anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles                   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lessons                    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lesson_series              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organizations              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.organization_members       TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invites                    TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devotional_series          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_preference_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teaching_teams             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.setup_progress             TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_rosters              TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_shared_focus           TO authenticated;

-- beta_feedback / feedback: RLS has only users_insert_own + users_select_own
-- for non-admin -- no user-facing UPDATE/DELETE policy exists on either.
REVOKE ALL ON public.beta_feedback FROM anon, authenticated;
GRANT SELECT, INSERT ON public.beta_feedback TO authenticated;

REVOKE ALL ON public.feedback FROM anon, authenticated;
GRANT SELECT, INSERT ON public.feedback TO authenticated;

-- ============================================================
-- CATEGORY 3d: narrower than full CRUD -- verified precisely.
-- ============================================================

-- devotionals: INSERT happens server-side only
-- (generate-devotional/index.ts, service_role) -- the client never
-- inserts. DevotionalLibrary.tsx does UPDATE (series reordering) and
-- DELETE; useDevotionals.ts does SELECT and DELETE.
REVOKE ALL ON public.devotionals FROM anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.devotionals TO authenticated;

-- user_subscriptions: SELECT only (useSetupProgress.tsx, OrgSetup.tsx).
-- RLS has no user-facing write policy at all -- real writes are the
-- Stripe webhook (service_role), never the client.
REVOKE ALL ON public.user_subscriptions FROM anon, authenticated;
GRANT SELECT ON public.user_subscriptions TO authenticated;

-- teaching_team_members: SELECT + DELETE (useTeachingTeam.tsx). No
-- client INSERT found -- membership creation goes through an
-- invite-accept RPC (SECURITY DEFINER, bypasses grants).
REVOKE ALL ON public.teaching_team_members FROM anon, authenticated;
GRANT SELECT, DELETE ON public.teaching_team_members TO authenticated;

-- transfer_requests: SELECT, INSERT, UPDATE (MyOrganizationSection.tsx).
-- No DELETE RLS policy exists for non-admin -- matches code exactly.
REVOKE ALL ON public.transfer_requests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.transfer_requests TO authenticated;

-- beta_testers: RLS has only users_select_own for non-admin; all writes
-- are admin-only.
REVOKE ALL ON public.beta_testers FROM anon, authenticated;
GRANT SELECT ON public.beta_testers TO authenticated;

-- ============================================================
-- CATEGORY 3e: non-sensitive public config -- anon needs SELECT,
-- matching explicit {public}/{anon} RLS policies.
-- ============================================================

-- system_settings: "Public read access" RLS policy is explicitly
-- {public}. useSystemSettings.ts (SELECT, UPDATE) and
-- useExportSettings.ts (SELECT, INSERT, UPDATE) are the only writers,
-- both authenticated-admin-gated by RLS.
REVOKE ALL ON public.system_settings FROM anon, authenticated;
GRANT SELECT ON public.system_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.system_settings TO authenticated;

-- tenant_config: RLS policy tenant_config_read is explicitly
-- {anon,authenticated}. TenantBrandingPanel.tsx (admin) does SELECT +
-- UPDATE.
REVOKE ALL ON public.tenant_config FROM anon, authenticated;
GRANT SELECT ON public.tenant_config TO anon;
GRANT SELECT, UPDATE ON public.tenant_config TO authenticated;

-- ============================================================
-- FUTURE TABLES: born least-privilege. Every schema change in this
-- project goes through a migration file executed via `db push` (Rule
-- #20), which runs as the `postgres` role -- this covers that real
-- table-creation path. A separate default ACL exists for
-- `supabase_admin` (verified via pg_default_acl) that this statement
-- does NOT alter; that role is not this project's actual table-creation
-- path, and altering it was not verified safe -- documented gap, not
-- silently claimed as covered.
-- ============================================================

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON TABLES FROM anon, authenticated;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public
  REVOKE ALL ON SEQUENCES FROM anon, authenticated;

COMMIT;
