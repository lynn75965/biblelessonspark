import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { TeamInviteEmail } from "./_templates/team-invite-email.tsx";

// SSOT Imports - All values come from centralized sources
import {
  getBranding,
  getEmailFrom,
  getAppName,
  getBaseUrl,
} from "../_shared/branding.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NotifyRequest {
  team_member_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── Auth: Verify caller is a logged-in user ──────────────────────────
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Parse request ────────────────────────────────────────────────────
    const { team_member_id }: NotifyRequest = await req.json();

    if (!team_member_id) {
      return new Response(
        JSON.stringify({ error: "team_member_id is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Look up the invitation row ───────────────────────────────────────
    const { data: memberRow, error: memberError } = await supabaseClient
      .from("teaching_team_members")
      .select("id, team_id, user_id, status")
      .eq("id", team_member_id)
      .single();

    if (memberError || !memberRow) {
      console.error("Error fetching team member row:", memberError);
      return new Response(
        JSON.stringify({ error: "Invitation not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Look up the team ─────────────────────────────────────────────────
    const { data: teamRow, error: teamError } = await supabaseClient
      .from("teaching_teams")
      .select("id, name, lead_teacher_id")
      .eq("id", memberRow.team_id)
      .single();

    if (teamError || !teamRow) {
      console.error("Error fetching team:", teamError);
      return new Response(
        JSON.stringify({ error: "Team not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verify the caller is the lead teacher of this team
    if (teamRow.lead_teacher_id !== user.id) {
      return new Response(
        JSON.stringify({ error: "Only the lead teacher can trigger invitation emails" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Look up invitee profile (SSOT: full_name, email) ─────────────────
    const { data: inviteeProfile, error: inviteeError } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", memberRow.user_id)
      .single();

    if (inviteeError || !inviteeProfile?.email) {
      console.error("Error fetching invitee profile:", inviteeError);
      return new Response(
        JSON.stringify({ error: "Invitee profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // ── Look up lead teacher name (SSOT: full_name) ──────────────────────
    const { data: leadProfile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", teamRow.lead_teacher_id)
      .single();

    const leadTeacherName = leadProfile?.full_name || "A fellow teacher";

    // ── SSOT: Get branding configuration ─────────────────────────────────
    const branding = await getBranding(supabaseClient);
    const appName = getAppName(branding);
    const baseUrl = getBaseUrl(branding);
    const emailFrom = getEmailFrom(branding);
    const loginUrl = `${baseUrl}/dashboard`;

    // ── Render email ─────────────────────────────────────────────────────
    const emailHtml = await renderAsync(
      React.createElement(TeamInviteEmail, {
        inviteeName: inviteeProfile.full_name || "Friend",
        leadTeacherName,
        teamName: teamRow.name,
        loginUrl,
        appName,
      })
    );

    const emailSubject = `${leadTeacherName} has invited you to join "${teamRow.name}" on ${appName}`;

    // ── Send email via Resend ────────────────────────────────────────────
    const { error: emailError } = await resend.emails.send({
      from: emailFrom,
      to: inviteeProfile.email,
      subject: emailSubject,
      html: emailHtml,
    });

    if (emailError) {
      console.error("Error sending team invitation email:", emailError);
      // Return success anyway — the invitation record already exists
      return new Response(
        JSON.stringify({
          success: true,
          email_sent: false,
          message: "Invitation exists but email failed to send",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Team invitation email sent to:", inviteeProfile.email);

    return new Response(
      JSON.stringify({
        success: true,
        email_sent: true,
        message: `Notification sent to ${inviteeProfile.email}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error in notify-team-invitation:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
