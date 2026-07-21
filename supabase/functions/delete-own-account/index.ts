import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

// Self-service account deletion. The caller can ONLY ever delete their own
// account -- user_id is derived exclusively from the caller's verified JWT
// (auth.uid()), never read from the request body. No admin role required,
// no self-delete block (that block exists only in admin-delete-user, which
// is a different tool for an admin deleting SOMEONE ELSE's account).
//
// PHASE 2 REDESIGN (2026-07-21) -- auth-first ordering. The original version
// ran a 27-table data teardown BEFORE the auth user delete; when the final
// auth delete failed, the account was left as a zombie (all personal data
// gone, auth login still live) because the teardown steps were separate,
// non-transactional statements. Root cause of the auth-delete failure was
// found live: several columns had ON DELETE SET NULL FKs to auth.users but
// were themselves NOT NULL, so the FK action and the column constraint
// contradicted each other (SQLSTATE 23502), surfaced by GoTrue as an opaque
// "Database error deleting user". Fixed at the schema level in migration
// 20260721140000_fix_auth_delete_fk_contradictions.sql for admin_audit
// (actor_user_id, target_user_id), org_shared_focus.created_by,
// transfer_requests.requested_by, and guardrail_suppressions
// (created_by + revoked_by, whose FKs were also upgraded from implicit
// NO ACTION to ON DELETE SET NULL). This function needs NO sentinel logic
// and NO app-side nulling for any of those five columns anymore -- the
// database's own FK actions handle them automatically the instant the auth
// user is deleted.
//
// organizations.created_by is DELIBERATELY EXCLUDED from that migration --
// it represents live org ownership (not a historical audit record) and
// stays NOT NULL. It is handled below via an application-level
// reassign-or-block decision (Option B) BEFORE the auth delete is attempted,
// since its FK is still ON DELETE SET NULL against a NOT NULL column and
// would otherwise reproduce the exact same 23502 failure.
//
// Cascade audit (verified against live pg_constraint, not assumed): of the
// tables the old version explicitly deleted, all but two are CASCADE and
// therefore already fully redundant once the auth user is actually deleted.
// Only modern_parables (no FK to auth.users at all) and guardrail_violations
// (FK is SET NULL on a nullable column -- cascade would only blank user_id,
// not remove the row) still need an explicit post-delete cleanup step.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_AUTH_DELETE_RETRIES = 3;
const AUTH_DELETE_BACKOFF_MS = [500, 1500, 3000];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Mirrors _shared/anthropicRetry.ts's classify-then-bounded-retry shape,
// scoped to GoTrue's error surface instead of Anthropic's. AuthRetryableFetchError
// (or any raw network/fetch exception surfaced with that name) is a genuine
// transient connectivity blip -- worth retrying. "unexpected_failure" /
// "Database error deleting user" is GoTrue's generic wrapper around a real
// SQL-level failure underneath -- retrying it is pointless (proven live: it
// reproduced identically across repeated attempts against the same data)
// and means a landmine this pre-flight step didn't account for.
function classifyDeleteError(error: { name?: string; code?: string; message?: string } | null | undefined):
  { retryable: boolean; label: string } {
  if (!error) return { retryable: false, label: 'none' };
  if (error.name === 'AuthRetryableFetchError') {
    return { retryable: true, label: 'network' };
  }
  if (error.code === 'unexpected_failure' || /Database error deleting user/i.test(error.message ?? '')) {
    return { retryable: false, label: 'unexpected_failure' };
  }
  return { retryable: false, label: 'other_fatal' };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey    = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendKey  = Deno.env.get("RESEND_API_KEY")!;

    // -- STEP 1: Auth -- resolve caller from their own forwarded JWT. The
    // request body is never parsed for identity (this function never calls
    // req.json() at all) -- the only id this function ever acts on is the
    // caller's own auth.uid(). --
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

    const user_id = user.id;

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false }
    });

    // -- STEP 2: Gather teaching-team dissolution data BEFORE anything is
    // deleted. teaching_teams/teaching_team_members are CASCADE, so this
    // data is gone the instant the auth user is deleted in STEP 5. --
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

    // -- STEP 3: organizations.created_by -- Option B. Dry-run first (reads
    // only, no writes): for every org the caller created, look for another
    // eligible leader -- profiles.organization_role IN ('leader','co-leader')
    // for that same org, excluding the caller. This is the same signal
    // is_org_leader()/is_org_member() use, not organization_members.role
    // (a separate, non-authoritative owner/admin/member vocabulary). If ANY
    // org has no other eligible leader, BLOCK the entire request before
    // writing anything -- account stays fully intact. --
    const { data: ownedOrgs } = await adminClient
      .from('organizations')
      .select('id, name')
      .eq('created_by', user_id);

    const reassignments: { orgId: string; orgName: string; newLeaderId: string }[] = [];
    const blockedOrgNames: string[] = [];

    for (const org of (ownedOrgs as { id: string; name: string }[] || [])) {
      const { data: otherLeader } = await adminClient
        .from('profiles')
        .select('id')
        .eq('organization_id', org.id)
        .in('organization_role', ['leader', 'co-leader'])
        .neq('id', user_id)
        .limit(1)
        .maybeSingle();

      if (otherLeader) {
        reassignments.push({ orgId: org.id, orgName: org.name, newLeaderId: (otherLeader as { id: string }).id });
      } else {
        blockedOrgNames.push(org.name);
      }
    }

    if (blockedOrgNames.length > 0) {
      // Nothing written -- account is fully intact, clean non-destructive error.
      return new Response(JSON.stringify({
        error: `You lead ${blockedOrgNames.length === 1 ? 'an organization' : 'organizations'} ` +
               `(${blockedOrgNames.join(', ')}) with no other leader. Transfer ownership or ` +
               `request organization deletion before deleting your account.`,
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Perform the reassignments now. These are PROVISIONAL: if a later
    // reassignment in this same loop fails, everything completed so far in
    // this loop is rolled back before returning (all-or-nothing, not just
    // at the top level). If the auth delete in STEP 5 ultimately fails,
    // ALL of these are rolled back there too -- a failed delete must never
    // leave org ownership silently changed on a surviving account.
    const completedReassignments: typeof reassignments = [];
    for (const r of reassignments) {
      const { error: reassignErr } = await adminClient
        .from('organizations')
        .update({ created_by: r.newLeaderId })
        .eq('id', r.orgId);

      if (reassignErr) {
        console.error(`Failed to reassign org ${r.orgId} ownership:`, reassignErr.message);
        for (const done of completedReassignments) {
          const { error: rbErr } = await adminClient
            .from('organizations').update({ created_by: user_id }).eq('id', done.orgId);
          if (rbErr) {
            console.error(`CRITICAL: failed to roll back org ${done.orgId} reassignment after a mid-loop failure. Manual fix required.`, rbErr.message);
          }
        }
        return new Response(JSON.stringify({
          error: 'Failed to transfer organization ownership. Please try again.',
        }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      completedReassignments.push(r);
    }

    // -- STEP 4: Send dissolution emails BEFORE deletion (non-fatal). --
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

    // -- STEP 5: Delete the auth user, with classified bounded retry. --
    let deleted = false;
    let lastError: { name?: string; code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt <= MAX_AUTH_DELETE_RETRIES; attempt++) {
      const { error: deleteError } = await adminClient.auth.admin.deleteUser(user_id);
      if (!deleteError) { deleted = true; break; }

      lastError = deleteError;
      const { retryable, label } = classifyDeleteError(deleteError);
      console.error(`delete-own-account: auth delete attempt ${attempt} failed, class=${label}:`, deleteError.message);

      if (!retryable || attempt === MAX_AUTH_DELETE_RETRIES) break;
      await sleep(AUTH_DELETE_BACKOFF_MS[Math.min(attempt, AUTH_DELETE_BACKOFF_MS.length - 1)]);
    }

    if (!deleted) {
      // Roll back the provisional org-ownership reassignments -- the
      // account was NOT deleted, so it must not silently lose org
      // ownership either. Restores the exact pre-attempt state.
      for (const r of reassignments) {
        const { error: rollbackErr } = await adminClient
          .from('organizations').update({ created_by: user_id }).eq('id', r.orgId);
        if (rollbackErr) {
          console.error(
            `CRITICAL: failed to roll back org ${r.orgId} ownership reassignment after a failed ` +
            `auth delete for user ${user_id}. Org ${r.orgId} now has created_by=${r.newLeaderId} ` +
            `but user ${user_id} was NOT deleted. Manual fix required.`,
            rollbackErr.message
          );
        }
      }

      return new Response(JSON.stringify({
        error: `Failed to delete account: ${lastError?.message ?? 'unknown error'}`,
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // -- STEP 6: Defensive read-back. Never trust "no error" alone --
    // handles both possible GoTrue response shapes for a missing user
    // (an error, or a null-user data payload with no error). --
    const { data: stillThereData, error: getUserErr } = await adminClient.auth.admin.getUserById(user_id);
    const stillExists = !getUserErr && !!stillThereData?.user;
    if (stillExists) {
      console.error(`delete-own-account: auth delete reported success but user ${user_id} still resolves via getUserById`);
      return new Response(JSON.stringify({
        error: 'Account deletion could not be confirmed. Please contact support.',
      }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // -- STEP 7: Residual cleanup -- only the 2 tables CASCADE doesn't
    // cover. modern_parables has no FK to auth.users at all; guardrail_violations'
    // FK is SET NULL on a nullable column, so cascade would only blank
    // user_id, not remove the row. Both keyed by user_id. --
    await adminClient.from('modern_parables').delete().eq('user_id', user_id);
    await adminClient.from('guardrail_violations').delete().eq('user_id', user_id);

    console.log(
      `User ${user_id} self-deleted their account. Notified ${membersToNotify.length} team member(s). ` +
      `Reassigned ${reassignments.length} org(s).`
    );

    return new Response(
      JSON.stringify({ success: true, message: 'Account deleted successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: (error as { message?: string })?.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
