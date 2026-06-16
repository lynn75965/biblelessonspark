# PROJECT MASTER -- Last updated: June 16, 2026

## JUNE 16, 2026 SESSION (Teaching Team full-feature lock-down -- SESSION 3 of 3: LIFECYCLE + SECURITY)

Implemented and SHIPPED the lifecycle-mutation + security-hardening path (the final session of
the arc). Lynn verified the full matrix on localhost:8080 before deploy; matrix passed; deployed.

PRE-WORK -- live reads (Supabase SQL Editor, 2026-06-16; authoritative):
  * FK teaching_team_members_team_id_fkey -> teaching_teams(id): confdeltype 'c' = CASCADE.
  * FK teaching_team_members_user_id_fkey -> auth.users(id):      confdeltype 'c' = CASCADE.
      => Disband already cascade-deletes member rows. Path 4c: NO DDL (logged confirmation only).
  * UNIQUE unique_member_per_team (team_id, user_id) EXISTS on teaching_team_members.
  * respond_to_team_invitation decline branch SETs status='declined' (does NOT delete the row).
      => Combined with the unique constraint, a fresh INSERT on re-invite collides (23505).
         Path 6b fixed in the frontend (UPDATE-reuse), not via DDL.
  * Plus exact pg_policies defs (USING/WITH CHECK/roles) for both tables + the
    teaching_team_members column list (status text; invited_at NOT NULL default now();
    responded_at nullable; expires_at nullable) -- read so the policy rewrite + reuse UPDATE
    were exact, not blind.

MIGRATION (applied via npx supabase db push --linked; two-step check first -- function absent +
policies still {public} before push; migration list confirms 20260616170000 on local AND remote):
  * supabase/migrations/20260616170000_team_lifecycle_and_security.sql (NEW):
      - 4a leave_teaching_team() -- SECURITY DEFINER, VOLATILE, SET search_path = public, auth,
        schema-qualified. DELETEs the caller's OWN accepted row (user_id = auth.uid() AND
        status='accepted') RETURNING team_id (NULL when nothing matched). REVOKE PUBLIC/anon +
        GRANT authenticated. Fixes FACT B (member Leave was a raw client DELETE matching no
        member policy -> silent 0-row no-op; row survived and team reappeared on refetch).
      - 4c FK CASCADE: confirmed live, no DDL emitted.
      - 4d {public} -> {authenticated} on all 5 team policies (DROP + CREATE, quals unchanged):
        teaching_team_members: "Lead teacher can manage team members" (ALL, USING
        is_team_lead_of(team_id)); "Users can read own membership" (SELECT, user_id=auth.uid());
        "Users can update own membership" (UPDATE, USING + WITH CHECK user_id=auth.uid()).
        teaching_teams: "Lead teacher can manage own team" (ALL, USING lead_teacher_id=auth.uid());
        "Members can read their team" (SELECT, USING is_team_member_of(id)). The two ALL policies
        had WITH CHECK null (Postgres defaults the check to USING for FOR ALL) -- recreated
        USING-only to preserve exact behavior. SECURITY DEFINER resolvers + service_role bypass
        RLS, so resolvers are unaffected; anon can no longer reach these tables directly.

FRONTEND (npm run build clean; deployed via deploy.ps1):
  * src/hooks/useTeachingTeam.tsx:
      - leaveTeam now calls rpc('leave_teaching_team'); null return = benign no-op (refetch +
        "Not on a team" toast); success path resetState + "Left team" toast (team name captured
        before resetState). Raw client DELETE removed.
      - inviteMember re-invite fix (path 6b): before writing, look up any existing (team_id,
        user_id) row; if present UPDATE-reuse it (status='pending', invited_at=now(),
        responded_at=null, fresh expires_at); else INSERT as before. Both writes run under the
        lead's is_team_lead_of(team_id) ALL policy.
  * src/integrations/supabase/types.ts -- REGENERATED via npx supabase gen types typescript
    --linked, written BOM-free. leave_teaching_team now typed ({ Args: never; Returns: string }).

EDGE FUNCTION (deployed via supabase functions deploy notify-team-invitation):
  * supabase/functions/_shared/branding.ts -- getBaseUrl() now prefers Deno.env.get('SITE_URL')
    || Deno.env.get('APP_URL') (guarded by typeof Deno + try/catch), strips a trailing slash,
    falls back to the branding literal (https://biblelessonspark.com). No prod behavior change;
    non-prod email links become testable. notify-team-invitation already calls getBaseUrl
    (index.ts:155). Also ASCII-escaped a pre-existing welcome-subject emoji (U+1F389 ->
    🎉) so the ASCII pre-commit guard passes when the file is re-staged; rendered
    output is unchanged.

DEFERRED (Lynn's call, 2026-06-16): dissolution email (notify-team-dissolution) NOT built.
Disband already toasts "All members have been released" and CASCADE cleans member rows; there is
no existing dissolution-email path. Revisit only if released members should be emailed.

MATRIX (verified on localhost:8080 before deploy): member Leave actually leaves (DB row gone,
sidebar relocks on refresh, lead roster count drops); lead Disband cleans all member rows
(CASCADE); re-invite after decline succeeds with no duplicate-row error; Teaching Team pages load
with no new console errors; Session 2 regression (Team Lessons view, share, read-only viewer) all
still work.

TEACHING TEAM LOCK-DOWN ARC COMPLETE: Session 1 (diagnosis), Session 2 (view path), Session 3
(lifecycle + security). All seven diagnosed paths resolved or confirmed-working.

## JUNE 16, 2026 SESSION (Teaching Team full-feature lock-down -- SESSION 2 of 3: THE VIEW PATH)

Implemented and SHIPPED the read-only VIEW path from the Session 1 plan: paths 2, 3, 5.
Lynn verified the full matrix on localhost:8080 before deploy; matrix passed; deployed.

WHAT WAS BROKEN (Session 1 findings, confirmed by the live RLS read):
  * FACT A -- lessons has NO cross-user SELECT policy. fetchTeamLessons' client read of
    teammates' shared lessons zero-filtered to 0 rows for BOTH lead and member -> the
    entire "Team Lessons" view (path 2) and the single team-lesson read (path 3) returned
    nothing.
  * FACT C -- a member's client read of teaching_team_members returns ONLY their own row
    (SELECT is user_id = auth.uid(); no co-member read policy) -> the member-side roster
    undercounted to just themselves (always "2 members"); path 5.

MIGRATION (applied via npx supabase db push --linked; two-step check first -- local-only,
not yet on remote; all prior migrations in sync):
  * supabase/migrations/20260616160000_add_team_lessons_resolvers.sql (NEW) -- three
    SECURITY DEFINER resolvers, STABLE, SET search_path = public, auth, all objects
    schema-qualified, REVOKE PUBLIC/anon + GRANT authenticated (5th/6th Teaching Team
    resolvers, matching the existing four):
      - get_team_lessons() -- returns the caller's team peers' (lead + accepted members)
        visibility='shared', reshape_of IS NULL lessons, EXCLUDING the caller. Lightweight
        list shape (flat passage/age/theology from filters->>; author from profiles.full_name).
        Peers computed server-side; empty peer set -> 0 rows = the authorization boundary.
      - get_team_lesson(p_lesson_id) -- same shape PLUS original_text/filters/metadata
        (the only content fields the viewer renders; the read-only guard suppresses every
        control that would read the others). Returns the row only if its owner is an accepted
        peer of the caller and visibility='shared'.
      - get_teaching_team_members(p_team_id) -- DROP + CREATE to ADD id + team_id to the
        return shape (changing RETURNS TABLE columns requires a drop). Body/auth gate otherwise
        identical to migration 20260615130000 (caller is lead OR holds any membership row).
        With id + team_id present, fetchMembers builds the full roster from this resolver alone.

FRONTEND (npm run build clean; deployed via deploy.ps1):
  * src/hooks/useTeachingTeam.tsx -- fetchTeamLessons now calls rpc('get_team_lessons') and
    reshapes the flat rows into lesson-shaped objects (synthesized filters; original_text null,
    loaded on view); fetchMembers now sources the FULL roster from get_teaching_team_members
    (id/team_id/name/email/status), dropping the RLS-filtered raw client read entirely. Added
    TeachingTeamMemberStatus import.
  * src/pages/Dashboard.tsx -- handleViewLesson is async; for isTeamLesson it fetches full
    content via rpc('get_team_lesson') before opening the viewer (owner lessons unchanged).
  * src/components/dashboard/EnhanceLessonForm.tsx -- added isTeamLessonView (= viewingLesson
    .isTeamLesson). Appended && !isTeamLessonView to the Add-to-Series, Edit, Reshape, and
    Delete gates and the reshape section. Export (Copy/Download/Email) intentionally remains --
    the lesson is shared TO this teacher.
  * src/components/dashboard/LessonLibrary.tsx -- team-lesson author badge now prefers the
    resolver's author_name (the local nameMap cannot resolve the LEAD's name for a member viewer).
  * src/integrations/supabase/types.ts -- REGENERATED via npx supabase gen types typescript
    --linked, written BOM-free via [System.IO.File]::WriteAllText UTF8Encoding($false). All six
    Teaching Team RPCs are now typed; NO `as any` rpc casts remain in the new code.

CARRY-FORWARD -> SESSION 3 (mutations + edges + security + email; unchanged from Session 1 plan):
  * leave_teaching_team() resolver OR self-DELETE policy on teaching_team_members (path 4d --
    member "Leave team" is a client DELETE that matches no policy -> silent 0-row no-op).
  * Re-grant the 5 teaching_teams/teaching_team_members policies {public} -> {authenticated}.
  * Confirm/repair teaching_team_members.team_id FK ON DELETE CASCADE (path 4c).
  * Re-invite-after-decline/leave/expiry (path 6b): read the unique constraint + the decline
    branch of respond_to_team_invitation, then DELETE-on-decline or UPDATE-reuse.
  * Dissolution email (path 7): does NOT exist today; build notify-team-dissolution only if
    Lynn wants released members emailed.
  Pre-Session-3 live reads still required: teaching_team_members FK delete-rule (confdeltype);
  unique constraint(s) on teaching_team_members; respond_to_team_invitation decline disposition.

## JUNE 16, 2026 SESSION (Teaching Team full-feature lock-down -- SESSION 1 of 3: DIAGNOSIS ONLY)

DIAGNOSIS ONLY. No code, no migrations, no db push this session. Live RLS policies
were read from the Supabase SQL Editor (teaching_teams, teaching_team_members, and
lessons were all dashboard-created -- no repo migration captures their policies).

LIVE RLS POLICIES (read 2026-06-16, authoritative for this diagnosis):
  teaching_teams:
    - "Lead teacher can manage own team"  ALL  {public}  USING (lead_teacher_id = auth.uid())
    - "Members can read their team"       SELECT {public} USING (is_team_member_of(id))
  teaching_team_members:
    - "Lead teacher can manage team members" ALL  {public} USING (is_team_lead_of(team_id))
    - "Users can read own membership"        SELECT {public} USING (user_id = auth.uid())
    - "Users can update own membership"      UPDATE {public} USING (user_id = auth.uid())
  lessons:
    - "Admin full access to lessons"  ALL    USING (is_admin())
    - "Admins can view all lessons"   SELECT USING (EXISTS (user_roles WHERE role = 'admin'))
    - users_select_own  SELECT (user_id = auth.uid())
    - users_insert_own  INSERT (user_id = auth.uid())
    - users_update_own  UPDATE (user_id = auth.uid())
    - users_delete_own  DELETE (user_id = auth.uid())
  (Full policy set now enumerated -- the two admin policies above were confirmed by the
   2026-06-16 SQL Editor re-read; FACT A holds: none of these lets a non-admin SELECT
   another user's lesson row.)

THREE LOAD-BEARING FACTS:
  A. lessons has NO policy allowing any user to SELECT another user's row. Any client
     read of a teammate's lesson (shared or not) zero-filters to 0 rows for BOTH lead
     and member. This blocks the entire "Team Lessons" view AND single team-lesson read.
  B. teaching_team_members has UPDATE-own and SELECT-own for members, but NO DELETE for
     members. "Leave team" is a client DELETE (useTeachingTeam.tsx:638-642) -> it matches
     no policy -> silent 0-row no-op. The UI shows "Left team" and clears local state, but
     the DB row survives; on refetch the member is still on the team.
  C. A member's client read of teaching_team_members returns ONLY their own row (SELECT is
     user_id = auth.uid(); there is no co-member read policy). So for a member, fetchMembers
     yields just themselves -> the roster count is wrong AND fetchTeamLessons cannot even
     build the peer user_id list. The lead is unaffected (the lead ALL policy lets the lead
     read every member row).

### FINDINGS TABLE (paths 1-7)

| # | Path | Lead works? | Member works? | Root cause | file:line | Minimal fix |
|---|------|-------------|---------------|------------|-----------|-------------|
| 1 | Share a lesson (visibility Private/Shared) | YES | YES | Owner writes own row; field is lessons.visibility ('private'/'shared'). users_update_own (user_id=auth.uid()) permits it for every owner. | useLessons.tsx:168-197 (update :170-174) | None. Working. (Copy nit only: toast says "Share with Org Leaders" -- not Teaching-Team worded; cosmetic, defer.) |
| 2 | View team-shared lessons (My/Team toggle -> fetchTeamLessons) | NO | NO | FACT A: client SELECT of other users' lessons zero-filters to 0 rows (no cross-user SELECT policy). For members also FACT C: peer user_id list is empty. (a) lead->members 0 rows; (b) member->lead 0 rows; (c) memberA->memberB 0 rows. Filters to visibility='shared' correctly, but never reaches a row. | useTeachingTeam.tsx:668-697 (query :684-689); peer list :672-682 | SECURITY DEFINER resolver get_team_lessons() that returns visibility='shared' lessons whose owner is in the caller's team (lead + accepted members), excluding the caller -- computes peers server-side, bypasses lessons RLS. Repoint fetchTeamLessons to the RPC. |
| 3 | View a single team lesson (full content) | NO | NO | Same FACT A: a full-row read of a teammate's lesson is owner-only RLS -> 0 rows. Latent today only because path 2 surfaces no cards to click. ALSO must confirm the full viewer (EnhanceLessonForm via onViewLesson) renders read-only for a teammate's lesson -- LessonLibrary correctly hides edit/delete/visibility/devotional/series on isTeamLesson cards (:644-769), but the opened viewer's owner-only controls are not yet verified. | LessonLibrary.tsx:700 (onViewLesson); viewer EnhanceLessonForm (read-only guard UNVERIFIED) | get_team_lesson(p_lesson_id) resolver (single shared+same-team row) OR reuse the row already returned by get_team_lessons(); plus add an isTeamLesson/read-only guard in the viewer so no owner mutation renders. |
| 4a | Lead: Remove member | YES | n/a | Lead ALL policy is_team_lead_of(team_id) permits DELETE of member rows. | useTeachingTeam.tsx:481-506 (delete :485-489) | None. Working. |
| 4b | Lead: Rename team | YES | n/a | Lead ALL policy permits UPDATE of own team row. | useTeachingTeam.tsx:308-333 (update :312-316) | None. Working. |
| 4c | Lead: Disband team | YES (delete) | n/a | Lead ALL policy permits DELETE of own team. Member-row cleanup depends on a teaching_team_members.team_id FK ON DELETE CASCADE -- code asserts CASCADE (comment :510) but the FK delete-rule was NOT confirmed live this session (FK query not returned). If not CASCADE: either errors (RESTRICT) or orphans rows (SET NULL). | useTeachingTeam.tsx:512-537 (delete :516-520) | None for the delete itself. Session 3: confirm confdeltype='c' on the FK; if absent, add ON DELETE CASCADE. |
| 4d | Member: Leave team | n/a | NO | FACT B: client DELETE matches no member policy (only UPDATE-own / SELECT-own exist) -> silent 0-row no-op. resetState() lies until refetch, then the team reappears. | useTeachingTeam.tsx:634-659 (delete :638-642) | leave_teaching_team() SECURITY DEFINER (delete own accepted row) OR a self-scoped DELETE policy on teaching_team_members (user_id=auth.uid()). Repoint leaveTeam off the raw DELETE. |
| 5 | Roster count + accepted/pending state | YES | NO | Lead reads full roster (ALL policy) -> count/state correct. Member reads only own row (FACT C) -> sees just themselves; TeachingTeamCard shows "accepted+1" = always "2 members" and lists only self, regardless of true size. Post-mutation truth holds for lead actions; for leave it is wrong (see 4d). | fetchMembers useTeachingTeam.tsx:200-257 (client read :202-207); count TeachingTeamCard.tsx:289 | Source the member-side roster from the existing get_teaching_team_members resolver (already authorized to any membership) instead of the RLS-filtered client read. Same read-path family as path 2 (do together in Session 2). |
| 6a | Edge: invite expiry not rendering dead banner / not holding a slot | YES | YES | isInviteExpired() consistently excludes expired pendings from slot count (:347-353), member list (:212-214), and the invitee banner (:167). Expired invites do not hold a slot or show a dead banner. | useTeachingTeam.tsx:46-49, 167, 212-214, 347-353 | None for the visible behavior. (But see 6b -- the expired row still physically exists.) |
| 6b | Edge: re-invite after decline/leave/expiry (duplicate-row / unique constraint) | UNCONFIRMED | UNCONFIRMED | Re-invite always INSERTs a NEW teaching_team_members row (:427-438). The existingMembership guard (:401-420) only blocks active accepted / non-expired pending. If a UNIQUE(team_id,user_id) or UNIQUE(user_id) constraint exists AND old declined/expired rows are not removed, the INSERT hits 23505 -> generic "Error sending invitation". Decline's row disposition (delete vs status='declined') and the unique constraint were NOT read live this session. | useTeachingTeam.tsx:401-438; respond_to_team_invitation (decline branch, unread) | Session 3: read the unique constraint + respond_to_team_invitation decline behavior; then either have decline/leave DELETE the row, or have inviteMember reuse/UPDATE an existing declined/expired row instead of INSERT. |
| 6c | Edge: team-full cap (lead + 3 = MAX_TEAM_MEMBERS) | YES | n/a | inviteMember caps activeSlots >= MAX_TEAM_MEMBERS(3) (:351); TeachingTeamCard teamFull >= maxMembers (:153). Both exclude the lead -> lead + 3 = 4 total. | useTeachingTeam.tsx:351; TeachingTeamCard.tsx:153; contracts.ts:171 | None. Working. |
| 7 | Email base URL flows through getBaseUrl/branding | YES (invite) | n/a | notify-team-invitation builds loginUrl from getBaseUrl(branding) (index.ts:155-157); getBaseUrl returns branding.urls.baseUrl, fallback https://biblelessonspark.com (branding.ts:245-247). Confirmed call site. The "dissolution email" referenced in the task DOES NOT EXIST -- disbandTeam is client-only with no email; no notify-team-dissolution function in supabase/functions. | notify-team-invitation/index.ts:155-157; _shared/branding.ts:245-247; disbandTeam useTeachingTeam.tsx:512-537 (no email) | Invite email: none (working). Dissolution email: Session 3 -- if released members should be notified, build a new notify-team-dissolution edge function and route its links through getBaseUrl. (Hardcode fix itself is Session 3.) |

CROSS-CUTTING SECURITY FINDING (not a single path):
  All five teaching_teams / teaching_team_members policies are granted to {public}, not
  {authenticated}. The auth.uid()-based quals neutralize anon in practice (auth.uid() is
  null for anon), but the role grant should be tightened to {authenticated}. Bundle into
  the Session 3 migration.

### BUNDLED FIX PLAN (fewest migrations)

NEW SECURITY DEFINER RESOLVERS NEEDED (5th and 6th Teaching Team resolvers; existing 4
are find_teaching_team_invitee, get_teaching_team_members, get_my_teaching_team,
respond_to_team_invitation):
  - get_team_lessons()                  -- returns shared lessons of the caller's team
                                           peers (lead + accepted members), excl. caller.
                                           Bypasses lessons RLS; computes peers server-side.
  - get_team_lesson(p_lesson_id uuid)   -- single shared+same-team lesson row (path 3);
                                           optional if the viewer reuses get_team_lessons rows.
  - leave_teaching_team()               -- member deletes own accepted membership (path 4d).
                                           Alternative: a self-DELETE RLS policy on
                                           teaching_team_members (user_id=auth.uid()).

SESSION 2 (items 1-3, the VIEW path -- read-only, lowest risk):
  Migration (ONE file, e.g. 20260617120000_add_team_lessons_resolvers.sql):
    - get_team_lessons()  [+ get_team_lesson() if the viewer re-fetches by id]
  Frontend:
    - src/hooks/useTeachingTeam.tsx        -- fetchTeamLessons -> rpc('get_team_lessons');
                                              member roster sourced from get_teaching_team_members
                                              (fixes path 5 undercount, same read family).
    - src/components/dashboard/LessonLibrary.tsx -- no change if hook signature preserved.
    - EnhanceLessonForm (viewer)           -- add isTeamLesson/read-only guard (path 3).
    - src/integrations/supabase/types.ts   -- regenerate for the new RPC(s) (also clears the
                                              two still-untyped Teaching Team RPC casts).

SESSION 3 (items 4-7, mutations + edges + security + email):
  Migration (ONE file, e.g. 20260618120000_team_lifecycle_and_security.sql):
    - leave_teaching_team() resolver  OR  self-DELETE policy on teaching_team_members.
    - Re-grant the 5 teaching_teams/teaching_team_members policies {public} -> {authenticated}.
    - Confirm/repair teaching_team_members.team_id FK ON DELETE CASCADE (path 4c).
    - Re-invite fix (path 6b): once the unique constraint + decline disposition are read live,
      either DELETE rows on decline/leave or UPDATE-reuse an existing declined/expired row.
  Frontend:
    - src/hooks/useTeachingTeam.tsx -- leaveTeam -> rpc/policy; inviteMember re-invite reuse.
  Edge function (NOT a migration), optional, only if Lynn wants released members emailed:
    - supabase/functions/notify-team-dissolution/ -- new; links via getBaseUrl.
  Pre-Session-3 live reads still required (could not be confirmed this session):
    - teaching_team_members FK delete-rule (confdeltype).
    - unique constraint(s) on teaching_team_members.
    - respond_to_team_invitation decline branch (delete vs status='declined').

CARRY-FORWARD / STILL-OPEN from prior sessions (unchanged this session):
  - generate-lesson curriculum 140s timeout -> dedicated STREAMING REFACTOR session.
  - generate-devotional / generate-parable have no AbortController (raw 504 risk).
  - events 403 on analytics writes (RLS on events) -- non-blocking console noise.

## JUNE 16, 2026 SESSION (FIX: reshape-lesson retired-model 404 -- final piece of the model-retirement outage)

Resumed the June 15 model-retirement work that was HELD mid-deploy. Lynn confirmed on return
that a LIVE full-lesson generation succeeded (lesson reached 99%/completed; the 140s timeout
envelope is holding). With the main outage confirmed resolved, cleared the one remaining active
outage and recorded the session.

ROOT CAUSE -- reshape-lesson 404'd on every reshape attempt:
  * Anthropic retired claude-sonnet-4-20250514 with no grace period on June 15. generate-lesson
    was swapped to claude-sonnet-4-6 during the June 15 session, but reshape-lesson/index.ts:35
    still carried the retired literal in ANTHROPIC_MODEL. Every reshape call hit a 404 from the
    Anthropic API. (The June 15 reshape redeploy only changed the timeout at :41, not the model.)
  * FIX (commit b3992bb): ANTHROPIC_MODEL 'claude-sonnet-4-20250514' -> 'claude-sonnet-4-6' at
    reshape-lesson/index.ts:35. Redeployed the live edge function via
    `npx supabase functions deploy reshape-lesson` (deploy.ps1 does NOT touch edge functions).
    Grep-confirmed zero remaining retired-model literals in the file. ASCII guard clean.

FILES (this deploy):
  * supabase/functions/reshape-lesson/index.ts (model literal at :35; narrow-scope commit --
    manual `git add` of the single file, NOT deploy.ps1)

## JUNE 16, 2026 SESSION (FIX: 401-wave on long/backgrounded sessions -- refresh-on-refocus)

ROOT CAUSE -- after a long/backgrounded session, every authenticated REST/.rpc call 401'd in a
wave while functions.invoke kept working:
  * The asymmetry is the app's OWN code, not a library quirk. Every functions.invoke call is
    preceded by `supabase.auth.getSession()` (useAdminOperations.tsx, Admin.tsx:200,
    OrgManager.tsx:170, etc.) and passes the token manually -- getSession() auto-refreshes an
    expired token, so invoke self-heals. Bare .rpc()/.from() rely on the PostgREST sub-client's
    CACHED Authorization header, which only updates on an auth state-change event.
  * Trigger: when a tab is backgrounded/idle a long time, the browser throttles
    autoRefreshToken's timer, so the scheduled refresh is missed and the 1h access token expires.
    On return the PostgREST client still holds the stale header -> 401 wave; invoke refreshes via
    its getSession() call. Confirmed by config.toml (only 3 webhook/blog funcs are verify_jwt
    false; generators verify JWT -> the tokens genuinely differ, fresh vs stale).
  * FIX (commit 6036bbe): useAuth.tsx -- added a visibilitychange/focus listener that calls
    supabase.auth.getSession() on tab refocus. The forced refresh fires TOKEN_REFRESHED, which
    updates the cached PostgREST header, so the first post-return query batch uses a valid token.
    ~28 lines, no API/UI surface change. Build clean; Lynn verified localhost; shipped via
    deploy.ps1. NOTE: the separate custom 30-min inactivity signOut() in useAuth.tsx was left
    untouched (out of scope; flagged as worth revisiting -- it duplicates Supabase session mgmt).

## JUNE 16, 2026 SESSION (STEP 2: model-ID SSOT -- and 3 MORE live retired-model outages found+fixed)

The model-ID audit revealed the June 15 fire was wider than known: besides reshape-lesson, THREE
more live functions were still 404ing on the retired claude-sonnet-4-20250514 --
extract-lesson (3 paths), generate-devotional (1 call + its metrics log), and toolbelt-reflect
(via toolbeltConfig.claudeModel). STEP 2 fixed those outages AND removed the duplicated literals
that caused the whole episode.

WHAT SHIPPED:
  * NEW SSOT src/constants/modelConfig.ts -- ANTHROPIC_MODELS = {default:'claude-sonnet-4-6',
    fast:'claude-haiku-4-5-20251001', parable:'claude-sonnet-4-5-20250929'}. Created via
    WriteAllText UTF8Encoding($false) -- no BOM, ASCII-clean.
  * Added 'modelConfig.ts' to FILES_TO_SYNC (scripts/sync-constants.cjs) + CLAUDE.md Rule #23
    (now 16 synced files). npm run sync-constants -> 16/16; _shared/modelConfig.ts generated.
  * Removed claudeModel from toolbeltConfig.ts (grep-confirmed toolbelt-reflect:345 was the ONLY
    reader); re-sync dropped it from the _shared mirror too.
  * All 6 generators repointed off literals and redeployed via `supabase functions deploy`:
      - generate-lesson:50, reshape-lesson:35 -> ANTHROPIC_MODELS.default (same value, now SSOT)
      - extract-lesson -> .default (3 retired paths: 164/236/311) + .fast (2 haiku paths: 69/379)
      - generate-devotional -> .default (645 call + 727 metrics log; both were retired)
      - generate-parable:878 -> .parable (INTENTIONALLY kept on 4.5 -- do NOT collapse to default)
      - toolbelt-reflect:345 -> ANTHROPIC_MODELS.default (imports modelConfig directly now)
  * Doc fix MASTER-PLAN.md:224 (retired literal -> SSOT reference).
  * Grep-verified ZERO retired literals remain in live code (only the rationale comment in
    modelConfig.ts mentions the old id). Frontend build clean.

DEPLOY ORDER (per Lynn's RPC-before-frontend rule): 6 functions deployed FIRST (all OK, each
  bundled _shared/modelConfig.ts -> import resolves), THEN deploy.ps1 for the frontend payload
  (modelConfig.ts + toolbeltConfig + sync-constants.cjs + CLAUDE.md + MASTER-PLAN + this file).

SMOKE TESTS (Lynn, on live, after all 6 deployed) -- RESULTS:
  * #1 full lesson (regression) ......... PASS
  * #3 devotional ....................... PASS (generate-devotional off the retired model)
  * #4 parable .......................... PASS (generate-parable correctly still on 4.5)
  * #5 toolbelt reflect ................. PASS (toolbelt-reflect off the retired model)
  * #2 extract/enhance (curriculum) ..... FAIL -> surfaced TWO separate bugs, see next session.

## JUNE 16, 2026 SESSION (FIX: EnhanceLessonForm curriculum reset ReferenceError; DIAGNOSE curriculum-path generate-lesson timeout)

Smoke test #2 (5 JPEGs -> extract -> generate) failed. Investigation separated it into TWO
distinct problems; one fixed today, one scoped as a dedicated future session (no band-aids).

PROBLEM 1 (FIXED, shipped commit 61852ef) -- client ReferenceError in the post-generation reset:
  * EnhanceLessonForm.tsx:1414 called setExtractedContent(null), but the 348a904 multi-page
    refactor turned extractedContent into a DERIVED const (:526, joined from extractedPages
    state at :516) -- so setExtractedContent no longer exists. Grep confirmed :1414 was the
    only stale reference. Same class as the setUploadedFile->setUploadedFiles fix two lines up.
  * FIX: setExtractedContent(null) -> setExtractedPages([]) (matches existing resets at :1095,
    :1187). Build clean, ASCII/no-BOM verified, shipped via deploy.ps1.
  * This ReferenceError fired in the success/cleanup path and was MASKING the real result --
    it is independent of Problem 2 (a client cleanup error cannot cause a server 500).

PROBLEM 2 (DIAGNOSED, NOT band-aided -- streaming refactor scoped below) -- generate-lesson
  500 on the curriculum path:
  * Confirmed timeline POST-STEP2 from code: extract-lesson's JPEG OCR call uses
    ANTHROPIC_MODELS.default (extract-lesson:312) which was the RETIRED sonnet pre-STEP2; a
    pre-STEP2 JPEG upload hard-500s at :336-342 with zero chars extracted, so generate-lesson
    is never reached. "12,211 chars extracted" + the generate-lesson 500 were only possible
    AFTER STEP2 fixed extraction. So Problem 2 is a real, current, open issue.
  * Root cause = the 140s abort. The live 500 response body was exactly
    {"error":"Lesson generation timed out. Please try again."} which is produced ONLY by the
    AbortError branch (generate-lesson:1220 -> :1234), i.e. controller.abort() at 140s.
  * WHY: claude-sonnet-4-6 already runs ~119-121s for a plain full lesson -- only ~20s under
    the 140s abort, which is itself pinned just under the 150s Supabase gateway 504 ceiling.
    The curriculum path adds ~3K input tokens AND a longer output (richer source) -> tips past
    140s. CANNOT raise the timeout (150s gateway is hard). Token/context limit is NOT the cause
    (12K chars ~= 3K tokens; total ~17K vs the 200K window).
  * DECISION (Lynn): do NOT band-aid with max_tokens reduction + curriculum truncation. The
    proper fix is to STREAM generate-lesson's Anthropic response so the gateway's IDLE timeout
    never fires regardless of duration. Scoped as its own session below.

CARRY-FORWARD (smaller items, still open):
  1. generate-devotional / generate-parable have NO AbortController -- raw 504 if they exceed
     150s. (Streaming would also be the proper fix for these eventually.)
  2. events 403 on analytics writes (RLS on the events table) -- non-blocking console noise.
  3. Hardening: generate-lesson returns 500 (not 401) on bad auth via the :1214 catch-all.
  4. useAuth.tsx 30-min inactivity signOut() duplicates Supabase session mgmt -- revisit.
  5. Teaching Team Session 1 diagnosis (still queued).

================================================================================
## UPCOMING SESSION (PLANNED, SCOPED): STREAMING REFACTOR -- generate-lesson
================================================================================
Status: NOT STARTED. This is a first-class planned session, fully scoped here so it can be
executed directly. Goal: eliminate the curriculum-path (and any long) lesson-generation 504/
timeout by streaming the Anthropic response, so the Supabase 150s IDLE gateway timeout never
fires -- generation may take as long as it needs while bytes keep flowing to the client.

WHY STREAMING IS THE CORRECT FIX
  The 150s gateway limit is an IDLE timeout: it fires when the function sends the client nothing
  for ~150s. Today generate-lesson awaits the FULL Anthropic response (up to the 140s abort) and
  sends the client nothing until it returns -> the connection looks idle. If instead the function
  streams tokens (or even heartbeats) to the client as they arrive, the connection is never idle
  and the timeout cannot fire -- duration stops mattering. This removes the ceiling rather than
  shaving milliseconds under it.

END-TO-END ARCHITECTURE (target: true token streaming + final authoritative payload)
  1. Pre-flight UNCHANGED: auth, limit/trial checks, validation, prompt build all run first
     (fast, before any Anthropic call) exactly as today.
  2. Anthropic call switches to stream:true (SSE). The function returns a streaming Response
     (ReadableStream, content-type text/event-stream) instead of awaiting the whole body.
  3. As deltas arrive, the function (a) forwards them to the client as `token` SSE events for
     live display, and (b) accumulates the full text server-side.
  4. On stream end, server-side and INSIDE the same streamed response: run the EXISTING
     post-processing unchanged -- checkOutputGuardrails, optional rewrite (still time-budget
     gated), parseLessonSections -- then INSERT into lessons + UPDATE generation_metrics.
  5. Emit a final `done` SSE event carrying the saved lesson row + metadata + style_metadata,
     then close the stream. Emit an `error` SSE event instead if anything throws after streaming
     began (so the client never shows a half-saved lesson).
  6. The streamed text is a live PREVIEW; the `done` payload (the saved row) is AUTHORITATIVE.
     If a guardrail rewrite changed sections, the client replaces the preview with the `done`
     content. (Rewrite is already skipped under the 80s budget at current latency, so in
     practice preview == saved today -- but the contract must handle divergence.)
  7. The 140s AbortController is removed/relaxed to just a stall guard (abort only if the stream
     goes silent for N seconds), NOT a total-duration cap.

FILES THAT CHANGE
  * supabase/functions/generate-lesson/index.ts -- CORE, largest change. Switch to stream:true,
    return a ReadableStream Response, move post-processing + DB save into the stream-end handler,
    emit token/done/error SSE events, replace the 140s total-duration abort with a stall guard.
  * src/hooks/useEnhanceLesson.tsx -- switch from supabase.functions.invoke (buffers, no
    streaming) to a raw fetch() to the function URL, with the Authorization bearer from a FRESH
    getSession() (see the 401 refocus fix -- same fresh-token requirement) + apikey header.
    Parse the SSE stream; expose token progress; resolve with the `done` lesson. New return
    contract (callback or async-iterator for tokens; final lesson on done).
  * src/components/dashboard/EnhanceLessonForm.tsx -- consume the new hook contract. Optionally
    render a live streaming preview + drive the real progress bar from token flow instead of the
    fake timer. Ensure incrementUsage fires EXACTLY ONCE on `done` (never on partial/failed
    streams) and the reset/cleanup (the Problem 1 area) still runs on done. Series-mode handoff
    (linkLessonToSeries, addLessonSummary, style_metadata capture) moves to the done handler.
  * src/hooks/useLessons.tsx (or wherever generated lessons are stored/refreshed) -- VERIFY the
    saved-lesson handoff still works with the streamed `done` payload (likely small/none).
  * supabase/functions/_shared/corsConfig.ts -- VERIFY headers allow the raw fetch (Authorization)
    and a text/event-stream response (small/none, but confirm before relying on it).
  NOT in scope this session: reshape-lesson (same timeout class -- stream it in a follow-up once
  the generate-lesson pattern is proven), generate-devotional/parable AbortController items.

RISK SURFACE / CAREFUL TESTING
  * Auth: raw fetch must attach a FRESH token (getSession) + apikey -- highest 401 risk; test a
    long/backgrounded session too (ties to today's 401 fix).
  * Exactly-once billing: incrementUsage / trial+limit consumption must fire only on `done`, not
    on partial or errored streams -- risk of double-charge or charge-on-failure.
  * Mid-stream failures: Anthropic error after tokens started, OR DB save failure at stream end
    -- must surface as a clean `error` event, never a half-lesson or a silent success.
  * SSE robustness: partial chunks / event framing / proxy buffering (confirm Netlify + Supabase
    pass text/event-stream through unbuffered).
  * Preview-vs-saved divergence on guardrail rewrite -- client must swap to the `done` content.
  * Coordinated deploy: a streaming function with the OLD client (or vice-versa) is broken --
    deploy generate-lesson + the frontend together; no partial rollout.
  * Regression parity: a plain (non-curriculum) lesson must produce an IDENTICAL saved lesson +
    generation_metrics row to pre-refactor.
  TEST MATRIX: plain lesson; curriculum lesson (the 12K-char case that timed out -> must now
  finish); a deliberately >150s generation (the core proof); guardrail-violation/rewrite path;
  mid-stream error; limit-reached (modal, no usage charged); series mode; teaser on; auth on a
  stale/backgrounded session; mobile.

ESTIMATED SESSION SIZE: LARGE -- a major-feature-sized session. It changes the app's most
  critical function plus two client files and the client/server transport protocol, with a wide
  test surface. Recommend Lynn block a dedicated, uninterrupted window and NOT combine it with
  other work. De-risking option: split into TWO sessions -- (A) generate-lesson streaming +
  minimal client wiring (resolve-on-done, no live-token UI) to kill the timeout; (B) live-token
  preview UX + real progress bar + edge-case hardening. Session A alone fixes the outage.

## JUNE 15, 2026 SESSION (FIX: Teaching Team member experience -- toast on load, missing invite banner, accept, sidebar lock)

Three sequenced fixes for the non-lead / invitee side of Teaching Team, all shipped together
in one deploy. The "Unknown" lead-side fix below (commit b8bd22e) preceded these.

ROOT CAUSE 1 -- "Error loading team data" toast for any non-lead member/invitee:
  * teaching_teams SELECT is RLS-restricted to the lead teacher. fetchTeamData resolved a
    non-lead's team via raw .from('teaching_teams').single() (accepted + pending paths),
    which RLS zero-filtered -> PGRST116 -> fetchTeamData catch -> toast. (The
    get_teaching_team_members RPC was NOT the source; fetchMembers swallows its own errors.)
  * FIX: migration 20260615130000 -- get_my_teaching_team() SECURITY DEFINER returns the
    caller's single team (lead OR pending/accepted member) past RLS, with lead_full_name +
    my_status. Same migration WIDENED get_teaching_team_members' guard to ANY membership row
    (pending OR accepted), not just accepted, so a pending invitee can load the roster.
  * fetchTeamData rewritten: one get_my_teaching_team call, branch on my_status
    (lead/accepted/pending); no row -> resetState (no toast); only a genuine RPC throw
    toasts. Pending branch still reads the invitee's OWN membership row (RLS-allowed) for
    membership_id/invited_at/expires_at.

ROOT CAUSE 2 -- invitee never saw an accept/decline banner (could not accept):
  * TeamInvitationBanner.tsx existed but was ORPHANED -- nothing rendered it. Dashboard.tsx
    only destructured { hasTeam }, never pendingInvitation/accept/decline. Independent of RLS.
  * acceptInvitation/declineInvitation did a client-side UPDATE of teaching_team_members.
    A non-lead invitee has NO verified RLS UPDATE policy (tables built in dashboard, Phase 27;
    no CREATE POLICY in repo). Because the banner never rendered, the accept path had NEVER
    run -- a missing UPDATE policy would have silently affected 0 rows (RLS filters UPDATEs
    without error), leaving the lead stuck on "Pending".
  * FIX: migration 20260615140000 -- respond_to_team_invitation(p_membership_id, p_accept)
    SECURITY DEFINER (plpgsql) updates the invitee's own row past RLS; security boundary is
    WHERE id = p_membership_id AND user_id = auth.uid() AND status = 'pending'; returns the
    affected team_id or NULL (no-op). IF/ELSE branches so the status literal coerces whether
    the column is enum or text. acceptInvitation/declineInvitation now call this RPC and
    return a success boolean; NULL return is a benign "no longer pending" no-op.
  * Dashboard.tsx now renders TeamInvitationBanner when pendingInvitation is set; Accept
    navigates to /teaching-team (remounts AppShell -> sidebar refetches), Decline clears it.

ROOT CAUSE 3 -- Teaching Team sidebar item stayed locked for a free ACCEPTED member:
  * sidebarConfig teachingTeam is tierGate 'paid_only'; AppShell gated isLocked on tier only
    -> a free accepted member saw it grayed -> upgrade modal, could never reach the page.
  * FIX (no migration): AppShell reads isMember from useTeachingTeam(); gate is now
    isLocked = isFreeTier && tierGate === 'paid_only'
      && !(item.id === 'teachingTeam' && isAcceptedTeamMember).
    Lead-creation stays paid_only (free non-member still locked -> upgrade); pending invitees
    stay locked (they act via the banner); only an accepted member unlocks the item.

WHY A SECURITY DEFINER RESOLVER, NOT A teaching_teams RLS SELECT POLICY: a teaching_teams
  policy that EXISTS-checks teaching_team_members, whose own policies reference
  teaching_teams.lead_teacher_id, risks 42P17 mutual recursion. The resolver sidesteps it and
  matches the pattern (now 4 Teaching Team resolvers total).

FILES (this deploy):
  * supabase/migrations/20260615130000_add_my_teaching_team_resolver.sql (new)
  * supabase/migrations/20260615140000_add_respond_to_team_invitation.sql (new)
  * src/hooks/useTeachingTeam.tsx (fetchTeamData rewrite; accept/decline -> RPC)
  * src/pages/Dashboard.tsx (TeamInvitationBanner wiring + post-accept navigate)
  * src/components/layout/AppShell.tsx (sidebar gate unlock for accepted members)
  * src/integrations/supabase/types.ts (REGENERATED for all 4 Teaching Team RPCs; `as any`
    casts dropped. NOTE: the prior committed types.ts was UTF-16 LE + BOM -- generated long
    ago via a PowerShell `>` redirect, the CLAUDE.md trap. Regenerated via
    `npx supabase gen types typescript --linked` piped to a temp file in Git Bash, then copied
    in as UTF-8/ASCII no-BOM. The whole-file diff is that encoding flip plus the 4 functions;
    this is an improvement -- the file is now ASCII-clean.)

VERIFIED (Lynn, localhost:8080): invitee sees banner; Accept -> status flips to accepted (no
  toast, no silent no-op), /teaching-team reads "You are a team member | 2 members";
  auto-navigates to /teaching-team with the item UNLOCKED (active green) for the free accepted
  member; Decline clears cleanly; lead view unchanged; free NON-member still sees it locked.
  Other free-tier items (Devotional/Series/Parable) remain correctly locked. npm run build
  clean; ASCII guard clean. All 3 resolver migrations (1120000/1130000/1140000) applied to the
  live DB BEFORE the frontend shipped.

CARRY-FORWARD:
  * getBaseUrl/_shared/branding.ts hardcodes https://biblelessonspark.com, so the invite-email
    "Log In to Respond" link always points at prod and cannot be tested on localhost. Future:
    have getBaseUrl prefer an env var (SITE_URL/APP_URL), falling back to the branding literal.
    (Report only -- no prod change made.)
  * AppShell now calls useTeachingTeam() -> one extra get_my_teaching_team RPC per page load
    (second instance on Dashboard/TeachingTeam pages). Functionally fine; optional future
    optimization is to lift team state to context to dedupe.
  * contracts.ts is missing the PendingTeamInvitation and TeachingTeamMemberWithProfile
    interface definitions (imported but undefined; vite/esbuild erases types so the build
    never caught it -- there is no tsc gate). Add them in a future cleanup for real type safety.


## JUNE 15, 2026 SESSION (FIX: Teaching Team pending/accepted rows render "Unknown" for non-admin Lead Teachers)

- BUG (live, /teaching-team, paid NON-admin Lead Teacher): every member row in the team list
  showed "Unknown" + Pending instead of the invitee's profile name (or invited email when name
  is null). All invitees were registered, verified free accounts with a populated
  profiles.full_name.

- DIAGNOSIS (STOP->DIAGNOSE->VERIFY->PROPOSE->WAIT->IMPLEMENT, read code first):
  * Render fallback: TeachingTeamCard.tsx:309 -> {member.display_name || member.email ||
    "Unknown"}. For pending rows both fields were null.
  * Source of those fields: useTeachingTeam.tsx fetchMembers() resolved names via a client-side
    read .from('profiles').select('id, full_name, email').in('id', memberIds).
  * ROOT CAUSE: same RLS class as the 2026-06-14 invite fix, but on the LIST-RENDER path. The
    profiles SELECT policy `profiles_org_admin_view_all` (verified in migration ...e8a4fb73...)
    allows reading a profile row only when has_role(admin), id = auth.uid(), or the viewer is
    admin/owner over the invitee's org. A non-admin Lead Teacher viewing an unaffiliated invitee
    matches none -> profiles returns zero rows (silent, no error) -> display_name/email null ->
    "Unknown". Admin sessions pass has_role(admin) and never reproduce it.
  * Why it looked fine right after inviting then broke: inviteMember() pushes the invitee into
    local state already enriched (full_name from the resolver + the typed email), so the name
    showed in-memory; on any reload/refetch, fetchMembers ran the RLS-blocked profiles read and
    overwrote it back to "Unknown". The reload is the real test.
  * Schema: teaching_team_members has NO name/email column (contracts.ts:191-200; insert writes
    only team_id/user_id/status/expires_at). Display name was ONLY ever derived at runtime via
    the RLS-blocked profiles read -- no persisted copy.

- FIX CHOSEN: option (b) SECURITY DEFINER resolver (NOT persist-columns). Persisting would need
  a schema migration + backfill (backfill itself needs a SECURITY DEFINER path anyway),
  duplicate email PII (the 2026-06-14 resolver deliberately avoided returning email), go stale on
  name change, and leave existing pending rows stuck. The resolver fixes pending AND accepted in
  one place, no schema change, no backfill, always current -- consistent with the 2026-06-14
  precedent.

- IMPLEMENTATION (1 migration + 1 hook):
  * Migration 20260615120000_add_teaching_team_member_resolver.sql -- new SECURITY DEFINER
    resolver get_teaching_team_members(p_team_id uuid) RETURNS TABLE(user_id uuid, full_name
    text, email text, status text, invited_at timestamptz, responded_at timestamptz, expires_at
    timestamptz). Joins teaching_team_members -> profiles (full_name) -> auth.users (email SSOT),
    all schema-qualified. Authorization gate inside the function: returns rows ONLY if auth.uid()
    is the team's lead_teacher_id OR an accepted member of p_team_id (two EXISTS, OR'd);
    unauthorized callers get zero rows (no error, no leak). LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path = public, auth. REVOKE EXECUTE FROM PUBLIC, anon; GRANT EXECUTE TO
    authenticated -- mirrors find_teaching_team_invitee posture exactly. Returns email (the Lead
    Teacher supplied it at invite time; scoped to the team's own roster -- not a leak).
  * src/hooks/useTeachingTeam.tsx fetchMembers() -- replaced the RLS-blocked profiles
    .in('id', memberIds) read with a single (supabase.rpc as any)('get_teaching_team_members',
    { p_team_id: teamId }). Builds the same profileMap; enrichment mapping (display_name/email
    over ...m), membership id, member shape, and invited_at ordering all preserved.
    inviteMember()'s in-memory enrichment left as-is.

- UNCHANGED (as approved): TeachingTeamCard.tsx:309 (fallback already correct); no schema change
  to teaching_team_members; no FILES_TO_SYNC entries; no routes/App.tsx change.

- VERIFIED: two-step check (function name absent from all migrations; not previously applied);
  db push applied the migration to the live DB BEFORE the frontend shipped (RPC exists before
  callers); npm run build clean (3953 modules); migration + hook both ASCII-only, no BOM; Lynn
  confirmed on localhost:8080 as a NON-admin paid Lead Teacher (pending rows show name/email +
  Pending; accepted members resolve by name; invite survives reload).

- CARRY-FORWARD: regenerate src/integrations/supabase/types.ts so get_teaching_team_members is
  natively typed, then drop the `as any` cast on the supabase.rpc call in useTeachingTeam.tsx
  (cosmetic/type-safety only; build is clean). NOTE: this is now the SECOND Teaching Team RPC
  (with find_teaching_team_invitee) still untyped -- regenerate once and clear both casts.


## JUNE 14, 2026 SESSION (FIX: Teaching Team invite "No account found" for non-admin Lead Teachers)

- BUG (live): A signed-up, signed-in, verified user (pastorlynn2024@gmail.com) could not be
  found when a Lead Teacher invited them by email on /teaching-team. The invite UI returned
  "No BibleLessonSpark account found for that email" even though the account existed.

- DIAGNOSIS (STOP->DIAGNOSE->VERIFY->PROPOSE->WAIT->IMPLEMENT, read code first):
  * Lookup site: useTeachingTeam.tsx inviteMember() did
    .from('profiles').select('id, full_name, email').eq('email', lower(trim)).maybeSingle().
  * INITIAL THEORY (FALSIFIED): profiles.email is never populated (the handle_new_user /
    create_profile_on_verification triggers omit email from their INSERTs), so the filter
    would match nothing. A read-only verification query DISPROVED this: profiles.email WAS
    populated for the invitee (lowercase, exact match, email_confirmed_at set). The NULL-email
    lead is dead -- do NOT re-investigate it. Backfill + trigger edits were dropped.
  * CORRECTED ROOT CAUSE: RLS. The profiles SELECT policy `profiles_org_admin_view_all`
    (migration ...e84f2db8...) allows reading a profile row only when is_admin()
    (profiles.role='admin'), id = auth.uid(), or the viewer is admin/owner over the invitee's
    org. A non-admin Lead Teacher inviting an unrelated individual matches none -> RLS
    silently filters the row (zero rows, no error) -> maybeSingle() returns null -> "No
    account found." An admin session (e.g. Lynn) passes is_admin() and never hit the block,
    which is why it only reproduced on non-admin accounts.
  * Downstream corroboration: notify-team-invitation also reads profiles.email but uses the
    service-role client (RLS bypassed), so it was not the blocker here.

- FIX (1 migration + 1 hook, no backfill, no trigger edits):
  * Migration 20260614120000_add_teaching_team_invitee_lookup.sql -- new SECURITY DEFINER
    resolver find_teaching_team_invitee(p_email text) RETURNS TABLE(id uuid, full_name text).
    Reads the email SSOT auth.users.email joined to profiles for full_name, normalized
    lower(trim()) on both sides, ORDER BY created_at LIMIT 1 (deterministic; auth enforces
    email uniqueness for verified accounts). Returns ONLY { id, full_name } -- no email/tier/
    PII leaked. SET search_path = public, auth (non-hijackable) + all objects schema-qualified.
    REVOKE EXECUTE FROM PUBLIC, anon; GRANT EXECUTE TO authenticated (matches Migrations 2/3
    security posture). Bypasses RLS by design, fixing the non-admin path.
  * src/hooks/useTeachingTeam.tsx -- inviteMember() lookup swapped to
    supabase.rpc('find_teaching_team_invitee', { p_email: email }); "No account found" branch
    preserved (fires on empty result); enriched member's email now sourced from the invited
    address (resolver doesn't return email).

- SSOT SOURCE: auth.users.email (Supabase Auth) is the authoritative email source; the
  resolver reads it directly. profiles.email is a populated mirror but no longer the read path.

- VERIFIED: npm run build clean (3953 modules); db push applied the migration to the live DB
  BEFORE the frontend shipped (RPC exists before callers); Lynn confirmed on localhost:8080
  as a NON-admin paid Lead Teacher (invite resolves; bogus address still "No account found").

- DEPLOYED: commit 5a60738 (2 files: useTeachingTeam.tsx + the migration; +70/-7). First push
  hit a transient "Connection was reset"; retry succeeded (0c59ab3..5a60738). Working tree
  clean (only the two intended files staged).

- CARRY-FORWARD: regenerate src/integrations/supabase/types.ts after this migration so
  find_teaching_team_invitee is natively typed, then drop the `as any` cast on the
  supabase.rpc call in useTeachingTeam.tsx (build is clean today; cosmetic/type-safety only).


## JUNE 14, 2026 SESSION (FEATURE: Remove a lesson from a series without deleting it)

- GOAL: Add a "Remove from Series" control to the saved-lesson viewer that detaches
  a lesson from its parent series ONLY. The lesson must remain fully intact in the
  Lesson Library. Distinct from the existing Delete/trash path (which destroys the row).

- DIAGNOSIS (STOP->DIAGNOSE->VERIFY->PROPOSE->WAIT->IMPLEMENT, read code first):
  * Link model: FK columns series_id + series_lesson_number ON THE lessons ROW (not a
    join table). Attach = linkLessonToSeries (useSeriesManager.ts:435-441).
    Detach = UPDATE lessons SET series_id=null, series_lesson_number=null WHERE id.
  * No detach path existed -- only attach. Added one (frontend-drives-backend).
  * Series count derives from counting lessons by series_id (SeriesLibrary.tsx:62-73);
    lesson_summaries.length is only a display fallback (:327,329) -- detach does not
    touch it. The expanded list renders the RAW series_lesson_number (:445), so detach
    must renumber remaining lessons to contiguous 1..n to avoid a visible gap.
  * Delete path (UNTOUCHED): handleDeleteCurrentLesson (EnhanceLessonForm.tsx:1558) ->
    deleteLesson (useLessons) + lessonDeletion.ts cascade helpers. Reuses none of it.
  * Viewer knows its parent series via liveLesson.series_id (EnhanceLessonForm.tsx:
    2589-2590), already used for the "In Series" badge. New control gates on the same
    liveSeriesId, so it shows ONLY when the lesson is in a series.

- IMPLEMENTATION (2 files):
  * src/hooks/useSeriesManager.ts -- new removeLessonFromSeries(lessonId, seriesId):
    (1) clears series_id + series_lesson_number on that row only; (2) refetches the
    remaining lessons ordered by series_lesson_number and renumbers them contiguous
    1..n (writes only rows whose number changed); ordering repair is best-effort if
    the post-detach fetch fails (detach already committed). Added to interface + return.
    Mirrors the pin_order re-sequencing precedent in SeriesLibrary.
  * src/components/dashboard/EnhanceLessonForm.tsx -- destructure removeLessonFromSeries;
    add removingFromSeries state; handleRemoveCurrentLessonFromSeries uses window.confirm
    (copy explicitly states the lesson stays in the Library), then refetchLessons() so
    the "In Series" badge clears and "Add to Series" returns without reload. New
    "Remove from Series" button rendered beside the "In Series" badge (liveSeriesId
    branch), amber hover, ListX icon, aria-label naming purpose + that the lesson stays
    in the Library; spinner while in flight.

- NOT NEEDED: routes/App.tsx (viewer is a dashboard tab + viewing state, VIEW_LESSON
  is a tab value not a path -- routes.ts:77); sync-constants (neither file in
  FILES_TO_SYNC, Rule #23); edge function; DB migration (FK columns already exist;
  detach is an owner-scoped UPDATE on the same RLS path attach already uses).

- ALSO THIS SESSION (earlier): deleted the dead TEACHING_TEAM_VALIDATION block from
  src/constants/validation.ts (commit 1ad6597) -- resolves the carry-forward from the
  Teaching Team sidebar entry below. Authoritative team cap remains MAX_TEAM_MEMBERS in
  contracts.ts (lead + 3 = 4).

- VERIFIED: npm run build clean (3953 modules); ASCII guard clean; Lynn approved on
  localhost:8080 (detach leaves lesson in Library, count -1, ordering renumbered
  contiguous, control hidden when not in a series, Delete path unchanged).

- DEPLOYED: commit 1601248 (2 files: useSeriesManager.ts + EnhanceLessonForm.tsx;
  +141/-10). Working tree clean; deploy.ps1 used directly.

- CARRY-FORWARD: none.


## JUNE 14, 2026 SESSION (FIX: Teaching Team sidebar hidden for paid individuals)

- BUG (live): A confirmed paid Personal-tier individual (badge "Personal", 13/20
  lessons used) had NO "Teaching Team" item in the sidebar. Teacher Tools showed;
  Teaching Team did not.

- DIAGNOSIS (STOP->DIAGNOSE->VERIFY->PROPOSE->WAIT->IMPLEMENT, read code first):
  * NOT a tier-field divergence (the send-lesson-email 403 class was the hypothesis).
    The dashboard badge and the sidebar gate read the SAME field from the SAME source:
    useSubscription().tier <- check_lesson_limit RPC (useSubscription.tsx:73/91;
    AppShell.tsx:281-282). The item-level tierGate: 'paid_only' was functioning.
  * ROOT CAUSE: the item never reached the tier gate. For the `individual` role the
    teachingTeam item lived ONLY in section `myTeachingTeamConditional`, which carried
    `condition: 'hasTeam'` (sidebarConfig.ts:277-282, 342). AppShell drops any section
    whose condition is unmet (AppShell.tsx:289-292), and hasTeam = !!team
    (useTeachingTeam.tsx:659). A paid teacher with no team yet -> hasTeam false ->
    whole section filtered out BEFORE the gate ran. Chicken-and-egg: the link to
    CREATE a team was hidden until a team already existed.
  * Aggravating: only Dashboard.tsx:250 and TeachingTeam.tsx:38 pass conditions={{hasTeam}};
    all other AppShell pages pass none, so the item was hidden there regardless.

- FIX (minimal):
  * src/constants/sidebarConfig.ts -- `individual` role moved from
    'myTeachingTeamConditional' to the unconditional 'myTeachingTeam' section.
    Visibility now governed solely by item-level tierGate: 'paid_only' (free ->
    grayed/locked with the "Moses had Aaron..." lockedCopy + upgrade modal; paid ->
    active, routes to /teaching-team). Orphaned myTeachingTeamConditional section
    removed (dead after the change). Stale doc comments updated.
  * src/constants/validation.ts -- corrected the two misleading comments in the
    TEACHING_TEAM_VALIDATION block (comments only; values 3/2 untouched, zero
    behavior change).

- INVITE FLOW (confirmed intact + reachable once item renders): createTeam
  (useTeachingTeam.tsx:248), inviteMember caps at activeSlots >= MAX_TEAM_MEMBERS
  where MAX_TEAM_MEMBERS = 3 (contracts.ts:171) and members[] excludes the lead ->
  lead + 3 = 4 total, matching spec.

- NOT in FILES_TO_SYNC (sidebarConfig.ts, validation.ts) -> no sync-constants run.
  No routes/App.tsx change (/teaching-team already wired). No DB/edge changes.

- VERIFIED: npm run build clean (3953 modules); ASCII guard clean; Lynn approved on
  localhost:8080 (Teaching Team now visible for paid individual, routes to page,
  persists across pages).

- DEPLOYED: commit f077d7f (2 files: sidebarConfig.ts + validation.ts; +17/-16).
  Working tree clean; deploy.ps1 used directly.

- CARRY-FORWARD: TEACHING_TEAM_VALIDATION in validation.ts is fully DEAD CODE (never
  imported) and its VALUES (MAX_TEAM_MEMBERS:3 / MAX_INVITED_MEMBERS:2) encode an
  older "lead + 2 = 3 total" model contradicting contracts.ts (lead + 3 = 4).
  Comments now flag this. Candidate for outright deletion in a future cleanup pass.


## JUNE 11, 2026 SESSION (Add Regular Baptist (GARBC) as 12th theology profile)

- GOAL: Add Regular Baptist (GARBC) as the 12th Baptist theology profile with full
  guardrail parity with the existing 11. Source authority: GARBC Articles of Faith.

- IMPLEMENTATION (SSOT, frontend-drives-backend):
  * src/constants/contracts.ts -- appended 'regular-baptist-garbc' to the
    TheologyProfileId union (after 'cbf'); header comment 11 -> 12.
  * src/constants/theologyProfiles.ts -- appended the 12th profile entry after CBF,
    matching the CBF structural template exactly. Doctrinal distinctives encoded in
    filterContent (prompt-injected verbatim): verbal-plenary inspiration/inerrancy,
    Trinity, Holy Spirit + CESSATIONISM, literal creation + historical Adam + fixed
    gender binary, total depravity, grace-alone substitutionary salvation, eternal
    security, autonomous congregational church, two ordinances by single immersion,
    biblical separation (signature distinctive), civil government, Israel distinct
    from the church (no replacement theology), dispensational premillennial /
    pretribulational eschatology, everlasting conscious final states.
  * Deterministic field values: securityDoctrine 'eternal' (Independent Baptist
    analog); tulipStance 'anti' (union is only anti|pro -- no moderate value exists,
    so IB fallback per spec); badgeClass 'bg-indigo-100 text-indigo-800
    border-indigo-200' (indigo unused by the other 11).
  * avoidTerminology: replacement theology, theistic evolution, speaking in tongues,
    lose your salvation, sprinkling + the standard CRITICAL sacrament/sacraments/
    Eucharist ordinance trio. preferredTerminology: communion -> the Lord's Supper,
    christening -> believer's baptism + the three CRITICAL ordinance substitutions.
  * guardrails[] array carries the 10 "Never present..." content prohibitions so they
    surface as CONTENT PROHIBITIONS in the injected block.

- GUARDRAIL WIRING (verified by reading code, zero extra wiring):
  * generateTheologicalGuardrails() (theologyProfiles.ts:1459) data-drives off the
    profile array -- new entry picked up automatically. Universal
    generateBaptistTerminologyGuardrails() appended at :1511. SBC soteriological
    block is a no-op for GARBC.
  * generate-lesson/index.ts:673 injects ${theologyProfile.summary} (the June 4
    .description->.summary fix); the new entry's summary populates it. No lingering
    .description in the shared mirror.

- SYNC (Rule #23): npm run sync-constants (15/15). _shared/theologyProfiles.ts and
  _shared/contracts.ts verified BOM-free (byte0=0x2F), zero non-ASCII bytes, GARBC present.

- UI: all selectors consume the SSOT (no hardcoded lists) -- EnhanceLessonForm.tsx:2235
  getTheologyProfileOptions().map, FeaturesSection.tsx:34/167, PreferencesLens.tsx:21
  getTheologyProfilesSorted(), plus LessonLibrary / UserProfileModal (x2) /
  OrganizationSettingsModal / OrganizationSetup / ParableGenerator / DevotionalGenerator.
  No refactor needed.

- COUNT SWEEP -> 12: src/config/comparisonConfig.ts (5x '12 Baptist theology profiles'),
  src/pages/PreferencesLens.tsx:20 comment, src/constants/contracts.ts:69 comment,
  CLAUDE.md Principle #3.

- DATABASE: grep of supabase/migrations/ for theology-profile CHECK/enum constraints
  returned NONE. No migration needed (frontend-drives-backend; June 2026 audit clean).

- EDGE FUNCTIONS REDEPLOYED (only consumers of the shared SSOT mirror):
  generate-lesson, generate-devotional (npx supabase functions deploy <name> --use-api).
  Parable's theology guardrail comes from the frontend; reshape does not import it.

- VERIFIED: npm run build clean (3953 modules); ASCII scan clean on all touched files;
  Lynn approved on localhost:8080 (selector + doctrinally consistent generation).

- DEPLOYED: commit 6a901d3 (7 files: contracts.ts + theologyProfiles.ts + comparisonConfig.ts
  + PreferencesLens.tsx + CLAUDE.md + _shared/contracts.ts + _shared/theologyProfiles.ts).
  Working tree was clean (no DIAGNOSE_*.sql drift), so deploy.ps1 used directly.

- CARRY-FORWARD: none. GARBC is fully wired and live.


## JUNE 10, 2026 SESSION (public /compare "BLS vs. The Competition" page from imported package)

- GOAL: Build a public, unauthenticated /compare page from an external prototype export
  (_import/comparison/: comparison-data.json [canonical], comparison-data.ts [broken enum,
  discarded], index.html [prototype], ASSETS.md, SOURCES.md). Strict BLS branding; no
  prototype palette. Plan-first, approved before any code.

- HAZARD RESOLUTIONS:
  * ASCII guard scope: the guard is the git pre-commit hook (.git/hooks/pre-commit), which
    scans ONLY staged .ts/.tsx files (excluding node_modules/dist/.netlify). It does NOT scan
    .md/.json/.html/.css. New .ts/.tsx files made ASCII-only; SOURCES.md ASCII-converted on
    relocation anyway (good hygiene; repo is public).
  * _import/ added to .gitignore -- never commits, prototype index.html never ships.
  * Route placement: /compare registered OUTSIDE ProtectedRoute, mirroring /curriculum-evaluation
    (App.tsx). NOTE: App.tsx uses STATIC imports, not React.lazy (no lazy-loading anywhere);
    mirrored the actual static pattern.
  * Pricing SSOT: all imported BLS price/limit figures verified against pricingConfig.ts /
    trialConfig.ts and MATCH. pricingBadge + footer.pricingNote are BUILT from PRICING_DISPLAY
    and TRIAL_CONFIG constants (not hardcoded), so the page cannot drift from the pricing page.
    Per Lynn's request, free-tier wording uses the precise SSOT (TRIAL_CONFIG: 3 full + 2 short
    lessons every 30 days), not the simplified "5 lessons/month."
  * Page chrome: Header + Footer from @/components/layout (the toolbelt public-page pattern).

- COPY: the imported strengthParagraphs read as disparaging in places ("as an afterthought,"
  "locks...rigid," "rather than Nashville's," "near-complete absence from the digital world").
  Per Lynn, ALL competitor prose was rewritten in BLS voice (warm, pastoral, factual; honoring
  each publisher and its teachers) while preserving every sourced claim. Lynn approved the copy.

- DETAIL VIEW: shadcn Dialog (most-used overlay in BLS; Radix gives focus-trap/Esc/aria-modal).
  Comparison table renders 3 states via lucide icons + sr-only text: Check/success (included),
  Minus/warning (partial), X/destructive (not included). BLS column always Check.

- FILES (NEW): src/config/comparisonConfig.ts (SSOT: pageConfig + 5 competitors + SEO + footer;
  imports PRICING_DISPLAY/TRIAL_CONFIG), src/pages/ComparePage.tsx (Header/Footer chrome, hero +
  pricing badge, card grid, Dialog head-to-head, accuracy + trademark footer, SEO useEffect
  mirroring ChurchPlantReport.tsx), docs/comparison-sources.md (relocated + ASCII-converted
  citation record).
  FILES (MODIFIED): src/constants/routes.ts (ROUTES.COMPARE = '/compare') + App.tsx (import +
  unwrapped Route) [Rule #3 both files]; .gitignore (_import/); supabase/functions/_shared/
  routes.ts (auto-synced via npm run sync-constants, Rule #23). No sitemap exists -- none to update.

- ACCESSIBILITY (Rule #22): cards are native <button>s (focusable, aria-label), decorative icons
  aria-hidden with sr-only state text, table uses th scope + caption, Radix Dialog handles
  focus/keyboard. Heading hierarchy h1 -> h2 -> h3 logical.

- VERIFIED: npm run build clean (3953 modules); sync-constants 15/15; ASCII guard pre-checked
  clean on all staged .ts/.tsx; _import/ confirmed gitignored; Lynn approved on localhost.

- DEPLOYED: <fill commit on deploy.ps1; 7 files: config + page + docs + routes.ts + App.tsx +
  .gitignore + _shared/routes.ts mirror>

- LESSON: external import packages -> gitignore the whole import dir (keeps non-ASCII .ts out of
  the guard's path AND prototype HTML out of the build); relocate only ASCII-converted docs.
  When marketing copy makes claims about real third parties, route it through the BLS VOICE
  STANDARD and get owner sign-off before it ships.

## JUNE 10, 2026 SESSION (tenant_config 406 on public /auth -- anon RLS read regression)

- SYMPTOM: GET /rest/v1/tenant_config?select=*&tenant_id=eq.biblelessonspark returned
  406 Not Acceptable on the public /auth page BEFORE sign-in (anon role). Console showed
  an "Error fetching settings" line near useSystemSettings.ts:30.

- DIAGNOSIS (root cause first, no code touched until confirmed):
  * The prompt pointed at useSystemSettings.ts, but that file queries the system_settings
    table and uses NO .single() -- it was a red herring. The real tenant_config caller is
    src/lib/tenant/getTenantConfig.ts (used by main.tsx bootstrap on EVERY page load,
    pre-render, as anon). It used .single(), which makes PostgREST return 406 when the
    query yields zero rows. (useTenantConfig.ts already used .maybeSingle().)
  * Suspect "rebrand data mismatch" RULED OUT: the single tenant_config row already carries
    tenant_id='biblelessonspark' (matches frontend SSOT DEFAULT_TENANT_ID). SQL confirmed.
  * Suspect "RLS role-scope" CONFIRMED via pg_policies: the only SELECT policy
    tenant_config_read was scoped {authenticated}, with NO anon SELECT policy. RLS enabled.
    So anon matched no policy -> zero visible rows -> .single() -> 406. Table-level grants
    showed anon HELD SELECT (and full default set), so it was purely the RLS scope, not a
    grant gap. No migration touches tenant_config (created via Dashboard pre-Rule-#20), so
    the {public}->{authenticated} scope was set out-of-band.
  * SECURITY GATE cleared: audited all 64 columns -- pure branding / UI copy / feature flags /
    public contact emails. No secrets/keys. Re-opening anon READ undoes no real security gain.

- FIX (DB): migration 20260610120000_tenant_config_anon_read.sql -- DROP+CREATE
  tenant_config_read FOR SELECT TO anon, authenticated USING (true). Writes stay admin-only
  via tenant_config_admin_write (untouched). Applied to remote via db push.

- FIX (frontend hardening): src/lib/tenant/getTenantConfig.ts line 44 .single() -> .maybeSingle().
  The existing if (error || !data) branch already falls back to DEFAULT_TENANT_CONFIG, so zero
  rows now degrades gracefully (no 406) even if RLS regresses again. Defense-in-depth.

- FOLLOW-UP (DB, Section-F-style, Lynn pre-approved): migration
  20260610130000_tenant_config_anon_select_only.sql -- REVOKE INSERT,UPDATE,DELETE,TRUNCATE,
  REFERENCES,TRIGGER ON tenant_config FROM anon; GRANT SELECT ON tenant_config TO anon.
  RLS already blocked anon writes; this drops the overbroad grants to SELECT-only (the one
  privilege the public bootstrap needs). authenticated grants untouched. Applied via db push.

- SSOT: DEFAULT_TENANT_ID = "biblelessonspark" (src/config/tenantConfig.ts:185) unchanged;
  the DB row already agreed with it, so nothing in SSOT moved.

- VERIFIED: npm run build clean; both migrations applied (db push); Lynn confirmed on
  localhost /auth -- 406 gone, branding loads.

- DEPLOYED: commit c316d9f on main (deploy.ps1; 4 files: two migrations + getTenantConfig.ts +
  this file; ASCII guard passed). Both migrations were already applied to remote via db push
  before the deploy, so production /auth was fixed at db-push time; the deploy shipped the
  frontend .maybeSingle() hardening + committed the migration files and this log.

- LESSON: a .single() on any anon-reachable bootstrap query is a 406 landmine -- one missing/
  invisible row throws on every public page load. Prefer .maybeSingle() with a safe default for
  app-config reads. And tenant_config remains OUTSIDE migration history except for these two
  files; future changes to it must go through migrations (Rule #20).

## WHAT'S NEXT

Carry-forward from June 6, 2026 Session ("Error loading lessons" toast -- ROOT CAUSE was a same-day grant regression, now fixed):

- SYMPTOM: authenticated users (incl. zero-lesson users) saw a red "Error loading lessons /
  Failed to load your lessons" toast; lessons did not load.

- DIAGNOSIS: NOT a zero-row issue. The useLessons fetch was throwing a real Supabase error:
  "permission denied for table user_roles" (SQLSTATE 42501). Root cause = THIS MORNING's
  Section F grants migration (20260605100000, commit ed1a230) which did
  REVOKE ALL ON public.user_roles FROM anon, authenticated. That migration's premise
  ("user_roles is read only via SECURITY DEFINER helpers") was WRONG: several RLS policies
  read user_roles via an INLINE subquery -- e.g. lessons "Admins can view all lessons" and
  profiles "Admins can view all profiles": EXISTS (SELECT 1 FROM user_roles WHERE
  user_id=auth.uid() AND role='admin'). Inline RLS subqueries run with the CALLER's
  privileges, so revoking authenticated's SELECT made every authenticated lessons/profiles
  query fail. Audit also found two direct frontend reads broken by the same migration:
  Admin.tsx (.from('user_roles')) and ParableGenerator.tsx (.from('modern_parables'),
  monthly usage count). user_roles + modern_parables were the ONLY two revoked tables
  reachable by inline RLS subqueries or frontend queries (verified by policy-text audit +
  frontend grep); the other 11 Section F revokes are safe and left in place.

- FIX (DB): migration 20260606120000_restore_grants_broken_by_section_f.sql --
  GRANT SELECT ON public.user_roles TO authenticated; GRANT SELECT ON public.modern_parables
  TO authenticated. Applied to remote via db push, then committed. RLS still row-filters both
  (user_roles: users_select_own + admin_full_access; modern_parables: own-rows + has_role()
  admin), so SELECT exposes only the caller's own rows -- no enumeration. anon stays revoked
  (preserves the original anti-enumeration intent); INSERT/UPDATE/DELETE stay revoked from
  authenticated. Verified grants restored (authenticated SELECT on both; anon absent).

- FIX (frontend polish, same commit): moved LessonLibrary empty-state copy + the lesson-fetch
  error toast strings into SSOT (dashboardConfig.ts LESSON_LIBRARY_TEXT); updated the default
  empty-state wording to "Your Lesson Library is Empty" / "Build your first lesson using Step 1
  above."; added a silent one-time retry (600ms) in useLessons.fetchLessons before the error
  toast (genuine persistent errors still toast; zero rows never did). A temporary on-screen
  DIAG toast was used to capture the 42501 error from Lynn, then removed before deploy.

- DEPLOYED: commit 1755e1f on main (deploy.ps1; 4 files: the migration + dashboardConfig.ts +
  useLessons.tsx + LessonLibrary.tsx). npm run build clean; ASCII guard passed. Lynn confirmed
  on localhost: with-lessons users load normally; zero-lesson users sign in cleanly with NO
  error toast (acceptable). Production outage resolved at db push (before the Netlify deploy).

- LESSON (important): before REVOKING table grants for "defense in depth," audit RLS policies
  across ALL tables for INLINE subqueries referencing that table (qual/with_check ~ tablename).
  Inline RLS subqueries execute with the caller's privileges and REQUIRE the table grant --
  unlike SECURITY DEFINER helpers (has_role/is_admin) which bypass grants. The Section F
  classification missed this for user_roles. Possible future hardening: rewrite the inline
  "Admins can view all X" policies to use has_role()/is_admin() so user_roles can be re-locked.

Carry-forward from June 6, 2026 Session (public Toolbelt routes wired into App.tsx):

- CONTEXT: The public Teacher Toolbelt landing + three reflection tools existed as components
  (src/pages/toolbelt/) but were unrouted in App.tsx -- only /toolbelt/parables and the admin
  /admin/toolbelt were wired. This closes the "ENTIRE public toolbelt is still unrouted"
  carry-forward noted in the 2026-06-03 parable session.

- DONE: FEATURE -- commit `badafdf` on main (deploy.ps1; 3 files changed, 18 insertions;
  ASCII guard passed). Wired all FOUR remaining public routes:
  - ROUTES.TOOLBELT '/toolbelt' -> ToolbeltLanding (src/pages/toolbelt/ToolbeltLanding.tsx)
  - ROUTES.TOOLBELT_LESSON_FIT '/toolbelt/lesson-fit' -> ToolbeltLessonFit
  - ROUTES.TOOLBELT_LEFT_OUT_SAFELY '/toolbelt/left-out-safely' -> ToolbeltLeftOut
  - ROUTES.TOOLBELT_ONE_TRUTH '/toolbelt/one-truth' -> ToolbeltOneTruth
  All mounted as PUBLIC routes (no ProtectedRoute), immediately after TOOLBELT_PARABLES.
  ROUTES SKIPPED: none -- all four component files exist on disk (verified before wiring).

- FILES CHANGED (3): src/constants/routes.ts (4 new ROUTES keys after TOOLBELT_PARABLES);
  src/App.tsx (4 default-import lines after ToolbeltParables import + 4 public <Route>s);
  supabase/functions/_shared/routes.ts (auto-synced via `npm run sync-constants`, Rule #23 --
  only this _shared file changed, +4 lines, NOT hand-edited).

- SSOT NOTE: path strings are intentionally declared in BOTH routes.ts (ROUTES -- the routing
  SSOT master mounted by App.tsx per Rule #3) AND toolbeltConfig.ts (TOOLBELT_ROUTES /
  TOOLBELT_TOOLS[].route -- used by the toolbelt components for internal Link navigation).
  Values were verified to match EXACTLY, so the landing page "Use this tool" links resolve to
  the newly-wired routes. This dual-declaration is the pre-existing toolbelt pattern (parables
  already followed it), not a regression introduced here. Possible future consolidation:
  have toolbeltConfig import from routes.ts -- deferred, not in scope.

- VERIFIED: npm run build clean; routes.ts + App.tsx 0 non-ASCII bytes; Lynn confirmed all
  four routes + the /toolbelt/parables regression on localhost:8080 before approving deploy.
  No backend changes (public static routes).

Carry-forward from June 6, 2026 Session (Rule #17 violation closed -- check_lesson_limit no longer queries tier_config):

- CONTEXT: The `check_lesson_limit` RPC (live-DB only, never in a migration file until now)
  queried the `tier_config` table in FOUR places -- a direct violation of Rule #17 / Principle
  #2 (Frontend-Drives-Backend). DONE: replaced every tier_config read with hardcoded constants
  mirroring `_shared/pricingConfig.ts`.

- DONE: migration `20260606000000_fix_check_lesson_limit_no_tier_config.sql`, commit `c117aff`
  on main, applied via `"y" | npx supabase db push --linked`. CREATE OR REPLACE; signature +
  9-field return shape (can_generate, lessons_used, lessons_limit, tier, sections_allowed,
  includes_teaser, reset_date, upgrade_needed, billing_interval) preserved byte-identical;
  admin-bypass + free-tier fallback + all gating comparisons unchanged. Only the DATA SOURCE
  changed: lessons_limit (admin 9999, free 5), sections_allowed (free [1,5,8], all others
  [1-8]), includes_teaser (free FALSE, all others TRUE), reset interval (now INTERVAL '30 days'
  everywhere, was tier_config.reset_interval/'1 month' -- consistent with the 2026-06-05
  stripe-webhook reset_date fix).

- DIAGNOSTIC GROUND TRUTH: live tier_config had only 3 rows (admin/free/personal) -- the
  hardcoded admin 9999 + sections + teaser values were copied from those rows; the other tiers
  (starter/growth/full/enterprise) sourced from pricingConfig TIER_LESSON_LIMITS/TIER_SECTIONS.
  src vs _shared pricingConfig: TIER_LESSON_LIMITS and TIER_SECTIONS byte-identical -- NO drift,
  so _shared/pricingConfig.ts was NOT modified. Live user_subscriptions has only free (30) +
  personal (3); no org-tier individuals exist, so the previously-NULL sections_allowed for
  those tiers was never exercised (org pools gate elsewhere). Callers verified: subscriptionCheck.ts
  wrapper (generate-lesson, reshape-lesson, send-lesson-email) + src/hooks/useSubscription.tsx
  (reads ALL 9 fields). No field removed/renamed -> no breaking change.

- VERIFIED: live function body now contains ZERO tier_config references (confirmed via
  pg_get_functiondef ILIKE -- false-positive comment refs were reworded and re-applied via
  `supabase migration repair --status reverted` + db push so the live body is truly clean).
  RPC smoke test (personal + free users) returned all 9 fields with correct values. npm run
  build clean. Only the migration file committed (manual git; DEPLOYMENT_PLAN.md not staged).

- RULE #17 / PRINCIPLE #2 VIOLATION CLOSED. NOTE for follow-up: tier_config table still exists
  in the DB but is now queried by nothing in this RPC; its drop-vs-keep decision remains the
  open "tier_config table future" item (independent of this fix).

Carry-forward from June 6, 2026 Session (Security Advisor follow-up -- item A applied; B and C deferred):

- CONTEXT: Follow-up to the May 31 Migrations 1-3 (body hardening, EXECUTE revoke,
  RLS cleanup -- timestamps 20260531120000/120100/120200, confirmed applied + in sync
  local=remote). The May 31 DEPLOYMENT_PLAN.md (gitignored, never committed) listed THREE
  remaining items in its OUT OF SCOPE table: (A) Section F data-API grant hardening,
  (B) `{public}`->`{authenticated}` role-scope sweep on ~50 policies, (C) backfilling
  ~48 Dashboard-created functions into migration files.

- DISCREPANCY FLAGGED: the session prompt assumed exact SQL for A/B/C lived in
  DEPLOYMENT_PLAN.md. It does not -- the plan deliberately deferred all three. Only item A
  had ready SQL (in SECURITY_ADVISOR_CLASSIFICATION.md lines 170-226). B has no enumerated
  SQL (Finding 6 gives examples only); C has no SQL (needs pg_get_functiondef bodies).
  Lynn chose "A only. Proceed."

- DONE: ITEM A -- new migration `20260605100000_security_section_f_grants.sql` (commit
  ed1a230). Revokes the overbroad Supabase-default anon/authenticated table grants as
  defense-in-depth (RLS already protects rows). Drift check before apply: ZERO drift -- all
  23 targeted tables still held the full default grant set
  (DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE) for both anon and authenticated.
  Post-apply verification confirmed exactly the intended end state:
  - anon removed from ALL 23 tables;
  - 13 tables fully revoked (both roles): anonymous_parable_usage, email_sequence_tracking,
    lesson_pack_config, modern_parables, onboarding_config, org_lesson_pack_purchases,
    org_onboarding_purchases, reshape_metrics, stripe_events, toolbelt_email_tracking,
    rate_limits, user_roles;
  - admin_audit fully revoked;
  - authenticated SELECT-only: app_settings, org_tier_config, guardrail_violations,
    guardrail_violation_summary;
  - anon-only revoke (authenticated full grants preserved): events, notifications,
    feedback_questions, generation_metrics, toolbelt_email_captures, toolbelt_email_templates.
  npm run build clean. Role names verified (anon/authenticated only). Only the migration
  file was staged/committed (manual git, NOT deploy.ps1 -- avoids staging untracked audit
  files and the gitignored DEPLOYMENT_PLAN.md). ASCII pre-commit hook passed.

- CONFLICT FOUND + RESOLVED: the Section F draft (written before Sections C/D) revoked anon
  on tables Section C later marked "Category 1 -- leave alone (public read/insert)":
  lesson_pack_config, onboarding_config, org_tier_config, toolbelt_email_captures,
  feedback_questions. Traced every anon-facing path in src/ and supabase/functions/: ALL run
  through service_role edge functions (purchase-lesson-pack, purchase-onboarding,
  send-toolbelt-reflection, generate-parable via supabaseAdmin) or a SECURITY DEFINER RPC
  (get_feedback_questions) -- all of which bypass RLS + table grants. So the revokes are safe;
  the anon grants/policies Section C wanted to preserve are unused belt-and-suspenders.

- OUTSTANDING (Lynn action): ANONYMOUS SMOKE TEST still pending. The grant change is LIVE in
  production. One residual risk could not be discharged by static analysis: the public
  toolbelt landing pages are NOT in this repo (only admin views are). If they insert into
  toolbelt_email_captures via the browser anon key instead of the send-toolbelt-reflection
  edge function, anon INSERT is now revoked and capture would break. Verify on the live site
  (anonymous browser): submit a real toolbelt email-capture form; load the public pricing and
  parable pages. Rollback if it fails: re-grant the affected privilege in a follow-up
  migration (e.g. `GRANT INSERT ON public.toolbelt_email_captures TO anon;`).

- DEFERRED (NOT closed): item B (policy role-scope sweep) -- 55 {public} policies enumerated
  live; ~10 MUST stay {public} (boot/pricing config + anon toolbelt insert), so it needs a
  hand-built include/exclude list, not a blind sweep; Section C files it Category 3, zero
  behavior change today. Item C (backfill ~55 routines) -- pure housekeeping, zero security
  value, highest risk (re-defining live functions); Section A files it out of scope. Both
  remain available for a future dedicated session.


Carry-forward from June 5, 2026 Session (theologyProfile field-injection audit across all generators -- NO FIX NEEDED):

- CONTEXT: Follow-up to the June 4 generate-lesson `.description -> .summary` fix (5f57292),
  which left OUTSTANDING the question of whether the SAME nonexistent-field-injection bug
  existed in the OTHER generators. Audited all three: generate-devotional, generate-parable,
  and reshape (actual file: `reshape-lesson` -- the prompt's `reshape/index.ts` path does
  not exist; flagged and audited the real file).

- SSOT ground truth: `TheologyProfile` (theologyProfiles.ts lines 31-46) declares 14 fields:
  id, name, shortName, displayOrder, isDefault, summary, filterContent, avoidTerminology,
  preferredTerminology, requiredTerminology, guardrails, securityDoctrine, tulipStance,
  badgeClass. There is NO `description` field; the one-line doctrinal summary is `summary`.

- FINDING: NO functional bug in any of the three. Every theologyProfile field reference maps
  to a real interface field:
  - generate-devotional: resolves a real TheologyProfile via getTheologyProfile() and uses
    only `.id` (578, 588, 720) and `.name` (617, 626); guardrails built through the SSOT
    `generateTheologicalGuardrails(theologyProfile.id)`. CLEAN.
  - generate-parable: injects only `.name` (808) and `.guardrails` (809-810) into the prompt
    -- both valid. CLEAN.
  - reshape-lesson: ZERO `theologyProfile.<field>` access; receives theology guardrails via
    lessonShapeProfiles.ts / assembleReshapePrompt (per scriptureIntegrityGuardrail.ts map),
    not direct field access. CLEAN.

- VESTIGIAL (not a bug, left as-is per Lynn): generate-parable declares a LOCAL payload type
  with a `description` key (line 42) and defaults it in ANONYMOUS_DEFAULTS (line 538). The
  frontend (ParableGenerator.tsx:357) packs the CORRECT SSOT value into it
  (`description: profile.summary`), so unlike generate-lesson the value is right, NOT
  "undefined". Critically the backend NEVER injects `description` into any prompt -- it is
  carried-but-unread dead data on both ends. Harmless. Optional cosmetic rename
  (`description -> summary`, FE lines 109+357 / BE lines 42+538) was offered and DECLINED.

- SSOT / FE-drives-BE: `_shared/theologyProfiles.ts` is byte-identical to
  `src/constants/theologyProfiles.ts` (Compare-Object minus the 6-line auto-gen header = 0
  differences). No drift, no `sync-constants` run needed.

- OUTCOME: No edits, no function deploys, no build. Decision: "Accept no fix needed." Only
  this PROJECT_MASTER.md update committed. Closes the June 4 OUTSTANDING grep-the-other-
  generators carry-forward.

Carry-forward from June 5, 2026 Session (frozen reset_date on annual subscribers):

- CONTEXT (diagnostic, prior session): The dashboard "Lesson Usage" card showed
  "Resets Dec 29" for an annual personal subscriber and never advanced. Root cause:
  the card renders `user_subscriptions.reset_date` (returned by the `check_lesson_limit`
  RPC, which lives only in the live DB -- not in any migration). `check_lesson_limit`
  self-advances reset_date ONLY when `reset_date < NOW()`. For the annual subscriber
  `13afe118-...`, reset_date had been seeded to the Stripe ANNUAL billing boundary
  (2026-12-30 00:00:00Z) -- a year out -- so the monthly self-heal branch never fired,
  and the Stripe webhook never wrote reset_date at all. The displayed "Dec 29" (vs the
  stored Dec 30) is purely a UTC-midnight -> US-local timezone shift in
  `UsageDisplay.tsx` `toLocaleDateString` (cosmetic, not a bug).

- DONE: FIX (PART 1) -- `stripe-webhook/index.ts`: added
  `reset_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()` to all FOUR
  `user_subscriptions` write sites that set period/lesson columns, so reset_date now rolls
  30 days forward on create AND renewal (and check_lesson_limit advances it monthly
  thereafter): (1) bundled-personal upsert in handleSelfServiceOrgCheckout; (2) the
  cancellation->free update in handleSubscriptionCanceled; (3) the renewal lessons_used=0
  update in handlePaymentSucceeded; (4) the main create/update upsert in
  updateUserSubscription. The payment_failed update sets only `status`, so it was left
  untouched (no period/lesson columns -> outside the fix criteria).
  `current_period_start`/`current_period_end` were NOT changed -- they correctly track
  the Stripe billing period. `org-stripe-webhook/index.ts` was READ and deliberately NOT
  changed: it writes to the `organizations` table (org pools use `lessons_used_this_period`
  reset on `invoice.paid`), never to `user_subscriptions`, and has no `reset_date` column
  -- so the same pattern does not exist there. stripe-webhook deployed via
  `npx supabase functions deploy stripe-webhook`.

- DONE: FIX (PART 2) -- migration `20260605000000_fix_annual_subscriber_reset_dates.sql`
  un-froze existing annual rows: `UPDATE user_subscriptions SET reset_date = NOW() +
  INTERVAL '30 days', lessons_used = 0 WHERE billing_interval = 'year' AND reset_date >
  NOW() + INTERVAL '30 days'`. Applied via `npx supabase db push --linked` (verified in
  `migration list`). Effect was surgical: only `13afe118-...` matched (reset_date
  2026-12-30 -> 2026-07-05, ~30 days out; lessons_used 6 -> 0). The other two annual subs
  (reset_date already 11 and 17 days out) were correctly skipped, preserving one's
  lessons_used=8.

- NOTE: This addresses the DISPLAY/paid-tier reset_date system only. Free-tier real gating
  still runs off `profiles.trial_period_start` + `getTrialStatus` (rolling-30-from-first-
  full-lesson) -- a separate system from `user_subscriptions.reset_date`. Also still open
  from the diagnostic: `check_lesson_limit` queries the `tier_config` table (a Rule #17 /
  Principle #2 concern), and 17 of 25 active FREE rows carry past-due reset_date values
  that only self-heal on their next `check_lesson_limit` call. Neither was in scope here.


Carry-forward from June 4, 2026 Session (generate-lesson theologyProfile.description -> .summary fix):

- DONE: FIX `5f57292` -- generate-lesson was injecting `${theologyProfile.description}` into the
  system prompt (line 673, directly under the "THEOLOGY PROFILE: {name}" header). `description`
  is NOT a field on the `TheologyProfile` interface, so it rendered the literal string `undefined`
  into the prompt for ALL 11 profiles. Replaced the single token with `${theologyProfile.summary}`
  -- the user-facing one-line doctrinal summary, populated on all 11 profiles including CBF.
  Chosen over `filterContent` because the very next line (675) already injects `filterContent`
  verbatim via `generateTheologicalGuardrails(theologyProfile.id)`, so `summary` is the correct
  non-redundant fit for that header slot. Single-token Edit; surrounding code untouched.
  ASCII-clean (verified byte-level: 0 non-ASCII in 51288 bytes). Deployed via
  `npx supabase functions deploy generate-lesson --use-api`. Committed scope-narrow (that one
  file only; deploy.ps1's `git add .` bypassed with manual `git add`).
  DIAGNOSTIC NOTES: (1) The `TheologyProfile` interface is owned by `theologyProfiles.ts`
  (lines 31-46), NOT `contracts.ts` -- contracts.ts intentionally defines only the
  `TheologyProfileId` union type. (2) `description` appears nowhere else in generate-lesson re:
  theology (the other `.description` at line ~882 is an unrelated guardrail-violation object).
  (3) `_shared/contracts.ts` is byte-identical to `src/constants/contracts.ts` (auto-generated);
  `_shared/theologyProfiles.ts` mirror carries `summary` on all 11 profiles -- no drift.

- OUTSTANDING: none for this task. NOTE: the same `theologyProfile.description` bug pattern was
  NOT audited in the OTHER generators (generate-devotional, generate-parable, reshape). If any
  of them reference a nonexistent profile field, it would silently inject `undefined` the same
  way -- worth a grep (`theologyProfile\.|profile\.description`) across `supabase/functions/`
  in a future session.

Carry-forward from June 3, 2026 Session (Rule 5 SSOT; Security Advisor Migrations 2-3 + forensic clearance; parable cap fix, UI wiring, and admin-cap fix):

- DONE: SSOT `8b7f18b` -- added the "Rule 5" scripture-integrity guardrail (instructs the
  model to distinguish what Scripture states explicitly from inference / tradition /
  scholarly interpretation) to ALL content generators from a SINGLE source. New file
  `src/constants/scriptureIntegrityGuardrail.ts`, registered in scripts/sync-constants.cjs
  FILES_TO_SYNC (now 15 files; CLAUDE.md Rule #23 updated) so it auto-mirrors to `_shared/`.
  generate-lesson, generate-devotional, generate-parable import the constant; reshape gets
  it via the frontend RESHAPE_UNIVERSAL_GUARDRAIL in lessonShapeProfiles.ts (frontend drives
  backend). Also sanitized pre-existing legacy non-ASCII (em dashes + corrupted bytes) in
  generate-devotional, generate-parable, and _shared/lessonShapeProfiles to pass the ASCII
  guard. Deployed generate-lesson, generate-devotional, generate-parable.

- DONE: SECURITY `f2973cf` (Migration 2) + `7b82b59` (Migration 3) -- continued the Supabase
  Security Advisor remediation (Migration 1 shipped 2026-05-31 as `de4033f`). Migration 2
  revokes the over-broad anon/PUBLIC EXECUTE grants on SECURITY DEFINER functions -- with
  explicit service_role grants added first, because the original draft would have broken
  edge functions that call usage RPCs as service_role. Migration 3 drops no-op service_role
  RLS policies and closes real anon-readable policy exposures; a pre-apply drift check caught
  two policies the 2026-05-31 draft missed. Both applied via `npx supabase db push --linked`
  and verified by re-querying live grants/policies. A DB-state forensic sweep found NO
  evidence the pre-fix exposure was ever exploited. (db push prompts interactively; answer
  with `"y" | npx supabase db push --linked`.)

- DONE: DOCS `3786c27` -- committed CLAUDE.md Rule #25 (the 18 hardcoded-admin-UUID RLS
  `admin_full_access` policies are intentionally retained until a 2nd admin is added) plus
  the Rule #23 sync-list update.

- DONE: FIX `69ad40d` -- the parable 7/month cap was fully broken for authenticated users.
  generate-parable gated usage against `user_parable_usage`, which is an aggregating VIEW
  (over `parable_usage`), NOT a writable table -- so its select/upsert/update threw and the
  whole authenticated flow failed (admin bypass + anonymous 3/day were unaffected). Rewrote
  checkAuthenticatedLimit() + the response query to count the user's own `modern_parables`
  rows for the current month (.gte created_at, first-of-month-UTC). The parable save IS the
  increment; monthly reset is implicit in the date filter; 7/month preserved (env
  PARABLE_MONTHLY_LIMIT). Edge function deployed.

- DONE: gitignored the security-audit working docs (DIAGNOSE_*, SECURITY_ADVISOR_*,
  DEPLOYMENT_PLAN.md, DRAFT_MIGRATION_*). The repo is PUBLIC, so they were never committed
  (they contain exposure analysis + the admin UUID); gitignoring also stops deploy.ps1's
  `git add .` from ever sweeping them in. The files remain locally for reference / re-running.

- DONE: REFACTOR `4406070` -- dropped the dead `increment_parable_usage(uuid)` RPC (migration
  20260603140000). It inserted into the non-writable `user_parable_usage` VIEW and had always
  errored; no active code called it.

- DONE: FEATURE `4b84c2d` -- wired the Modern Parable generator to a single PUBLIC route
  `/toolbelt/parables` (new page `src/pages/toolbelt/ToolbeltParables.tsx` renders
  `<ParableGenerator context="standalone" />`). Kept `src/components/ParableGenerator.tsx`
  (fixed an undefined DEFAULT_THEOLOGY_PROFILE_ID reference), deleted the inferior duplicate
  `src/constants/ParableGenerator.tsx`, added ROUTES.TOOLBELT_PARABLES (routes.ts + synced
  _shared). The component handles anonymous (3/day) vs authenticated (7/month) internally.
  NOTE: `user_parable_usage` is a VIEW over `parable_usage`, not a table; `modern_parables` is
  the per-parable source of truth.

- DONE: FIX `8a1256e` -- (1) the admin parable-cap bypass was broken: generate-parable checked
  `user.app_metadata.role`, which this platform does NOT populate, so admins were capped at
  7/month. Fixed to the platform-standard `user_roles` role='admin' check (matching
  generate-lesson:314-321). (2) Added the same defensive user_roles admin bypass to
  generate-devotional (it relied solely on the check_devotional_limit RPC). (3) Added a
  paid_only "Parable Generator" sidebar item (Build & Prepare -> /toolbelt/parables) with
  Copy-Governance lockedCopy. generate-parable + generate-devotional redeployed.
  LESSON: edge-function admin checks MUST query `user_roles` (role='admin'), NOT
  `user.app_metadata.role`, which is not populated on this platform.

OUTSTANDING (carry-forward):
- The rest of the PUBLIC TOOLBELT is still unrouted in App.tsx (only ROUTES.ADMIN_TOOLBELT is
  registered). The landing `/toolbelt` + the 3 existing tools (lesson-fit, left-out-safely,
  one-truth) exist as components but hit the 404 catch-all. Lynn chose to wire ONLY the parable
  route this session. Wire the rest if/when the toolbelt is meant to go live.
- The parable page (`ToolbeltParables.tsx`) uses the public site Header/Footer, NOT the
  dashboard AppShell -- a signed-in user clicking the sidebar link lands on public-styled
  chrome. Works fine; make it shell-aware later if a fully in-app feel is wanted.
- `check_devotional_limit` RPC admin handling was never confirmed (dashboard-created; body
  unread). A defensive edge-level admin bypass now covers admins regardless; confirm the RPC
  body if the devotional cap is revisited.
- Security Advisor follow-ups (deferred; see the local, gitignored DEPLOYMENT_PLAN.md): the
  section-F table/column grant-revoke migration; the `{public}` -> `{authenticated}` role-scope
  sweep on ~50 policies; backfilling Dashboard-created functions into migration files.

Carry-forward from May 27 Session F (Impersonate "open in new tab" popup-blocker fix):
- DONE this session: FIX `954eb30` -- the admin Impersonate button opened its new
  tab AFTER an `await`, so browsers blocked the popup. `handleImpersonate` in
  `src/components/admin/UserManagement.tsx` now opens the `_blank` tab
  synchronously inside the click handler (before the async `admin-impersonate-user`
  invoke), then sets `newTab.location.href` once the URL resolves; shows a "Popup
  Blocked" toast if the synchronous open is refused, and closes the blank tab on
  error. Frontend only; `npm run build` clean; verified on localhost before deploy.
  (Chronologically this preceded the Session E send-lesson-email work -- commit
  `954eb30` is before `0b24b97`; it is labeled F only because E was logged first.)
- NOTHING OUTSTANDING.

Carry-forward from May 27 Session E (send-lesson-email admin tier-resolution fix + ASCII sanitization):
- DONE this session: FIX `0b24b97` -- `send-lesson-email` now resolves the
  subscriber tier via the canonical `check_lesson_limit` RPC
  (`_shared/subscriptionCheck.ts`) instead of a bespoke raw
  `user_subscriptions.tier` query. The old query ignored the admin role and
  treated a missing row as `free`, so admins were blocked with 403 "Email
  delivery requires a paid subscription" on EVERY send (roster + individual).
  Now matches the frontend `useSubscription` path. Edge Function only; deployed
  via the Management API and verified by a real send before commit.
- ALSO in this commit: sanitized pre-existing non-ASCII in the file to pass the
  ASCII guard -- comment glyphs to ASCII; three FUNCTIONAL chars to
  behavior-identical JS unicode escapes (header star U+2726, footer copyright
  U+00A9, and the en/em dashes U+2013/U+2014 in the `isStudentHandoutHeading`
  regex character class). The live function (deployed with literal glyphs) is
  behaviorally identical to the committed source, so NO redeploy was needed.
- WATCH (not outstanding for this task): other Edge Functions may still gate on a
  raw `user_subscriptions.tier` query (same admin-blind bug). A grep for
  `.from("user_subscriptions")` across `supabase/functions/` would surface any
  others; not audited this session (Lynn declined `/audit-ssot` for now).

Carry-forward from May 27 Session D (One-time SQL backfill of inline color/background in blog_posts):
- DONE this session: a one-time, data-only `UPDATE` in the Supabase Dashboard SQL
  editor stripped `color` / `background` declarations from the stored `content`
  of all existing `blog_posts` rows (4 affected). Existing posts now match the
  Session C `sanitizeInlineStyles()` ingest output byte-for-byte. No code,
  schema, migration, or deploy -- pure data backfill. Closes the backfill item
  deferred in the Session C carry-forward below.
- NOTHING OUTSTANDING from this task. If a future Tertius callout introduces a
  NEW hardcoded color/background pattern not covered by the current `STRIP_PROPS`
  set in `sanitizeInlineStyles`, the ingest sanitizer would need widening AND
  another backfill pass for any rows written before that change.

Carry-forward from May 27 Session C (Ingest-time HTML sanitization in create-blog-post):
- DONE this session: FIX `fc503ad` -- added `sanitizeInlineStyles(html)` to the
  `create-blog-post` Edge Function and composed it around the existing
  `stripLeadingFeaturedImage` in BOTH write paths (POST create + PUT update),
  immediately before insert/update. It strips ONLY `color`, `background`, and
  `background-color` declarations from inline `style="..."` attributes
  (preserving font-size/text-align/etc.) and drops the attribute entirely if it
  becomes empty. Pure string/regex transform (no DOM, Deno-safe). Deployed via
  `npx supabase functions deploy create-blog-post --use-api`. This closes the
  ingest-sanitization item deferred in Sessions A and B.
- SCOPE: applies to NEW posts and any post re-saved through PUT. Already-stored
  posts keep their inline colors until re-saved -- the Dark/Dim CSS overrides in
  `BlogPreviewPanel` (preview) and the published-page render still cover those.
  If Lynn wants existing posts cleaned proactively, a one-off backfill (GET each
  slug -> PUT the same content so the sanitizer re-runs, or a direct SQL/script
  pass) would do it. DONE in Session D (May 27) via a direct SQL backfill of all
  4 affected rows -- see the Session D block above; this item is now closed.
- DELIBERATELY NARROW per the task: only `color` / `background` /
  `background-color` are stripped. `background-image`, `border-color`, and other
  properties are preserved. If a future light-callout uses one of those, widen
  the `STRIP_PROPS` set in `sanitizeInlineStyles`.

Carry-forward from May 27 Session B (Blog editor: per-image replace/delete + image data-loss fix):
- DONE this session: (1) FIX `a75f94d` -- added `"image"` to the Quill
  `formats` whitelist in `BlogPreviewPanel.tsx` so inline `<img>` tags survive
  the edit round-trip (they were being stripped on load and destroyed on the
  next Save). (2) FEATURE `ecbfd79` -- an edit-mode "Images in this post" panel
  with per-image Replace (swap src) and Delete (removes the `<img>`, plus its
  wrapping `<p>` if the `<p>` holds only the image). Operates on
  `editForm.content` as an HTML string via DOMParser so wrapping markup is
  preserved; Save captures it through the normal flow.
- KNOWN LIMITATION (by design, Option A): the panel preserves whatever wrapper
  exists AT EDIT TIME, not necessarily Tertius's original. Content round-trips
  through Quill, which normalizes structure (e.g. a `<figure>` may already be a
  Quill block by the time the panel sees it). The remove-wrapping-`<p>` logic
  targets Quill's normalized output. If exact `<figure>` fidelity ever matters,
  the fix is server-side sanitization (see the still-open item below), not the
  panel.
- NO image INSERT control was added (intentional): images arrive via post
  content, not manual editor insertion. If Lynn ever wants admins to add new
  images in the editor, an image toolbar button + upload/URL handler is the
  next step.
- RESOLVED in Session C (`fc503ad`): sanitize/normalize inline color +
  background styles in the `create-blog-post` Edge Function so posts never carry
  hardcoded `style="background: #f5f5f5"` / `color: #2c5282`. Done at ingest via
  `sanitizeInlineStyles()` -- see the Session C block above.

Carry-forward from May 27 Session A (Blog/article body text legible in all four themes):
- RESOLVED this session (carried from May 13 Session 1, the "Quill blockquote
  color literal `#3D5C3D` -> CSS variable" item): in `BlogPreviewPanel.tsx` the
  Quill editor blockquote border `#3D5C3D` became `hsl(var(--primary))` and the
  blockquote text `#555` became `hsl(var(--muted-foreground))`. That carry-
  forward is now closed.
- OPTIONAL FOLLOW-UP (recommended, deferred): sanitize/normalize inline color +
  background styles in the `create-blog-post` Edge Function (or strip them on
  render) so posts never carry hardcoded `style="background: #f5f5f5"` /
  `color: #2c5282`. The shipped preview fix is a CSS-override block scoped to
  `.bls-blog-preview`, active in Dark/Dim only; it matches light-hex backgrounds
  beginning with `#f` plus the word `white`. A callout using `#eeeeee` or
  `rgb(...)` light gray would still slip through. Tertius authors the HTML
  externally, so the bulletproof fix belongs in the ingest/render path, not the
  content. Lynn deferred this; raise `/create-plan` if/when she wants it.
- The public trust page `WhyChurchesCanTrustBibleLessonSpark.tsx` is now theme-
  aware (was hardcoded `bg-white`/`text-slate-*`); its two callout boxes moved
  from forced light-blue (`bg-blue-50`) to themed `bg-muted`. This session only
  touched the files named in the task. `ChurchPlantReport.tsx`,
  `CurriculumEvaluationPage.tsx`, `LessonShapesGuide.tsx`, and
  `components/curriculum-eval/*` were checked and were ALREADY theme-aware (no
  change). Watch for any OTHER standalone marketing/legal pages still using
  hardcoded `bg-white`/`text-slate-*` if more are discovered later.

Carry-forward from May 26 Session A (Mobile sidebar touch-scroll regression fix):
- REAPPLIED: mobile sidebar touch scrolling. In
  src/components/layout/AppShell.tsx the nav wrapper div (inside the shared
  SidebarContent used by both the desktop <aside> and the mobile
  <SheetContent> drawer) was missing the `overflow-y-auto` class. The wrapper
  still carried `flex-1 min-h-0` and the inline
  `style={{ WebkitOverflowScrolling: 'touch' }}`, but with no `overflow-y-auto`
  there was no scroll container, so the inline touch-scroll style had nothing
  to act on and the nav clipped instead of scrolling on iPhone. Fix: added
  `overflow-y-auto` to that one wrapper div (line 147). Build clean; deployed
  in commit f02c90f. The <nav aria-label="Sidebar navigation"> and all
  locked-item a11y wiring (aria-disabled, aria-label, tabIndex, onKeyDown)
  were left untouched. No file in FILES_TO_SYNC was touched, so
  npm run sync-constants was not required.
- Regression source: the `overflow-y-auto` class had been dropped from the
  wrapper at some prior AppShell edit (commit trace not run this session).
  Watch for this on any future AppShell sidebar-layout change -- the inline
  WebkitOverflowScrolling touch-scroll style is inert without the
  `overflow-y-auto` class beside it.
- The two root-level diagnostic SQL files (DIAGNOSE_AUTH_FUNCTIONS.sql,
  DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql) are NO LONGER untracked: deploy.ps1's
  `git add .` swept them into commit f02c90f and Lynn chose to keep them
  committed. Prior carry-forward notes calling them "still deferred /
  untracked" are now obsolete.

Carry-forward from May 25 Session B (Lesson-pack purchase UI + SSOT consolidation):
- The individual / team-lead lesson-pack purchase is intentionally NOT
  built yet. It has zero backend: no one-time checkout Edge Function
  (`create-checkout-session` is subscription-mode only), no `lesson_pack`
  handling in the individual `stripe-webhook`, and no `bonus_lessons`
  plumbing in `check_lesson_limit` / `useSubscription`. Building it needs:
  (1) a one-time-payment checkout fn resolving price from
  `STRIPE_LESSON_PACKS` in `_shared`, (2) a `lesson_pack` branch in
  `stripe-webhook` crediting the individual's bonus lessons, and (3)
  bonus-lesson exposure in the individual subscription RPC + UI. The
  reusable `LessonPackPurchase` component (`src/components/subscription`)
  is already built and SSOT-sourced; wiring it into the Dashboard is the
  only frontend step once that backend lands. Deferred per Lynn (Option 1:
  no dead buttons, no payment risk this pass).
- The org lesson-pack checkout still resolves price from the
  `lesson_pack_config` DB table inside `purchase-lesson-pack` (Lynn's Q2
  choice: fix the frontend bug now, keep the DB lookup). For true
  frontend-drives-backend, rewire `purchase-lesson-pack` to resolve price
  from `STRIPE_LESSON_PACKS` (`_shared`) keyed by `pack_type`, then the
  `lesson_pack_config` table can be retired. Requires an Edge Function
  redeploy + Stripe test. Not urgent: the bridge works because the
  `pack_type` keys (small|medium|large) are shared across `LESSON_PACKS`,
  the DB table, and `STRIPE_LESSON_PACKS`.
- Verify on the LIVE site that clicking a pack in Org Manager > Lesson
  Pool initiates Stripe checkout end-to-end (proves the `pack_type` bridge
  between the frontend SSOT and the DB `lesson_pack_config` holds).
  Localhost dialog render was verified this session; full checkout needs
  an org with an active Stripe customer.
- The two root-level diagnostic SQL files remain untracked. Still deferred.

Carry-forward from May 25 Session A (Pricing SSOT lesson-pack fix + diagnostics):
- RESOLVED in Session B: the lesson-pack purchase UI was built and the two
  frontend constants consolidated. `LESSON_PACKS` (orgPricingConfig.ts) is
  now the single UI-consumed source (rendered via the new
  `LessonPackPurchase` component in the Org Manager lesson pool);
  `STRIPE_LESSON_PACKS` is annotated backend-only. The competing
  `lesson_pack_config` DB read was removed from `useOrgPoolStatus`. See
  the Session B carry-forward above for what remains (individual path).
- Backend mirror `_shared/pricingConfig.ts` carries stale UI-only fields
  the frontend has since changed: `PRICING_DISPLAY.personal.displayName`
  is 'Teacher Plan' (frontend: 'Personal Plan') plus an extra
  `upgradeButton` key; `UPGRADE_PROMPTS.featureTeaser` still holds the old
  transactional copy ("Unlock Complete Lessons"); header Last Updated is
  2026-03-02 (frontend 2026-03-24). NONE of these fields are imported by
  any Edge Function (verified), so runtime is unaffected -- but the file's
  own "DO NOT EDIT MIRROR DIRECTLY" banner is contradicted. Optional
  cleanup: align the three fields; the file is hand-maintained (Rule #24).
- The two root-level diagnostic SQL files (`DIAGNOSE_AUTH_FUNCTIONS.sql`,
  `DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql`) remain untracked. Same as every
  session since mid-May. Still deferred.

Carry-forward from May 20 Session A (Series publishing fixes):
- Now that series export and series-card count both include reshape
  rows (any `lessons` row with a non-null `series_id`), the card's
  "{completed} of {total} lessons" can exceed `total_lessons`. A
  4-lesson series with 4 originals plus 2 reshapes shows "6 of 4
  lessons". `total_lessons` is the planned series size; `completed`
  is now the live count of all rows in the series. Decision needed:
  filter the card count to exclude reshapes (`.is('shaped_content',
  null)`), keep the current behavior and accept the inflated count,
  or reframe what the count means.
- Dead-code cleanup in PublishingHub.tsx series-card `renderExtra`:
  with the status pill removed, `isComplete`, `isInProgress`,
  `statusLabel`, and `badgeClass` are unused. TypeScript does not
  flag. Remove if confidence is high that the status badge is gone
  for good.
- The two root-level diagnostic SQL files
  (`DIAGNOSE_AUTH_FUNCTIONS.sql`, `DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql`)
  remain untracked. Same as Sessions A-D May 18-19 and earlier
  sessions. Still deferred.

Carry-forward from May 19 Session D (LessonLibrary card-level a11y + SSOT constants):
- Optional: extract a shared `SeriesSelectorPopover` component used
  by both `LessonLibrary.tsx` (card-level) and `EnhanceLessonForm.tsx`
  (viewer-level). Both now carry identical full Rule #22 wiring
  (aria-expanded, aria-haspopup, role="menu", role="menuitem", Escape
  closes + returns focus, mousedown click-outside). Two callers still
  does not strictly require abstraction -- the simplify rule applies
  -- but a third caller would tip the scale. Originally raised as a
  Session C carry-forward; Session D made the drift risk concrete by
  duplicating the wiring across both surfaces verbatim.
- Operational note: a stale `npm run dev` process caused a "site can't
  be reached" symptom at localhost:8080 mid-session despite the
  production build being clean. Resolution was to start a fresh dev
  server. Add to the standard diagnostic sequence: before any code
  investigation for a localhost-unreachable report, restart
  `npm run dev` and re-probe. Browser cache + port still bound by a
  dying Node process is the recurrence pattern.

Carry-forward from May 19 Session C (Smart deletion + Add to Series in viewer):
- Optional: extract a shared `useAddLessonToSeries` hook. Today the
  handler logic is duplicated in `LessonLibrary.handleAddToSeries`
  (L402-442) and `EnhanceLessonForm.handleAddCurrentLessonToSeries`.
  Both follow identical structure: MAX-position query, +1, link, toast,
  refresh. Two callers does not yet justify abstraction -- revisit if
  a third surface ever needs the same flow. (A11y debt sub-item from
  this session's carry-forward closed in Session D commit `eacc9b3`.)

Carry-forward from May 19 Session B (Reshape UI cleanup + Lesson Library pagination):
- Verify anti-duplicate reshape by running two reshapes of the same
  shape on the same lesson on the live site once Anthropic API
  stabilizes. The anti-duplicate suffix is deployed but was not
  smoke-tested in Session A due to repeated 529 errors. The Session B
  duplicate-shape numbering ("Story-Driven 1", "Story-Driven 2") makes
  the verification self-evident at the parent card.
- Future-look: with the reshape-as-lesson foundation complete and the
  legacy toggle removed, decide whether shape exports (PDF/DOCX) should
  pull from a reshape child's `original_text` or continue reading the
  legacy `lesson.shaped_content ?? lesson.original_text` fallback.
  Pre-Session-A rows still have `shaped_content` on the parent and
  exports fall back to that today (`buildBookletPdf`, `buildSeriesPdf`,
  `buildSeriesDocx`, `buildHandoutBooklet`). Once those legacy rows are
  migrated or retired, the fallback can be cleaned out of the export
  utilities. Not urgent.

Carry-forward from May 18 Session A (Reshape-as-lesson foundation):
- Optional cleanup: the contracts.ts `Lesson` interface still has
  `theology_profile_id?: TheologyProfileId | null;` but the live
  `lessons` table does NOT have that column (confirmed by Lynn's
  live-schema paste during Session A). The field is dead. Removing it
  is non-blocking. Theology profile resolution already flows through
  `filters.theology_profile_id`.
- Optional cleanup: `src/constants/freshnessOptions.ts` had a bundler
  bug (re-export from `'./seriesConfig'` without `.ts`). Fixed in
  Session A so generate-lesson could redeploy. If any other constants
  files do bare relative re-exports they'd hit the same Deno bundler
  trip on deploy. A repo-wide audit would be defensive but not urgent.
- The two root-level diagnostic SQL files (`DIAGNOSE_AUTH_FUNCTIONS.sql`,
  `DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql`) remain untracked. Session A
  bypassed `deploy.ps1` and used manual `git add` of only the 14 task
  files. Session B did the same (manual `git add` of 4 task files plus
  PROJECT_MASTER.md). Still deferred.

Carry-forward from May 17 Session 2 (Admin delete for published blog posts):
- Marketing Panel "Amp Articles," "Newsletter," and "Email Marketing" tabs
  remain disabled. The published-posts management surface for Blog is now
  complete; the next Marketing channel to build out is Lynn's call.
- The two root-level diagnostic SQL files (`DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql`,
  `DIAGNOSE_AUTH_FUNCTIONS.sql`) are still untracked. Deploy this session was
  intentionally narrow-scoped (manual `git add` of only the two task files)
  to keep them out of the commit. Still deferred.

Carry-forward from May 17 Session 1 (Inline WYSIWYG lesson editing):
- Design the reshape-in-series feature. Today reshape stores `shaped_content`
  on the parent `lessons` row (not a separate row) and reshape does NOT
  charge against the user's monthly lesson count (`reshape-lesson` Edge
  Function writes only to `reshape_metrics`; only `generate-lesson` increments
  `subscription_lessons_used` / `trial_*_lessons_used`). Lynn flagged she
  thought reshape was billed -- worth deciding the billing rule first.
  Recommended approach: add a "Save Reshape as Lesson" button on the reshape
  view that promotes the shaped content to a first-class `lessons` row with
  optional `reshape_of` back-link. After promotion the new inline WYSIWYG
  editor and the existing "Add to Series" / export buttons work without any
  new code. Open question: keep the parent's `shaped_content` after promotion
  or clear it. Start the next session with `/create-plan` once Lynn has
  decided the billing rule.
- Optional cleanup: the auto-generated `src/integrations/supabase/types.ts`
  is missing `visibility`, `shaped_content`, `shape_id`, `theology_profile_id`
  columns that exist on the live `lessons` table. Not blocking, but
  regenerating via `npx supabase gen types typescript --linked > ...` would
  re-sync.
- Optional cleanup: the lessons CREATE TABLE statement is not present in
  `supabase/migrations/` (table predates the migration directory). If we
  ever need to recreate from migrations only, we'd be missing baseline.
  Could be addressed with a `00000000_baseline_lessons.sql` capture.

Carry-forward from May 15 Session 1 (Blog metadata + bot CRUD):
- Confirm Tertius is sending the metadata payload on POST and that GET/PUT
  flows work end-to-end. The Edge Function returns full post (with metadata)
  on success so Tertius can verify storage. If anything fails the response
  payload includes a specific 400-level error message.
- Optional: structured-fields metadata editor (per-section inputs instead
  of one JSON textarea) -- only if Lynn finds the JSON textarea cumbersome.
- The two root-level diagnostic SQL files (`DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql`,
  `DIAGNOSE_AUTH_FUNCTIONS.sql`) remain untracked. Still deferred.

Carry-forward from May 14 Session 1 (Unverified-signup duplicate fix):
- Decide whether the orphan cleanup should become a recurring job.
  Migration `20260514000001` is one-shot. A pg_cron weekly job or a
  scheduled Edge Function would prevent future accumulation if the
  guard in `handle_new_user()` is ever bypassed (e.g. by a future
  trigger or direct INSERT).

Carry-forward from May 13 Session 1 (Build Lesson sidebar fix):
- Build Amp Articles preview/approval workflow (currently disabled tab in
  Marketing Panel). Lynn already sends amps to Ampifire; in-app preview is
  the missing piece.
- Build Newsletter preview/approval workflow (disabled tab).
- Build Email Marketing composer/scheduler (disabled tab).
- Quill blockquote color literal (`#3D5C3D`) -> CSS variable from
  `BRANDING.colors` when blog styling is next revisited (carried from
  Session 2).
- Re-upload `PROJECT_MASTER.md` to the Claude.ai project after this commit
  lands so the next session has current context.

---

### May 27, 2026 -- Session F: Impersonate "open in new tab" popup-blocker fix

#### Summary

The admin Impersonate button's new tab was being blocked by the browser.
`handleImpersonate` (`src/components/admin/UserManagement.tsx`) called
`window.open(url, "_blank")` AFTER `await supabase.functions.invoke(
"admin-impersonate-user", ...)`, so it was no longer a direct user gesture and got
popup-blocked. One commit `954eb30`; frontend only. (Preceded the Session E work
chronologically; labeled F because E was logged first.)

#### Fix

- Open the `_blank` tab SYNCHRONOUSLY at the top of the handler (after the confirm,
  before any await): `const newTab = window.open('', '_blank')`.
- If blocked (`newTab` null), show a "Popup Blocked" toast and bail (no stuck
  loading state).
- After the async invoke resolves, navigate the existing tab:
  `newTab.location.href = data.url`. On error, `newTab.close()` then the existing
  failure toast.

#### Method / verification

- `npm run build` clean (3942 modules). Verified on localhost (port 8080,
  `/admin`) before deploy; deployed via `deploy.ps1` (commit `954eb30`, ASCII
  guard passed). The Impersonate button already met Rule #22 a11y (tabIndex,
  Enter/Space handler, aria-label, aria-hidden icons); the transient `disabled`
  attribute used during link generation was noted but left unchanged (out of
  scope for this fix).

---

### May 27, 2026 -- Session E: send-lesson-email admin tier-resolution fix + ASCII sanitization

#### Summary

"Send Lesson" email failed with "Send Failed -- Unable to send lesson" for both
roster and individual sends. Root cause: `send-lesson-email` gated delivery on a
raw `user_subscriptions.tier` query that ignored the admin role and treated a
missing row as `free`, returning 403 on every send for admins. Fixed by resolving
tier through the canonical `check_lesson_limit` RPC. One commit `0b24b97`; Edge
Function only.

#### Diagnosis (protocol-driven)

- The CLI command in the task prompt (`supabase functions logs ... --use-api`)
  does not exist in the installed CLI (stable channel has no `logs` subcommand).
  Flagged rather than fabricated (Rule #14). Got the definitive error from the
  browser Network response body instead: `{"error":"Email delivery requires a
  paid subscription"}` = the 403 branch (index.ts section 2).
- Confirmed the divergence: frontend `useSubscription` and
  `_shared/subscriptionCheck.ts` resolve tier via the `check_lesson_limit` RPC,
  which is admin-aware (the dialog opens because that RPC returns a non-free tier
  for admins). `send-lesson-email` alone rolled its own `user_subscriptions.tier`
  query with no admin handling and no missing-row handling -> 403. Verified the
  failure is NOT in the Resend loop (per-recipient failures return success:true,
  which the UI shows as "Lesson Sent!" with a failed count, not "Send Failed").

#### Changes (commit 0b24b97, +26/-25)

1. Added `import { checkLessonLimit } from "../_shared/subscriptionCheck.ts"`.
2. Replaced the section-2 raw query with
   `const { tier } = await checkLessonLimit(supabase, user.id);` ahead of the
   existing `if (tier === "free") return 403`.
3. ASCII-sanitized pre-existing non-ASCII that blocked the commit (unrelated
   debt): comment em-dashes/arrows/bullet to ASCII; functional chars to JS
   unicode escapes (star U+2726, copyright U+00A9, regex en/em dashes
   U+2013/U+2014).

#### Method / verification

- Deployed: `supabase functions deploy send-lesson-email --use-api` -> success
  (bundled `subscriptionCheck.ts` + `pricingConfig.ts`). Lynn verified a real
  send (single + roster) before commit.
- First sanitization pass corrupted the regex and missed two glyphs (hit the
  unicode-escape <-> literal normalization trap in the editing tools). Restored
  from git (Rule #13/#19) and redid it with escape strings built from character
  codes; full non-ASCII scan = 0; ASCII guard passed on commit.
- No `npm run build` (Edge Function only). No migration (Rule #20 = schema only).
  Not in FILES_TO_SYNC. No redeploy after the ASCII pass (escapes behaviorally
  identical to glyphs).

#### Carry-forward

- Other Edge Functions may share the admin-blind `user_subscriptions.tier`
  pattern; a grep for `.from("user_subscriptions")` under `supabase/functions/`
  would find them. Not audited this session.

---

### May 27, 2026 -- Session D: One-time SQL backfill of inline color/background styles in blog_posts

#### Summary

Closed the existing-posts backfill deferred in the Session C carry-forward. A
one-time, data-only `UPDATE` in the Supabase Dashboard SQL editor stripped the
hardcoded `color` / `background` declarations from the stored `content` of every
existing `blog_posts` row, so old posts now match what the Session C
`sanitizeInlineStyles()` ingest fix (`fc503ad`) produces for new posts. No
frontend, Edge Function, migration, or deployment -- data backfill only, per the
task. No repo code changed; the PROJECT_MASTER.md session log is the only file
edit.

#### Audit (Steps 1-2)

- 4 rows carried inline styles; all 4 also carried color/background
  (`rows_with_any_style` = `rows_with_color_or_bg` = 4). Affected slugs:
  `teaching-lesson-to-making-disciple`,
  `bivocational-pastor-aligned-bible-study-materials`,
  `last-minute-substitute-teacher-support`,
  `one-lesson-five-audiences-same-truth`.
- The `LEFT(content, 500)` preview did not reach any `style=` (styles live deeper
  in callout boxes), so an extraction query (`regexp_matches` on `style="..."`)
  was run to see the real strings before writing any regex (Rule #10). It showed
  exactly three distinct, double-quoted style strings, repeated 3x per post (12
  total), no single-quoted variants:
  1. `style="color: #2c5282; font-weight: 600;"`
  2. `style="margin-top: 0; color: #2c5282;"`
  3. `style="background: #f5f5f5; border-left: 4px solid #2c5282; padding: 1.5rem; margin: 2rem 0;"`

#### Decision: Option A (match the ingest sanitizer), literal `replace()`

- Chose Option A (strip only `color`/`background`, keep the rest) over Option B
  (strip the whole `style=` attribute). Option B would have deleted legitimate
  `font-weight`/`margin`/`border-left`/`padding` and left old posts inconsistent
  with how new posts are cleaned; Option A makes them byte-for-byte identical to
  `sanitizeInlineStyles()` output. Option B was also what the task's literal
  "zero rows with `style=`" implied -- flagged the conflict and corrected the
  Step 4 success test to "zero rows with a color/background property" instead.
- Used literal Postgres `replace()` of the three known strings rather than
  `regexp_replace`: with the exact strings known from the audit, literal replace
  is provably exact and avoids the regex trap where a naive `color:` pattern also
  matches the `color` inside `background-color:` (a hyphen is a word boundary).

#### Result / verification (Steps 3-4)

- Dry-run SELECT confirmed the three cleaned forms before committing:
  `style="font-weight: 600"`, `style="margin-top: 0"`,
  `style="border-left: 4px solid #2c5282; padding: 1.5rem; margin: 2rem 0"`.
- Ran the chained `replace()` `UPDATE ... WHERE content LIKE '%style=%'`.
- Verification: `rows_with_color_or_bg` went 4 -> `0`, re-confirmed by a second
  independent count query (also `0`) -- so all 4 affected rows were cleaned.
  `rows_with_any_style` stays at 4 by design (the preserved benign styles).
- The `#2c5282` inside `border-left` is intentionally kept: the sanitizer strips
  the color/background *properties*, not color *values* embedded in `border-left`
  (the deliberate narrow scope from Session C).

#### Method / notes

- Data backfill only, run in the Supabase Dashboard SQL editor. No migration file
  (Rule #20 governs schema changes, not data backfills). No `npm run build`, no
  deploy, no `_shared` sync (Rules #23/#24 not triggered). No source files
  changed.

---

### May 27, 2026 -- Session C: Ingest-time HTML sanitization in create-blog-post

#### Summary

Closed the ingest-sanitization follow-up deferred in Sessions A and B. Added a
`sanitizeInlineStyles()` pass to the `create-blog-post` Edge Function so incoming
blog HTML (from Tertius/OpenClaw) is cleaned of hardcoded color/background inline
styles before it is written to the DB -- the root-cause fix for the unreadable
Dark/Dim callout boxes. One file, one commit `fc503ad`; Edge Function only (no
frontend, schema, or dependency changes). Deployed to Supabase via the
Management API.

#### Diagnosis (Step 1)

- Content is received via `readPayload` -> `toStr(payload.content)` in both the
  POST (create) and PUT (update) paths.
- It is written at the POST insert (`insertRow.content`) and the PUT update
  (`updateRow.content`).
- `stripLeadingFeaturedImage` (already present) was the model: a pure string
  transform applied immediately before the write in both paths. The new
  sanitizer is composed around it at those same two call sites.

#### Changes (commit fc503ad, +35/-2)

1. New `sanitizeInlineStyles(html: string): string` -- regex-matches each
   ` style="..."` attribute (mandatory leading whitespace avoids matching
   substrings like `data-mystyle`), splits the body on `;`, drops only
   declarations whose property is `color` / `background` / `background-color`
   (exact, case-insensitive), preserves the rest, and removes the whole
   attribute if nothing remains. Re-emits with the original quote char. Pure --
   no DOM, no imports (Deno Edge Function).
2. POST path: `content = sanitizeInlineStyles(stripLeadingFeaturedImage(rawContent, featured_image_url))`.
3. PUT path: `updateRow.content = sanitizeInlineStyles(stripLeadingFeaturedImage(v, featured))`.
   GET and DELETE paths untouched (they do not write content).

#### Scope / limits

- Forward-looking: new posts and PUT re-saves are sanitized. Existing stored
  posts are unchanged until re-saved; the CSS-layer overrides from Sessions A/B
  still protect those at render/preview time.
- Intentionally narrow property set (`color` / `background` / `background-color`)
  per the task. `background-image`, `border-color`, etc. are preserved; widen
  `STRIP_PROPS` if a future callout needs it.

#### Method / verification

- Edits via the Edit tool; all ASCII (guard clean).
- Deployed: `npx supabase functions deploy create-blog-post --use-api` -> success
  (project hphebzdftpjbiudpfcrs; bundled with `_shared/blogConfig.ts` +
  `corsConfig.ts`). Source committed `fc503ad` and pushed to origin/main so the
  repo matches the live function. No `npm run build` (Edge Function only). Not in
  FILES_TO_SYNC; Rules #20 (migrations) and #23/#24 (_shared sync) not triggered.

---

### May 27, 2026 -- Session B: Blog editor per-image replace/delete + image data-loss fix

#### Summary

Two commits, shipped separately at Lynn's instruction -- a latent data-loss fix
first, then the feature on top. (1) `a75f94d`: the Quill editor's `formats`
whitelist was missing `"image"`, so inline images were silently stripped when a
draft loaded into Edit mode and destroyed on the next Save. (2) `ecbfd79`: an
edit-mode image manager (Option A) for per-image Replace / Delete. Both in
`BlogPreviewPanel.tsx`; no backend, SSOT, schema, or dependency changes. Builds
clean (3942 modules, zero TS errors); Lynn verified each on localhost before
deploy.

#### Diagnosis (Step 1, before any code)

- Edit surface is `<ReactQuill>` (react-quill ^2.0.0 -> Quill 1.3.x) with a
  strict `formats` whitelist that omitted `"image"`. Quill filters
  non-whitelisted formats on load, so `<img>` embeds were removed -- and
  `onChange` then wrote the image-stripped HTML into `editForm.content`, which
  `handleSaveEdit` persisted. Result: editing any image-bearing draft destroyed
  its inline images. (The existence of `stripLeadingFeaturedImage` confirms
  content DOES carry `<img>`.) Preview mode was unaffected -- it bypasses Quill
  via `dangerouslySetInnerHTML`.
- Direct DOM manipulation of `.ql-editor` is unsafe (Quill owns that subtree via
  a MutationObserver). Quill's own API is the only safe in-canvas mutation but
  requires images as first-class embeds AND normalizes wrapping HTML away. That
  conflict (manipulate images vs. preserve `<figure>`/`<p>`) is why the feature
  was built OUTSIDE Quill, on the content string.

#### Approach (Step 2, Lynn approved)

Option A: image manager outside Quill, operating on `editForm.content` as a
string. Prerequisite formats fix shipped first as its own commit, then the panel.

#### Changes

1. `a75f94d` -- `quillFormats` gains `"image"` (+ explanatory comment). No
   toolbar image button (no manual insertion needed).
2. `ecbfd79` -- in `BlogPreviewPanel.tsx`:
   - Module-level string helpers (`extractContentImages`,
     `replaceContentImageSrc`, `removeContentImageAt`, `pWrapsOnlyImage`) using
     `DOMParser` -> mutate -> `doc.body.innerHTML`.
   - State: `replacingImageIndex`, `replaceImageUrl`, `imagePanelStatus`; ref
     `replaceImageInputRef`; derived `contentImages` (useMemo over
     `editForm.content`); a focus effect into the replace input on open; reset of
     panel state in `handleStartEdit`.
   - Handlers: `startReplaceImage` / `cancelReplaceImage` / `confirmReplaceImage`
     / `deleteContentImage`, each writing back to `editForm.content`.
   - UI: an "Images in this post" section in `renderEdit()` (below the editor,
     above the metadata details) -- thumbnail + src per image, Replace (inline
     URL input) and Delete buttons. Edit mode only.

#### Accessibility (Rule #22)

Native `<button>`/`<input>` (in tab order, native Enter/Space, visible focus);
state+purpose `aria-label`s on every control; `sr-only` `<label>` on the replace
input with focus moved into it on open; decorative thumbnails (`alt=""`);
`sr-only` `aria-live="polite"` status region ("Image N updated/deleted.");
`role="list"` + `aria-labelledby`; conditional rendering for hidden states.

#### Method / verification

- All edits via the Edit tool; all ASCII (ASCII guard clean on both commits).
- `npm run build`: PASS each round -- 3942 modules, zero TS errors.
- Dev server stayed up on 8080; Lynn verified the edit flow on localhost.
- Deployed `a75f94d` (formats fix, +6) then `ecbfd79` (panel, +218) to
  origin/main. Blast radius: `BlogPreviewPanel.tsx` only, which both
  `/admin/marketing` (Blog Preview tab) and standalone `/admin/blog-preview`
  render. No FILES_TO_SYNC touched (Rule #23 not triggered).

---

### May 27, 2026 -- Session A: Blog/article body text legible in all four themes

#### Summary

Blog post body content (and any HTML rendered via `dangerouslySetInnerHTML`)
was unreadable in the Dark and Dim themes: hardcoded light-mode color classes
(`bg-white`, `text-slate-*`) bypassed the theme system, and the `prose` blocks
lacked `dark:prose-invert`. Fixed across the public blog post page, the public
trust page, and the admin blog preview. Shipped as commit `36ae943` (3 files,
+97/-20). Diagnosis-led; build clean each round; Lynn approved on localhost
across all four themes; pushed to main. The work spanned three prompts (base
theme fix, an inline-style attribute override, then a class-based + real-markup
override) all consolidated into the one commit.

#### Theme architecture (confirmed before changing anything)

`ThemeProvider.tsx` adds the `.dark` class to `<html>` whenever the intensity
slider is < 50 -- so Dark (15) AND Dim (40) both carry `.dark`, while Soft (60)
and Light (100) do not. `--foreground` / `--muted-foreground` are statically
defined in `index.css` for `:root` (dark text) and `.dark` (light text); they
are NOT interpolated by ThemeProvider. So `text-foreground`,
`text-muted-foreground`, and `dark:prose-invert` resolve correctly in all four
themes. `body` is already `bg-background text-foreground`. The bug was purely
the hardcoded `bg-white` / `text-slate-*` overrides bypassing all of this.

#### Changes (commit 36ae943)

1. `src/pages/BlogPost.tsx` (8 replacements): `<main>` `bg-white text-slate-900`
   -> `bg-background text-foreground`; headings `text-slate-950` ->
   `text-foreground`; date/secondary `text-slate-500/700` ->
   `text-muted-foreground`; back-link `text-blue-700` -> `text-primary` (matches
   the BlogCard link convention); error box `red-*` -> `destructive` tokens
   (matches Blog.tsx); content div `prose prose-lg max-w-none` ->
   `prose prose-lg dark:prose-invert max-w-none`.
2. `src/pages/WhyChurchesCanTrustBibleLessonSpark.tsx` (9 replacements):
   `bg-white text-slate-900` -> `bg-background text-foreground`; eyebrow
   `text-blue-700` -> `text-primary`; all `text-slate-700/950` body + headings
   -> `text-foreground`; the two `bg-blue-50` callouts (blockquote + closing
   card) -> `bg-muted` with `border-primary` / `border-border` and
   `text-foreground`. The box backgrounds HAD to convert alongside their text:
   leaving `bg-blue-50` while changing the text to `text-foreground` would put
   light text on a light box in dark themes (a regression).
3. `src/components/admin/BlogPreviewPanel.tsx`: (a) Quill editor blockquote
   `#3D5C3D` border -> `hsl(var(--primary))`, `#555` text ->
   `hsl(var(--muted-foreground))` (closes the May 13 carry-forward); (b) the
   preview `prose` div got `dark:prose-invert` and a `bls-blog-preview` class;
   (c) a scoped CSS-override block appended to the injected `quillEditorStyles`
   that forces light-background callouts inside the rendered HTML onto the themed
   card surface in Dark/Dim.

#### Diagnosis that changed the BlogPreviewPanel fix

The preview renders post HTML from the `blog_posts` table. I read the live
published rows directly (public anon key, read-only, via a throwaway script) and
found the callouts use INLINE styles, not Tailwind classes:
`style="background: #f5f5f5; border-left: 4px solid #2c5282"` with inner
`style="color: #2c5282"`. So the prompt's assumption of class-based
(`bg-white` / `bg-gray-50`) backgrounds did not match the real markup, and the
earlier `[style*="background:#fff"]` / `[style*="color:#"]` (no space) selectors
missed both the `#f5f5f5` background and the `color: #2c5282` (space after the
colon). The final CSS adds: the requested class-based overrides (future-proofing,
harmless no-ops on current content), inline light-hex coverage
(`[style*="background: #f"]` plus `white`, scoped to `.dark`), a space-aware
`[style*="color: #"]` override, and a `.dark p/li/span` catch-all. Per the
Session-1-findings-precedence rule, the finding drove the final fix; the prompt's
class-based rules were still added as requested.

#### Method / verification

- All source edits via the Edit tool (color class strings only; all ASCII -- no
  ASCII-guard risk, no Unicode glyphs introduced).
- The diagnostic helper (`scan_blog.cjs`) was DELETED before deploy so
  deploy.ps1's `git add .` could not sweep it into the commit.
- `npm run build`: PASS each round -- 3942 modules, zero TypeScript errors
  (final 23.53s). Only the pre-existing chunk-size / browserslist warnings.
- Lynn verified all four themes on localhost:8080, then approved the deploy.
- Deployed via `deploy.ps1`: ASCII guard clean, commit `36ae943`, pushed
  `3143566..36ae943` to origin/main. No FILES_TO_SYNC files touched (Rule #23
  not triggered); no SSOT constant files changed.

---

### May 25, 2026 -- Session B: Lesson-pack purchase UI + lesson-pack SSOT consolidation

#### Summary

Built the lesson-pack purchase UI and consolidated the lesson-pack data
sources, shipped as commit `7fdf40e` (6 files, +104/-74). Diagnosis-led
per the task. Lynn chose Option 1: org-only now, fix the org checkout bug,
defer the individual/team-lead path until its backend exists (no dead
buttons, no payment risk). Build clean; localhost verified; pushed to main.

#### Diagnosis (before any change)

1. THREE lesson-pack sources existed, not two: `STRIPE_LESSON_PACKS`
   (pricingConfig.ts, priceCents -- zero `src/` consumers), `LESSON_PACKS`
   (orgPricingConfig.ts, dollars -- zero `src/` consumers), and the
   `lesson_pack_config` DB table -- the ONLY one actually consumed, read by
   both `useOrgPoolStatus` (display) and `purchase-lesson-pack` (backend
   price). The DB read in the frontend violated frontend-drives-backend.
2. The three target audiences collapse to TWO surfaces: Dashboard
   (individual + team lead are the same billing identity) and Org Manager
   (org admin). "Team lead" = an individual-account user who created a
   Teaching Team -- not a separate backend path.
3. Org purchase path was end-to-end built but BROKEN at the frontend:
   `OrgPoolStatusCard.handlePurchasePack` read `data.checkout_url`, but
   `purchase-lesson-pack` returns `data.url` -- always threw "No checkout
   URL returned". (`handleUpgradeSubscription` correctly reads
   `checkout_url`; `create-org-checkout-session` returns that.)
4. Individual path has NO backend: no one-time checkout fn
   (`create-checkout-session` is subscription-only), no `lesson_pack` in
   `stripe-webhook`, no `bonus_lessons` in the individual RPC/UI. (See
   WHAT'S NEXT for the deferred build.)

#### Changes (commit 7fdf40e)

1. NEW `src/components/subscription/LessonPackPurchase.tsx` -- reusable,
   presentational; renders the three packs (name, price, lesson count)
   from `getActiveLessonPacks()` (LESSON_PACKS SSOT) and fires
   `onPurchase(packType)`. ARIA labels on buttons, `aria-hidden` on the
   decorative icon, `role="list"`/`listitem`.
2. `src/constants/orgPricingConfig.ts` -- comment designating
   `LESSON_PACKS` the single UI-consumed source.
3. `src/constants/pricingConfig.ts` + `supabase/functions/_shared/pricingConfig.ts`
   -- comment marking `STRIPE_LESSON_PACKS` backend-only (Rule #24 mirror
   updated in the same commit).
4. `src/components/org/OrgPoolStatusCard.tsx` -- dialog now renders
   `<LessonPackPurchase>` from the SSOT instead of the DB-sourced map;
   `handlePurchasePack(packType)`; FIXED `data.checkout_url` -> `data.url`;
   dropped the `LessonPackConfig` import; `aria-hidden` on dialog icon.
5. `src/hooks/useOrgPoolStatus.ts` -- removed the `lesson_pack_config` DB
   read (interface, state, fetch, return field) so the UI has one
   lesson-pack source; header comment updated.

#### Method / verification

- All edits via the Edit tool; the new file written then normalized to
  CRLF via PowerShell. Byte-level check: 0 non-ASCII, no BOM on all 6
  files. The Edit tool normalizes literal Unicode <-> `\uXXXX` on match,
  so new comment text was kept em-dash-free to avoid writing a real glyph.
- `npm run build`: PASS -- 3942 modules, 16.58s, zero TypeScript errors.
- Stale `npm run dev` on port 8080 (prior session) forced Vite to 8081;
  killed the stale node PID and restarted on the canonical 8080 (the
  recurring stale-server pattern). Lynn verified the dialog on localhost.
- Deploy: bypassed `deploy.ps1` (it `git add .`s and would stage the two
  deferred SQL diagnostics); staged the 6 files manually. ASCII guard
  pre-commit hook ran and passed. Commit message via `git commit -F` file
  (PowerShell 5.1 mangled embedded double quotes in `-m` here-string).
  Pushed `8af1237..7fdf40e` to main.

#### No route changes
`routes.ts` / `App.tsx` untouched -- the component is embedded in the
existing Org Manager page, not a new route.

---

### May 25, 2026 -- Session A: Pricing SSOT -- lesson-pack price fix + ORG_TIERS sync guard + diagnostics

#### Summary

Diagnostic-led session on the pricing SSOT layer. Two surgical fixes
shipped as a single commit (`c1a9e1b`): (1) corrected the three
`LESSON_PACKS` price fields in `orgPricingConfig.ts` from $12/$25/$45 to
$15/$35/$60 to match `STRIPE_LESSON_PACKS` and CLAUDE.md, and (2) added a
4-line SYNC GUARD comment directly above the `ORG_TIERS` array in the
hand-maintained backend mirror `_shared/pricingConfig.ts`. The
`create-org-checkout-session` Edge Function was redeployed (it bundles
`_shared/pricingConfig.ts`). No structural changes; no file unification
(explicitly out of scope per Lynn).

#### Diagnostics performed (read-only -- no changes)

1. Full reads of `pricingConfig.ts`, `orgPricingConfig.ts`, and
   `_shared/pricingConfig.ts`.
2. Edge Functions that depend on `_shared/pricingConfig.ts`:
   - Direct: `stripe-webhook` (resolveTierFromPriceId, TIER_LESSON_LIMITS,
     SubscriptionTier), `org-stripe-webhook` (same three),
     `create-org-checkout-session` (ORG_TIERS, STRIPE_INDIVIDUAL).
   - Transitive via `_shared/subscriptionCheck.ts` (TIER_SECTIONS,
     SubscriptionTier): `generate-lesson`, `reshape-lesson`.
   - `_shared/lessonTiers.ts` imports FREE/FULL_TIER_SECTION_NUMBERS but
     has NO backend consumer -- dead in the Edge Function tree.
3. Org lesson limits and Stripe price IDs are consistent between
   `orgPricingConfig.ts` and the `_shared` mirror's `ORG_TIERS`
   (20/30/60/100/200, identical IDs).
4. Confirmed `STRIPE_LESSON_PACKS` and `LESSON_PACKS` both have ZERO
   `src/` consumers; lesson-pack prices are rendered nowhere in the UI.
5. Grep sweeps run on request -- all ZERO matches: expandableUser /
   UserExpand family; fontPicker / colorPicker / exportFont / exportColor
   family; AmpArticle / NewsletterPreview / EmailMarketing family;
   uiAudit / gapReport family; `include_student_handouts`. `OrgSetup.tsx`
   references tiers only dynamically (`tier.tier === 'org_growth'`), no
   hardcoded per-tier strings. The only `STRIPE_ORG` hit in
   `pricingConfig.ts` is the comment noting the block was removed
   (Phase A11).

#### Fixes

1. `src/constants/orgPricingConfig.ts` `LESSON_PACKS`: small price
   12.00 -> 15.00, medium 25.00 -> 35.00, large 45.00 -> 60.00. Stripe
   product IDs and price IDs untouched.
2. `supabase/functions/_shared/pricingConfig.ts`: inserted directly above
   `export const ORG_TIERS = [` (now line 52) a 4-line SYNC GUARD comment
   stating the array's tier keys, Stripe price IDs, and lessonsLimit
   values MUST match `src/constants/orgPricingConfig.ts` `ORG_TIERS`, and
   that both files must change in the same commit. The prompt supplied an
   em dash in the last line; written as `--` to satisfy the ASCII guard
   (Rule #16).

#### Method / verification

- Both edits applied via a temporary Node `.cjs` patch script using
  explicit `\r\n` joins for CRLF matching; the script asserted each
  search string occurred exactly once before replacing, guarded against
  double-insertion of the comment, and ran a byte-level ASCII check.
  Script deleted after the run.
- ASCII guard: 0 non-ASCII bytes on both files.
- `npm run build`: PASS -- 3941 modules, 21.12s, zero TypeScript errors.
- Edge Function deploy: `create-org-checkout-session` deployed via
  `npx supabase functions deploy create-org-checkout-session --use-api`
  (uploaded `index.ts` + `_shared/pricingConfig.ts`).
- Reported to Lynn before any deploy decision that the price fix has no UI
  surface to verify on localhost (no consumer renders it).

#### Deploy

Bypassed `deploy.ps1` (which runs `git add .`) and used manual `git add`
of only the two task files, keeping `DIAGNOSE_AUTH_FUNCTIONS.sql` and
`DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql` untracked -- same pattern as every
session since mid-May. Pre-commit ASCII hook passed ("All staged files
are ASCII-clean").
- `c1a9e1b` -- "FIX: Correct lesson pack prices 15/35/60 in
  orgPricingConfig; add ORG_TIERS sync guard to _shared/pricingConfig"
- Pushed `63c8c0e..c1a9e1b` to `origin/main`. Netlify auto-deploys.

#### Rule satisfaction checklist

- Rule #1 (verify file contents): full reads of all three pricing files
  before any edit; changed regions re-read after the patch.
- Rule #2 (complete solutions): both fixes in one commit.
- Rule #5 (clean build before deploy): confirmed.
- Rule #9 (single branch): commit on `main`.
- Rule #14 (state uncertainty plainly): flagged the em dash in the
  supplied comment before writing; flagged that the price fix has no UI
  surface to verify; flagged the `deploy.ps1` `git add .` trap before
  committing and confirmed the narrow-scope manual path with Lynn.
- Rule #16 (ASCII representation): em dash rendered as `--`.
- Rule #20 (Supabase CLI): Edge Function deployed via the CLI.
- Rule #23/#24: `orgPricingConfig.ts` is not in FILES_TO_SYNC;
  `_shared/pricingConfig.ts` is hand-maintained (Rule #24). No
  `sync-constants` run -- correct for these two files.

#### Carry-forward into next session

Captured in WHAT'S NEXT at the top of this file.

---

### May 20, 2026 -- Session A: Series Publishing -- export by series_id + lesson-count badge

#### Summary

Two commits fix how Publishing Hub identifies the lessons in a series.
`useSeriesExport` now queries `lessons` directly by `series_id` instead
of by the JSONB `lesson_summaries[].lessonId` array stored on the
parent `lesson_series` row. The series-card "X of Y lessons" badge now
reads a fresh per-series count of `lessons` rows (via a second query
issued after the initial `lesson_series` fetch) instead of
`lesson_summaries.length`. The colored status pill ("Complete" /
"In Progress" / "Empty") next to the count was removed -- only the
count remains. Shipped as commits `ea1d393` and `b718d1f`.

#### Tasks

1. **Series export fetch by `series_id`.** `src/hooks/useSeriesExport.ts`
   previously built a `lessonIds` array from `series.lesson_summaries`
   sorted by `lessonNumber`, then queried
   `supabase.from('lessons').in('id', lessonIds)`, then re-sorted the
   result client-side. Replaced with a single direct query:
   `.eq('series_id', series.id)
    .order('series_lesson_number', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: true })`.
   Postgres now orders the result; the hand-built ordered-array
   reconstruction loop is gone. The "no lessons" empty-state branch now
   triggers when the DB returns zero rows OR errors, not just when the
   summaries array was empty. Reshape rows that carry the same
   `series_id` (created when a user clicks "Save Reshape as Lesson"
   inside a series) are now included in the export -- intentional,
   captured in the deploy message.

2. **Series-card count by separate `lessons` query.** Earlier
   iterations tried `lessons(id)` as a Supabase embed on the FETCH
   SERIES select. Final approach in `src/pages/PublishingHub.tsx`:
   after the first `setSeriesList`, issue a second query that selects
   `series_id` from `lessons` filtered to the just-fetched series ids,
   builds a count map client-side, and re-renders with a `lessonCount`
   number set on each row. `SeriesRow` interface gained
   `lessonCount?: number`. The card render uses `s.lessonCount ?? 0`.
   `isComplete` tightened to require `completed > 0` so an empty
   series no longer flashes "Complete".

3. **Status pill removed.** The colored status badge rendered next to
   the count is gone. Only "{completed} of {total} lessons" remains.
   `statusLabel`, `badgeClass`, `isComplete`, `isInProgress` locals
   are still computed but unused (TS does not flag, build is clean).
   Cleanup deferred to a future session.

#### Files touched

1. `src/hooks/useSeriesExport.ts`:
   - The `lessonIds` build, the empty-array guard, the
     `.in('id', lessonIds)` query, the `throw` on fetch error, and
     the `orderedLessons` reconstruction loop -- all removed (25
     lines).
   - Replaced with the direct `.eq('series_id', series.id)` query
     plus an early-return when zero rows come back. `orderedLessons`
     is now just `lessons as Lesson[]` because Postgres ordered the
     rows.
2. `src/pages/PublishingHub.tsx`:
   - `SeriesRow`: added `lessonCount?: number` (a transient
     `lessons?: { id: string }[] | null` field added mid-session was
     reverted before the final commit).
   - FETCH SERIES `useEffect`: after
     `setSeriesList((data || []) as SeriesRow[])`, an inner block
     gathers `seriesIds`, queries `lessons` for those ids' `series_id`
     column, builds a `countMap`, and re-renders with `lessonCount`
     populated.
   - Series-card `renderExtra`: `completed` now reads
     `s.lessonCount ?? 0`. `isComplete` tightened to require
     `completed > 0`. Status pill span removed from the return block.

#### Iterations during session

The series-card count went through three forms before settling:
- `Array.isArray(s.lesson_summaries) ? s.lesson_summaries.length : 0`
  -- original. Reads from JSONB array on `lesson_series` row.
- `Array.isArray(s.lessons) ? s.lessons.length : 0` via a
  `lessons(id)` embed on the SERIES select. Tried, then reverted
  because the embed pulls a row array on every series-list load
  whose only purpose is to be counted -- a separate count query is
  cleaner and matches what the export does.
- `s.lessonCount ?? 0` populated from a separate
  `lessons.select('series_id')` query and a client-side count map
  -- final form.

A short-lived `.is('shaped_content', null)` filter on
`fetchSeriesLessons` (the per-series preview fetch) was added and
reverted in the same session. Decision: include reshape rows in the
series publishing preview and export. The deploy commit message for
the first commit reflects this explicitly.

#### Verified before push

- `npm run build` clean for every iteration. Final builds:
  `ea1d393` 23.47s, `b718d1f` 20.94s. Zero TypeScript errors,
  3941 modules.
- ASCII guard passed on both commits.
- Localhost verification (Lynn): approved between iterations at
  `http://localhost:8080/publishing-hub`.

#### Deploy

Two separate commits, both pushed via manual `git add` of named
files only rather than via `deploy.ps1`, to keep the two diagnostic
SQL files (`DIAGNOSE_AUTH_FUNCTIONS.sql`,
`DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql`) untracked. Same pattern as
Sessions A-D May 18-19 and earlier sessions.

- `ea1d393` -- "FIX: Series publishing includes all lessons and
  reshapes by series_id; card count reads from lessons table"
- `b718d1f` -- "FIX: Remove series status badge -- show lesson
  count only"

#### Rule satisfaction checklist

- Rule #1 (verify file contents): full reads of `PublishingHub.tsx`,
  `useSeriesExport.ts`, `useSeriesManager.ts` (for context) before
  any edit.
- Rule #2 (complete solutions): every change cycle ran a clean
  build before commit.
- Rule #5 (clean build before deploy): confirmed at each commit.
- Rule #9 (single branch): both commits on `main`.
- Rule #14 (state uncertainty plainly): flagged two prompt
  contradictions before writing code. (a) Step 2 of a multi-step
  prompt set a `lessons` field on the row while steps 3-4 expected
  a `lessonCount` field -- asked which form to use; Lynn chose
  `lessonCount`. (b) A later prompt's description said "show
  progress percentage" but the literal target code had no
  percentage span -- asked which to implement; Lynn chose to drop
  the percentage mention and ship the literal target.
- Rule #16 (escape sequences for non-ASCII): no non-ASCII bytes
  introduced. ASCII guard confirmed clean both commits.

#### Carry-forward into next session

Captured in WHAT'S NEXT at the top of this file.

---

### May 19, 2026 -- Session D: LessonLibrary card-level a11y + SSOT constants

#### Summary

Three surgical edits to `src/components/dashboard/LessonLibrary.tsx`
plus their backing SSOT constants. Closes the Session C carry-forward
on card-level Add-to-Series popover accessibility, and replaces four
magic numbers and one hardcoded table-name string literal with SSOT
constants. Shipped as commit `eacc9b3`.

#### Tasks

1. **Card-level Add-to-Series popover Rule #22 a11y.** The trigger
   button gained `id`, `aria-label`, `aria-expanded`, `aria-haspopup`,
   and an `onKeyDown` handler that closes on Escape and re-focuses the
   trigger via `document.getElementById(...)?.focus()`. The popover
   gained `role="menu"`, `aria-label`, `aria-labelledby`, and a `ref`
   wired to a new click-outside `useEffect`. The descriptive `<p>`
   inside the popover got `aria-hidden="true"`. Each option button
   got `role="menuitem"`. The decorative `ListPlus` icon got
   `aria-hidden="true"`. The `title` attribute was removed in favor
   of `aria-label`. Mirrors the viewer-level pattern in
   `EnhanceLessonForm.tsx` from Session C.

2. **`SERIES_LIMITS` replaces three magic numbers in the Create
   Series modal.** Discovered during diagnostics that the prompt
   named `seriesExportConfig.ts` as the SSOT home for series limits,
   but the actual home is `src/constants/seriesConfig.ts` where
   `SERIES_LIMITS` already had `minLessons: 2`, `maxLessons: 13`, and
   `maxSeriesNameLength: 100`. Adding new top-level constants
   (`SERIES_MIN_LESSONS` etc.) would have created duplicate
   definitions across two files -- a direct SSOT violation. Lynn
   chose to extend `SERIES_LIMITS` with `defaultLessons: 4` and
   consume the object's keys in LessonLibrary. Three magic numbers
   replaced: `useState(4)`, the reset literal `4` in
   `handleCreateSeries`, `Array.from({ length: 12 }, (_, i) => i + 2)`,
   and `maxLength={100}`.

3. **`LESSONS_TABLE` replaces the hardcoded `'lessons'` string.**
   Added `export const LESSONS_TABLE = 'lessons';` to
   `src/constants/contracts.ts` (a new TIER 1.5 section). Imported in
   LessonLibrary and used in `handleAddToSeries`'s
   `supabase.from(LESSONS_TABLE)` call. `npm run sync-constants` ran
   after the `contracts.ts` edit per Rule #23; the auto-synced
   `supabase/functions/_shared/contracts.ts` picked up the constant
   at line 47.

#### Files touched

1. `src/components/dashboard/LessonLibrary.tsx`:
   - `useRef` added to the React import.
   - `LESSONS_TABLE` added to the `@/constants/contracts` import.
   - `SERIES_LIMITS` imported from `@/constants/seriesConfig`.
   - `seriesPopoverRef = useRef<HTMLDivElement>(null)` declared next
     to `addToSeriesOpenId` state.
   - New `useEffect` registers a `mousedown` click-outside listener
     when the popover is open; cleans up on close.
   - `useState(SERIES_LIMITS.defaultLessons)` replaces the literal
     `4` at the initial value and at the reset in
     `handleCreateSeries`.
   - `supabase.from(LESSONS_TABLE)` replaces `supabase.from('lessons')`
     in `handleAddToSeries`.
   - The Add-to-Series trigger `<Button>` and popover `<div>` (and
     children) gained the full Rule #22 wiring described above.
   - The dropdown options use
     `Array.from({ length: SERIES_LIMITS.maxLessons - SERIES_LIMITS.minLessons + 1 }, (_, i) => i + SERIES_LIMITS.minLessons)`.
   - The series-name input uses
     `maxLength={SERIES_LIMITS.maxSeriesNameLength}`.
2. `src/constants/seriesConfig.ts`:
   - `SERIES_LIMITS` extended with `defaultLessons: 4`. No new top-
     level exports; the four values consumed by LessonLibrary all
     come from the single `SERIES_LIMITS` object.
3. `src/constants/contracts.ts`:
   - New "TIER 1.5: Database Table Names (SSOT)" section.
   - `export const LESSONS_TABLE = 'lessons';` at line 41.
4. `supabase/functions/_shared/contracts.ts`:
   - Auto-synced from `src/constants/contracts.ts` by
     `npm run sync-constants`. No hand edits. `LESSONS_TABLE`
     mirrored to line 47.

#### Verified before push

- `npm run build` clean: 3941 modules transformed, 22.31s, zero
  TypeScript errors.
- ASCII guard: 0 non-ASCII bytes on all four modified files. Verified
  by byte-level Node check before commit; pre-commit hook ran on
  commit as well.
- `npm run sync-constants`: ran successfully after the
  `contracts.ts` edit. All 14 FILES_TO_SYNC entries synced cleanly.
- Localhost verification (Lynn): approved at localhost:8080.
- Dev server health probe mid-session (responding to the "site
  can't be reached" report): HTTP 200 in 28ms, LessonLibrary.tsx
  transformed cleanly, all imports resolved. Root cause was a stale
  prior dev server, not the code.

#### Deploy

Bypassed `deploy.ps1` (which runs `git add .`) to keep the two
deferred diagnostic SQL files (`DIAGNOSE_AUTH_FUNCTIONS.sql`,
`DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql`) untracked, consistent with
Sessions A, B, C and earlier sessions. Manual `git add` of the four
task files only. Commit `eacc9b3`. Pushed to origin/main.

#### Rule satisfaction checklist

- Rule #1 (verify file contents): full reads of LessonLibrary.tsx,
  `seriesExportConfig.ts`, `contracts.ts`, and `seriesConfig.ts`
  before any edit. Grep across `src/constants/**` to confirm no
  existing `LESSONS_TABLE` / `TABLE_NAMES` constant.
- Rule #2 (complete solutions): no partial fixes; all three tasks
  shipped in one commit.
- Rule #4 (dependency chain): all four files in one commit.
- Rule #5 (clean build before deploy): confirmed.
- Rule #9 (single branch): commit on `main`. Push to `main`.
- Rule #14 (state uncertainty plainly): mid-session "site can't be
  reached" report. Reported diagnostic findings before proposing
  any fix. Made no code change; root cause was stale dev server,
  not code.
- Rule #16 (escape sequences for non-ASCII): no non-ASCII bytes
  introduced.
- Rule #22 (a11y): closed the card-level popover debt that Session C
  carried forward. The new card-level wiring is behaviorally
  equivalent to the viewer-level pattern.
- Rule #23 (sync-constants after FILES_TO_SYNC edit): ran after the
  `contracts.ts` edit. All 14 files synced.
- Rule #24 (hand-maintained `_shared/` files): no changes needed.
  `_shared/seriesConfig.ts` already exports `MAX_SERIES_LESSONS` /
  `MIN_SERIES_LESSONS` for backend use; nothing consumed by an Edge
  Function changed in Session D so no manual mirror update was
  required.

#### SSOT conflict resolved

The Session D prompt named `seriesExportConfig.ts` as the SSOT home
for series limits. Diagnostic reads showed:
- `seriesExportConfig.ts` had none of the four needed constants.
- `seriesConfig.ts` (a separate file) already had three of the four
  inside `SERIES_LIMITS`.
- `_shared/seriesConfig.ts` already mirrored `MAX_SERIES_LESSONS`
  and `MIN_SERIES_LESSONS` as separate exports.

Adding the four constants to `seriesExportConfig.ts` as the prompt
suggested would have duplicated three values already in
`seriesConfig.ts` -- a direct violation of the "NO duplicate
definitions anywhere in the codebase" SSOT rule. Per the precedent
saved in `feedback_session1_findings_precedence.md`, flagged the
conflict to Lynn before writing code. Lynn chose Option 1: extend
the existing `SERIES_LIMITS` object with `defaultLessons: 4`. No
new constants in `seriesExportConfig.ts`.

#### Traps encountered

1. **"Site can't be reached" report not attributable to code.**
   Mid-session Lynn reported localhost:8080 was unreachable after
   the last commit. Followed the diagnostic protocol with no fixes
   proposed: `npm run dev` came up clean (346ms, zero errors), HTTP
   probe returned 200, LessonLibrary.tsx transformed cleanly, all
   imports resolved, no duplicate BRANDING imports. Root cause was
   a stale dev server process from before the session that left the
   browser-visible error state; a fresh `npm run dev` cleared it.
   Captured in WHAT'S NEXT as an operational diagnostic note.

#### Carry-forward into next session

Captured in WHAT'S NEXT at the top of this file.

---

### May 19, 2026 -- Session C: Smart lesson deletion + Add to Series in viewer

#### Summary

Deleting a lesson now warns the teacher about both cascade
consequences before any row is removed. If the lesson belongs to a
series the dialog names that series. If the lesson has reshape
children every child title is listed. A single composed
`window.confirm` dialog covers all applicable warnings (Rule DEL2).
On confirm the children are deleted before the parent (Rule DEL3) so
the FK's `ON DELETE SET NULL` never fires and never orphans rows.
Local state is updated in a single pass (Rule DEL4). The viewer also
gained a Delete button so reshape lessons (which have no card-level
Delete) can be removed from where the user is reading them, and an
Add to Series button so reshape lessons can be filed into a series.

Same session also captured a production incident: `generate-lesson`
failed to boot with `module does not provide an export named
'buildConsistentStyleContext'`. Hotfix patched the hand-maintained
`_shared/seriesConfig.ts` to add the four runtime symbols
`_shared/freshnessOptions.ts` and `generate-lesson/index.ts` import
from it. Shipped to prod as commit `d1a7f41` before Session C
resumed. Recorded as its own entry below.

#### Files touched

1. `src/utils/lessonDeletion.ts` -- NEW pure helper module. No React,
   no Supabase. Exports:
   - `SeriesLite` -- structural type so callers can pass any
     `{id, series_name}` without dragging the full `LessonSeries`.
   - `CascadeInfo` -- precomputed snapshot of `{lesson,
     reshapeChildren, seriesName, isReshape}`.
   - `buildCascadeInfo(lesson, allLessons, allSeries)` -- derives
     children from the local lessons array and series name from
     allSeries. No network. If a lesson belongs to a series outside
     the `IN_PROGRESS`/`COMPLETED` filter that
     `useSeriesManager.fetchAllSeries()` applies, `seriesName` falls
     back to null and the dialog uses the no-series branch
     (intentional graceful degrade -- the lesson still gets deleted,
     just without the named-series line in the warning).
   - `buildDeleteConfirmation(info)` -- composes the
     `window.confirm` text. Four shapes: reshape-only (with or
     without series), original with both series and children,
     original with series only, original with children only, plain
     original. Title extraction uses a straight-quote-only regex
     after curly-quote literals tripped the ASCII guard repeatedly --
     curly quotes in titles pass through into the dialog intact.
   - `buildDeleteSuccessToast(info)` -- picks "Reshape deleted" /
     `Lesson and N reshape(s) deleted` / "Lesson deleted" per
     Rule DEL6.
2. `src/hooks/useLessons.tsx` -- extended `deleteLesson` from
   `(lessonId) => Promise<void>` to
   `(lessonId, options?: { childrenIds?: string[] }) => Promise<{success: boolean}>`.
   When `childrenIds` is non-empty the hook fires
   `DELETE FROM lessons WHERE id IN (...children...)` BEFORE
   `DELETE FROM lessons WHERE id = parent` (Rule DEL3) so
   `ON DELETE SET NULL` never gets a chance to orphan children.
   Single `setLessons` call removes the parent and every child in one
   pass (Rule DEL4). Success-toast ownership moved to the caller
   (Rule DEL6 wording varies per case). Destructive failure-toast
   stays in the hook.
3. `src/components/dashboard/LessonLibrary.tsx`:
   - Added imports from `@/utils/lessonDeletion`.
   - `handleDelete` rewritten: takes full `Lesson` instead of just an
     id, builds cascade info, fires composed `window.confirm`, calls
     hook with `childrenIds`, picks toast per case.
   - Card Delete button onClick updated to pass the full row and
     gained `aria-label` (Rule #22). Decorative `Trash2` carries
     `aria-hidden="true"`.
4. `src/components/dashboard/EnhanceLessonForm.tsx`:
   - Lucide imports: added `Trash2`, `ListPlus`.
   - shadcn imports: added `Badge` (was missing from this file).
   - `useLessons` destructure extended with `lessons`, `deleteLesson`,
     `refetch: refetchLessons`.
   - `useSeriesManager` destructure extended with `allSeries`,
     `fetchAllSeries`. (Note: `linkLessonToSeries` was already in the
     destructure from prior work -- caught and removed a duplicate
     declaration during the build.)
   - Mount-time `useEffect(() => { fetchAllSeries(); }, [])`.
   - State for the Add-to-Series popover: `addToSeriesOpen`,
     `addingToSeries`, plus `addToSeriesTriggerRef` and
     `addToSeriesPopoverRef` for a11y.
   - Popover lifecycle `useEffect` registers document-level
     `keydown` (Escape closes, returns focus to trigger) and
     `mousedown` (click-outside closes) when open; cleans up on close.
   - `handleAddCurrentLessonToSeries(seriesId)` mirrors
     `LessonLibrary.handleAddToSeries` exactly: MAX-position query,
     +1, link, toast, `refetchLessons()`, close popover, focus
     returns to trigger via `requestAnimationFrame` (deferred one
     frame so the popover unmounts before focus moves).
   - `handleDeleteCurrentLesson()` uses the same cascade helpers as
     LessonLibrary, and on success calls `onClearViewing()` to close
     the viewer and return to the library (Rule DEL5 -- no new prop
     needed; the existing prop already handles full cleanup including
     navigation back from the series-origin case).
   - Action row JSX, between `<LessonExportButtons>` (Publish is its
     last button) and Edit Lesson:
     - IIFE that resolves the "live" series state by looking up the
       row in the refreshed `lessons` array (so the In Series badge
       appears immediately after a successful add -- the viewingLesson
       prop is stale until Dashboard reselects).
     - If `liveSeriesId` is set: render the In Series badge that
       navigates to Series Library with that series expanded.
     - If no series exists yet (`allSeries.length === 0`): render
       nothing (matches the card-level gate).
     - Otherwise: render the trigger button with
       `aria-haspopup="menu"`, `aria-expanded={addToSeriesOpen}`, and
       a context-aware `aria-label` ("Add this reshape to a series"
       vs "Add this lesson to a series"). When open, render the
       popover with `role="menu"` and one `role="menuitem"` per
       series in `allSeries`.
   - Action row JSX, between the reshape spinner and Back to Library:
     Delete button. `Trash2 aria-hidden="true"`; `aria-label` varies
     by `reshape_of`; `tabIndex={0}`; `onKeyDown` activates on Enter
     and Space. Hidden while editing.

#### Hook signature change (consumer audit)

`deleteLesson` is the only signature change in this session. Grep on
the new signature in `src/`: two callers --
`LessonLibrary.handleDelete` and `EnhanceLessonForm.handleDeleteCurrentLesson`.
Both pass `{childrenIds}` for cascade rows. Both check the returned
`{success}` boolean before toasting and before any side effect.

#### Verified before push

- ASCII guard: 0 non-ASCII bytes on all 4 source files.
- BRANDING duplicate-import sweep: same 4 false-positive basenames
  (Header.tsx, Footer.tsx, Admin.tsx, tenantConfig.ts) Sessions A and
  B inspected -- none touched this session.
- `npm run build` clean: 3941 modules (+1 vs Session B baseline of
  3940 -- new `lessonDeletion.ts` module), 23.69s, zero TypeScript
  errors. One build error was caught and fixed in the same run --
  duplicate `linkLessonToSeries` declaration -- before the final
  clean build.
- Localhost verification (Lynn): full Delete + Add-to-Series test
  pass at localhost:8080. Verified.

#### Rule satisfaction checklist

- Rule #1 (verify file contents): targeted reads of every consumer
  before each edit; full Step 1 diagnostic report before any code.
- Rule #2 (complete solutions): no partial fixes.
- Rule #4 (dependency chain): all 4 source files deploy in one
  commit; no constants/types/Edge-Function changes.
- Rule #5 (npm run build clean): clean post-fix.
- Rule #6 (no stale overwrites): Edits applied in place.
- Rule #22 (accessibility):
  - Card Delete trigger: aria-label, aria-hidden on icon.
  - Viewer Delete trigger: tabIndex 0, aria-label varies, aria-hidden
    on icon, onKeyDown handles Enter and Space.
  - Viewer Add-to-Series trigger: aria-haspopup="menu",
    aria-expanded reflects state, aria-label varies for reshape
    vs original, aria-hidden on icon.
  - Viewer Add-to-Series popover: role="menu" with aria-label,
    role="menuitem" on every option, focus-visible styles, focus
    returns to trigger on every close path (selection, Escape,
    click-outside).
  - All buttons remain reachable while in tab order; nothing hidden
    via display:none.
- Rule DEL1 (fetch before confirm): cascade info built from already-
  loaded `lessons` + `allSeries`. No extra Supabase query.
- Rule DEL2 (one dialog): single composed `window.confirm` per
  delete; no chained prompts.
- Rule DEL3 (children first): two-step delete in the hook with the
  child `.in('id', ...)` running before the parent `.eq('id', ...)`.
- Rule DEL4 (single state update): one `setLessons` after both server
  deletes succeed.
- Rule DEL5 (viewer closes): `handleDeleteCurrentLesson` calls
  `onClearViewing()` on success -- existing prop, no new wiring.
- Rule DEL6 (specific toasts): `buildDeleteSuccessToast` returns the
  right wording; failure toast stays in the hook.
- Rule DEL7 (Delete button): viewer button uses Trash2 (now imported
  in EnhanceLessonForm), destructive hover styling, aria-label
  context-aware on reshape vs original, tabIndex 0, Enter/Space
  handler, hidden while editing.

#### Traps encountered

1. **Non-ASCII curly quotes in regex literals.** The first draft of
   `lessonDeletion.ts` matched both straight and curly quotes in the
   title-extraction regex (`["“”]?`). The Edit tool kept
   normalizing the `\uXXXX` escapes back into glyphs and PowerShell
   here-strings carried the glyph bytes through unchanged. Three
   round-trips of "convert via byte-level replace" failed. Resolution:
   drop curly-quote matching entirely -- a rare case in lesson
   titles, and curly quotes still pass through into the dialog
   message intact. Memory note `feedback_unicode_escape_traps` was
   the right warning but the simplest fix was to remove the
   requirement rather than wrestle with the encoding.
2. **Duplicate `linkLessonToSeries` declaration.** The
   `useSeriesManager` destructure in EnhanceLessonForm already
   pulled `linkLessonToSeries` from prior series-creation work.
   I added it again when wiring the new Add-to-Series handler.
   esbuild caught it on the first build. Fixed by removing the
   duplicate from the new addition.
3. **Stale `currentLesson.series_id` after successful add.**
   `currentLesson` derives from `viewingLesson` (Dashboard prop)
   which does not change when the local `lessons` array is
   refetched. Without a fix, the In Series badge would only appear
   on the next viewer mount. Resolution: a small IIFE in the JSX
   does a live lookup against `lessons` keyed by `currentLesson.id`
   to pick the freshest `series_id`. Cheap, no React state shuffle,
   pattern can be reused for any future viewer surface that needs
   live-state.

#### Carry-forward into next session

Captured in WHAT'S NEXT at the top of this file.

---

### May 19, 2026 -- Production hotfix: generate-lesson boot error

#### Summary

User-reported outage. `generate-lesson` Edge Function failed to boot
with:

  `Uncaught SyntaxError: The requested module './seriesConfig.ts'`
  `does not provide an export named 'buildConsistentStyleContext'`

Session C was in progress; halted, diagnosed, patched, redeployed.
Session C resumed afterward and shipped in a separate commit.

#### Diagnosis

`_shared/freshnessOptions.ts:1053-1059` re-exports four runtime
symbols from `_shared/seriesConfig.ts`:
- `SeriesStyleMetadata` (type)
- `buildConsistentStyleContext`
- `buildStyleExtractionPrompt`
- `parseStyleMetadata`
- `removeStyleMetadataFromContent`

`_shared/freshnessOptions.ts` is in `FILES_TO_SYNC` (Rule #23) so the
re-export line was correctly mirrored from frontend. But
`_shared/seriesConfig.ts` is hand-maintained (Rule #24) and was a
10-line stub exporting only `MAX_SERIES_LESSONS` and
`MIN_SERIES_LESSONS` -- it never received the runtime symbols that
the frontend `src/constants/seriesConfig.ts` had added. Session A's
deploy of `generate-lesson` may have predated the sync, or the
worker boot path is only exercised on a true cold start; either way
the function was broken on the current production deploy.

Direct second consumer: `generate-lesson/index.ts:20` imports the
same four symbols directly from `_shared/seriesConfig.ts`. Two
import paths into the missing symbols.

#### Fix

Patched `_shared/seriesConfig.ts` to add the `SeriesStyleMetadata`
interface plus the four runtime functions, ported verbatim from
`src/constants/seriesConfig.ts`. Confirmed via grep that no other
backend code imports any of the other functions in the frontend
file (continuity helpers, summary parsing, etc.) -- left out per
Rule #24 minimal-surface policy.

Two deploys this session:
1. First deploy added only `SeriesStyleMetadata` +
   `buildConsistentStyleContext`. Caught the three-more-symbols
   drift on a proactive grep before declaring victory.
2. Second deploy added the remaining three. Verified ASCII clean,
   deploy succeeded, dashboard logs confirmed clean boot.

Shipped to prod as commit `d1a7f41` ahead of Session C resume.

#### Files touched

`supabase/functions/_shared/seriesConfig.ts` -- 10 lines to 134
lines. Comment header documents that this file is hand-maintained
and exists in the FILES_TO_SYNC blocklist by design.

#### Rule satisfaction

- Rule #1 (verify): four targeted reads (`_shared/freshnessOptions.ts`
  L1053-1059, `_shared/seriesConfig.ts`, `src/constants/seriesConfig.ts`,
  full `supabase/functions/` grep) before any patch.
- Rule #24 (hand-maintained `_shared/`): four runtime symbols added to
  match what backend code actually imports. Untouched: the additional
  prompt-builder and parser functions from the frontend file that no
  backend code references.
- Rule #5 (clean build before deploy): no frontend build needed --
  Edge Function deploy via `npx supabase functions deploy
  generate-lesson --use-api` succeeded twice.

#### Traps encountered

1. **Incomplete first patch.** Initial fix added only the two symbols
   named in the error message. Proactive full-tree grep before
   declaring victory caught three more re-exported symbols that
   would have thrown the same error on the next cold start. Lesson
   for future: when adding to a hand-maintained `_shared/` mirror,
   always grep the full backend tree for ANY import from that file
   to scope the port, not just the symbol named in the active error.
2. **CLI `functions logs` subcommand does not exist.** Supabase CLI
   v2.100.1 exposes only `list`, `delete`, `download`, `deploy`,
   `new`, `serve` under `functions`. Same blocker as Session A. Log
   verification has to happen from the dashboard.

---

### May 19, 2026 -- Session B: Reshape UI cleanup + Lesson Library pagination

#### Summary

The legacy reshape viewer toggle and the legacy parent-row
`shaped_content` expander in the library are both gone. The Lesson
Library now paginates at 15 cards per page with Previous/Next controls
and a live page indicator. Two follow-on fixes shipped in the same
session: heading markers (`#`, `##`, `###`, `####`) now render as HTML
headings so raw `#` characters no longer leak to the viewer, and
duplicate "View Reshaped" link labels are numbered when a parent has
multiple reshapes of the same shape.

#### Architectural decision -- pagination is client-side, not `range()`

Rule P4 of the session prompt prescribed server-side `range()` +
`count: 'exact'` pagination mirroring `Blog.tsx`. Two architectural
realities pushed us to client-side slicing instead, with Lynn's
explicit approval before any code was written:

1. `useLessons` is shared with `EnhanceLessonForm`, `useSeriesManager`,
   and the new `reshapeChildrenByParent` map in `LessonLibrary`. A
   single-page fetch would have hidden reshape children from parents
   on other pages and broken the map.
2. All four LessonLibrary filters (passage, title, age group, theology
   profile) are client-side. Server-side pagination would have scoped
   them to the current 15 rows -- degraded UX. Fixing that meant
   moving every filter into the Supabase query plus a parallel search
   mode for the full filtered set. Disproportionate scope.

Client-side slicing keeps `useLessons` unchanged, keeps every filter
working, keeps `reshapeChildrenByParent` intact, and matches the
realistic data volume for a single teacher's library.

#### Files touched

1. `src/components/dashboard/EnhanceLessonForm.tsx` -- removed the
   legacy toggle in full:
   - `onLessonShapeUpdated` prop deleted from interface + destructure
     (zero parent consumers).
   - `reshapeViewMode`, `localShapedContent`, `localShapeId` useState
     declarations deleted.
   - useEffect at the old L1368 restructured -- editor-reset half
     retained, reshape-init half deleted.
   - `handleReshapeLesson` no longer writes to the three deleted
     state setters; still calls `addReshapedLesson(result.lesson)`.
   - `lessonContentForExport` simplified (no shaped branch).
   - Reshape button aria-label collapsed to `'Reshape lesson'`;
     button text collapsed to `"Reshape"`.
   - "Original (8 Sections) / shape name" toggle JSX deleted.
   - Conditional shaped/original rendering ternary unwrapped to the
     original branch only.
   - Added module-scope `convertHeadingsToHtml(text)` helper that
     strips bare `#`/`##`/`###`/`####` lines and converts heading
     lines to `<h1>`-`<h4>` tags. Wired into both `formatSectionContent`
     and the unstructured-content fallback render path. Order matters:
     heading conversion runs BEFORE `\n -> <br>` replacement so line
     anchors still match. After conversion, `\n` adjacent to
     `</h1-4>` and `<h1-4 ...>` are collapsed to avoid stray
     `<br><br>` between block-level headings.
2. `src/components/dashboard/LessonLibrary.tsx`:
   - Legacy `shaped_content` expander block deleted in full (chevron
     button + expanded panel + Copy button + 600-char preview).
   - Dead state `reshapeExpandedId` and helper `renderMarkdown`
     removed. `ChevronUp`, `ChevronDown`, `Copy` imports pruned.
   - Module-scope `LESSONS_PER_PAGE = 15`.
   - Component state `currentPage` added.
   - useEffect resets `currentPage` to 0 whenever any of
     `[searchPassage, searchTitle, ageFilter, profileFilter, scope]`
     changes.
   - Derived `totalPages`, `safePage`, `pagedLessons` after
     `filteredLessons`. `safePage` guards against the case where
     deleting the final card on the last page would otherwise leave
     `currentPage` past the end.
   - Grid map switched from `filteredLessons.map` to
     `pagedLessons.map`.
   - Previous / Next button row added below the grid (Rule P5).
     Uses `aria-disabled` (Rule #22 -- focusable at boundaries),
     `aria-label`, `aria-live="polite"` on the indicator. Hidden when
     `filteredLessons.length <= LESSONS_PER_PAGE` to avoid showing a
     useless control on tiny libraries.
   - Reshape-children render block now sorts children by `created_at`
     ASC and, when a parent has 2+ reshapes of the same shape,
     appends a 1-indexed suffix to the label
     ("Story-Driven 1", "Story-Driven 2"). Single reshapes keep the
     bare shape label. aria-label updated in parallel.
3. `src/hooks/useLessons.tsx` -- `updateLessonShape` and
   `clearLessonShape` deleted in full (definitions + return entries).
   Zero consumers confirmed via grep before deletion (Rule D4).
   `addReshapedLesson` retained.
4. `src/hooks/useReshapeLesson.tsx` -- one-line comment update at L17
   to reflect that the Edge Function writes to `lessons` now, not the
   client hook.

#### Pagination shape (final)

```ts
const LESSONS_PER_PAGE = 15;                                  // module scope

const [currentPage, setCurrentPage] = useState(0);            // component
useEffect(() => { setCurrentPage(0); },
  [searchPassage, searchTitle, ageFilter, profileFilter, scope]);

const totalPages = Math.max(1, Math.ceil(filteredLessons.length / LESSONS_PER_PAGE));
const safePage = Math.min(currentPage, totalPages - 1);
const pagedLessons = filteredLessons.slice(
  safePage * LESSONS_PER_PAGE,
  safePage * LESSONS_PER_PAGE + LESSONS_PER_PAGE,
);
```

#### Bug fixes in the same commit

**Raw `#` markers in lesson viewer.** Before this session,
`convertInlineMarkdown` handled only links/bold/italics. Heading
markers passed straight through and survived the `\n -> <br>`
replacement -- the user saw literal `#` and `##` characters in the
rendered lesson. Added `convertHeadingsToHtml` and wired it into both
render paths (`formatSectionContent` for the structured branch, and
the unstructured fallback at the top of the viewer's content block).

**Duplicate reshape labels.** When a parent had two reshapes of the
same shape, the library showed two identical "View Reshaped
(Story-Driven)" links. The render block now sorts children by
`created_at` ASC, counts occurrences per `shape_id`, and appends a
1-indexed suffix only when more than one exists. Single reshapes
display the bare label exactly as before.

#### Verified before push

- Targeted grep `reshapeViewMode|localShapedContent|localShapeId|onLessonShapeUpdated`
  across `src/` -- zero matches.
- Targeted grep `updateLessonShape|clearLessonShape` across `src/` --
  zero matches (post-cleanup of stale comment in `useReshapeLesson.tsx`).
- BRANDING duplicate-import sweep -- the same 4 false-positive
  candidates as Session A (Header.tsx, Footer.tsx, Admin.tsx,
  tenantConfig.ts -- duplicate basenames across folders, each with
  exactly one BRANDING import per file). None of those files were
  touched this session.
- ASCII guard on all 4 modified source files -- zero non-ASCII bytes.
- `npm run build` clean after the toggle/expander/pagination work --
  3940 modules, ~27.6s, zero TypeScript errors. Module count
  unchanged because no whole files were added or removed -- only
  intra-file deletions. Build re-run was rejected by Lynn after the
  two follow-on fixes (Lynn re-verified locally and approved deploy).

#### Localhost verification (Lynn)

Lynn verified the dev server at localhost:8080 -- pagination, reshape
gates, viewer rendering. Approved deploy. The two issues Lynn flagged
in that pass were the raw `#` markers (fixed via
`convertHeadingsToHtml`) and the duplicate reshape labels (fixed via
the per-shape counting in the render block).

#### Rule satisfaction checklist

- Rule #1 (verify file contents): targeted reads before every edit,
  full Step 1 diagnostic report before any code.
- Rule #2 (complete solutions): no partial fixes.
- Rule #4 (dependency chain): all 4 source files + PROJECT_MASTER
  deploy together; no constants/types/Edge Functions changed.
- Rule #5 (npm run build clean before deploy): clean build after the
  Session B deletions and pagination. Post-fix rebuild was Lynn's
  call.
- Rule #22 (accessibility): pagination uses `aria-disabled` not the
  HTML `disabled` attribute, `aria-label` on both buttons,
  `aria-live="polite"` on the indicator. Buttons remain focusable at
  boundaries. Decorative icons untouched (`aria-hidden` already in
  place from prior sessions).
- Rule D1 (consumer audit before deletion): grep confirmed zero
  external consumers for `updateLessonShape`, `clearLessonShape`,
  `onLessonShapeUpdated`, `reshapeViewMode`, `localShapedContent`,
  `localShapeId`.
- Rule D2 (toggle removal -- no orphan state): all 8 reference sites
  removed in one pass (state declarations, useEffect block, handler
  calls, export-ternary, button aria/text, toggle JSX, conditional
  rendering branch).
- Rule D3 (do not remove `shaped_content` from types): `contracts.ts`
  and `types.ts` untouched. Export utilities continue to read
  `lesson.shaped_content ?? lesson.original_text`.
- Rule D4 (useLessons cleanup only if zero consumers): confirmed and
  applied.
- Rule P1 (Blog.tsx pattern) -- intentionally deviated to client-side
  slicing; documented above with full reasoning.
- Rule P2 (15 per page): `LESSONS_PER_PAGE = 15` at module scope.
- Rule P3 (reset on filter change): useEffect dependencies include
  all four filters plus `scope`.
- Rule P5 (Previous/Next): implemented per spec.
- Rule P6 (reshape children): no extra query needed -- the in-memory
  `lessons` array still contains every row.

#### Traps encountered

1. **Heading markers weren't converted to HTML anywhere.** The
   pre-existing `convertInlineMarkdown` handled only links/bold/italics
   and the only heading replacement was an inline `## -> <h2>` regex
   in the unstructured-content fallback. Anything with `# Heading` or
   `### Subheading` rendered as raw `#` characters. Fixed by adding
   the dedicated `convertHeadingsToHtml` helper.
2. **Duplicate same-shape labels.** Once reshape children became
   first-class library rows, two reshapes of the same shape on the
   same parent rendered identical "View Reshaped (Shape)" links. Fixed
   by sorting children by `created_at` ASC and suffixing with a
   1-indexed number only when the shape count > 1.
3. **Empty grid + visible pagination bar.** Early draft of the
   pagination conditional showed Previous/Next on libraries with
   fewer than 15 lessons. Resolved by gating the bar on
   `filteredLessons.length > LESSONS_PER_PAGE`.

#### Carry-forward into next session

Captured in WHAT'S NEXT at the top of this file.

---

### May 18, 2026 -- Session A: Reshape-as-lesson foundation

#### Summary

Reshape is now a first-class lessons row. When a user reshapes a full
8-section lesson, the `reshape-lesson` Edge Function:
1. Loads the parent lesson row and confirms `lesson_type='full'`
   (RESHAPE_RULE, SSOT in `featureFlags.ts`).
2. Looks up any prior reshape of the same (parent, shape) and, if one
   exists, appends an anti-duplicate instruction to the system prompt
   so Claude produces a substantively different composition.
3. Enforces `check_lesson_limit` BEFORE the Anthropic call (so a user
   at their limit cannot get a free reshape).
4. Mirrors `generate-lesson`'s trial billing for full credits when
   `doesTrialApply` returns true.
5. Saves the reshape as a new lessons row with `reshape_of` back-link,
   `lesson_type='full'`, `source_type='reshape'`, filters/visibility
   copied from the parent. Parent row's `shaped_content` is NOT
   touched (Rule R6 -- preserved for backward compatibility).
6. Returns the full new lesson row so the frontend appends to local
   state without a refetch.

Frontend gate: the Reshape button is now hidden entirely on rows where
`reshape_of != null` (a reshape can't be reshaped). On any other row it
is disabled (aria-disabled, still focusable per Rule #22) when
`lesson_type='short'` or the user has no lesson credits.

Lesson Library: reshape children are filtered out of the browse grid.
Each parent card with one or more reshape children shows a yellow
"View Reshaped (Shape Name)" link beneath it. Clicking opens the FULL
viewer (`onViewLesson(child)`) with the reshape as the active lesson,
giving full access to Edit, Add to Series, Copy, Download, Email,
Publish, DevotionalSpark. Shape badge now only renders on actual
reshape rows.

#### RESHAPE_RULE (SSOT)

```ts
export const RESHAPE_RULE = {
  eligibleLessonType: 'full',       // only 8-section lessons
  costInLessonCredits: 1,           // costs exactly 1 credit
  eligibleForShortLesson: false,    // 3-section lessons never eligible
} as const;
```
Declared at `src/constants/featureFlags.ts`. Hand-maintained mirror at
`supabase/functions/_shared/featureFlags.ts` (Rule #24 -- not added to
`FILES_TO_SYNC`; was created from scratch this session).

#### Migration applied

`20260518120000_add_reshape_and_lesson_type_to_lessons.sql`:
- `reshape_of uuid REFERENCES lessons(id) ON DELETE SET NULL` (nullable)
- `lesson_type text NOT NULL DEFAULT 'full' CHECK (lesson_type IN ('full','short'))`

Applied via `npx supabase db push --linked`. All existing rows backfill
to `lesson_type='full'`. Types regenerated via
`npx supabase gen types typescript --linked`. The regenerated types
file now also includes the previously-missing `shaped_content`,
`shape_id`, and `visibility` columns flagged by the May 17 PROJECT_MASTER
carry-forward.

#### Files touched

1. `src/constants/featureFlags.ts` -- added RESHAPE_RULE.
2. `src/constants/contracts.ts` -- added `reshape_of` and `lesson_type`
   to the `Lesson` interface.
3. `src/constants/freshnessOptions.ts` -- ONE-CHARACTER FIX: re-export
   from `'./seriesConfig'` -> `'./seriesConfig.ts'` so the Deno bundler
   used by `supabase functions deploy` can resolve it. Pre-existing
   latent bug exposed when the new generate-lesson redeploy hit it.
4. `src/hooks/useLessons.tsx` -- added `addReshapedLesson(lesson)` that
   prepends to local state (mirrors the `createLesson` add pattern).
5. `src/hooks/useReshapeLesson.tsx` -- `ReshapeLessonResult.lesson?: Lesson`
   added; hook returns the new row from the Edge Function response.
6. `src/components/dashboard/EnhanceLessonForm.tsx` -- destructured
   `addReshapedLesson` from useLessons; imported `RESHAPE_RULE`; gated
   the Reshape button by `reshape_of`, `lesson_type`, and `canGenerate`;
   wired `addReshapedLesson(result.lesson)` into the reshape handler.
   Existing reshape viewer toggle preserved (Rule R6).
7. `src/components/dashboard/LessonLibrary.tsx` -- filter reshape
   children out of the displayLessons map; built
   `reshapeChildrenByParent` from unfiltered lessons; rendered "View
   Reshaped (Shape)" link per child that calls `onViewLesson(child)`;
   added `reshape_of` guard to the shape badge so original lessons no
   longer display a shape badge sourced from legacy parent-row
   `shape_id`; imported `Layers` icon.
8. `src/integrations/supabase/types.ts` -- regenerated post-migration.
9. `supabase/functions/_shared/featureFlags.ts` -- NEW hand-maintained
   file (Rule #24). Exports RESHAPE_RULE.
10. `supabase/functions/_shared/contracts.ts` -- auto-synced via
    `npm run sync-constants` (Rule #23, contracts.ts is in FILES_TO_SYNC).
11. `supabase/functions/_shared/freshnessOptions.ts` -- auto-synced.
12. `supabase/functions/generate-lesson/index.ts` -- added `lesson_type`
    to the lessons INSERT
    (`isTrialLesson && !isFullTrialLesson ? 'short' : 'full'`).
13. `supabase/functions/reshape-lesson/index.ts` -- full rewrite per
    Rule R3. Anti-duplicate prior-reshape lookup + suffix added at the
    end of the session. Timeout 90s -> 180s after a smoke-test timeout
    on a real reshape. (Old 90s constant was pre-existing.)
14. `supabase/migrations/20260518120000_add_reshape_and_lesson_type_to_lessons.sql`
    -- new migration.

#### Deploys this session

- Frontend pushed to `origin/main` as commit `8335e19` (Netlify
  auto-build).
- Migration applied via `npx supabase db push --linked`.
- Edge Function `reshape-lesson` deployed three times via
  `npx supabase functions deploy reshape-lesson --use-api`: initial,
  after timeout bump, after anti-duplicate logic.
- Edge Function `generate-lesson` deployed once via
  `npx supabase functions deploy generate-lesson --use-api` (after the
  bundler fix to `freshnessOptions.ts`).

#### Smoke test results

- Step 5 SQL verification passed -- new reshape lessons row has
  `lesson_type='full'`, `reshape_of` set to parent id, `shape_id` set,
  `source_type='reshape'`, title in `"[Shape Name]: [Original Title]"`
  format.
- Two product gaps surfaced during the test and fixed in-session:
  (a) reshape children showed up as standalone cards in the Lesson
  Library grid -- filtered out and replaced with the "View Reshaped"
  link on the parent card;
  (b) the Reshape button was visible on reshape rows -- now hidden
  entirely;
  (c) original lesson cards still showed legacy shape badges -- badge
  condition now requires `reshape_of` to be set.
- Anti-duplicate verification deferred to Session B / next opportunity
  -- Anthropic API was returning 529 errors during the planned second
  reshape; Lynn instructed to stop API retries and close the session.
- Steps 6 / 7 / 8 (parent-row unchanged check, billing increment
  verification, short-lesson gate UI test) were not completed before
  Lynn stopped retries. The parent-row preservation is enforced by
  Rule R6 in the Edge Function code (reshape never writes to parent).
  The short-lesson gate is enforced in the frontend button render
  block and in the Edge Function pre-AI gate.

#### Verified before push

- `npm run build` clean -- 3940 modules, ~23s, zero TypeScript errors.
- ASCII guard clean -- 0 non-ASCII bytes across all 11 hand-authored
  files (plus the 3 auto-synced backend mirrors and the regenerated
  types.ts).
- BRANDING duplicate-import sweep: 4 candidate matches by file basename
  (Header.tsx, Footer.tsx, Admin.tsx, tenantConfig.ts) -- each
  inspected, each has exactly one BRANDING import per file (false
  positives from files of the same basename in different folders).
- `npm run sync-constants` ran cleanly (14/14 files synced).
- Migration applied to live DB before Edge Function deploys.

#### Rule satisfaction checklist

- Rule #1 (verify file contents): all edits followed targeted reads.
- Rule #2 (complete solutions): no partial fixes.
- Rule #4 (dependency chain): migration applied before functions
  deployed; types regenerated before frontend build.
- Rule #5 (npm run build clean before deploy): four clean builds this
  session, last one at session close.
- Rule #20 (migrations CLI): migration written, applied via
  `npx supabase db push --linked`. Never used Dashboard SQL editor.
- Rule #22 (accessibility): Reshape button locked state uses
  `aria-disabled`, decorative icons `aria-hidden="true"`, locked items
  stay focusable, lock reason in `aria-label` and tooltip.
- Rule #23 (sync-constants): `contracts.ts` was edited; sync ran twice
  this session (after the contracts edit and after the
  `freshnessOptions.ts` bundler fix).
- Rule #24 (hand-maintained _shared/): `_shared/featureFlags.ts`
  created hand-maintained, NOT added to FILES_TO_SYNC.
- Rule R3 (limit check BEFORE Anthropic call): enforced -- parent
  load, RESHAPE_RULE gate, admin check, limit check, then trial gate,
  then prior-reshape lookup, then metrics insert, then Claude call.
- Rule R6 (no parent-row writes from reshape): enforced -- new lesson
  row only.

#### Traps encountered

1. **Bundler bug pre-existing in `freshnessOptions.ts`** -- the
   re-export `from './seriesConfig'` (no `.ts`) broke
   `supabase functions deploy` for any function transitively importing
   freshness (generate-lesson). Frontend tsc/vite tolerate bare relative
   imports; Deno does not. Fix: one-character `.ts` extension.
2. **Reshape Anthropic call timed out at 90s** on the first smoke test
   on a real full lesson. Bumped `RESHAPE_TIMEOUT_MS` to 180000 to
   match the safety envelope of generate-lesson (120s) plus headroom.
   Pre-existing constant from the old function -- not a regression
   introduced this session.
3. **Same-shape duplicate output** -- two Story-Driven reshapes of the
   same lesson produced word-for-word identical compositions. Fixed by
   appending an anti-duplicate instruction to the system prompt when a
   prior `(parent, shape)` reshape is found in the database.
4. **`theology_profile_id` not on lessons table** -- contracts.ts has
   it on the `Lesson` interface, and PROJECT_MASTER previously flagged
   it as missing from `types.ts`. Live schema confirmed it is NOT a
   column on the lessons table at all. The plan was adjusted to NOT
   include it in the reshape INSERT (filters carry it instead).

#### Commits

- `8335e19` -- FEATURE: Reshape-as-lesson foundation (14 files; 548
  insertions, 146 deletions).
- (DOCS commit, this session) -- PROJECT_MASTER.md.

#### Deploy method

Manual `git add` of the 14 task files explicitly named, then `git commit`
and `git push origin main`. `deploy.ps1` bypassed because the two
untracked diagnostic SQL files at repo root
(`DIAGNOSE_AUTH_FUNCTIONS.sql`, `DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql`)
must remain untracked, and `deploy.ps1` does `git add .` which would
have swept them in. Memory `feedback_deploy_script_stages_all` already
documents this pattern.

#### Carry-forward

See WHAT'S NEXT at the top of this file.

---

### May 17, 2026 -- Session 2: Admin delete for published blog posts in BlogPreviewPanel

#### Summary

Single-session task. Extended `BlogPreviewPanel` to show published posts
in a separate section below the existing drafts grid. Each published post
card renders only a destructive Delete button -- no Preview, Edit, or
Publish actions. Drafts UI is unchanged. Both the Marketing Panel's Blog
Preview tab (`/admin/marketing`) and the standalone admin URL
(`/admin/blog-preview`) get the new section automatically because they
share the same panel component.

This closes the loop on blog post lifecycle management: drafts could
already be published or deleted from the admin UI; now published posts
can also be deleted from the admin UI without dropping into SQL.

Picked up mid-session from a prior interrupted run -- both files
(`BlogPreviewPanel.tsx`, `blogConfig.ts`) already had the implementation
in place when this session resumed. Work this session was: verify
completeness, run the build, hold for Lynn's localhost approval, and
deploy.

#### Files touched

- `src/constants/blogConfig.ts` -- added three strings to
  `BLOG_CONFIG.admin`: `publishedSectionTitle` ("Published posts"),
  `confirmDeletePublishedTitle` ("Delete this published post?"),
  `confirmDeletePublishedBody` ("This permanently removes the post from
  the public blog. This cannot be undone.").
- `src/components/admin/BlogPreviewPanel.tsx` -- added `PublishedPostItem`
  component (image + title + slug + Delete-only button); added `published`
  state, `loadingPublished` state, and `fetchPublished()` query
  (`published = true`, ordered by `published_at` desc); extended
  `handleDelete(id, kind = "draft")` to switch confirm copy and refetch
  target by kind; `renderList()` appends a `<section aria-label="Published
  posts">` below the drafts grid, gated on `published.length > 0` so the
  section is hidden entirely when empty.

#### Architecture notes

- SSOT respected: all UI strings live in `BLOG_CONFIG.admin`. Zero
  hardcoded copy in the panel.
- Frontend-drives-backend respected: delete still goes through the same
  Supabase RLS gate (`has_role('admin')`) on the `blog_posts` table --
  no schema change, no policy change.
- Accessibility: the published-post Delete button uses
  `aria-disabled` (not `disabled`) while in flight, has an
  `aria-label="Delete published post: {title}"` for screen readers, and
  the icon is `aria-hidden="true"`. The section has
  `aria-label="Published posts"` so screen readers announce it as a
  named landmark separate from the drafts grid.
- Conditional rendering: empty published list hides the section
  completely rather than collapsing via CSS.

#### Verification

- `npm run build` -- clean. Zero errors. 21.13s.
- ASCII guard -- clean. Both files scanned, zero non-ASCII bytes.
- Localhost: Lynn verified the section appears below drafts, shows only
  the Delete button per published card, and the delete confirm dialog
  shows the new copy. Hold-before-deploy honored.

#### Commits

- `fc01a53` -- FEATURE: Admin delete for published blog posts in
  BlogPreviewPanel (2 files: `BlogPreviewPanel.tsx`, `blogConfig.ts`;
  162 insertions, 35 deletions).
- (DOCS commit, this session) -- PROJECT_MASTER.md.

#### Deploy method

Manual `git add` of only the two task files, then `git commit` and
`git push origin main`. `deploy.ps1` was intentionally bypassed because
the two untracked diagnostic SQL files in the repo root
(`DIAGNOSE_AUTH_FUNCTIONS.sql`, `DIAGNOSE_DUPLICATE_AUTH_ACCOUNTS.sql`)
must stay untracked, and `deploy.ps1` does `git add .` which would have
swept them in. Memory `feedback_deploy_script_stages_all` already
documents this pattern.

#### Memory written this session

- `feedback_powershell_only` -- Always use the PowerShell tool, never
  the Bash tool, for terminal commands on Lynn's Windows machine. Bash
  invocations of PowerShell cmdlets fail and produce noisy errors.

#### Carry-forward

See WHAT'S NEXT at the top of this file.

---

### May 17, 2026 -- Session 1: Inline WYSIWYG lesson editing

#### Summary

Two-session task. Session 1 was diagnostic + plan; Session 2 was
implementation. Net result: teachers can now click "Edit Lesson" in the
viewer, edit the title and body in a Quill rich-text editor, and save
back to the same `lessons` row. No new route. No new component file.
No change to LessonLibrary, LessonExportButtons, or routes.ts/App.tsx.

Session 1 surfaced one architectural deviation from the prompt's
assumption: the prompt directed implementation into `LessonLibrary.tsx`,
but the actual read-only viewer (with `LessonExportButtons` at L2335)
lives in `EnhanceLessonForm.tsx`. The card's "View" button delegates to
`Dashboard.tsx` via `onViewLesson`, which sets `selectedLesson` and
passes it to `EnhanceLessonForm` as `viewingLesson`. Lynn confirmed the
file target should follow the Session 1 finding rather than the prompt
assumption; all other Session 2 rules (Quill module-scope config,
conversion-layer remedies, accessibility, ASCII guard, BRANDING sweep)
remained in force.

#### Conversion-layer decisions

- **marked** v18.0.3 (installed this session). `setOptions()` was
  removed in v5+, so the per-call form is required:
  `marked.parse(md, { gfm: true, breaks: false })`. The Session 2
  prompt's alternate-form options (`headerIds`, `mangle`) no longer
  exist in v18 -- v18 defaults already match the desired behavior.
- **turndown** v7.2.4 (installed this session), `@types/turndown` v5.0.6
  dev dep. Default import worked under TS `moduleResolution: bundler`
  with no fallback to namespace import. Configured at module scope with
  `headingStyle: 'atx'`, `bulletListMarker: '-'`, `codeBlockStyle: 'fenced'`.
  Added a custom `blankReplacement` rule that collapses Quill's `<br>`
  to a single newline -- without it, paragraphs round-trip with double
  blank lines.
- **react-quill** already at v2.0.0 (no install). Configured per Quill
  Rule Q1: `LESSON_EDITOR_FORMATS` and `LESSON_EDITOR_MODULES` declared
  at module scope (reference-stable across renders, avoids the
  mount-order trap). `clipboard.matchVisual: false` so paste from
  Word/Google Docs does not inject inline styles that turndown can't
  cleanly convert.

#### Two traps fixed during localhost testing

1. **Save appeared to do nothing.** Diagnostic logging confirmed the
   Supabase write succeeded and the local `lessons` array updated, but
   the viewer kept showing old content. Root cause: `viewingLesson` is
   a prop passed from `Dashboard.tsx`'s `selectedLesson` state -- a
   frozen snapshot that does not auto-sync when the `useLessons` hook
   in `EnhanceLessonForm` updates its own state. Fix: added an
   `onLessonContentUpdated` callback prop wired by Dashboard to merge
   the saved updates into its own `selectedLesson` state. Mirrors the
   existing `onLessonShapeUpdated` pattern (declared in props but never
   wired -- separate gap, not addressed this session).
2. **Title input changes were invisible.** The displayed title at the
   top of the viewer comes from `extractLessonTitle(original_text)`
   which reads a "Lesson Title: ..." line embedded in the markdown body,
   not from `currentLesson.title`. Editing the title input updated the
   DB column but left the body's embedded title unchanged, so the
   displayed title did not refresh. Fix: a `syncTitleInBody()` helper
   rewrites the body's "Lesson Title:" line on save to match the title
   input; the Edit Lesson button also now pre-fills the title input
   from the body's extracted title so the input shows what the user
   actually sees.

#### Link rendering carry-on (third localhost issue)

After save worked, Lynn reported that Quill's link button produced
markdown like `[_text_](https://...)` but the viewer rendered the raw
markdown rather than a clickable link. Root cause: neither the
structured `formatSectionContent()` path nor the non-structured
fallback path converted `[text](url)` to `<a>` tags, and neither
converted single-underscore / single-asterisk italics to `<em>`.
Added a `convertInlineMarkdown()` helper that handles links (with
`target="_blank"`, `rel="noopener noreferrer"`, quote-escaped URL),
italics, and bold. Both display paths now run through it. Bold is
processed before single-asterisk italics so the helper never splits a
bold marker.

#### Files changed

- `src/constants/contracts.ts` -- added `updated_at?: string | null` to
  the `Lesson` interface.
- `src/hooks/useLessons.tsx` -- added `updateLessonContent(lessonId,
  { title?, original_text? })` with empty-string validation,
  destructive-toast error paths, and explicit `updated_at` stamping
  (the lessons table predates supabase/migrations/ so we can't confirm
  a server-side trigger; the explicit timestamp is harmless either way).
  Updates local lessons array on success. Exported alongside existing
  hook returns.
- `src/components/dashboard/EnhanceLessonForm.tsx` -- module-scope
  Quill config, marked/turndown helpers, `syncTitleInBody()`,
  `convertInlineMarkdown()`. Added `useLessons` import; destructured
  `updateLessonContent`. New state: `editingLessonId`, `editTitle`,
  `editContent`, `isSaving`, `editTitleRef`. Focus-management
  `useEffect` moves focus to the title input when edit mode opens.
  Existing `viewingLesson?.id` `useEffect` also clears edit state when
  switching/closing lessons. Added Edit Lesson button (Pencil icon)
  in the action row right after `LessonExportButtons`; Reshape button
  suppressed while editing. Edit UI is a ternary swap inside
  `<CardContent>` that replaces the read-only viewer with title `<Input>`
  + Quill editor + Save/Cancel. Added new prop
  `onLessonContentUpdated?: (lessonId, updates) => void` (mirrors
  `onLessonShapeUpdated`). Both display paths
  (`formatSectionContent` and the inline non-structured fallback) now
  run content through `convertInlineMarkdown()`.
- `src/pages/Dashboard.tsx` -- passes `onLessonContentUpdated` to
  `EnhanceLessonForm`; the callback merges updates into `selectedLesson`
  (id-matched) so `viewingLesson` refreshes after a save.
- `supabase/functions/_shared/contracts.ts` -- auto-sync mirror, updated
  via `npm run sync-constants` (Rule #23). Picked up the `updated_at`
  field addition.
- `package.json`, `package-lock.json` -- `marked@^18.0.3`,
  `turndown@^7.2.4`, `@types/turndown@^5.0.6` (dev).

#### Deploys this session

- Frontend pushed to `origin/main` (Netlify auto-build).
- No migrations applied this session.
- No Edge Functions deployed this session.

#### Verified before push

- `npm run build` clean, 3940 modules, ~24s, zero TypeScript errors
  (final build after all three traps fixed).
- BRANDING duplicate-import sweep: 4 candidate matches inspected, all
  false positives (regex matched `TenantBrandingPanel` / comments).
  Each flagged file has exactly one real `import { BRANDING }` line.
- ASCII guard: 0 non-ASCII chars on the four modified frontend files.
- `npm run sync-constants` ran cleanly (14/14 files synced).
- Lynn verified on `localhost:8080` and approved deploy after all three
  traps were fixed and link rendering worked end-to-end.

#### Rule satisfaction checklist

- Rule #1 (verify file contents): every edit followed a read of the
  exact target file first. Session 1 produced a full diagnostic report
  before any code landed.
- Rule #2 (complete solutions): all three fixes (snapshot prop refresh,
  title body sync, link rendering) were complete -- no partial patches.
- Rule #4 (dependency chain before deploy): all 7 file changes deploy
  together in one feature commit; the Dashboard callback is wired in
  the same commit as the EnhanceLessonForm prop it satisfies.
- Rule #5 (build before deploy): verified clean per above.
- Rule #14 (never present uncertain options): when the Session 2 prompt
  contradicted the Session 1 finding on file target, paused for
  explicit confirmation rather than guessing.
- Rule #16 (ASCII only): byte-level confirmed.
- Rule #22 (accessibility): every interactive element has aria-label;
  Pencil and Loader2 icons aria-hidden; explicit `<label htmlFor>` on
  title input and content editor; Save button uses `aria-busy` +
  `aria-disabled`; edit mode shown via conditional rendering (not
  display:none); focus moves to title input on edit open.
- Rule #23 (sync-constants after FILES_TO_SYNC change): ran after the
  `contracts.ts` change.
- Scope discipline (`feedback_frontend_only_scope`): manually staged
  only the 7 modified files, bypassing `deploy.ps1`'s `git add .` so
  the two untracked diagnostic SQL files (`DIAGNOSE_*.sql`) stayed
  out of the commit per prior carry-forward.

#### Commits

- (FEATURE commit, this session) -- 7 files: contracts.ts,
  useLessons.tsx, EnhanceLessonForm.tsx, Dashboard.tsx,
  `_shared/contracts.ts`, package.json, package-lock.json.
- (DOCS commit, this session) -- PROJECT_MASTER.md.

#### Carry-forward

See WHAT'S NEXT at the top of this file. Primary item: reshape-in-series
feature design.

#### Memory written this session

- `feedback_session1_findings_precedence` -- In two-session prompts,
  Session 1 diagnostic findings take precedence over Session 2 prompt
  file-target assumptions; flag the conflict first, then follow the
  finding.

---

### May 15, 2026 -- Session 1: Blog metadata SSOT + bot CRUD + gpt-image-1

#### Summary

Two pieces of work landed in one feature commit (`4257fbf`).

**Part A -- Blog post metadata (admin-visible, public-hidden).**
External bot integration (Tertius / OpenClaw) needs a place to store SEO/
AEO/social/images/structured_data metadata alongside each blog post.
Previously this data lived in HTML comments inside `content`. Added a
single nullable `metadata JSONB` column on `public.blog_posts`. Shape is
defined frontend-first as `PostMetadata` in `src/constants/blogConfig.ts`
with five allowed top-level keys: `seo`, `aeo`, `images`, `social`,
`structured_data`. Backend mirror (`supabase/functions/_shared/blogConfig.ts`)
exports `BLOG_TABLE`, `METADATA_ALLOWED_KEYS`, and a `validateMetadata()`
helper -- hand-maintained per Rule #24 (now appended to the rule's list).
Public-facing pages (`Blog.tsx`, `BlogPost.tsx`) query
`BLOG_CONFIG.columns.public` (excludes metadata). Admin preview
(`BlogPreviewPanel.tsx`) queries `BLOG_CONFIG.columns.admin` (includes
metadata), shows it in a collapsible read-only `<details>` pane below the
post body, and lets Lynn edit it as a JSON textarea with parse + allowed-
keys validation on save.

**Part B -- Edge Function extended to full CRUD.**
OpenClaw recommended creating `get-blog-post` and `update-blog-post` Edge
Functions. That was overruled per BLS architecture: admin already has full
CRUD via RLS-gated `supabase.from(...)` calls, and the bot only needs one
endpoint. `create-blog-post` was extended in place to handle all four
HTTP methods (GET by `?slug=`, POST, PUT partial-update, DELETE). The
function now returns the full post row (including metadata) on POST and
PUT success so Tertius can verify storage. Single auth path (`X-Blog-Api-Key`),
single CORS config, single shared mirror import.

**Part C -- generate-blog-image switched to GPT-Image-1.**
Carry-forward from May 14. The function previously called `dall-e-3` with
`response_format: "b64_json"`. Switched model to `gpt-image-1`, dropped the
unsupported `response_format` field, switched size to `1536x1024` and
quality to `medium`. Response parser now tries `b64_json` first and falls
back to fetching the `url` field so the function works regardless of which
return shape OpenAI sends. Storage bucket migration `20260514120000`
(idempotent) also applied this session.

#### Files changed

- `src/constants/blogConfig.ts` -- added `PostMetadata` interface,
  `BLOG_CONFIG.columns.public/admin`, `BLOG_CONFIG.metadata.allowedKeys`,
  extended `BlogPost` with optional `metadata` field.
- `supabase/functions/_shared/blogConfig.ts` (new) -- backend subset:
  `BLOG_TABLE`, `METADATA_ALLOWED_KEYS`, `validateMetadata()`, `PostMetadata`
  type. Hand-maintained per Rule #24.
- `CLAUDE.md` -- appended `blogConfig.ts` to Rule #24's hand-maintained list.
- `supabase/migrations/20260515120000_add_blog_post_metadata.sql` (new) --
  `ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS metadata JSONB` plus
  column comment. Applied via `npx supabase db push --linked`.
- `supabase/functions/create-blog-post/index.ts` -- full rewrite: GET handler
  by slug, PUT handler with partial-field update, POST now accepts/returns
  metadata, all responses with mutations return the full post row. Imports
  `BLOG_TABLE`, `validateMetadata`, `PostMetadata` from `_shared/blogConfig.ts`.
- `src/pages/Blog.tsx` -- replaced inline `SELECT_COLUMNS` literal with
  `BLOG_CONFIG.columns.public`.
- `src/pages/BlogPost.tsx` -- same SSOT switch.
- `src/components/admin/BlogPreviewPanel.tsx` -- uses
  `BLOG_CONFIG.columns.admin`, displays metadata in preview pane, adds
  metadata JSON textarea to edit form with `parseMetadataJson()`
  validation (mirrors backend `validateMetadata`).
- `supabase/functions/generate-blog-image/index.ts` (new in git, was
  uncommitted from May 14) -- gpt-image-1, 1536x1024 medium, b64_json/url
  fallback.
- `supabase/migrations/20260514120000_create_blog_images_bucket.sql` (new
  in git, was uncommitted from May 14) -- idempotent bucket + policies.

#### Deploys this session

- Migrations applied to live DB via `npx supabase db push --linked`:
  `20260514120000_create_blog_images_bucket`, `20260515120000_add_blog_post_metadata`.
- Edge Function `create-blog-post` deployed via
  `npx supabase functions deploy create-blog-post --project-ref hphebzdftpjbiudpfcrs`.
- Edge Function `generate-blog-image` deployed in three steps earlier in
  the session (model -> quality -> size + URL fallback). Each via
  `npx supabase functions deploy generate-blog-image --project-ref ...`.
- Frontend pushed to `origin/main` as commit `4257fbf` -- Netlify auto-build.

#### Verified before push

- `npm run build` clean (zero errors).
- `BLOG_API_KEY` already stored as a Supabase Edge Function secret
  (confirmed via `npx supabase secrets list`). No action needed for auth.
- Lynn verified Blog Preview and public Blog on `localhost:8080` and
  approved the deploy.

#### Architectural decisions worth remembering

- OpenClaw's spec violated SSOT and Frontend-Drives-Backend by proposing
  backend-defined metadata validation and two new Edge Functions. Lynn
  flagged this immediately; the plan was rewritten before any code landed.
  Single Edge Function with method-based branching is the BLS pattern for
  bot-facing endpoints (matches the existing POST/DELETE branching in
  `create-blog-post`).
- Column-list SSOT (`BLOG_CONFIG.columns.public/admin`) replaces three
  inline column-string literals across two public pages and one admin
  panel. New blog columns now require updating one constant, not three
  call sites.

---

### May 14, 2026 -- Session 1: Prevent duplicate unverified account creation

#### Summary

Database-only fix targeting orphaned/duplicate unverified Supabase auth
accounts. The original `handle_new_user()` trigger function ran on every
`auth.users` INSERT and unconditionally inserted a `public.profiles`
row -- with no check on `email_confirmed_at`. Because the partial
unique index on `auth.users.email` only enforces uniqueness when
`is_sso_user = false`, a double-submit on the signup form could land
two unverified `auth.users` rows for the same email, each accompanied
by a `public.profiles` row.

**The fix**: rewrite `handle_new_user()` to skip the profile INSERT
when `NEW.email_confirmed_at IS NULL`, then add a second path --
`create_profile_on_verification()` wired to a new
`on_email_verified_create_profile` AFTER UPDATE trigger -- that
inserts the profile only when `OLD.email_confirmed_at IS NULL AND
NEW.email_confirmed_at IS NOT NULL`. Both paths share an identical
INSERT (same columns, same defaults, `ON CONFLICT (id) DO NOTHING`),
so verified-from-the-start signups (OAuth, magic-link auto-confirm,
admin-created users) still get a profile through `handle_new_user()`
on the same INSERT transaction.

A second migration deletes `public.profiles` rows whose `auth.users`
parent is unverified AND older than 7 days. `auth.users` itself is
intentionally untouched -- that table is managed by Supabase Auth and
the migration runner must not delete from it; orphan auth rows are
purged via Dashboard or admin API.

#### Files changed

- `supabase/migrations/20260514000000_fix_handle_new_user_require_verification.sql`
  (new, 95 lines) -- rewrites `handle_new_user()`, adds
  `create_profile_on_verification()`, creates trigger
  `on_email_verified_create_profile`. Idempotent via `CREATE OR REPLACE`
  and `DROP TRIGGER IF EXISTS`.
- `supabase/migrations/20260514000001_cleanup_unverified_orphan_accounts.sql`
  (new, 24 lines) -- one-shot DELETE on `public.profiles` for orphan rows
  older than 7 days. Idempotent; rerun is a zero-row no-op.

#### Diagnostic findings (recorded for future sessions)

- `auth.users` has three Dashboard-configured triggers (none of them
  in `supabase/migrations/` until this commit):
  - `on_auth_user_created` -> `handle_new_user()` -- fires AFTER
    INSERT, creates profile.
  - `on_auth_user_email_update` -> `sync_user_email()` -- fires on
    email change, syncs `profiles.email`. Unrelated to this fix.
  - `on_email_verified` -> `add_user_to_email_sequence()` -- fires
    when `email_confirmed_at` transitions NULL -> NOT NULL. Writes
    only to `email_sequence_tracking`. Does NOT create a profile -- a
    latent gap that the original always-create `handle_new_user()`
    masked.
- Trigger firing order on `auth.users` UPDATE verified safe in this
  session. `on_email_verified` fires alphabetically BEFORE the new
  `on_email_verified_create_profile`. Confirmed
  `add_user_to_email_sequence()` reads only `NEW.id`, `NEW.email`,
  and `NEW.raw_user_meta_data` from the trigger event -- it does NOT
  SELECT from `public.profiles`, so the new trigger sitting "later"
  in firing order is harmless. No rename needed.
- `public.profiles` has NO `email` column. Profiles relate to auth
  via `id` FK; email is read from `auth.users` when needed (e.g.
  existing RLS policies do
  `SELECT email FROM auth.users WHERE id = auth.uid()`). An "add
  unique constraint on profiles.email" path was rejected during
  diagnosis -- the column doesn't exist and adding it would be a
  bigger schema change with backfill/sync implications.
- `auth.users.email` has only a partial unique index that excludes
  SSO users. This is Supabase's default and explains the race window
  the original task was trying to plug.
- Pre-fix population: 4 unverified `auth.users`, all with profile
  rows, 1 older than 7 days. Migration 2 deleted that one orphan
  profile.
- Pre-fix duplicate-email count: 0. Prior duplicates (Michael E.
  Brice) had already been resolved manually. Going forward the new
  trigger flow prevents new duplicates regardless.

#### Why this matters

- Closes the duplicate-unverified-profile race at its root: an
  unverified `auth.users` row can no longer have a matching
  `public.profiles` row, so race-created duplicate auth rows can't
  manifest as duplicate profile rows downstream.
- Hardens the verified-user flow: profile creation is now guaranteed
  on the verification transition, not just on signup. Closes the
  latent gap where `add_user_to_email_sequence()` was the only thing
  firing on verify and was never going to create a profile.
- Preserves OAuth / admin-created paths: verified-on-INSERT signups
  still get their profile via `handle_new_user()` because the guard
  only short-circuits when `email_confirmed_at IS NULL`.

#### Rule satisfaction checklist

- Rule #1 (verify file contents): two read-only diagnostic SQL
  scripts run against the live DB before writing either migration;
  verbatim `handle_new_user()` body fetched and reviewed before the
  rewrite.
- Rule #2 (complete solutions): both migrations are complete,
  self-contained, and idempotent. No partial fixes.
- Rule #5 (npm run build): clean, 3938 modules, 25.13s, zero
  TypeScript errors. Build is unrelated to DB migrations but verified
  per protocol.
- Rule #14 (never present uncertain options): paused twice during
  diagnosis -- once to verify which trigger/function actually handled
  profile creation, once to fetch the function body before rewriting.
  Avoided guessing at the INSERT column list.
- Rule #16 (ASCII only): byte-level scan confirmed zero non-ASCII
  bytes and no BOM in both migration files; pre-commit ASCII guard
  passed cleanly.
- Rule #20 (migration CLI): both migrations applied via
  `npx supabase db push --linked`. No Dashboard SQL editor usage.
  Verified the migration was not already applied before push (brand
  new timestamps, never seen by remote).
- Scope discipline (feedback memory): manually staged only the two
  migration files, bypassing `deploy.ps1`'s `git add .`. Diagnostic
  SQL artifacts left untracked locally.

#### Commits

- `44492d0` -- FIX: Block profile creation for unverified signups +
  clean up orphans. 2 files changed, +119 insertions.

#### Carry-forward

See WHAT'S NEXT at the top of this file. Two follow-ups added
(recurring-cleanup decision, untracked diagnostic SQL files). The
trigger-firing-order question was raised mid-session and verified
safe within the session -- no follow-up needed.

---

### May 13, 2026 -- Session 1: Build Lesson sidebar -- clear selectedLesson on tab nav

#### Summary

Surgical follow-up to the April 13 fix (commit `7a19527`). That commit
made the Build Lesson sidebar click trigger a tab switch when already on
`/dashboard` (added `replace: true` to the `navigate()` call and switched
the `useEffect` deps from `[location.state]` to `[location]`). It fixed
the tab-switch path but did not address one remaining failure mode:

**The bug**: User opens a lesson from the Lesson Library, which sets
`selectedLesson` and switches to the `enhance` tab. The
`EnhanceLessonForm` renders in viewing mode because
`viewingLesson={selectedLesson}` is truthy. The user clicks Build Lesson
in the sidebar -- navigation fires, the `useEffect` re-runs,
`setActiveTab('enhance')` is a no-op (already on enhance), but
`selectedLesson` is never cleared. Result: the lesson view stays on
screen and Build Lesson appears to do nothing.

**The fix**: In Dashboard.tsx's location-state `useEffect`, when
`state.tab` is set AND `state.viewLessonId` is NOT set (i.e. a plain
sidebar tab nav, not a Series-Library "view lesson" deep-link), also
clear `selectedLesson`, `viewOrigin`, and `originSeriesId`. Mirrors the
`clearViewingOnClick` logic in `handleTabChange` that was already
applied for direct Tabs-component user clicks (which the sidebar nav
bypasses by writing `activeTab` directly via state).

#### Files changed

- `src/pages/Dashboard.tsx` -- added a 5-line branch inside the
  existing `useEffect` at line 101. No new effects, no new state, no
  changes to AppShell, sidebarConfig, or routes.

#### Diagnostic findings (recorded for future sessions)

- All four dashboard tabs (`buildLesson`, `lessonLibrary`,
  `devotionalLibrary`, `seriesLibrary`) are configured in
  `sidebarConfig.ts` as **tab items** (`tabValue: ...`), not route
  items. They flow through AppShell's `handleItemClick` tab-item
  branch, which calls
  `navigate(ROUTES.DASHBOARD, { state: { tab: ... }, replace: true })`.
- Route items (e.g. Marketing, Admin, Publish) render as `<Link>` and
  do NOT pass any state. This is fine because those routes don't read
  `location.state`.
- The Series-Library lesson view path uses `state.viewLessonId` and is
  intentionally preserved -- the new branch only fires when
  `viewLessonId` is absent.

#### Why this matters

Lesson viewing is not a separate route. `EnhanceLessonForm` switches
between "build form" and "view lesson" modes based on the
`viewingLesson` prop. Any sidebar tab nav that doesn't clear
`selectedLesson` will appear to do nothing for users currently in
viewing mode. The fix makes sidebar nav consistent with the existing
"click a Tabs trigger" behavior.

#### Rule satisfaction checklist

- Rule #1 (verify file contents): all four target files read in full
  before any edit.
- Rule #2 (complete solutions, no partial fixes): single coherent
  change, build verified clean.
- Rule #5 (npm run build before deploy): clean, 3938 modules, 25.70s,
  zero TypeScript errors.
- Rule #22 (accessibility): no UI markup changed; existing ARIA on
  sidebar buttons and Tabs is untouched.

#### Commits

- `838cc8a` -- FIX: Build Lesson sidebar clears selectedLesson so
  lesson view closes when switching tabs. 1 file changed, +7 lines.

#### Carry-forward

See WHAT'S NEXT at the top of this file. No new follow-ups from this
session.

---

### May 11, 2026 -- Session 3: Marketing Panel with Blog Preview tab + shared BlogPreviewPanel

#### Summary

Three pieces of related work.

1. **New admin-only page at `/admin/marketing`.** Marketing Panel mirrors
   the Admin Panel pattern (own `<AppShell>`, own admin gate via
   `has_role()` RPC, internal shadcn `<Tabs>`). Four tabs:
   Blog Preview (active), Amp Articles (disabled), Newsletter (disabled),
   Email Marketing (disabled). The three unbuilt tabs use shadcn's
   `disabled` prop on `<TabsTrigger>` so screen readers announce the
   "coming soon" state and the tabs are excluded from arrow-key navigation
   per the WAI-ARIA tabs pattern. Default tab is Blog Preview so the page
   opens to actionable content.

2. **Extracted shared component `BlogPreviewPanel`.** The body of the
   previous `AdminBlogPreview.tsx` (list + preview + edit + publish +
   delete + Quill editor) moved into
   `src/components/admin/BlogPreviewPanel.tsx`. The component takes an
   optional `showHeader` prop so the embedded copy inside the Marketing
   Panel tab does not render its own `<h1>` (the page's
   `<h1>Marketing Panel</h1>` stays the only h1 -- clean heading
   hierarchy). `AdminBlogPreview.tsx` slimmed to a thin wrapper that
   handles the admin gate and renders
   `<AppShell><BlogPreviewPanel /></AppShell>`. The standalone
   `/admin/blog-preview` URL is intentionally kept alive so Tertius's
   posted links continue to work without change.

3. **Sidebar: single "Marketing" item inside Platform Admin.** Added one
   new sidebar item `marketing` (Megaphone icon) inside the existing
   `platformAdmin` section, alongside `adminPanel` and `toolbeltAdmin`.
   Routes to `ROUTES.ADMIN_MARKETING`. Also reordered
   `SIDEBAR_BY_ROLE[platformAdmin]` so the admin section sits below
   user-facing sections and above `account`. New order:
   `buildAndPrepare, myTeachingTeam, ministryOversight, extras,
   platformAdmin, account`.

#### Sidebar layout policy (established this session)

Two-zone sidebar layout for the platformAdmin role:
- **Upper zone (user-facing today or by subscription):** Build & Prepare,
  My Teaching Team, Ministry Oversight, Resources / Teacher Tools (the
  `extras` section).
- **Lower zone (admin-only):** Platform Admin (Administrator Panel,
  Manage Toolbelt, Marketing).
- **Bottom (universal):** Account -- profile, sign out. Always last.

Non-admin roles unchanged.

#### Files changed

- `src/constants/routes.ts` -- added
  `ADMIN_MARKETING: '/admin/marketing'`.
- `supabase/functions/_shared/routes.ts` -- synced via
  `npm run sync-constants` (Rule #23).
- `src/App.tsx` -- mounted `AdminMarketing` at
  `ROUTES.ADMIN_MARKETING` inside `<ProtectedRoute>` (Rule #3).
- `src/components/admin/BlogPreviewPanel.tsx` -- new. Shared draft
  list/preview/edit/publish/delete logic, ReactQuill editor, custom
  UPPERCASE button, featured-image dedupe on render. No `<AppShell>`,
  no admin gate (each parent page handles its own).
- `src/pages/AdminBlogPreview.tsx` -- replaced (was 854 lines; now ~66).
  Admin gate via `has_role()` then `<AppShell><BlogPreviewPanel /></AppShell>`.
  Behavior at the standalone URL is unchanged for users.
- `src/pages/AdminMarketing.tsx` -- new. Same admin-gate pattern;
  `<AppShell>` with `<Tabs defaultValue="blog-preview">`; four
  `<TabsTrigger>` and four `<TabsContent>`; Blog Preview tab renders
  `<BlogPreviewPanel showHeader={false} />`; other three render a
  `<ComingSoonPanel>` placeholder.
- `src/constants/sidebarConfig.ts` -- added `marketing` SidebarItem
  (Megaphone icon, `route: ROUTES.ADMIN_MARKETING`,
  `tierGate: 'always'`); placed inside `platformAdmin` section's items
  array; reordered `SIDEBAR_BY_ROLE[platformAdmin]` per the two-zone
  layout policy.

#### SSOT compliance

- Route declared once in `routes.ts`, mirrored to `_shared/` per Rule #23,
  mounted in `App.tsx` per Rule #3.
- Sidebar consumes `getSidebarForRole(effectiveRole)` exclusively. The
  new item is added through `SIDEBAR_ITEMS` + `SIDEBAR_SECTIONS` SSOT
  plumbing -- no hardcoded JSX in AppShell.
- All blog-draft copy still resolves through `BLOG_CONFIG.admin.*`
  (moved with the component into `BlogPreviewPanel.tsx`).
- Marketing Panel page strings (heading, subhead, "Coming soon" blurbs)
  are inline literals -- if a `marketingConfig.ts` SSOT becomes
  necessary later, those are easy to extract.

#### Rule satisfaction checklist

- Rule #3 (route in routes.ts AND App.tsx): satisfied; both updated in
  this commit.
- Rule #22 (accessibility):
  * Disabled tabs use shadcn's `disabled` prop on `<TabsTrigger>`, which
    sets `aria-disabled="true"` and excludes the tab from roving-tabindex
    arrow-key navigation per the Radix Tabs accessible pattern.
  * Each disabled trigger has explicit `aria-label="<name>, coming soon"`.
  * `<TabsList>` has `aria-label="Marketing review channels"`.
  * All tab and decorative icons have `aria-hidden="true"`.
  * Default tab is `blog-preview` so the page opens to actionable content.
  * The embedded `<BlogPreviewPanel showHeader={false} />` suppresses its
    own `<h1>` so the Marketing Panel's `<h1>Marketing Panel</h1>` stays
    the only h1.
- Rule #23 (sync after touching FILES_TO_SYNC): `routes.ts` is in the
  sync list -- `_shared/routes.ts` updated via `npm run sync-constants`
  in the same commit.

#### Decisions deliberately deferred

- **Deep-link query string for non-default tab** (e.g.,
  `?tab=amp-articles`). Not needed until at least one of the other
  three tabs becomes functional.
- **SSOT for Marketing Panel tab labels and "Coming soon" blurbs.**
  Five literal strings inline in `AdminMarketing.tsx`. Lift to a
  `marketingConfig.ts` SSOT only if a content team starts editing them.
- **Amp Articles, Newsletter, Email Marketing panel components.** Each
  will replace its current `<ComingSoonPanel>` in `AdminMarketing.tsx`
  and have `disabled` removed from its `<TabsTrigger>`. Built one
  channel at a time as Lynn is ready.

#### Carry-forward

See WHAT'S NEXT at the top of this file.

#### Commits

- `dfc929b` -- FEATURE: Marketing Panel at /admin/marketing with shared
  BlogPreviewPanel component and sidebar Marketing item. 9 files changed,
  +1176 / -794. The 794 deletions are almost all from
  `AdminBlogPreview.tsx` shrinking from 854 lines to a 66-line wrapper
  -- the same logic now lives in `BlogPreviewPanel.tsx`.

---

### May 11, 2026 -- Session 2: Admin blog preview page, WYSIWYG editor, featured-image dedupe

#### Summary

Three pieces of related work in one commit (`77d42b9`).

1. **New admin-only page at `/admin/blog-preview`.** Lists every
   unpublished draft (`published = false`) for the signed-in admin
   user. Each row offers Preview, Edit, Publish, and Delete. Preview
   renders the draft using the same `prose` styles as the public
   blog post page. Publish flips `published` to `true` and stamps
   `published_at = now()`. Delete confirms with an inline modal
   before removing the row. Edit opens a WYSIWYG editor backed by
   `react-quill` (already in dependencies via shadcn).

2. **WYSIWYG editor with custom UPPERCASE toolbar button.** Quill
   toolbar is locked to a minimal allowlist (headers, bold, italic,
   underline, lists, blockquote, link) plus a custom `.ql-uppercase`
   button that uppercases the current selection in place. ARIA
   label and tooltip attached imperatively in a `useEffect` keyed
   on `mode === 'edit'`. Custom CSS tightens default Quill spacing
   so the editor visually matches the rendered blog post.

3. **Featured-image dedupe.** Tertius (and some older posts) embed
   the featured image as the first content block, causing it to
   render twice -- once as the hero, once at the top of the body.
   Added `stripLeadingFeaturedImage()` in two places:
   `BlogPost.tsx` (frontend, applied at render time so old posts
   self-heal) and `create-blog-post/index.ts` (Edge Function,
   applied at write time so future posts arrive clean). Both
   implementations match a leading `<img>` (bare or wrapped in
   `<p>`) and strip it when the `src` (query-string ignored)
   matches `featured_image_url`. The two copies are kept in
   lockstep by comment.

#### Files changed

- `src/pages/AdminBlogPreview.tsx` -- new (854 lines). List, preview,
  edit, publish, delete flow. React Quill editor with custom
  uppercase button. Admin role gate via `has_role()` RPC.
- `src/App.tsx` -- mounted `AdminBlogPreview` at
  `ROUTES.ADMIN_BLOG_PREVIEW` inside `<ProtectedRoute>`.
- `src/constants/routes.ts` -- added
  `ADMIN_BLOG_PREVIEW: '/admin/blog-preview'`.
- `supabase/functions/_shared/routes.ts` -- mirror of the same
  entry per Rule #23 sync policy (routes.ts is in `FILES_TO_SYNC`).
- `src/constants/blogConfig.ts` -- added a new `admin: { ... }`
  block with every label, empty state, button, and confirm string
  the new page uses. SSOT preserved -- zero hardcoded copy in
  `AdminBlogPreview.tsx`.
- `src/pages/BlogPost.tsx` -- added `stripLeadingFeaturedImage()`
  and applied to `dangerouslySetInnerHTML`. No other behavior
  changes.
- `supabase/functions/create-blog-post/index.ts` -- added
  matching `stripLeadingFeaturedImage()` and applied to incoming
  payload before insert/update. Comment in both files cross-
  references the other so they stay aligned.
- `supabase/migrations/20260511180000_blog_admin_policies.sql` --
  two new RLS policies on `blog_posts`:
  * `"Admin can read all blog posts"` (SELECT, authenticated, gated
    by `public.has_role(auth.uid(), 'admin')`)
  * `"Admin can manage blog posts"` (ALL, authenticated, same
    `has_role()` gate, with USING + WITH CHECK)
  Pre-existing public-read and service-role policies left
  untouched. Applied via `npx supabase db push --linked` per
  Rule #20.

#### SSOT and Frontend-Drives-Backend compliance

- Every UI string in `AdminBlogPreview.tsx` resolves through
  `BLOG_CONFIG.admin.*`. Zero hardcoded labels or empty-state copy.
- Route declared once in `routes.ts`, mirrored to `_shared/` per
  Rule #23, mounted in `App.tsx` per Rule #3.
- Branding colors flow through `BRANDING` and Tailwind variables.
  Quill toolbar accent (`#3D5C3D` in the blockquote CSS) is the
  only literal hex -- carry-forward note below.
- Admin gate uses the same `has_role(auth.uid(), 'admin')` RPC
  used by every other admin migration (e.g.
  `20250120_transfer_requests.sql`). No new role model.
- Dedupe logic implemented at both the edge boundary (write-time)
  and the rendering boundary (read-time). Either layer alone would
  be sufficient for new posts, but the rendering-side copy is
  required to clean up posts already in the database.

#### Rule satisfaction checklist

- Rule #3 (route in routes.ts AND App.tsx): satisfied; verified
  both files in the same commit.
- Rule #20 (migrations via CLI, not Dashboard): satisfied; SQL
  applied via `npx supabase db push --linked`.
- Rule #22 (accessibility): Quill toolbar uppercase button has
  both `aria-label` and `title`. All Quill native buttons retain
  their default ARIA. Confirm dialog has explicit "Yes, delete" /
  "Keep draft" buttons (no destructive default). Status toasts
  use the existing toast system which renders `role="status"`.
- Rule #23 (sync after touching FILES_TO_SYNC): `routes.ts` is in
  the sync list -- `_shared/routes.ts` updated in same commit.

#### Trap encountered and resolved

`react-quill`'s `Quill.import('ui/icons')` registration for a
custom toolbar button must run **before** the `<ReactQuill>`
component first mounts. Registering inside the component body
caused the toolbar to render the button label as raw text. Moved
the import + icon assignment to module-scope (top of file) so it
runs once on import. The same applies to the `formats` allowlist
and the toolbar `modules` config -- both now defined at module
scope as `quillFormats` and `quillModules`.

#### Decisions deliberately deferred

- **Admin sidebar entry for `/admin/blog-preview`.** Page is
  reachable today by typing the URL. Adding a sidebar item
  belongs in a UI pass, not this functional commit.
- **Bulk publish / bulk delete.** Out of scope. Single-row
  actions only for v1.
- **Quill `#3D5C3D` blockquote color literal.** Acceptable in
  injected CSS, but worth moving to a CSS variable sourced from
  `BRANDING.colors` when the next blog-styling pass happens.
- **Image upload from inside the editor.** Quill's image button
  is excluded from the toolbar allowlist. Featured image is set
  by URL field only. Upload flow can come later if needed.

#### Commits

- `77d42b9` -- FEATURE: WYSIWYG blog editor with UPPERCASE button,
  dedupe duplicate featured image in posts. 8 files changed,
  +990 / -2.

#### Carry-forward

- Add sidebar entry for `/admin/blog-preview` next UI pass.
- Move Quill blockquote color literal into a CSS variable when
  blog styling is revisited.
- Re-upload `PROJECT_MASTER.md` to the Claude.ai project after
  the DOCS commit lands so the next session has current context.

---

### May 11, 2026 -- Blog index redesign, header nav, DELETE endpoint, apostrophe diagnosis

#### Summary

Four pieces of related work landed in two commits today.

1. Added a DELETE method to the `create-blog-post` Edge Function so
   Tertius can delete a draft in a single request when the user
   declines publication. Same X-Blog-Api-Key auth, JSON body
   `{ slug }`, returns `{ success, message }` or 404
   `{ error: "Post not found" }`.

2. Diagnosed reported apostrophe stripping (`God's kingdom` ->
   `God kingdom` in DB). Verified the Edge Function performs zero
   string manipulation; JSON parsing preserves apostrophes; the
   `blog_posts` schema has no triggers or generated columns. Added a
   raw-body diagnostic log to the Edge Function, captured proof that
   posts arrive at our function already stripped. Root cause and
   correction handled upstream of our system. Diagnostic log removed
   and Edge Function redeployed clean today.

3. Redesigned `/blog` from a vertical list into a 3/2/1 column card
   grid. New `BlogCard.tsx` component renders a 16:9 hero image (or
   gradient placeholder), title, 150-char truncated excerpt, "N min
   read" estimate, formatted published date, and "Read more" link
   with hover lift. Sticky search bar with real-time title+excerpt
   filter (content search deferred per Option C). Pagination via
   Load More button driven by Supabase `range(from, to)` with
   `count: 'exact'`. Skeleton placeholders during loading. Two
   distinct empty states: "No posts available" (table empty) vs "No
   posts found. Try different keywords." (filtered to zero). SEO
   meta title + description set via `useEffect` with cleanup,
   matching the `ChurchPlantReport.tsx` pattern.

4. Added `BlogHeaderNav.tsx` shared component (logo on left linked
   to home, "Go to BibleLessonSpark" button on right linked to
   home) mounted on both `/blog` and `/blog/:slug`.

#### Files changed

- `src/constants/blogConfig.ts` -- extended SSOT: `pagination.pageSize`,
  `readTime.wordsPerMinute`, `excerpt.maxChars`, and new UI strings
  (`metaDescription`, `searchPlaceholder`, `searchEmptyState`,
  `loadingLabel`, `loadMoreLabel`, `loadingMoreLabel`, `readMoreLabel`,
  `readTimeSuffix`, `homeButtonLabel`).
- `src/pages/Blog.tsx` -- full rewrite (grid, search, pagination,
  skeletons, empty states, SEO).
- `src/pages/BlogPost.tsx` -- added `BlogHeaderNav` above the
  existing "Back to Blog" link.
- `src/components/blog/BlogCard.tsx` -- new (~120 lines).
- `src/components/blog/BlogHeaderNav.tsx` -- new (~25 lines).
- `supabase/functions/create-blog-post/index.ts` -- DELETE endpoint
  added, diagnostic log added then removed (clean redeploy this session).

#### SSOT and Frontend-Drives-Backend compliance

- All branding colors flow through Tailwind CSS variables sourced
  from `BRANDING` (`bg-primary`, `text-primary`, `bg-background`,
  `bg-card`). Zero hex literals.
- Logo path and alt text from `BRANDING.logo.primary` and
  `BRANDING.logo.altText`.
- All blog tunables and UI copy live in `BLOG_CONFIG`. Zero magic
  numbers in components.
- Home route via `ROUTES.HOME`. Blog post route via
  `BLOG_CONFIG.routes.post`. Zero hardcoded path literals.
- Page title built via `getPageTitle(BLOG_CONFIG.ui.title)`. App
  name not duplicated.
- Schema columns selected match the `BlogPost` interface
  declarations exactly. No queries against `tags` / `categories`
  / other columns the schema does not declare.
- `blogConfig.ts` is intentionally not in `FILES_TO_SYNC` per Rule
  #24 -- pure frontend, no `_shared/` mirror needed.
- No backend schema changes. No new migrations. No edits to
  `_shared/` utilities.

#### Trap encountered and resolved

`BlogCard.tsx` was initially written with literal Unicode middle-dot
and right-arrow glyphs. The .ts/.tsx ASCII guard would have blocked
the deploy. Fixed via byte-level PowerShell substitution (per
`feedback_unicode_escape_traps.md`) to convert each literal character
to its JavaScript escape sequence (six ASCII chars: backslash, u, and
four hex digits). All six touched .ts/.tsx files verified pure ASCII
before commit.

#### Decisions deliberately deferred

- **Category filter on the blog index.** Schema has no
  `tags`/`categories` columns and `blogConfig.ts` does not declare
  them. Adding it requires a migration + SSOT extension. Defer
  until business need is clear.
- **Server-side content search.** Current search runs client-side
  on title + excerpt of loaded posts. As post count grows past a
  few pages this will need a debounced Supabase `ilike` against
  the `content` column.
- **Read-time accuracy.** Estimate uses 200 wpm against
  HTML-stripped word count of `content`. Good enough for v1.

#### Commits

- `16b9bda` -- FEATURE: blog index redesign, header nav, DELETE
  endpoint, raw-body diagnostic logging. 6 files changed,
  +442 / -62.
- (this DOCS commit) -- removes the diagnostic log and updates
  PROJECT_MASTER.

#### Carry-forward

None. Apostrophe diagnostic concluded. Diagnostic log removed.
Dev server stopped. No pending tasks.

---

### May 10, 2026 -- Curriculum Evaluation Tool (new public page at /curriculum-evaluation)

#### Summary

New public marketing/evaluation page shipped in a single commit. Helps
church leadership self-assess whether locally prepared, church-specific
Bible curriculum may serve their context better than (or alongside)
traditional published curriculum. Static landing + side-by-side
comparison + 7-step guided wizard that scores answers, picks a result
type (personal preparation, small pilot, department pilot, or
full-quarter pilot), and renders a downloadable Decision Brief and
optional Pilot Plan in PDF and DOCX. Zero existing files affected
beyond the two SSOT updates required by Rules #3 and #23. Commit:
`5972fae`. 20 files changed, 2,032 insertions.

#### Architecture

Three layers, all under new directories:

- **`src/lib/curriculum-eval/`** (6 files) -- pure-logic SSOT:
  - `types.ts` -- Category, Question, Step, Answers, Tier, ResultType,
    ScoreReport interfaces.
  - `schema.ts` -- the canonical STEPS array (7 steps, 28 questions),
    plus `CORE_STEP_IDS` and `STEP_BY_ID` lookup. `conf6` helper for
    repeated 6-option confidence scales, properly typed as
    `Partial<Record<Category, number>>` (caught during code review
    before scoring.ts was written -- see Carry-forward #1).
  - `scoring.ts` -- `scoreAnswers(answers)` normalizes each category
    to [0,1] via `sums / (counts * 4)`, then computes overall via the
    weighted sum: transition 0.5 + leadership 0.2 + scripture 0.15 +
    teaching 0.15 = 1.00. Tier cutoffs: <0.4 low, <0.7 moderate,
    >=0.7 high. Result type derived from transitionReadiness +
    manyClasses (Q4_2 answer = C/D/E).
  - `brief.ts` -- `buildDecisionBrief(answers, report, opts)` returns
    plain-text brief with a Risks-to-Address-First section driven by
    actual category scores (e.g. `scripture < 0.6` adds a risk line).
  - `pilot-plan.ts` -- `buildPilotPlan(answers, report)` generates a
    structured plan: Week 0 prep + N teaching weeks (mid-pilot review
    inserted at `Math.ceil(weeks/2)` when weeks >= 4) + final review.
    Length mapping: A=1, B=2, C=4, D=6, E=13 weeks. Plus
    `pilotPlanToText` for export.
  - `export.ts` -- `exportTextAsPDF` (jspdf, letter, 54pt margins,
    helvetica, header-aware line styling, page-break handling) and
    `exportTextAsDOCX` (docx, HEADING_1/HEADING_2, bulleted lists,
    1080-twip margins). Both call `saveAs` from file-saver.

- **`src/components/curriculum-eval/`** (10 files) -- UI:
  - `Hero.tsx` -- top hero with Start + See Comparison CTAs.
  - `WhyConsider.tsx` -- static "new question worth considering"
    section with 3-card grid.
  - `ComparisonTable.tsx` -- forwardRef'd 10-row Traditional vs Local
    table. `scroll-mt-24` for anchor offset.
  - `Question.tsx` -- one question (radio or checkbox) wrapped in
    fieldset/legend for screen-reader semantics. Per-option cards
    with shadcn RadioGroupItem or Checkbox + Label htmlFor. Optional
    details textarea revealed by a chevron toggle.
  - `StepCard.tsx` -- Card wrapping one Step; numbered Question list.
  - `Wizard.tsx` -- state machine. Phase = step | interstitial |
    result. Steps 1-5 advance sequentially; idx 4 jumps to idx 5
    unconditionally; idx 6 scores and transitions to result.
    Auto-scroll to card on phase change via useEffect on phase.
    Results renders DecisionBrief + PilotPlan inside.
  - `DecisionBrief.tsx` -- card with Copy/PDF/DOCX header + scrollable
    pre block of the brief text. Clipboard copy flips a 2-second
    "Copied" state.
  - `PilotPlan.tsx` -- card with Copy/PDF/DOCX header + structured
    rendering: overview dl, vertical timeline ol (decorative bullet
    markers `aria-hidden="true"`), success criteria, risks-to-watch.
  - `ClosingSection.tsx` -- forwardRef'd pastoral note + "When you
    are ready" card. "BibleLessonSpark" inside the card is an anchor
    linking to https://biblelessonspark.com (added via surgical edit
    after the initial component write, post-localhost-verification).
  - `Results.tsx` -- COPY-record keyed by ResultType. Primary CTAs
    route by label substring ("Generate Decision Brief" -> reveal
    brief; "pilot plan" substring -> reveal plan; else scroll to
    ClosingSection). PilotPlan only renders if includeStep7;
    fallback hint card otherwise.

- **`src/pages/CurriculumEvaluationPage.tsx`** -- composes Hero,
  WhyConsider, ComparisonTable, wizard section (heading + Wizard),
  ClosingSection. Three refs: wizardRef (HTMLDivElement),
  comparisonRef (HTMLElement), closingRef (HTMLElement) provide
  scroll targets. Public route -- no ProtectedRoute wrapper.

#### Routing wiring (Rules #3 and #23 verified)

Both files updated in the same deploy:

- `src/constants/routes.ts` -- inserted
  `CURRICULUM_EVALUATION: '/curriculum-evaluation'` immediately after
  `LESSON_SHAPES_GUIDE`. Note: LESSON_SHAPES_GUIDE sits below the
  `// Protected routes` comment block but is publicly rendered in
  App.tsx, so this placement matches the existing pattern for
  public-but-grouped-below-protected routes.
- `supabase/functions/_shared/routes.ts` -- auto-synced via
  `npm run sync-constants`. 14 of 14 files synced; only routes.ts
  had real diffs.
- `src/App.tsx` -- two surgical edits:
  - `import CurriculumEvaluationPage from "./pages/CurriculumEvaluationPage"`
    inserted immediately after the `LessonShapesGuide` import.
  - `<Route path={ROUTES.CURRICULUM_EVALUATION} element={<CurriculumEvaluationPage />} />`
    inserted immediately after the `LESSON_SHAPES_GUIDE` Route, with
    no ProtectedRoute wrapper.

#### Build and deploy

- `npm run build` -- clean. 3,933 modules transformed in 26.81s.
  Zero TypeScript errors. Zero TypeScript warnings. Three advisory
  warnings (baseline-browser-mapping >2 months old, browserslist 6
  months old, main bundle >500 kB) -- all pre-existing, not
  introduced by this work.
- `npm run dev` started on http://localhost:8080 for localhost
  verification. Page verified clean before deploy approval.
- `.\deploy.ps1` -- ASCII guard passed. Commit `5972fae` to main.
  Pushed to origin/main. Netlify auto-deploy triggered.

#### Carry-forward observations

These are flagged but deferred. Not bugs as shipped; worth revisiting
if/when the page evolves.

1. **conf6 helper type cast (resolved in this session).** Initial
   `schema.ts` used `Parameters<typeof k>[0]` and
   `Record<string, number>` for the helper; this would not have been
   assignable to the `Partial<Record<Category, number>>` shape that
   `Option` expects. Caught during code review and fixed with one
   surgical Edit before scoring.ts was written. Helper now reads
   `(cat: Category) => ... as Partial<Record<Category, number>>`.
   The `k<T>` function was removed entirely.

2. **Wizard interstitial phase is unreachable.** The `Phase` union
   defines `{ kind: "interstitial"; report }`, and the render branch
   exists, but no `setPhase({ kind: "interstitial", ... })` call
   exists anywhere. Dead code as shipped. If the intent was to show
   the low/moderate/high tier interstitial messaging that already
   lives in that render branch, idx-4's onNext needs to score and
   set interstitial instead of jumping straight to step 5.

3. **`unlockedAfterLow` state is set but never read** in Wizard.tsx.
   Declared, written in three places, reset on restart -- but no UI
   or logic reads it. Lenient `tsconfig` did not flag it; a stricter
   `noUnusedLocals` setting would.

4. **Accessibility deferrals (Rule #22).** Three observations not
   addressed in this version:
   - Wizard.tsx "Back" and "Save and Continue" buttons use the
     HTML `disabled` attribute, not `aria-disabled="true"`. Per
     Rule #22 item 1, disabled buttons that must stay focusable
     should use aria-disabled so screen-reader users can land on
     them and hear why they cannot proceed.
   - DecisionBrief.tsx / PilotPlan.tsx "Copied" state changes on
     Copy buttons are visual-only; no `aria-live="polite"` region
     announces success. Rule #22 item 7 unsatisfied.
   - Results.tsx: when Generate Decision Brief or Build Pilot Plan
     reveals new content, focus does not move to the revealed
     heading and no status region announces the appearance.
     Rule #22 item 9 (focus moves to result heading after generation
     completes) unsatisfied.

5. **String-based button routing in Results.tsx.** `handleClick`
   switches on literal copy ("Generate Decision Brief") and substring
   ("pilot plan", case-insensitive). If COPY labels are ever edited
   for tone, the routing will silently break. A label/action
   discriminator on the `ResultCopy` shape would be more robust.

6. **No SEO `<head>` metadata.** Other public pages may set
   `document.title` or use a head helper; this page does not. Not
   specified in spec, not added.

#### What's next

Page is shipped and live at https://biblelessonspark.com/curriculum-evaluation.
The carry-forward items above can be addressed in a follow-up session
if the page sees real traffic or if leadership wants to surface the
interstitial messaging that already exists in Wizard.tsx but never
fires.

---

### May 8, 2026 (Session 3) -- Teaching Team capacity copy fix + Foundation Tier checkout repair

#### Summary

Two production-relevant fixes shipped in two commits, plus a diagnostic
trail for the Foundation Tier checkout failure that turned out to be a
boundary-vocabulary mismatch -- not a Stripe or function issue. Closes
a long-standing copy/comment drift on Teaching Team capacity. Closes a
checkout-blocking 400 on the org self-service path. Both fixes verified
in production. Commits: `feb1344`, `d1d5f1e`.

#### Diagnostic 1 -- Teaching Team tier and capacity

Read `sidebarConfig.ts`, `contracts.ts`, `useTeachingTeam.tsx`,
`TeachingTeamCard.tsx`, `featureFlags.ts`, `pricingConfig.ts`, and
`TeachingTeam.tsx`. Confirmed:

- `teachingTeam` sidebar item: `tierGate: 'paid_only'`
  (`sidebarConfig.ts:150`).
- Resolution chain: `teachingTeam.requiredTier = 'personal'` (in
  `featureFlags.ts:61-66`) -> `hasFeatureAccess()` -> `isPaidTier(tier) === tier !== 'free'`.
  Therefore Personal Plan and any higher tier (starter, growth,
  full, enterprise) unlocks Teaching Team identically. **No org
  required.**
- Member cap: `MAX_TEAM_MEMBERS = 3` (`contracts.ts:162`). The
  constant counts rows in the `teaching_team_members` table; the
  lead teacher lives in `teaching_teams.lead_teacher_id` and is
  NOT included in the cap. **Real capacity: lead + 3 invited = 4
  people total per team.**
- Cap is global, not tier-keyed. No `MAX_TEAM_MEMBERS_BY_TIER`
  table or branch anywhere in the codebase. A Personal Plan
  teacher gets the same team size as an Enterprise org member;
  org tiers buy bigger lesson limits, not bigger teams.

Two stale strings flagged and corrected in commit `feb1344`.

#### feb1344 -- FIX: Correct Teaching Team capacity to lead + 3 = 4 total; add org upgrade note to Teaching Team page

Four files changed (16 insertions, 5 deletions):

- `src/constants/contracts.ts` -- two comment fixes:
  - Line 161 was `Maximum number of members per teaching team
    (lead + 2 others). SSOT.` -- claimed 3 total. Wrong. Code allows
    lead + 3 = 4. Now reads `(lead + 3 others = 4 total). SSOT.`
  - Line 169 JSDoc was `A lead teacher creates one team and invites
    up to MAX_TEAM_MEMBERS - 1 others.` Same drift. Now reads
    `... and invites up to MAX_TEAM_MEMBERS others (3).`
  - `MAX_TEAM_MEMBERS = 3` constant at line 162 unchanged.
    Behavior unchanged.
- `src/hooks/useTeachingTeam.tsx` -- createTeam success toast at
  line 275 was ``Invite up to ${MAX_TEAM_MEMBERS - 1} fellow teachers!``
  rendering as "Invite up to 2 fellow teachers!" but the very next
  invite at line 335 only blocks at `>= MAX_TEAM_MEMBERS` (3). A
  user could invite 3 after being told they could only invite 2.
  Now ``Invite up to ${MAX_TEAM_MEMBERS} fellow teachers!`` rendering
  as "Invite up to 3 fellow teachers!"
- `src/pages/TeachingTeam.tsx` -- inserted a new helper paragraph
  between the page header and the `TeachingTeamCard`: "Need more
  than 4 teachers? Create an organization to expand your team
  beyond the Personal Plan limit." Inline anchor links to
  `https://biblelessonspark.com/org/`. Styling
  `text-sm sm:text-base text-muted-foreground` matches the existing
  page subtext. Anchor uses BLS primary green underline.
- `supabase/functions/_shared/contracts.ts` -- auto-synced backend
  mirror via `npm run sync-constants` per Rule #23. 14 of 14 files
  synced; only `contracts.ts` had real diffs.

#### Diagnostic 2 -- Foundation Tier checkout failure

Read `create-org-checkout-session/index.ts`,
`_shared/pricingConfig.ts`, `orgPricingConfig.ts`, `OrgSetup.tsx`,
`OrgPoolStatusCard.tsx`, and recent git history on each. Confirmed:

- Foundation tier = `org_single_staff` per `orgPricingConfig.ts:31-32`.
  Stripe price IDs `price_1Swo8cI4GLksxBfVmjDOAPsy` (monthly) and
  `price_1Swo8cI4GLksxBfVKrgbURbQ` (annual) present in both the
  frontend SSOT and the backend mirror, identical, well-formed
  (correct `price_` prefix, canonical Stripe ID format).
- Function self-service entry validation at line 171:
  ``if (!billingInterval || !["monthly","annual"].includes(billingInterval)) throw new Error("Invalid or missing billingInterval")``.
  Returns HTTP 400 via the unified catch block at line 314.
- `OrgSetup.tsx` (the Foundation purchase entry point) was sending
  `billingInterval` as the raw state value: `'month'` or `'year'`.
  State declared at `OrgSetup.tsx:83` with that vocabulary; UI
  toggles at lines 504/514 set it; line 222 of the request body
  forwarded the raw value to the function with no translation.
- `OrgPoolStatusCard.tsx` (the existing-org upgrade path) used the
  snake_case key `billing_interval` and translated `'year' -> 'annual'`,
  `'month' -> 'monthly'` at the boundary (line 116). That caller
  worked. OrgSetup did not.

**Result:** every Foundation Tier checkout from the self-service
path returned `400 {"error": "Invalid or missing billingInterval"}`
before ever reaching Stripe. The function had been correct since
at least 2026-03-24 (commit `2633005`); the frontend had been wrong
the whole time. Redeploying the function alone could not fix it.

#### Function redeploy (not a git commit)

Ran `npx supabase functions deploy create-org-checkout-session`.
First attempt used `--linked`, which is **not** a valid flag for
`functions deploy` (it is valid only for `db push`). Re-ran without
the flag; the CLI auto-detects the linked project from local config.
Docker not running; CLI fell back to server-side `--use-api`
bundling automatically. Bundled `index.ts` and
`_shared/pricingConfig.ts` (the function's only `_shared/` import).
Confirmed deploy on project `hphebzdftpjbiudpfcrs`. The CLI does
not print a deployment ID -- the success line is the only signal
from the terminal; further confirmation must come from the
Supabase Dashboard. The redeploy did not change function behavior;
it was a sanity check before the frontend fix.

#### d1d5f1e -- FIX: Translate OrgSetup billingInterval year/month to annual/monthly for create-org-checkout-session

One file changed (1 insertion, 1 deletion):

- `src/pages/OrgSetup.tsx:222` was `billingInterval,` (shorthand
  passing the raw state value). Now
  ``billingInterval: billingInterval === 'year' ? 'annual' : 'monthly',``.
  Translates at the boundary on the way out, matching what
  `OrgPoolStatusCard.tsx:116` already did and what the function
  expects. All other `billingInterval` references in `OrgSetup.tsx`
  (12 lines: state declaration, UI toggles, price selectors,
  display strings) correctly use the original `'month'`/`'year'`
  vocabulary against the state declaration on line 83 and were
  intentionally untouched.

#### Build verification

`npm run build` clean across all iterations:
- After `contracts.ts` comment fix: 21.43s.
- After `TeachingTeam.tsx` note insertion: 23.05s.
- After `OrgSetup.tsx` boundary translation: 23.02s.

Module count steady at 3917. Zero TypeScript errors. Only the
pre-existing chunk-size warnings.

#### Workflow

- Diagnostic-first reads of every constraint file before touching
  any. Two diagnostics issued (Teaching Team tier+capacity;
  Foundation checkout root cause), both before code changes, both
  confirmed by Lynn before fixes shipped.
- A `deploy.ps1` invocation rejected mid-flight by Lynn in favor of
  pre-deploy verification: re-run the function deploy and grep the
  on-disk file state. Re-attempted after that verification passed.
  Pattern worth keeping for any session that ships both an edge
  function and a frontend fix that depends on it.
- `npm run sync-constants` after the `contracts.ts` edit per Rule
  #23. 14 files re-emitted; only the `contracts.ts` mirror diff
  was real.
- Both commits via `deploy.ps1` (which uses `git add .`); scope
  confirmed clean (single-purpose working tree) before each
  invocation.
- Edge function deployed via `npx supabase functions deploy
  create-org-checkout-session` (no `--linked`).

#### Out of scope

No backend logic changes (function code unchanged; only redeployed).
No SSOT constant value changes (`MAX_TEAM_MEMBERS = 3` unchanged).
No Stripe Dashboard changes. No new tier or feature flag introduced.

Out-of-scope drift noted but NOT fixed today:

- `src/constants/orgPricingConfig.ts` `LESSON_PACKS` shows prices
  $12 / $25 / $45, but `_shared/pricingConfig.ts` has priceCents
  1500 / 3500 / 6000 ($15 / $35 / $60). CLAUDE.md states
  $15 / $35 / $60. The `orgPricingConfig.ts` lesson-pack dollar
  values are stale. Stripe price IDs match across both files; the
  drift is documentation-only, not enforcement. Flagged for a
  future cleanup pass.
- `create-org-checkout-session/index.ts` returns HTTP 400 for every
  thrown error, including conditions that should arguably be 401
  (no auth header), 403 (not org manager), 404 (org not found), or
  500 (missing `STRIPE_SECRET_KEY` env var). Unified catch block at
  line 314. Not changed today; would be a wider error-handling
  refactor.

#### Carry-forwards

1. **Foundation Tier checkout test in production**: `d1d5f1e` is
   on Netlify and the function is on Supabase. Walk the org
   self-service flow once Netlify finishes building and confirm
   Stripe Checkout opens. If it still fails, pull function logs
   from the Supabase Dashboard -- the new error will be a
   different throw site, not the `billingInterval` one.
2. Optional: lesson-pack price-vocabulary cleanup in
   `orgPricingConfig.ts` (out-of-scope drift, see above).
3. Optional from Session 1: differentiate Shape 4 from Shape 1 on
   `/lesson-shapes` (both currently render `primary` forest green).

---

### May 8, 2026 (Session 2) -- Wire Lesson Shapes Guide into Reshape flow + dashboard return link

#### Summary

Two follow-up UX additions to the Lesson Shapes Guide shipped earlier
in the day. Closes carry-forward #1 from the prior Session 1 entry
(Shape Guide access from the Reshape moment) and adds a logged-in
return path from the new public page back to the dashboard. One
commit: `724175a`.

#### 724175a -- FEATURE: Wire Lesson Shapes Guide into Reshape panel + dashboard return link

Two files changed (26 insertions, 2 deletions):

- `src/components/dashboard/EnhanceLessonForm.tsx` -- added
  `ExternalLink` to the existing `lucide-react` import on line 44.
  Inlined a "Learn about the five shapes" link inside the existing
  Reshape-section description paragraph (after "All content is
  preserved -- only the structure changes"). Anchor opens
  `ROUTES.LESSON_SHAPES_GUIDE` in a new tab via
  `target="_blank" rel="noopener noreferrer"`. Visible
  primary-green underlined affordance, `ExternalLink` icon with
  `aria-hidden="true"`, screen-reader-only "(opens in new tab)"
  span so the accessible name reads "Learn about the five shapes
  (opens in new tab)". Renders only when the Reshape panel is
  open -- no impact on the export button row, lesson library
  cards, or any other surface using `LessonExportButtons`.
- `src/pages/LessonShapesGuide.tsx` -- added 4 imports matching
  the OrgLanding.tsx pattern (`useNavigate`, `useAuth`, `Button`,
  `ROUTES`). Added `navigate` and `user` hooks inside the
  component. Inserted a right-aligned outline-variant "Go to
  Dashboard" button above the h1, conditional on `user` being
  non-null. Mirrors OrgLanding.tsx lines 131-144 -- logged-in
  users see the button, logged-out users see nothing rendered (no
  empty space).

#### Decision log

- **Placement of Shape Guide link (Option B)**: Lynn picked
  inline-in-Reshape-description over a new button in
  `LessonExportButtons` (which is shared by other dashboard
  surfaces). Scope held to the Reshape decision moment only.
- **Go to Dashboard pattern**: matched OrgLanding.tsx's
  conditional-on-`user` pattern rather than full sticky branded
  header. Lynn's instruction "above the page title" indicated
  content-area placement, not site chrome.

#### Build verification

`npm run build` clean: 3917 modules, 20.06s after the Reshape
link, 20.86s after the dashboard button. Zero TypeScript errors.
Only the pre-existing chunk-size warnings.

#### Workflow

- Diagnostic-first reads of `LessonLibrary.tsx`,
  `LessonExportButtons.tsx`, and `EnhanceLessonForm.tsx` to
  confirm Reshape is a separate UI section from the export
  button row before proposing placement options.
- Three placement options presented with blast-radius analysis
  before any code change. Lynn picked Option B.
- `OrgLanding.tsx` read first to mirror exact "Go to Dashboard"
  button pattern (variant, navigation target, auth conditional).
- `git add` -- explicit two-file list (NOT `git add .`),
  bypassing `deploy.ps1`.

#### Out of scope

No backend changes. No edge function changes. No SSOT constants
modified. No accessibility-elsewhere changes. The
`LessonExportButtons` shared component was deliberately not
touched -- placement chosen specifically to avoid affecting other
dashboard surfaces.

#### Carry-forwards

None pending from this session. Optional Shape 4 color
differentiation from Session 1 still available if desired.

---

### May 8, 2026 (Session 1) -- FEATURE: Public Lesson Shapes Guide page at /lesson-shapes

#### Summary

New public page rendering all five lesson shapes (Passage Walk-Through,
Life Connection, Gospel-Centered, Focus-Discover-Respond, Story-Driven)
in a tabbed comparison view. Each shape card has a numbered circle
header, a four-column metadata grid (Teaching Movement, Best For,
Teacher Posture, Primary Skill), a description paragraph, and a
side-by-side "Shaped Lesson / Base Lesson (Before)" demonstration
using Luke 10:25-37 as the consistent transformation passage so
teachers can compare formats directly. One commit: `bfd91ca`.

#### bfd91ca -- FEATURE: Add public Lesson Shapes Guide page at /lesson-shapes

Four files changed (491 insertions, 0 deletions):

- `src/pages/LessonShapesGuide.tsx` (new, 470 lines) -- five-card
  layout following an identical template per shape, varied only by
  shape color, content, and "Back To Top" anchor (omitted from Shape 1
  since it is already at top). Shape colors after the post-localhost
  sweep: Shape 1 = primary, Shape 2 = secondary, Shape 3 = destructive,
  Shape 4 = primary, Shape 5 = accent. State uses
  `useState<Record<ShapeKey, TabState>>` keyed 1-5; `toggleTab` is the
  only mutator. Hero h1 reads "Five Ways to Shape a Lesson" in BLS
  forest green. `<nav aria-label="Lesson Shapes Navigation">` at top
  with five jump links. All non-ASCII glyphs (em-dash, en-dash,
  right-arrow) encoded as numeric HTML entities so the deploy guard
  never fired.
- `src/constants/routes.ts` -- added
  `LESSON_SHAPES_GUIDE: '/lesson-shapes'` immediately above the Legal
  routes block.
- `src/App.tsx` -- added `import LessonShapesGuide from "./pages/LessonShapesGuide"`
  and a public (non-`ProtectedRoute`) `<Route>` adjacent to the Help
  route.
- `supabase/functions/_shared/routes.ts` -- auto-synced via
  `npm run sync-constants` per Rule #23.

#### Cosmetic-fix flow (post-localhost review)

Lynn opened localhost and reported four issues (white-on-white
circles, hero color, etc.). Diagnostic surfaced the real cause: every
`bg-primary-dark`, `text-primary-dark`, `bg-secondary-dark`,
`text-secondary-dark`, `border-secondary-dark` class I had used was
unrecognized by the project's Tailwind theme. `tailwind.config.ts`
defines `primary` and `secondary` with only `DEFAULT/foreground/hover/light`
-- there is no `dark` variant. Tailwind silently emits no CSS for
unknown utilities, so headings, number circles, tabs, and
bordered-block accents on shapes 1, 2, and 4 were rendering with no
shape color at all.

Resolution applied in-place via Edit replace_all (not a regenerated
file): `primary-dark` -> `primary` (9 sites), `secondary-dark` ->
`secondary` (9 sites). h1 renamed from "Lesson Shapes" to "Five Ways
to Shape a Lesson". Five back-to-top chevron+text anchors added
(Shape 1 omitted as redundant). CSS bundle grew 165.96 kB -> 166.10 kB
confirming the now-valid utilities are emitting CSS.

Acknowledged collision: Shape 1 and Shape 4 now both render in
`primary` (forest green). Lynn approved as-is. Available follow-up if
visual distinction becomes important: swap Shape 4 to `burgundy`,
`warning`, or `success` (all defined in `tailwind.config.ts`).

#### Build verification

`npm run build` clean across all four iterations:
- Initial generation: 3917 modules, 22.43s.
- After cosmetic sweep: 3917 modules, 20.59s.
- After "Back To Top" label add: 3917 modules, 22.00s.
- After Shape 1 anchor removal: 3917 modules, 19.88s.

Module count up exactly 1 from the prior 3916 baseline -- the new
page. Zero TypeScript errors throughout. Only the pre-existing
chunk-size warnings.

#### Workflow

- Diagnostic-first reads of `lessonShapeProfiles.ts`, `routes.ts`,
  `App.tsx`, `tailwind.config.ts`, and the live `LessonShapesGuide.tsx`
  before any cosmetic edit. Pushed back twice on instructions that
  did not match file state (per Rule #14).
- Initial file generation via Node `.cjs` script per CLAUDE.md
  (write-lesson-shapes.cjs at repo root). Script self-checked every
  output byte <= 127 before exit. ASCII guard never fired.
- `routes.ts` and `App.tsx` updated via PowerShell
  `[System.IO.File]::WriteAllText` with
  `[System.Text.UTF8Encoding]::new($false)` per Lynn's spec for
  these two files.
- `npm run sync-constants` after `routes.ts` edit per Rule #23.
- `git add` -- explicit four-file list, NOT `git add .` -- bypassing
  `deploy.ps1` since its line 32 stages everything and the one-shot
  generator script should not enter the repo. `git push origin main`
  used directly.
- HELD twice before deploy: (1) before the cosmetic sweep, awaiting
  Lynn's choice on h1 text and sweep approval; (2) after final
  cosmetic pass, awaiting Lynn's localhost approval. Deploy authorized
  on second hold.
- `write-lesson-shapes.cjs` deleted post-deploy at Lynn's request.

#### Out of scope

No backend changes. No edge function changes. No SSOT constants
modified beyond the new route. No theology profile, age group,
pricing, or accessibility-elsewhere changes. The 18-instance
`*-primary-dark` / `*-secondary-dark` misuse was contained entirely
within the new `LessonShapesGuide.tsx`; no other file in `src/` uses
those class fragments (verified via grep).

#### Carry-forwards

1. **Pending feature**: Lynn asked for access to the Shape Guide from
   the Lesson Library "View" modal alongside the existing Copy /
   Download / Email / Publish / Reshape actions, "to better inform the
   user." Scoping next: locate where the Reshape button is rendered
   alongside the export buttons and propose placement options for a
   "Learn about shapes" link/button that opens `/lesson-shapes` (likely
   in a new tab, given the modal context).
2. **Optional**: differentiate Shape 4's color from Shape 1 (both
   currently render in `primary`). Lynn accepted as-is for now.

---

### May 5, 2026 (Session 4) -- Wire Tailwind Typography + render blog HTML content

#### Summary

Two tightly-coupled changes shipped in one commit. The Tailwind Typography
plugin was already in `devDependencies` (^0.5.16) but had never been wired
into `tailwind.config.ts`, so `prose` classes generated nothing. BlogPost
detail pages were rendering Supabase `content` as plain text via
`whitespace-pre-wrap` -- meaning HTML stored in the column would have
appeared as escaped markup. Both halves of the gap closed together so
formatted blog content now renders as intended.

#### c762e80 -- FEATURE: Wire Tailwind Typography, render blog HTML content

Two files changed (7 insertions, 5 deletions):

- `tailwind.config.ts` -- added `import typography from "@tailwindcss/typography";`
  alongside the existing `tailwindcssAnimate` import. Added `typography`
  to the `plugins` array (now `[tailwindcssAnimate, typography]`).
  Also fixed four pre-existing U+2192 arrow glyphs in the file's doc
  comment (line 11 "Color flow") to ASCII `->`. The arrows had been
  there since before this session but the ASCII guard fires on any
  non-ASCII byte in any file in the staged set, not just diffs --
  modifying the file forced the cleanup.
- `src/pages/BlogPost.tsx` -- replaced the body content block. Was:
  `<div className="whitespace-pre-wrap text-lg leading-8 text-slate-800">{post.content}</div>`.
  Now: `<div className="prose prose-lg max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />`.
  No other changes -- routing, slug lookup, 404 branch, focus
  management on heading via `tabIndex={-1}` + `useRef`, `aria-live`
  loading region, `role="alert"` error region, back link, and
  published-date `time` element are all unchanged.

#### Pre-task diagnostic

Before starting, verified the gap:
- `package.json` line 88 -- `@tailwindcss/typography: ^0.5.16` in
  `devDependencies` (not `dependencies`).
- `tailwind.config.ts` line 155 (pre-edit) -- `plugins: [tailwindcssAnimate]`,
  no typography import or reference. Confirmed `prose` classes would not
  generate.

#### Build verification

`npm run build` clean (3916 modules, 19.57s). CSS bundle size jumped
from 138.52 kB to 165.42 kB (+26.9 kB) -- direct evidence that the
typography plugin is now generating `prose-*` utilities into the
output stylesheet. No new TypeScript errors. Only the pre-existing
chunk-size warnings.

#### XSS posture

`dangerouslySetInnerHTML` on `post.content` is acceptable because the
`blog_posts` table RLS policy (migration `20260505180000_create_blog_posts.sql`)
restricts writes to `service_role` -- public users have SELECT-only access
to rows where `published = true`. Content is admin-authored and trusted.
If the write path ever expands to non-admin authors, content will need
to be sanitized (e.g. via `dompurify`) before this prop is set.

#### Workflow

- Diagnostic-first read of `package.json`, `tailwind.config.ts`, and
  `src/pages/BlogPost.tsx` before any edits.
- `npm run build` -- clean.
- ASCII verification on both files before commit.
- First commit attempt blocked by ASCII guard on the pre-existing arrows
  in `tailwind.config.ts` (4 x U+2192). Fixed in the same edit, re-committed
  successfully.
- `git add` -- explicit file list (NOT `git add .`), no deploy.ps1
  invocation.
- HELD before push -- awaiting Lynn's localhost verification on the
  detail page before deploy is authorized.

#### Out of scope

No backend changes. No edge function changes. No SSOT constants modified.
No accessibility-affecting changes to the page chrome (heading focus,
loading region, error region, back link all untouched). No other route
or component changed.

#### Carry-forwards

1. Lynn to verify on localhost: navigate to a published `/blog/:slug`
   post and confirm prose styling renders (headings, paragraphs, lists)
   with the typography plugin's defaults.
2. If/when blog authoring expands beyond admin-only, add content
   sanitization in `BlogPost.tsx` before the `dangerouslySetInnerHTML`
   prop -- per the XSS posture note above.

---

### May 5, 2026 (Session 3) -- Cleanup: untrack cli-latest + Rules 23-24 sync-constants policy

#### Summary

Three Session 2 carry-forwards closed in two commits, plus a follow-up
sweep that untracked the remaining 7 `supabase/.temp/` CLI cache files
that had been silently tracked alongside `cli-latest`. No code behavior
changed. CLAUDE.md gained two new rules documenting the sync-constants
workflow and the hand-maintained `_shared/` set.

#### ffdf3ed -- DOCS: Rules 23-24 sync-constants policy, remove tracked temp file

Two files changed (22 insertions, 1 deletion):

- `supabase/.temp/cli-latest` -- removed from git index via
  `git rm --cached`. File still exists on disk (CLI continues to write it)
  but is no longer tracked. `.gitignore` line 44 (`supabase/.temp/`) already
  covers it -- no .gitignore edit required. Closes Session 2 carry-forward #1.
- `CLAUDE.md` -- added Rule #23 and Rule #24 immediately after Rule #22,
  before the `---` divider that precedes `## DEBUGGING PROTOCOL`.
  Closes Session 2 carry-forwards #2 and #3.

#### Rule #23 -- npm run sync-constants policy

Documents the 14 files that auto-sync from `src/constants/` to
`supabase/functions/_shared/` via `scripts/sync-constants.cjs`:
ageGroups, bibleVersions, generationMetrics, lessonStructure, lessonTiers,
systemSettings, teacherPreferences, theologyProfiles, routes, contracts,
rateLimitConfig, freshnessOptions, devotionalConfig, toolbeltConfig.
Verified against the actual `FILES_TO_SYNC` array in sync-constants.cjs
lines 30-45 -- list matches exactly. Rule directs CC to run
`npm run sync-constants` immediately after editing any of these and to
never hand-edit the `_shared/` mirrors (they are overwritten on next sync).

#### Rule #24 -- intentionally hand-maintained _shared/ files

Documents the 16 `_shared/` files that are NOT in FILES_TO_SYNC and have
no clean frontend SSOT counterpart: pricingConfig, trialConfig, validation,
lessonShapeProfiles, seriesConfig, branding, uiSymbols, organizationConfig,
betaEnrollmentConfig, emailDeliveryConfig, outputGuardrails,
customizationDirectives, corsConfig, orgPoolCheck, subscriptionCheck,
rateLimit. When a frontend SSOT change touches one of these, the
corresponding `_shared/` mirror must be updated by hand in the same commit.
Rule explicitly forbids adding any of these to FILES_TO_SYNC.

#### c9864df -- CLEANUP: Untrack remaining supabase/.temp/ CLI cache files

Follow-up sweep after the Session 2 carry-forward review surfaced that
`cli-latest` was not the only stale-tracked file under `supabase/.temp/`.
Seven additional CLI cache files were also tracked despite being covered
by `.gitignore`: `gotrue-version`, `linked-project.json`, `pooler-url`,
`postgres-version`, `project-ref`, `rest-version`, `storage-version`.
Removed from index via `git rm --cached` -- 7 files, 7 deletions, no
working-tree changes (files remain on disk; supabase CLI continues to
write them). After this commit `git ls-files supabase/.temp/` returns
empty -- the directory is fully ignored.

#### Workflow

- `npm run build` -- clean (3916 modules, 21.7s). Only pre-existing
  chunk-size warnings.
- ASCII verification on edited CLAUDE.md -- 0 non-ASCII bytes.
- `git add CLAUDE.md` (cli-latest was already staged from `git rm --cached`)
  -- explicit file list, no `git add .`, no deploy.ps1 invocation.
- `git commit` -- ASCII guard passed on each commit.
- `git push origin main` -- direct push (Netlify auto-deploys from main).

#### Out of scope

No source code changes. No SSOT constants modified. No edge functions
touched. No Stripe / pricing / accessibility / copy changes.

#### Carry-forwards

None. All three Session 2 cleanup items resolved, plus the broader
`.temp/` sweep closed in the same session.

---

### May 5, 2026 (Session 2) -- Blog system (full stack: SSOT + migration + pages)

#### Summary

Complete public blog system shipped end to end. SSOT-first build:
`src/constants/blogConfig.ts` owns table name, status values, and all UI
copy; `src/constants/routes.ts` owns the path literals and `blogConfig`
derives its routes from it. New `blog_posts` table created via
migration with RLS allowing public read of published rows only.
Two new public pages render index and detail. One commit (`8934030`),
preceded by a drift-fix sync at the start of the session.

#### Pre-work -- backend mirror drift fix (no commit)

`npm run sync-constants` rewrote 14 backend `_shared/` files. Two real
diffs surfaced and were corrected: `routes.ts` had been missing
`CHURCH_PLANT_REPORT` and `WHY_CHURCHES_CAN_TRUST`; `contracts.ts` had
a 2-line frontend-vs-backend drift. The sync was the first time it had
run since at least the church-plant-report ship. These drifts were
shipped together with the blog commit since both backend mirrors are
auto-generated and the sync tool always touches all 14 files.

CLAUDE.md does not currently document the `npm run sync-constants`
command nor the `supabase/functions/_shared/` mirror policy.
Carry-forward: add a short SSOT-Sync section to CLAUDE.md so future
sessions run sync-constants before any ship that touches the
`FILES_TO_SYNC` set (`ageGroups`, `bibleVersions`, `generationMetrics`,
`lessonStructure`, `lessonTiers`, `systemSettings`, `teacherPreferences`,
`theologyProfiles`, `routes`, `contracts`, `rateLimitConfig`,
`freshnessOptions`, `devotionalConfig`, `toolbeltConfig`).

#### 8934030 -- FEATURE: blog system

`FEATURE: Blog system -- blog_posts table, Blog and BlogPost pages, SSOT blogConfig`

9 files (298 insertions, 1 deletion):

- `src/constants/blogConfig.ts` -- new SSOT. Exports `BLOG_CONFIG` with
  `table='blog_posts'`, `status.published='published'`,
  `status.draft='draft'`, `routes.index=ROUTES.BLOG`,
  `routes.post=ROUTES.BLOG_POST`, and UI copy
  (`title='Blog'`, `emptyState='No posts available.'`,
  `backLabel='Back to Blog'`). Also exports `BlogStatus` type and
  `BlogPost` row interface.
- `src/constants/routes.ts` -- added `BLOG: '/blog'` and
  `BLOG_POST: '/blog/:slug'` to the public block.
- `src/App.tsx` -- imported `Blog` and `BlogPost`; registered both as
  bare `<Route>` elements (no `ProtectedRoute`), placed alongside the
  other public marketing routes (Rule #3 satisfied).
- `src/pages/Blog.tsx` -- index page. Queries
  `BLOG_CONFIG.table` filtered by `published=true`, ordered
  `published_at desc`. Uses only `BLOG_CONFIG.ui.*` and
  `BLOG_CONFIG.routes.post` for path interpolation. Accessible:
  visible h1, h2 per post, `aria-live="polite"` loading region,
  `role="alert"` error state, `time` element with `dateTime` for
  published date.
- `src/pages/BlogPost.tsx` -- detail page. Looks up by `:slug` URL
  param, requires `published=true`. On load, programmatic focus
  moves to the post heading via `tabIndex={-1}` + `useRef`. 404
  branch renders "Post not found" headline (also focused on load).
  Back link points to `BLOG_CONFIG.routes.index`.
- `supabase/migrations/20260505180000_create_blog_posts.sql` -- creates
  `blog_posts` (id uuid, title, slug unique, excerpt, content, published
  bool default false, published_at timestamptz, created_at timestamptz),
  enables RLS, adds two policies: public-anonymous SELECT where
  `published=true` (roles: `anon, authenticated`), and
  `service_role for all` for admin content management.
- `supabase/functions/_shared/routes.ts` -- auto-synced.
- `supabase/functions/_shared/contracts.ts` -- auto-synced (drift fix).
- `CLAUDE.md` -- SSOT File Map gained the row
  `| Blog Config | src/constants/blogConfig.ts |`.

#### Migration verification

`npx supabase migration list --linked` showed `20260505180000` as
local-only (Remote column empty) before push -- confirming new file,
not a re-run. `npx supabase db push --linked` reported
`Applying migration 20260505180000_create_blog_posts.sql ... Finished`
and the post-push list showed the same timestamp now mirrored in both
columns. Live database verified.

#### SSOT discipline check (Step 7 verification)

- `'blog_posts'` literal appears only in `blogConfig.ts` and the
  migration SQL. Both pages reference `BLOG_CONFIG.table`.
- UI strings (`'Blog'`, `'No posts available.'`, `'Back to Blog'`)
  appear only in `blogConfig.ts`. Both pages reference
  `BLOG_CONFIG.ui.*`.
- Route literals (`'/blog'`, `'/blog/:slug'`) appear only in
  `routes.ts`. `blogConfig.ts` derives via `ROUTES.BLOG` and
  `ROUTES.BLOG_POST`; `App.tsx` references `ROUTES.*` directly;
  `Blog.tsx` builds detail URLs via
  `BLOG_CONFIG.routes.post.replace(':slug', slug)`.

#### Workflow

- `npm run build` -- clean (3916 modules, 19.7s). Only pre-existing
  chunk-size warnings.
- `npm run sync-constants` -- run twice: once at session start to fix
  drift, once after `routes.ts` edit to push BLOG/BLOG_POST.
- `npm run dev` -- Lynn verified empty-state list and 404 branch on
  localhost:8081 before approving deploy.
- `git add` -- explicit file list (NOT `git add .`) to keep
  `supabase/.temp/cli-latest` out of the commit. ASCII guard passed.
- `git push origin main` -- direct push, bypassing `deploy.ps1` so the
  scoped staging persisted. Same outcome as deploy.ps1 (Netlify watches
  `main`).

#### Carry-forwards

1. `supabase/.temp/cli-latest` is gitignored (line 44 of `.gitignore`)
   but is currently TRACKED in git, so every supabase CLI invocation
   leaves it as a modified working-tree file. Untrack it via
   `git rm --cached supabase/.temp/cli-latest supabase/.temp/linked-project.json`
   in a future cleanup commit.
2. CLAUDE.md does not document `npm run sync-constants` or the
   `supabase/functions/_shared/` mirror policy. Add a short section so
   the sync step is not skipped on future SSOT-touching sessions.
3. Several `_shared/` files are NOT in `FILES_TO_SYNC` despite having
   frontend SSOTs (`pricingConfig.ts`, `trialConfig.ts`,
   `validation.ts`, `lessonShapeProfiles.ts`, `seriesConfig.ts`,
   `branding.ts`, `uiSymbols.ts`, `organizationConfig.ts`,
   `betaEnrollmentConfig.ts`, `emailDeliveryConfig.ts`,
   `outputGuardrails.ts`, `customizationDirectives.ts`). They are
   hand-maintained mirrors. Decision needed: extend `FILES_TO_SYNC`,
   or document the hand-maintained set explicitly.

#### Out of scope

No edge function changes. No Stripe / pricing changes. No org-management
changes. No accessibility or copy changes outside the new blog pages.

---

### May 5, 2026 -- Public trust page (Why Churches Can Trust BibleLessonSpark)

#### Summary

New public-facing trust page added at `/why-churches-can-trust-biblelessonspark`,
intended for sharing with church leaders evaluating BLS. One feature commit, one
docs commit. Localhost verified before deploy.

#### 1c5e088 -- FEATURE: trust page + route wiring

`FEATURE: Add public Why Churches Can Trust BibleLessonSpark trust page (route + App.tsx wiring)`

Three files (3 files changed, 228 insertions):

- `src/pages/WhyChurchesCanTrustBibleLessonSpark.tsx` -- new page. Hero,
  ten thematic sections (Built for Faithful Bible Teaching, Aligned with
  Doctrinal Convictions, Real Teachers, Age Groups, More Than an Outline,
  Tool Serves the Church, Generic AI Drift, Small Churches/Plants,
  Disciplers, Trustworthy + Simple), and a closing summary box. Imports
  `ReactNode` only -- no AppShell, no auth, no BRANDING. Lightweight
  marketing page consistent with public-route pattern.
- `src/constants/routes.ts` -- added `WHY_CHURCHES_CAN_TRUST` to the
  public-routes block of `ROUTES`.
- `src/App.tsx` -- imported the new page, added `<Route>` element above
  the catch-all, using `ROUTES.WHY_CHURCHES_CAN_TRUST` (Rule #3 satisfied
  -- both files updated together).

#### Non-ASCII handling

Source content as supplied contained typographic apostrophes (U+2019)
and curly double quotes (U+201C / U+201D) that would have tripped the
ASCII guard. Resolved by encoding all 23 occurrences as JS escape
sequences inside JSX expression containers: `{'’'}`, `{'“'}`,
`{'”'}`. Source file is now zero non-ASCII bytes; browser still
renders proper curly typography. Rule #16 satisfied.

#### Workflow

- `npm run build` -- clean (29s, only pre-existing chunk-size warnings).
- `npm run dev` -- Lynn verified localhost:8080 before approving deploy.
- `.\deploy.ps1` -- ASCII guard passed, pushed `3aa7318..1c5e088`.

#### Carry-forwards

None. Page is self-contained; no SSOT files affected; no backend changes.

---

### May 2, 2026 (Session 5) -- Carry-forward sweep (gitignore, CLAUDE.md, FK audit)

#### Summary

Three carry-forwards from Sessions 3 and 4 closed in two commits. One
edge function redeployed via Supabase CLI; no deploy.ps1 invocation.
Final state: zero open carry-forwards from this stretch of sessions.

#### bc23bdf -- .gitignore + CLAUDE.md path fixes

`CLEANUP: Add supabase/.temp to .gitignore; fix stale seriesExportConfig path in CLAUDE.md`

Two unrelated cleanup items in a single commit (2 files, +4/-2):

- `.gitignore` -- appended `supabase/.temp/` so the two persistent
  CLI cache files (`cli-latest`, `linked-project.json`) stop showing
  up as untracked after every `supabase` CLI invocation. Carry-forward
  from Sessions 2 and 4 closed.
- `CLAUDE.md` lines 122 and 309 -- corrected the stale
  `src/config/seriesExportConfig.ts` path to
  `src/constants/seriesExportConfig.ts`. Line 219 was flagged in the
  task spec but on inspection contained only the bare filename
  (no path prefix) so it was left alone. Carry-forward from
  Sessions 3 and 4 closed.

#### b45bd96 -- approve-org-deletion FK audit and invites cleanup

`FIX: approve-org-deletion -- add invites cleanup before org record deletion (NO ACTION FK)`

Closes the Session 3 carry-forward on org-deletion FK orphan risk.

SQL audit of every foreign key referencing `organizations(id)` showed
that the `invites` table has a `NO ACTION` delete rule -- meaning a
pending invite would block the final `DELETE FROM organizations`
statement and abort the closure flow midway after member emails had
already been sent. All other FKs to `organizations` either `CASCADE`
or `SET NULL`, so no other tables required attention.

Fix is one line: `'invites'` was inserted as the first entry of the
`orgTables` cleanup array in
`supabase/functions/approve-org-deletion/index.ts`. The existing
loop deletes by `organization_id` so no other code change was needed.

Deployed via `npx supabase functions deploy approve-org-deletion
--project-ref hphebzdftpjbiudpfcrs --use-api`. Local commit pushed to
origin/main after the deploy completed.

#### Carry-forwards status

All three open items closed:

1. `supabase/.temp/` gitignore -- DONE (bc23bdf).
2. CLAUDE.md `seriesExportConfig` stale paths -- DONE (bc23bdf).
3. `approve-org-deletion` FK orphan sweep -- DONE (b45bd96).

#### Out of scope

No frontend changes. No SSOT constants modified. No other edge
function touched. No deploy.ps1 invocation. No Netlify deploy.

---

### May 2, 2026 (Session 4) -- Backend cleanup and non-ASCII audit

#### Summary

Two carry-forward items closed, one deferred. No frontend touched, no
edge function logic touched, no deploy.ps1 run. Two commits this
session: a cleanup commit deleting stale backup files and this docs
commit.

#### #7 closed (f68d40d) -- Stale .backup files removed

`CLEANUP: Delete 4 stale .backup files from supabase/functions`

Diagnostic find under `supabase/functions/` surfaced four orphan
`.backup` files left behind by prior edits:

```
supabase/functions/_shared/lessonTiers.ts.backup
supabase/functions/_shared/pricingConfig.ts.backup
supabase/functions/_shared/subscriptionCheck.ts.backup
supabase/functions/generate-lesson/index.ts.backup
```

Confirmed not deployed and not imported anywhere. Removed via
`git rm` in a single commit -- 4 files, 703 deletions.

#### #8 closed (no changes) -- Non-ASCII audit of _shared/ files

Seven non-sync files in `supabase/functions/_shared/` were scanned
byte-by-byte for characters above codepoint 127. All seven contained
non-ASCII; none required changes. Findings:

- `emailDeliveryConfig.ts`, `lessonShapeProfiles.ts`,
  `outputGuardrails.ts`, `trialConfig.ts` -- em dashes (U+2014) in
  comments and string literals.
- `branding.ts` -- single party emoji in the welcome-message string.
- `customizationDirectives.ts` -- empty-checkbox glyph (U+2610) used
  as a literal checkbox marker inside prompt strings sent to the AI
  model. Removing it would change AI output formatting.
- `uiSymbols.ts` -- intentional SSOT symbol map. The exported const
  `UI_SYMBOLS` defines `BULLET: '*'` (U+2022), `EM_DASH: '--'`
  (U+2014), `ELLIPSIS: '...'` (U+2026) etc. The whole purpose of the
  file is to centralize Unicode glyphs so the rest of the codebase
  imports rather than typing them inline. False-alarm note: my
  initial scan reported the bullet bytes as mojibake; they are
  correctly UTF-8 encoded.

Conclusion: the deploy.ps1 ASCII guard pre-commit hook only inspects
files staged through the frontend deploy path. Edge function source
files are deployed via `npx supabase functions deploy --use-api`
which has no ASCII enforcement, so intentional Unicode payloads in
backend SSOTs are fine. No action required.

#### #9 deferred -- pricingConfig.ts / orgPricingConfig.ts unification

Two pricing config files exist in the backend `_shared/` mirror layer.
Unifying them touches the Stripe webhook tier-resolution path
(Rule #17) and the org Stripe webhook path. Deferred to a dedicated
session where a full SSOT audit of every consumer can run before any
edit lands.

May 2 Session 5 audit: orgPricingConfig.ts does not exist in
supabase/functions/_shared/. The backend mirror has a single
pricingConfig.ts already serving both individual and org concerns
(exports ORG_TIERS, STRIPE_INDIVIDUAL, resolveTierFromPriceId,
TIER_LESSON_LIMITS alongside individual tier constants). Three edge
functions consume it correctly. Frontend src/constants/pricingConfig.ts
and src/constants/orgPricingConfig.ts are separate SSOTs for separate
domains -- correct as designed. Carry-forward closed as non-issue.

#### Carry-forwards still open

- CLAUDE.md SSOT File Map lists `seriesExportConfig` under
  `src/config/` but the actual file lives at `src/constants/`. Stale
  path note. Deferred to a future CLAUDE.md cleanup pass.
- `supabase/.temp/cli-latest` and `supabase/.temp/linked-project.json`
  are persistent untracked CLI cache files that reappear after every
  supabase CLI invocation. Carry forward a decision on whether to
  add `supabase/.temp/` to `.gitignore`.
- `approve-org-deletion` schema sweep (Session 3 carry-forward) --
  enumerate every `organization_id`-bearing table and verify FK
  cascade behavior to prevent orphan rows after org closure.

#### Out of scope

No frontend changes. No edge function logic changes. No SSOT
constants modified. No deploy.ps1 invocation. No Supabase functions
redeployed.

---

### May 2, 2026 (Session 3) -- Org deletion approval workflow (full stack)

#### Summary

Complete approval-gated organization closure workflow shipped end to end
in four phases. An org_manager can request closure from OrgManager
settings; a platform admin sees the pending queue in Admin > People >
Organizations and approves it; on approval all org members are emailed
and org-linked rows are deleted in dependency order. No org data is
removed until an admin clicks Approve.

#### Phase 1 -- SSOT contracts (c20066d)

`SSOT: Add ORG_DELETION_REQUEST constants and Organization deletion fields to contracts`

- `src/constants/organizationConfig.ts` -- new `ORG_DELETION_REQUEST`
  const exporting `statuses` (none/pending/approved), `rules`
  (whoCanRequest=org_manager, whoCanApprove=admin,
  requiresAdminApproval=true), `uiCopy` (request button, pending badge,
  confirm copy, admin badge, approve button label) and `notifications`
  (admin email recipients: eckbrosmediallc@gmail.com,
  support@biblelessonspark.com). New `OrgDeletionStatus` type.
- `src/constants/contracts.ts` -- `Organization` interface gained
  optional `deletion_requested_at: string | null` and
  `deletion_requested_by: string | null`.

#### Phase 2 -- Migration (8a5ae47)

`MIGRATION: Add deletion_requested_at and deletion_requested_by to organizations`

`supabase/migrations/20260502174508_add_org_deletion_request_columns.sql`
adds both columns to the `organizations` table. Applied via
`npx supabase db push --linked` per Rule #20. Live database confirmed.

#### Phase 3 -- Edge Functions (e3e0e55)

`FEATURE: Add request-org-deletion and approve-org-deletion Edge Functions`

Two new functions deployed via `npx supabase functions deploy --use-api`:

- `request-org-deletion` -- authorizes the caller is the org_manager of
  the current org, sets `deletion_requested_at = now()` and
  `deletion_requested_by = auth.uid()` on the row, and emails both admin
  addresses listed in `ORG_DELETION_REQUEST.notifications.adminEmails`
  via Resend. Idempotent on the row update.
- `approve-org-deletion` -- authorizes the caller via
  `has_role('admin')`, fetches all org members, emails every member a
  closure notification before any destructive operation, then deletes
  org-linked rows in dependency order and finally the organizations row.

#### Phase 4 -- Frontend wiring (40383ae)

`FEATURE: Org deletion request UI -- OrgManager request button + Admin approval queue`

Two files only, +148 lines:

- `src/pages/OrgManager.tsx` -- Settings tab gains a destructive-bordered
  "Organization Closure" card visible only when `userRole ===
  'org_manager'`. If `organization.deletion_requested_at` is already set,
  shows the amber pending badge with awaiting-review copy; otherwise
  shows the Request button which fires `window.confirm` using
  `ORG_DELETION_REQUEST.uiCopy.confirmTitle/confirmBody` then POSTs to
  `request-org-deletion`. All copy sourced from the SSOT const --
  zero hardcoded strings.
- `src/pages/Admin.tsx` -- Organizations sub-tab queries
  `organizations` for rows with `deletion_requested_at IS NOT NULL`
  ordered ascending and renders them above `<OrganizationManagement />`
  as a destructive-styled queue. Each row has an Approve button that
  POSTs to `approve-org-deletion` with `org_id` and removes the row from
  local state on success. Count badge has `aria-label`, each queue row
  has `role="alert"` and `aria-live="polite"`. All copy sourced from
  `ORG_DELETION_REQUEST.uiCopy`.

#### Verification

- ASCII guard PASS on both frontend files.
- `npm run build` clean -- 3912 modules, 38.33s, zero errors.
- Manual `git add` of the two named files (avoided deploy.ps1's
  `git add .` per the narrow-scope rule for the source-code commit).

#### Deploy (3504ce7)

`FEATURE: Org deletion approval workflow -- full stack complete`

`.\deploy.ps1` ran clean and pushed to origin/main. The deploy commit
also picked up the two unstaged supabase CLI cache files
(`supabase/.temp/cli-latest`, `supabase/.temp/linked-project.json`)
that were already present in the working tree at session start --
no new src files were added by the deploy commit.

#### Carry-forwards CC flagged

1. `approve-org-deletion` cleans 5 org-linked tables only. If other
   tables carry an `organization_id` FK without `ON DELETE CASCADE`,
   orphan rows are possible after closure. Audit deferred -- needs a
   schema sweep to enumerate all `organization_id`-bearing tables and
   their FK behavior.
2. CLAUDE.md SSOT File Map lists `seriesExportConfig` under
   `src/config/` but the actual file lives at `src/constants/`. Stale
   path note. Deferred to a future CLAUDE.md cleanup.

#### Out of scope

No other pages, components, or edge functions touched. No SSOT
constants modified outside `organizationConfig.ts` (Phase 1).

---

### May 2, 2026 (Session 2) -- admin-delete-user rewrite + teaching team dissolution emails

#### Two carry-forwards closed in one commit

c28d699 -- FIX: admin-delete-user -- 30-table explicit cleanup + teaching
team dissolution emails. Edge function rewritten and deployed directly via
`npx supabase functions deploy admin-delete-user --project-ref hphebzdftpjbiudpfcrs --use-api`.
Local commit pushed to origin/main after the deploy completed. (1 file,
+137/-49.)

Edge function deployments bypass deploy.ps1 and Netlify entirely; the
Netlify pipeline only handles the React frontend. Supabase functions ship
directly via the supabase CLI to project hphebzdftpjbiudpfcrs.

#### Carry-forward (a) -- 30-table explicit cleanup (never previously shipped)

Despite an April 13 session-log entry that referenced this work, the
deployed admin-delete-user function (verified May 2 via
`supabase functions download admin-delete-user --use-api` then
`git diff` -- zero diff) was still the original minimal version. It only
called `adminClient.auth.admin.deleteUser(user_id)` and relied on database
FK cascade rules for the rest of the cleanup. No explicit table deletes
were present; no notification logic was present.

The new STEP 3 block deletes from 30 user-linked tables in dependency
order before invoking the auth admin delete in STEP 4. Each table delete
is best-effort: failures log a `WARN: cleanup failed for <table>` prefix
and the loop continues, so a missing table or permission gap does not
abort the user deletion. The single special case is `teaching_teams`,
which keys on `lead_teacher_id` instead of `user_id`. Table list, in
dependency order:

generation_metrics, reshape_metrics, guardrail_violations, events,
outputs, beta_feedback, feedback, email_sequence_tracking, email_rosters,
notifications, parable_usage, modern_parables, devotional_usage,
devotionals, devotional_series, refinements, lessons, lesson_series,
teaching_team_members, teaching_teams, transfer_requests, credits_ledger,
setup_progress, org_shared_focus, organization_focus,
organization_members, beta_testers, invites, user_roles,
teacher_preference_profiles, user_subscriptions, profiles.

#### Carry-forward (b) -- teaching team dissolution notification

New STEP 1 finds all teams where the deleted user is `lead_teacher_id`
and joins to gather the other members of those teams via
`teaching_team_members` and the `profiles` table (full_name + email).
STEP 2 sends each member a Resend email titled "Your Teaching Team Has
Been Dissolved" before any destructive operation runs. Email failures are
non-fatal -- they log a `WARN: Failed to send dissolution email` line but
do not block the subsequent deletion steps.

#### Two minor items CC flagged, accepted as-is

1. Email-before-delete ordering. STEP 2 sends emails before STEP 3/4 run.
   If cleanup or auth-delete fails after the email is sent, members
   receive a "team dissolved" message about a team that still exists.
   Accepted intentionally -- the alternative (email after success) leaves
   recipients uninformed if the function crashes between the cleanup and
   the email send.

2. Hardcoded `from` address. The Resend send uses
   `'BibleLessonSpark <support@biblelessonspark.com>'` directly rather
   than reading `getEmailFrom()` from `_shared/branding.ts` (the SSOT
   used by `notify-team-invitation/index.ts`). Minor SSOT drift on
   outbound email branding; deferred to a future cleanup pass.

#### Verification

- File written via `[System.IO.File]::WriteAllText` with
  `UTF8Encoding($false)` (the CLAUDE.md-mandated method for source files).
  First 3 bytes `69 6D 70` ("imp...") confirm no BOM, 7,719 bytes total.
- ASCII guard PASS: zero non-ASCII characters in the rewritten file.
- Pre-commit hook PASS: `All staged files are ASCII-clean.`
- `npx supabase functions deploy --use-api` succeeded; dashboard URL:
  https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/functions
- Two unstaged CLI cache files (`supabase/.temp/cli-latest`,
  `supabase/.temp/linked-project.json`) appeared during the diagnostic
  download/deploy passes. Left unstaged per the narrow-scope rule;
  consider .gitignoring them in a future cleanup.

#### Out of scope

No frontend changes. No SSOT constants modified. No other edge function
touched. PROJECT_MASTER.md updated in a separate DOCS commit immediately
after this entry was added.

---

### May 2, 2026 -- Church Plant Teaching Capacity Report public page

#### One commit, one new public route

eeec5de -- FEATURE: Add 2026 Church Plant Teaching Capacity Report public
page. Standalone marketing/research page at /church-plant-teaching-capacity-report
publishing a literature-based ministry analysis of volunteer readiness and
multi-age teaching challenges in church plants. (3 files, +261/-1.)

#### Files changed

1. src/constants/routes.ts -- added CHURCH_PLANT_REPORT public route constant
   in the public-routes block immediately after COMMUNITY.
2. src/App.tsx -- imported ChurchPlantReport page component, registered a
   public Route (no ProtectedRoute wrapper) between COMMUNITY and PRIVACY in
   the public-routes group.
3. src/pages/ChurchPlantReport.tsx (NEW, 261 lines) -- standalone public page,
   no auth or subscription gates. Uses BRANDING.layout.legalPageWrapper /
   legalPageCard for site-consistent styling. Semantic HTML throughout
   (main / article / section / h1-h3 / ul / p) with aria-labelledby on every
   section. useEffect sets document.title and meta description on mount and
   restores both on unmount (no react-helmet dependency in this project).
   Zero imports from any SSOT constant file (pricingConfig, trialConfig,
   theologyProfiles, ageGroups) -- the page is pure content. ASCII-only.

#### Content (verbatim from Lynn's brief, not summarized)

Executive Summary, Introduction, Methodology (with bulleted source list),
five Key Findings as H3 subsections, Implications for Church Plants,
Conclusion, and Sources. Hero section labels the report type as "Literature-
Based Ministry Analysis" and includes an italicized disclosure that the
report does not claim original survey data. Sources cited: Barna, Lifeway,
Pew, NAMB / Send Network (2015-2024).

#### Verification performed before deploy

- ASCII guard ran clean on all three modified/new files (zero non-ASCII chars).
- npm run build -- PASS in 30.60s, 3912 modules transformed, zero errors.
- Dev server started on port 8080; Lynn verified the page on localhost and
  approved the deploy explicitly.
- git status --short before deploy.ps1 showed only the three task files;
  no unrelated drift, so deploy.ps1's `git add .` was safe to use as-is.

#### Out of scope on purpose

No backend work, no SSOT constants modified, no theology / pricing / trial /
auth / lesson / export / subscription file touched. The page is a pure
read-only public landing page; it does not need a backend mirror in
supabase/functions/_shared/.

---

### April 28, 2026 -- Baptist Terminology Guardrails SSOT Remediation + Backend Mirror Sync

#### Two commits, two carry-forwards closed

1. 03068f2 -- FIX: Port Baptist terminology guardrails from backend mirror to
   frontend SSOT. Closes carry-forward (i) from April 27 Session 2. Ported the
   protective content that had been hand-edited into the backend mirror in
   January 2026 but never made it into the frontend SSOT, where it would have
   been silently erased on the next sync run. (1 file, +280/-20.)

2. f0def85 -- SYNC: Regenerate backend mirrors from frontend SSOT -- ports
   Baptist terminology guardrails. Closes carry-forward (g) from April 27
   Session 2. The deferred backend-mirror sync that had been blocked on (i).
   All 14 mirror files in supabase/functions/_shared/ regenerated from the
   now-protective frontend SSOT. (14 files, +773/-636.)

#### Carry-forward (i) -- ministry-critical terminology remediation

The April 27 Session 2 audit found the backend mirror at HEAD contained a
CRITICAL TERMINOLOGY FIX block dated January 2026 that was NOT in the
frontend SSOT. The mirror was therefore the de-facto source of truth for
the universal Baptist terminology guardrails -- a direct SSOT inversion
that would have caused those guardrails to be silently deleted on the
next sync. Today's work brings the frontend to parity.

Three-step protocol with explicit approval gates: AUDIT (read both files,
inventory what's missing) -> PLAN (23 surgical edits with approval) ->
IMPLEMENT (Edit tool only, no Write tool, byte-level checks on each anchor).

The 23 edits, by category:
- 1 docblock note: "CRITICAL TERMINOLOGY FIX (January 2026)" added to the
  file header explaining why the per-profile additions exist and which
  profile (Reformed Baptist) is exempt.
- 9 per-profile avoidTerminology additions: "sacrament", "sacraments",
  "Eucharist" added to the end of the array on profiles 1-9 (NOT Reformed
  Baptist), each preceded by a `// CRITICAL: Baptists use "ordinance" not
  "sacrament" (except Reformed Baptist)` comment.
- 9 per-profile preferredTerminology additions: sacrament -> ordinance,
  sacraments -> ordinances, Eucharist -> Lord's Supper added to the same
  9 profiles, each preceded by a `// CRITICAL: Baptist terminology for
  ordinances` comment.
- 1 BAPTIST_TERMINOLOGY_GUARDRAILS const block (~135 lines) inserted
  between THEOLOGY_PROFILES array close and HELPER FUNCTIONS banner.
  Contains 4 sub-objects: prohibitedForBaptistPractices (19 terms),
  substitutions (19 mappings), contextualExceptions (4 entries),
  preferredTerms (30 terms).
- 1 generateBaptistTerminologyGuardrails() function inserted before
  generateTheologicalGuardrails(). Renders the const into a prompt block.
- 1 wiring line: `guardrailsBlock += '\n\n' + generateBaptistTerminologyGuardrails();`
  appended inside generateTheologicalGuardrails() so every per-profile
  prompt now also receives the universal Baptist terminology rules.
- 1 verification step #6 added to the FINAL VERIFICATION checklist:
  "No non-Baptist terminology appears (see Baptist Terminology Guardrails below)".

ASCII conversions performed during port (the backend mirror had non-ASCII
chars that would fail the frontend ASCII guard):
- Em dash in heading: `BAPTIST TERMINOLOGY GUARDRAILS — UNIVERSAL COMPLIANCE`
  -> `BAPTIST TERMINOLOGY GUARDRAILS -- UNIVERSAL COMPLIANCE`
  (matches existing convention at the older `THEOLOGICAL GUARDRAILS --
  MANDATORY COMPLIANCE` heading).
- Arrow in substitution template: `Instead of "${avoid}" -> use "${use}"`
  -> `Instead of "${avoid}" ? use "${use}"` (matches the existing `?`
  placeholder pattern in generateTheologicalGuardrails template at
  pre-edit line 964).

Build clean (`✓ built in 25.17s`, 3911 modules, zero errors). ASCII guard
passed. Working tree clean after commit.

#### Carry-forward (g) -- backend mirror sync (deferred from April 27)

After (i) landed, ran `npm run sync-constants`. All 14 mirror files in
supabase/functions/_shared/ regenerated from the frontend SSOT. The sync
pre-flight script-fix (227a674 from April 27 Session 2) worked: the
header timestamp is now static, so future no-change runs will produce
zero diffs.

Beyond the Baptist guardrails port, the sync also captured several latent
SSOT-mirror divergences that had accumulated since the mirror was last
regenerated (Jan 28, 2026):

1. theologyProfiles.ts mirror gained:
   - `import type { TheologyProfileId, SecurityDoctrine, TulipStance } from './contracts';`
     (mirror had been inlining the union types).
   - `badgeClass: string` field on the interface and on all 10 profile
     entries (added to frontend in Feb-Apr 2026 but never synced).
   - `DEFAULT_THEOLOGY_PROFILE_ID`, `DEFAULT_BADGE_CLASS`,
     `getProfileBadgeClass` SSOT helpers (frontend-only until today).
   - Em-dash conversions in summary strings on 3 profiles
     (southern-baptist-bfm-1963, southern-baptist-bfm-2000, free-will-baptist)
     and the inner `--but does not coerce` clause on NBC -- the mirror had
     literal `—` (U+2014) glyphs from prior hand-edits; sync replaced them
     with the frontend's `--` ASCII convention.

2. systemSettings.ts mirror diff: +354 lines net. Largest file delta in
   the sync. (Reflects accumulated drift between SSOT and mirror; not
   reviewed line-by-line in this session.)

3. contracts.ts mirror diff: +273 lines. Includes union-type updates that
   propagate to other consumer mirrors (notably theologyProfiles.ts).

4. generationMetrics.ts: +252 lines.

5. Smaller deltas across the remaining 10 files (rateLimitConfig,
   routes, lessonStructure, freshnessOptions, bibleVersions, ageGroups,
   teacherPreferences, lessonTiers, devotionalConfig, toolbeltConfig).

Edge-function code-path audit was performed in April 27 Session 2:
zero active code references to the renamed/removed types
(theologicalPreference, sbConfessionVersion, TheologicalPreferenceKey,
SBConfessionVersionKey). All matches were in `.backup` files (not
deployed) or in the new contracts.ts CHANGELOG comment. The sync was
runtime-safe.

Pre-commit ASCII guard passed cleanly on the 14-file commit -- the
script's em-dash/arrow normalization avoided what would have been a
hard block.

Note: 9 of 14 mirror files triggered a `LF will be replaced by CRLF`
warning from git (autocrlf normalization on next checkout). This is
preexisting working-tree behavior and did not affect what was committed
(the index stores LF). Not introduced by this session's work.

#### Closed carry-forwards (from April 27 Session 2 list)

(g) Backend mirror sync -- closed via f0def85.
(i) Baptist terminology guardrails remediation -- closed via 03068f2.

#### Open carry-forwards (renumbered)

(b) Full Parables sweep -- separate session (unchanged).
(j) Backend mirror backup file cleanup -- 8 .backup files in
    supabase/functions/ awaiting decision (unchanged).
(k) supabase/functions/_shared/ non-ASCII cleanup for 7 non-sync files
    (emailDeliveryConfig.ts, branding.ts, lessonShapeProfiles.ts,
    outputGuardrails.ts, customizationDirectives.ts, trialConfig.ts,
    uiSymbols.ts; uiSymbols.ts has actual mojibake on line 10).
    Unchanged. These are NOT in FILES_TO_SYNC so today's sync did not
    touch them.

#### Build / verification

- npm run build: clean (25.17s, 3911 modules, zero errors).
- ASCII guard: passed on both code commits (03068f2 and f0def85).
- Working tree state at session end (before this PROJECT_MASTER commit):
  clean. Both code commits pushed to origin/main.

#### Process notes worth keeping

- Combined-block anchoring is the right move when multiple Baptist
  profiles share byte-for-byte-identical preferredTerminology objects
  (SBC 1963 and SBC 2000). Used the unique `"the elect" ,` (space-comma)
  pattern in SBC 1963 vs `"the elect",` (no space) in SBC 2000 as the
  disambiguator. Worked on first try; no Edit-tool ambiguity errors.
- The frontend's existing `?` placeholder for the substitution arrow
  (line 964 pre-edit) is a deliberate ASCII-safe stand-in for `->`.
  New content added in Edit E must match that convention to avoid
  re-introducing non-ASCII into src/.
- The sync reliably converts non-ASCII glyphs in mirror summaries to
  the frontend's ASCII conventions. This means a clean `npm run
  sync-constants` is also a passive ASCII-cleanup pass for the 14 files
  in FILES_TO_SYNC. The 7 non-sync `_shared/` files (carry-forward (k))
  do not get this treatment and need a separate scrub.
- The April 27 Session 2 decision to NOT push the partial sync, and
  instead surface (i) as a blocker before any sync hit production, was
  correct. Pushing yesterday's sync would have erased the protective
  Baptist terminology guardrails from production AI prompts. The
  guardrails-erased state would have been undetectable from build logs,
  type checks, or grep on src/ -- only manifest as gradual non-Baptist
  language seeping into generated lessons over time.

#### Commits This Session

- 03068f2 FIX: Port Baptist terminology guardrails from backend mirror
  to frontend SSOT
- f0def85 SYNC: Regenerate backend mirrors from frontend SSOT -- ports
  Baptist terminology guardrails
- (this commit) DOCS: Update PROJECT_MASTER.md with April 28 session log

#### Pending Uncommitted Modifications (Carry Forward)

None. Working tree clean before this DOCS commit.

---

### April 27, 2026 (Session 2) -- ASCII Sweep + generate-css.cjs Fix + Sync Attempt Blocked

#### Three commits landed
1. 12b0ca0 -- CLEANUP: ASCII sweep NotificationBell/index/BetaAnalytics
   + remove dead code UpgradePromptModal. Closes carry-forwards (c),
   (d), and (h) from the morning session in one bundled commit.
   (4 files, +7/-10.)

2. 994d599 -- CLEANUP: Fix generate-css.cjs ASCII arrows + remove
   timestamp -- stops index.css build-dirt. Closes carry-forward (e).
   Replaced the literal U+2192 arrows on lines 132/133/134 of the
   generated CSS comment header with ASCII '->' and replaced the
   per-build `Generated: ${new Date().toISOString()}` line on line 129
   with a static `Generated by scripts/generate-css.cjs`. Bundled the
   regenerated src/index.css in the same commit so HEAD matches what
   the deterministic generator produces; future builds no longer dirty
   the working tree. Required two iterations: the first attempt left
   `->` JS escapes in the .cjs source, which the template literal
   evaluated back to the arrow glyph at build time, so index.css was
   still non-ASCII. Diagnosis surfaced that the recurring
   `M src/index.css` after every build was driven by the timestamp
   line, not the arrows. Final fix dropped both. (2 files, +8/-8.)

3. 227a674 -- CLEANUP: Fix sync-constants.cjs timestamp -- removes
   per-run header churn from backend mirrors. Same pattern as 994d599:
   replaced the per-run timestamp line in the generateHeader template
   with a static `Generated by scripts/sync-constants.cjs` so future
   sync runs do not produce timestamp-only diffs across all 14 mirror
   files. (1 file, +1/-1.)

#### Carry-forward (g) backend mirror sync -- ATTEMPTED then REVERTED

The script timestamp fix landed cleanly as 227a674. The actual sync of
all 14 mirror files (npm run sync-constants from repo root) ran
successfully and produced 14 modified files with +783/-906 line deltas.
Pre-flight inventory and ASCII verification on the synced output were
clean (zero non-ASCII in any of the 14 sync targets).

However a deeper drift audit BEFORE staging surfaced a critical SSOT
inversion in theologyProfiles.ts: the backend mirror at HEAD contains a
CRITICAL TERMINOLOGY FIX block dated January 2026 that is NOT present
in the frontend SSOT src/constants/theologyProfiles.ts. The fix added
universal Baptist terminology guardrails to every Baptist profile
except Reformed Baptist. Specifically, the backend mirror has -- and
the sync would silently delete:

  - Per-profile sacrament/sacraments/Eucharist entries in
    avoidTerminology arrays of 9 of 10 profiles
  - Per-profile sacrament -> ordinance and Eucharist -> Lord's Supper
    entries in preferredTerminology of those same 9 profiles
  - The entire BAPTIST_TERMINOLOGY_GUARDRAILS const block (~136 lines)
    containing prohibitedForBaptistPractices (19 terms),
    substitutions (19 mappings), contextualExceptions (4 entries), and
    preferredTerms (30 Baptist-authentic vocabulary entries)
  - The generateBaptistTerminologyGuardrails() function (~40 lines)
    that injects the universal rules into every AI prompt
  - The call to that function from generateTheologicalGuardrails() so
    the universal rules are appended to per-profile guardrails
  - Verification step #6 ("No non-Baptist terminology appears...")
    from the AI's self-check checklist

Frontend audit confirmed: src/constants/theologyProfiles.ts contains
ZERO references to "sacrament" or "Eucharist" -- the frontend has no
mechanism to prevent the AI from emitting Catholic/Anglican
terminology in generated lessons.

Edge function audit (grep on supabase/functions/ for
theologicalPreference, sbConfessionVersion, TheologicalPreferenceKey,
SBConfessionVersionKey): ZERO active code references. All matches were
in .backup files (not deployed) or in the new contracts.ts CHANGELOG
comment. The contracts.ts portion of the sync would have been
runtime-safe.

Resolution: All 14 synced mirror files were reverted to HEAD via
`git checkout HEAD -- supabase/functions/_shared/`. No mirror sync
content was committed. Carry-forward (g) is therefore PARTIALLY
COMPLETE: the script fix (227a674) ships, the actual sync is deferred
until the frontend SSOT is brought up to parity with the backend
mirror's protective content (carry-forward (i) below).

#### Out-of-band SSOT violation -- circumstantial evidence

Eight .backup files were found in supabase/functions/ during the audit:
  - generate-lesson/index.ts.backup-20260118 (31,722 bytes)
  - generate-lesson/index.ts.backup-20251122-132149 (17,990 bytes)
  - generate-lesson/index.ts.backup (22,618 bytes)
  - generate-parable/index.ts.backup-guardrails-20251221-172747
    (32,540 bytes)
  - create-org-checkout-session/index.backup.ts (5,019 bytes)
  - _shared/lessonTiers.ts.backup (2,375 bytes; has BOM at byte 0)
  - _shared/pricingConfig.ts.backup (1,193 bytes)
  - _shared/subscriptionCheck.ts.backup (1,590 bytes)

The 20260118 (Jan 18, 2026) date sits ~10 days before the original
mirror header timestamp (Jan 28, 2026 per the prior auto-generated
header). Combined with the BOM on lessonTiers.ts.backup and BOMs
previously found on the contracts.ts and ageGroups.ts mirrors before
sync, this is consistent with -- though not proof of -- past direct
edits to the backend mirror tree, violating SSOT in spirit.

#### New carry-forwards

(i) Baptist terminology guardrails remediation -- MINISTRY-CRITICAL.
    Port the BAPTIST_TERMINOLOGY_GUARDRAILS const block, the
    per-profile sacrament/Eucharist entries, the
    generateBaptistTerminologyGuardrails() function, the call to it
    from generateTheologicalGuardrails(), and verification step #6
    from supabase/functions/_shared/theologyProfiles.ts (current HEAD)
    into src/constants/theologyProfiles.ts. After that lands, re-run
    npm run sync-constants. Until this is done, the frontend SSOT
    cannot drive backend safely -- the sync will erase production
    guardrails on every run. This blocks (g).

(j) Backend mirror backup file cleanup. 8 .backup files scattered
    across supabase/functions/ (3 in _shared/, 5 in function dirs).
    They are not deployed but they clutter the tree, obscure git
    status, and provide circumstantial evidence of past out-of-band
    edits. Decide which (if any) to keep; delete the rest.

(k) supabase/functions/_shared/ non-ASCII cleanup for 7 files outside
    the sync scope: emailDeliveryConfig.ts, branding.ts,
    lessonShapeProfiles.ts, outputGuardrails.ts,
    customizationDirectives.ts, trialConfig.ts, uiSymbols.ts. Note:
    uiSymbols.ts line 10 has actual mojibake (double-encoded UTF-8
    sequences) that should be repaired. These 7 files are NOT in the
    sync FILES_TO_SYNC list so sync-constants.cjs will not overwrite
    them; they need a separate pass.

#### Closed carry-forwards (from morning session list)

(c) NotificationBell.tsx ASCII sweep -- closed via 12b0ca0.
(d) src/constants/index.ts + BetaAnalyticsDashboard.tsx ASCII sweep
    -- closed via 12b0ca0.
(e) scripts/generate-css.cjs arrow glyph fix (src/index.css regen)
    -- closed via 994d599.
(h) UpgradePromptModal.tsx dead code -- closed via 12b0ca0.

#### Open carry-forwards (renumbered)

(b) Full Parables sweep -- separate session (unchanged from morning).
(g) Backend mirror sync -- partially complete; blocked on (i).
(i) Baptist terminology guardrails remediation [new].
(j) Backend mirror backup file cleanup [new].
(k) supabase/functions/_shared/ non-ASCII cleanup for 7 non-sync
    files [new].

#### Build / verification

- npm run build: clean across all three commits (23.32s and 27.21s
  observed; zero errors; 3911 modules transformed).
- ASCII guard: passed on all three commits.
- Working tree state at session end (before this PROJECT_MASTER
  commit): clean. src/index.css no longer dirties on build (closed
  via 994d599).

#### Process notes worth keeping

- generate-css.cjs fix surfaced that the recurring `M src/index.css`
  after every build was timestamp-driven, not arrow-driven. The
  arrows had been in committed HEAD all along (deploy ASCII guard
  apparently does not gate .css files). The .cjs `->` JS escape
  evaluates to the arrow glyph at build time, so escape-only fixes
  do not solve the index.css cleanliness goal -- need ASCII '->' in
  the template literal directly.
- Same pattern (per-run timestamp causing build-dirt) was confirmed
  in sync-constants.cjs and fixed proactively before running the
  sync, avoiding 14 timestamp-only diffs on every future sync run.
- The Edit tool can normalize between literal Unicode and \uXXXX
  escapes silently. For source-file fixes that must round-trip
  through Read/Edit, byte-level PowerShell or a Node .cjs helper is
  more reliable. Used a one-shot Node helper (fix-generate-css.cjs,
  deleted after run) for the generate-css.cjs fix when PowerShell
  string matching produced confusing zero-match results.

#### Commits This Session

- 12b0ca0 CLEANUP: ASCII sweep NotificationBell/index/BetaAnalytics
  + remove dead code UpgradePromptModal
- 994d599 CLEANUP: Fix generate-css.cjs ASCII arrows + remove
  timestamp -- stops index.css build-dirt
- 227a674 CLEANUP: Fix sync-constants.cjs timestamp -- removes
  per-run header churn from backend mirrors
- (this commit) DOCS: Update PROJECT_MASTER.md with April 27 Session
  2 log

#### Pending Uncommitted Modifications (Carry Forward)

None. The morning session's pending src/index.css modification is
closed via 994d599 above.

---

### April 27, 2026 -- Per-Item Locked Sidebar Micro-Copy + Carry-Forward Cleanup

#### Three commits, two carry-forwards closed
This session executed three discrete tasks, each landed as its own commit:

1. 40cba75 -- DOCS: Append April 26 Pass 2 session log; fix backend mirror
   BETA_SIGNUP drift; register sync-constants script. Resolved the
   PROJECT_MASTER.md update deferred from April 26, plus the post-push
   correction to supabase/functions/_shared/routes.ts (surgical BETA_SIGNUP
   removal) and added "sync-constants": "node scripts/sync-constants.cjs"
   to package.json so future backend-mirror sync runs work. The original
   routes.ts had a UTF-8 BOM at byte 0 (likely from the 2026-02-18 last
   regeneration) that blocked the ASCII guard on first commit attempt;
   stripped it byte-level via [System.IO.File]::ReadAllBytes /
   WriteAllBytes then re-staged. (3 files, +290/-8.)

2. d08378b -- CLEANUP: Delete BetaSignup.tsx -- zero consumers, route
   deprecated April 26. Closes carry-forward (a) from April 26. Pre-delete
   grep verified zero live consumers in src/ or supabase/. Build clean.
   (1 file, -317.)

3. b534f6a -- FEATURE: Wire per-item locked sidebar micro-copy into
   UpgradePromptModal. Closes carry-forward (f) from April 26. Three-step
   audit / plan / implement workflow with explicit approval gates between
   steps. (3 files, +30/-7.)

#### Per-item locked sidebar micro-copy -- wiring details
Architecture: trigger value === sidebar item id, so the modal can do
SIDEBAR_ITEMS[trigger]?.lockedCopy with no separate lookup table.
Trigger names are camelCase ('devotionalLibrary', 'seriesLibrary',
'teachingTeam') matching the SIDEBAR_ITEMS keys exactly. The existing
'feature_teaser' / 'limit_reached' / 'manual' triggers continue to work
unchanged and fall through to the generic teacher-step copy.

Files touched (all in commit b534f6a):
- src/constants/sidebarConfig.ts -- added lockedCopy?: string field to
  SidebarItem interface; populated on devotionalLibrary, seriesLibrary,
  and teachingTeam with copy verbatim from CLAUDE.md.
- src/components/subscription/UpgradePromptModal.tsx -- imported
  SIDEBAR_ITEMS; widened trigger union; ternary-branched the
  DialogDescription body on the three sidebar triggers (per-item copy
  vs. generic Fragment-wrapped fallback). Existing JSX em-dash escape
  on the fallback line preserved unchanged.
- src/components/layout/AppShell.tsx -- widened
  SidebarContentProps.onLockedItemClick to (item: SidebarItem) => void;
  threaded item through the locked-button onClick + onKeyDown handlers;
  added upgradeTrigger state with default 'feature_teaser';
  handleLockedItemClick narrows item.id to the three known ids and
  sets the trigger accordingly (else fallback to 'feature_teaser');
  the Pricing button (action: 'openUpgradeModal') resets trigger to
  'feature_teaser' so a stale per-item value cannot leak in across
  consecutive opens; the modal mount now uses trigger={upgradeTrigger}.

Defensive-code note: the else branch in handleLockedItemClick covers any
future paid_only item added without lockedCopy. The modal still works,
just with the generic fallback.

No other callers of UpgradePromptModal needed changes; the trigger union
widening is purely additive.

#### STATUS block trigger-name note
Lynn's session-end protocol prompt requested STATUS block trigger names
in a mixed casing ('devotionalLibrary' | 'series_library' |
'teaching_team'). The actual implementation uses camelCase across all
three (matching the SIDEBAR_ITEMS keys, since the modal does
SIDEBAR_ITEMS[trigger] lookup; snake_case names would require a separate
translation map). Flagged the discrepancy in the assistant reply before
writing this commit. CLAUDE.md and PROJECT_MASTER.md document the actual
implementation. If snake_case is preferred for any reason, that is a
follow-up code change (rename the union members + sidebarConfig keys +
modal lookup).

#### Accessibility verification (Rule 22)
- Locked sidebar buttons unchanged: aria-disabled="true", aria-label
  "{Label}, Personal Plan required", tabIndex={0}, aria-hidden on icons,
  Enter/Space keyboard handler -- all preserved.
- Per-item description renders inside Radix DialogDescription which is
  automatically wired to aria-describedby on the dialog. Not inside any
  aria-hidden container. Screen readers announce it as part of dialog
  opening.
- No new aria-live region; no role="alert" introduced -- avoids the
  "fires on mount" risk.
- Tab order through the modal is unchanged (only text body changes; no
  new focusable elements).

#### Build / verification
- npm run build: clean, 23.36s, zero errors, 3911 modules transformed.
- Per-file ASCII grep on all three changed files: zero hits each.
- Pre-commit ASCII guard: passed on all three commits this session.
- git diff --check: clean (only LF/CRLF info warnings on AppShell.tsx,
  benign Windows line-ending notice).

#### Closed carry-forwards (from April 26 list)
(a) BetaSignup.tsx file deletion -- closed via d08378b.
(f) Per-item locked sidebar micro-copy implementation -- closed via b534f6a.

#### Open carry-forwards (renumbered from April 26 list)
(b) Full Parables sweep -- separate session.
(c) NotificationBell.tsx ASCII sweep -- separate session.
(d) src/constants/index.ts + BetaAnalyticsDashboard.tsx ASCII sweep --
    bundle with (c) for one-pass cleanup.
(e) scripts/generate-css.cjs arrow glyph fix (src/index.css regen) --
    backend / build-script scope.
(g) Full backend mirror regeneration -- separate session. Surfaced this
    session that supabase/functions/_shared/routes.ts had a UTF-8 BOM at
    byte 0. The BOM-strip is now part of pushed routes.ts content, but
    the mirror generator script may still emit the BOM on next regen.
    The future session that runs npm run sync-constants must verify byte
    0 of every regenerated file is not 0xEF.

#### New carry-forward
(h) UpgradePromptModal.tsx dead code (lines 42-46): the
    `const prompt = trigger === 'limit_reached' ? UPGRADE_PROMPTS.limitReached
    : UPGRADE_PROMPTS.featureTeaser;` declaration is unused. Removing it
    also makes the `UPGRADE_PROMPTS` import (line 22) the file's last
    consumer-free import -- both should be deleted together. Recommend
    bundling with the next planned change to UpgradePromptModal.

#### Commits This Session
- 40cba75 DOCS: Append April 26 Pass 2 session log; fix backend mirror
  BETA_SIGNUP drift; register sync-constants script
- d08378b CLEANUP: Delete BetaSignup.tsx -- zero consumers, route
  deprecated April 26
- b534f6a FEATURE: Wire per-item locked sidebar micro-copy into
  UpgradePromptModal
- (this commit) DOCS: Update CLAUDE.md STATUS block + PROJECT_MASTER for
  April 27 session

#### Pending Uncommitted Modifications (Carry Forward)
- src/index.css -- carry-forward (e) above; auto-regenerated by every
  npm run build. Do not stage manually; fix lives in
  scripts/generate-css.cjs.

---

### April 26, 2026 -- Pass 2 Stale-UI Sweep

#### Pass 1 audit + Pass 2 implementation
Lynn ran a two-pass audit-then-implement on stale, contradictory, or
inaccurate UI copy. Pass 1 produced a complete findings report (no
edits). Pass 2 implemented the items Lynn approved.

#### Approved findings implemented (16 total, one commit)
- **Protected line restoration:** `"A free account prepares a lesson.
  The Personal Plan equips a class."` was lost in commit 0f438a5
  (April 5, 2026) when the right-column tagline was overwritten with
  `"Not a different lesson. A fuller way to lead."` Restored as a
  full-width italic closing anchor below the two-column grid in
  UpgradePromptModal.tsx, mirroring the existing opening anchor
  `"A good lesson teaches. An equipped teacher disciples."` Both
  protected lines now bookend the modal.
- **Finding #11 -- Header pricing wiring:** The header dropdown's
  "Pricing" item previously routed to /dashboard, doing nothing
  visible. Wired it through Header.tsx with the same special-case
  pattern used for `settings` and `signOut`: a new `showUpgradeModal`
  state, an `item.id === 'pricing'` branch in the `navigationItems.map`
  that opens UpgradePromptModal, and the modal mounted alongside
  UserProfileModal. Removed the now-unused `pricing: APP_ROUTES.DASHBOARD`
  entry from `NAV_ROUTES`. The sidebar's existing
  `action: 'openUpgradeModal'` behavior is unchanged; both surfaces
  now open the same modal.
- **Finding #16 -- Beta deprecation:** The /beta-signup route + its
  App.tsx import + the BETA_SIGNUP constant in routes.ts were all
  removed. BetaSignup.tsx body was replaced with a closure notice
  ("Beta Program Concluded" + "The BibleLessonSpark Beta Program
  concluded on February 28, 2026" + redirect/support buttons). The
  Facebook group reference and the `lynn@biblelessonspark.com`
  reference were removed in the same edit. The original `<form>` is
  retained with `className="hidden"` plus a comment, pending Lynn's
  approval for full file deletion (zero live consumers confirmed).
- **Finding #18 -- pricingSource.ts deletion:** Confirmed zero
  consumers in the entire repo. Queries a non-existent
  `subscription_plans` table; uses tier names that do not match the
  SSOT (free/personal/starter/growth/full/enterprise). Deleted.
- **Finding #6 -- subscription/UsageDisplay.tsx deletion:** Orphan
  duplicate of dashboard/UsageDisplay.tsx; zero imports anywhere.
  Carried "Upgrade Now" CTA copy that violated Copy Governance Rule
  5. Deleted.
- **Findings #2 + #3:** pricingConfig.ts -- renamed
  `displayName: 'Teacher Plan'` to `'Personal Plan'`; deleted unused
  `upgradeButton: 'Upgrade to Personal Plan'` field.
- **Findings #4 + #5:** trialConfig.ts -- replaced two `cta: "Upgrade
  Now"` with `cta: "Yes -- Equip My Class"` (under
  `messages.fullExhausted` and `messages.used`), per Copy Governance
  Rule 5.
- **Finding #7 -- Help.tsx FAQ org-tier example:** Replaced
  `"Growth includes 100 lessons/month"` with
  `"Multiplication includes 60 lessons/month"`. The previous example
  contradicted orgPricingConfig.ts on two counts: there is no display
  tier called "Growth" (display names are
  Foundation/Strengthening/Multiplication/Expansion/Network), and the
  100-lesson tier is "Expansion" not org_growth.
- **Finding #8 -- Rule 22 accessibility fix:**
  UpgradePromptModal.tsx:335 had
  `aria-hidden="true"` on the visible "What Begins to Change" section
  header, hiding it from assistive tech. Removed.
- **Finding #9 -- stale code comment:** Renamed
  `{/* Band 2 -- Beyond Sunday */}` to
  `{/* Band 2 -- What Begins to Change */}` (band was renamed
  April 5, 2026).
- **Finding #10 -- stale code comment:** PricingSection.tsx header
  comment removed dead reference
  `same SSOT as PricingPage.tsx` (PricingPage was deleted April 5).
- **Finding #12 -- broken arrow glyph:** Help.tsx Quick Links rendered
  `"Learn more ?"` -- a literal `?` instead of an arrow. Replaced with
  `Learn more {'->'}` (the BLS-approved JSX escape pattern; source
  stays ASCII, glyph renders at runtime).
- **Finding #14 -- backup/.txt sweep:** Deleted 13 stale files (10
  flagged in Pass 1, plus 3 newly surfaced during the cleanup verify
  step):
    - src/components/dashboard/EnhanceLessonForm.tsx.backup
    - src/components/dashboard/EnhanceLessonForm.tsx.backup-20260118
    - src/components/dashboard/EnhanceLessonForm.tsx.accordion-backup
    - src/components/dashboard/TeacherCustomization.tsx.backup-20251122-140234
    - src/pages/Admin.tsx.backup
    - src/constants/pricingConfig.ts.backup
    - src/constants/lessonTiers.ts.backup
    - src/constants/theologyProfiles.ts.backup-20260118
    - src/lib/theologyPrompt.ts.txt
    - src/lib/tenant/TenantProvider.tsx.txt
    - src/lib/theology.ts.txt
    - src/config/theology_profiles.ts.txt
    - src/types/TheologyProfile.ts.txt
- **Finding #15 -- CLAUDE.md governance correction:** The "Locked
  Sidebar Item Micro-Copy" section in Copy Governance defines distinct
  per-item copy for Devotional Library, Series Library, and Teaching
  Team, but UpgradePromptModal currently has only one trigger
  (`feature_teaser`) and shows the same description for all three.
  Documented copy was not actually wired into the UI. Added a STATUS
  block at the top of the section marking it
  "specified but not yet implemented -- carry-forward to a dedicated
  session" and naming the two wiring requirements (per-item trigger
  variant on UpgradePromptModal + AppShell.handleLockedItemClick(item)
  passing the trigger through).
- **Finding #17 -- Help.tsx team-accounts copy:** Replaced
  `"Organizations can set up team accounts - contact us for details."`
  with
  `"To set up a team account, visit biblelessonspark.com/org to create
  an organization."`

#### Two Unicode-trap incidents during implementation
Both caught before commit by the ASCII grep verification step.
Neither shipped to production.

1. **BetaSignup.tsx closure notice (incident 1):** The first
   new_string for the closure notice contained literal U+2019
   (right-single-quote) in `you{'’'}re` and literal U+2014
   (em-dash) in `{'—'}` -- typed as glyphs inside JSX braces
   instead of as the `{'\\u2019'}` / `{'\\u2014'}` escape patterns.
   The Edit tool preserved the literal bytes. Caught immediately by
   the per-file ASCII grep. Reverted to the originally-approved
   ASCII-only wording (straight apostrophe `you're`, double-hyphen
   `--`).
2. **Help.tsx arrow escape (incident 2):** First Edit tried to write
   `Learn more {'\\u2192'}` (the explicit escape). The Edit tool
   normalized the new_string back to a literal U+2192 arrow glyph on
   round-trip, then refused a corrective Edit because old_string and
   new_string compared equal (both literal arrows). Repaired with a
   byte-level PowerShell splice: search bytes
   `0xE2 0x86 0x92` (UTF-8 for U+2192), replacement bytes
   `0x5C 0x75 0x32 0x31 0x39 0x32` (six ASCII bytes for `\\u2192`).
   Both byte arrays were built from explicit byte values, never from
   typed glyphs. One replacement made; verified ASCII-clean by grep.

#### Pattern reinforced
Same Edit-tool behavior as the April 26 Pass 0 line 333 incident on
UserProfileModal.tsx (already in user memory
`feedback_unicode_escape_traps`). The trap recurs whenever Claude
types a Unicode glyph in any tool input -- the Edit tool transports
the literal bytes faithfully. For ASCII-guard repairs the only
reliable path is byte-level splice with explicit byte arrays. Memory
note remains accurate; no update needed.

#### Build / verification
- npm run build: clean, 26.41s, zero errors
- Non-ASCII bytes scan after all edits: zero new hits. Pre-existing
  hits unchanged (src/index.css auto-generated timestamp,
  src/constants/index.ts, NotificationBell.tsx,
  BetaAnalyticsDashboard.tsx -- all carry-forward).
- Pre-commit ASCII guard: passed.
- Live grep ROUTES.PRICING / ROUTES.PARABLES / BookletPrintModal /
  useSpeechInput in src/: zero hits each.
- Protected lines verified: "A good lesson teaches..." unchanged;
  "WHERE YOU ARE" / "WHERE YOU COULD TAKE THEM" unchanged;
  "A free account prepares a lesson..." restored.

#### Files Changed This Session
26 paths in commit c46a657 -- 11 modifications + 15 deletions:

Modifications:
- CLAUDE.md
- src/App.tsx
- src/components/landing/PricingSection.tsx
- src/components/layout/Header.tsx
- src/components/subscription/UpgradePromptModal.tsx
- src/constants/navigationConfig.ts
- src/constants/pricingConfig.ts
- src/constants/routes.ts
- src/constants/trialConfig.ts
- src/pages/BetaSignup.tsx
- src/pages/Help.tsx

Deletions: see Finding #14 list above (13 backup/.txt files), plus
src/components/subscription/UsageDisplay.tsx (#6) and
src/lib/pricingSource.ts (#18).

PROJECT_MASTER.md update committed separately after the implementation
commit, per session-end protocol.

#### Commits This Session
- c46a657 CLEANUP: Pass 2 stale-UI sweep -- protected-line
  restoration, header pricing wiring, beta deprecation, copy SSOT
  fixes (26 files, 68 insertions, 8309 deletions). Pushed to
  origin/main; Netlify auto-deploy.
- (pending) DOCS: Update PROJECT_MASTER for April 26, 2026 Pass 2
  session log

#### Carry-Forward Items (Open After This Session)

(a) **BetaSignup.tsx file deletion -- pending Lynn approval.** Zero
    live consumers confirmed after the route + import + constant were
    removed. The file remains only as a closure notice inside an
    `AppShell`-less Card; the original `<form>` is hidden behind
    `className="hidden"` plus a comment. Lynn explicitly held the
    file deletion this session for separate approval.

(b) **Full Parables sweep (separate session).** Carried forward from
    Pass 0 (April 26 morning session). Orphan source files in
    src/components/ParableGenerator.tsx,
    src/constants/ParableGenerator.tsx,
    src/constants/parableConfig.ts,
    src/constants/parableDirectives.ts; the
    `'Modern Parables Generator'` line in pricingConfig.ts
    PLAN_FEATURES; the parables featureFlag entry; the
    `includesModernParables` field in usePricingPlans.tsx; the
    LessonLibrary "sparkle button" target verification; and the
    Supabase `modern_parables` table + `includes_modern_parables`
    column removal via migration. Estimated 1-2 sessions.

(c) **NotificationBell.tsx ASCII sweep (separate session).** Lines
    105 (bell emoji), 117 (refresh arrow), 120 (ellipsis) contain
    literal Unicode. Fix requires Lucide icon imports (Bell,
    RefreshCw) and JSX restructuring -- beyond a one-line surgical
    edit. Carried forward from Pass 0.

(d) **src/constants/index.ts + BetaAnalyticsDashboard.tsx ASCII
    sweep (separate session).** Both flagged by Pass 0 Finding 3.1
    and confirmed in Pass 2 grep. Recommend bundling with item (c)
    for one-pass cleanup of the three remaining carry-forward
    non-ASCII source files.

(e) **scripts/generate-css.cjs arrow glyph fix (separate session,
    backend / build-script scope).** src/index.css is auto-generated
    on every `npm run build` and emits literal `->` arrows as
    U+2192 glyphs in the comment header (Color Reference / Typography
    sections). Hand-editing src/index.css regresses on the next
    build; the fix lives in the generator script. Pass 2 Finding
    #13. Out of scope for any pure-frontend session.

(f) **Per-item locked sidebar micro-copy implementation (separate
    session).** UpgradePromptModal needs a per-item `trigger` variant
    so the modal description can switch by sidebar source
    (Devotional Library -- "Your group's faith doesn't pause on
    Monday..."; Series Library -- "One lesson teaches a truth. A
    series builds a disciple..."; Teaching Team -- "Moses had Aaron.
    Paul had Timothy..."). AppShell.handleLockedItemClick(item) must
    pass the trigger through. Approved copy already lives in
    CLAUDE.md Copy Governance with a STATUS block flagging it
    not-yet-implemented (added this session under Finding #15).

(g) **Full backend mirror regeneration (separate session).** The
    `supabase/functions/_shared/` mirror was last regenerated
    `2026-02-18T18:17:21.483Z`. Only `routes.ts` was touched in this
    session (surgical BETA_SIGNUP removal); the other 13 files in the
    sync-constants FILES_TO_SYNC list (ageGroups, bibleVersions,
    generationMetrics, lessonStructure, lessonTiers, systemSettings,
    teacherPreferences, theologyProfiles, contracts, rateLimitConfig,
    freshnessOptions, devotionalConfig, toolbeltConfig) are also
    likely stale. Running `npm run sync-constants` (now registered in
    package.json) will overwrite all 14 backend mirror files with the
    current frontend SSOT. The diff is expected to be large and must
    be reviewed carefully -- some divergent values may have non-stale
    reasons. Recommend a dedicated session that (1) runs the sync,
    (2) diffs each file before committing, (3) verifies edge function
    callers (`send-invite/index.ts` is the only known consumer
    today), and (4) considers wiring sync-constants into a build hook
    so the mirror cannot drift again.

#### Mirror Sync Note (post-push correction)
The original commit message of c46a657 told Lynn to run
`npm run sync-constants` to reconcile
`supabase/functions/_shared/routes.ts`. That guidance was wrong on
two levels and was corrected post-push:

1. **The npm script did not exist.** package.json had no
   `sync-constants` entry. The correct invocation was
   `node scripts/sync-constants.cjs`. Fixed in a follow-up commit by
   adding the script entry to package.json so future references work.
2. **The mirror was already grossly stale -- not just BETA_SIGNUP.**
   The `AUTO-GENERATED` header on the backend mirror was timestamped
   `2026-02-18T18:17:21.483Z` and the file had drifted by 14+ route
   changes (e.g., still had `PRICING`, `CREATE_LESSON`, `MY_LESSONS`;
   missing FAQS, ORG_SETUP, ORG_SUCCESS, ORG_MANAGER, TEACHING_TEAM,
   PUBLISH, SHARE, BONUSES, MORE_TOOLS, DEVOTIONALS; legal paths
   diverged; DASHBOARD_TAB_VALUES diverged). Only one edge function
   currently consumes the mirror (`send-invite/index.ts` uses
   `buildInviteUrl` which references `ROUTES.AUTH` -- aligned in both
   files), so the drift has not yet broken production.

Resolution this session: surgical manual removal of the BETA_SIGNUP
line from the backend mirror (Option A), plus
`"sync-constants": "node scripts/sync-constants.cjs"` added to
package.json (Option C). Full mirror regeneration is deferred -- see
carry-forward (g) below.

---

### April 26, 2026 -- Pass 0 Cleanup (Tasks 1-5)

#### Pass 0 baseline integrity report
Lynn ran a Pass 0 baseline integrity check at session start. The report
identified five HOLDS that warranted resolution before further session
work. This session resolved all five.

#### Task 1: Parables route + page removal (narrow scope per Option A)
Removed the orphaned Parables page and its route plumbing. Files touched:
- src/pages/Parables.tsx (DELETED, 95 lines)
- src/constants/routes.ts (removed PARABLES constant)
- src/constants/navigationConfig.ts (removed parables NAV_ROUTES entry,
  parables NAVIGATION_ITEMS entry, Star icon import, and obsolete NOTE
  comment)
- src/App.tsx (verified -- no edits needed; no Parables import or route
  was registered)

Lynn approved Option A (narrow four-file scope). The full Parables sweep
of dependent code is deferred -- see "Pending Carry-Forward" below.

#### Task 2: Removed dead ROUTES.PRICING constant
PricingPage.tsx was deleted April 5, 2026 (commit 0f438a5). Pass 0
confirmed zero live consumers of ROUTES.PRICING (only stale .backup
files). Removed the constant from src/constants/routes.ts.

#### Task 3: Widened SidebarItem.action union type
src/constants/sidebarConfig.ts line 173 set action: 'openUpgradeModal'
on the pricing item, but the SidebarItem.action type at line 75 only
listed 'openProfile' | 'signOut'. Widened the union to include
'openUpgradeModal' and updated the leading comment.

#### Task 4: Fixed CLAUDE.md SSOT File Map paths
The SSOT File Map table listed Pricing and Trial Config under src/config/
but the actual files live under src/constants/. Fixed both rows. Also
fixed a third occurrence of the same drift in the SUBSCRIPTION TIERS
section header (line 335) per Lynn's approval during the diff review.

#### Task 5: Non-ASCII sweep on two files (em-dashes only, per Option B)
Lynn approved Option B (em-dashes only, two files). NotificationBell.tsx
deferred to its own session because the emoji/arrow swaps require Lucide
icon imports beyond a one-line edit. src/constants/index.ts and
src/components/analytics/BetaAnalyticsDashboard.tsx (also flagged by
Pass 0 Finding 3.1) were excluded from this session's scope.

Files touched:
- src/constants/audienceConfig.ts (6 em-dashes in JSDoc converted to --)
- src/components/UserProfileModal.tsx
    - 4 em-dashes in code comments converted to --
    - 1 user-visible em-dash on line 333 converted to {'\u2014'} JSX
      escape (Lynn's Option B election preserves the rendered em-dash
      while keeping source ASCII-safe)
    - 1 JSX comment on line 337 -- two middle-dot separators (U+00B7)
      converted to | and one em-dash converted to --

#### Incident: literal em-dash regression on line 333 of UserProfileModal.tsx
While applying the Task 5 line 333 user-visible change, the new_string
passed to the Edit tool included a literal em-dash glyph inside JSX
braces instead of the six-ASCII-character escape \u2014. The Edit tool
preserved the literal byte sequence, leaving one new non-ASCII byte in
the file -- the exact regression Task 5 was meant to remove.

Two PowerShell repair attempts using String.Replace also failed:
1. First attempt: the replacement string passed to Replace() included a
   literal em-dash glyph again -- the same input-channel error recurring
   at the PowerShell-tool boundary.
2. Second attempt: correctly built the replacement from char codes
   ([char]0x5C + 'u2014' = 6 ASCII bytes), but Replace(char, string)
   mis-resolved overloads and silently failed (zero replacements made).

Resolution (per Lynn's instruction): byte-level splice using
ReadAllBytes / WriteAllBytes. The search bytes (UTF-8 em-dash sequence
0xE2 0x80 0x94) and replacement bytes (ASCII for the JSX escape:
0x5C 0x75 0x32 0x30 0x31 0x34) were both built from explicit byte
values, never from typed or pasted Unicode glyphs. Verified before
and after byte counts: 1 -> 0.

Pattern reinforced (already in user memory feedback_unicode_escape_traps):
the Edit tool can silently emit a literal Unicode glyph from typed input,
and PowerShell's String.Replace will not always cooperate because of
character/string overload resolution. For surgical ASCII-guard repairs,
prefer byte-level splice: build search and replacement arrays from
explicit byte values, never from typed glyphs.

#### Build / verification
- npm run build: clean, 25.90s, zero errors
- Non-ASCII bytes scan in all five edited source files: zero
- git diff --check: clean (only LF/CRLF info warnings on Windows)
- Live grep ROUTES.PRICING / ROUTES.PARABLES in src/: zero hits

#### Files Changed This Session
- src/pages/Parables.tsx (DELETED)
- src/constants/routes.ts
- src/constants/navigationConfig.ts
- src/constants/sidebarConfig.ts
- src/constants/audienceConfig.ts
- src/components/UserProfileModal.tsx
- CLAUDE.md
- PROJECT_MASTER.md (this session log)

#### Commits This Session
- (pending) CLEANUP: Remove Parables, dead ROUTES.PRICING, fix action
  type, fix CLAUDE.md paths, two-file non-ASCII sweep

#### Pending Carry-Forward -- Full Parables sweep (separate session)
Pass 0 Option A removed only the four explicitly listed files. The
following Parables-related code remains in the repo and must be removed
in a dedicated future session before /audit-ssot returns clean:

  Live source files (orphaned dead code, no live consumers after
  Parables.tsx deletion):
    - src/components/ParableGenerator.tsx
    - src/constants/ParableGenerator.tsx (unusual location -- second
      copy of the component, almost certainly a refactor leftover)
    - src/constants/parableDirectives.ts (TEACHING_DIRECTIVE,
      STANDALONE_DIRECTIVE prompts)
    - src/constants/parableConfig.ts (PARABLE_STEPS, parablesPerMonth
      tier limits)

  Configuration / SSOT entries:
    - src/constants/featureFlags.ts -- parables feature flag entry
      (line 75)
    - src/constants/pricingConfig.ts -- 'Modern Parables Generator' line
      in PLAN_FEATURES (line 225) AND includes_modern_parables column
      on the DB-mirror PricingPlanFromDB type (line 352)
    - src/hooks/usePricingPlans.tsx -- includesModernParables field
      (lines 22, 70)

  UI surface that needs verification before deletion:
    - LessonLibrary.tsx "sparkle button" was documented in the deleted
      Parables.tsx header as a teaching-context entry point. If the
      sparkle button still navigates to /parables, the click target is
      now broken. Sweep session must locate, verify, and remove or
      repurpose.

  Auto-generated (do NOT touch manually):
    - src/integrations/supabase/types.ts -- modern_parables table type
      and includes_modern_parables columns are in the live Supabase
      schema. These must be removed via a Supabase migration that drops
      the table and column, after which `npx supabase gen types
      typescript` will regenerate the file with the references gone.
      Editing types.ts by hand is forbidden -- it regenerates on every
      schema change.

  Database considerations:
    - The modern_parables table contains user-generated content. Decide
      data retention before dropping (export, archive, or delete?).
    - If the table is dropped, any RLS policies, triggers, and indexes
      attached to it must also be removed in the same migration.

  Estimated scope: 1-2 sessions. Recommend running /audit-ssot at the
  start of the sweep session and again after to confirm zero residual
  Parables references.

#### Pending Carry-Forward -- NotificationBell.tsx ASCII sweep
Pass 0 Finding 3.1 also identified NotificationBell.tsx as containing
literal Unicode at lines 105 (bell emoji), 117 (refresh arrow), and 120
(ellipsis). Lynn deferred this file to its own session because the
emoji/arrow swaps require importing Lucide icon components (Bell,
RefreshCw) and adjusting JSX -- beyond a one-line surgical edit.

#### Pending Carry-Forward -- Two more files identified by Pass 0
src/constants/index.ts and src/components/analytics/BetaAnalyticsDashboard.tsx
were both flagged by Pass 0 Finding 3.1 as containing non-ASCII bytes.
Lynn limited this session's Task 5 scope to the two files explicitly
named, so these two remain unfixed. Recommend bundling them into the
NotificationBell sweep session for one-pass cleanup.

---

### April 25, 2026 -- Markdown Rendering for Reshape Preview Expander

#### Feature: Render basic markdown inside the lesson card reshape preview
The "View Reshaped" expander on lesson cards in LessonLibrary previously
displayed a 300-character substring of shaped_content as a plain <p> with
whitespace-pre-line. Headings (#, ##, ###) and **bold** spans rendered as
literal markdown punctuation, which read poorly on the dashboard.

Added a small renderMarkdown(text) helper above the LessonLibrary component
(LessonLibrary.tsx:183-192) that line-splits the input and emits:
- <h1>/<h2>/<h3> for #, ##, ### lines
- <strong> for **bold** spans
- <p> for everything else (text-xs, muted-foreground, mb-0.5)

Replaced the truncated <p> at LessonLibrary.tsx:769-771 with a scrollable
<div className="text-xs text-muted-foreground max-h-40 overflow-y-auto">
that calls renderMarkdown(lesson.shaped_content.slice(0, 600)). Preview now
shows roughly twice as much content with proper heading and bold formatting.
No new dependencies (no react-markdown / remark) -- the helper is local.

#### Incident: Literal en-dash inserted by Write tool, caught and reverted
The first attempt used the Write tool for a full-file replacement and
silently introduced a literal U+2013 en-dash on line 836 (the "2-13 lessons
per series" caption that previously used the \u201313 escape). This would
have failed the ASCII guard on deploy.

Per Rule #13, restored the file via git checkout HEAD -- LessonLibrary.tsx,
then reapplied both edits using PowerShell with [System.IO.File]::WriteAllText
and the UTF-8 (no BOM) encoder. PowerShell here-strings were normalized to
the file's existing line endings (CRLF) before the .Replace calls so the
multi-line block match would not silently miss. Verified zero non-ASCII
bytes via grep before deploy.

Lesson learned this session:
The Write tool can normalize escape sequences into literal Unicode glyphs
during a full-file rewrite. For BibleLessonSpark source files prefer Edit
(surgical) or PowerShell with [System.IO.File]::WriteAllText when the
change set is small. If Write must be used for a full file rewrite, grep
the result for [^\x00-\x7F] before deploy. Existing Rule #16 already bans
literal Unicode -- this incident reinforced that the verification step
must run on every full-file write, not just hand-typed edits.

#### Deploy Workflow
Reverted the auto-generated src/index.css timestamp before commit (same
pattern as April 23 cleanup commit 0778082). deploy.ps1 then staged only
LessonLibrary.tsx because it was the lone remaining modification. ASCII
guard passed on the pre-commit hook; pushed to main; Netlify auto-deploy.

#### Feature 2: Rich-text clipboard copy for Google Docs paste
The Copy button inside the reshape preview expander previously called
navigator.clipboard.writeText with the raw markdown string, so pasting into
Google Docs landed literal "# Heading" / "**bold**" markers. Replaced with
the multi-format Async Clipboard API (LessonLibrary.tsx:760-780): converts
the shaped content into both an HTML representation (h1/h2/h3 + strong) and
a plain-text fallback, then writes a ClipboardItem holding both MIME types.
Google Docs reads the text/html representation and renders proper headings
and bold spans on paste.

The onClick handler also had to switch from sync to async because the new
flow uses await navigator.clipboard.write([...]). No try/catch was added --
matches the existing handler pattern; a clipboard write rejection will
surface in the devtools console and skip the success toast. Tested in
browser; paste into Google Docs renders as formatted content.

Same deploy pattern as Feature 1: reverted auto-generated src/index.css
timestamp before deploy.ps1 so only LessonLibrary.tsx shipped.

#### Files Changed This Session
- src/components/dashboard/LessonLibrary.tsx
  - Commit 1: renderMarkdown helper + expander markup
  - Commit 2: rich-text clipboard write in Copy onClick (now async)
- PROJECT_MASTER.md (this session log, both updates)

#### Commits This Session
- 1e69ff5 FEATURE: Render markdown in reshaped lesson preview expander
- a5267ba FEATURE: Copy reshaped lesson content as rich-text HTML for Google Docs paste

#### Pending Uncommitted Modifications (Carry Forward)
None at session end (after this PROJECT_MASTER.md update is committed).

---

### April 24, 2026 -- Sidebar Scrollbar Eliminated (Outermost Container Fix)

#### Bug: Persistent sidebar scrollbar after two prior fix attempts
The desktop sidebar in AppShell.tsx still rendered a vertical scrollbar even after
prior commits attempted to remove it:
- 135cf4c (April 23) removed overflow-y-auto from the inner nav wrapper
- An earlier session targeted SidebarContent's flex-1 region

Both prior fixes touched inner elements while leaving the outermost <aside>
container with overflow-y-auto. Whenever the sidebar's intrinsic content height
exceeded h-screen by even a few pixels (logo block + theme selector + collapse
toggle + nav list), the aside itself produced the scrollbar -- inner-element
fixes could not suppress it.

Fix (commit 859a9fa): Changed the <aside> at AppShell.tsx:344 from
overflow-y-auto to overflow-hidden. The outermost container now clips any
overflow regardless of inner content height. Main content area scrollbar
(<main> at line 373) remains untouched -- its scrolling behavior is unchanged.

Lesson learned this session:
When a scrollbar appears on a fixed-height layout container, fix the outermost
element first. Inner overflow rules cannot override an ancestor that still has
overflow-y-auto.

#### Deploy Workflow (Continued from April 22 Pattern)
Bypassed deploy.ps1 again because two pre-existing unrelated modifications
(.claude/settings.local.json, src/index.css) were present at session start.
Manual sequence used: npm run build -> git add <single file> -> git commit
-> git push origin main. Netlify auto-deployed from push.

#### Files Changed This Session
- src/components/layout/AppShell.tsx (overflow-y-auto -> overflow-hidden on <aside>)
- PROJECT_MASTER.md (session log)

#### Commits This Session
- 859a9fa FIX: set overflow-hidden on outermost sidebar aside to remove sidebar scrollbar

#### Pending Uncommitted Modifications (Carry Forward)
The same two pre-existing uncommitted modifications from the April 22 session
remain untouched per task-scope rule:
- .claude/settings.local.json -- Claude Code permission allowlist additions
- src/index.css -- auto-regenerated build timestamp comment header
Neither affects production behavior. Commit or discard at Lynn's discretion.

---

### April 22, 2026 -- CSP Consolidation and Vimeo Training Videos Fix

#### Bug: Vimeo videos at /training blocked despite netlify.toml allowing player.vimeo.com
The five prior CSP-related commits (9df3f99, fe2b0d2, 41d5b70, 8be34ad, 0a0a51c) all
edited netlify.toml, but a conflicting meta CSP in index.html line 14 had
frame-src 'none'. Browsers enforce the intersection of HTTP-header CSP and
meta-tag CSP -- the most restrictive wins -- so frame-src 'none' silently overrode
the Netlify header. Root cause was dual CSP sources, not any Netlify configuration
problem.

Immediate fix (commit baf2c9d): Changed meta CSP frame-src 'none' to
frame-src https://player.vimeo.com. Videos load.

Consolidation (commit 5237b43): Deleted the meta CSP tag from index.html entirely.
netlify.toml is now the single source of truth for CSP. Also added Google Fonts
to netlify.toml CSP (style-src https://fonts.googleapis.com, font-src
https://fonts.gstatic.com) -- the prior intersection was also silently blocking
Google Fonts because the Netlify CSP did not include them.

New architectural rule established this session:
CSP is SSOT in netlify.toml. No meta CSP in index.html. Future CSP changes touch
netlify.toml only.

#### Deploy Script Workflow Note
deploy.ps1 line 32 does `git add .` which stages ALL pending git modifications
into one commit, not only task-named files. When task scope must be narrow
(standing rule), bypass deploy.ps1 with a manual sequence: verify on main,
git add <specific-files>, git commit -m, git push origin main. Netlify
auto-deploys from push either way.

#### Files Changed This Session
- index.html (meta CSP removed)
- netlify.toml (Google Fonts added to style-src and font-src)
- PROJECT_MASTER.md (session log)

#### Commits This Session
- baf2c9d fix: allow Vimeo iframes in index.html meta CSP
- 5237b43 fix: consolidate CSP to netlify.toml; allow Google Fonts

#### Pending Uncommitted Modifications (Carry Forward)
Two pre-existing uncommitted modifications were present at session start and
remain untouched per task-scope rule:
- .claude/settings.local.json -- Claude Code permission allowlist additions
- src/index.css -- auto-regenerated build timestamp comment header
Neither affects production behavior. Commit or discard at Lynn's discretion.

---

### April 13, 2026 -- Build Lesson Sidebar Tab Switch Fix

#### Bug #35: Build Lesson sidebar click did nothing when already on /dashboard (commit 7a19527)
When a user was already on /dashboard (e.g., viewing a lesson in the Lesson Library)
and clicked "Build Lesson" in the sidebar, nothing happened. React Router did not
process the navigate() call because the path was already /dashboard.

Root cause: Two issues working together:
1. AppShell.tsx navigate() call lacked `replace: true`, so React Router treated
   same-path navigation as a no-op.
2. Dashboard.tsx useEffect depended on `location.state` instead of `location`.
   Since the state object reference might not change for same-path navigation,
   the effect did not re-fire.

Fix:
- AppShell.tsx line 336: Added `replace: true` to the navigate() call for tab items.
  This forces React Router to process the navigation and create a new location object.
- Dashboard.tsx line 118: Changed useEffect dependency from `[location.state]` to
  `[location]`. Each navigate() call creates a new location with a unique key,
  guaranteeing the tab-switch effect fires every time.

#### Print Code Removal Confirmed (April 13, 2026)
Verified that all print-related code has been fully removed:
- src/components/dashboard/EnhanceLessonForm.tsx -- zero matches for "print" (case-insensitive)
- src/components/dashboard/BookletPrintModal.tsx -- file does not exist
No print button or booklet print modal remains in the codebase.

#### Voice Navigation Removed (commit 71f53e4)
Voice navigation feature removed entirely from the BLS feature set.
- Deleted src/utils/useSpeechInput.ts (Web Speech API hook)
- Removed Voice Navigate button and all useSpeechInput references from AppShell.tsx
- Removed microphone icons and all useSpeechInput references from EnhanceLessonForm.tsx
- 257 lines deleted across 3 files. Zero voice nav code remains in codebase.

#### .docx Format Description Fix (commit 9208fd9)
Updated LessonExportModal.tsx .docx description to clarify Google Docs requires
manual Drive upload. Copied from Lynn's corrected file.

#### Files Changed This Session
- src/utils/useSpeechInput.ts (DELETED)
- src/components/layout/AppShell.tsx (navigate replace: true + voice nav removal)
- src/components/dashboard/EnhanceLessonForm.tsx (voice nav removal)
- src/components/dashboard/LessonExportModal.tsx (.docx description fix)
- src/pages/Dashboard.tsx (useEffect dependency)
- CLAUDE.md (date update + deleted files table)
- PROJECT_MASTER.md (session log)

#### Commits This Session
- 7a19527 FIX: Build Lesson sidebar click switches tab when already on dashboard
- 895852b DOCS: Add print code removal confirmation and BookletPrintModal to deleted files
- 9208fd9 FIX: Correct .docx format description -- Google Docs requires manual Drive upload
- 71f53e4 REFACTOR: Remove all voice navigation code from codebase

---

### April 6, 2026 -- Counter Fix, Mobile Scroll, Sidebar Collapse, Upgrade Modal, Voice Nav

#### Bug #33: Free-tier lesson counter showed 0/3 (commit 7dd77c5)
Lesson Usage widget read from user_subscriptions.lessons_used via the
check_lesson_limit RPC, which is never incremented for free-tier users. Edge
Function writes to profiles.trial_full_lessons_used and
profiles.trial_short_lessons_used instead. Fix: added trialFullUsed and
trialShortUsed fields to useSubscription.tsx via a direct profiles query for
free-tier users. UsageDisplay.tsx uses these for progress bar display only.
Exhausted banner condition remains on the RPC-derived lessonsUsed value --
untouched.

#### Bug #34: Free-tier lesson counter showed 0/3 regardless of actual usage
Resolved commit 7dd77c5, April 6, 2026. Same root cause as Bug #33 -- the
display read from the wrong data source. The Edge Function correctly incremented
profiles.trial_full_lessons_used but the frontend read from user_subscriptions
via the check_lesson_limit RPC. Fix added separate trialFullUsed/trialShortUsed
fields that read directly from profiles for free-tier users.

#### Mobile Sidebar Touch Scrolling (commits badc0ca)
iPhone 13 sidebar opened but could not be scrolled by touch. Desktop aside had
overflow-y-auto h-screen but the mobile Sheet had neither. Fix: wrapped nav
element in a div with flex-1 min-h-0 overflow-y-auto and
style={{ WebkitOverflowScrolling: 'touch' }} for iOS Safari momentum scrolling.

#### Desktop Sidebar Collapse Toggle (commit 02b3d96)
Added collapse/expand toggle to the desktop sidebar. Collapsed state shows
narrow strip (w-14) with icons only, no text labels, no theme selector.
Expanded state shows full sidebar (w-56 lg:w-64) exactly as before. Toggle
button at top uses ChevronLeft/ChevronRight. State persists in localStorage
key bls_sidebar_collapsed. Mobile Sheet completely unaffected. Locked items
show mini lock badge overlay in collapsed state. Tooltips via title attribute
on hover.

#### Upgrade Modal Restructure (commit cae2ca6)
Moved billing toggle (Monthly/Yearly) and button row above the fold --
immediately after DialogHeader. Teacher sees CTA without scrolling. Spacing
tightened: tagline py-3 my-4 to py-2 my-2, grid gap-4 to gap-3, button row
mt-6 to mt-3, cancellation mt-2 to mt-1. CTA button label changed from
"Yes -- Equip My Class" to "Yes - I'll Make Disciples".

#### Voice Navigation -- Partial (commit cae2ca6)
Created src/utils/useSpeechInput.ts hook wrapping browser-native Web Speech API.
Added mic buttons to Bible Passage, Topic, and Additional Notes fields in
EnhanceLessonForm.tsx. Added Voice Navigate button at bottom of sidebar in
AppShell.tsx (both desktop and mobile). Set aside for redesign -- see WHAT'S NEXT.

#### Files Changed This Session
- src/hooks/useSubscription.tsx
- src/components/dashboard/UsageDisplay.tsx
- src/components/layout/AppShell.tsx
- src/components/dashboard/EnhanceLessonForm.tsx
- src/components/subscription/UpgradePromptModal.tsx
- src/utils/useSpeechInput.ts (NEW)
- PROJECT_MASTER.md

#### Commits This Session
- 7dd77c5 FIX: Free-tier lesson counter displays real usage from profiles trial columns
- badc0ca FIX: Mobile sidebar touch scrolling - wrap nav in overflow-y-auto flex container
- 02b3d96 FEATURE: Desktop sidebar collapse toggle - icons-only narrow strip with persistence
- cae2ca6 FEATURE: Upgrade modal - billing toggle and buttons above fold, new CTA label

---

### April 5, 2026 -- Upgrade Modal Rewrite, Pricing Page Removal, Calling-Moment Copy

#### PricingPage Deleted and All Routes Resolved (commit 0f438a5)
Deleted src/pages/PricingPage.tsx entirely. Removed import and route from App.tsx.
Every navigate(ROUTES.PRICING) and href="/pricing" across the codebase was replaced
with UpgradePromptModal triggers. Files updated:
- src/components/dashboard/UsageDisplay.tsx -- added modal state + UpgradePromptModal
- src/components/dashboard/EnhanceLessonForm.tsx -- 3 navigate calls changed to setShowUpgradeModal
- src/components/DevotionalGenerator.tsx -- replaced navigateUpgrade alias with modal
- src/components/dashboard/LessonLibrary.tsx -- added modal state + UpgradePromptModal
- src/pages/TeachingTeam.tsx -- onUpgrade callback now opens modal
- src/components/subscription/SubscriptionManagement.tsx -- window.location.href replaced with modal
- src/pages/PublishingHub.tsx -- anchor tag replaced with button opening modal
- src/components/landing/PricingSection.tsx -- auth redirect changed to ROUTES.DASHBOARD; error fallback text simplified
- src/config/footerLinks.ts -- /pricing changed to /#pricing (landing page anchor)
- src/constants/navigationConfig.ts -- pricing route changed to ROUTES.DASHBOARD
- src/components/admin/EmailSequenceManager.tsx -- /pricing URL detection changed to /#pricing

#### Sidebar Pricing Tab Opens Modal (commit 0f438a5)
sidebarConfig.ts: Pricing item changed from route: ROUTES.PRICING to action: 'openUpgradeModal'.
AppShell.tsx: Added 'openUpgradeModal' case in handleItemClick to trigger setShowUpgradeModal.
For free users the modal opens; for paid users it also opens (shows current plan info).

#### UpgradePromptModal -- Section Collapse and Band Rename (commit 0f438a5)
Removed the two .map() blocks listing individual section names (freeIncluded and paidAdds).
Replaced with one compact summary row. Band title changed from "Beyond Sunday" to
"Becoming a Discipler". Three star items and italic summary kept.

#### PricingPage Beyond Sunday Section (commit 0f438a5, before deletion)
Added hr divider, "Beyond Sunday" label, and three Star items (DevotionalSpark,
Series, Publish) to the Personal plan card on PricingPage before it was deleted.

#### Calling-Moment Copy -- UsageDisplay Exhausted Banner (commit 0f438a5)
Heading: "You've prepared lessons. You've shown up faithfully."
Subtext: "The Personal Plan doesn't change what you prepare. It changes what happens to your people."
Reset line includes "No long contract."
Button: "Yes -- Equip My Class"
Feature line: "Not more curriculum. The difference between a classroom and a community."

#### Calling-Moment Copy -- EnhanceLessonForm Blocked Notice (commit 0f438a5)
Full pastoral paragraph about classroom vs. community. Separate reset line with
"No long contract." Button: "Yes -- Equip My Class". role="alert" and
aria-live="polite" preserved.

#### Calling-Moment Copy -- UpgradePromptModal Final Revision (commit 0f438a5)
Title: "Ready to Do Even More for Your Class?"
Description: shortened to focus on what happens in the room and the week.
Free column: honoring italic line + simplified 3-item list (no individual section names).
Personal column: compact summary "More room to prepare. More continuity. More capacity to lead."
Band renamed to "WHAT BEGINS TO CHANGE" with three transformation-focused items:
  - Your class begins to engage, not just listen.
  - Truth that is heard on Sunday starts to take root.
  - One lesson builds into another -- people begin to grow.
Italic summary: "Not a different lesson. A fuller way to lead."
Primary CTA: "Yes -- Equip My Class" (aria-label updated).
Secondary: "I'll stay here for now".
Sizing: max-h-[90vh] overflow-y-auto on DialogContent.
ASCII compliance verified -- zero non-ASCII characters.

#### Protected Lines Preserved
- "A good lesson teaches. An equipped teacher disciples." -- unchanged
- "WHERE YOU ARE" / "WHERE YOU COULD TAKE THEM" column headers -- unchanged
- All aria attributes, role="alert", aria-hidden values -- unchanged

#### Files Changed This Session
- src/pages/PricingPage.tsx (DELETED)
- src/App.tsx
- src/components/dashboard/UsageDisplay.tsx
- src/components/dashboard/EnhanceLessonForm.tsx
- src/components/subscription/UpgradePromptModal.tsx
- src/components/subscription/SubscriptionManagement.tsx
- src/components/DevotionalGenerator.tsx
- src/components/dashboard/LessonLibrary.tsx
- src/components/layout/AppShell.tsx
- src/components/landing/PricingSection.tsx
- src/pages/TeachingTeam.tsx
- src/pages/PublishingHub.tsx
- src/constants/sidebarConfig.ts
- src/constants/navigationConfig.ts
- src/config/footerLinks.ts
- src/components/admin/EmailSequenceManager.tsx

#### Commits This Session
- 0f438a5 FEATURE: Upgrade modal rewrite - teacher to discipler calling-moment copy, sizing fix, all upgrade surfaces updated

---

### April 4, 2026 -- Continued Session (Free-Tier UX, Upgrade Messaging, Trial Enforcement)

#### Dashboard Crash Fix (commit 16522e8)
useSubscription() was destructured at line 556, but tier was used at line 369
in a useState initializer (lessonViewMode). "Cannot access before initialization"
crash on every dashboard load. Fix: moved useSubscription() block to line 364,
immediately after expandedStep useState.

#### Free-Tier Lesson Viewer Default (commits a3d84fe, 16522e8)
lessonViewMode useState initialized to "full" unconditionally. Free-tier user
(Jana Thomas) saw all 8 sections by default. Fix: useState now conditionally
initializes based on tier; useEffect sets "free" for non-paid users.
aria-pressed and aria-label added to Preview Mode toggle buttons per Rule 22.

#### Trial Counter Error Handling (commit a737c3f)
generate-lesson Edge Function trial increment (profiles.update) had no error
handling. Silent failure would leave counter at 0 permanently, granting
unlimited free lessons. Fix: destructure { error: trialUpdateError }, log
CRITICAL on failure. Edge Function redeployed via npx supabase functions deploy.

#### Hybrid Free-Tier Sidebar Navigation (commit fa8561f)
sidebarConfig.ts: Added NavItemTierGate type and tierGate property to every
SidebarItem. AppShell.tsx: useSubscription() added; locked items render at
opacity-50 with Lock icon, open UpgradePromptModal on click; hidden_free
items use conditional rendering. WCAG 2.1 AA: aria-disabled, aria-label,
tabIndex, aria-hidden on icons, onKeyDown for Enter/Space.

#### Upgrade Modal -- Iterative Copy and Structure (commits fa8561f, 161cda9)
Multiple rounds of copy refinement on UpgradePromptModal.tsx:
- Default billing interval changed from monthly to yearly
- Title: "Ready to Do Even More for Your Class?"
- Description: acknowledges teacher's first step, describes Personal Plan value
- Contrast anchor line: "A good lesson teaches. An equipped teacher disciples."
- Two columns: "WHERE YOU ARE" vs "WHERE YOU COULD TAKE THEM"
- Band 1: all 10 lesson sections with Check icons
- Band 2 "BEYOND SUNDAY": DevotionalSpark, Series, Publish with Star icons
- Summary: "A free account prepares a lesson. The Personal Plan equips a class."
- Button: "Yes -- Let's Do More"
- Cancellation notice: "Cancel anytime before your next billing date."
- All icons aria-hidden="true", buttons have descriptive aria-labels

#### UsageDisplay Exhausted Banner (commit 161cda9)
When both full and short lessons exhausted, UsageDisplay shows amber banner
with heading, reset date, class-focused upgrade messaging, "Equip My Class"
button, and feature summary line. role="alert" for screen reader announcement.

#### EnhanceLessonForm Blocked Notice (commit 161cda9)
Amber banner above Step 1 when subLessonsUsed >= subLessonsLimit. Lock icon
(aria-hidden), class-focused subtext, "Equip My Class -- Upgrade Now" button.
role="alert" and aria-live="polite" for screen readers.

#### Welcome Banner Condition Fix (commit 161cda9)
Changed from !step1Complete && !step2Complete to subLessonsUsed < subLessonsLimit.
Banner now hidden when limit is reached, preventing confusing juxtaposition of
"Welcome!" and "Limit reached" messages.

#### DOCX Export Crash Fix (commit e6398a3)
buildTeaserBox used bodyFontHalfPt from wrong scope (module-level function
referencing local variable). Added fontHalfPt parameter. buildTextRuns default
parameter had same scope bug -- changed to body.fontHalfPt.

#### CLAUDE.md Structural Obligations (commit 1e5d7ba)
Added three missing governance sections: Mandatory Session-End Protocol,
Hold-Before-Deploy discipline in deploy sequence, Path Verification Before
Every File Write. Date header updated to April 4, 2026.

#### Files Changed This Session
- src/components/dashboard/EnhanceLessonForm.tsx
- src/components/dashboard/TeacherCustomization.tsx
- src/components/dashboard/UsageDisplay.tsx
- src/components/subscription/UpgradePromptModal.tsx
- src/components/layout/AppShell.tsx
- src/constants/sidebarConfig.ts
- src/constants/pricingConfig.ts
- src/utils/exportToDocx.ts
- supabase/functions/generate-lesson/index.ts
- CLAUDE.md
- PROJECT_MASTER.md

#### Edge Functions Deployed This Session
- generate-lesson (trial counter error handling)

#### Commits This Session
- dd06127 ACCESSIBILITY: Accordion keyboard nav, auto-advance removal, aria labels
- 4fd7008 ACCESSIBILITY: Bible passage ARIA combobox pattern
- 3f02157 DOCS: Append Phase E, theme, accessibility session logs
- fa8561f FEATURE: Hybrid free-tier sidebar nav, upgrade modal, accessibility
- 700b240 DOCS: Add Rule 22 accessibility governance
- e6398a3 FIX: exportToDocx scope bug in buildTeaserBox/buildTextRuns
- a3d84fe FIX: Free-tier lesson viewer defaults to free preview mode
- f9d736c DOCS: Update PROJECT_MASTER and CLAUDE for April 4 session
- 1e5d7ba DOCS: Add missing structural obligations to CLAUDE.md
- 16522e8 FIX: Move useSubscription before lessonViewMode useState
- a737c3f FIX: Trial counter increment error handling in generate-lesson
- 161cda9 FIX: April 4 2026 production fixes

### April 4, 2026 -- Planning Session (Copy Governance, Conversion Messaging Strategy)

#### Context
This was a Claude.ai planning session, not a Claude Code implementation session.
No source files were changed. One governance document was updated and committed.

#### Conversion Moment Strategy -- Three Moments Identified
Reviewed free-tier upgrade messaging across the dashboard. Established that the
three upgrade prompts are not software purchasing moments -- they are ministry
calling moments. The teacher is silently answering: "What kind of shepherd am I
going to be for these people?" (Matthew 28:19). Feature-list copy fails here.
Calling-focused copy succeeds.

Three conversion moments defined and documented:
1. Lesson Usage Card (top-right) -- tone: honoring + invitational
2. Exhausted Lessons Banner (center dashboard + EnhanceLessonForm) -- tone:
   honest + pastoral + clear consequence without manipulation. Most important
   copy on the platform.
3. Locked Sidebar Items (Devotional Library, Series Library, Teaching Team) --
   each requires its own micro-copy tied to that tool's specific ministry purpose.
   ChatGPT analysis identified moments 1 and 2 only. Moment 3 was identified
   here and added to governance.

#### Protected Lines Established
Two lines already in production in UpgradePromptModal.tsx were identified as
non-negotiable anchors. All future copy must be consistent with their weight:
  "A good lesson teaches. An equipped teacher disciples."
  "A free account prepares a lesson. The Personal Plan equips a class."
These lines must never be weakened, softened, or removed without explicit
instruction from Lynn.

#### Locked Sidebar Micro-Copy (for UpgradePromptModal variant by trigger)
Devotional Library: "Your group's faith doesn't pause on Monday. DevotionalSpark
  follows them all week -- connecting Sunday's lesson to Tuesday's life."
Series Library: "One lesson teaches a truth. A series builds a disciple.
  Plan weeks ahead and let your group see where you're taking them."
Teaching Team: "Moses had Aaron. Paul had Timothy. You were never meant to lead
  alone. Invite your co-teachers and carry this together."

#### Two Reusable Prompts Written
Prompt 1 -- For Claude.ai planning sessions touching upgrade copy or onboarding
  language. Establishes the Great Commission framing, three conversion moments,
  protected lines, copy rules, and voice standard. Paste at session start.
Prompt 2 -- For Claude Code implementation sessions touching conversion-moment
  files. Identifies the three files, the required voice for each, the protected
  lines, locked sidebar micro-copy, and button copy rules. Paste at session start
  before any file changes.

#### CLAUDE.md Updated (commit a3167e0)
Added new section: ## COPY GOVERNANCE -- UPGRADE & CONVERSION MESSAGING
Inserted between ## SLASH COMMANDS and ## PROJECT ROOT AUDIT FILES.
130 insertions. ASCII guard passed. Clean push to main.
Section governs: UsageDisplay.tsx, EnhanceLessonForm.tsx,
UpgradePromptModal.tsx, sidebarConfig.ts.

#### Files Changed This Session
- CLAUDE.md (Copy Governance section added)

#### Commits This Session
- a3167e0  DOCS: Add Copy Governance section for upgrade conversion messaging

---

## SESSION LOG: April 13, 2026 -- Admin Delete Fix + Org Deletion Workflow Design

### Fix 1: admin-delete-user Edge Function -- Complete Rewrite
Root cause: Edge Function called `auth.admin.deleteUser()` directly, trusting
Supabase to cascade. It does not. `org_shared_focus.created_by` has a NOT NULL
constraint that blocked deletion with AuthApiError: unexpected_failure.

Fix: Rewrote Edge Function to manually delete all user data across 30 tables
in correct dependency order before calling deleteUser(). Jana Thomas was the
failing test case -- manually deleted via SQL to unblock. Fix deployed and
verified: "User deleted successfully" toast confirmed live.

Tables now cleaned in order before auth deletion:
generation_metrics, reshape_metrics, guardrail_violations, events, outputs,
beta_feedback, feedback, email_sequence_tracking, email_rosters, notifications,
parable_usage, modern_parables, devotional_usage, devotionals, devotional_series,
refinements, lessons, lesson_series, teaching_team_members, teaching_teams,
transfer_requests, credits_ledger, setup_progress, org_shared_focus,
organization_focus, organization_members, beta_testers, invites, user_roles,
teacher_preference_profiles, user_subscriptions, profiles

Commit: FIX: admin-delete-user -- explicit cleanup of all 30 user-linked tables
before auth deletion

### Fix 2: Teaching Team Dissolution Notification -- Designed, NOT YET BUILT
When a lead teacher is deleted, the two team members lose their team silently.
Notification emails must be sent BEFORE the cleanup sequence runs.
Carry forward to next session.

### Fix 3: Org Deletion Approval Workflow -- Designed, NOT YET BUILT

Full design approved. Implementation requires these four files first:
- src/pages/OrgManager.tsx
- src/pages/Admin.tsx
- src/hooks/useAdminOperations.tsx
- src/constants/orgManagerConfig.ts

Approved build plan:

1. organizationConfig.ts -- add ORG_DELETION_REQUEST constant block (SSOT first):
   statuses: none/pending/approved
   uiCopy: button labels, confirm dialog copy, admin badge text
   rules: whoCanRequest, whoCanApprove, requiresAdminApproval: true

2. contracts.ts -- add deletion_requested_at and deletion_requested_by to
   Organization interface

3. Migration file -- ALTER TABLE organizations ADD COLUMN deletion_requested_at
   TIMESTAMPTZ, deletion_requested_by UUID

4. Two new Edge Functions:
   - request-org-deletion: org manager calls; sets columns; emails Lynn at
     eckbrosmediallc@gmail.com AND support@biblelessonspark.com
   - approve-org-deletion: admin-only; emails all org members; deletes org data

5. Two new email templates:
   - org-deletion-request-email.tsx (to admin/Lynn)
   - org-dissolution-notice-email.tsx (to org members)

6. Frontend:
   - OrgManager.tsx: "Request Organization Closure" button (org manager only)
     shows "Pending Admin Approval" badge if already requested
   - Admin.tsx: amber badge on pending orgs, "Approve Deletion" button

Org member dissolution email content:
- Organization name and closure date
- Requested by: manager name
- Personal account remains fully active
- All personal lessons retained in Lesson Library
- Subscription unchanged
- No longer part of a teaching organization
- Contact support@biblelessonspark.com if in error

Lynn personal notification email: eckbrosmediallc@gmail.com
Admin notification email: support@biblelessonspark.com
Both addresses receive the deletion request notification.

### Bug History Additions
33. admin-delete-user assumed Supabase cascades all FK relationships on
    auth.users delete. It does not. org_shared_focus.created_by is NOT NULL
    with no CASCADE, blocking deletion. Fix: explicit 30-table cleanup sequence
    before deleteUser() call. April 13, 2026.

---

## SESSION LOG: April 24, 2026 -- Memory Sync

No code changes this session. PROJECT_MASTER.md header date updated. 
Claude.ai project memory synced by Lynn to reflect all March 20, 2026 session work.

Carry-forward items unchanged -- see WHAT'S NEXT section.

---

## SESSION LOG: June 4, 2026 -- CBF Theology Profile (11th profile)

### Work completed
Added Cooperative Baptist Fellowship (CBF) as the 11th Baptist theology profile.
Deployed to main as commit da2a2ff.

### Pre-implementation checks (all passed before any code written)
- CHECK A: profiles.theology_profile_id is TEXT (no enum, no CHECK constraint in
  any migration). teacher_preference_profiles stores theology only inside a
  schemaless preferences JSON blob. NO migration needed for CBF.
- CHECK B: The universal BAPTIST_TERMINOLOGY_GUARDRAILS are appended
  UNCONDITIONALLY in generateTheologicalGuardrails() (no inclusion/exclusion
  list exists). CBF receives them automatically. The Reformed-Baptist sacrament
  exception is handled only at that profile's avoidTerminology level, not by a
  code branch.
- CHECK C: generate-lesson resolves the profile by array .find() (line 561) and
  calls generateTheologicalGuardrails() (line 675). No hardcoded profile-ID list
  gates anything. validation.ts type-checks theology_profile_id as a string only
  (no whitelist). No hardcoded exclusion of CBF.
- CHECK D: getProfileBadgeClass is an array .find() lookup, NOT a switch, so CBF
  needed no edit there. The task prompt's "label" field does not exist (real
  field is shortName); the task's "guardrails instruction block" prose was placed
  in filterContent with a derived guardrails[] string array.

### CBF field values (Lynn-approved)
- securityDoctrine: 'eternal' (CBF enforces no security position; eternal is the
  mainstream Baptist baseline and matches Baptist Core)
- tulipStance: 'anti' (CBF rejects Calvinist creedal uniformity)
- badgeClass: 'bg-sky-100 text-sky-800 border-sky-200' (sky -- not used by any
  existing profile)
- displayOrder: 11, isDefault: false, shortName: "CBF", requiredTerminology: []
- Sacrament/sacraments/Eucharist trio added to avoidTerminology +
  preferredTerminology (CBF is not exempt from Baptist ordinance language).

### Four CBF-specific guardrail gaps -- all covered
gendered ministry, confessional authority, broad mission, cooperative polity --
covered across avoidTerminology, preferredTerminology, guardrails[], and
filterContent.

### Files changed (4)
- src/constants/theologyProfiles.ts (CBF object, frontend SSOT) -- written via a
  self-deleting Node .cjs script with a <=127-byte self-check
- src/constants/contracts.ts (TheologyProfileId union: added 'cbf'; "All 10" ->
  "All 11")
- supabase/functions/_shared/theologyProfiles.ts (auto-synced mirror)
- supabase/functions/_shared/contracts.ts (auto-synced mirror)
npm run sync-constants ran clean (15/15). Mirror diff was purely additive; the
BAPTIST_TERMINOLOGY_GUARDRAILS block and guardrail functions were untouched.

### Verification
- npm run build clean: 3947 modules, ~31s, zero TypeScript errors.
- Byte-level ASCII check clean on all four files (every byte <= 127).
- Build Lesson Step 2 dropdown (EnhanceLessonForm.tsx line 2235) renders
  getTheologyProfileOptions(), so CBF appears last (order 11). Verified on
  localhost:8080 by Lynn before deploy approval.

### CLAUDE.md change
Architecture Principle #3 updated: "10 supported Baptist traditions" -> "11".

### Carry-forward
- KNOWN PRE-EXISTING BUG: generate-lesson/index.ts injected ${theologyProfile.description}
  (no such field; the real field is summary), rendering "undefined" into the system
  prompt for all profiles. [RESOLVED June 4 in commit 5f57292 -> .summary; other
  generators audited clean June 9 -- see the June 9 cleanup session log below.]

---

## SESSION LOG: June 9, 2026 -- Southern Baptist Anti-Calvinist-Drift Soteriological Guardrail

### Problem
The Southern Baptist profiles prohibited a few Calvinist TERMS in avoidTerminology
("sovereign election", "monergism") but nothing stopped the broader Reformed-leaning
PHRASING the generator defaults to ("sovereign grace in salvation", "He chooses to
save whom He will"). That phrasing violates the non-Calvinist SBC mainstream of the
Baptist Faith & Message as a confessional document. Symptom: the Theological
Background section of a Rahab/Joshua 2 SBC lesson read as Reformed soteriology
rather than faith-response.

### Solution (single injection point -- verified by fan-out)
All three content generators derive their per-profile theology block from ONE
function, generateTheologicalGuardrails(profileId):
- generate-lesson  -> backend, _shared mirror, index.ts:675
- generate-devotional -> backend, _shared mirror, index.ts:588
- generate-parable -> the FRONTEND builds the guardrail string in
  ParableGenerator.tsx:356 and passes it in the payload (the parable Edge Function
  does NOT call generateTheologicalGuardrails itself)
So one profile-gated injection inside generateTheologicalGuardrails() reaches all
three, exactly mirroring how generateBaptistTerminologyGuardrails() is appended.

### Files changed (2)
- src/constants/theologyProfiles.ts:
  * New SSOT constant SOUTHERN_BAPTIST_SOTERIOLOGICAL_GUARDRAILS (prohibited
    phrases + replacements, conditional "chosen before the foundation of the world"
    rule, required faith-response framing, canonical avoid->use rewrite).
  * New generator generateSouthernBaptistSoteriologicalGuardrails(profileId) --
    returns '' for any profile NOT in appliesToProfileIds.
  * One line wired into generateTheologicalGuardrails() to append it.
- supabase/functions/_shared/theologyProfiles.ts (auto-synced mirror).
npm run sync-constants clean (15/15).

### Scope decision (Lynn-approved)
Instruction named BF&M 2000 only. Flagged that BF&M 1963 has the identical
vulnerability (same avoidTerminology, tulipStance 'anti'). Lynn chose BOTH, so
appliesToProfileIds = ['southern-baptist-bfm-1963', 'southern-baptist-bfm-2000'].
The guardrail is a no-op for every other profile.

### Verification
- npm run build clean: 3951 modules, ~27s, zero TypeScript errors.
- ASCII guard passed at commit (no em dashes/curly quotes).
- Lynn verified on localhost:8080: Rahab/Joshua 2/SBC lesson Theological Background
  now reads as faith-response, not sovereign-grace drift.
- Deployed: commit c886b04 (FIX), pushed to main, Netlify auto-deploy.

### Caveat (carry-forward)
This is a prompt-level instruction (same mechanism as every other theology
guardrail), so it strongly discourages but cannot byte-for-byte guarantee zero
drift. If residual drift appears, capture the exact phrase and tighten
prohibitedPhrases.

### Note
The pre-existing generate-lesson description-field bug was NOT touched in this
guardrail work. It was already fixed June 4 (5f57292); the follow-up audit and
dead-code cleanup were completed later the same day -- see the next session log.

---

## SESSION LOG: June 9, 2026 -- Cleared the generate-lesson theologyProfile.description carry-forward

### Context
Closed out the long-standing carry-forward flagged at the bottom of this file
("generate-lesson injects theologyProfile.description -> undefined; needs its own
diagnostic session"). On inspection the live bug was already fixed; the remaining
work was the never-completed audit of the other generators plus stale dead code.

### Findings (verified against current code, not the stale note)
- LIVE BUG ALREADY FIXED: generate-lesson/index.ts:673 reads ${theologyProfile.summary}
  (commit 5f57292, June 4). The only other .description in that file (~882) is an
  unrelated guardrail-violation object (v.description). Nothing to do.
- OTHER-GENERATOR AUDIT (the open follow-up from the June 4 log) -- CLEAN. No live
  Edge Function references theologyProfile.description. generate-devotional uses
  .id/.name; generate-parable uses payload.theology_profile.guardrails; every other
  .description hit across supabase/functions/ is on a legitimately-typed object
  (news article, bible version, devotional target, lesson shape, validation violation).
- src/pages/Docs.tsx:412 renders profile.description from a LOCAL hardcoded array
  (Docs.tsx:143) that has a real description field -- valid, not the SSOT. (Minor
  pre-existing SSOT smell: Docs.tsx hardcodes 4 profiles instead of importing
  THEOLOGY_PROFILES. Not addressed here -- separate concern, out of scope.)

### Change
- DELETED orphan optimized-generate-lesson-index.ts (repo root). Tracked but dead:
  added in 619fa5a ("Phase 5"), unreferenced anywhere, its ../_shared/ imports cannot
  resolve from the root, and it is part of neither the src/ build nor the
  supabase/functions/ deploy. It still carried the old pre-fix
  ${theologyProfile.description} line (~150) -- the last tracked code holding the
  buggy pattern. Lynn approved the deletion. Fully recoverable from git history.

### Verification
- npm run build clean (the deleted file was not in the build graph; build unaffected).
- No code imports were touched; zero functional change.

### Carry-forward
- None for this item. Optional future cleanup: Docs.tsx should import the SSOT
  THEOLOGY_PROFILES instead of its local 4-profile array (uses summary, not description).