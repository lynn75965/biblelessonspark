-- Admin RLS policies for blog_posts
-- Enables /admin/blog-preview page to read drafts (published=false)
-- and to publish, edit, or delete posts as the authenticated admin user.
--
-- Frontend SSOT: src/pages/AdminBlogPreview.tsx
-- Auth pattern matches existing migrations (e.g. 20250120_transfer_requests.sql)
-- which use has_role(auth.uid(), 'admin') to gate platform-admin actions.
--
-- Pre-existing policies on blog_posts (unchanged):
--   - "Public can read published blog posts" (anon, authenticated): published = true
--   - "Service role full access to blog posts" (service_role): all rows
-- These two new policies grant the additional authenticated-admin access.

CREATE POLICY "Admin can read all blog posts"
  ON public.blog_posts
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admin can manage blog posts"
  ON public.blog_posts
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
