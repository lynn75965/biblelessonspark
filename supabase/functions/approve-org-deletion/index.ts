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

    // Verify caller is platform admin
    const { data: profile } = await authClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { org_id } = await req.json();
    if (!org_id) {
      return new Response(JSON.stringify({ error: 'Missing org_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // Get org details
    const { data: org } = await adminClient
      .from('organizations')
      .select('id, name, deletion_requested_at, deletion_requested_by')
      .eq('id', org_id)
      .single();

    if (!org) {
      return new Response(JSON.stringify({ error: 'Organization not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!org.deletion_requested_at) {
      return new Response(JSON.stringify({ error: 'No deletion request found for this organization' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get all org members to notify before deletion
    const { data: members } = await adminClient
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', org_id);

    const memberIds = (members as { user_id: string }[] || []).map((m) => m.user_id);
    let memberProfiles: { email: string; full_name: string | null }[] = [];

    if (memberIds.length > 0) {
      const { data: profilesRaw } = await adminClient
        .from('profiles')
        .select('email, full_name')
        .in('id', memberIds);
      const profiles = profilesRaw as { email: string | null; full_name: string | null }[] | null;
      memberProfiles = (profiles || []).filter((p): p is { email: string; full_name: string | null } => !!p.email);
    }

    // Send dissolution notice to all members BEFORE deletion
    const resend = new Resend(resendKey);
    const closureDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    for (const member of memberProfiles) {
      try {
        await resend.emails.send({
          from: 'BibleLessonSpark <support@biblelessonspark.com>',
          to: member.email,
          subject: `${org.name} Has Been Closed`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
              <h2 style="color:#1a1a1a;">Teaching Organization Closed</h2>
              <p>Hi ${member.full_name || 'Teacher'},</p>
              <p>We want to let you know that <strong>${org.name}</strong> has been closed as of ${closureDate}.</p>
              <p><strong>What this means for you:</strong></p>
              <ul>
                <li>Your personal BibleLessonSpark account remains fully active.</li>
                <li>All your personal lessons are still in your Lesson Library.</li>
                <li>Your subscription is unchanged.</li>
                <li>You are no longer part of a teaching organization.</li>
              </ul>
              <p>If you believe this was done in error, please contact us at
              <a href="mailto:support@biblelessonspark.com">support@biblelessonspark.com</a>.</p>
              <p style="margin-top:32px;color:#666;font-size:13px;">-- The BibleLessonSpark Team</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.error(`WARN: Failed to notify member ${member.email}:`, emailErr);
      }
    }

    // Delete org data in dependency order
    const orgTables = [
      'invites',
      'org_shared_focus',
      'organization_focus',
      'teaching_team_members',
      'teaching_teams',
      'organization_members',
    ];

    for (const table of orgTables) {
      const col = (table === 'teaching_teams' || table === 'org_shared_focus' || table === 'organization_focus') ? 'organization_id' : 'organization_id';
      const { error: delErr } = await adminClient.from(table).delete().eq('organization_id', org_id);
      if (delErr) {
        console.error(`WARN: cleanup failed for ${table}:`, delErr.message);
      }
    }

    // Delete the organization record itself
    const { error: orgDelErr } = await adminClient
      .from('organizations')
      .delete()
      .eq('id', org_id);

    if (orgDelErr) {
      console.error('Org delete error:', orgDelErr);
      return new Response(JSON.stringify({ error: 'Failed to delete organization record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`Org ${org_id} (${org.name}) deleted by admin ${user.id}. Notified ${memberProfiles.length} member(s).`);

    return new Response(
      JSON.stringify({ success: true, message: `Organization "${org.name}" has been deleted. ${memberProfiles.length} member(s) notified.` }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: (error as { message?: string })?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});