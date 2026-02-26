# BibleLessonSpark -- Project Master Document
## Date: February 26, 2026
## Purpose: Continue from exactly where we left off in a new chat

---

## PROJECT OVERVIEW

BibleLessonSpark (biblelessonspark.com) is a Bible study lesson generator platform targeting volunteer Sunday School teachers in Christian churches. Built with React/TypeScript frontend, Supabase backend, deployed via Netlify. Supports Baptist traditions today with architecture designed for any Christian denomination, network, association, or congregation.

**Owner:** Lynn, 74-year-old retired Baptist minister, PhD from Southwestern Baptist Theological Seminary, 55 years ministry experience. Non-programmer solopreneur.

**Local repo:** `C:\Users\Lynn\biblelessonspark`
**Branch:** `main` (single branch -- no secondary branches)
**Deploy command:** `.\deploy.ps1 "commit message"` (pushes to `main`, Netlify auto-builds)
**Supabase project URL:** `https://hphebzdftpjbiudpfcrs.supabase.co`
**GitHub repo:** `https://github.com/lynn75965/biblelessonspark`

---

## CRITICAL WORKFLOW RULES (MUST FOLLOW)

1. **SSOT MANDATE:** (1) Request file first, never assume (2) Backend mirrors frontend exactly (3) Minimal changes only (4) State what changed and SSOT source before presenting (5) When in doubt, ask
2. **Non-programmer workflow:** Provide complete file replacements + PowerShell Copy-Item commands. No diffs.
3. **Frontend drives backend.** Access uploaded files during session -- never re-request what's already provided.
4. **Claude Debugging Protocol:** Root-cause diagnosis BEFORE proposing solutions. No guessing.
5. **Deployment:** Netlify (not Lovable, not Vercel). Single branch: `main`. Deploy script: `.\deploy.ps1 "message"`.
6. **profiles table column:** Uses `full_name` (NOT `display_name`). This caused a bug -- never assume column names.
7. **ROUTE BUG PATTERN:** Every route added to `routes.ts` MUST also be added to `App.tsx`. This has caused bugs FOUR times (`/org-manager`, `/workspace`, `/admin/toolbelt`). Verify BOTH files on every route change.
8. **Never propose database triggers or autonomous backend actions.** Frontend drives backend -- always. No "Option B" that violates this.
9. **Never present options you aren't certain about.** If you don't know where a Supabase setting lives, say so instead of giving confident wrong directions.
10. **Dependency check before deployment.** Every deployment must verify that all files referencing new properties, exports, or constants have those dependencies already deployed or included in the same deployment batch.
11. **Test regex patterns against real data before shipping.** Never assume a regex works -- run it against actual content from the application.
12. **Branch discipline:** Single branch (`main`) only. Deploy script enforces `$PRODUCTION_BRANCH = "main"`. The old `biblelessonspark` branch was deleted February 14, 2026 to prevent branch-juggling confusion.
13. **Never overwrite working code with stale file copies.** Always verify the file being deployed is newer than what's live. This has caused regressions.
14. **Always `npm run build` before deploying.** Never push code that hasn't compiled cleanly.
15. **Bible version IDs must be lowercase.** Backend expects lowercase (`kjv`, `esv`). Frontend must normalize to lowercase before saving. Database was bulk-updated February 25, 2026.
16. **Unicode special characters:** Use JavaScript escape sequences (\u00F3, \u2014, etc.) instead of literal Unicode in source files. PowerShell's Set-Content corrupts non-ASCII characters. Translation files (i18n.ts) and symbol definitions (uiSymbols.ts) are SSOT exceptions that retain literal characters.

---

## BETA LAUNCH STATUS

- **Beta launch date:** February 28, 2026 (2 days away)
- **Active beta tester:** Ellis Hayden (elhayden52@yahoo.com) from Fellowship Baptist in Longview, TX
- **Lynn's test accounts:** pastorlynn2024@gmail.com (invitee for testing -- email notifications confirmed working)
- **Current user count:** 1 admin + 38 teachers = 39 total users
- **Teaching team tested end-to-end** with Ellis Hayden (Feb 22, 2026)
- **All 5 lesson shapes tested** (Feb 22, 2026)
- **Platform mode:** beta (in Supabase system_settings)
- **Domain redirect:** lessonsparkusa.com -> biblelessonspark.com via Namecheap 301 permanent redirect (configured Feb 25, 2026)

---

## SESSION LOG: February 26, 2026

### SSOT Regex Violation Fixed

`exportToDocx.ts` and `exportToPdf.ts` had inline copies of the student handout heading regex instead of importing `STUDENT_HANDOUT_HEADING_REGEX` from `lessonShapeProfiles.ts`. Both files now import from the SSOT source. This was the exact pattern that caused triple build failures on Feb 25 -- one bad regex duplicated in three places.

### programConfig.ts Unicode Fix

Lines 26, 27, 29 had replacement characters (question mark diamonds) instead of em dashes in user-facing recentUpdates text. Fixed with PowerShell -replace to proper em dashes.

### Codebase Verification Sweeps (all clean)

- Bare `->` in JSX: Only Admin.tsx line 218 inside a JSX comment -- safe
- `\u{` bare in JSX: Clean
- Replacement characters: Only programConfig.ts (now fixed)
- SSOT regex duplication: exportToDocx.ts and exportToPdf.ts (now fixed)

---

## SESSION LOG: February 25, 2026

### Critical: Lesson Generation Not Working (Bible Version Case Mismatch)

Users reported "Generate Lesson" not producing lessons. Root cause: 36 users had uppercase Bible version IDs (e.g., "KJV") in their profiles, but the backend `getBibleVersion()` function expected lowercase ("kjv") from the SSOT in `bibleVersions.ts`.

**Three-part fix:**
1. Database normalized: `UPDATE profiles SET default_bible_version = LOWER(default_bible_version) WHERE default_bible_version != LOWER(default_bible_version)`
2. Backend `getBibleVersion()` made case-insensitive with `.toLowerCase()` lookup
3. Frontend components (UserProfileModal.tsx, OrganizationSettingsModal.tsx) save lowercase
4. AMP Bible version added to backend `bibleVersions.ts` (was in frontend SSOT but missing from backend mirror)

### Auth Error Handling for Duplicate Email Signups

Users attempting to sign up with an already-registered email received a raw "Database error saving new user" message instead of a clear "Email already registered" message. Root cause: Supabase returns multiple different error patterns for duplicate emails.

**Fixes in Auth.tsx:**
- Added "Database error saving new user" to the existing error handler alongside "User already registered"
- Changed existing user check from `data?.user?.identities?.length === 0` to `!data?.user?.identities?.length` (handles null, undefined, and empty array)

### Domain Redirect: lessonsparkusa.com -> biblelessonspark.com

Configured through Namecheap:
- Deleted conflicting DNS records (old A records pointing to previous hosting, CNAME records for Vercel/Netlify)
- Set redirect type to Permanent (301) for SEO transfer benefits
- Both lessonsparkusa.com and www.lessonsparkusa.com redirect properly

### Unicode Corruption -- Permanent Fix Approach

Recurring pattern: PowerShell's `Set-Content` corrupts non-ASCII characters (em dashes, bullets, checkmarks, arrows) to `?` marks. Previous fix was file-by-file replacement.

**New approach:**
- Python-based cleanup script converts Unicode special characters to JavaScript escape sequences (\u2014 for em dash, \u2022 for bullet, etc.)
- Translation files (i18n.ts) and symbol definitions (uiSymbols.ts) are SSOT exceptions -- they retain literal characters
- Multiple files converted to escape sequences to prevent future corruption

### Build-Breaking Code Issues (Fixed)

Claude introduced several syntax errors that broke the build:
- Bare `->` in JSX text (not valid JSX)
- `\u{...}` unicode escapes in JSX text (not valid in JSX context)
- Invalid regex character class `[:---\-]` with literal em/en dash characters
- Unescaped `*` in regex in `formatLessonContent.ts`

All fixed, plus comprehensive PowerShell sweep commands established to verify codebase is clean.

---

## SESSION LOG: February 24, 2026

### UI Verification Audit

Confirmed all UI components properly reflect work from Feb 21-23. Identified that `project_knowledge_search` results can be stale -- Claude must verify actual file contents with `view` tool rather than relying on cached search results when diagnosing code issues. The trialConfig.ts file was already correct despite search results suggesting otherwise.

---

## SESSION LOG: February 23, 2026

### Marketing: Avatar Strategy Document

Created `BLS_Marketing_Avatar_Strategy.docx` with 7 customer personas targeting underserved segments in Baptist education:
1. Sarah Mitchell -- overwhelmed volunteer teacher (high volume)
2. Marcus Thompson -- bi-vocational pastor (high volume)
3. David & Rachel -- Reformed Baptist couple seeking aligned curriculum
4. Pat -- education director managing multiple classes
5. Jim -- senior adult class teacher
6. Ana -- bilingual ministry leader
7. Karen -- special needs advocate

### Email Campaign Bodies Created

10 email bodies (5 each for Sarah and Marcus avatars) using direct response copywriting: short lines, mobile-optimized, checkmark bullets, conversational voice.

### pricingConfig.ts Updated

`complimentaryFullLessons` changed from 2 to 3 to match the business model documented in BLS_vs_Traditional_Curriculum_Comparison.docx.

---

## SESSION LOG: February 22, 2026

### SSOT Violation Sweep -- COMPLETE (14 violations resolved)

| # | Violation | Resolution |
|---|-----------|------------|
| 1 | contracts.ts `LanguageKey = 'en' \| 'es' \| 'fr'` hardcoded union | Changed to `string` with JSDoc pointing to branding.ts |
| 2 | branding.ts `defaultBibleTranslation: "KJV"` conflicts with bibleVersions.ts NASB | Removed from branding.ts entirely |
| 3 | validation.ts DENOMINATION_OPTIONS missing Free Will Baptist | Added Free Will Baptist (now 9 denominations) |
| 4 | theologyProfiles.ts encoding artifacts in AI prompts | Confirmed codebase is clean -- mojibake was project reference copy only |
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

### Feature Flags System -- NEW

Created `featureFlags.ts` as centralized SSOT for subscription-gated features:

| Flag | Required Tier | Description |
|------|--------------|-------------|
| `lessonLibrary` | `free` | All users -- lessons auto-save on generation |
| `studentTeaser` | `personal` | Pre-lesson teaser for email/social |
| `devotional` | `personal` | DevotionalSpark generation |
| `lessonShaping` | `personal` | Reshape lessons into pedagogical formats |
| `teachingTeam` | `personal` | Teaching Team creation and management |
| `export` | `free` | PDF/DOCX/Print/Email export |
| `parables` | `free` | Modern Parables feature |

Wired to 5 React components: LessonLibrary, DevotionalGenerator, EnhanceLessonForm, TeachingTeamCard, and export components. Free users see upgrade prompts; paid users retain full functionality.

### Pricing Reconciliation -- COMPLETE

Discovered both pricing config files were completely stale vs. live Stripe catalog. Resolution:
- Deleted pricingPlans.ts (conflicting 4-tier system)
- pricingConfig.ts updated as sole pricing authority matching live Stripe catalog

### Trial System Redesigned

Rolling 30-day trial with 3 full lessons + 2 core lessons per period:
- `trialConfig.ts` created as SSOT for trial rules
- `generate-lesson` Edge Function patched for new trial enforcement
- Period auto-resets when 30 days expire

### Complete Rebrand -- COMPLETE

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
- `canManageTeam(role, actorUserId, teamLeadId)` -- ownership check
- `canViewTeamLessons(role, isTeamMember)` -- membership check
- Clear boundary: accessControl.ts = role-based access, featureFlags.ts = tier-based gating

### isPaidUser Fix

`EnhanceLessonForm.tsx` had `isPaidUser = tier === 'personal' || tier === 'admin'` -- wrong because admin is a Role, not a SubscriptionTier. Fixed to `tier !== 'free'`.

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
- FREE_TIER_SECTION_NUMBERS corrected from [1, 2, 3] to [1, 5, 8]

---

## SESSION LOG: February 14, 2026

### Profile vs Settings Split

Separated user identity defaults from workspace preferences:

**User Profile Modal (identity defaults -- accessible from dropdown):**
- Read-only: Email, Member ID (first 8 chars), Role, Organization
- Editable: Full Name, Language (en/es/fr), Default Bible Version (9 from SSOT), Baptist Theology Profile (10 from SSOT with summary)
- Saves to profiles: `full_name`, `preferred_language`, `default_bible_version`, `theology_profile_id`

**Settings tab removed entirely from workspace.** Workspace now has 3 tabs: Build Lesson, Lesson Library, Devotional Library.

### Dropdown "User Profile" Opens Modal Directly

- Renamed "Settings" to "User Profile" in dropdown menu (navigationConfig.ts)
- Dropdown item now opens `UserProfileModal` directly via `onClick` handler in Header.tsx
- `onProfileUpdated` prop made optional (`?.()` safe-call) so Header can open modal without callback

### Deploy Script Simplified -- Single Branch

- Changed `deploy.ps1` production branch from `biblelessonspark` to `main`
- Deleted `biblelessonspark` branch locally and on remote
- All deploys now: `.\deploy.ps1 "message"` -> pushes to `main` -> Netlify builds

### Database Fix: Theology Profile Constraint Dropped

- `profiles` table had CHECK constraint `valid_theology_profile_id` allowing only 4 values
- Frontend SSOT has 10 theology profiles including default "baptist-core-beliefs"
- Dropped constraint: `ALTER TABLE profiles DROP CONSTRAINT valid_theology_profile_id;`
- Frontend SSOT now controls valid values per "frontend drives backend"

---

## PHASE 28 STATUS: IN PROGRESS

Phase 28 covers multi-tenant architecture planning, Admin Panel consolidation strategy, and Feature Adoption design.

### Completed February 11, 2026

**Bug Fix: `/admin/toolbelt` 404**
- Root cause: Same route bug pattern -- `ToolbeltAdmin.tsx` existed but was never wired into routes
- Fix: Added `ADMIN_TOOLBELT: '/admin/toolbelt'` to `routes.ts`, added import + route to `App.tsx`
- Commit: `0a8e5cf`

**Multi-Tenant Architecture Planning**
- Complete database audit: 60 tables classified (34 need `tenant_id`, 16 platform-level, 6 need verification)
- Three-tier role system designed: `platform_admin`, `tenant_admin`, `teacher`
- Theology system architecture designed with three new tables
- RLS policy patterns defined (4 patterns covering all table types)
- Admin Panel consolidation proposed: 11 tabs -> 6
- Feature Adoption strategy: expandable user rows inside User Management
- Full migration plan documented in `MULTI_TENANT_MIGRATION_PLAN.md`

### Key Architecture Decisions Made

1. **Theology flows downward from authority, not upward from teacher choice.** Pastor/elder board/convention sets the doctrinal standard. Teachers teach within that standard.
2. **Two-tier theology catalog:** Platform profiles (10 Baptist, expanding) + tenant custom profiles. Tenant admin enables from catalog and/or creates custom. Org manager selects ONE for their church.
3. **Custom theology profiles require platform admin approval** before they can drive lesson generation.
4. **Platform guardrails are hardcoded and non-negotiable** -- no tenant can weaken Christian orthodoxy boundaries.
5. **`system_settings.current_phase` moves to `tenant_config.platform_mode`** -- each tenant controls their own beta to production transition.
6. **Admin Panel consolidation:** 11 tabs -> 6 (People, Content, Configuration, Analytics, Security, Growth).

---

## PHASE 27 STATUS: COMPLETE

### Phase 27A: Teaching Team (Completed February 9, 2026)

Peer-to-peer lesson sharing system where a lead teacher creates a team, invites members, and shares lessons. **Team size: 3 total (lead + 2 invited).**

**What's deployed:**
- Database tables: `teaching_teams` and `teaching_team_members` with RLS (SECURITY DEFINER helpers to prevent infinite recursion)
- TeachingTeamCard component (create, rename, invite, remove, disband, leave)
- TeamInvitationBanner on Dashboard (shows pending invitations)
- Teaching Team page at `/teaching-team` (in dropdown menu for all roles)
- LessonLibrary has "My Lessons" / "Team Lessons" scope toggle
- `notify-team-invitation` Edge Function -- sends email when a teacher is invited
- Email arrives from support@biblelessonspark.com via Resend

### Phase 27B: Lesson Shapes (Completed February 10, 2026)

Allows teachers to reshape a generated 8-section lesson into a different pedagogical format while preserving theological content, age-appropriate language, and Baptist distinctives.

**Five shapes available:**
1. **Passage Walk-Through** -- Verse-by-verse guided study
2. **Life Connection** -- Opens with real-life situation, moves into Scripture, lands on practical response
3. **Gospel-Centered** -- Locates lesson within Creation-Fall-Redemption-Restoration narrative arc
4. **Focus-Discover-Respond** -- Three-movement structure: focus question, discover in Scripture, respond in life
5. **Story-Driven** -- Narrative experience that lets truth emerge from story

**Architecture:**
- SSOT file: `src/constants/lessonShapeProfiles.ts` (mirrored to `supabase/functions/_shared/`)
- Edge Function: `reshape-lesson` (claude-sonnet-4, temp 0.5, 90s timeout, 6000 max_tokens)
- Database: `lessons.shaped_content` (TEXT), `lessons.shape_id` (TEXT), `reshape_metrics` table with RLS
- Frontend: Reshape button in EnhanceLessonForm, shape picker, Original/Shaped toggle

**Student Handout detection (SSOT in lessonShapeProfiles.ts):**
- `STUDENT_HANDOUT_HEADING_REGEX` exported from `lessonShapeProfiles.ts`
- Imported by `exportToDocx.ts` and `exportToPdf.ts` (fixed Feb 26, 2026 -- previously inline copies)
- `LessonExportButtons.tsx` uses HTML-based regex (different format -- not a violation)

**Export support (all 4 channels handle shaped content):**
- PDF, DOCX, Print, Email -- all handle Student Handout on standalone page with heading detection

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
```

### profiles (relevant columns only)
```
id (UUID, PK, references auth.users)
full_name (TEXT)       <-- THIS IS THE COLUMN NAME, NOT display_name
email (TEXT)
preferred_language (TEXT)         <-- en, es, fr
default_bible_version (TEXT)     <-- LOWERCASE e.g., 'esv', 'kjv', 'nasb'
theology_profile_id (TEXT)       <-- e.g., 'southern-baptist-bfm-1963'
organization_role (TEXT)
organization_id (UUID)
trial_period_start (TIMESTAMPTZ)
trial_full_lessons_used (INTEGER)
trial_short_lessons_used (INTEGER)
trial_full_lesson_granted_until (TIMESTAMPTZ)
```
**Note:** The CHECK constraint `valid_theology_profile_id` was dropped February 14, 2026. Frontend SSOT (THEOLOGY_PROFILES) controls valid values. Bible version IDs must be stored lowercase (normalized February 25, 2026).

### RLS Helper Functions (already exist)
```sql
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

### Tables NOT Requiring tenant_id -- Platform-Level (16)

tenant_config, pricing_plans, subscription_plans, tier_config, org_tier_config, bible_versions, email_sequence_templates, onboarding_config, lesson_pack_config, modern_parables, app_settings, rate_limits, stripe_events, branding_config, outputs (verify), anonymous_parable_usage (verify)

### Views (inherit filtering from source tables)

beta_feedback_view, production_feedback_view, parable_usage (verify), user_parable_usage (verify)

---

## EMAIL CONFIGURATION (Verified February 10, 2026)

- **Provider:** Resend (smtp.resend.com, port 587)
- **Sender email:** support@biblelessonspark.com
- **Sender name:** BibleLessonSpark Support (in Supabase SMTP settings)
- **Edge Function sender:** Uses `_shared/branding.ts` -> `getEmailFrom()` which returns `BibleLessonSpark <noreply@biblelessonspark.com>`
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
| featureFlags.ts | src/constants/ | Subscription tier-based feature gating |
| pricingConfig.ts | src/constants/ | Sole pricing authority -- matches live Stripe catalog |
| trialConfig.ts | src/constants/ | Rolling 30-day trial rules (3 full + 2 short lessons per period) |
| lessonStructure.ts | src/constants/ | Export spacing, fonts, colors, section definitions |
| lessonShapeProfiles.ts | src/constants/ | 5 shapes, prompts, age-group mappings, STUDENT_HANDOUT_HEADING_REGEX |
| branding.ts | src/config/ | Application identity, URLs, legal, email templates |
| routes.ts | src/constants/ | Route path definitions |
| navigationConfig.ts | src/constants/ | Dropdown menu items ("User Profile" opens modal) |
| dashboardConfig.ts | src/constants/ | Dashboard tab config ("Build Lesson", not "Enhance Lesson") |
| emailDeliveryConfig.ts | src/constants/ | Email limits, templates, tier gating |
| outputGuardrails.ts | src/constants/ | Truth & integrity verification for AI output |
| parableConfig.ts | src/constants/ | Modern Parable Generator configuration |
| parableDirectives.ts | src/constants/ | Parable generation AI directives |
| freshnessOptions.ts | src/constants/ | Auto-generated freshness/cultural context options |
| organizationConfig.ts | src/constants/ | Organization structure and settings rules |
| seriesConfig.ts | src/constants/ | Series/Theme Mode feature configuration |
| sharedFocusConfig.ts | src/constants/ | Org-wide passage/theme assignment rules |
| toolbeltConfig.ts | src/constants/ | Teacher Toolbelt functionality configuration |
| feedbackConfig.ts | src/constants/ | Feedback system configuration |
| betaEnrollmentConfig.ts | src/constants/ | Beta enrollment flow UI and behavior |
| exportSettingsConfig.ts | src/constants/ | Admin-editable export formatting settings |
| transferRequestConfig.ts | src/constants/ | Teacher transfer request workflow rules |
| programConfig.ts | src/constants/ | Static content (maintenance messages, beta updates) |

### Backend Mirrors (read-only copies synced from frontend)
| File | Location | Source |
|------|----------|--------|
| lessonShapeProfiles.ts | supabase/functions/_shared/ | src/constants/lessonShapeProfiles.ts |
| emailDeliveryConfig.ts | supabase/functions/_shared/ | src/constants/emailDeliveryConfig.ts |
| teacherPreferences.ts | supabase/functions/_shared/ | src/constants/teacherPreferences.ts |
| trialConfig.ts | supabase/functions/_shared/ | src/constants/trialConfig.ts |
| pricingConfig.ts | supabase/functions/_shared/ | src/constants/pricingConfig.ts |
| betaEnrollmentConfig.ts | supabase/functions/_shared/ | src/constants/betaEnrollmentConfig.ts |
| bibleVersions.ts | supabase/functions/_shared/ | src/constants/bibleVersions.ts |
| branding.ts | supabase/functions/_shared/ | Database-driven with fallback |

### Deleted Files -- Do Not Recreate
| File | Reason | Deleted |
|------|--------|---------|
| pricingPlans.ts | Conflicted with pricingConfig.ts; stale Stripe IDs | Feb 22, 2026 |
| src/constants/branding.ts | Orphaned duplicate of src/config/branding.ts | Feb 21, 2026 |
| site.ts | Duplicated branding.ts | Feb 21, 2026 |

---

## SUBSCRIPTION TIERS & STRIPE CATALOG

### Free Tier
- 3 full lessons + 2 core lessons per rolling 30-day period
- Core lesson sections: 1 (Title/Overview), 5 (Teacher Transcript), 8 (Student Handout)
- No devotionals, reshaping, or teaching teams
- PDF/DOCX/Print/Email export available

### Personal Plan
- $9/month or $90/year
- All 8 lesson sections
- DevotionalSpark, lesson reshaping, teaching teams
- Full export (PDF, DOCX, Email, Print)

### Tier Gating Architecture
- **featureFlags.ts** -- defines which features require which tier
- **accessControl.ts** -- defines which roles can access which features
- Both must pass for a user to access a gated feature

---

## BUG HISTORY (so you don't repeat them)

1. **display_name vs full_name** -- Queries using `profiles.display_name` which doesn't exist. The column is `full_name`. ALWAYS check the actual schema.
2. **RLS infinite recursion** -- teaching_teams and teaching_team_members had circular RLS policies. Fixed with SECURITY DEFINER helper functions.
3. **Missing /org-manager route** -- Route existed in routes.ts/navigationConfig.ts but was never added to App.tsx.
4. **Missing /workspace route** -- Same pattern as #3. Fixed February 9, 2026.
5. **Misleading toast** -- Toast said "Invitation sent" when no email was actually sent.
6. **Raw fetch() to Edge Function failed silently** -- `import.meta.env.VITE_SUPABASE_URL` was not available. Fixed by using `supabase.functions.invoke()`.
7. **Student Handout subtitle detection** -- Regex required line to END after keyword. Fixed by allowing optional suffix.
8. **Bare # markdown markers in shaped content** -- Rendered as literal `#` characters. Fixed by stripping bare `#{1,3}` lines in 4 files.
9. **Missing heading level support** -- All three levels (#, ##, ###) now handled everywhere.
10. **Missing dependency in deployment** -- Always verify the full dependency chain before deploying.
11. **Missing /admin/toolbelt route** -- Same pattern as #3, #4. Fixed February 11, 2026.
12. **Branch mismatch causing invisible deploys** -- Consolidated to single `main` branch February 14, 2026.
13. **Theology profile constraint too restrictive** -- Dropped CHECK constraint. Frontend SSOT controls valid values.
14. **onProfileUpdated not optional** -- Fixed by making prop optional with `?.()` call.
15. **Stale file overwrite pattern** -- Always verify the file being deployed reflects all changes from the current session.
16. **isPaidUser incorrect formula** -- Was `tier === 'personal' || tier === 'admin'`. Admin is a Role, not a SubscriptionTier. Fixed to `tier !== 'free'`. February 22, 2026.
17. **Bible version case mismatch** -- Backend expected lowercase IDs ('kjv'), but 36 users had uppercase ('KJV') in profiles. Database normalized, backend made case-insensitive, frontend saves lowercase. February 25, 2026.
18. **Duplicate email signup error handling** -- Supabase returns multiple different error strings for duplicate emails ("User already registered" and "Database error saving new user"). Only one was caught, showing raw backend error to users. Both now handled in Auth.tsx. February 25, 2026.
19. **Build-breaking syntax from Claude** -- Bare `->` in JSX, `\u{...}` unicode escapes in JSX, invalid regex character classes, unescaped `*` in regex. All introduced by Claude without running `npm run build` first. February 25, 2026.
20. **SSOT regex duplication** -- `STUDENT_HANDOUT_HEADING_REGEX` exported from lessonShapeProfiles.ts but exportToDocx.ts and exportToPdf.ts had their own inline copies. One bad regex duplicated three places required three fixes. Now imports from SSOT source. February 26, 2026.
21. **Unicode corruption recurring** -- PowerShell `Set-Content` corrupts non-ASCII characters (em dashes, bullets, checkmarks) to `?` marks. Permanent fix: use JavaScript escape sequences in source files. Translation files and symbol definitions are exceptions. February 25, 2026.

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
PLATFORM GUARDRAILS (Lynn owns -- non-negotiable Christian orthodoxy)
  |-- TENANT THEOLOGY IDENTITY (tenant admin defines -- approved by Lynn)
       |-- ORGANIZATION PROFILE SELECTION (org manager picks ONE)
            |-- TEACHER (no theology choice -- teaches within church's identity)
```

### Role System

| Role | Scope |
|------|-------|
| `platform_admin` | All tenants, all data (Lynn) |
| `tenant_admin` | One tenant -- full admin within their fence |
| `teacher` | Own data within their tenant |

### Migration Status (all phases not started -- post-launch)

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1: Foundation | Helper functions, tenant_id columns, role system | Not started |
| Phase 2: Theology System | 3 new tables, seed data | Not started |
| Phase 3: RLS Policies | Drop old, create tenant-scoped | Not started |
| Phase 4: System Settings | platform_mode to tenant_config | Not started |
| Phase 5: Frontend | Admin Panel, theology UI, generate-lesson changes | Not started |

---

## WHAT'S NEXT (Post-Launch Priorities)

1. **Feature Adoption view** -- Build expandable user rows in Admin Panel User Management showing feature usage per user (lessons, shapes, teams, email)
2. **Free-tier experience polish** -- Add "X complimentary lessons remaining" indicator so the free-tier cliff isn't invisible
3. **Verify uncertain tables** -- Run verification queries from MULTI_TENANT_MIGRATION_PLAN.md Appendix A
4. **Backup existing RLS policies** -- Run export query from Appendix B before any multi-tenant work begins
5. **Multi-tenant migration** -- Phase 1 through 5 per MULTI_TENANT_MIGRATION_PLAN.md

---

## COMPANION DOCUMENTS

| Document | Location | Purpose |
|----------|----------|---------|
| `PROJECT_MASTER.md` | Repo root | This file -- session continuity |
| `MULTI_TENANT_MIGRATION_PLAN.md` | Repo root | Complete multi-tenant architecture: 34 table classifications, 4 RLS patterns, 3 theology tables, 5-phase execution plan, rollback procedures |
| `BLS_vs_Traditional_Curriculum_Comparison.docx` | Repo root | Marketing comparison document |
| `BLS_Marketing_Avatar_Strategy.docx` | Repo root | 7 customer personas with targeted marketing strategies |
| `Teacher_Customization_Handout.docx` | Repo root | Teacher-facing handout for customization options (9 Bible versions) |

---

## HOW TO START THE NEW CHAT

Paste this document, then describe what you want to work on. If the assistant needs to see any current files, upload them from `C:\Users\Lynn\biblelessonspark\src\` as needed.

**Reminder to assistant:** Read the CRITICAL WORKFLOW RULES section before doing anything. Every route change requires verifying BOTH routes.ts AND App.tsx. Frontend drives backend -- always. Never guess at Supabase dashboard locations. Never propose database triggers. Test regex patterns against real data before shipping. Verify all dependency chains before presenting deployment instructions. Single branch: `main`. Deploy: `.\deploy.ps1 "message"`. Always `npm run build` before deploying. Never edit stale file copies. Bible version IDs must be lowercase. Use JavaScript escape sequences for non-ASCII characters in source files.
