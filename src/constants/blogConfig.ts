// SSOT: Blog system configuration
// Owns the blog_posts table name, status values, route paths, UI copy, and tunables.
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
    metaDescription:
      'Practical Bible teaching resources for volunteer Sunday school teachers.',
    emptyState: 'No posts available.',
    searchPlaceholder: 'Search posts by title or excerpt...',
    searchEmptyState: 'No posts found. Try different keywords.',
    loadingLabel: 'Loading posts.',
    loadMoreLabel: 'Load more',
    loadingMoreLabel: 'Loading more...',
    readMoreLabel: 'Read more',
    readTimeSuffix: 'min read',
    backLabel: 'Back to Blog',
    homeButtonLabel: 'Go to BibleLessonSpark',
  },

  pagination: {
    pageSize: 12,
  },

  readTime: {
    wordsPerMinute: 200,
  },

  excerpt: {
    maxChars: 150,
  },
} as const;

export type BlogStatus = typeof BLOG_CONFIG.status[keyof typeof BLOG_CONFIG.status];

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  featured_image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
}
