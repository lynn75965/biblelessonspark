-- Retire the events analytics write path (Pattern A).
--
-- Context: src/hooks/useAnalytics.tsx (the only client writer) and
-- src/components/security/SecurityMonitor.tsx (an orphaned reader, never
-- imported) have been deleted. public.log_security_event() was a
-- SECURITY DEFINER function meant to write 'security_*' rows into events,
-- but a repo-wide search found zero live callers (frontend, edge
-- functions, or current migrations) -- its only callers existed in
-- supabase/migrations_backup_20251026_171206/*.bak, superseded when
-- migration history was reconciled March 20, 2026.
--
-- public.events itself is NOT dropped. src/components/admin/
-- AdminSecurityPanel.tsx (rendered live at /admin -> Security tab) still
-- reads it and stays exactly as-is, rendering its empty state honestly
-- until a future dedicated session builds a real security-events feed.
-- This migration freezes the table to archival/read-only: authenticated
-- loses every write privilege it never should have kept (the default
-- Supabase INSERT/UPDATE/DELETE/TRUNCATE/REFERENCES/TRIGGER grant),
-- retaining only SELECT. admin_full_access (has_role admin) remains the
-- sole write path via RLS, same least-privilege posture as the Section F
-- grants migration (20260605100000).
--
-- TABLE FROZEN PENDING FUTURE SECURITY-EVENTS-FEED REBUILD.
-- Existing rows (12,456 at time of writing, 100% Lynn's own admin
-- account) are left in place as archival data -- nothing else references
-- them.

-- Drop the orphaned SECURITY DEFINER function. DROP FUNCTION removes its
-- associated grants (EXECUTE to service_role/authenticated from
-- 20260531120100) along with it.
DROP FUNCTION IF EXISTS public.log_security_event(text, uuid, jsonb);

-- Freeze public.events: revoke every write privilege from authenticated,
-- leaving SELECT only. service_role and postgres are untouched (service
-- role writes are not a concern here -- nothing server-side ever wrote to
-- this table either). RLS policies (admin_full_access, users_select_own)
-- are untouched; admin_full_access remains the sole write path.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.events
  FROM authenticated;
