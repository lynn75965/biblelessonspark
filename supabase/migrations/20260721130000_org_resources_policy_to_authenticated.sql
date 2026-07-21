-- Convention alignment only: re-declare org_resources's three table-level
-- RLS policies TO authenticated, matching organization_focus's convention
-- (see 20260721120000_create_org_resources.sql). Functionally equivalent --
-- anon already has zero table-level grant on org_resources regardless of
-- policy role scope -- this is readability/consistency only. USING/WITH
-- CHECK expressions are byte-identical to what's live; only the role
-- clause changes. storage.objects policies and grants are untouched.

DROP POLICY IF EXISTS "Admin full access to org_resources" ON public.org_resources;
CREATE POLICY "Admin full access to org_resources" ON public.org_resources
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Org leader manage resources" ON public.org_resources;
CREATE POLICY "Org leader manage resources" ON public.org_resources
  FOR ALL TO authenticated
  USING (is_org_leader(organization_id))
  WITH CHECK (is_org_leader(organization_id));

DROP POLICY IF EXISTS "Org members view resources" ON public.org_resources;
CREATE POLICY "Org members view resources" ON public.org_resources
  FOR SELECT TO authenticated
  USING (is_org_member(organization_id));
