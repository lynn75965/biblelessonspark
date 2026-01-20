import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { FocusNotificationEmail } from "./_templates/focus-email.tsx";
import { getBranding, getBaseUrl } from "../_shared/branding.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface FocusNotificationRequest {
  focus_id: string;
  organization_id: string;
  is_update?: boolean;
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

    const { focus_id, organization_id, is_update = false }: FocusNotificationRequest = await req.json();

    // Verify user is org leader or admin
    const { data: hasAdminRole } = await supabaseClient
      .rpc("has_role", { _user_id: user.id, _role: "admin" });

    if (!hasAdminRole) {
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("organization_id, organization_role")
        .eq("id", user.id)
        .single();

      if (profile?.organization_role !== "leader" && profile?.organization_role !== "co-leader") {
        return new Response(
          JSON.stringify({ error: "Only organization leaders can send focus notifications" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (profile?.organization_id !== organization_id) {
        return new Response(
          JSON.stringify({ error: "You can only notify members of your own organization" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Get focus details
    const { data: focus, error: focusError } = await supabaseClient
      .from("org_shared_focus")
      .select("*")
      .eq("id", focus_id)
      .single();

    if (focusError || !focus) {
      console.error("Focus fetch error:", focusError);
      return new Response(
        JSON.stringify({ error: "Focus not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get organization name
    const { data: org } = await supabaseClient
      .from("organizations")
      .select("name")
      .eq("id", organization_id)
      .single();

    const orgName = org?.name || "Your Organization";

    // Get all org members (excluding the person who set the focus)
    const { data: members, error: membersError } = await supabaseClient
      .from("profiles")
      .select("id, email, full_name")
      .eq("organization_id", organization_id)
      .neq("id", user.id);

    if (membersError) {
      console.error("Members fetch error:", membersError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch organization members" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!members || members.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No other members to notify",
          emails_sent: 0 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build login URL
    // SSOT: Get base URL from branding config
    const branding = await getBranding(supabaseClient);
    const baseUrl = getBaseUrl(branding);
    const loginUrl = `${baseUrl}/auth?tab=signin`;

    // Send emails to all members
    let emailsSent = 0;
    let emailsFailed = 0;

    for (const member of members) {
      if (!member.email) continue;

      try {
        const emailHtml = await renderAsync(
          React.createElement(FocusNotificationEmail, {
            organizationName: orgName,
            passage: focus.passage,
            theme: focus.theme,
            startDate: focus.start_date,
            endDate: focus.end_date,
            notes: focus.notes,
            loginUrl,
          })
        );

        const subject = is_update
          ? `Focus Updated for ${orgName}`
          : `New Focus Set for ${orgName}`;

        const { error: emailError } = await resend.emails.send({
          from: "LessonSpark USA <noreply@lessonsparkusa.com>",
          to: member.email,
          subject,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to send email to ${member.email}:`, emailError);
          emailsFailed++;
        } else {
          emailsSent++;
        }
      } catch (emailErr) {
        console.error(`Error sending to ${member.email}:`, emailErr);
        emailsFailed++;
      }
    }

    console.log(`Focus notification: sent ${emailsSent}, failed ${emailsFailed}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Notifications sent to ${emailsSent} member(s)`,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
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

