import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const ALLOWED_ORIGINS = [
  "https://biblelessonspark.com",
  "https://www.biblelessonspark.com",
  "http://localhost:8080",
  "http://localhost:5173",
  "http://localhost:3000",
];

function getCorsHeadersFromRequest(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-blog-api-key",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

/**
 * generate-blog-image Edge Function
 *
 * Purpose: External bot integration (Tertius / OpenClaw) to generate a hero
 * image and a supportive image for a blog post using OpenAI DALL-E 3, then
 * upload both to Supabase Storage bucket "blog-images" and return their
 * public URLs.
 *
 * Authenticates via X-Blog-Api-Key header matching BLOG_API_KEY env var
 * (same pattern as create-blog-post).
 *
 * POST -- generate and store both images
 *   Accepts: application/json
 *   Required fields: hero_prompt, supportive_prompt, post_slug
 *   Returns 200: { success: true, hero_image_url, supportive_image_url }
 *   Returns 400: { error: "missing required field: <field>" }
 *   Returns 401: { error: "unauthorized" }
 *   Returns 500: { error: "OPENAI_API_KEY not configured" | ... }
 *
 * Environment variables required:
 *   BLOG_API_KEY              -- shared secret for X-Blog-Api-Key auth
 *   OPENAI_API_KEY            -- OpenAI key with image generation access
 *   SUPABASE_URL              -- project URL (auto-injected)
 *   SUPABASE_SERVICE_ROLE_KEY -- service role key (auto-injected)
 */

const BUCKET = "blog-images";
const OPENAI_IMAGES_URL = "https://api.openai.com/v1/images/generations";
const IMAGE_MODEL = "gpt-image-1";
const IMAGE_SIZE = "1536x1024";
const IMAGE_QUALITY = "medium";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

interface RequestPayload {
  hero_prompt?: unknown;
  supportive_prompt?: unknown;
  post_slug?: unknown;
}

function toStr(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value == null) return null;
  return String(value);
}

function sanitizeSlug(slug: string): string {
  const base = slug.split(/[\\/]/).pop() || "post";
  return base.replace(/[^A-Za-z0-9._-]/g, "_");
}

async function generateImage(prompt: string, apiKey: string): Promise<Uint8Array> {
  const response = await fetch(OPENAI_IMAGES_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size: IMAGE_SIZE,
      quality: IMAGE_QUALITY,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI API ${response.status}: ${errText}`);
  }

  const data = await response.json();
  const b64 = data?.data?.[0]?.b64_json;
  if (b64 && typeof b64 === "string") {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  const imageUrl = data?.data?.[0]?.url;
  if (imageUrl && typeof imageUrl === "string") {
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image from URL: ${imageResponse.status}`);
    }
    const arrayBuffer = await imageResponse.arrayBuffer();
    return new Uint8Array(arrayBuffer);
  }
  throw new Error("OpenAI response missing both b64_json and url");
}

async function uploadImage(path: string, bytes: Uint8Array): Promise<string> {
  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: "image/png",
      upsert: true,
    });
  if (uploadError) {
    throw new Error(`Storage upload failed for ${path}: ${uploadError.message}`);
  }
  const { data: publicData } = supabaseAdmin.storage
    .from(BUCKET)
    .getPublicUrl(path);
  return publicData.publicUrl;
}

serve(async (req) => {
  const corsHeaders = getCorsHeadersFromRequest(req);
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: jsonHeaders,
    });
  }

  try {
    // Authenticate via X-Blog-Api-Key
    const expectedKey = Deno.env.get("BLOG_API_KEY");
    const providedKey = req.headers.get("x-blog-api-key");
    if (!expectedKey || !providedKey || providedKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: jsonHeaders },
      );
    }

    // Parse JSON payload
    let payload: RequestPayload;
    try {
      payload = (await req.json()) as RequestPayload;
    } catch (_err) {
      return new Response(JSON.stringify({ error: "invalid JSON body" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const heroPrompt = toStr(payload.hero_prompt)?.trim();
    const supportivePrompt = toStr(payload.supportive_prompt)?.trim();
    const postSlug = toStr(payload.post_slug)?.trim();

    const required: Array<[string, string | null | undefined]> = [
      ["hero_prompt", heroPrompt],
      ["supportive_prompt", supportivePrompt],
      ["post_slug", postSlug],
    ];
    for (const [name, value] of required) {
      if (!value) {
        return new Response(
          JSON.stringify({ error: `missing required field: ${name}` }),
          { status: 400, headers: jsonHeaders },
        );
      }
    }

    const safeSlug = sanitizeSlug(postSlug!);
    const heroPath = `${safeSlug}-hero.png`;
    const supportivePath = `${safeSlug}-supportive.png`;

    // Generate both images. Run sequentially so a hero failure short-circuits
    // before we spend tokens on the supportive image.
    const heroBytes = await generateImage(heroPrompt!, openaiKey);
    const supportiveBytes = await generateImage(supportivePrompt!, openaiKey);

    const hero_image_url = await uploadImage(heroPath, heroBytes);
    const supportive_image_url = await uploadImage(supportivePath, supportiveBytes);

    console.log(
      `generate-blog-image: slug=${safeSlug} hero=${heroPath} supportive=${supportivePath}`,
    );

    return new Response(
      JSON.stringify({ success: true, hero_image_url, supportive_image_url }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (error) {
    console.error("generate-blog-image unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "internal server error",
        details: error instanceof Error ? error.message : "unknown",
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
