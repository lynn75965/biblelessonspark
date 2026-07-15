-- =========================================================================
-- MIGRATION -- RLS: TIGHTEN TO PUBLIC -> TO AUTHENTICATED (B5 item 3)
-- Closes item B deferred from the June Supabase Security Advisor audit
-- (SECURITY_ADVISOR_C_FINDINGS.md Finding 6 / Category 3 row 4).
-- =========================================================================
--
-- WHAT
--   Re-queried pg_policies fresh (2026-07-15) rather than trusting the
--   2026-05-31 CSV snapshot, since several sessions' worth of new tables
--   (devotionals, devotional_series, devotional_usage, devotional_metrics,
--   org_shared_focus, org_lesson_pack_purchases, org_onboarding_purchases,
--   reshape_metrics, transfer_requests, email_rosters) were added since
--   that snapshot and were never classified. Fresh query found 51 policies
--   currently TO public (not ~50/55 as originally estimated).
--
--   Of those 51:
--     - 10 stay TO public (legitimate pre-auth/boot-config/anon-intended
--       reads and inserts -- unchanged from the May 31 classification,
--       reconfirmed against live data).
--     - 2 are NEWLY DISCOVERED no-op service_role policies (same class as
--       the ~25 already dropped in Migration 3 / Finding 4 -- qual is
--       auth.role() = 'service_role', which service_role bypasses RLS for
--       regardless of policy content, making the policy pure documentation
--       that does nothing). These were added to devotional_usage and
--       user_subscriptions sometime after the May 31 snapshot. Dropped
--       here rather than retargeted, consistent with Migration 3's
--       decision on the original ~25.
--     - 39 are retargeted TO authenticated via ALTER POLICY (qual/
--       with_check untouched). Every one of the 39 was verified to have a
--       real auth-gated predicate (auth.uid() = ..., has_role(...),
--       profiles.role = 'admin', org-membership subquery) -- none is a
--       bare `true`. Zero behavior change: anon's auth.uid() is NULL, so
--       anon already failed every one of these predicates today. This
--       only narrows which Postgres role the policy is even evaluated
--       for, closing the Advisor's "role overreach" warning class.
--
-- WHY
--   Defense-in-depth. Not a live exposure today (verified above), but
--   `TO public` is a wildcard that includes anon + authenticated + any
--   future role: narrowing it removes a category of future risk if a
--   predicate is ever weakened without updating the role target too.
--
-- WHAT IS NOT IN THIS MIGRATION
--   - The 18 hardcoded-UUID admin_full_access policies (Rule #25 --
--     stays until a second admin is added).
--   - tier_config's public read policy (Rule #17 independent decision).
--   - Item C (backfilling ~55 live routine bodies into migration files)
--     -- zero security value, highest risk of the two June-deferred
--     items; recommended as its own session, not bundled here.
--   - The four RPCs revoked from `authenticated` on 2026-05-31
--     (allocate_monthly_credits, deduct_credits, cleanup_old_rate_limits,
--     debug_admin_check) were re-audited this session for a service-role
--     bypass matching the pattern found in sync-subscription-status
--     (deleted the prior session). Grepped every function in
--     supabase/functions/ for all four RPC names: zero matches. No
--     bypass exists today. No code change needed for that sub-item.
--
-- VERIFICATION BEFORE APPLYING
--   Fresh `pg_policies` query run via `npx supabase db query --linked`
--   immediately before drafting this file (read-only, Rule #20). If you
--   are applying this more than a day or two after it was drafted,
--   re-run the same query to check for further drift before pushing:
--     SELECT tablename, policyname, roles, cmd FROM pg_policies
--     WHERE schemaname = 'public' AND 'public' = ANY(roles)
--     ORDER BY tablename, policyname;
--
-- ROLLBACK
--   ALTER POLICY "<name>" ON public.<table> TO public;  -- for any of the 39
--   Re-run the original CREATE POLICY for the 2 dropped no-ops (both were
--   `FOR ALL TO public USING (auth.role() = 'service_role')`).
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- NEWLY DISCOVERED NO-OP SERVICE_ROLE POLICIES (same class as Migration 3
-- Finding 4 -- service_role bypasses RLS regardless of policy content)
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Service role manages devotional usage" ON public.devotional_usage;
DROP POLICY IF EXISTS "Service role manages subscriptions" ON public.user_subscriptions;

-- -------------------------------------------------------------------------
-- RETARGET TO public -> TO authenticated (qual/with_check unchanged)
-- -------------------------------------------------------------------------

-- devotional_metrics
ALTER POLICY "Admins can view all devotional metrics" ON public.devotional_metrics TO authenticated;

-- devotional_series
ALTER POLICY "Users can manage their own devotional series" ON public.devotional_series TO authenticated;

-- devotional_usage
ALTER POLICY "Admin full access to devotional usage" ON public.devotional_usage TO authenticated;
ALTER POLICY "Users can view own devotional usage" ON public.devotional_usage TO authenticated;

-- devotionals
ALTER POLICY "Admin full access to devotionals" ON public.devotionals TO authenticated;
ALTER POLICY "Users can create own devotionals" ON public.devotionals TO authenticated;
ALTER POLICY "Users can delete own devotionals" ON public.devotionals TO authenticated;
ALTER POLICY "Users can update own devotionals" ON public.devotionals TO authenticated;
ALTER POLICY "Users can view own devotionals" ON public.devotionals TO authenticated;

-- email_rosters
ALTER POLICY "Users can manage their own rosters" ON public.email_rosters TO authenticated;

-- email_sequence_templates
ALTER POLICY "Admins full access" ON public.email_sequence_templates TO authenticated;

-- events
ALTER POLICY "admin_full_access" ON public.events TO authenticated;

-- feedback_questions
ALTER POLICY "Admin can manage all questions" ON public.feedback_questions TO authenticated;

-- generation_metrics
ALTER POLICY "Admins can view all metrics" ON public.generation_metrics TO authenticated;

-- lesson_series
ALTER POLICY "Users can manage own series" ON public.lesson_series TO authenticated;

-- org_lesson_pack_purchases
ALTER POLICY "Org managers can view their org lesson pack purchases" ON public.org_lesson_pack_purchases TO authenticated;

-- org_onboarding_purchases
ALTER POLICY "Org managers can view their org onboarding purchases" ON public.org_onboarding_purchases TO authenticated;

-- org_shared_focus
ALTER POLICY "Admins can manage all shared focus" ON public.org_shared_focus TO authenticated;
ALTER POLICY "Org leaders can delete shared focus" ON public.org_shared_focus TO authenticated;
ALTER POLICY "Org leaders can insert shared focus" ON public.org_shared_focus TO authenticated;
ALTER POLICY "Org leaders can update shared focus" ON public.org_shared_focus TO authenticated;
ALTER POLICY "Org members can view shared focus" ON public.org_shared_focus TO authenticated;

-- organizations
ALTER POLICY "org_manager_update_own_org" ON public.organizations TO authenticated;
ALTER POLICY "parent_org_manager_view_children" ON public.organizations TO authenticated;

-- reshape_metrics
ALTER POLICY "Admins can view reshape metrics" ON public.reshape_metrics TO authenticated;

-- system_settings
ALTER POLICY "Admins can update settings" ON public.system_settings TO authenticated;

-- toolbelt_email_captures
ALTER POLICY "Admins can read toolbelt_email_captures" ON public.toolbelt_email_captures TO authenticated;
ALTER POLICY "Admins can update toolbelt_email_captures" ON public.toolbelt_email_captures TO authenticated;

-- toolbelt_email_templates
ALTER POLICY "Admins full access to toolbelt_email_templates" ON public.toolbelt_email_templates TO authenticated;

-- toolbelt_email_tracking
ALTER POLICY "Admins full access to toolbelt_email_tracking" ON public.toolbelt_email_tracking TO authenticated;

-- toolbelt_usage
ALTER POLICY "Admins can read toolbelt_usage" ON public.toolbelt_usage TO authenticated;

-- transfer_requests
ALTER POLICY "Admins have full access to transfer requests" ON public.transfer_requests TO authenticated;
ALTER POLICY "Org managers can create transfer requests" ON public.transfer_requests TO authenticated;
ALTER POLICY "Org managers can update org transfer requests" ON public.transfer_requests TO authenticated;
ALTER POLICY "Org managers can view org transfer requests" ON public.transfer_requests TO authenticated;
ALTER POLICY "Users can create their own transfer requests" ON public.transfer_requests TO authenticated;
ALTER POLICY "Users can update their own transfer requests" ON public.transfer_requests TO authenticated;
ALTER POLICY "Users can view their own transfer requests" ON public.transfer_requests TO authenticated;

-- user_subscriptions
ALTER POLICY "Users can read own subscription" ON public.user_subscriptions TO authenticated;

COMMIT;
