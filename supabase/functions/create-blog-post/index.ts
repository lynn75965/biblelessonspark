import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { getCorsHeadersFromRequest } from "../_shared/corsConfig.ts";

/**
 * create-blog-post Edge Function
 *
 * Purpose: External bot integration (Tertius / OpenClaw) to create or delete blog posts.
 * Authenticates via X-Blog-Api-Key header matching BLOG_API_KEY env var.
 * Uses the service role client (bypasses RLS).
 *
 * POST -- create a blog post
 *   Accepts: multipart/form-data OR application/json
 *   Required fields: title, slug, excerpt, content
 *   Optional fields: featured_image_url, published (default true), published_at (default now)
 *   Returns 200: { success, slug, url }
 *   Returns 400: { error: "missing required field: <field>" }
 *   Returns 401: { error: "unauthorized" }
 *   Returns 409: { error: "slug already exists" }
 *
 * DELETE -- delete a blog post by slug
 *   Accepts: application/json
 *   Required field: slug
 *   Returns 200: { success: true, message: "Post deleted" }
 *   Returns 400: { error: "missing required field: slug" }
 *   Returns 401: { error: "unauthorized" }
 *   Returns 404: { error: "Post not found" }
 */

const PUBLIC_SITE_URL = "https://biblelessonspark.com";
const BLOG_TABLE = "blog_posts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface BlogPostPayload {
  title?: unknown;
  slug?: unknown;
  excerpt?: unknown;
  content?: unknown;
  featured_image_url?: unknown;
  published?: unknown;
  published_at?: unknown;
}

function toStr(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value == null) return null;
  return String(value);
}

function toBool(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (v === "true" || v === "1" || v === "yes") return true;
    if (v === "false" || v === "0" || v === "no") return false;
  }
  return fallback;
}

// Tertius sometimes embeds the featured image as the first block of content,
// causing it to render twice (once as featured_image, once at the top of body).
// Strip a leading <img> (with or without a wrapping <p>) when its src matches
// the featured_image_url. Query strings are ignored so ?w=1200 vs ?w=800 still
// matches.
function stripLeadingFeaturedImage(
  content: string,
  featuredUrl: string | null,
): string {
  if (!featuredUrl) return content;
  const featuredPath = featuredUrl.split("?")[0];

  const wrapped = content.match(
    /^\s*<p[^>]*>\s*<img[^>]*src=["']([^"']+)["'][^>]*>\s*<\/p>\s*/i,
  );
  if (wrapped) {
    const srcPath = wrapped[1].split("?")[0];
    if (srcPath === featuredPath || wrapped[1] === featuredUrl) {
      return content.substring(wrapped[0].length);
    }
  }

  const bare = content.match(/^\s*<img[^>]*src=["']([^"']+)["'][^>]*>\s*/i);
  if (bare) {
    const srcPath = bare[1].split("?")[0];
    if (srcPath === featuredPath || bare[1] === featuredUrl) {
      return content.substring(bare[0].length);
    }
  }

  return content;
}

async function readPayload(req: Request): Promise<BlogPostPayload> {
  const contentType = req.headers.get("content-type") || "";
  if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
    const form = await req.formData();
    const out: Record<string, unknown> = {};
    for (const [k, v] of form.entries()) {
      out[k] = typeof v === "string" ? v : v.name;
    }
    return out as BlogPostPayload;
  }
  // Default: JSON
  return (await req.json()) as BlogPostPayload;
}

serve(async (req) => {
  const corsHeaders = getCorsHeadersFromRequest(req);
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST" && req.method !== "DELETE") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    // Authenticate via X-Blog-Api-Key (shared by POST and DELETE)
    const expectedKey = Deno.env.get("BLOG_API_KEY");
    const providedKey = req.headers.get("x-blog-api-key");
    if (!expectedKey || !providedKey || providedKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    // Parse payload (JSON or multipart)
    let payload: BlogPostPayload;
    try {
      payload = await readPayload(req);
    } catch (_err) {
      return new Response(JSON.stringify({ error: "invalid request body" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    // DELETE -- remove a blog post by slug
    if (req.method === "DELETE") {
      const deleteSlug = toStr(payload.slug)?.trim();
      if (!deleteSlug) {
        return new Response(
          JSON.stringify({ error: "missing required field: slug" }),
          { status: 400, headers: jsonHeaders },
        );
      }

      const { data: deletedRows, error: deleteError } = await supabaseAdmin
        .from(BLOG_TABLE)
        .delete()
        .eq("slug", deleteSlug)
        .select("id");

      if (deleteError) {
        console.error("create-blog-post delete error:", deleteError);
        return new Response(
          JSON.stringify({ error: "delete failed", details: deleteError.message }),
          { status: 500, headers: jsonHeaders },
        );
      }

      if (!deletedRows || deletedRows.length === 0) {
        return new Response(JSON.stringify({ error: "Post not found" }), {
          status: 404,
          headers: jsonHeaders,
        });
      }

      console.log(`create-blog-post: deleted slug=${deleteSlug}`);
      return new Response(
        JSON.stringify({ success: true, message: "Post deleted" }),
        { status: 200, headers: jsonHeaders },
      );
    }

    const title = toStr(payload.title)?.trim();
    const slug = toStr(payload.slug)?.trim();
    const excerpt = toStr(payload.excerpt)?.trim();
    const rawContent = toStr(payload.content);
    const featured_image_url = toStr(payload.featured_image_url)?.trim() || null;
    const content = rawContent
      ? stripLeadingFeaturedImage(rawContent, featured_image_url)
      : rawContent;
    const published = toBool(payload.published, true);
    const published_at = toStr(payload.published_at)?.trim() || new Date().toISOString();

    // Validate required fields
    const required: Array<[string, string | null | undefined]> = [
      ["title", title],
      ["slug", slug],
      ["excerpt", excerpt],
      ["content", content],
    ];
    for (const [name, value] of required) {
      if (!value) {
        return new Response(
          JSON.stringify({ error: `missing required field: ${name}` }),
          { status: 400, headers: jsonHeaders },
        );
      }
    }

    // Check for existing slug
    const { data: existing, error: lookupError } = await supabaseAdmin
      .from(BLOG_TABLE)
      .select("id")
      .eq("slug", slug!)
      .maybeSingle();

    if (lookupError) {
      console.error("create-blog-post lookup error:", lookupError);
      return new Response(
        JSON.stringify({ error: "lookup failed", details: lookupError.message }),
        { status: 500, headers: jsonHeaders },
      );
    }

    if (existing) {
      return new Response(JSON.stringify({ error: "slug already exists" }), {
        status: 409,
        headers: jsonHeaders,
      });
    }

    // Insert
    const insertRow: Record<string, unknown> = {
      title,
      slug,
      excerpt,
      content,
      published,
      published_at,
    };
    if (featured_image_url) {
      insertRow.featured_image_url = featured_image_url;
    }

    const { error: insertError } = await supabaseAdmin
      .from(BLOG_TABLE)
      .insert(insertRow);

    if (insertError) {
      console.error("create-blog-post insert error:", insertError);
      // Surface unique violation as 409 if the lookup race-conditioned
      if (insertError.code === "23505") {
        return new Response(JSON.stringify({ error: "slug already exists" }), {
          status: 409,
          headers: jsonHeaders,
        });
      }
      return new Response(
        JSON.stringify({ error: "insert failed", details: insertError.message }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const url = `${PUBLIC_SITE_URL}/blog/${slug}`;
    console.log(`create-blog-post: created slug=${slug} published=${published}`);

    return new Response(
      JSON.stringify({ success: true, slug, url }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (error) {
    console.error("create-blog-post unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "internal server error",
        details: error instanceof Error ? error.message : "unknown",
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
