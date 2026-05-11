import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";
import { getCorsHeadersFromRequest } from "../_shared/corsConfig.ts";

/**
 * upload-blog-image Edge Function
 *
 * Purpose: External bot integration (Tertius / OpenClaw) to upload blog hero images.
 * Authenticates via X-Blog-Api-Key header matching BLOG_API_KEY env var.
 * Uploads to Supabase Storage bucket "blog-images" (created if missing, public).
 *
 * Accepts: multipart/form-data with fields:
 *   file: image binary (File)
 *   filename: string (target storage path)
 *
 * Returns 200: { success, url }
 * Returns 400: { error: "no file provided" } or { error: "no filename provided" }
 * Returns 401: { error: "unauthorized" }
 */

const BUCKET = "blog-images";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function ensureBucket(): Promise<void> {
  const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
  if (listError) {
    throw new Error(`listBuckets failed: ${listError.message}`);
  }
  const exists = (buckets || []).some((b: { name: string }) => b.name === BUCKET);
  if (exists) return;

  const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET, {
    public: true,
  });
  if (createError) {
    // If a parallel request created it first, treat that as success
    if (createError.message && createError.message.toLowerCase().includes("already exists")) {
      return;
    }
    throw new Error(`createBucket failed: ${createError.message}`);
  }
}

function sanitizeFilename(name: string): string {
  // Strip path separators; keep alphanumerics, dot, dash, underscore
  const base = name.split(/[\\/]/).pop() || "image";
  return base.replace(/[^A-Za-z0-9._-]/g, "_");
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
    // Authenticate
    const expectedKey = Deno.env.get("BLOG_API_KEY");
    const providedKey = req.headers.get("x-blog-api-key");
    if (!expectedKey || !providedKey || providedKey !== expectedKey) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: jsonHeaders,
      });
    }

    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({ error: "content-type must be multipart/form-data" }),
        { status: 400, headers: jsonHeaders },
      );
    }

    let form: FormData;
    try {
      form = await req.formData();
    } catch (_err) {
      return new Response(JSON.stringify({ error: "invalid multipart body" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }

    const fileEntry = form.get("file");
    if (!fileEntry || typeof fileEntry === "string") {
      return new Response(JSON.stringify({ error: "no file provided" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    const file = fileEntry as File;

    const filenameRaw = form.get("filename");
    const filenameStr = typeof filenameRaw === "string" && filenameRaw.trim().length > 0
      ? filenameRaw.trim()
      : file.name;
    if (!filenameStr) {
      return new Response(JSON.stringify({ error: "no filename provided" }), {
        status: 400,
        headers: jsonHeaders,
      });
    }
    const filename = sanitizeFilename(filenameStr);

    // Ensure bucket exists and is public
    try {
      await ensureBucket();
    } catch (bucketErr) {
      console.error("upload-blog-image bucket error:", bucketErr);
      return new Response(
        JSON.stringify({
          error: "bucket initialization failed",
          details: bucketErr instanceof Error ? bucketErr.message : "unknown",
        }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const buffer = await file.arrayBuffer();
    const contentTypeUpload = file.type || "application/octet-stream";

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filename, buffer, {
        contentType: contentTypeUpload,
        upsert: true,
      });

    if (uploadError) {
      console.error("upload-blog-image upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "upload failed", details: uploadError.message }),
        { status: 500, headers: jsonHeaders },
      );
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filename);

    console.log(`upload-blog-image: uploaded ${filename} (${buffer.byteLength} bytes)`);

    return new Response(
      JSON.stringify({ success: true, url: publicData.publicUrl }),
      { status: 200, headers: jsonHeaders },
    );
  } catch (error) {
    console.error("upload-blog-image unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "internal server error",
        details: error instanceof Error ? error.message : "unknown",
      }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
