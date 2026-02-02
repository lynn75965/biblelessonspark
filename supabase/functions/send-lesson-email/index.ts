/**
 * send-lesson-email Edge Function
 * ================================
 * Sends a Bible lesson TEASER + SECTION 8 ONLY via email to one or more recipients.
 *
 * SSOT: emailDeliveryConfig.ts (frontend drives backend)
 * Branding: branding.ts (database-driven with fallback)
 * Delivery: Resend API
 *
 * Email content: Teacher sends teaser + Section 8 body only (no Section 8 header).
 * Full lesson is NOT included — recipients see a preview to encourage attendance.
 *
 * Security:
 * - Requires valid Supabase JWT
 * - Requires paid subscription tier (personal or admin)
 * - Max 25 recipients per call (from SSOT config)
 * - Each recipient receives an individual email (privacy)
 *
 * Created: 2026-02-01
 * Updated: 2026-02-02 — Fixed section extraction regex to match ## headers
 * Version: 1.1.0
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  getBranding,
  getEmailFrom,
  getReplyTo,
  getBaseUrl,
  getAppName,
} from "../_shared/branding.ts";
import {
  EMAIL_DELIVERY_CONFIG,
  EMAIL_DELIVERY_VERSION,
  buildEmailSubject,
  isValidEmail,
} from "../_shared/emailDeliveryConfig.ts";

// ============================================================================
// CORS
// ============================================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: Record<string, any>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ============================================================================
// LESSON CONTENT FORMATTER (markdown-like → email-safe HTML)
// ============================================================================

/**
 * Escape HTML entities in raw text
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Convert lesson markdown-style text to email-safe HTML.
 * Uses inline styles only (no CSS classes) for email client compatibility.
 *
 * NOTE: This formats the Section 8 BODY only — the Section 8 header
 * is intentionally stripped before this function is called.
 * Any remaining sub-headers (### level) within Section 8 are styled.
 */
function formatLessonForEmail(text: string): string {
  let html = escapeHtml(text);

  // Sub-section headers within Section 8: ### Heading → styled subheader
  html = html.replace(
    /^###\s+(.+)$/gm,
    '<div style="font-family:Georgia,serif;font-size:15px;font-weight:bold;color:#3D5C3D;margin:16px 0 8px 0;">$1</div>'
  );

  // Bold text: **text** → <strong>
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

  // Italic text: *text* → <em>
  html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // Bullet points: lines starting with •, -, or *
  html = html.replace(
    /^[\u2022\-\*]\s+(.+)$/gm,
    '<li style="margin-bottom:4px;font-family:Georgia,serif;font-size:15px;color:#1a1a1a;">$1</li>'
  );
  // Wrap consecutive <li> in <ul>
  html = html.replace(
    /((?:<li[^>]*>.*?<\/li>\s*)+)/g,
    '<ul style="padding-left:20px;margin:8px 0;">$1</ul>'
  );

  // Numbered lists: lines starting with "1. ", "2. ", etc.
  html = html.replace(
    /^\d+\.\s+(.+)$/gm,
    '<li style="margin-bottom:4px;font-family:Georgia,serif;font-size:15px;color:#1a1a1a;">$1</li>'
  );

  // Double line breaks → paragraph breaks
  html = html.replace(
    /\n\n+/g,
    '</p><p style="margin:0 0 10px 0;font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#1a1a1a;">'
  );

  // Single line breaks → <br>
  html = html.replace(/\n/g, "<br>");

  // Wrap in opening paragraph tag
  html =
    '<p style="margin:0 0 10px 0;font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#1a1a1a;">' +
    html +
    "</p>";

  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, "");

  return html;
}

// ============================================================================
// SECTION 8 EXTRACTOR — MULTI-FORMAT (robust)
// ============================================================================

/**
 * Test whether a line is a section header in ANY of the formats
 * that the lesson generator may produce:
 *
 *   Format A:  ## Section 8: Student Handout
 *   Format B:  ## Section 8 – Student Handout
 *   Format C:  **Section 8: Student Handout**
 *   Format D:  **Section 8 – Student Handout**
 *   Format E:  Section 8: Student Handout  (plain)
 *
 * Returns the section number if matched, or -1 if not a header.
 */
function parseSectionHeaderNumber(line: string): number {
  const trimmed = line.trim();

  // Strip leading ## (markdown header markers)
  let cleaned = trimmed.replace(/^#{1,4}\s*/, "");

  // Strip surrounding ** (bold markers)
  cleaned = cleaned.replace(/^\*\*/, "").replace(/\*\*$/, "");

  // Now match "Section N" at the start
  const match = cleaned.match(/^Section\s+(\d+)/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  return -1;
}

/**
 * Extract Section 8's content (body only, no header line).
 *
 * Strategy: scan all lines, find the LAST line that is a Section header.
 * If it's Section 8, return everything after it (until end of text).
 * If no Section 8 found, return empty string (fallback handled by caller).
 */
function extractSection8Content(lessonText: string): string {
  const lines = lessonText.split("\n");
  let lastSectionLineIndex = -1;
  let lastSectionNumber = -1;

  for (let i = 0; i < lines.length; i++) {
    const sectionNum = parseSectionHeaderNumber(lines[i]);
    if (sectionNum > 0) {
      lastSectionLineIndex = i;
      lastSectionNumber = sectionNum;
    }
  }

  // Diagnostic logging
  if (lastSectionLineIndex === -1) {
    console.log("[extractSection8] No section headers found in ANY format.");
    console.log("[extractSection8] First 300 chars:", lessonText.substring(0, 300));
    return "";
  }

  console.log(
    `[extractSection8] Last section found: Section ${lastSectionNumber} at line ${lastSectionLineIndex}: "${lines[lastSectionLineIndex].substring(0, 80)}"`
  );

  // Grab everything after the header line
  const body = lines
    .slice(lastSectionLineIndex + 1)
    .join("\n")
    .trim();

  if (!body) {
    console.log("[extractSection8] Section header found but body is empty.");
  }

  return body;
}

// ============================================================================
// EMAIL HTML TEMPLATE BUILDER
// ============================================================================

interface EmailTemplateParams {
  lessonTitle: string;
  lessonContent: string;
  teaserContent?: string | null;
  senderName: string;
  personalMessage?: string | null;
  metadata?: {
    ageGroup?: string | null;
    theologyProfile?: string | null;
    bibleVersion?: string | null;
    copyrightNotice?: string | null;
  } | null;
  appName: string;
  baseUrl: string;
}

function buildLessonEmailHtml(params: EmailTemplateParams): string {
  const {
    lessonTitle,
    teaserContent,
    lessonContent,
    senderName,
    personalMessage,
    metadata,
    appName,
    baseUrl,
  } = params;

  // ---------------------------------------------------------------
  // Extract Section 8 body (no header) from the full lesson text
  // ---------------------------------------------------------------
  const section8Body = extractSection8Content(lessonContent);

  // Format for email — Section 8 body only, or fallback message
  const formattedSection8 = section8Body
    ? formatLessonForEmail(section8Body)
    : '<p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#666;font-style:italic;">The full lesson is available from your teacher.</p>';

  // Personal message section
  const personalMessageHtml = personalMessage
    ? `<div style="background:#f0f7ff;border-left:4px solid #3B82F6;padding:12px 16px;margin:0 0 20px 0;border-radius:0 4px 4px 0;">
        <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#333;font-style:italic;">${escapeHtml(personalMessage)}</p>
      </div>`
    : "";

  // Metadata line
  const metaParts: string[] = [];
  if (metadata?.ageGroup) metaParts.push(metadata.ageGroup);
  if (metadata?.theologyProfile) metaParts.push(metadata.theologyProfile);
  const metaLine = metaParts.length > 0 ? metaParts.join(" | ") : "";

  // Teaser box
  const teaserHtml = teaserContent
    ? `<tr><td style="padding:0 32px 16px 32px;">
        <div style="background:#F0F7FF;border:1px solid #3B82F6;border-radius:4px;padding:12px 16px;">
          <p style="margin:0 0 4px 0;font-family:Georgia,serif;font-size:12px;color:#2563EB;font-weight:bold;">THIS WEEK'S LESSON PREVIEW</p>
          <p style="margin:0;font-family:Georgia,serif;font-size:14px;color:#333;font-style:italic;">${escapeHtml(teaserContent)}</p>
        </div>
      </td></tr>`
    : "";

  // Copyright notice
  const copyrightHtml = metadata?.copyrightNotice
    ? `<tr><td style="padding:0 32px 20px 32px;">
        <div style="border-top:1px solid #ddd;padding-top:12px;margin-top:8px;">
          <p style="margin:0;font-family:Georgia,serif;font-size:12px;color:#999;font-style:italic;text-align:center;">${escapeHtml(metadata.copyrightNotice)}</p>
        </div>
      </td></tr>`
    : "";

  // Current year
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(lessonTitle)} - ${appName}</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;">
    <tr>
      <td align="center" style="padding:20px 10px;">

        <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFEF9;border-radius:8px;overflow:hidden;max-width:600px;">

          <!-- ======== HEADER ======== -->
          <tr>
            <td style="background:#3D5C3D;padding:24px 32px;text-align:center;">
              <p style="margin:0;font-family:Georgia,serif;font-size:20px;color:#C5D9C5;font-weight:bold;">✦ ${escapeHtml(appName)}</p>
              <p style="margin:6px 0 0 0;font-family:Georgia,serif;font-size:12px;color:#A3C4A3;">Personalized Bible Studies in Minutes</p>
            </td>
          </tr>

          <!-- ======== SENDER + PERSONAL MESSAGE ======== -->
          <tr>
            <td style="padding:24px 32px 0 32px;">
              <p style="margin:0 0 16px 0;font-family:Georgia,serif;font-size:15px;color:#1a1a1a;">
                <strong>${escapeHtml(senderName)}</strong> shared a Bible lesson with you:
              </p>
              ${personalMessageHtml}
            </td>
          </tr>

          <!-- ======== LESSON TITLE + METADATA ======== -->
          <tr>
            <td style="padding:0 32px 8px 32px;">
              <h1 style="margin:0 0 6px 0;font-family:Georgia,serif;font-size:22px;color:#1a1a1a;line-height:1.3;">${escapeHtml(lessonTitle)}</h1>
              ${metaLine ? `<p style="margin:0;font-family:Georgia,serif;font-size:13px;color:#666;">${escapeHtml(metaLine)}</p>` : ""}
            </td>
          </tr>

          <!-- ======== TEASER (if present) ======== -->
          ${teaserHtml}

          <!-- ======== SECTION 8 CONTENT (body only, no header) ======== -->
          <tr>
            <td style="padding:8px 32px 24px 32px;">
              ${formattedSection8}
            </td>
          </tr>

          <!-- ======== COPYRIGHT ======== -->
          ${copyrightHtml}

          <!-- ======== FOOTER ======== -->
          <tr>
            <td style="background:#f0ede6;padding:20px 32px;text-align:center;">
              <p style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:12px;color:#666;">
                Sent from <a href="${baseUrl}" style="color:#3D5C3D;text-decoration:underline;">${escapeHtml(appName)}</a>
              </p>
              <p style="margin:0;font-family:Georgia,serif;font-size:11px;color:#999;">
                © ${year} ${escapeHtml(appName)} | <a href="mailto:support@biblelessonspark.com" style="color:#999;text-decoration:underline;">support@biblelessonspark.com</a>
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
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ----------------------------------------------------------------
    // 1. AUTHENTICATE
    // ----------------------------------------------------------------
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return jsonResponse({ error: "Invalid token" }, 401);
    }

    // ----------------------------------------------------------------
    // 2. CHECK PAID TIER
    // ----------------------------------------------------------------
    const { data: subscription } = await supabase
      .from("user_subscriptions")
      .select("tier")
      .eq("user_id", user.id)
      .single();

    const tier = subscription?.tier || "free";
    if (tier === "free") {
      return jsonResponse(
        { error: "Email delivery requires a paid subscription" },
        403
      );
    }

    // ----------------------------------------------------------------
    // 3. PARSE REQUEST BODY
    // ----------------------------------------------------------------
    const {
      recipients,
      lessonTitle,
      lessonContent,
      teaserContent,
      senderName,
      personalMessage,
      metadata,
    } = await req.json();

    // ----------------------------------------------------------------
    // 4. VALIDATE INPUTS
    // ----------------------------------------------------------------
    if (
      !recipients ||
      !Array.isArray(recipients) ||
      recipients.length === 0
    ) {
      return jsonResponse({ error: "No recipients provided" }, 400);
    }

    if (recipients.length > EMAIL_DELIVERY_CONFIG.maxRecipients) {
      return jsonResponse(
        {
          error: `Maximum ${EMAIL_DELIVERY_CONFIG.maxRecipients} recipients allowed`,
        },
        400
      );
    }

    if (!lessonTitle || !lessonContent) {
      return jsonResponse({ error: "Lesson title and content required" }, 400);
    }

    const validRecipients = recipients.filter((e: string) => isValidEmail(e));
    if (validRecipients.length === 0) {
      return jsonResponse({ error: "No valid email addresses" }, 400);
    }

    // Trim personal message to limit
    const trimmedMessage = personalMessage
      ? String(personalMessage).substring(
          0,
          EMAIL_DELIVERY_CONFIG.maxPersonalMessageLength
        )
      : null;

    // ----------------------------------------------------------------
    // 5. GET BRANDING
    // ----------------------------------------------------------------
    const branding = await getBranding(supabase);
    const fromEmail = getEmailFrom(branding);
    const replyTo = getReplyTo(branding);
    const baseUrl = getBaseUrl(branding);
    const appName = getAppName(branding);

    // ----------------------------------------------------------------
    // 6. BUILD EMAIL
    // ----------------------------------------------------------------
    const subject = buildEmailSubject(
      senderName || "A teacher",
      lessonTitle
    );

    const html = buildLessonEmailHtml({
      lessonTitle,
      lessonContent,
      teaserContent,
      senderName: senderName || "A teacher",
      personalMessage: trimmedMessage,
      metadata,
      appName,
      baseUrl,
    });

    // ----------------------------------------------------------------
    // 7. SEND TO EACH RECIPIENT (individual emails for privacy)
    // ----------------------------------------------------------------
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.error("RESEND_API_KEY not configured");
      return jsonResponse({ error: "Email service not configured" }, 500);
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const recipient of validRecipients) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [recipient],
            reply_to: replyTo,
            subject,
            html,
            tags: [
              { name: "email_type", value: "lesson_delivery" },
              { name: "user_id", value: user.id.replace(/[^a-zA-Z0-9_-]/g, "_") },
              { name: "version", value: EMAIL_DELIVERY_VERSION.replace(/[^a-zA-Z0-9_-]/g, "-") },
            ],
          }),
        });

        if (response.ok) {
          sent++;
        } else {
          const errText = await response.text();
          console.error(`Failed to send to ${recipient}:`, errText);
          errors.push(recipient);
          failed++;
        }
      } catch (err) {
        console.error(`Error sending to ${recipient}:`, err);
        errors.push(recipient);
        failed++;
      }
    }

    // ----------------------------------------------------------------
    // 8. LOG DELIVERY
    // ----------------------------------------------------------------
    console.log(
      `[send-lesson-email] User ${user.id} sent "${lessonTitle}" to ${sent}/${validRecipients.length} recipients (teaser+section8 only)`
    );

    // ----------------------------------------------------------------
    // 9. RETURN RESULT
    // ----------------------------------------------------------------
    return jsonResponse({
      success: true,
      sent,
      failed,
      total: validRecipients.length,
      ...(errors.length > 0 ? { failedRecipients: errors } : {}),
    });
  } catch (err) {
    console.error("Unexpected error in send-lesson-email:", err);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
