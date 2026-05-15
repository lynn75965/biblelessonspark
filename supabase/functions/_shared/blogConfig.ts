/**
 * Edge Function Blog Configuration
 * =================================
 *
 * Backend-side subset of src/constants/blogConfig.ts. Hand-maintained per
 * CLAUDE.md Rule #24 -- when the frontend SSOT changes, update this file
 * in the same commit.
 *
 * Location: supabase/functions/_shared/blogConfig.ts
 *
 * USAGE:
 *   import { BLOG_TABLE, METADATA_ALLOWED_KEYS, type PostMetadata }
 *     from '../_shared/blogConfig.ts'
 *
 * SSOT: src/constants/blogConfig.ts
 * Last synced: May 15, 2026
 */

export const BLOG_TABLE = 'blog_posts';

export const METADATA_ALLOWED_KEYS = [
  'seo',
  'aeo',
  'images',
  'social',
  'structured_data',
] as const;

export type MetadataKey = typeof METADATA_ALLOWED_KEYS[number];

export interface PostMetadata {
  seo?: Record<string, unknown>;
  aeo?: Record<string, unknown>;
  images?: Record<string, unknown>;
  social?: Record<string, unknown>;
  structured_data?: Record<string, unknown>;
}

/**
 * Validates a metadata payload sent by an external bot.
 *
 * Returns:
 *   { ok: true, value: PostMetadata } on success
 *   { ok: false, error: string }     on failure
 *
 * Rules:
 *   - Must be a plain object (not array, not null when provided)
 *   - Every top-level key must be in METADATA_ALLOWED_KEYS
 *   - Every section value must itself be a plain object (or absent)
 *
 * The contents of each section are NOT validated -- the frontend defines
 * what fields each section may hold and may evolve them independently.
 */
export function validateMetadata(
  value: unknown,
): { ok: true; value: PostMetadata } | { ok: false; error: string } {
  if (value === null || value === undefined) {
    return { ok: true, value: {} };
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    return { ok: false, error: 'metadata must be a JSON object' };
  }
  const obj = value as Record<string, unknown>;
  for (const key of Object.keys(obj)) {
    if (!METADATA_ALLOWED_KEYS.includes(key as MetadataKey)) {
      return {
        ok: false,
        error: `metadata contains disallowed key: ${key}. Allowed: ${METADATA_ALLOWED_KEYS.join(', ')}`,
      };
    }
    const section = obj[key];
    if (section === null || section === undefined) continue;
    if (typeof section !== 'object' || Array.isArray(section)) {
      return {
        ok: false,
        error: `metadata.${key} must be a JSON object`,
      };
    }
  }
  return { ok: true, value: obj as PostMetadata };
}
