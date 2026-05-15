-- Storage bucket for blog hero and supportive images
-- Used by generate-blog-image and upload-blog-image edge functions
-- Public read access; writes are performed by edge functions using the
-- service role key (which bypasses RLS).
--
-- Idempotent: bucket row is upserted; policies are dropped first to allow
-- re-running this migration safely if the bucket was previously created
-- at runtime by upload-blog-image's ensureBucket() fallback.

insert into storage.buckets (id, name, public)
values ('blog-images', 'blog-images', true)
on conflict (id) do update
  set public = excluded.public,
      name = excluded.name;

drop policy if exists "Public read for blog-images" on storage.objects;
create policy "Public read for blog-images"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'blog-images');

drop policy if exists "Service role full access to blog-images" on storage.objects;
create policy "Service role full access to blog-images"
  on storage.objects
  for all
  to service_role
  using (bucket_id = 'blog-images')
  with check (bucket_id = 'blog-images');
