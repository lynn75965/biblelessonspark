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

    // -- Auth: verify requesting user --
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

    const { data: profile, error: profileError } = await authClient
      .from('profiles').select('role').eq('id', user.id).single();
    if (profileError || !profile || profile.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden - admin role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { user_id } = await req.json();
    if (!user_id) {
      return new Response(JSON.stringify({ error: 'Missing user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (user_id === user.id) {
      return new Response(JSON.stringify({ error: 'Cannot delete your own admin account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // -- STEP 1: Gather teaching team members to notify BEFORE deletion --
    // Find teams where this user is the lead teacher
    const { data: teams } = await adminClient
      .from('teaching_teams')
      .select('id, name')
      .eq('lead_teacher_id', user_id);

    const teamIds = (teams as { id: string; name: string }[] || []).map((t) => t.id);
    let membersToNotify: { email: string; full_name: string; team_name: string }[] = [];

    if (teamIds.length > 0) {
      const { data: membersRaw } = await adminClient
        .from('teaching_team_members')
        .select('user_id, teaching_teams(name)')
        .in('team_id', teamIds)
        .neq('user_id', user_id);

      const members = membersRaw as { user_id: string; teaching_teams: { name: string } | null }[] | null;

      if (members && members.length > 0) {
        const memberIds = members.map((m) => m.user_id);
        const { data: memberProfilesRaw } = await adminClient
          .from('profiles')
          .select('id, full_name, email')
          .in('id', memberIds);

        const memberProfiles = memberProfilesRaw as { id: string; full_name: string | null; email: string | null }[] | null;

        membersToNotify = (members || []).map((m) => {
          const p = (memberProfiles || []).find((p) => p.id === m.user_id);
          return {
            email: p?.email || '',
            full_name: p?.full_name || 'Teacher',
            team_name: m.teaching_teams?.name || 'your teaching team',
          };
        }).filter((m) => !!m.email);
      }
    }

    // -- STEP 2: Send dissolution emails BEFORE deletion --
    if (membersToNotify.length > 0) {
      const resend = new Resend(resendKey);
      for (const member of membersToNotify) {
        try {
          await resend.emails.send({
            from: 'BibleLessonSpark <support@biblelessonspark.com>',
            to: member.email,
            subject: 'Your Teaching Team Has Been Dissolved',
            html: `
              <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;">
                <h2 style="color:#1a1a1a;">Teaching Team Update</h2>
                <p>Hi ${member.full_name},</p>
                <p>We want to let you know that <strong>${member.team_name}</strong> has been dissolved
                because the lead teacher's account has been removed from BibleLessonSpark.</p>
                <p>Your personal account remains fully active. All your personal lessons are still
                in your Lesson Library, and your subscription is unchanged.</p>
                <p>You are no longer part of a teaching team, but you can continue preparing
                lessons and join or start a new team at any time.</p>
                <p>If you believe this was done in error, please contact us at
                <a href="mailto:support@biblelessonspark.com">support@biblelessonspark.com</a>.</p>
                <p style="margin-top:32px;color:#666;font-size:13px;">
                  -- The BibleLessonSpark Team
                </p>
              </div>
            `,
          });
          console.log(`Dissolution email sent to ${member.email} for team ${member.team_name}`);
        } catch (emailErr) {
          console.error(`WARN: Failed to send dissolution email to ${member.email}:`, emailErr);
          // Non-fatal -- continue with deletion
        }
      }
    }

    // -- STEP 3: Explicit cleanup of all 30 user-linked tables in dependency order --
    const tables = [
      'generation_metrics',
      'reshape_metrics',
      'guardrail_violations',
      'events',
      'outputs',
      'beta_feedback',
      'feedback',
      'email_sequence_tracking',
      'email_rosters',
      'notifications',
      'parable_usage',
      'modern_parables',
      'devotional_usage',
      'devotionals',
      'devotional_series',
      'refinements',
      'lessons',
      'lesson_series',
      'teaching_team_members',
      'teaching_teams',
      'transfer_requests',
      'credits_ledger',
      'setup_progress',
      'org_shared_focus',
      'organization_focus',
      'organization_members',
      'beta_testers',
      'invites',
      'user_roles',
      'teacher_preference_profiles',
      'user_subscriptions',
      'profiles',
    ];

    for (const table of tables) {
      const col = table === 'teaching_teams' ? 'lead_teacher_id' : 'user_id';
      const { error: delErr } = await adminClient.from(table).delete().eq(col, user_id);
      if (delErr) {
        console.error(`WARN: cleanup failed for ${table}:`, delErr.message);
        // Log but continue -- best-effort cleanup
      }
    }

    // -- STEP 4: Delete auth user --
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
    if (deleteError) {
      console.error('Delete error:', deleteError);
      return new Response(JSON.stringify({ error: `Failed to delete user: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log(`User ${user_id} deleted by admin ${user.id}. Notified ${membersToNotify.length} team member(s).`);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: (error as { message?: string })?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});