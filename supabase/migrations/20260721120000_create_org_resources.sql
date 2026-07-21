-- Organization Resource Library: verbatim-hosted org-leader uploads (e.g. a
-- 13-week teacher training booklet PDF), distributed to org members as-is --
-- no AI processing, no reformatting. Distinct from extract-lesson (which
-- converts uploads into the 8-section framework).
--
-- Migration only -- no UI/upload path in this session.
--
-- RLS quals mirror organization_focus's three-policy shape (admin ALL /
-- leader ALL / member SELECT) via is_org_leader()/is_org_member() --
-- profiles-based, NOT organization_members.role. organization_focus's own
-- GRANT state is NOT copied -- that table has zero authenticated grant and
-- its policies are dead code (Rule #32 violation, logged separately for its
-- own fix session). This migration follows Rule #36: explicit grant only,
-- no UPDATE (replace = delete+insert).

-- 1. Table -----------------------------------------------------------------
CREATE TABLE public.org_resources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  uploaded_by     uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  file_path       text NOT NULL,
  file_size       bigint NOT NULL,
  page_count      integer,
  created_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.org_resources ENABLE ROW LEVEL SECURITY;

-- 2. Grants (Rule #36 -- no anon/authenticated grant by default; explicit only)
REVOKE ALL ON public.org_resources FROM anon, authenticated;
GRANT SELECT, INSERT, DELETE ON public.org_resources TO authenticated;

-- 3. Table RLS policies -----------------------------------------------------
CREATE POLICY "Admin full access to org_resources" ON public.org_resources
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Org leader manage resources" ON public.org_resources
  FOR ALL
  USING (is_org_leader(organization_id))
  WITH CHECK (is_org_leader(organization_id));

CREATE POLICY "Org members view resources" ON public.org_resources
  FOR SELECT
  USING (is_org_member(organization_id));

-- 4. Storage bucket (idempotent, same upsert pattern as
--    20260514120000_create_blog_images_bucket.sql) --------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('org-resources', 'org-resources', false, 26214400, array['application/pdf'])
on conflict (id) do update
  set public = excluded.public,
      name = excluded.name,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 5. Storage RLS policies -- path convention {organization_id}/{filename},
--    scoped via storage.foldername(name)[1] ---------------------------------
drop policy if exists "Org members read own org resources" on storage.objects;
create policy "Org members read own org resources"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'org-resources'
    and is_org_member((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Org leaders write own org resources" on storage.objects;
create policy "Org leaders write own org resources"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'org-resources'
    and is_org_leader((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Org leaders delete own org resources" on storage.objects;
create policy "Org leaders delete own org resources"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'org-resources'
    and is_org_leader((storage.foldername(name))[1]::uuid)
  );

drop policy if exists "Service role full access to org-resources" on storage.objects;
create policy "Service role full access to org-resources"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'org-resources')
  with check (bucket_id = 'org-resources');
