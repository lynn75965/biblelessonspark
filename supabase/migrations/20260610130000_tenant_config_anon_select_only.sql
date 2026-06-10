-- SECURITY (Section-F-style defense-in-depth follow-up to 20260610120000):
-- anon held the full default grant set (DELETE,INSERT,REFERENCES,SELECT,TRIGGER,
-- TRUNCATE,UPDATE) on tenant_config. RLS already blocks anon writes (no permissive
-- anon policy exists for INSERT/UPDATE/DELETE), so this is not exploitable, but the
-- grants are overbroad. Tighten anon to SELECT only -- the single privilege the
-- public app bootstrap (main.tsx -> getTenantConfig) actually needs.
-- authenticated grants are intentionally left untouched. REVOKE/GRANT are idempotent.
BEGIN;

REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.tenant_config FROM anon;

GRANT SELECT ON public.tenant_config TO anon;

COMMIT;
