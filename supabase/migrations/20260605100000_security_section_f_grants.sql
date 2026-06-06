-- 20260605100000_security_section_f_grants.sql
-- SECURITY: Section F data-API grant hardening (Security Advisor follow-up, item A)
--
-- Purpose: tighten the overbroad anon/authenticated table grants that Supabase
-- auto-applied on table creation. RLS already protects the rows; this is
-- defense-in-depth so a future RLS gap cannot leak through the PostgREST Data API.
--
-- Frontend-Drives-Backend: the table list here was derived from a grep of src/
-- and supabase/functions/. Every anon-facing path on these tables runs through a
-- service_role edge function (which bypasses RLS and grants), so removing the
-- anon/authenticated grants does not break any verified call path.
--
-- Drift verified 2026-06-05: all targeted tables still held the full default
-- grant set (DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE) for both
-- anon and authenticated prior to this migration. REVOKE ALL covers all of them.
--
-- REVOKE/GRANT are idempotent: re-running this migration is harmless.

BEGIN;

-- Edge-function-only tables (service_role): anon/authenticated never need access.
REVOKE ALL ON public.anonymous_parable_usage   FROM anon, authenticated;
REVOKE ALL ON public.email_sequence_tracking   FROM anon, authenticated;
REVOKE ALL ON public.lesson_pack_config        FROM anon, authenticated;
REVOKE ALL ON public.modern_parables           FROM anon, authenticated;
REVOKE ALL ON public.onboarding_config         FROM anon, authenticated;
REVOKE ALL ON public.org_lesson_pack_purchases FROM anon, authenticated;
REVOKE ALL ON public.org_onboarding_purchases  FROM anon, authenticated;
REVOKE ALL ON public.reshape_metrics           FROM anon, authenticated;
REVOKE ALL ON public.stripe_events             FROM anon, authenticated;
REVOKE ALL ON public.toolbelt_email_tracking   FROM anon, authenticated;
REVOKE ALL ON public.rate_limits               FROM anon, authenticated;
REVOKE ALL ON public.user_roles                FROM anon, authenticated;

-- Audit log: written only by SECURITY DEFINER admin functions; read via RPC.
REVOKE ALL ON public.admin_audit FROM anon, authenticated;

-- Admin-only analytics: anon never; authenticated SELECT only (admin gating is
-- enforced by RLS using has_role()).
REVOKE ALL  ON public.guardrail_violations         FROM anon, authenticated;
REVOKE ALL  ON public.guardrail_violation_summary  FROM anon, authenticated;
GRANT SELECT ON public.guardrail_violations         TO authenticated;
GRANT SELECT ON public.guardrail_violation_summary  TO authenticated;

-- App config tables: authenticated SELECT only (writes happen via admin RPCs /
-- service_role, not the direct Data API).
REVOKE ALL  ON public.app_settings    FROM anon, authenticated;
REVOKE ALL  ON public.org_tier_config FROM anon, authenticated;
GRANT SELECT ON public.app_settings    TO authenticated;
GRANT SELECT ON public.org_tier_config TO authenticated;

-- Tables the app writes through PostgREST as an authenticated user: drop anon
-- only; the existing authenticated grants are left untouched.
REVOKE ALL ON public.events                   FROM anon;
REVOKE ALL ON public.notifications            FROM anon;
REVOKE ALL ON public.feedback_questions       FROM anon;
REVOKE ALL ON public.generation_metrics       FROM anon;
REVOKE ALL ON public.toolbelt_email_captures  FROM anon;
REVOKE ALL ON public.toolbelt_email_templates FROM anon;

COMMIT;
