import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { InviteEmail } from "./_templates/invite-email.tsx";

// SSOT Imports - All values come from centralized sources
import { buildInviteUrl } from "../_shared/routes.ts";
import { 
  getBranding, 
  getEmailFrom, 
  getEmailSubject, 
  getAppName,
  getBaseUrl,
  FALLBACK_BRANDING 
} from "../_shared/branding.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role?: string;
  organization_id?: string;
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, role = "teacher", organization_id }: InviteRequest = await req.json();

    // ========================================================================
    // SSOT: Get branding configuration
    // ========================================================================
    const branding = await getBranding(supabaseClient);
    const appName = getAppName(branding);

    // Check if user is admin
    const { data: hasAdminRole } = await supabaseClient
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    // Check if user is org leader
    let isOrgLeader = false;
    let userOrgId: string | null = null;

    if (!hasAdminRole) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("organization_id, organization_role")
        .eq("id", user.id)
        .single();

      if (profile?.organization_role === "leader" || profile?.organization_role === "co-leader") {
        isOrgLeader = true;
        userOrgId = profile.organization_id;
      }
    }

    // Authorization check
    if (!hasAdminRole && !isOrgLeader) {
      return new Response(
        JSON.stringify({ error: "Only administrators or organization leaders can send invites" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Org leaders can only invite to their own org
    let finalOrgId = organization_id;
    if (isOrgLeader && !hasAdminRole) {
      if (organization_id && organization_id !== userOrgId) {
        return new Response(
          JSON.stringify({ error: "You can only invite members to your own organization" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      finalOrgId = userOrgId;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing user
    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing unclaimed invite
    const { data: existingInvite } = await supabaseClient
      .from("invites")
      .select("id")
      .eq("email", email.toLowerCase())
      .is("claimed_at", null)
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: "An invite has already been sent to this email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get organization name if applicable
    let orgName: string | null = null;
    if (finalOrgId) {
      const { data: org } = await supabaseClient
        .from("organizations")
        .select("name")
        .eq("id", finalOrgId)
        .single();
      orgName = org?.name || null;
    }

    // Get inviter name (SSOT: use appName for fallback)
    const { data: inviterProfile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const inviterName = inviterProfile?.full_name || `A ${appName} administrator`;

    // Create invite token
    const inviteToken = crypto.randomUUID();

    // Insert invite record with inviter_name and organization_name
    const { data: invite, error: inviteError } = await supabaseClient
      .from("invites")
      .insert({
        email: email.toLowerCase(),
        token: inviteToken,
        created_by: user.id,
        organization_id: finalOrgId || null,
        inviter_name: inviterName,
        organization_name: orgName,
      })
      .select()
      .single();

    if (inviteError) {
      console.error("Error creating invite:", inviteError);
      return new Response(
        JSON.stringify({ error: "Failed to create invite" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // SSOT: Build invite URL using branding baseUrl
    // ========================================================================
    const baseUrl = Deno.env.get("SITE_URL") || getBaseUrl(branding);
    const inviteUrl = buildInviteUrl(baseUrl, inviteToken);

    // Render email template (passes appName for SSOT branding in template)
    const emailHtml = await renderAsync(
      React.createElement(InviteEmail, {
        inviteUrl,
        inviterName,
        organizationName: orgName,
        appName, // SSOT: Pass app name to template
      })
    );

    // ========================================================================
    // SSOT: Send email using branding helper functions
    // ========================================================================
    const emailFrom = getEmailFrom(branding);
    const emailSubject = orgName
      ? getEmailSubject(branding, 'orgInvitation', { orgName })
      : `You've been invited to ${appName}`;

    const { error: emailError } = await resend.emails.send({
      from: emailFrom,
      to: email,
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
      // Note: We don't return error here - invite was created, email just failed
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Invite sent to ${email}`,
        invite_id: invite.id,
        organization_id: finalOrgId,
      }),
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
