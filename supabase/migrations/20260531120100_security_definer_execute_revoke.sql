-- =========================================================================
-- MIGRATION 2 -- SECURITY DEFINER EXECUTE-GRANT REVOKE
-- Applied 2026-06-03. Defense-in-depth follow-up to Migration 1
-- (20260531120000_security_definer_body_hardening). The 2026-06-03 forensic
-- sweep found no evidence of Tier 1 exploitation, so this is a routine
-- hardening deploy, not incident response.
-- =========================================================================
--
-- WHAT
--   Revokes the broad PUBLIC / anon / authenticated EXECUTE grants that
--   Supabase auto-applies on function creation. After this migration,
--   each SECURITY DEFINER function is callable only by the smallest set
--   of roles the app actually requires.
--
-- WHY
--   Section B of the security-advisor diagnostic confirmed that every
--   one of the 50 SECURITY DEFINER functions in public has EXECUTE
--   granted to PUBLIC, anon, and authenticated. Migration 1 closed the
--   live exposures by adding internal admin/auth checks to the function
--   bodies. This migration removes the over-broad EXECUTE grants so
--   defense-in-depth is in place: even if a future migration drops a
--   body check by accident, the missing EXECUTE keeps anon out.
--
-- ORDER OF DEPLOY
--   Migration 1 MUST be applied and verified BEFORE this migration.
--   Reason: this migration will cause non-admin anon hits to
--   `bulk_revoke_trials`, `deduct_credits`, etc. to fail with
--   "permission denied for function" instead of the friendlier
--   "Access denied: Admin role required" raised by Migration 1.
--   If Migration 1 has shipped, real callers are already authorized.
--
-- ROLLBACK
--   Re-grant EXECUTE on each affected function to PUBLIC. The original
--   defaults were:
--     GRANT EXECUTE ON FUNCTION <name>(<args>) TO PUBLIC;
--   (PUBLIC includes anon and authenticated automatically.) Rolling back
--   restores the over-broad grants but does NOT re-expose the function
--   bodies, because Migration 1's body checks remain in place.
-- =========================================================================

BEGIN;

-- -------------------------------------------------------------------------
-- SERVICE_ROLE SAFETY GRANTS (added 2026-06-03)
--   The REVOKE ... FROM PUBLIC statements below remove the blanket PUBLIC
--   grant. Several of these RPCs are invoked by edge functions as a PURE
--   service_role client (verified call sites:
--     generate-lesson/index.ts:295,372     -> check_lesson_limit, increment_lesson_usage
--     generate-devotional/index.ts:500,509,736 -> check_devotional_limit, increment_devotional_usage
--     send-lesson-email, reshape-lesson via _shared/subscriptionCheck.ts).
--   Section B showed grants to PUBLIC/anon/authenticated only -- service_role
--   was never explicitly granted, so it executes via PUBLIC. Revoking PUBLIC
--   without these grants would break lesson/devotional/parable generation.
--   These GRANTs make service_role's access explicit and are idempotent
--   (harmless no-ops if an explicit grant already exists).
-- -------------------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.check_lesson_limit(uuid)                  TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_lesson_usage(uuid)             TO service_role;
GRANT EXECUTE ON FUNCTION public.check_devotional_limit(uuid)             TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_devotional_usage(uuid)         TO service_role;
GRANT EXECUTE ON FUNCTION public.increment_parable_usage(uuid)            TO service_role;
GRANT EXECUTE ON FUNCTION public.get_credits_balance(uuid)                TO service_role;
GRANT EXECUTE ON FUNCTION public.get_branding_config(uuid)                TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.allocate_monthly_credits()              TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits()               TO service_role;
GRANT EXECUTE ON FUNCTION public.log_security_event(text, uuid, jsonb)    TO service_role;

-- -------------------------------------------------------------------------
-- B-2: RLS-HELPER FUNCTIONS -- KEEP open EXECUTE
--   These functions are called by RLS policy expressions on tables that
--   anon can legitimately read (blog_posts published, invites by token).
--   Removing anon EXECUTE would silently break those reads. NO CHANGE.
--
--     has_role, is_admin (both overloads), is_org_leader, is_org_member,
--     is_org_manager, is_ancestor_org_manager, is_team_lead_of,
--     is_team_member_of, get_user_org_id, get_user_organization,
--     get_user_organization_id, get_managed_org_ids
-- -------------------------------------------------------------------------
-- (intentionally untouched)

-- -------------------------------------------------------------------------
-- B-1: INTENTIONALLY ANON-CALLABLE
--   record_anonymous_parable_usage is the designed anon write path.
--   NO CHANGE.
-- -------------------------------------------------------------------------
-- (intentionally untouched)

-- -------------------------------------------------------------------------
-- B-3: PER-USER FRONTEND RPCs -- revoke anon, keep authenticated
-- -------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_credits_balance(uuid)        FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_lesson_limit(uuid)         FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.check_devotional_limit(uuid)     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_lesson_usage(uuid)     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_devotional_usage(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_parable_usage(uuid)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_branding_config(uuid)        FROM PUBLIC, anon;

-- -------------------------------------------------------------------------
-- B-4: ORG / PARENT-ORG RPCs -- revoke anon, keep authenticated
-- -------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_child_org_summaries(uuid)     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_focus_adoption_map(uuid)      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_parent_active_focus(uuid)     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.adopt_parent_focus(uuid, uuid)    FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.disconnect_org_from_network(uuid) FROM PUBLIC, anon;

-- -------------------------------------------------------------------------
-- B-5: ADMIN RPCs (called by admin panels) -- revoke anon, keep authenticated
--   Internal admin check in the body (Migration 1 + the three already-safe
--   functions) is the primary gate. This REVOKE is defense-in-depth.
-- -------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.get_trial_stats()                                                                              FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bulk_extend_trials(timestamp with time zone, text)                                             FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bulk_revoke_trials()                                                                           FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_feedback_analytics(text, timestamp with time zone, timestamp with time zone)               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_beta_feedback_analytics(timestamp with time zone, timestamp with time zone)                FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_production_feedback_analytics(timestamp with time zone, timestamp with time zone)          FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_all_users_for_admin()                                                                      FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_all_users_with_stats()                                                                     FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_lessons_admin(uuid)                                                                   FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_all_feedback_questions(text)                                                               FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_feedback_questions(text)                                                                   FROM PUBLIC, anon;

-- -------------------------------------------------------------------------
-- B-6: SERVICE-ROLE-ONLY -- revoke PUBLIC, anon, AND authenticated
--   These functions are reached only via service_role (edge functions /
--   pg_cron). Revoking authenticated AS WELL closes the Data API entirely.
--   Note: pg_cron scheduled jobs run as the `postgres` superuser, which
--   bypasses EXECUTE grants entirely -- so scheduled cleanup still fires.
-- -------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.allocate_monthly_credits()                          FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.deduct_credits(uuid, integer, text, uuid)           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits()                           FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.debug_admin_check()                                 FROM PUBLIC, anon, authenticated;

-- -------------------------------------------------------------------------
-- B-7: TRIGGER FUNCTIONS -- revoke PUBLIC, anon, AND authenticated
--   These run via Postgres triggers, which use the table-owner's
--   privileges, not the caller's. Revoking EXECUTE does NOT stop the
--   trigger from firing; it only blocks direct invocation via the Data
--   API. No legitimate caller exists outside the trigger system.
-- -------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.handle_new_user()                              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_profile_on_verification()               FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.add_user_to_email_sequence()                   FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_user_email()                              FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_profile_role_changes()                     FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_security_event(text, uuid, jsonb)          FROM PUBLIC, anon;
-- log_security_event keeps `authenticated` because some app code paths
-- may invoke it from authenticated sessions; Migration 1 already gates
-- anon at the body level.
REVOKE EXECUTE ON FUNCTION public.set_joined_during_beta()                       FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_devotional_updated_at()                 FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_updated_at()                            FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column()                     FROM PUBLIC, anon, authenticated;

COMMIT;

-- =========================================================================
-- POST-DEPLOY VERIFICATION
--   1. Re-run DIAGNOSE_B_function_execute_grants.sql. Expected output:
--      anon EXECUTE rows reduced to the 14 functions in B-1 + B-2 only.
--   2. Lynn signs in as admin and exercises every admin-panel feature
--      that touches a SECURITY DEFINER RPC. Each must continue working.
--   3. A non-admin test account generates a lesson, devotional, parable.
--      The corresponding increment_* RPC must succeed.
--   4. Lynn signs out completely and reloads the home page. The blog
--      list (anon SELECT on blog_posts) and any anon pre-login UI must
--      continue rendering. If any page errors with "permission denied
--      for function", an RLS policy depends on a function whose EXECUTE
--      was wrongly revoked -- restore that one grant and reopen the
--      classification.
-- =========================================================================
