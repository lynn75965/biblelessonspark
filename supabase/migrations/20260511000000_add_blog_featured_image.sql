-- Add featured_image_url column to blog_posts
-- Allows posts to display a hero image rendered above prose content
-- Populated by upload-blog-image Edge Function (Tertius integration)

ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS featured_image_url TEXT;
