/**
 * send-toolbelt-reflection
 *
 * Public lead-gen endpoint. Emails a Teacher Toolbelt reflection to a
 * caller-supplied address and captures the email for the nurture sequence.
 *
 * HARDENED (2026-06-18):
 *  - Content lock: the email body is rendered server-side from a stored,
 *    server-generated reflection (toolbelt_usage.reflection_text) looked up by
 *    reflection_id. The caller no longer authors the body. reflection_text is
 *    HTML-escaped on render as defense-in-depth.
 *  - Fail-CLOSED rate limiting via the increment_rate_limit RPC, three scopes:
 *    per-IP/hour (10), per-recipient-email/day (3), global/day (500). Any cap
 *    exceeded OR any RPC error => 429, before the Resend call.
 *  - Id-only: the caller supplies { email, reflection_id }. The legacy
 *    { tool_id, reflection } body is no longer accepted.
 *
 * @version 2.1.0
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tool display names for the email subject/heading (server-controlled).
const TOOL_NAMES: Record<string, string> = {
  'lesson-fit': 'Does This Lesson Fit My Class?',
  'left-out': 'What Can Be Left Out Safely?',
  'one-truth': 'One-Truth Focus Finder',
};

// Rate-limit caps.
const CAP_IP_PER_HOUR = 10;
const CAP_EMAIL_PER_DAY = 3;
const CAP_GLOBAL_PER_DAY = 500;

/**
 * Best-effort client IP. x-forwarded-for is client-spoofable in Supabase Edge
 * Functions; the real client IP is the RIGHTMOST entry (proxies append it), so
 * the leftmost value is never trusted. cf-connecting-ip (if Cloudflare-fronted)
 * is preferred. IP is a secondary control only -- the per-email and global caps
 * are the spoof-proof primary defenses.
 */
function getClientIP(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function windowStartsISO(): { hour: string; day: string } {
  const now = new Date();
  const hour = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()
  )).toISOString();
  const day = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
  )).toISOString();
  return { hour, day };
}

/**
 * Fail-CLOSED multi-scope rate limit. Increments each scope atomically via the
 * service_role-only increment_rate_limit RPC and rejects if any returned count
 * exceeds its cap. Any RPC error => blocked (fail closed).
 */
async function enforceRateLimits(
  supabase: any,
  ip: string,
  email: string,
): Promise<{ blocked: boolean; scope?: string }> {
  const { hour, day } = windowStartsISO();
  const checks = [
    { endpoint: "toolbelt-reflection:ip", identifier: ip, window: hour, cap: CAP_IP_PER_HOUR },
    { endpoint: "toolbelt-reflection:email", identifier: email, window: day, cap: CAP_EMAIL_PER_DAY },
    { endpoint: "toolbelt-reflection:global", identifier: "GLOBAL", window: day, cap: CAP_GLOBAL_PER_DAY },
  ];

  for (const c of checks) {
    const { data, error } = await supabase.rpc("increment_rate_limit", {
      p_endpoint: c.endpoint,
      p_identifier: c.identifier,
      p_window_start: c.window,
    });
    if (error) {
      console.error("[send-toolbelt-reflection] rate-limit RPC error (fail closed):", c.endpoint, error.message);
      return { blocked: true, scope: c.endpoint };
    }
    const count = Array.isArray(data) ? data[0] : data;
    if (typeof count !== "number" || count > c.cap) {
      return { blocked: true, scope: c.endpoint };
    }
  }
  return { blocked: false };
}

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
    const body = await req.json();
    const email: string | undefined = body?.email;
    const reflectionId: string | undefined = body?.reflection_id;

    // Validate recipient
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid email format" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    const recipient = email.toLowerCase().trim();

    // Content lock: a reflection_id is required and the email body is rendered
    // ONLY from the stored, server-generated reflection. The caller never
    // supplies body text.
    if (!reflectionId) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing reflection_id" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    const { data: row, error: rowError } = await supabase
      .from("toolbelt_usage")
      .select("reflection_text, tool_id")
      .eq("id", reflectionId)
      .single();

    if (rowError || !row || !row.reflection_text) {
      return new Response(
        JSON.stringify({ success: false, error: "Reflection not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 404 }
      );
    }
    const reflectionText: string = row.reflection_text;
    const toolId: string = row.tool_id || "";

    // Fail-CLOSED rate limiting, before any send.
    const ip = getClientIP(req);
    const rl = await enforceRateLimits(supabase, ip, recipient);
    if (rl.blocked) {
      console.warn("[send-toolbelt-reflection] rate limited:", rl.scope, "ip:", ip, "email:", recipient);
      return new Response(
        JSON.stringify({ success: false, error: "Rate limit exceeded. Please try again later." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 429 }
      );
    }

    const toolName = TOOL_NAMES[toolId] || 'Teacher Toolbelt';

    // Build the email entirely server-side; reflection text is escaped on render.
    const emailHtml = buildReflectionEmail(toolName, reflectionText);

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
        to: [recipient],
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
          email: recipient,
          tool_id: toolId,
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
          email: recipient,
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
 * Build branded HTML email with reflection content.
 * The reflection paragraphs are HTML-escaped (defense-in-depth); subject,
 * heading, branding and layout are all server-defined.
 */
function buildReflectionEmail(toolName: string, reflection: string): string {
  const safeToolName = escapeHtml(toolName);
  // Format reflection paragraphs (escaped)
  const formattedReflection = reflection
    .split('\n\n')
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.7;">${escapeHtml(p)}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Reflection from ${safeToolName}</title>
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
                \u2726 BibleLessonSpark
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
                ${safeToolName}
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
                BibleLessonSpark \u00B7 Personalized Bible Study Lessons for Baptist Teachers
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
