/**
 * SEND-TOOLBELT-SEQUENCE Edge Function
 * 
 * Processes the Toolbelt nurture email sequence.
 * Called hourly via pg_cron job.
 * 
 * SSOT Compliance:
 * - Imports from _shared/toolbeltConfig.ts
 * 
 * Key Features:
 * - Queries users who need next email based on timing
 * - Loads templates from toolbelt_email_templates
 * - Sends branded HTML email via Resend
 * - Updates tracking records after send
 * - Respects unsubscribe status
 * 
 * @version 1.0.0
 * @lastUpdated 2026-01-28
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// SSOT Imports
import {
  TOOLBELT_EMAIL_SEQUENCE,
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

interface EmailTemplate {
  id: string;
  sequence_order: number;
  send_day: number;
  subject: string;
  body: string;
  is_html: boolean;
  is_active: boolean;
}

interface TrackingRecord {
  id: string;
  email_capture_id: string;
  last_email_sent: number;
  last_email_sent_at: string | null;
  unsubscribed: boolean;
  created_at: string;
  capture: {
    email: string;
  };
}

// ============================================================================
// EMAIL TEMPLATE BUILDER
// ============================================================================

/**
 * Convert plain text to HTML with smart formatting
 */
function plainTextToHtml(text: string): string {
  // Escape HTML
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Convert URLs on their own line to buttons
  html = html.replace(
    /^(https?:\/\/[^\s]+)$/gm,
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px 0;"><tr><td style="background-color: #3D5C3D; border-radius: 6px;"><a href="$1" style="display: inline-block; padding: 14px 28px; color: #FFFFFF; text-decoration: none; font-size: 16px; font-weight: 500;">Visit Link</a></td></tr></table>'
  );

  // Convert inline URLs to links
  html = html.replace(
    /(?<!href=")(https?:\/\/[^\s<]+)/g,
    '<a href="$1" style="color: #3D5C3D; text-decoration: underline;">$1</a>'
  );

  // Convert bullet points
  html = html.replace(/^[-•]\s+(.+)$/gm, '<li style="margin-bottom: 8px;">$1</li>');
  html = html.replace(/(<li[^>]*>.*<\/li>\n?)+/g, '<ul style="margin: 16px 0; padding-left: 24px;">$&</ul>');

  // Convert bold text
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Convert paragraphs (double line breaks)
  html = html.replace(/\n\n/g, '</p><p style="margin: 0 0 16px 0; line-height: 1.7;">');

  // Convert single line breaks
  html = html.replace(/\n/g, '<br>');

  // Wrap in paragraph
  html = '<p style="margin: 0 0 16px 0; line-height: 1.7;">' + html + '</p>';

  return html;
}

/**
 * Build branded HTML email wrapper
 */
function buildEmailWrapper(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
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
                For Faithful Bible Teachers
              </p>
            </td>
          </tr>
          
          <!-- Body -->
          <tr>
            <td style="padding: 32px; color: #1a1a1a; font-size: 16px; line-height: 1.7;">
              ${bodyHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8F6F1; padding: 24px 32px; text-align: center; border-top: 1px solid #E5E2D9;">
              <p style="margin: 0 0 8px 0; color: #666666; font-size: 12px;">
                © ${new Date().getFullYear()} BibleLessonSpark. All rights reserved.
              </p>
              <p style="margin: 0 0 8px 0; color: #888888; font-size: 11px;">
                <a href="https://biblelessonspark.com/help" style="color: #3D5C3D; text-decoration: underline;">Help</a>
              </p>
              <p style="margin: 0; color: #888888; font-size: 11px;">
                You received this email because you used the Teacher Toolbelt.
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

/**
 * Personalize email content with variables
 */
function personalizeContent(content: string, email: string): string {
  // Extract name from email (before @) as fallback
  const namePart = email.split('@')[0];
  const displayName = namePart
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());

  return content
    .replace(/\{name\}/gi, displayName)
    .replace(/\{email\}/gi, email);
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  let emailsSent = 0;
  let errors = 0;

  try {
    // ========================================================================
    // 1. INITIALIZE CLIENTS
    // ========================================================================

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    if (!resendApiKey) {
      console.error("[send-toolbelt-sequence] Missing RESEND_API_KEY");
      return new Response(
        JSON.stringify({ success: false, error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[send-toolbelt-sequence] Starting sequence processing");

    // ========================================================================
    // 2. LOAD ACTIVE TEMPLATES
    // ========================================================================

    const { data: templates, error: templateError } = await supabase
      .from("toolbelt_email_templates")
      .select("*")
      .eq("tenant_id", "default")
      .eq("is_active", true)
      .order("sequence_order", { ascending: true });

    if (templateError || !templates || templates.length === 0) {
      console.log("[send-toolbelt-sequence] No active templates found");
      return new Response(
        JSON.stringify({ success: true, message: "No active templates", emailsSent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-toolbelt-sequence] Found ${templates.length} active templates`);

    // ========================================================================
    // 3. FIND USERS WHO NEED EMAILS
    // ========================================================================

    // Get all tracking records that aren't unsubscribed
    const { data: trackingRecords, error: trackingError } = await supabase
      .from("toolbelt_email_tracking")
      .select(`
        id,
        email_capture_id,
        last_email_sent,
        last_email_sent_at,
        unsubscribed,
        created_at,
        capture:toolbelt_email_captures!email_capture_id (
          email
        )
      `)
      .eq("unsubscribed", false);

    if (trackingError) {
      console.error("[send-toolbelt-sequence] Tracking query error:", trackingError.message);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!trackingRecords || trackingRecords.length === 0) {
      console.log("[send-toolbelt-sequence] No users to process");
      return new Response(
        JSON.stringify({ success: true, message: "No users to process", emailsSent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-toolbelt-sequence] Processing ${trackingRecords.length} tracking records`);

    const now = new Date();

    // ========================================================================
    // 4. PROCESS EACH USER
    // ========================================================================

    for (const record of trackingRecords) {
      try {
        // Type assertion for the joined data
        const tracking = record as unknown as TrackingRecord;
        
        if (!tracking.capture?.email) {
          console.log(`[send-toolbelt-sequence] Skipping record ${tracking.id} - no email`);
          continue;
        }

        // Find the next template they should receive
        const nextSequenceOrder = tracking.last_email_sent + 1;
        const nextTemplate = templates.find(t => t.sequence_order === nextSequenceOrder);

        if (!nextTemplate) {
          // User has received all emails in sequence
          continue;
        }

        // Calculate when this email should be sent
        const sequenceStartDate = new Date(tracking.created_at);
        const sendAfterDate = new Date(sequenceStartDate);
        sendAfterDate.setDate(sendAfterDate.getDate() + nextTemplate.send_day);

        // Check if it's time to send
        if (now < sendAfterDate) {
          // Not yet time for this email
          continue;
        }

        console.log(`[send-toolbelt-sequence] Sending email ${nextSequenceOrder} to ${tracking.capture.email.substring(0, 3)}***`);

        // ====================================================================
        // 5. BUILD AND SEND EMAIL
        // ====================================================================

        // Personalize content
        const personalizedBody = personalizeContent(nextTemplate.body, tracking.capture.email);

        // Convert to HTML if needed
        let bodyHtml: string;
        if (nextTemplate.is_html) {
          bodyHtml = personalizedBody;
        } else {
          bodyHtml = plainTextToHtml(personalizedBody);
        }

        // Wrap in branded template
        const emailHtml = buildEmailWrapper(nextTemplate.subject, bodyHtml);

        // Send via Resend
        const resendResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "BibleLessonSpark <noreply@biblelessonspark.com>",
            reply_to: TOOLBELT_EMAIL_SEQUENCE.replyToEmail,
            to: [tracking.capture.email],
            subject: nextTemplate.subject,
            html: emailHtml,
          }),
        });

        if (!resendResponse.ok) {
          const errorText = await resendResponse.text();
          console.error(`[send-toolbelt-sequence] Resend error for ${tracking.id}:`, errorText);
          errors++;
          continue;
        }

        // ====================================================================
        // 6. UPDATE TRACKING RECORD
        // ====================================================================

        await supabase
          .from("toolbelt_email_tracking")
          .update({
            last_email_sent: nextSequenceOrder,
            last_email_sent_at: now.toISOString(),
          })
          .eq("id", tracking.id);

        emailsSent++;
        console.log(`[send-toolbelt-sequence] Successfully sent email ${nextSequenceOrder}`);

      } catch (recordError) {
        console.error(`[send-toolbelt-sequence] Error processing record:`, recordError);
        errors++;
      }
    }

    // ========================================================================
    // 7. RETURN SUMMARY
    // ========================================================================

    const duration = Date.now() - startTime;
    console.log(`[send-toolbelt-sequence] Complete. Sent: ${emailsSent}, Errors: ${errors}, Duration: ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        emailsSent,
        errors,
        duration,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[send-toolbelt-sequence] Unexpected error:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error", emailsSent, errors }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
