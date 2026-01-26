import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BibleLessonSpark Brand Colors
const BRAND = {
  primaryGreen: "#3D5C3D",
  primaryGreenLight: "#4A6F4A",
  gold: "#D4A74B",
  cream: "#FFFEF9",
  darkText: "#1a1a1a",
  mutedText: "#666666",
  borderColor: "#e5e5e5",
};

// Convert plain text to HTML with proper formatting
function textToHtml(text: string): string {
  // Escape HTML entities
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Convert URLs to styled buttons or links
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  html = html.replace(urlRegex, (url) => {
    // Clean up URL (remove trailing punctuation)
    const cleanUrl = url.replace(/[.,;:!?)]+$/, "");
    const trailingChars = url.slice(cleanUrl.length);
    
    // Determine if this should be a button (main CTAs) or inline link
    const isMainCta = cleanUrl.includes("/pricing") || 
                      cleanUrl.includes("/lesson-generator") ||
                      cleanUrl.includes("/preferences") ||
                      (cleanUrl === "https://biblelessonspark.com/" || cleanUrl === "https://biblelessonspark.com");
    
    if (isMainCta) {
      // Styled button for main CTAs
      return `</p>
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 24px auto;">
          <tr>
            <td style="border-radius: 8px; background: ${BRAND.primaryGreen};">
              <a href="${cleanUrl}" target="_blank" style="background: ${BRAND.primaryGreen}; border: 1px solid ${BRAND.primaryGreen}; font-family: 'Georgia', serif; font-size: 16px; line-height: 1.5; text-decoration: none; padding: 14px 28px; color: #ffffff; border-radius: 8px; display: inline-block; font-weight: bold;">
                ${getButtonText(cleanUrl)}
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 0 0 16px 0; line-height: 1.7; color: ${BRAND.darkText};">${trailingChars}`;
    } else {
      // Inline link for secondary links
      return `<a href="${cleanUrl}" style="color: ${BRAND.primaryGreen}; text-decoration: underline;">${cleanUrl}</a>${trailingChars}`;
    }
  });

  // Convert bullet points (• or -)
  html = html.replace(/^[•\-]\s+(.+)$/gm, `<li style="margin-bottom: 8px; color: ${BRAND.darkText};">$1</li>`);
  
  // Wrap consecutive <li> items in <ul>
  html = html.replace(/(<li[^>]*>.*?<\/li>\n?)+/gs, (match) => {
    return `<ul style="margin: 16px 0; padding-left: 24px; color: ${BRAND.darkText};">${match}</ul>`;
  });

  // Convert numbered lists (1. 2. 3.)
  html = html.replace(/^\d+\.\s+(.+)$/gm, `<li style="margin-bottom: 8px; color: ${BRAND.darkText};">$1</li>`);

  // Convert double line breaks to paragraph breaks
  html = html.replace(/\n\n+/g, `</p><p style="margin: 0 0 16px 0; line-height: 1.7; color: ${BRAND.darkText};">`);
  
  // Convert single line breaks to <br>
  html = html.replace(/\n/g, "<br>");

  // Wrap in paragraph tags
  html = `<p style="margin: 0 0 16px 0; line-height: 1.7; color: ${BRAND.darkText};">${html}</p>`;

  // Clean up empty paragraphs
  html = html.replace(/<p[^>]*>\s*<\/p>/g, "");
  html = html.replace(/<p[^>]*><br><\/p>/g, "");

  return html;
}

// Get appropriate button text based on URL
function getButtonText(url: string): string {
  if (url.includes("/pricing")) return "View Pricing Plans →";
  if (url.includes("/lesson-generator")) return "Create Your Lesson →";
  if (url.includes("/preferences")) return "Set Up Your Profile →";
  if (url.includes("/help")) return "Get Help →";
  return "Get Started →";
}

// Generate branded HTML email template
function generateHtmlEmail(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${subject}</title>
  <!--[if mso]>
  <style type="text/css">
    table { border-collapse: collapse; }
    .fallback-font { font-family: Arial, sans-serif; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Georgia, 'Times New Roman', serif;">
  <!-- Email wrapper -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 24px 16px;">
        <!-- Main container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px; background-color: ${BRAND.cream}; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.primaryGreen} 0%, ${BRAND.primaryGreenLight} 100%); padding: 32px 40px; text-align: center;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <!-- Logo placeholder - using text for email compatibility -->
                    <h1 style="margin: 0; font-family: Georgia, serif; font-size: 28px; font-weight: bold; color: #ffffff; letter-spacing: 0.5px;">
                      ✦ BibleLessonSpark
                    </h1>
                    <p style="margin: 8px 0 0 0; font-family: Georgia, serif; font-size: 14px; color: rgba(255,255,255,0.9); font-style: italic;">
                      Personalized Bible Studies in Minutes
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 40px; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; line-height: 1.7; color: ${BRAND.darkText};">
              ${bodyHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f6; padding: 32px 40px; border-top: 1px solid ${BRAND.borderColor};">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 12px 0; font-family: Georgia, serif; font-size: 14px; color: ${BRAND.mutedText};">
                      <strong style="color: ${BRAND.primaryGreen};">BibleLessonSpark</strong> — AI-powered lesson preparation for Baptist teachers
                    </p>
                    <p style="margin: 0 0 12px 0; font-family: Georgia, serif; font-size: 13px; color: ${BRAND.mutedText};">
                      Questions? Reply to this email or visit 
                      <a href="https://biblelessonspark.com/help" style="color: ${BRAND.primaryGreen}; text-decoration: underline;">our help center</a>
                    </p>
                    <p style="margin: 0; font-family: Georgia, serif; font-size: 12px; color: #999999;">
                      © ${new Date().getFullYear()} BibleLessonSpark. All rights reserved.<br>
                      <a href="https://biblelessonspark.com" style="color: #999999; text-decoration: none;">biblelessonspark.com</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
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

    // Get email templates from database
    const { data: templates, error: templatesError } = await supabase
      .from("email_sequence_templates")
      .select("*")
      .eq("tenant_id", "default")
      .eq("is_active", true)
      .order("sequence_order", { ascending: true });

    if (templatesError) {
      console.error("Error fetching templates:", templatesError);
      throw templatesError;
    }

    if (!templates || templates.length === 0) {
      console.error("No email templates found");
      return new Response(
        JSON.stringify({ success: false, error: "No email templates configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`Loaded ${templates.length} email templates`);

    // Get all users who haven't unsubscribed and haven't completed sequence
    const { data: users, error: fetchError } = await supabase
      .from("email_sequence_tracking")
      .select("*")
      .eq("unsubscribed", false)
      .lt("last_email_sent", templates.length);

    if (fetchError) {
      console.error("Error fetching users:", fetchError);
      throw fetchError;
    }

    console.log(`Found ${users?.length || 0} users to process`);

    const results = {
      processed: 0,
      emailsSent: 0,
      errors: [] as string[],
    };

    for (const user of users || []) {
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(user.sequence_started_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Find the next email to send (last_email_sent is 0-indexed count of emails sent)
      const nextEmailIndex = user.last_email_sent;
      const nextTemplate = templates[nextEmailIndex];

      if (!nextTemplate) {
        // User has received all emails
        continue;
      }

      // Check if it's time to send this email
      if (daysSinceStart >= nextTemplate.send_day) {
        // Check if we already sent an email today (prevent duplicates)
        if (user.last_email_sent_at) {
          const lastSentDate = new Date(user.last_email_sent_at).toDateString();
          const todayDate = new Date().toDateString();
          if (lastSentDate === todayDate && nextEmailIndex > 0) {
            // Already sent an email today (except for welcome email which should send immediately)
            continue;
          }
        }

        // Personalize the email body
        const personalizedBody = nextTemplate.body
          .replace(/\{name\}/g, user.full_name || "Friend")
          .replace(/\{email\}/g, user.email);

        // Convert to HTML based on is_html flag
        let bodyHtml: string;
        if (nextTemplate.is_html) {
          // Body is already HTML, use as-is
          bodyHtml = personalizedBody;
        } else {
          // Convert plain text to HTML
          bodyHtml = textToHtml(personalizedBody);
        }
        
        const htmlEmail = generateHtmlEmail(nextTemplate.subject, bodyHtml);

        try {
          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "BibleLessonSpark <noreply@biblelessonspark.com>",
              reply_to: "support@biblelessonspark.com",
              to: [user.email],
              subject: nextTemplate.subject,
              html: htmlEmail,
              text: personalizedBody.replace(/<[^>]*>/g, ''), // Strip HTML for plain text fallback
            }),
          });

          if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            console.error(`Resend error for ${user.email}:`, errorText);
            results.errors.push(`${user.email}: ${errorText}`);
            continue;
          }

          // Update tracking record
          const { error: updateError } = await supabase
            .from("email_sequence_tracking")
            .update({
              last_email_sent: nextEmailIndex + 1,
              last_email_sent_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (updateError) {
            console.error(`Error updating tracking for ${user.email}:`, updateError);
            results.errors.push(`${user.email}: tracking update failed`);
          } else {
            results.emailsSent++;
            console.log(`Sent email ${nextEmailIndex + 1} ("${nextTemplate.subject}") to ${user.email}`);
          }
        } catch (sendError) {
          console.error(`Error sending to ${user.email}:`, sendError);
          results.errors.push(`${user.email}: ${sendError.message}`);
        }
      }

      results.processed++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${results.processed} users, sent ${results.emailsSent} emails`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-sequence-email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
