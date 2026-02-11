# BibleLessonSpark — Project Master Document
## Date: February 10, 2026 (End of Phase 27)
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
10. **Dependency check before deployment.** Every deployment must verify that all files referencing new properties, exports, or constants have those dependencies already deployed or included in the same deployment batch.
11. **Test regex patterns against real data before shipping.** Never assume a regex works — run it against actual content from the application.

---

## PHASE 27 STATUS: ✅ COMPLETE

Phase 27 covered two major feature areas: Teaching Team and Lesson Shapes.

### Phase 27A: Teaching Team (Completed February 9, 2026)

Peer-to-peer lesson sharing system where a lead teacher creates a team, invites members, and shares lessons.

**What's deployed:**
- Database tables: `teaching_teams` and `teaching_team_members` with RLS (SECURITY DEFINER helpers to prevent infinite recursion)
- TeachingTeamCard component (create, rename, invite, remove, disband, leave)
- TeamInvitationBanner on Dashboard (shows pending invitations)
- Teaching Team page at `/teaching-team` (in dropdown menu for all roles)
- LessonLibrary has "My Lessons" / "Team Lessons" scope toggle
- `notify-team-invitation` Edge Function — sends email when a teacher is invited
- Email arrives from support@biblelessonspark.com via Resend
- `/workspace` route fixed (was missing from App.tsx)

### Phase 27B: Lesson Shapes (Completed February 10, 2026)

Allows teachers to reshape a generated 8-section lesson into a different pedagogical format while preserving theological content, age-appropriate language, and Baptist distinctives.

**Five shapes available:**
1. **Passage Walk-Through** — Verse-by-verse guided study following the text sequentially
2. **Life Connection** — Opens with a real-life situation, moves into Scripture, lands on practical response
3. **Gospel-Centered** — Locates the lesson within Creation-Fall-Redemption-Restoration narrative arc
4. **Focus-Discover-Respond** — Three-movement structure: focus question → discover in Scripture → respond in life
5. **Story-Driven** — Narrative experience that lets truth emerge from story rather than exposition

**Architecture:**
- SSOT file: `src/constants/lessonShapeProfiles.ts` (mirrored to `supabase/functions/_shared/`)
- Contains 5 shape definitions, age-group priority mappings, `assembleReshapePrompt()`, drift-prevention instructions
- Edge Function: `reshape-lesson` (claude-sonnet-4, temp 0.5, 90s timeout, 6000 max_tokens)
- Database: `lessons.shaped_content` (TEXT), `lessons.shape_id` (TEXT), `reshape_metrics` table with RLS
- Frontend: Reshape button in EnhanceLessonForm, shape picker dropdown with "Recommended" tag, Original/Shaped toggle

**Export support (all 4 channels handle shaped content):**
- PDF (`exportToPdf.ts` v2.6.0) — Student Handout on standalone page, "Student Handout" title (no "Section 8:"), no page numbers on handout pages, handles `#`/`##`/`###` headings, strips bare `#` markers
- DOCX (`exportToDocx.ts` v2.6.0) — Same standalone page with page break, handles all heading levels, strips bare `#` markers
- Print (`LessonExportButtons.tsx`) — CSS `page-break-before: always` for handout section, heading detection via HTML regex
- Email (`send-lesson-email` Edge Function) — `includeHandout` toggle, Student Handout detection with subtitle support, `#`/`##`/`###` heading formatting, bare `#` stripping

**Student Handout detection regex (consistent across all files):**
```
STUDENT\s+(?:HANDOUT|EXPERIENCE|MATERIAL|SECTION)
```
Allows optional subtitle after keyword (e.g., "Student Experience: The Heart of Divine Love").

**Content formatting (`formatLessonContent.ts` v2.1.0):**
- Handles all markdown heading levels (`#`, `##`, `###`) for both screen display and print
- Strips bare heading markers (`#`, `##`, `###` with no content) used as section separators in shaped content
- `normalizeLegacyContent()` converts `#{1,3}` headings with known labels to `**Bold:**` format
- All spacing values from `EXPORT_SPACING` in `lessonStructure.ts` (SSOT)

---

## GIT COMMIT HISTORY — PHASE 27B (Lesson Shapes)

| Commit | Description |
|--------|-------------|
| `e483a76` | Database migration: shaped_content, shape_id, reshape_metrics |
| `01f50c6` | Lesson Shapes frontend: reshape button, shape picker, Original/Shaped toggle |
| `6b3f431` | Fix shaped content rendering: remove bare #, handle heading levels, spacing |
| `007f095` | Fix local state sync: reshape persists on re-view without refresh |
| `d117b56` | Tighten shaped spacing, Student Handout page break for shaped exports |
| `954417b` | DOCX export: Student Handout page break, fix raw ** markers |
| `ed20ebb` | Shaped content section cards: match original lesson visual style |
| `a934f3d` | Tighten shaped content spacing: eliminate wasted vertical space |
| `67d6aee` | Email: Student Handout toggle, shaped content STUDENT HANDOUT detection |
| `ba9e3f7` | Match shaped content rendering to original section formatting |
| `66ca60d` | PDF Student Handout page break for shaped content |
| `635d8fc` | Standalone Student Handout title, suppress pagination on handout pages |
| `7051892` | Broaden detection: Student Experience, Student Material, Student Section |
| `98c2ba0` | Fix Student Handout detection: allow subtitle after heading keyword |
| `be7a600` | Handle all markdown heading levels in shaped content exports |

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

### lessons (Phase 27 additions)
```sql
-- Added columns:
shaped_content TEXT,        -- Reshaped lesson content (null = not reshaped)
shape_id TEXT               -- ID of the shape used (e.g., 'passage-walk-through')
```

### reshape_metrics
```sql
CREATE TABLE reshape_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  shape_id TEXT NOT NULL,
  age_group TEXT NOT NULL,
  theology_profile TEXT,
  processing_time_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  model TEXT DEFAULT 'claude-sonnet-4',
  created_at TIMESTAMPTZ DEFAULT now()
);
-- RLS: Users can INSERT their own rows, SELECT their own rows
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

## EMAIL CONFIGURATION (Verified February 10, 2026)

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
| **reshape-lesson** | **Reshape lesson into pedagogical shape (claude-sonnet-4)** |
| extract-lesson | File extraction (TXT, PDF, DOCX, images) |
| **send-lesson-email** | **Lesson email with optional Student Handout (teaser + handout)** |
| send-invite | Organization invitation emails |
| notify-team-invitation | Teaching Team invitation emails |
| setup-lynn-admin | Admin account setup |
| check-generation-status | Lesson generation polling |
| list-user-lessons | Lesson listing |
| get-lesson | Single lesson retrieval |

---

## SSOT FILE MAP

### Frontend Masters (source of truth)
| File | Location | Drives |
|------|----------|--------|
| lessonStructure.ts | src/constants/ | All export spacing, fonts, colors, formatting constants |
| lessonShapeProfiles.ts | src/constants/ | Shape definitions, prompts, age-group mappings, heading regex |
| emailDeliveryConfig.ts | src/constants/ | Email limits, templates, tier gating |
| contracts.ts | src/constants/ | TypeScript interfaces |
| routes.ts | src/constants/ | Route path definitions |
| navigationConfig.ts | src/constants/ | Dropdown menu items |
| ageGroups.ts | src/constants/ | Age group definitions |
| theologyProfiles.ts | src/constants/ | 10 Baptist theology profiles |

### Backend Mirrors (read-only copies synced from frontend)
| File | Location | Source |
|------|----------|--------|
| lessonShapeProfiles.ts | supabase/functions/_shared/ | ← src/constants/lessonShapeProfiles.ts |
| emailDeliveryConfig.ts | supabase/functions/_shared/ | ← src/constants/emailDeliveryConfig.ts |
| branding.ts | supabase/functions/_shared/ | Database-driven with fallback |

---

## KEY FILES — PHASE 27B (Lesson Shapes)

| File | Location | Purpose |
|------|----------|---------|
| lessonShapeProfiles.ts | src/constants/ + _shared/ | SSOT: 5 shapes, prompts, age-group mappings, heading regex |
| lessonStructure.ts | src/constants/ | SSOT: export spacing, section8StandaloneTitle, bold labels |
| formatLessonContent.ts | src/utils/ | Markdown→HTML for screen + print (all heading levels) |
| exportToPdf.ts | src/utils/ | PDF export with standalone Student Handout page |
| exportToDocx.ts | src/utils/ | DOCX export with page break before Student Handout |
| LessonExportButtons.tsx | src/components/dashboard/ | Print export + export button group |
| EnhanceLessonForm.tsx | src/components/dashboard/ | Lesson viewer with reshape UI and export integration |
| useReshapeLesson.tsx | src/hooks/ | Reshape hook: calls Edge Function, saves to DB |
| useLessons.tsx | src/hooks/ | Lesson CRUD including shaped_content, shape_id |
| LessonLibrary.tsx | src/components/ | Lesson list with reshape status indicators |
| contracts.ts | src/constants/ | Lesson interface with shaped_content, shape_id fields |
| EmailLessonDialog.tsx | src/components/ | Email dialog with "Include Student Handout" toggle |
| reshape-lesson/index.ts | supabase/functions/ | Edge Function: Claude reshape + metrics logging |
| send-lesson-email/index.ts | supabase/functions/ | Edge Function: email with handout detection |

---

## KEY FILES — PHASE 27A (Teaching Team)

| File | Location | Purpose |
|------|----------|---------|
| useTeachingTeam.tsx | src/hooks/ | All team CRUD operations, invitation logic, Edge Function call |
| TeachingTeamCard.tsx | src/components/ | UI for team management |
| TeamInvitationBanner.tsx | src/components/ | Dashboard banner for pending invitations |
| TeachingTeam.tsx | src/pages/ | Dedicated /teaching-team page |
| Dashboard.tsx | src/pages/ | Mounts TeamInvitationBanner |
| App.tsx | src/ | Routes for /teaching-team, /workspace, /org-manager |
| notify-team-invitation/index.ts | supabase/functions/ | Edge Function for team invitation email |
| team-invite-email.tsx | supabase/functions/notify-team-invitation/_templates/ | Email template |

---

## BUG HISTORY (so you don't repeat them)

1. **display_name vs full_name** — Queries using `profiles.display_name` which doesn't exist. The column is `full_name`. ALWAYS check the actual schema.
2. **RLS infinite recursion** — teaching_teams and teaching_team_members had circular RLS policies. Fixed with SECURITY DEFINER helper functions.
3. **Missing /org-manager route** — Route existed in routes.ts/navigationConfig.ts but was never added to App.tsx.
4. **Missing /workspace route** — Same pattern as #3. Route existed in routes.ts/navigationConfig.ts but was never added to App.tsx. Fixed February 9, 2026.
5. **Misleading toast** — Toast said "Invitation sent" when no email was actually sent. Fixed: toast now says invitee will receive email notification (and they actually do).
6. **Raw fetch() to Edge Function failed silently** — `import.meta.env.VITE_SUPABASE_URL` was not available/correct. Fixed by using `supabase.functions.invoke()` which uses the already-configured client.
7. **Student Handout subtitle detection** — Regex required line to END after keyword (`\s*$`), but shaped content produced headings like "Student Experience: The Heart of Divine Love". Fixed by allowing optional `(?:\s*[:–—\-].*)?$` suffix in all 5 detection files.
8. **Bare # markdown markers in shaped content** — Shaped content used bare `#` lines as section separators. These rendered as literal `#` characters in print, PDF, DOCX, and email. Fixed by stripping bare `#{1,3}` lines in formatLessonContent.ts, exportToPdf.ts, exportToDocx.ts, and send-lesson-email.
9. **Missing heading level support** — `formatLessonContent.ts` only handled `##` headings. Shaped content uses `#`, `##`, and `###`. All three levels now handled in screen display, print, PDF, DOCX, and email.
10. **Missing dependency in deployment** — `lessonStructure.ts` added `section8StandaloneTitle` property, but was omitted from the deployment file list. Three files (PDF, DOCX, Print) referenced it and would have rendered "undefined". Always verify the full dependency chain before deploying.

---

## BETA LAUNCH CONTEXT

- **Beta launch date:** February 28, 2026
- **Active beta tester:** Ellis Hayden (elhayden52@yahoo.com) from Fellowship Baptist in Longview, TX
- **Lynn's test accounts:** pastorlynn2024@gmail.com (invitee for testing — email notifications confirmed working)

---

## WHAT'S NEXT (Suggested priorities for next session)

1. **Quality validation** — Reshape a lesson into each of the 4 untested shapes (Passage Walk-Through, Life Connection, Gospel-Centered, Focus-Discover-Respond) and verify theological accuracy, age-appropriate language, and clean export formatting
2. **Beta launch preparation** — Review all features for February 28 launch readiness
3. **Test Teaching Team end-to-end with Ellis Hayden** — Invite Ellis to a team, verify email arrives, verify accept/decline flow
4. **Update PROJECT_MASTER.md** after each session

---

## HOW TO START THE NEW CHAT

Paste this document, then describe what you want to work on. If the assistant needs to see any current files, upload them from `C:\Users\Lynn\lesson-spark-usa\src\` as needed.

**Reminder to assistant:** Read the CRITICAL WORKFLOW RULES section before doing anything. Every route change requires verifying BOTH routes.ts AND App.tsx. Frontend drives backend — always. Never guess at Supabase dashboard locations. Never propose database triggers. Test regex patterns against real data before shipping. Verify all dependency chains before presenting deployment instructions.
