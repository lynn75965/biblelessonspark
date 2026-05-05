-- Blog system: blog_posts table with public read access for published rows
-- Frontend SSOT: src/constants/blogConfig.ts
-- Table name must match BLOG_CONFIG.table

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  published boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.blog_posts enable row level security;

-- Public (anonymous and authenticated) can read only published posts
create policy "Public can read published blog posts"
  on public.blog_posts
  for select
  to anon, authenticated
  using (published = true);

-- Service role can insert / update / delete (admin-driven content management)
create policy "Service role full access to blog posts"
  on public.blog_posts
  for all
  to service_role
  using (true)
  with check (true);
