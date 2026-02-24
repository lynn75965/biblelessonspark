# BibleLessonSpark — Project Master Document
## Date: February 22, 2026 (Session: SSOT Violation Sweep Complete, Feature Flags, Pricing Reconciliation)
## Purpose: Continue from exactly where we left off in a new chat

---

## PROJECT OVERVIEW

BibleLessonSpark (biblelessonspark.com) is a Bible study lesson generator platform targeting volunteer Sunday School teachers in Christian churches. Built with React/TypeScript frontend, Supabase backend, deployed via Netlify. Supports Baptist traditions today with architecture designed for any Christian denomination, network, association, or congregation.

**Owner:** Lynn, 74-year-old retired Baptist minister, PhD from Southwestern Baptist Theological Seminary, 55 years ministry experience. Non-programmer solopreneur.

**Local repo:** `C:\Users\Lynn\biblelessonspark`
**Branch:** `main` (single branch — no secondary branches)
**Deploy command:** `.\deploy.ps1 "commit message"` (pushes to `main`, Netlify auto-builds)
**Supabase project URL:** `https://hphebzdftpjbiudpfcrs.supabase.co`

---

## CRITICAL WORKFLOW RULES (MUST FOLLOW)

1. **SSOT MANDATE:** (1) Request file first, never assume (2) Backend mirrors frontend exactly (3) Minimal changes only (4) State what changed and SSOT source before presenting (5) When in doubt, ask
2. **Non-programmer workflow:** Provide complete file replacements + PowerShell Copy-Item commands. No diffs.
3. **Frontend drives backend.** Access uploaded files during session — never re-request what's already provided.
4. **Claude Debugging Protocol:** Root-cause diagnosis BEFORE proposing solutions. No guessing.
5. **Deployment:** Netlify (not Lovable, not Vercel). Single branch: `main`. Deploy script: `.\deploy.ps1 "message"`.
6. **profiles table column:** Uses `full_name` (NOT `display_name`). This caused a bug — never assume column names.
7. **ROUTE BUG PATTERN:** Every route added to `routes.ts` MUST also be added to `App.tsx`. This has caused bugs FOUR times (`/org-manager`, `/workspace`, `/admin/toolbelt`). Verify BOTH files on every route change.
8. **Never propose database triggers or autonomous backend actions.** Frontend drives backend — always. No "Option B" that violates this.
9. **Never present options you aren't certain about.** If you don't know where a Supabase setting lives, say so instead of giving confident wrong directions.
10. **Dependency check before deployment.** Every deployment must verify that all files referencing new properties, exports, or constants have those dependencies already deployed or included in the same deployment batch.
11. **Test regex patterns against real data before shipping.** Never assume a regex works — run it against actual content from the application.
12. **Branch discipline:** Single branch (`main`) only. Deploy script enforces `$PRODUCTION_BRANCH = "main"`. The old `biblelessonspark` branch was deleted February 14, 2026 to prevent branch-juggling confusion.
13. **Never overwrite working code with stale file copies.** Always verify the file being deployed is newer than what's live. This has caused regressions.
14. **Always `npm run build` before deploying.** Never push code that hasn't compiled cleanly.

---

## SESSION LOG: February 22, 2026

### SSOT Violation Sweep — COMPLETE

Comprehensive audit of all SSOT config files identified and resolved 14 violations:

| # | Violation | Resolution |
|---|-----------|------------|
| 1 | contracts.ts `LanguageKey = 'en' \| 'es' \| 'fr'` hardcoded union | Changed to `string` with JSDoc pointing to branding.ts |
| 2 | branding.ts `defaultBibleTranslation: "KJV"` conflicts with bibleVersions.ts NASB | Removed from branding.ts entirely |
| 3 | validation.ts DENOMINATION_OPTIONS missing Free Will Baptist | Added Free Will Baptist (now 9 denominations) |
| 4 | theologyProfiles.ts encoding artifacts in AI prompts | Confirmed codebase is clean — mojibake was project reference copy only |
| 5 | bibleVersions.ts encoding artifacts | Confirmed codebase is clean |
| 6 | Handout lists AMP but SSOT had WEB | Added AMP as 9th Bible version, kept WEB |
| 7 | contracts.ts hardcoded TheologyProfileId, BibleVersionKey, LessonShapeId | Removed duplicated unions, fields typed as string with JSDoc to SSOT owners |
| 8 | useBranding.ts duplicated ~250 lines from branding.ts SSOT | Wired to import from BRANDING constant |
| 9 | Shape ID format mismatch (hyphens in contracts vs underscores in lessonShapeProfiles) | Standardized to underscores everywhere |
| 10 | Parable context discriminator 'lessonspark' | Renamed to 'teaching' across 6 frontend + 1 Edge Function |
| 11 | 639 lines dead legacy types in contracts.ts | Purged (old TheologicalPreferenceKey, SBConfessionVersion system) |
| 12 | Orphaned constants/branding.ts file | Deleted |
| 13 | pricingPlans.ts conflicted with pricingConfig.ts | pricingPlans.ts deleted; pricingConfig.ts is sole pricing authority |
| 14 | accessControl.ts missing team/shape permissions | Added 5 FEATURE_ACCESS keys + canManageTeam/canViewTeamLessons functions |

### Feature Flags System — NEW

Created `featureFlags.ts` as centralized SSOT for subscription-gated features:
- `devotionalGeneration` — tier-gated
- `teachingTeamManagement` — tier-gated
- `lessonReshaping` — tier-gated
- `studentTeaserGeneration` — tier-gated

Wired to 5 React components: LessonLibrary, DevotionalGenerator, EnhanceLessonForm, TeachingTeamCard, and export components. Free users see upgrade prompts; paid users retain full functionality.

### Pricing Reconciliation — COMPLETE

Discovered both pricing config files were completely stale vs. live Stripe catalog. Resolution:
- Deleted pricingPlans.ts (conflicting 4-tier system)
- pricingConfig.ts updated as sole pricing authority matching live Stripe catalog

### Complete Rebrand — COMPLETE

Eliminated all "LessonSparkUSA" / "LessonSpark USA" / "lessonsparkusa" references:
- ~100+ string replacements across 12 TypeScript files
- Database tenant_id updated from 'lessonsparkusa' to 'biblelessonspark' in 3 tables
- useBranding.ts rewired to BRANDING SSOT (eliminated ~250 duplicate lines)
- Orphaned constants/branding.ts deleted
- 12 markdown documentation files updated
- AI prompt references in parableDirectives.ts and parableConfig.ts updated

### accessControl.ts Expansion

Added teaching team and lesson shape permissions:
- 5 new FEATURE_ACCESS keys: createTeam, inviteTeamMember, removeTeamMember, viewTeamLessons, reshapeLesson
- `canManageTeam(role, actorUserId, teamLeadId)` — ownership check
- `canViewTeamLessons(role, isTeamMember)` — membership check
- Clear boundary: accessControl.ts = role-based access, featureFlags.ts = tier-based gating

### Teacher Customization Handout Updated

Updated DOCX + PDF with 9 Bible versions (added AMP).

---

## SESSION LOG: February 21, 2026

### Comprehensive Codebase Cleanup

- 8 separate deployments
- ~890 lines of dead code eliminated
- Zero old brand references remaining in TypeScript files, Edge Functions, and documentation
- Shape ID mismatches fixed
- Parable context discriminator renamed
- programConfig.ts recentUpdates refreshed with Jan-Feb 2026 features

---

## SESSION LOG: February 14, 2026

### Profile vs Settings Split

Separated user identity defaults from workspace preferences:

**User Profile Modal (identity defaults — accessible from dropdown):**
- Read-only: Email, Member ID (first 8 chars), Role, Organization
- Editable: Full Name, Language (en/es/fr), Default Bible Version (9 from SSOT), Baptist Theology Profile (10 from SSOT with summary)
- Saves to profiles: `full_name`, `preferred_language`, `default_bible_version`, `theology_profile_id`

**Settings tab removed entirely from workspace.** All settings content (Lesson Defaults, Teaching Context, Export Preferences, Notifications) was stripped. Only the Profile card with "Update Profile" button remained, and that was also removed when the dropdown was rewired.

### Dropdown "User Profile" Opens Modal Directly

- Renamed "Settings" → "User Profile" in dropdown menu (navigationConfig.ts)
- Dropdown item now opens `UserProfileModal` directly via `onClick` handler in Header.tsx (no page navigation)
- Header.tsx wrapped in `<>...</>` fragment to render both `<header>` and modal
- `onProfileUpdated` prop made optional (`?.()` safe-call) so Header can open modal without callback

### Settings Tab Removed from Workspace

- Removed Settings `TabsTrigger` and `TabsContent` from Dashboard.tsx
- Workspace now has 3 tabs: Build Lesson, Lesson Library, Devotional Library

### Deploy Script Simplified — Single Branch

- Changed `deploy.ps1` production branch from `biblelessonspark` to `main`
- Deleted `biblelessonspark` branch locally and on remote
- All deploys now: `.\deploy.ps1 "message"` → pushes to `main` → Netlify builds
- No more branch switching, merging, or juggling

### Database Fix: Theology Profile Constraint Dropped

- `profiles` table had CHECK constraint `valid_theology_profile_id` allowing only 4 values
- Frontend SSOT has 10 theology profiles including default "baptist-core-beliefs"
- Dropped constraint: `ALTER TABLE profiles DROP CONSTRAINT valid_theology_profile_id;`
- Frontend SSOT now controls valid values per "frontend drives backend"

### Bug Fixes

- **display_name → full_name:** EnhanceLessonForm.tsx line 683 queried `profiles.display_name` (doesn't exist). Changed to `full_name`.
- **Broken welcome icon:** `<span className="text-2xl">??</span>` was a corrupted emoji. Replaced with `<Sparkles className="h-6 w-6 text-primary shrink-0" />`.
- **"Build Lesson" tab label reverted:** Dashboard.tsx and dashboardConfig.ts both showed "Enhance Lesson" again. Fixed both back to "Build Lesson".
- **Navigation routing:** Settings dropdown routed to `/account` instead of workspace. Fixed to open modal directly.

---

## PHASE 28 STATUS: IN PROGRESS

Phase 28 covers multi-tenant architecture planning, Admin Panel consolidation strategy, and Feature Adoption design.

### Completed February 11, 2026

**Bug Fix: `/admin/toolbelt` 404**
- Root cause: Same route bug pattern (#7 above) — `ToolbeltAdmin.tsx` existed but was never wired into routes
- Fix: Added `ADMIN_TOOLBELT: '/admin/toolbelt'` to `routes.ts`, added import + route to `App.tsx`
- Commit: `0a8e5cf`

**Bug Fix: `deploy.ps1` success message**
- Changed "Vercel build" to "Netlify build" in deploy script

**Multi-Tenant Architecture Planning**
- Complete database audit: 60 tables classified (34 need `tenant_id`, 16 platform-level, 6 need verification)
- Three-tier role system designed: `platform_admin`, `tenant_admin`, `teacher`
- Theology system architecture designed with three new tables
- RLS policy patterns defined (4 patterns covering all table types)
- Admin Panel consolidation proposed: 11 tabs → 6
- Feature Adoption strategy: expandable user rows inside User Management
- Full migration plan documented in `MULTI_TENANT_MIGRATION_PLAN.md`

### Key Architecture Decisions Made

1. **Theology flows downward from authority, not upward from teacher choice.** Pastor/elder board/convention sets the doctrinal standard. Teachers teach within that standard. No theology picker for org members.
2. **Two-tier theology catalog:** Platform profiles (10 Baptist, expanding) + tenant custom profiles (Statement of Faith / Church Covenant). Tenant admin enables from platform catalog and/or creates custom. Org manager selects ONE for their church.
3. **Custom theology profiles require platform admin approval** before they can drive lesson generation (guardrail against prompt injection and heresy).
4. **Platform guardrails are hardcoded and non-negotiable** — no tenant can weaken Christian orthodoxy boundaries.
5. **`system_settings.current_phase` moves to `tenant_config.platform_mode`** — each tenant controls their own beta → production transition.
6. **Admin Panel consolidation:** 11 tabs → 6 (People, Content, Configuration, Analytics, Security, Growth). Growth tab is platform-admin only.

---

## PHASE 27 STATUS: COMPLETE

Phase 27 covered two major feature areas: Teaching Team and Lesson Shapes.

### Phase 27A: Teaching Team (Completed February 9, 2026)

Peer-to-peer lesson sharing system where a lead teacher creates a team, invites members, and shares lessons. **Team size: 3 total (lead + 2 invited).**

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
shape_id TEXT               -- ID of the shape used (e.g., 'passage_walkthrough')
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
preferred_language (TEXT)         ← en, es, fr
default_bible_version (TEXT)     ← e.g., 'esv', 'kjv', 'nasb'
theology_profile_id (TEXT)       ← e.g., 'southern-baptist-bfm-1963'
organization_role (TEXT)
organization_id (UUID)
```
**Note:** The CHECK constraint `valid_theology_profile_id` was dropped February 14, 2026. Frontend SSOT (THEOLOGY_PROFILES) controls valid values.

### RLS Helper Functions (already exist)
```sql
-- These use SECURITY DEFINER to break circular RLS dependency
CREATE OR REPLACE FUNCTION is_team_member_of(team_uuid uuid) ...
CREATE OR REPLACE FUNCTION is_team_lead_of(team_uuid uuid) ...
```

---

## COMPLETE DATABASE TABLE INVENTORY (60 tables as of February 11, 2026)

### Tables Requiring tenant_id for Multi-Tenant (34)

**Core User & Content:** profiles, lessons, lesson_series, refinements, reshape_metrics, generation_metrics, devotionals, devotional_usage

**Organizations & Teams:** organizations, organization_members, organization_contacts, organization_focus, org_shared_focus, org_lesson_pack_purchases, org_onboarding_purchases, teaching_teams, teaching_team_members, transfer_requests, invites

**User Management & Subscriptions:** user_roles, user_subscriptions, credits_ledger, teacher_preference_profiles, setup_progress

**Feedback & Analytics:** feedback, beta_feedback, beta_testers, feedback_questions (if tenant-customizable)

**Security & Audit:** events, guardrail_violations, guardrail_violation_summary, admin_audit, notifications

**Email & Toolbelt:** email_rosters, email_sequence_tracking, toolbelt_email_captures, toolbelt_email_tracking, toolbelt_usage

### Tables NOT Requiring tenant_id — Platform-Level (16)

tenant_config, pricing_plans, subscription_plans, tier_config, org_tier_config, bible_versions, email_sequence_templates, onboarding_config, lesson_pack_config, modern_parables, app_settings, rate_limits, stripe_events, branding_config, outputs (verify), anonymous_parable_usage (verify)

### Views (inherit filtering from source tables)

beta_feedback_view, production_feedback_view, parable_usage (verify), user_parable_usage (verify)

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
| reshape-lesson | Reshape lesson into pedagogical shape (claude-sonnet-4) |
| extract-lesson | File extraction (TXT, PDF, DOCX, images) |
| send-lesson-email | Lesson email with optional Student Handout (teaser + handout) |
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
| contracts.ts | src/constants/ | TypeScript interfaces (delegates domain types to SSOT owners via string + JSDoc) |
| ageGroups.ts | src/constants/ | 11 age group definitions |
| theologyProfiles.ts | src/constants/ | 10 Baptist theology profiles (will migrate to platform_theology_profiles table) |
| bibleVersions.ts | src/constants/ | 9 Bible versions (KJV, WEB, NKJV, NASB default, ESV, NIV, CSB, NLT, AMP) |
| teacherPreferences.ts | src/constants/ | 15 teacher customization fields with Claude behavioral directives |
| accessControl.ts | src/constants/ | Role-based feature visibility + team/shape permissions |
| validation.ts | src/constants/ | Validation rules for orgs, passwords, teams, profiles, lessons |
| featureFlags.ts | src/constants/ | Subscription tier-based feature gating (NEW Feb 22) |
| pricingConfig.ts | src/constants/ | Sole pricing authority — matches live Stripe catalog |
| lessonStructure.ts | src/constants/ | Export spacing, fonts, colors, section definitions |
| lessonShapeProfiles.ts | src/constants/ | 5 shapes, prompts, age-group mappings, heading regex |
| branding.ts | src/config/ | Application identity, URLs, legal, email templates |
| routes.ts | src/constants/ | Route path definitions |
| navigationConfig.ts | src/constants/ | Dropdown menu items ("User Profile" opens modal) |
| dashboardConfig.ts | src/constants/ | Dashboard tab config ("Build Lesson", not "Enhance Lesson") |
| emailDeliveryConfig.ts | src/constants/ | Email limits, templates, tier gating |

### Backend Mirrors (read-only copies synced from frontend)
| File | Location | Source |
|------|----------|--------|
| lessonShapeProfiles.ts | supabase/functions/_shared/ | ← src/constants/lessonShapeProfiles.ts |
| emailDeliveryConfig.ts | supabase/functions/_shared/ | ← src/constants/emailDeliveryConfig.ts |
| teacherPreferences.ts | supabase/functions/_shared/ | ← src/constants/teacherPreferences.ts |
| branding.ts | supabase/functions/_shared/ | Database-driven with fallback |

### Deleted Files — Do Not Recreate
| File | Reason | Deleted |
|------|--------|---------|
| pricingPlans.ts | Conflicted with pricingConfig.ts; stale Stripe IDs | Feb 22, 2026 |
| src/constants/branding.ts | Orphaned duplicate of src/config/branding.ts | Feb 21, 2026 |
| site.ts | Duplicated branding.ts | Feb 21, 2026 |

---

## SUBSCRIPTION TIERS & STRIPE CATALOG

### Free Tier
- Sections visible: 1 (Title/Overview), 5 (Teacher Transcript), 8 (Student Handout)
- Limited generation credits
- No devotionals, reshaping, or teaching teams

### Personal Plan
- $9/month or $90/year
- All 8 lesson sections
- DevotionalSpark, lesson reshaping, teaching teams
- Full export (PDF, DOCX, Email, Print)

### Tier Gating Architecture
- **featureFlags.ts** — defines which features require which tier
- **accessControl.ts** — defines which roles can access which features
- Both must pass for a user to access a gated feature

---

## BUG HISTORY (so you don't repeat them)

1. **display_name vs full_name** — Queries using `profiles.display_name` which doesn't exist. The column is `full_name`. ALWAYS check the actual schema.
2. **RLS infinite recursion** — teaching_teams and teaching_team_members had circular RLS policies. Fixed with SECURITY DEFINER helper functions.
3. **Missing /org-manager route** — Route existed in routes.ts/navigationConfig.ts but was never added to App.tsx.
4. **Missing /workspace route** — Same pattern as #3. Route existed in routes.ts/navigationConfig.ts but was never added to App.tsx. Fixed February 9, 2026.
5. **Misleading toast** — Toast said "Invitation sent" when no email was actually sent. Fixed: toast now says invitee will receive email notification (and they actually do).
6. **Raw fetch() to Edge Function failed silently** — `import.meta.env.VITE_SUPABASE_URL` was not available/correct. Fixed by using `supabase.functions.invoke()` which uses the already-configured client.
7. **Student Handout subtitle detection** — Regex required line to END after keyword (`\s*$`), but shaped content produced headings like "Student Experience: The Heart of Divine Love". Fixed by allowing optional `(?:\s*[:\u2014\u2013\-].*)?$` suffix in all 5 detection files.
8. **Bare # markdown markers in shaped content** — Shaped content used bare `#` lines as section separators. These rendered as literal `#` characters in print, PDF, DOCX, and email. Fixed by stripping bare `#{1,3}` lines in formatLessonContent.ts, exportToPdf.ts, exportToDocx.ts, and send-lesson-email.
9. **Missing heading level support** — `formatLessonContent.ts` only handled `##` headings. Shaped content uses `#`, `##`, and `###`. All three levels now handled in screen display, print, PDF, DOCX, and email.
10. **Missing dependency in deployment** — `lessonStructure.ts` added `section8StandaloneTitle` property, but was omitted from the deployment file list. Three files (PDF, DOCX, Print) referenced it and would have rendered "undefined". Always verify the full dependency chain before deploying.
11. **Missing /admin/toolbelt route** — Same pattern as #3, #4. `ToolbeltAdmin.tsx` page existed (built January 28) but route was never added to `routes.ts` or `App.tsx`. Fixed February 11, 2026 (commit `0a8e5cf`).
12. **Branch mismatch causing invisible deploys** — Netlify built from `main` but deploy script pushed to `biblelessonspark` branch. Changes were invisible on live site. Fixed February 14, 2026: consolidated to single `main` branch, deleted `biblelessonspark` branch.
13. **Theology profile constraint too restrictive** — `profiles` table had CHECK constraint `valid_theology_profile_id` allowing only 4 values, but frontend SSOT has 10. Dropped constraint February 14, 2026.
14. **onProfileUpdated not optional** — UserProfileModal required `onProfileUpdated` callback. When opened from Header (which doesn't pass it), save crashed with "r is not a function". Fixed by making prop optional with `?.()` call.
15. **Stale file overwrite pattern** — Deploying a file generated earlier in the session can overwrite fixes made later. Always verify the file being deployed reflects all changes from the current session.

---

## BETA LAUNCH CONTEXT

- **Beta launch date:** February 28, 2026
- **Active beta tester:** Ellis Hayden (elhayden52@yahoo.com) from Fellowship Baptist in Longview, TX
- **Lynn's test accounts:** pastorlynn2024@gmail.com (invitee for testing — email notifications confirmed working)
- **Current user count:** 1 admin + 38 teachers = 39 total users
- **Teaching team tested end-to-end** with Ellis Hayden (Feb 22, 2026)
- **All 5 lesson shapes tested** (Feb 22, 2026)
- **Platform mode:** beta (in Supabase system_settings)

---

## WHITE-LABEL ARCHITECTURE SUMMARY

Full details in `MULTI_TENANT_MIGRATION_PLAN.md` (companion document).

### Two White-Label Models

| Model | Example | Infrastructure |
|-------|---------|----------------|
| A: Subdomain | `firstbaptist.biblelessonspark.com` | Shared Supabase, multi-tenant, usage-based billing |
| B: Self-Managed | `lessons.firstbaptist.org` | Their own Supabase, annual license fee |

### Theology Hierarchy

```
PLATFORM GUARDRAILS (Lynn owns — non-negotiable Christian orthodoxy)
  └── TENANT THEOLOGY IDENTITY (tenant admin defines — approved by Lynn)
       └── ORGANIZATION PROFILE SELECTION (org manager picks ONE)
            └── TEACHER (no theology choice — teaches within church's identity)
```

### Role System

| Role | Scope |
|------|-------|
| `platform_admin` | All tenants, all data (Lynn) |
| `tenant_admin` | One tenant — full admin within their fence |
| `teacher` | Own data within their tenant |

### Migration Status

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1: Foundation | Helper functions, tenant_id columns, role system | Not started |
| Phase 2: Theology System | 3 new tables, seed data | Not started |
| Phase 3: RLS Policies | Drop old, create tenant-scoped | Not started |
| Phase 4: System Settings | platform_mode to tenant_config | Not started |
| Phase 5: Frontend | Admin Panel, theology UI, generate-lesson changes | Not started |

---

## WHAT'S NEXT (Suggested priorities for next session)

1. **Beta launch preparation** — Final review of all features for February 28 launch readiness
2. **Feature Adoption view** — Build expandable user rows in Admin Panel User Management showing feature usage per user (lessons, shapes, teams, email)
3. **Verify uncertain tables** — Run verification queries from MULTI_TENANT_MIGRATION_PLAN.md Appendix A
4. **Backup existing RLS policies** — Run export query from Appendix B before any multi-tenant work begins

---

## COMPANION DOCUMENTS

| Document | Location | Purpose |
|----------|----------|---------|
| `PROJECT_MASTER.md` | Repo root | This file — session continuity |
| `MULTI_TENANT_MIGRATION_PLAN.md` | Repo root | Complete multi-tenant architecture: 34 table classifications, 4 RLS patterns, 3 theology tables, 5-phase execution plan, rollback procedures |
| `BLS_vs_Traditional_Curriculum_Comparison.docx` | Repo root | Marketing comparison document |
| `Teacher_Customization_Handout.docx` | Repo root | Teacher-facing handout for customization options |

---

## HOW TO START THE NEW CHAT

Paste this document, then describe what you want to work on. If the assistant needs to see any current files, upload them from `C:\Users\Lynn\biblelessonspark\src\` as needed.

**Reminder to assistant:** Read the CRITICAL WORKFLOW RULES section before doing anything. Every route change requires verifying BOTH routes.ts AND App.tsx. Frontend drives backend — always. Never guess at Supabase dashboard locations. Never propose database triggers. Test regex patterns against real data before shipping. Verify all dependency chains before presenting deployment instructions. Single branch: `main`. Deploy: `.\deploy.ps1 "message"`. Always `npm run build` before deploying. Never edit stale file copies.
