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
  cream: "#FFFEF9",
  darkText: "#1a1a1a",
  mutedText: "#666666",
  borderColor: "#e5e5e5",
};

// Convert plain text to HTML with proper formatting
function textToHtml(text: string): string {
  // Split into lines for processing
  const lines = text.split('\n');
  const htmlLines: string[] = [];
  let inList = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines but track for paragraph breaks
    if (line === '') {
      if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }
      continue;
    }
    
    // Escape HTML entities
    line = line
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    
    // Check if this is a bullet point
    const bulletMatch = line.match(/^[•\-]\s+(.+)$/);
    if (bulletMatch) {
      if (!inList) {
        htmlLines.push(`<ul style="margin: 12px 0; padding-left: 24px;">`);
        inList = true;
      }
      htmlLines.push(`<li style="margin-bottom: 6px; color: ${BRAND.darkText};">${bulletMatch[1]}</li>`);
      continue;
    }
    
    // Close list if we were in one
    if (inList) {
      htmlLines.push('</ul>');
      inList = false;
    }
    
    // Check if line contains a main CTA URL (should become button)
    const urlMatch = line.match(/^(https?:\/\/[^\s]+)$/);
    if (urlMatch) {
      const url = urlMatch[1].replace(/[.,;:!?)]+$/, "");
      const isMainCta = url.includes("/pricing") || 
                        url.includes("/lesson-generator") ||
                        url.includes("/preferences") ||
                        url === "https://biblelessonspark.com/" || 
                        url === "https://biblelessonspark.com";
      
      if (isMainCta) {
        htmlLines.push(`
<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 16px 0;">
  <tr>
    <td style="border-radius: 6px; background: ${BRAND.primaryGreen};">
      <a href="${url}" target="_blank" style="background: ${BRAND.primaryGreen}; font-family: Georgia, serif; font-size: 15px; text-decoration: none; padding: 12px 24px; color: #ffffff; border-radius: 6px; display: inline-block; font-weight: bold;">
        ${getButtonText(url)}
      </a>
    </td>
  </tr>
</table>`);
        continue;
      }
    }
    
    // Convert inline URLs to links
    line = line.replace(/(https?:\/\/[^\s]+)/g, (url) => {
      const cleanUrl = url.replace(/[.,;:!?)]+$/, "");
      const trailing = url.slice(cleanUrl.length);
      return `<a href="${cleanUrl}" style="color: ${BRAND.primaryGreen}; text-decoration: underline;">${cleanUrl}</a>${trailing}`;
    });
    
    // Regular paragraph
    htmlLines.push(`<p style="margin: 0 0 12px 0; line-height: 1.6; color: ${BRAND.darkText};">${line}</p>`);
  }
  
  // Close any open list
  if (inList) {
    htmlLines.push('</ul>');
  }
  
  return htmlLines.join('\n');
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
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Georgia, 'Times New Roman', serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td style="padding: 20px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin: 0 auto; max-width: 600px; background-color: ${BRAND.cream}; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${BRAND.primaryGreen} 0%, ${BRAND.primaryGreenLight} 100%); padding: 24px 32px; text-align: center;">
              <h1 style="margin: 0; font-family: Georgia, serif; font-size: 24px; font-weight: bold; color: #ffffff;">
                ✦ BibleLessonSpark
              </h1>
              <p style="margin: 6px 0 0 0; font-family: Georgia, serif; font-size: 13px; color: rgba(255,255,255,0.9); font-style: italic;">
                Personalized Bible Studies in Minutes
              </p>
            </td>
          </tr>
          
          <!-- Body Content -->
          <tr>
            <td style="padding: 28px 32px; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.6; color: ${BRAND.darkText};">
              ${bodyHtml}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f8f6; padding: 20px 32px; border-top: 1px solid ${BRAND.borderColor};">
              <p style="margin: 0 0 8px 0; font-family: Georgia, serif; font-size: 13px; color: ${BRAND.mutedText}; text-align: center;">
                <strong style="color: ${BRAND.primaryGreen};">BibleLessonSpark</strong> — AI-powered lesson preparation for Baptist teachers
              </p>
              <p style="margin: 0; font-family: Georgia, serif; font-size: 11px; color: #999999; text-align: center;">
                © ${new Date().getFullYear()} BibleLessonSpark • <a href="https://biblelessonspark.com" style="color: #999999;">biblelessonspark.com</a>
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: templates, error: templatesError } = await supabase
      .from("email_sequence_templates")
      .select("*")
      .eq("tenant_id", "default")
      .eq("is_active", true)
      .order("sequence_order", { ascending: true });

    if (templatesError) throw templatesError;

    if (!templates || templates.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "No email templates configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    console.log(`Loaded ${templates.length} email templates`);

    const { data: users, error: fetchError } = await supabase
      .from("email_sequence_tracking")
      .select("*")
      .eq("unsubscribed", false)
      .lt("last_email_sent", templates.length);

    if (fetchError) throw fetchError;

    console.log(`Found ${users?.length || 0} users to process`);

    const results = { processed: 0, emailsSent: 0, errors: [] as string[] };

    for (const user of users || []) {
      const daysSinceStart = Math.floor(
        (Date.now() - new Date(user.sequence_started_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      const nextEmailIndex = user.last_email_sent;
      const nextTemplate = templates[nextEmailIndex];

      if (!nextTemplate) continue;

      if (daysSinceStart >= nextTemplate.send_day) {
        if (user.last_email_sent_at) {
          const lastSentDate = new Date(user.last_email_sent_at).toDateString();
          const todayDate = new Date().toDateString();
          if (lastSentDate === todayDate && nextEmailIndex > 0) continue;
        }

        const personalizedBody = nextTemplate.body
          .replace(/\{name\}/g, user.full_name || "Friend")
          .replace(/\{email\}/g, user.email);

        let bodyHtml: string;
        if (nextTemplate.is_html) {
          bodyHtml = personalizedBody;
        } else {
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
              text: personalizedBody.replace(/<[^>]*>/g, ''),
            }),
          });

          if (!resendResponse.ok) {
            const errorText = await resendResponse.text();
            results.errors.push(`${user.email}: ${errorText}`);
            continue;
          }

          const { error: updateError } = await supabase
            .from("email_sequence_tracking")
            .update({
              last_email_sent: nextEmailIndex + 1,
              last_email_sent_at: new Date().toISOString(),
            })
            .eq("id", user.id);

          if (updateError) {
            results.errors.push(`${user.email}: tracking update failed`);
          } else {
            results.emailsSent++;
            console.log(`Sent email ${nextEmailIndex + 1} to ${user.email}`);
          }
        } catch (sendError) {
          results.errors.push(`${user.email}: ${sendError.message}`);
        }
      }

      results.processed++;
    }

    return new Response(
      JSON.stringify({ success: true, message: `Processed ${results.processed} users, sent ${results.emailsSent} emails`, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
