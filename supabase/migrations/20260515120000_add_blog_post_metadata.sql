-- Add metadata JSONB column to blog_posts
-- Stores SEO/AEO/social/images/structured_data metadata supplied by Tertius
-- (OpenClaw) at post creation time. Visible to admins only -- public blog
-- pages do not request this column (see src/constants/blogConfig.ts:
-- BLOG_CONFIG.columns.public vs columns.admin).
--
-- Shape SSOT: src/constants/blogConfig.ts -> PostMetadata interface
-- Backend mirror: supabase/functions/_shared/blogConfig.ts
-- Allowed top-level keys: seo, aeo, images, social, structured_data
--
-- Column is nullable for backward compatibility with existing posts.

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS metadata JSONB;

COMMENT ON COLUMN public.blog_posts.metadata IS
  'SEO/AEO/social/images/structured_data metadata. Admin-only visibility. Shape defined by PostMetadata in src/constants/blogConfig.ts.';
