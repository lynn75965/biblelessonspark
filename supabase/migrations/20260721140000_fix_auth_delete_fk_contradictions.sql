-- Fixes a class of latent bugs discovered during the delete-own-account
-- live test (2026-07-21): several columns declare ON DELETE SET NULL on
-- their FK to auth.users(id) while the column itself is NOT NULL -- a
-- self-contradictory schema state. When a referenced user is deleted,
-- Postgres tries to satisfy the FK action and immediately violates the
-- NOT NULL constraint (SQLSTATE 23502), and GoTrue surfaces this as a
-- generic "Database error deleting user" / unexpected_failure with no
-- detail. This blocks self-service AND admin-initiated account deletion
-- for any user who created an org (organizations.created_by is the one
-- that surfaced first), performed/received an audited admin action
-- (admin_audit), set org shared focus (org_shared_focus), requested an
-- org transfer (transfer_requests), or created a guardrail suppression
-- (guardrail_suppressions).
--
-- organizations.created_by is DELIBERATELY EXCLUDED -- it represents live
-- org ownership, not a historical audit record, and is handled by an
-- application-level reassign-or-block decision (Option B) in the
-- delete-own-account function redesign, not by relaxing this constraint.
--
-- guardrail_suppressions.created_by additionally has its FK changed from
-- the current implicit ON DELETE NO ACTION to ON DELETE SET NULL --
-- NO ACTION unconditionally blocks the delete regardless of nullability,
-- so dropping NOT NULL alone would not have been sufficient there.
--
-- guardrail_suppressions.revoked_by is already nullable; its FK is
-- upgraded from implicit NO ACTION to declared ON DELETE SET NULL so the
-- database handles it automatically, removing the last app-side nullify
-- workaround (delete-own-account previously had to do this manually).
--
-- App-code audit (grepped, not assumed) before this migration: no read or
-- write site in src/ or supabase/functions/ relies on any of these five
-- columns being non-null. admin_audit has zero writers anywhere and zero
-- rows in production. org_shared_focus/transfer_requests/
-- guardrail_suppressions writers always supply a value on insert
-- (unaffected by relaxing NOT NULL); TransferRequestQueue.tsx already
-- defensively falls back to "Unknown" for a missing requester.

ALTER TABLE public.admin_audit ALTER COLUMN actor_user_id DROP NOT NULL;
ALTER TABLE public.admin_audit ALTER COLUMN target_user_id DROP NOT NULL;

ALTER TABLE public.org_shared_focus ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE public.transfer_requests ALTER COLUMN requested_by DROP NOT NULL;

ALTER TABLE public.guardrail_suppressions ALTER COLUMN created_by DROP NOT NULL;
ALTER TABLE public.guardrail_suppressions DROP CONSTRAINT guardrail_suppressions_created_by_fkey;
ALTER TABLE public.guardrail_suppressions ADD CONSTRAINT guardrail_suppressions_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.guardrail_suppressions DROP CONSTRAINT guardrail_suppressions_revoked_by_fkey;
ALTER TABLE public.guardrail_suppressions ADD CONSTRAINT guardrail_suppressions_revoked_by_fkey
  FOREIGN KEY (revoked_by) REFERENCES auth.users(id) ON DELETE SET NULL;
