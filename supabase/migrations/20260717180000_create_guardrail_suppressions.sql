-- Guardrail suppression overlay. An explicit false-positive disposition on
-- a guardrail_violations row (the false_positive_* preset dispositions in
-- GuardrailViolationsPanel.tsx) writes a row here; generate-lesson checks
-- active suppressions at flag time and skips BOTH the rewrite-and-replace
-- step AND the guardrail_violations log for any hit matching an active
-- (violation_code, matched_phrase_normalized) pair. Never inferred, never
-- statistical -- always the direct result of an explicit admin judgment.
-- Detection patterns themselves (VIOLATION_PATTERNS, the SSOT) are never
-- modified by this table; this is purely a flag-time overlay.

CREATE TABLE public.guardrail_suppressions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  violation_code text NOT NULL,
  matched_phrase_normalized text NOT NULL,
  source_violation_id uuid REFERENCES public.guardrail_violations(id) ON DELETE SET NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_by uuid REFERENCES auth.users(id)
);

-- Partial unique index, not a table-level UNIQUE constraint: uniqueness is
-- enforced only among ACTIVE (non-revoked) rows, so a revoked-then-
-- reinstated phrase can be re-suppressed later without colliding with its
-- own history. Soft-revoke (revoked_at/revoked_by) was chosen over hard
-- delete specifically to preserve that audit trail -- the whole feature
-- exists to record admin judgment permanently.
CREATE UNIQUE INDEX idx_guardrail_suppressions_active_unique
  ON public.guardrail_suppressions (violation_code, matched_phrase_normalized)
  WHERE revoked_at IS NULL;

-- Fast lookup path for generate-lesson's flag-time check (active rows only).
CREATE INDEX idx_guardrail_suppressions_active_lookup
  ON public.guardrail_suppressions (violation_code, matched_phrase_normalized)
  WHERE revoked_at IS NULL;

ALTER TABLE public.guardrail_suppressions ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_full_access ON public.guardrail_suppressions
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Explicit, column-limited grants -- deliberately not relying on RLS alone
-- to gate writes. This is the exact lesson from the guardrail_violations
-- UPDATE-grant gap found and fixed earlier today (see
-- 20260717150000_guardrail_violations_update_grant.sql and its
-- cross-referenced June 6 carry-forward note in PROJECT_MASTER.md):
-- Postgres requires BOTH a table-level GRANT and a passing RLS policy,
-- and a correct RLS policy alone is not enough. service_role also needs
-- an explicit grant here -- confirmed via capacity_events
-- (20260716200000_create_capacity_events.sql) that this is not automatic.
REVOKE ALL ON public.guardrail_suppressions FROM anon, authenticated;
GRANT SELECT ON public.guardrail_suppressions TO authenticated;
GRANT INSERT (violation_code, matched_phrase_normalized, source_violation_id, created_by)
  ON public.guardrail_suppressions TO authenticated;
GRANT UPDATE (revoked_at, revoked_by) ON public.guardrail_suppressions TO authenticated;
GRANT ALL ON public.guardrail_suppressions TO service_role;
