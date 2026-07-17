-- Fix: guardrail_violations UPDATE grant missing since Section F cleanup
-- (20260605100000_security_section_f_grants.sql revoked ALL then granted
-- back only SELECT to authenticated). The RLS "Admins can update
-- violations" policy already exists and is correct -- Postgres requires
-- BOTH a table-level GRANT and a passing RLS policy, and the GRANT was
-- never restored, so every Mark-as-Reviewed UPDATE fails with
-- "permission denied for table guardrail_violations" before RLS is even
-- evaluated. Column-limited to exactly the fields the admin UI writes
-- (GuardrailViolationsPanel.tsx's handleMarkReviewed) -- least privilege
-- beyond what RLS alone already restricts to admin rows.

GRANT UPDATE (was_reviewed, reviewed_at, review_notes)
  ON public.guardrail_violations
  TO authenticated;
