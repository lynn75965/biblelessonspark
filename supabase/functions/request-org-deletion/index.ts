import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey  = Deno.env.get("RESEND_API_KEY")!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false }
    });

    const { data: { user }, error: authError } = await authClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // Verify caller is an org manager
    const { data: orgMember } = await adminClient
      .from('organization_members')
      .select('organization_id, role')
      .eq('user_id', user.id)
      .eq('role', 'org_manager')
      .single();

    if (!orgMember) {
      return new Response(JSON.stringify({ error: 'Forbidden - org_manager role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const orgId = orgMember.organization_id;

    // Check not already pending
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, name, deletion_requested_at')
      .eq('id', orgId)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (org.deletion_requested_at) {
      return new Response(JSON.stringify({ error: 'Deletion already requested for this organization' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get requesting user profile
    const { data: requesterProfile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', user.id)
      .single();

    const requesterName  = requesterProfile?.full_name || 'Unknown';
    const requesterEmail = requesterProfile?.email || '';

    // Set deletion_requested_at and deletion_requested_by
    const { error: updateError } = await adminClient
      .from('organizations')
      .update({
        deletion_requested_at: new Date().toISOString(),
        deletion_requested_by: user.id,
      })
      .eq('id', orgId);

    if (updateError) {
      console.error('Update error:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to record deletion request' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Notify admins
    const resend = new Resend(resendKey);
    const adminEmails = ['eckbrosmediallc@gmail.com', 'support@biblelessonspark.com'];

    for (const adminEmail of adminEmails) {
      try {
        await resend.emails.send({
          from: 'BibleLessonSpark <support@biblelessonspark.com>',
          to: adminEmail,
          subject: `Org Deletion Request: ${org.name}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
              <h2 style="color:#1a1a1a;">Organization Deletion Request</h2>
              <p>An org manager has requested closure of their organization.</p>
              <table style="border-collapse:collapse;width:100%;margin:16px 0;">
                <tr><td style="padding:8px;font-weight:bold;">Organization:</td><td style="padding:8px;">${org.name}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Organization ID:</td><td style="padding:8px;">${orgId}</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Requested by:</td><td style="padding:8px;">${requesterName} (${requesterEmail})</td></tr>
                <tr><td style="padding:8px;font-weight:bold;">Requested at:</td><td style="padding:8px;">${new Date().toUTCString()}</td></tr>
              </table>
              <p>Log in to the BibleLessonSpark Admin Panel to review and approve or dismiss this request.</p>
              <p style="margin-top:32px;color:#666;font-size:13px;">-- BibleLessonSpark Platform</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error(`WARN: Failed to notify admin ${adminEmail}:`, emailErr);
      }
    }

    console.log(`Org deletion requested: ${orgId} by user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: 'Deletion request submitted. An administrator will review your request.' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: (error as { message?: string })?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});