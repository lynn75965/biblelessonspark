/**
 * SEND-TOOLBELT-REFLECTION Edge Function
 * 
 * Sends the immediate reflection email to users who opt-in.
 * Creates email capture record and initializes tracking for nurture sequence.
 * 
 * SSOT Compliance:
 * - Imports from _shared/toolbeltConfig.ts
 * 
 * Key Features:
 * - Creates toolbelt_email_captures record
 * - Initializes toolbelt_email_tracking for nurture sequence
 * - Sends branded HTML email via Resend
 * - Handles duplicate emails gracefully
 * 
 * @version 1.0.0
 * @lastUpdated 2026-01-28
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SSOT Imports
import {
  TOOLBELT_TOOLS,
  TOOLBELT_EMAIL_SEQUENCE,
  type ToolbeltToolId,
} from "../_shared/toolbeltConfig.ts";

// ============================================================================
// CORS HEADERS
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// TYPES
// ============================================================================

interface SendReflectionRequest {
  email: string;
  tool_id: ToolbeltToolId;
  reflection: string;
}

interface SendReflectionResponse {
  success: boolean;
  message?: string;
  error?: string;
  code?: string;
}

// ============================================================================
// EMAIL TEMPLATE
// ============================================================================

/**
 * Build branded HTML email for reflection delivery
 */
function buildReflectionEmail(
  toolName: string,
  reflection: string,
  toolRoute: string
): string {
  // Escape HTML in reflection content but preserve line breaks
  const escapedReflection = reflection
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n\n/g, '</p><p style="margin: 0 0 16px 0; line-height: 1.7;">')
    .replace(/\n/g, '<br>');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Reflection from ${toolName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Georgia, 'Times New Roman', serif; background-color: #FFFEF9;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #FFFEF9;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3D5C3D 0%, #4A6F4A 100%); padding: 28px 32px; text-align: center;">
              <h1 style="margin: 0; color: #FFFFFF; font-size: 24px; font-weight: 600; font-family: Georgia, serif;">
                ✦ BibleLessonSpark
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Teacher Toolbelt
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 8px 0; color: #3D5C3D; font-size: 18px; font-weight: 600; font-family: Georgia, serif;">
                Your Reflection
              </h2>
              <p style="margin: 0 0 24px 0; color: #666666; font-size: 14px; font-style: italic;">
                from ${toolName}
              </p>
              
              <div style="color: #1a1a1a; font-size: 16px; line-height: 1.7;">
                <p style="margin: 0 0 16px 0; line-height: 1.7;">
                  ${escapedReflection}
                </p>
              </div>
              
              <!-- Divider -->
              <hr style="border: none; border-top: 1px solid #E5E2D9; margin: 32px 0;">
              
              <!-- Closing -->
              <p style="margin: 0 0 16px 0; color: #1a1a1a; font-size: 16px; line-height: 1.7;">
                This reflection was generated to help you process what you're already sensing about your teaching. Use what helps. Leave the rest.
              </p>
              
              <p style="margin: 0 0 24px 0; color: #1a1a1a; font-size: 16px; line-height: 1.7;">
                The toolbelt is always available when you need it:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #3D5C3D; border-radius: 6px;">
                    <a href="https://biblelessonspark.com/toolbelt" 
                       style="display: inline-block; padding: 14px 28px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 500; font-family: Georgia, serif;">
                      Return to Toolbelt
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Signature -->
              <p style="margin: 32px 0 0 0; color: #1a1a1a; font-size: 16px; line-height: 1.7;">
                Warmly,<br>
                Lynn
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F6F1; padding: 24px 32px; text-align: center; border-top: 1px solid #E5E2D9;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
                © ${new Date().getFullYear()} BibleLessonSpark. All rights reserved.
              </p>
              <p style="margin: 0; color: #888888; font-size: 11px;">
                You received this email because you requested a copy of your reflection.
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ========================================================================
    // 1. INITIALIZE CLIENTS
    // ========================================================================

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    if (!resendApiKey) {
      console.error("[send-toolbelt-reflection] Missing RESEND_API_KEY");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error", code: "CONFIG_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ========================================================================
    // 2. PARSE REQUEST
    // ========================================================================

    const body: SendReflectionRequest = await req.json();
    
    console.log("[send-toolbelt-reflection] Request received:", {
      email: body.email?.substring(0, 3) + "***",
      tool_id: body.tool_id,
    });

    // Validate required fields
    if (!body.email || !body.tool_id || !body.reflection) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Missing required fields: email, tool_id, reflection",
          code: "INVALID_REQUEST" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid email format",
          code: "INVALID_EMAIL" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate tool_id
    if (!TOOLBELT_TOOLS[body.tool_id]) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Invalid tool_id: ${body.tool_id}`,
          code: "INVALID_TOOL" 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const tool = TOOLBELT_TOOLS[body.tool_id];

    // ========================================================================
    // 3. CREATE OR UPDATE EMAIL CAPTURE
    // ========================================================================

    // Check if email already exists
    const { data: existingCapture } = await supabase
      .from("toolbelt_email_captures")
      .select("id")
      .eq("email", body.email.toLowerCase())
      .single();

    let captureId: string;

    if (existingCapture) {
      // Email already captured - update with new reflection
      captureId = existingCapture.id;
      console.log("[send-toolbelt-reflection] Email already captured, updating");
      
      await supabase
        .from("toolbelt_email_captures")
        .update({
          tool_id: body.tool_id,
          reflection_text: body.reflection,
          reflection_sent: false,
        })
        .eq("id", captureId);
    } else {
      // New email - create capture record
      const { data: newCapture, error: captureError } = await supabase
        .from("toolbelt_email_captures")
        .insert({
          email: body.email.toLowerCase(),
          tool_id: body.tool_id,
          reflection_text: body.reflection,
          reflection_sent: false,
        })
        .select("id")
        .single();

      if (captureError) {
        console.error("[send-toolbelt-reflection] Capture insert error:", captureError.message);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to save email", code: "DB_ERROR" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      captureId = newCapture.id;

      // Initialize tracking record for nurture sequence
      const { error: trackingError } = await supabase
        .from("toolbelt_email_tracking")
        .insert({
          email_capture_id: captureId,
          last_email_sent: 0,
          unsubscribed: false,
        });

      if (trackingError) {
        console.error("[send-toolbelt-reflection] Tracking insert error:", trackingError.message);
        // Non-fatal - continue with email send
      }
    }

    // ========================================================================
    // 4. SEND EMAIL VIA RESEND
    // ========================================================================

    const emailHtml = buildReflectionEmail(tool.name, body.reflection, tool.route);

    console.log("[send-toolbelt-reflection] Sending email via Resend");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `${TOOLBELT_EMAIL_SEQUENCE.fromEmail.replace('noreply@', 'BibleLessonSpark <noreply@')}`,
        reply_to: TOOLBELT_EMAIL_SEQUENCE.replyToEmail,
        to: [body.email],
        subject: tool.emailSubject,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error("[send-toolbelt-reflection] Resend API error:", errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email", code: "EMAIL_ERROR" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========================================================================
    // 5. UPDATE CAPTURE RECORD
    // ========================================================================

    await supabase
      .from("toolbelt_email_captures")
      .update({ reflection_sent: true })
      .eq("id", captureId);

    console.log("[send-toolbelt-reflection] Email sent successfully");

    // ========================================================================
    // 6. RETURN SUCCESS
    // ========================================================================

    return new Response(
      JSON.stringify({
        success: true,
        message: "Reflection sent to your email",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-toolbelt-reflection] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
