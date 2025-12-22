/**
 * generate-parable — CLEAN RESET VERSION
 * Purpose: unblock frontend, validate parable output, eliminate CORS failure
 * Status: production-safe, minimal, deterministic
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// -----------------------------------------------------------------------------
// CORS — ABSOLUTE, FINAL
// -----------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

// -----------------------------------------------------------------------------
// ENV
// -----------------------------------------------------------------------------

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_BYPASS_EMAILS = (Deno.env.get("ADMIN_BYPASS_EMAILS") || "")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

// -----------------------------------------------------------------------------
// SERVER
// -----------------------------------------------------------------------------

serve(async (req) => {

  // ---- CORS PREFLIGHT (THIS WAS YOUR BREAKAGE) ----
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // ---- AUTH ----
    const authHeader = req.headers.get("authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    let userEmail: string | null = null;

    if (authHeader.startsWith("Bearer ")) {
      const { data } = await supabase.auth.getUser();
      userEmail = data?.user?.email ?? null;
    }

    const isAdminBypass =
      userEmail !== null && ADMIN_BYPASS_EMAILS.includes(userEmail.toLowerCase());

    // ---- REQUEST BODY (NOT STRICT — FRONTEND SAFE) ----
    const body = await req.json().catch(() => ({}));

    const passage = body?.passage || "Job 14:5";
    const audience = body?.audience || "General Audience";

    // ---- PARABLE OUTPUT (VALIDATION PURPOSE) ----
    const parable = `
A man kept careful count of the days he believed he had.

He marked calendars, planned years ahead, and spoke as though tomorrow
were guaranteed. But one evening, as he watched his child sleeping,
he realized something sobering — he did not know how many days were
truly given to him.

In that moment, his striving quieted.
His anger softened.
His pride loosened its grip.

He began to live differently — slower, kinder, more present —
not because he feared the end, but because he finally understood
the value of each breath.

"So teach us to number our days,"
he whispered,
"that we may apply our hearts unto wisdom."
`;

    // ---- SUCCESS RESPONSE ----
    return new Response(
      JSON.stringify({
        success: true,
        adminBypass: isAdminBypass,
        emailSeen: userEmail,
        passageUsed: passage,
        audienceUsed: audience,
        parable,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
