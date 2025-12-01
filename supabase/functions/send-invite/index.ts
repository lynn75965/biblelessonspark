import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import React from "npm:react@18.3.1";
import { renderAsync } from "npm:@react-email/components@0.0.22";
import { InviteEmail } from "./_templates/invite-email.tsx";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InviteRequest {
  email: string;
  role?: string;
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

    const { data: hasAdminRole, error: roleError } = await supabaseClient
      .rpc("has_role", { _user_id: user.id, _role: 'admin' });

    if (roleError || !hasAdminRole) {
      console.error("Admin verification error:", roleError, "User:", user.id);
      return new Response(
        JSON.stringify({ error: "Only administrators can send invites" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { email, role = "teacher" }: InviteRequest = await req.json();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingUsers } = await supabaseClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (existingUser) {
      return new Response(
        JSON.stringify({ error: "User with this email already exists" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: existingInvite } = await supabaseClient
      .from("invites")
      .select("id, claimed_by")
      .eq("email", email.toLowerCase())
      .is("claimed_by", null)
      .single();

    if (existingInvite) {
      return new Response(
        JSON.stringify({ error: "An unclaimed invite already exists for this email" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: inviterProfile } = await supabaseClient
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    const { data: invite, error: inviteError } = await supabaseClient
      .from("invites")
      .insert({
        email: email.toLowerCase(),
        created_by: user.id,
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

    console.log("Invite created:", invite);

    const signupUrl = `https://lessonsparkusa.com/auth?invite=${invite.token}`;

    const html = await renderAsync(
      React.createElement(InviteEmail, {
        inviterName: inviterProfile?.full_name || "LessonSpark USA Team",
        inviteUrl: signupUrl,
        recipientEmail: email,
      })
    );

    const { error: emailError } = await resend.emails.send({
      from: "LessonSpark USA <support@lessonsparkusa.com>",
      to: [email],
      subject: "You're invited to join LessonSpark USA",
      html,
    });

    if (emailError) {
      console.error("Error sending email:", emailError);
    } else {
      console.log("Invitation email sent to:", email);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Invitation sent successfully",
        token: invite.token
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in send-invite function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
