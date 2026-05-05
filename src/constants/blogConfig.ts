// SSOT: Blog system configuration
// Owns the blog_posts table name, status values, route paths, and UI copy.
// Frontend drives backend: the migration's table name must match BLOG_CONFIG.table.
// Routes are derived from src/constants/routes.ts to avoid duplicate path literals.

import { ROUTES } from './routes';

export const BLOG_CONFIG = {
  table: 'blog_posts',

  status: {
    published: 'published',
    draft: 'draft',
  },

  routes: {
    index: ROUTES.BLOG,
    post: ROUTES.BLOG_POST,
  },

  ui: {
    title: 'Blog',
    emptyState: 'No posts available.',
    backLabel: 'Back to Blog',
  },
} as const;

export type BlogStatus = typeof BLOG_CONFIG.status[keyof typeof BLOG_CONFIG.status];

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  published: boolean;
  published_at: string | null;
  created_at: string;
}
