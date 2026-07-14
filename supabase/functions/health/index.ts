import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Public health-check endpoint for external uptime monitoring (UptimeRobot).
// No auth, no user input accepted, no write, no secrets or user data in the
// response. verify_jwt=false is set in supabase/config.toml.
//
// DB-ping variant: performs one trivial, discarded read (LIMIT 1 on
// profiles.id) so the monitor also proves database reachability, not just
// that the edge runtime is up. Returns 503 on DB failure so a plain
// "expect HTTP 200" monitor correctly flags a database outage.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const ts = new Date().toISOString();

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { error } = await supabase.from("profiles").select("id").limit(1);

    if (error) {
      return new Response(
        JSON.stringify({ status: "error", ts, db: "error" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ status: "ok", ts, db: "ok" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch {
    return new Response(
      JSON.stringify({ status: "error", ts, db: "error" }),
      { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
