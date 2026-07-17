-- Amendment to guardrail_suppressions (20260717180000): suppressions are
-- PER-USER ONLY, never platform-wide. A reviewed false positive covers
-- only the generating user whose violation was reviewed -- any other
-- user producing the same (code, phrase) still gets the normal rewrite
-- + log treatment until their own occurrence is separately reviewed.
-- There is no "all users" scope anywhere in this design.

ALTER TABLE public.guardrail_suppressions
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- No existing rows to backfill (table created earlier today, zero rows
-- expected in production at this point) -- safe to enforce NOT NULL
-- immediately rather than leaving a nullable transitional state.
ALTER TABLE public.guardrail_suppressions
  ALTER COLUMN user_id SET NOT NULL;

-- Replace the old (code, phrase)-only uniqueness with (code, phrase,
-- user_id)-scoped uniqueness -- the same phrase can now have one active
-- suppression PER USER, not one globally.
DROP INDEX IF EXISTS public.idx_guardrail_suppressions_active_unique;
DROP INDEX IF EXISTS public.idx_guardrail_suppressions_active_lookup;

CREATE UNIQUE INDEX idx_guardrail_suppressions_active_unique
  ON public.guardrail_suppressions (violation_code, matched_phrase_normalized, user_id)
  WHERE revoked_at IS NULL;

-- Flag-time lookup in generate-lesson filters by user_id first (single
-- generating user per invocation), so lead with user_id in this index.
CREATE INDEX idx_guardrail_suppressions_active_lookup
  ON public.guardrail_suppressions (user_id, violation_code, matched_phrase_normalized)
  WHERE revoked_at IS NULL;

-- RLS and grants are unchanged: guardrail_suppressions remains an
-- admin-only management surface (admin_full_access via has_role()) --
-- there is no per-user "view your own suppressions" policy, since this
-- table is never user-facing. Column-limited INSERT/UPDATE grants from
-- the original migration already cover user_id implicitly (it's part of
-- the same INSERT-eligible column list conceptually, but was omitted
-- from the original explicit list -- add it now).
GRANT INSERT (violation_code, matched_phrase_normalized, source_violation_id, created_by, user_id)
  ON public.guardrail_suppressions TO authenticated;
