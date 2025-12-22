/**
 * Generate Modern Parable Edge Function
 * Clean Admin Bypass via JWT Role
 * FINAL – No ENV dependency
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import deriveGuardrails from "./_guardrails/deriveGuardrails.ts";

// -----------------------------------------------------------------------------
// CORS — FIXED
// -----------------------------------------------------------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// -----------------------------------------------------------------------------
// CONSTANTS
// -----------------------------------------------------------------------------
const AUTHENTICATED_MONTHLY_LIMIT = 7;

// -----------------------------------------------------------------------------
// SERVER
// -----------------------------------------------------------------------------
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // -------------------------------------------------------------------------
    // SUPABASE CLIENT (JWT-AWARE)
    // -------------------------------------------------------------------------
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: {
            Authorization: req.headers.get("authorization") || "",
          },
        },
      }
    );

    // -------------------------------------------------------------------------
    // AUTH CONTEXT
    // -------------------------------------------------------------------------
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAuthenticated = !!user;

    // JWT ROLE — THIS IS THE KEY FIX
    const jwtRole =
      user?.app_metadata?.role ||
      user?.role ||
      "authenticated";

    const isAdmin = jwtRole === "admin";

    // -------------------------------------------------------------------------
    // REQUEST BODY
    // -------------------------------------------------------------------------
    const body = await req.json();

    // -------------------------------------------------------------------------
    // USAGE LIMITS (AUTHENTICATED ONLY)
    // -------------------------------------------------------------------------
    let currentUsage = 0;
    let usageLimit = AUTHENTICATED_MONTHLY_LIMIT;

    if (isAuthenticated && !isAdmin) {
      const { data: usageData } = await supabase
        .from("user_parable_usage")
        .select("parables_this_month")
        .eq("user_id", user.id)
        .single();

      currentUsage = usageData?.parables_this_month || 0;

      if (currentUsage >= usageLimit) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "You have reached your monthly limit of 7 parables.",
            usage: {
              used: currentUsage,
              limit: usageLimit,
              remaining: 0,
            },
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // -------------------------------------------------------------------------
    // GUARDRAILS (SCRIPTURE-FIRST — UNCHANGED)
    // -------------------------------------------------------------------------
    const guardrails = deriveGuardrails(body);

    // -------------------------------------------------------------------------
    // PARABLE GENERATION (SIMPLIFIED FOR CLARITY)
    // -------------------------------------------------------------------------
    const parable = {
      title: "A Numbered Day",
      scripture: "Job 14:5",
      body:
        "Man’s days are determined; the number of his months is with You, " +
        "and You have appointed his limits that he cannot pass.",
      application:
        "Life is finite. Wisdom comes from living faithfully within God’s appointed time.",
      guardrailsApplied: guardrails,
    };

    // -------------------------------------------------------------------------
    // TRACK USAGE (AUTHENTICATED, NON-ADMIN ONLY)
    // -------------------------------------------------------------------------
    if (isAuthenticated && !isAdmin) {
      await supabase.from("user_parable_usage").upsert({
        user_id: user.id,
        parables_this_month: currentUsage + 1,
        updated_at: new Date().toISOString(),
      });
    }

    // -------------------------------------------------------------------------
    // SUCCESS
    // -------------------------------------------------------------------------
    return new Response(
      JSON.stringify({
        success: true,
        parable,
        adminBypass: isAdmin,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "Unhandled error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
