/**
 * send-toolbelt-reflection
 * 
 * Sends the user's reflection via email and captures their email
 * for the Toolbelt nurture sequence.
 * 
 * @version 1.0.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool display names for email subject
const TOOL_NAMES: Record<string, string> = {
  'lesson-fit': 'Does This Lesson Fit My Class?',
  'left-out': 'What Can Be Left Out Safely?',
  'one-truth': 'One-Truth Focus Finder',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request
    const { email, tool_id, reflection } = await req.json();

    if (!email || !tool_id || !reflection) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const toolName = TOOL_NAMES[tool_id] || 'Teacher Toolbelt';

    // Build branded HTML email
    const emailHtml = buildReflectionEmail(toolName, reflection);

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "BibleLessonSpark <noreply@biblelessonspark.com>",
        reply_to: "support@biblelessonspark.com",
        to: [email],
        subject: `Your reflection: ${toolName}`,
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      console.error("Resend API error:", errorData);
      throw new Error("Failed to send email");
    }

    // Capture email for nurture sequence (upsert to handle duplicates)
    const { error: captureError } = await supabase
      .from('toolbelt_email_captures')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          tool_id,
          reflection_sent: true,
          created_at: new Date().toISOString(),
        },
        {
          onConflict: 'email',
          ignoreDuplicates: false,
        }
      );

    if (captureError) {
      console.error("Email capture error:", captureError);
      // Don't fail the request - email was sent successfully
    }

    // Initialize tracking for email sequence (if not already exists)
    const { error: trackingError } = await supabase
      .from('toolbelt_email_tracking')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          last_email_sent: 0,
          sequence_started_at: new Date().toISOString(),
          unsubscribed: false,
        },
        {
          onConflict: 'email',
          ignoreDuplicates: true, // Don't overwrite if already tracking
        }
      );

    if (trackingError) {
      console.error("Tracking init error:", trackingError);
      // Don't fail - email was sent
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error in send-toolbelt-reflection:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

/**
 * Build branded HTML email with reflection content
 */
function buildReflectionEmail(toolName: string, reflection: string): string {
  // Format reflection paragraphs
  const formattedReflection = reflection
    .split('\n\n')
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.7;">${p}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Reflection from ${toolName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FFFEF9; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #FFFEF9;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #3D5C3D 0%, #4A6F4A 100%); padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 600;">
                ✦ BibleLessonSpark
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Teacher Toolbelt
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 8px 0; color: #3D5C3D; font-size: 20px; font-weight: 600;">
                ${toolName}
              </h2>
              <p style="margin: 0 0 24px 0; color: #666666; font-size: 14px;">
                Here's the reflection you requested
              </p>
              
              <!-- Reflection Box -->
              <div style="background-color: #F9F8F5; border-left: 4px solid #3D5C3D; padding: 24px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">
                <div style="color: #1a1a1a; font-size: 16px;">
                  ${formattedReflection}
                </div>
              </div>

              <p style="margin: 24px 0 0 0; color: #666666; font-size: 14px; line-height: 1.6;">
                This reflection was created to support your teaching preparation. 
                Use what helps. Leave the rest.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding: 0 32px 32px 32px; text-align: center;">
              <a href="https://biblelessonspark.com/toolbelt" 
                 style="display: inline-block; background-color: #3D5C3D; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500; font-size: 14px;">
                Explore More Tools
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F5F3EE; padding: 24px 32px; text-align: center; border-top: 1px solid #E5E2DB;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
                BibleLessonSpark · Personalized Bible Study Lessons for Baptist Teachers
              </p>
              <p style="margin: 0; color: #999999; font-size: 11px;">
                You're receiving this because you requested a reflection from the Teacher Toolbelt.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
