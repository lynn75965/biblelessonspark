import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Role literal mirrors ORG_ROLES.member from src/constants/accessControl.ts.
// Edge functions cannot import the frontend SSOT (accessControl.ts has no backend
// mirror and is in no sync list), so the value is declared once locally here.
const ORG_ROLE_MEMBER = "member";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AcceptInviteRequest {
  token?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service-role client: bypasses RLS so the privileged accept writes
    // (profile affiliation + organization_members insert + claim stamp) succeed.
    // organization_members has no INSERT policy for regular users by design.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Resolve the caller from their JWT.
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { token }: AcceptInviteRequest = await req.json();
    if (!token) {
      return new Response(
        JSON.stringify({ error: "Missing invite token" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load the invite by token.
    const { data: invite, error: inviteError } = await supabaseClient
      .from("invites")
      .select("id, email, organization_id, created_by, claimed_by, claimed_at, expires_at")
      .eq("token", token)
      .maybeSingle();

    if (inviteError || !invite) {
      console.error("Invite lookup failed:", inviteError);
      return new Response(
        JSON.stringify({ error: "This invitation is invalid." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Already claimed?
    if (invite.claimed_at) {
      return new Response(
        JSON.stringify({ error: "This invitation has already been used." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Expired?
    if (invite.expires_at && new Date(invite.expires_at) <= new Date()) {
      return new Response(
        JSON.stringify({ error: "This invitation has expired." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Email-match guard: the caller must be the invited email.
    if (invite.email && user.email &&
        invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: "This invitation was sent to a different email address." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const nowIso = new Date().toISOString();

    // Order of operations is retry-safe: the org-affiliation writes run BEFORE the
    // claim stamp, so any failure leaves the invite UNCLAIMED and re-acceptable.
    // The claim stamp is written LAST, only after affiliation succeeds.
    if (invite.organization_id) {
      // Profile affiliation (role literal mirrors ORG_ROLES.member). Idempotent.
      // .select("id") returns the affected rows so a missing profile (zero rows,
      // which Postgres reports WITHOUT an error) is caught here and stops the flow
      // BEFORE the organization_members insert -- preventing a split state where a
      // member row exists but profiles.organization_id was never set.
      const { data: affiliatedRows, error: profileError } = await supabaseClient
        .from("profiles")
        .update({
          organization_id: invite.organization_id,
          organization_role: ORG_ROLE_MEMBER,
        })
        .eq("id", user.id)
        .select("id");

      if (profileError) {
        console.error("Error updating profile affiliation:", profileError);
        return new Response(
          JSON.stringify({ error: "Failed to join organization." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Zero rows matched -> no profile row exists for this user. Fail closed
      // BEFORE the member insert. Retry-safe: the claim stamp is still written
      // last, so the invite stays unclaimed and re-acceptable once a profile
      // exists.
      if (!affiliatedRows || affiliatedRows.length === 0) {
        console.error("Profile affiliation matched zero rows (missing profile) for user:", user.id);
        return new Response(
          JSON.stringify({ error: "Failed to join organization." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // organization_members row under service role (no INSERT policy for users).
      // Idempotent: ON CONFLICT (organization_id, user_id) DO NOTHING.
      const { error: memberError } = await supabaseClient
        .from("organization_members")
        .upsert(
          {
            user_id: user.id,
            organization_id: invite.organization_id,
            role: ORG_ROLE_MEMBER,
            joined_at: nowIso,
            invited_by: invite.created_by ?? null,
          },
          { onConflict: "organization_id,user_id", ignoreDuplicates: true }
        );

      if (memberError) {
        console.error("Error inserting organization member:", memberError);
        return new Response(
          JSON.stringify({ error: "Failed to join organization." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Claim stamp LAST -- now that affiliation (if any) has succeeded.
    const { error: claimError } = await supabaseClient
      .from("invites")
      .update({ claimed_by: user.id, claimed_at: nowIso })
      .eq("id", invite.id);

    if (claimError) {
      console.error("Error stamping claim:", claimError);
      return new Response(
        JSON.stringify({ error: "Failed to finalize invitation acceptance." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, organization_id: invite.organization_id ?? null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);