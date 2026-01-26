import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
              text: personalizedBody,
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
