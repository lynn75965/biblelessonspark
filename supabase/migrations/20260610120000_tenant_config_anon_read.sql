-- SECURITY: tenant_config is public-safe app config (branding, UI copy, feature
-- flags, public contact emails -- verified column-by-column 2026-06-10, no secrets).
-- It is read at app bootstrap (main.tsx -> getTenantConfig) on EVERY page,
-- including the public /auth page, as the anon role. Its SELECT policy was scoped
-- {authenticated} only, so anon saw zero rows and .single() returned HTTP 406.
-- Restore read-only anon access. Writes remain admin-only via tenant_config_admin_write.
BEGIN;

DROP POLICY IF EXISTS tenant_config_read ON public.tenant_config;

CREATE POLICY tenant_config_read
  ON public.tenant_config
  FOR SELECT TO anon, authenticated
  USING (true);

COMMIT;
