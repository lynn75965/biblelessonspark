# BibleLessonSpark — Phase 27 Handoff Document
## Date: February 9, 2026 (Updated end of session)
## Purpose: Continue from exactly where we left off in a new chat

---

## PROJECT OVERVIEW

BibleLessonSpark (biblelessonspark.com) is a Baptist Bible study lesson generator platform targeting volunteer Sunday School teachers in Baptist churches. Built with React/TypeScript frontend, Supabase backend, deployed via Netlify.

**Owner:** Lynn, 74-year-old retired Baptist minister, PhD from Southwestern Baptist Theological Seminary, 55 years ministry experience. Non-programmer solopreneur.

**Local repo:** `C:\Users\Lynn\lesson-spark-usa`
**Branch:** `biblelessonspark`
**Deploy command:** `.\deploy.ps1 "commit message"` (Netlify via Git)
**Supabase project URL:** `https://hphebzdftpjbiudpfcrs.supabase.co`

---

## CRITICAL WORKFLOW RULES (MUST FOLLOW)

1. **SSOT MANDATE:** (1) Request file first, never assume (2) Backend mirrors frontend exactly (3) Minimal changes only (4) State what changed and SSOT source before presenting (5) When in doubt, ask
2. **Non-programmer workflow:** Provide complete file replacements + PowerShell Copy-Item commands. No diffs.
3. **Frontend drives backend.** Access uploaded files during session — never re-request what's already provided.
4. **Claude Debugging Protocol:** Root-cause diagnosis BEFORE proposing solutions. No guessing.
5. **Deployment:** Netlify (not Lovable, not Vercel)
6. **profiles table column:** Uses `full_name` (NOT `display_name`). This caused a bug — never assume column names.
7. **ROUTE BUG PATTERN:** Every route added to `routes.ts` MUST also be added to `App.tsx`. This has caused bugs THREE times (`/org-manager`, `/workspace`). Verify BOTH files on every route change.
8. **Never propose database triggers or autonomous backend actions.** Frontend drives backend — always. No "Option B" that violates this.
9. **Never present options you aren't certain about.** If you don't know where a Supabase setting lives, say so instead of giving confident wrong directions.

---

## CURRENT STATE — PHASE 27: TEACHING TEAM

### What's Working (All Deployed & Tested)
- ✅ Database tables: `teaching_teams` and `teaching_team_members` created
- ✅ RLS policies with SECURITY DEFINER helper functions (`is_team_member_of`, `is_team_lead_of`) to prevent infinite recursion
- ✅ TeachingTeamCard component (create, rename, invite, remove, disband, leave)
- ✅ TeamInvitationBanner on Dashboard (shows pending invitations)
- ✅ Teaching Team page at `/teaching-team` (in dropdown menu for all roles)
- ✅ Navigation config updated — Teaching Team appears in all role menus
- ✅ LessonLibrary has "My Lessons" / "Team Lessons" scope toggle
- ✅ useTeachingTeam hook with all CRUD operations
- ✅ Invitation creates a `teaching_team_members` row with status='pending'
- ✅ **Email notification sent when a teacher is invited to a Teaching Team** (completed this session)
- ✅ **`notify-team-invitation` Edge Function deployed and working**
- ✅ **Email arrives from support@biblelessonspark.com via Resend**
- ✅ **Toast truthfully says "[Name] has been invited and will receive an email notification."**
- ✅ **`/workspace` route fixed — was missing from App.tsx** (completed this session)

### What Was Built This Session (February 9, 2026)

#### 1. Edge Function: `notify-team-invitation`
- **Location:** `supabase/functions/notify-team-invitation/index.ts`
- **Purpose:** Sends email notification when a teacher is invited to a Teaching Team
- **Trigger:** Called by frontend (useTeachingTeam.tsx) after successful INSERT into `teaching_team_members`
- **Architecture:** Frontend drives backend — `supabase.functions.invoke()` call, fire-and-forget
- **Auth:** Verifies caller is the lead teacher of the team
- **Lookups:** invitee profile (full_name, email), team name, lead teacher name
- **Email:** Sent via Resend using SSOT branding from `_shared/branding.ts`
- **Error handling:** If email fails, invitation record is unaffected

#### 2. Email Template: `team-invite-email.tsx`
- **Location:** `supabase/functions/notify-team-invitation/_templates/team-invite-email.tsx`
- **Pattern:** Matches `invite-email.tsx` exactly (same styles, Forest Green #3D5C3D)
- **Key difference:** For EXISTING users — button says "Log In to Respond", links to `/dashboard`
- **Content:** Warm, ministry-appropriate tone. Explains Teaching Team benefits. Tells invitee to check Dashboard for banner.

#### 3. Updated `useTeachingTeam.tsx`
- **Location:** `src/hooks/useTeachingTeam.tsx`
- **Change:** Added `supabase.functions.invoke('notify-team-invitation', ...)` after successful INSERT in `inviteMember()`
- **Pattern:** Fire-and-forget — logs errors but never blocks invitation creation
- **Toast updated:** Now truthfully says invitee will receive email notification

#### 4. Fixed `/workspace` route
- **Location:** `src/App.tsx`
- **Change:** Added `<Route path="/workspace">` pointing to Dashboard component inside ProtectedRoute
- **Root cause:** `routes.ts` defined `WORKSPACE: '/workspace'` and `navigationConfig.ts` used it, but App.tsx never had the route — identical pattern to the `/org-manager` bug

---

## DATABASE SCHEMA (Relevant Tables)

### teaching_teams
```sql
CREATE TABLE teaching_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  lead_teacher_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(lead_teacher_id)
);
```

### teaching_team_members
```sql
CREATE TABLE teaching_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teaching_teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  invited_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);
```

### profiles (relevant columns only)
```
id (UUID, PK, references auth.users)
full_name (TEXT)       ← THIS IS THE COLUMN NAME, NOT display_name
email (TEXT)
```

### RLS Helper Functions (already exist)
```sql
-- These use SECURITY DEFINER to break circular RLS dependency
CREATE OR REPLACE FUNCTION is_team_member_of(team_uuid uuid) ...
CREATE OR REPLACE FUNCTION is_team_lead_of(team_uuid uuid) ...
```

---

## EMAIL CONFIGURATION (Verified February 9, 2026)

- **Provider:** Resend (smtp.resend.com, port 587)
- **Sender email:** support@biblelessonspark.com
- **Sender name:** BibleLessonSpark Support (in Supabase SMTP settings)
- **Edge Function sender:** Uses `_shared/branding.ts` → `getEmailFrom()` which returns `BibleLessonSpark <noreply@biblelessonspark.com>`
- **RESEND_API_KEY:** Stored in Supabase Edge Function secrets (starts with `re_`)
- **Supabase SMTP:** Custom SMTP enabled, pointing to Resend

---

## DEPLOYED EDGE FUNCTIONS

| Function | Purpose |
|----------|---------|
| generate-lesson | Core lesson generation via Claude |
| extract-lesson | File extraction (TXT, PDF, DOCX, images) |
| send-invite | Organization invitation emails |
| **notify-team-invitation** | **Teaching Team invitation emails (NEW)** |
| setup-lynn-admin | Admin account setup |
| check-generation-status | Lesson generation polling |
| list-user-lessons | Lesson listing |
| get-lesson | Single lesson retrieval |

---

## FILES INVOLVED IN PHASE 27

| File | Location | Purpose |
|------|----------|---------|
| useTeachingTeam.tsx | src/hooks/ | All team CRUD operations, invitation logic, Edge Function call |
| TeachingTeamCard.tsx | src/components/ | UI for team management |
| TeamInvitationBanner.tsx | src/components/ | Dashboard banner for pending invitations |
| TeachingTeam.tsx | src/pages/ | Dedicated /teaching-team page |
| LessonLibrary.tsx | src/components/ | My Lessons / Team Lessons toggle |
| Dashboard.tsx | src/pages/ | Mounts TeamInvitationBanner |
| App.tsx | src/ | Routes for /teaching-team, /workspace, /org-manager |
| navigationConfig.ts | src/constants/ | Dropdown menu items |
| contracts.ts | src/constants/ | TypeScript interfaces (TeachingTeam, TeachingTeamMember, etc.) |
| routes.ts | src/constants/ | SSOT route path definitions |
| notify-team-invitation/index.ts | supabase/functions/ | Edge Function for team invitation email |
| team-invite-email.tsx | supabase/functions/notify-team-invitation/_templates/ | Email template |
| branding.ts | supabase/functions/_shared/ | SSOT branding helpers for Edge Functions |

---

## BUG HISTORY (so you don't repeat them)

1. **display_name vs full_name** — Queries using `profiles.display_name` which doesn't exist. The column is `full_name`. ALWAYS check the actual schema.
2. **RLS infinite recursion** — teaching_teams and teaching_team_members had circular RLS policies. Fixed with SECURITY DEFINER helper functions.
3. **Missing /org-manager route** — Route existed in routes.ts/navigationConfig.ts but was never added to App.tsx.
4. **Missing /workspace route** — Same pattern as #3. Route existed in routes.ts/navigationConfig.ts but was never added to App.tsx. Fixed February 9, 2026.
5. **Misleading toast** — Toast said "Invitation sent" when no email was actually sent. Fixed: toast now says invitee will receive email notification (and they actually do).
6. **Raw fetch() to Edge Function failed silently** — `import.meta.env.VITE_SUPABASE_URL` was not available/correct. Fixed by using `supabase.functions.invoke()` which uses the already-configured client.

---

## BETA LAUNCH CONTEXT

- **Beta launch date:** February 28, 2026
- **Active beta tester:** Ellis Hayden (elhayden52@yahoo.com) from Fellowship Baptist in Longview, TX
- **Lynn's test accounts:** pastorlynn2024@gmail.com (invitee for testing — email notifications confirmed working)

---

## WHAT'S NEXT (Suggested priorities for next session)

1. **Beta launch preparation** — Review all features for February 28 launch readiness
2. **Test Teaching Team end-to-end with Ellis Hayden** — Invite Ellis to a team, verify email arrives, verify accept/decline flow
3. **Any remaining Phase 27 polish** — Edge cases, error handling, UI refinements

---

## HOW TO START THE NEW CHAT

Paste this document, then describe what you want to work on. If the assistant needs to see any current files, upload them from `C:\Users\Lynn\lesson-spark-usa\src\` as needed.

**Reminder to assistant:** Read the CRITICAL WORKFLOW RULES section before doing anything. Every route change requires verifying BOTH routes.ts AND App.tsx. Frontend drives backend — always. Never guess at Supabase dashboard locations. Never propose database triggers.
