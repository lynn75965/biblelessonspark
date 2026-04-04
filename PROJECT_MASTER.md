# BibleLessonSpark -- Project Master Document
## Date: March 26, 2026
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
2. **Non-programmer workflow:** Provide complete file replacements + PowerShell Copy-Item commands. No diffs, no snippets to insert.
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
17. **Webhook tier resolution must use pricingConfig.ts (SSOT).** NEVER query tier_config or pricing_plans database tables for Stripe price-to-tier mapping. The webhook imports `resolveTierFromPriceId` from `_shared/pricingConfig.ts`. Added February 26, 2026.
18. **AudienceConfig -- never hardcode participant strings.** NEVER hardcode "Student", "Member", or "Attendee" anywhere in the export stack. All participant-facing labels must resolve through `resolveExportTerminology()` in `seriesExportConfig.ts`. AudienceConfig triad: Role (Teacher/Pastor/Leader), Assembly (Class/Study Group/Congregation), Participant (Student/Member/Attendee). Series-level exports always use "Group Handout" -- never a participant term -- because a series can span multiple audience profiles. Added March 6, 2026.
19. **Corrupted files -- restore from git before patching.** If a file is corrupted by a bad write, run `git checkout HEAD -- src/path/to/file.ts` FIRST to restore it, then apply the fix to the clean restored file. Never patch a corrupted file. Added March 6, 2026.
20. **Supabase migration CLI is operational.** Use `npx supabase db push --linked` for future database migrations -- do NOT apply migrations manually via the Dashboard SQL editor. The migration history was fully reconciled on March 20, 2026 (45 migrations in sync, zero drift). All future schema changes must go through a migration file in `supabase/migrations/` so CLI tracking stays clean. Never run `supabase db push` without first verifying the migration SQL is correct and the schema change is not already applied to the live database. Added March 20, 2026.
21. **Run /audit-ssot at the start of any session touching constants, configs, pricing, tier names, routes, or backend functions.** This slash command is defined in CLAUDE.md and runs a read-only SSOT and Frontend-Drives-Backend audit, saving findings to `SSOT_AUDIT_REPORT.md`. It is diagnostic only -- no code changes. Added March 20, 2026.
22. **Accessibility is non-negotiable on every UI change.** Every interactive element must meet WCAG 2.1 AA minimum. Required on every UI task: (1) aria-disabled="true" never the disabled attribute on buttons that must stay focusable; (2) decorative icons always aria-hidden="true"; (3) locked/gated items stay in tab order with tabIndex={0}; (4) aria-label must describe both purpose and state; (5) hidden items use conditional rendering not CSS display:none; (6) nav landmarks never removed or left unlabeled; (7) aria-live="polite" on status/generation regions; (8) role="alert" on error messages; (9) focus moves to first error on validation failure and to result heading after generation completes; (10) every CC prompt touching UI must append the ACCESSIBILITY VERIFICATION BLOCK defined in the appendix of CLAUDE.md. Added April 4, 2026.

---

## BETA LAUNCH STATUS

- **Beta launch date:** February 28, 2026 (2 days away)
- **Active beta tester:** Ellis Hayden (elhayden52@yahoo.com) from Fellowship Baptist in Longview, TX
- **First paid subscriber:** John Eckeberger (john.eckeberger@4bresponse.org) -- Personal Plan $90/year, subscribed Feb 24, 2026
- **Lynn's test accounts:** pastorlynn2024@gmail.com (invitee for testing -- email notifications confirmed working)
- **Current user count:** 1 admin + 40 teachers = 41 total users
- **Teaching team tested end-to-end** with Ellis Hayden (Feb 22, 2026)
- **All 5 lesson shapes tested** (Feb 22, 2026)
- **Platform mode:** beta (in Supabase system_settings)
- **Domain redirect:** lessonsparkusa.com -> biblelessonspark.com via Namecheap 301 permanent redirect (configured Feb 25, 2026)

---

## SESSION LOG: February 26, 2026 (Afternoon -- Subscription Sync Fix)

### Critical Production Bug: Paid Subscriber Seeing Free-Tier Limits

**Problem:** John Eckeberger paid $90/year for Personal Plan on Feb 24, but his dashboard showed 5/5 free-tier lesson usage with upgrade prompts 2 days later. He had also created two accounts with different emails (bayarea.church and 4bresponse.org).

**Root Cause Chain:**
1. Stripe payment processed successfully for 4bresponse.org account (customer ID: cus_TqrHfED8BIfXRd)
2. `profiles.subscription_tier` was correctly set to `personal`
3. BUT `user_subscriptions.tier` remained `free` -- this is what `check_lesson_limit` RPC actually reads
4. The Stripe webhook's `updateUserSubscription()` function queried the `tier_config` database table to resolve the Stripe price ID to a tier name
5. **`tier_config` table did not contain John's price ID** -- lookup returned nothing
6. Webhook fell back to a hardcoded default tier of `"subscribed"` -- which is NOT a valid SubscriptionTier enum value
7. The upsert silently failed, leaving `user_subscriptions.tier = 'free'` with no Stripe IDs written

**This was an SSOT violation:** The webhook was querying database tables for tier mapping instead of using `pricingConfig.ts` where the authoritative Stripe price IDs live. Backend was driving itself instead of frontend driving backend.

### Fix 1: Immediate -- Manual SQL for John

```sql
UPDATE user_subscriptions
SET tier = 'personal', lessons_limit = 20, lessons_used = 0,
    stripe_customer_id = 'cus_TqrHfED8BIfXRd',
    stripe_subscription_id = 'sub_placeholder_needs_real_id',
    billing_interval = 'year', status = 'active', updated_at = now()
WHERE user_id = 'ce2cce5a-46c3-48bd-9c13-8d4ef3ff4039';
```

Note: First SQL attempt (from earlier in session) said "Success" but didn't actually change the data -- required a second execution with explicit column values. Verification query confirmed `personal`, `0`, `20` after second run. John confirmed working dashboard.

### Fix 2: Dual Account Merge for John

John had two accounts:
- `john.eckeberger@4bresponse.org` (active, paid) -- user_id: ce2cce5a-...
- `john.eckeberger@bayarea.church` (old free) -- user_id: f8b1c5ba-...

Transferred lesson ownership and marked old account:
```sql
UPDATE lessons SET user_id = 'ce2cce5a-...' WHERE user_id = 'f8b1c5ba-...';
UPDATE profiles SET full_name = 'John Eckeberger' WHERE id = 'ce2cce5a-...';
UPDATE profiles SET full_name = '[MERGED] John Eckeberger - see 4bresponse.org' WHERE id = 'f8b1c5ba-...';
```

### Fix 3: Permanent -- Webhook SSOT Compliance

**New functions added to `pricingConfig.ts` (frontend master + backend mirror):**
- `resolveTierFromPriceId(priceId)` -- maps any Stripe price ID to its SubscriptionTier using SSOT constants
- `getLessonLimitForPriceId(priceId)` -- returns lesson limit for any Stripe price ID

**Webhook (`stripe-webhook/index.ts`) rewritten:**
- `updateUserSubscription()` now imports `resolveTierFromPriceId` and `TIER_LESSON_LIMITS` from `_shared/pricingConfig.ts`
- ZERO queries to `tier_config` or `pricing_plans` tables for tier mapping
- New `resolveUserIdFromCustomer()` fallback: when `metadata.user_id` is missing from checkout session, retrieves customer email from Stripe and looks up matching profile in database
- All org subscription handlers also use SSOT for tier/limit resolution

**Deployed:** Commit 2192185, Edge Function redeployed via `npx supabase functions deploy stripe-webhook`

### Fix 4: Email Confirmation Dialog Before Checkout

To prevent future dual-account issues, added email confirmation step:
- **PricingPage.tsx** -- When user clicks "Upgrade Now", a dialog shows their logged-in email in bold and asks them to confirm before proceeding to Stripe
- **UpgradePromptModal.tsx** -- Same email confirmation dialog when clicking "Upgrade to Personal Plan"
- Dialog shows: "Your subscription will be linked to: [email]. Make sure this is the email you use to log in."
- User must click "Yes, Continue to Checkout" to proceed
- Stripe already locks the email field when a customer object is provided (existing behavior in `create-checkout-session` Edge Function)

**Deployed:** Commit 2dec484

### Checkout Session Code Verified

`create-checkout-session/index.ts` already correctly passes `metadata: { user_id: user.id }` on both the session and `subscription_data`. The metadata was present for John -- the failure was in the webhook's inability to resolve the price ID, not in missing metadata.

### SSOT Regex Violation Fixed

`exportToDocx.ts` and `exportToPdf.ts` had inline copies of the student handout heading regex instead of importing `STUDENT_HANDOUT_HEADING_REGEX` from `lessonShapeProfiles.ts`. Both files now import from the SSOT source.

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
subscription_tier (TEXT)         <-- display only; user_subscriptions.tier is SSOT for enforcement
trial_period_start (TIMESTAMPTZ)
trial_full_lessons_used (INTEGER)
trial_short_lessons_used (INTEGER)
trial_full_lesson_granted_until (TIMESTAMPTZ)
```
**Note:** The CHECK constraint `valid_theology_profile_id` was dropped February 14, 2026. Frontend SSOT (THEOLOGY_PROFILES) controls valid values. Bible version IDs must be stored lowercase (normalized February 25, 2026). `profiles.subscription_tier` is for display purposes only -- the authoritative tier for lesson limit enforcement is `user_subscriptions.tier` (learned from John Eckeberger bug, Feb 26, 2026).

### user_subscriptions (SSOT for subscription enforcement)
```
user_id (UUID, PK, references auth.users)
stripe_customer_id (TEXT)
stripe_subscription_id (TEXT)
stripe_price_id (TEXT)
tier (TEXT)                      <-- SSOT for lesson limit enforcement (NOT profiles.subscription_tier)
status (TEXT)                    <-- active, canceled, past_due, trialing, incomplete
billing_interval (TEXT)          <-- month, year
current_period_start (TIMESTAMPTZ)
current_period_end (TIMESTAMPTZ)
lessons_limit (INTEGER)
lessons_used (INTEGER)
updated_at (TIMESTAMPTZ)
```
**Critical:** The `check_lesson_limit` RPC reads tier from THIS table, not from profiles. If this table says 'free' but profiles says 'personal', the user gets free-tier limits. The Stripe webhook must update THIS table on every checkout/subscription event.

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
| create-checkout-session | Stripe checkout with user_id metadata |
| create-portal-session | Stripe customer portal |
| stripe-webhook | Subscription lifecycle (SSOT-compliant as of Feb 26, 2026) |

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
| pricingConfig.ts | src/constants/ | Sole pricing authority -- matches live Stripe catalog. Includes resolveTierFromPriceId() and getLessonLimitForPriceId() for webhook use |
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
| sidebarConfig.ts | src/constants/ | Sidebar navigation items, sections, and role-based arrays (SSOT for AppShell sidebar) |
| orgPricingConfig.ts | src/constants/ | Sole authority for org tier data -- display names, Stripe IDs, prices, limits (STRIPE_ORG block removed from pricingConfig.ts March 24, 2026) |
| AppShell.tsx | src/components/layout/ | Authenticated page layout wrapper -- sidebar + content, self-contained navigation, owns UserProfileModal |
| ThemeProvider.tsx | src/components/layout/ | Dark/light mode context provider -- persists preference in localStorage, consumed by AppShell and all themed components |

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

---

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

### Subscription Enforcement Flow (verified Feb 26, 2026)
1. Frontend calls `check_lesson_limit` RPC with user_id
2. RPC reads `user_subscriptions.tier` (NOT `profiles.subscription_tier`)
3. Returns `can_generate`, `lessons_used`, `lessons_limit`, `sections_allowed`
4. On Stripe checkout: `create-checkout-session` sets `metadata.user_id` on session + subscription_data
5. On payment: `stripe-webhook` receives event, calls `resolveTierFromPriceId()` from SSOT pricingConfig.ts
6. Webhook upserts `user_subscriptions` with correct tier, limit, Stripe IDs
7. Fallback: if metadata.user_id missing, webhook resolves user by Stripe customer email via profiles table

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
22. **Stripe webhook SSOT violation -- paid subscriber locked to free tier** -- Webhook queried `tier_config` database table to resolve Stripe price ID to tier. Table didn't have the price ID, so tier defaulted to invalid value "subscribed". Upsert silently failed, leaving user_subscriptions.tier = 'free'. Fix: webhook now imports `resolveTierFromPriceId()` from pricingConfig.ts (SSOT). Also added email fallback for user resolution. February 26, 2026.
23. **profiles.subscription_tier vs user_subscriptions.tier confusion** -- profiles.subscription_tier is display-only. The authoritative tier for lesson limit enforcement is user_subscriptions.tier, read by the check_lesson_limit RPC. If webhook fails to update user_subscriptions, user gets free-tier limits even though profiles shows "personal". February 26, 2026.

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

## BLS DEVELOPMENT ROADMAP
### Approved March 23, 2026
### This is the authoritative development plan. Update at completion of each phase. Claude Code sessions must reference the relevant phase specification before beginning any implementation work.

---

### PHASE A -- Complete ui-sidebar Branch and Clear Technical Debt -- COMPLETE (March 23-24, 2026)

All 11 tasks completed. See SESSION LOG: March 23-25, 2026 for details.

1. ~~Migrate all remaining pages to AppShell~~ -- DONE
2. ~~Dark mode color refinements~~ -- DONE
3. ~~Light mode color and contrast refinements~~ -- DONE
4. ~~Complete icon consistency audit~~ -- DONE
5. ~~Remove Print button from EnhanceLessonForm.tsx~~ -- DONE (already removed March 20)
6. ~~Confirm caller of BookletPrintModal.tsx then delete~~ -- DONE (already deleted March 22)
7. ~~Single-lesson export font picker and color scheme picker~~ -- DONE (already completed March 22)
8. ~~Audit OrgSetup.tsx for stale tier names~~ -- DONE
9. ~~Booklet economical printing~~ -- DONE
10. ~~Rename include_student_handouts column~~ -- DONE (46th migration: 20260324180000_rename_include_student_handouts.sql)
11. ~~Unify pricingConfig.ts STRIPE_ORG with orgPricingConfig.ts~~ -- DONE (STRIPE_ORG block removed from pricingConfig.ts; orgPricingConfig.ts is sole authority)

---

### PHASE B -- Merge ui-sidebar to Main Branch -- COMPLETE (March 25, 2026)

All 5 tasks completed. See SESSION LOG: March 23-25, 2026 for details.

1. ~~Full regression test across all six user roles~~ -- DONE
2. ~~Verify all AppShell-migrated pages render correctly~~ -- DONE
3. ~~Merge ui-sidebar to main~~ -- DONE (clean merge commit)
4. ~~Update PROJECT_MASTER.md and CLAUDE.md~~ -- DONE (this update)
5. ~~Deploy and verify at biblelessonspark.com~~ -- DONE

---

### PHASE C -- Library and Content Management Improvements

1. Retroactive series assignment -- add any existing lesson to any existing series after generation via "Add to Series" button on lesson cards
2. Series lesson reordering -- position lessons within a series before publishing via up/down controls or drag-to-reorder. Requires adding position column to lesson-series relationship table via Supabase migration.
3. Reshape history in Lesson Library -- every reshape recorded, searchable, viewable, exportable as distinct library entry. Shows shape type, date, credit cost. Uses reshape_metrics table already in database.
4. Consistent toolbar everywhere -- Copy, Download, Email on lessons, devotionals, and series using same quality experience. Reshape on lessons only. Download for devotionals and series requires extending export pipeline to accept those content types.

---

### PHASE D -- Publishing Hub (Print Wing)

1. New route /publish added to routes.ts and App.tsx. New page PublishingHub.tsx. New sidebar item added to sidebarConfig.ts for all roles.
2. Content selector -- three tabs: Lessons, Devotionals, Series. Deep linking supported from library Download buttons.
3. Format choices -- Full Page (8.5x11), Tri-Fold Group Handout, Study Guide Booklet
4. Font picker and color scheme picker -- unified across all content types using seriesExportConfig.ts SSOT
5. Output choices -- Download PDF, Download Word, Email, Copy. Word disabled for Tri-Fold and Booklet with clear label.
6. Intelligent defaults -- format Full Page, font TeX Gyre Pagella, color Forest and Gold, output Download PDF. Last-used settings remembered in localStorage.
7. Libraries become pure storage and browsing after this phase -- no export controls remain in libraries.

---

### PHASE E -- Publishing Hub (Digital Wing)

1. Published Series Reader -- shareable URL at biblelessonspark.com/read/[slug]. Screen-adaptive, no login required. New published_series table via Supabase migration.
2. QR code generation -- downloadable PNG, links to reader URL, generated client-side
3. ePub output -- compatible with Kindle, Apple Books, all standard e-readers, generated client-side
4. Digital Wing gated to Personal Plan and above. Free tier gets Full Page PDF only.
5. Published series links expire after 90 days, renewable in one click. Personal Plan: 20 active published series. Organization Plan: 100 active published series.

---

### PHASE F -- Tier Structure and Pricing Refinement

1. Free tier -- 3 full + 2 core lessons per rolling 30-day period, core sections only, Full Page PDF with watermark, no digital distribution. Genuinely useful. Never crippled. Serves the smallest church.
2. Personal Plan -- $9/month or $90/year. All 8 sections, devotionals, reshaping, teaching teams, full export, Publishing Hub Print Wing, Publishing Hub Digital Wing, up to 20 published series. Complete equipping. No feature gates after payment.
3. Organization Plan -- all Personal Plan features for every teacher in the org. Shared Focus, org-wide lesson visibility, up to 100 published series, Org Manager dashboard. Tiers: Foundation, Strengthening, Multiplication, Expansion, Network (defined in orgPricingConfig.ts SSOT).
4. Network and white-label onboarding -- one-time setup investment for conventions, associations, and custom deployments. Not a recurring fee. Amount set by Lynn based on scope.
5. No OTOs, no bundles, no feature gates after payment at any tier.

---

### PHASE G -- Admin and Self-Service Infrastructure

1. Admin UI feature flag toggles -- Feature Flags tab in Admin Panel. Lynn toggles flags without code deploy. Flag names in featureFlags.ts SSOT, live values in system_settings table.
2. Self-service organization creation -- paid teacher creates org from dashboard via wizard (name, denomination, size), selects tier, completes Stripe checkout via existing create-org-checkout-session edge function.
3. Frontend org upgrade paths -- Org Manager shows current tier and available upgrades with Stripe checkout. No admin intervention required.
4. Org landing page polish -- hero visual above the fold, mobile tier card carousel or accordion replacing five-card single-column scroll.

---

### PHASE H -- Multi-Tenant and White-Label Architecture

Per existing MULTI_TENANT_MIGRATION_PLAN.md. All Phase A through G work must be complete and stable before Phase H begins.

1. Phase H1 -- Foundation: tenant_id on 34 tables, helper functions, three-tier role system (platform_admin, tenant_admin, teacher)
2. Phase H2 -- Theology system: platform_theology_profiles, tenant_theology_profiles, org_theology_assignments tables. Seed with existing 10 Baptist profiles.
3. Phase H3 -- RLS policies: drop existing, implement tenant-scoped using four established patterns
4. Phase H4 -- System settings: platform_mode migrated from system_settings to tenant_config
5. Phase H5 -- Frontend: Admin Panel tenant management, theology UI, generate-lesson edge function updated for tenant theology context
6. White-label Model A -- subdomain (firstbaptist.biblelessonspark.com), shared Supabase, tenant branding via tenant_config, usage-based billing
7. White-label Model B -- self-managed (lessons.firstbaptist.org), church owns Supabase instance, annual license fee, updates as versioned releases

---

### PHASE I -- Tutorial Content and Teacher Equipping

1. Three tutorials scripted and ready to record -- Build Your First Lesson (3-4 min), Using the Lesson Library (3 min), Setting Up a Teaching Team (3 min). Record with Camtasia 2019 after Phase B merge against live sidebar UI.
2. Additional tutorials after sidebar goes live -- Publishing Hub, Building a Lesson Series, Setting Up Your Ministry Organization, Digital Distribution
3. All tutorials hosted at /training page, accessible from sidebar Tutorials item
4. Resources page (/resources) -- built out progressively with teacher preparation guides, theology profile explanations, age group teaching tips, recommended Baptist commentaries

---

### ROADMAP GOVERNING PHILOSOPHY

- Every improvement serves the volunteer teacher and the church discipleship ministry first
- Quality of equipping, not quantity of features
- No OTOs, no bundles, no nickeling-and-diming at any tier
- Free tier is genuine ministry outreach -- costs something intentionally -- serves the smallest church
- Paid tier is complete equipping -- no surprises after payment
- Digital distribution positions BLS ahead of where church curriculum is going
- Trust built through quality and integrity is the growth engine

---

## SESSION LOG: March 31, 2026 -- Publishing Hub Preview Bug Resolution

### Problem
Publishing Hub preview rendered as a wall of unformatted text for lessons generated March 11-13, 2026. All other lessons rendered correctly.

### Investigation Path
1. Pipeline audit confirmed clean -- single API call, single insert, single state update. No double-write.
2. SQL confirmed data integrity -- 176 newlines, 24 markdown headings, 0 carriage returns in affected lessons. Data was structurally sound.
3. CC identified root cause: affected lessons used `-- ##` (two dashes before heading) instead of `--- ##` (three dashes). The pre-processor regex in `renderMarkdownPreview()` required `{3,}` dashes to split inline separators onto their own lines. Two-dash pattern was never split, causing entire fused lines to fall through to plain text rendering.

### Resolution
All affected lessons deleted via SQL confirmation query:
`SELECT id FROM lessons WHERE original_text LIKE '%-- ##%'` -- returned 0 rows after deletion.

No code changes deployed. `PublishingHub.tsx` restored to last committed state via `git checkout HEAD`.

### Why This Cannot Recur
The two-dash pattern was generated during a specific period (March 11-13, 2026) only. Current lesson generation produces `---` separators consistently. New lessons will render correctly without any code fix.

### Bug History Addition
33. **Publishing Hub preview wall-of-text for March 11-13 lessons** -- Affected lessons used `-- ##` (two dashes) before section headings. Pre-processor regex required three dashes to split inline separators. Fused lines fell through to plain text branch. Resolution: deleted affected lessons. No code change. March 31, 2026.

---

## COMPANION DOCUMENTS

| Document | Location | Purpose |
|----------|----------|---------|
| `PROJECT_MASTER.md` | Repo root | This file -- session continuity |
| `CLAUDE.md` | Repo root | Claude Code architecture instructions -- SSOT rules, workflow rules, file-writing rules, deploy sequence. Read at start of every Claude Code session. |
| `MULTI_TENANT_MIGRATION_PLAN.md` | Repo root | Complete multi-tenant architecture: 34 table classifications, 4 RLS patterns, 3 theology tables, 5-phase execution plan, rollback procedures |
| `BLS_vs_Traditional_Curriculum_Comparison.docx` | Repo root | Marketing comparison document |
| `BLS_Marketing_Avatar_Strategy.docx` | Repo root | 7 customer personas with targeted marketing strategies |
| `Teacher_Customization_Handout.docx` | Repo root | Teacher-facing handout for customization options (9 Bible versions) |

---

## HOW TO START THE NEW CHAT

Paste this document, then describe what you want to work on. If the assistant needs to see any current files, upload them from `C:\Users\Lynn\biblelessonspark\src\` as needed.

**Reminder to assistant:** Read the CRITICAL WORKFLOW RULES section before doing anything. Every route change requires verifying BOTH routes.ts AND App.tsx. Frontend drives backend -- always. Never guess at Supabase dashboard locations. Never propose database triggers. Test regex patterns against real data before shipping. Verify all dependency chains before presenting deployment instructions. Single branch: `main`. Deploy: `.\deploy.ps1 "message"`. Always `npm run build` before deploying. Never edit stale file copies. Bible version IDs must be lowercase. Use JavaScript escape sequences for non-ASCII characters in source files. Webhook tier resolution uses pricingConfig.ts SSOT -- never query tier_config or pricing_plans tables. Provide complete file replacements with PowerShell Copy-Item commands -- no diffs, no snippets to insert.

---

## SESSION LOG: March 9, 2026 -- Series Export Modal Rebuild

### Features Delivered
- Color scheme picker (5 palettes, two swatches per row) in Export Series modal
- Font picker (5 options rendered in their own typeface) in Export Series modal
- Layout picker (Full Page, Booklet, Tri-Fold Group Handout) in Export Series modal
- Live HTML/CSS preview thumbnail -- updates instantly on color/font change
- "Download Print-Ready PDF" / "Download Word Document" contextual button label
- "Include Group Handout" checkbox (hidden for Tri-Fold)
- Print instructions shown for PDF format selection
- "Print Series Booklet" button removed from all series cards
- Google Fonts loaded once via injected link tag for EB Garamond and Crimson Text preview

### Files Changed
- `src/constants/seriesExportConfig.ts` -- added BOOKLET_COLOR_SCHEMES, getColorScheme, SERIES_EXPORT_FONT_OPTIONS, getFontOption, SERIES_EXPORT_LAYOUTS, SeriesExportLayout, ColorSchemeId, FontId, buildSeriesExportFilename, SERIES_EXPORT_FORMAT_MIME, SERIES_EXPORT_UI.buttonLabel, SERIES_EXPORT_UI.upgradePrompt, restored SERIES_HANDOUT_COPY.appendixTitle as 'Group Handout Section'
- `src/components/dashboard/SeriesLibrary.tsx` -- removed Print Series Booklet button, Export Series only
- `src/components/SeriesExport/SeriesExportModal.tsx` -- full rebuild: two-column layout, live preview, all pickers
- `src/constants/featureFlags.ts` -- BOM stripped, defensive null guard added to hasFeatureAccess
- `src/utils/export/buildSeriesDocx.ts` -- BOM stripped
- `src/utils/export/buildSeriesPdf.ts` -- BOM stripped

### Critical Bugs Found and Fixed This Session
1. `src/components/SeriesLibrary.tsx` and `src/components/dashboard/SeriesLibrary.tsx` are two different files. The dashboard renders from `dashboard/SeriesLibrary.tsx`. Writing to the wrong path left the old `bookletPrint` feature key call in place, crashing the page.
2. `hasFeatureAccess` had no null guard -- unknown feature key returned `undefined.enabled` and crashed the entire dashboard. Fixed with `if (!flag) return false` guard.
3. `buildSeriesExportFilename` and `SERIES_EXPORT_FORMAT_MIME` were missing from SSOT -- `useSeriesExport.ts` imported them but they did not exist. Added.
4. `SERIES_EXPORT_UI.buttonLabel` and `SERIES_EXPORT_UI.upgradePrompt` were missing from SSOT -- `SeriesExportButton.tsx` referenced them. Added.

### Critical Workflow Rule Added (Rule #19)
Before writing ANY file, run a path verification command first:
`Get-ChildItem "C:\Users\Lynn\biblelessonspark\src" -Recurse | Where-Object { $_.Name -eq "TargetFile.tsx" }`
This confirms the exact path before any write. Never assume path from component name alone.

### Deployment Commits (March 9, 2026)
- `17cb816` -- FEATURE: Export modal -- color schemes, font picker, layout picker, live preview, Group Handout -- remove Print Series Booklet
- `9c2e4c8` -- FIX: Add missing SERIES_EXPORT_UI.buttonLabel and upgradePrompt
- `60bd69e` -- FIX: Defensive guard in hasFeatureAccess for unknown feature keys
- `58910fd` -- FIX: Remove bookletPrint call from dashboard/SeriesLibrary -- wrong path corrected

### Final State
Export Series modal is live and working at biblelessonspark.com. Screenshot confirmed March 9, 2026 at 11:01 AM.

---

## SESSION LOG: March 10, 2026 -- Booklet PDF Imposition + Margin Fix

### Features Delivered
- Booklet PDF export (5.5 x 8.5" half-letter, saddle-stitch imposition) working end-to-end
- Imposition produces landscape letter sheets (11 x 8.5") with two half-pages side by side
- Correct booklet margin spec applied: 0.25" spine/inner, 0.40" top/bottom/outer
- Page count confirmed: 48 pages (raw) -> 40 pages (correct, reduced by tighter margins)
- Content verified as direct pass-through from lesson data -- no summarization, no AI calls

### Files Changed
- `src/utils/export/buildSeriesPdf.ts` -- three commits:
  1. `_imposeBooklet`: serialize srcDoc to bytes before embedPdf (fixed "PDFEmbeddedPage undefined" runtime error)
  2. `buildBookletPdf`: added BK_OUTER constant (28.8pt), rewired BK_CW to use BK_M + BK_OUTER, reset cy and bkPage() to use BOOKLET_PAGE.marginTop
  3. `pageIndices` fix applied in prior session (b619860)
- `src/constants/seriesExportConfig.ts` -- BOOKLET_PAGE margins corrected:
  - marginTop: 28.8pt (0.40")
  - marginBottom: 28.8pt (0.40")
  - marginLeft: 18pt (0.25" spine)
  - marginRight: 28.8pt (0.40" outer)

### Deployment Commits (March 10, 2026)
- `b619860` -- FIX: _imposeBooklet -- serialize srcDoc to bytes before embedPdf
- `bac5b59` -- FIX: booklet margins -- 0.25in spine, 0.40in outer/top/bottom per spec

### SSOT Violations Identified (NOT YET FIXED -- must address next session)
1. `SERIES_EXPORT_FORMATS.BOOKLET = 'booklet_pdf'` is dead code. The modal sends `format: 'pdf'` with `layout: 'booklet'`. The dispatch in `useSeriesExport.ts` works around this with `|| options.layout === SERIES_EXPORT_LAYOUTS.BOOKLET`. Fix: modal must set `format: SERIES_EXPORT_FORMATS.BOOKLET` when Booklet layout is selected; dispatch should check format only.
2. `doc.line()` calls in `buildBookletPdf` still use `BK_W - BK_M` for right end of horizontal rules instead of `BK_W - BK_OUTER`. Lines extend 10.8pt too far right.
3. `buildSeriesExportFilename()` is bypassed for booklet exports -- downloaded file has no `_Booklet` suffix.

### Known Remaining Issues (carry forward)
- Paragraph splitting mid-sentence in full-page PDF (long paragraphs near page bottom)
- `doc.line()` right-end position uses wrong margin constant (violation #2 above)
- Three jeopardy mitigations proposed but not yet implemented:
  1. `bkContent()` catch-all strip for residual markdown (`^>` blockquotes, `_italic_`)
  2. Large series (10+ lessons) soft warning in SeriesExportModal.tsx
  3. Additional Unicode replacements in `sanitizeForPdf()` (arrows, math symbols)

### Workflow Failures Acknowledged (March 10, 2026)
- Rules 1, 4, 10, 11, 13, 17, 18, 19 violated during this session
- Specifically: worked around SSOT instead of fixing it (Rule 1); proposed fixes before full file audit (Rule 4); shipped incomplete BK_OUTER rollout without auditing all doc.line() calls (Rule 10); proposed regex additions without testing against real data (Rule 11); referenced stale file at points during session (Rule 13)
- 19 workflow rules exist -- see BLS_NewChat_Handoff document for complete list

### Updated Workflow Rules (Rules 17-19 added March 9, confirmed March 10)
17. PowerShell here-string syntax (@'...'@) required for single quotes in replacement strings.
18. Set-Content with full file content is the only reliable write method. Copy-Item from Downloads consistently fails.
19. PATH VERIFICATION BEFORE EVERY FILE WRITE -- run this first, no exceptions:
    Get-ChildItem "C:\Users\Lynn\biblelessonspark\src" -Recurse | Where-Object { $_.Name -eq "TargetFile.tsx" }

### Bug History Additions
24. **_imposeBooklet "PDFEmbeddedPage undefined"** -- pdf-lib embedPdf() requires serialized bytes, not a PDFDocument object. Passing srcDoc directly caused all embedded pages to be undefined. Fix: `const srcBytes = await srcDoc.save()` then `embedPdf(srcBytes, allIndices)`. March 10, 2026.
25. **Booklet margins not matching spec** -- BOOKLET_PAGE constants were 54pt (0.75") instead of spec values. marginLeft was being used for all four sides via single BK_M constant. Fix: added BK_OUTER, corrected all four margin values in SSOT. March 10, 2026.

## Session -- March 10, 2026

### Work completed
Three SSOT violations identified and remediated in a single commit (c41b8fe).

**V1 -- SERIES_EXPORT_FORMATS.BOOKLET dead code (SeriesExportModal.tsx)**
Root cause: handleExport always sent format: selectedFormat, which is 'pdf'
when booklet layout is active. SERIES_EXPORT_FORMATS.BOOKLET was never used.
Fix: format field now resolves to SERIES_EXPORT_FORMATS.BOOKLET when
selectedLayout === SERIES_EXPORT_LAYOUTS.BOOKLET.

**V2 -- doc.line() right-end used BK_M instead of BK_OUTER (buildSeriesPdf.ts)**
Root cause: Four doc.line() calls in buildBookletPdf used BK_W - BK_M (18pt
spine margin) for the right boundary instead of BK_W - BK_OUTER (28.8pt outer
margin). Lines extended 10.8pt past the correct text block edge.
Fix: All four calls updated to BK_W - BK_OUTER.

**V3 -- buildSeriesExportFilename() bypassed for booklet downloads**
Root cause: Downstream consequence of V1 -- format: 'pdf' caused filename
function to produce no _Booklet suffix.
Fix: Resolved automatically by V1 fix. No additional changes required.

**V1 cleanup -- useSeriesExport.ts**
Removed || options.layout === SERIES_EXPORT_LAYOUTS.BOOKLET workaround from
dispatch logic. Single clean condition now matches on format alone.

### Files changed
- src/components/SeriesExport/SeriesExportModal.tsx
- src/hooks/useSeriesExport.ts
- src/utils/export/buildSeriesPdf.ts

### Commit
c41b8fe -- FIX: Resolve 3 SSOT violations in booklet export pipeline

## Session -- March 10, 2026 (Afternoon -- SSOT Violations + Export Hardening)

### SSOT Violations Resolved (commit c41b8fe)
Three violations carried forward from the morning session -- all fixed and deployed.

V1 -- SeriesExportModal.tsx: handleExport now sends SERIES_EXPORT_FORMATS.BOOKLET
when booklet layout is selected. SSOT constant was previously dead code.

V2 -- buildSeriesPdf.ts: All four doc.line() calls in buildBookletPdf corrected
from BK_W - BK_M to BK_W - BK_OUTER. Lines were 10.8pt past the text block edge.

V3 -- buildSeriesExportFilename() bypass resolved automatically by V1 fix.
Booklet downloads now carry correct _Booklet filename suffix.

V1 cleanup -- useSeriesExport.ts: Removed || options.layout === SERIES_EXPORT_LAYOUTS.BOOKLET
workaround. Dispatch now matches on format alone.

Files changed: SeriesExportModal.tsx, useSeriesExport.ts, buildSeriesPdf.ts

### Export Hardening (commit a990e65)
Four carry-forward hardening items addressed in a single commit.

1. bkContent() -- blockquote prefix (^>) stripped before rendering;
   _italic_ markers stripped in catch-all line alongside **bold**

2. SeriesExportModal.tsx -- advisory notice displayed when series has 10+
   lessons. Amber banner, informational only. Download button fully enabled.
   User is never blocked.

3. sanitizeForPdf() -- added replacements for arrows (-> <-), math symbols
   (x / +/- ~ != <= >=), and common fractions (1/2 1/4 3/4) before the
   final [^\x00-\x7F] catch-all.

4. renderBodyText() -- orphan prevention: paragraphs wrapping to 2+ lines
   where fewer than 2 lines fit on the current page are pushed to the next
   page rather than splitting mid-sentence.

Files changed: buildSeriesPdf.ts, SeriesExportModal.tsx

### Outstanding items
None. All known violations and hardening items resolved.
## Session -- March 10, 2026 (Late Afternoon -- Subscription Risk Remediation)

### Priority 1 Resolved -- John Eckeberger Stripe subscription ID
stripe_subscription_id updated from placeholder to sub_1T4RffI4GLksxBfVCoOhq1OX
via Supabase SQL Editor. Verified with SELECT query. No code change required.

### Priority 2A -- Webhook failure alerting
Stripe Dashboard alert notifications enabled for failed webhook deliveries.
No code change. Email alert fires when endpoint fails repeatedly.

### Priority 2B -- Cancellation handler lessons_used bug (commit 16e331d)
Root cause: handleSubscriptionCanceled set tier=free and lessons_limit to
free-tier value but did not reset lessons_used. A subscriber who used 15 of
20 paid lessons then canceled was immediately blocked from the free tier
because lessons_used (15) exceeded the new lessons_limit (5).
Fix: Added lessons_used: 0 to the personal subscription cancellation update.
Edge Function redeployed: npx supabase functions deploy stripe-webhook.

### Bug History Addition
Bug #26: Cancellation handler did not reset lessons_used. Canceled
subscribers were blocked from free-tier lesson generation immediately
after cancellation. Fixed March 10, 2026 (commit 16e331d).

### Priority 3, Item 1 -- Teaching Team Invitation Expiry (commit 288f61b)

Root cause: teaching_team_members had no expires_at column. Pending
invitations with wrong addresses occupied member slots permanently.

DB fix: ALTER TABLE teaching_team_members ADD COLUMN expires_at TIMESTAMPTZ;
Backfilled existing pending rows to invited_at + 30 days.

contracts.ts: Added MAX_TEAM_MEMBERS = 3 and INVITATION_EXPIRY_DAYS = 30
as SSOT exports. Added expires_at: string | null to TeachingTeamMember.
Removed pre-existing local const MAX_TEAM_MEMBERS = 3 from hook (SSOT
violation fixed as part of this work).

useTeachingTeam.tsx: Added isInviteExpired() helper. Fixed 4 locations:
(1) fetchTeamData() -- expired pending invite no longer shows banner
(2) fetchMembers() -- expired pending invites excluded from member list
(3) inviteMember() capacity check -- expired pending invites free the slot
(4) inviteMember() existing membership check -- expired invite allows re-invite
(5) inviteMember() insert -- sets expires_at = now + INVITATION_EXPIRY_DAYS

---

## SESSION LOG: March 10, 2026 (Afternoon) -- Vulnerability Remediation

### Summary
Full platform vulnerability sweep covering financial integrity, subscription lifecycle, team management, platform mode, org checkout, and export polish. All 10 items resolved. No deploy required for SQL fixes; 4 code commits.

### P1 -- John Eckeberger Stripe Subscription ID [CLOSED -- SQL]
- stripe_subscription_id was 'sub_placeholder_needs_real_id' since the Feb 26 manual fix
- Fix: SQL UPDATE set stripe_subscription_id = 'sub_1T4RffI4GLksxBfVCoOhq1OX'
- Verified: tier = personal, status = active, billing_interval = year

### P2A -- Webhook Failure Alerting [CLOSED -- no code]
- Stripe Dashboard -> Developers -> Webhooks -> BLS endpoint -> Alert notifications -> enabled email alerts

### P2B -- Cancellation Handler lessons_used Bug [CLOSED -- commit 16e331d]
- Root cause: handleSubscriptionCanceled reset tier and lessons_limit but not lessons_used
- Fix: added `lessons_used: 0` to personal subscription cancellation update in stripe-webhook/index.ts
- Deployed via: `npx supabase functions deploy stripe-webhook`

### P3A -- Teaching Team Invitation Expiry [CLOSED -- commit 288f61b]
- teaching_team_members had no expires_at column; pending invitations with wrong addresses occupied slots permanently
- DB migration: `ALTER TABLE teaching_team_members ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ`
- contracts.ts: added MAX_TEAM_MEMBERS = 3, INVITATION_EXPIRY_DAYS = 30, expires_at to TeachingTeamMember interface
- useTeachingTeam.tsx: isInviteExpired() helper; expired invites excluded from member list, capacity check, and re-invite block; new invites set expires_at = now() + 30 days

### P3B -- Free-Tier Lesson Counter [CLOSED -- already built]
- UsageDisplay.tsx already shows split counter ("X of 3 full and X of 2 short lessons remaining") with color-coded progress bars. No work needed.

### P4A -- platform_mode Set to Production [CLOSED -- SQL]
- system_settings table had a row with value 'private_beta' -- never updated after Feb 28 launch
- Result: beta UI showing to all 41 users; doesTrialApply() returning false; production copy not displaying
- Fix: `UPDATE system_settings SET value = 'production', updated_at = now() WHERE key = 'current_phase'`
- Takes effect on next page load for all users -- no deploy required

### P4B -- OrgSetup Personal Tier Check Bug [CLOSED -- commit cd77c19]
- OrgSetup line 130: `subscription?.tier === 'subscribed'` -- 'subscribed' is not a valid SubscriptionTier value
- Every org customer with an active Personal Plan would be incorrectly billed for a second personal subscription
- Fix: changed to `subscription?.tier === 'personal'`

### P5A -- Booklet Blank Pages [CLOSED -- not a real bug]
- Reviewed live export output -- no blank pages, no unlabeled pages. Not reproducible.

### P5B -- DOCX Bold Parsing Edge Cases [CLOSED -- commit c885bd1]
- parseInlineBold in buildSeriesDocx.ts failed on unclosed bold (`**Word` with no closing) and single-asterisk italic (`*text*`)
- Fix: sanitize pass strips lone single asterisks before splitting; plain-text run strips residual `**` markers; fallback strips all asterisks

### P5C -- PDF Widow Prevention [CLOSED -- commit 0e559f2]
- renderBodyText in buildSeriesPdf.ts rendered line-by-line with no widow check
- Fix: before rendering a multi-line paragraph, check if fewer than 2 lines fit on remaining page; if so, advance page first

### Deployment Commits (March 10, 2026 Afternoon)
- `16e331d` -- FIX: Reset lessons_used to 0 on personal subscription cancellation
- `288f61b` -- FIX: Teaching team invitation expiry (30 days) - ASCII clean
- `cd77c19` -- FIX: Correct personal subscription tier check in OrgSetup
- `c885bd1` -- FIX: DOCX bold parsing - strip lone asterisks and unclosed bold markers
- `0e559f2` -- FIX: PDF widow prevention in renderBodyText

### White Label Note
`system_settings` has no `tenant_id` column. When White Label is built, add the column, migrate existing rows to a BLS tenant ID, and filter `useSystemSettings` by tenant. This is a known future migration -- not urgent now.

### Bug History Additions
26. **lessons_used not reset on subscription cancellation** -- handleSubscriptionCanceled set tier=free and lessons_limit=5 but did not reset lessons_used. A subscriber who used 15/20 lessons then canceled was immediately blocked. Fix: added `lessons_used: 0` to cancellation update. Commit 16e331d. March 10, 2026.
27. **OrgSetup personal subscription check used wrong tier value** -- checked `tier === 'subscribed'` which is not a valid SubscriptionTier. Every org customer with an active Personal Plan was incorrectly billed for a second personal subscription. Fix: changed to `=== 'personal'`. Commit cd77c19. March 10, 2026.
28. **platform_mode defaulted to private_beta post-launch** -- system_settings row value was never updated from private_beta to production after February 28 launch. Beta UI showing to all users; doesTrialApply() returning false. Fix: SQL UPDATE. No deploy required. March 10, 2026.
29. **Print button diagnosed in wrong file** -- EnhanceLessonForm.tsx toolbar shows Print button. Claude incorrectly targeted LessonExportButtons.tsx first, wasting a session. Print still present in EnhanceLessonForm.tsx, DevotionalLibrary.tsx, DevotionalGenerator.tsx, and BookletPrintModal.tsx as of March 11, 2026. Fix approved but not yet deployed.
30. **Booklet layout silently ignored user DOCX selection** -- handleExport() at SeriesExportModal.tsx line 110 unconditionally forced format to 'booklet_pdf' regardless of user's file format choice. Fixed by disabling DOCX option in UI when Booklet is selected. March 12, 2026.
31. **WorkspaceSettingsPanel.tsx was dead code targeting nonexistent table** -- Component was never imported or rendered anywhere. Its migration file incorrectly targeted `workspace_settings` (which does not exist); the actual column `include_student_handouts` is on the `profiles` table. Both the component (497 lines) and the incorrect migration file were deleted March 20, 2026. No users affected.
32. **Feedback form appeared after every lesson generation** -- No frequency cap existed; the form triggered on every lesson. Fixed March 20, 2026: form now shows every 5th lesson generated (tracked via localStorage). After submission, counter resets to 0 for first-timers, requires 10 more lessons for returning submitters. After dismiss without submitting, asks again after 2 more lessons. Manual Feedback button unaffected.
33. **EnhanceLessonForm Print button silently removed during SSOT audit** -- The Print button (handlePrint + Printer icon) was removed from EnhanceLessonForm.tsx during the March 20, 2026 SSOT audit session but was not separately tracked as a print removal. Discovered clean on March 22 during planned print removal task. BookletPrintModal.tsx (305 lines) confirmed orphaned -- never imported by any file -- and deleted March 22, 2026.
34. **PricingPage conditional layout caused sidebar flash** -- PricingPage had a `PageWrapper` that switched between AppShell (authenticated) and Header/Footer (public) based on `useAuth().user`. During auth resolution, `user` was briefly null, causing Header/Footer to flash before switching to AppShell. Fix: PricingPage now always uses AppShell; route wrapped in ProtectedRoute in App.tsx. March 25, 2026.
35. **Sidebar tab items did not navigate from non-dashboard pages** -- Tab items (Build Lesson, Lesson Library, etc.) used `onTabChange` prop callback, which only worked on Dashboard. Clicking from any other page did nothing. Fix: AppShell now navigates to /dashboard with `location.state: { tab: tabValue }`. Dashboard reads tab from location.state on mount and via useEffect. March 25, 2026.
36. **UserProfileModal only worked on Dashboard** -- AppShell accepted `onOpenProfile` as an optional prop, but only Dashboard passed it. Profile sidebar click was silently swallowed on all other pages. Fix: AppShell now owns the UserProfileModal state internally. No prop required from any page. March 25, 2026.

### SSOT Violations Identified This Afternoon -- Carry Forward to Next Session
1. `SERIES_EXPORT_FORMATS.BOOKLET = 'booklet_pdf'` is dead code. Modal sends `format: 'pdf'` with `layout: 'booklet'`. useSeriesExport.ts works around with `|| options.layout === SERIES_EXPORT_LAYOUTS.BOOKLET`. Fix: modal must set `format: SERIES_EXPORT_FORMATS.BOOKLET`; dispatch should check format only.
2. `doc.line()` calls in buildBookletPdf still use `BK_W - BK_M` for right end of horizontal rules instead of `BK_W - BK_OUTER`. Lines extend 10.8pt too far right.
3. `buildSeriesExportFilename()` is bypassed for booklet exports -- downloaded file has no `_Booklet` suffix. Resolves automatically when violation 1 is fixed.

---

## SESSION LOG: March 10, 2026 (Evening) -- Open-Source Fonts + Modal Fixes

### Commits
- `442da51` -- FEATURE: Embed open-source fonts in PDF export -- Pagella, EBGaramond, Century Schoolbook, Carlito all render distinctly
- `6a53654` -- FIX: SeriesExportModal -- wire SeriesExportProgress component, remove dead Crimson Text Google Fonts load

### Open-Source Font Embedding (Series Export PDF)

All five Series Export font choices now render distinctly in PDF output. Previously, four of five fonts mapped to jsPDF built-in Times-Roman, making font selection meaningful only in DOCX.

**Root causes fixed:**
1. `pdfFamily` values for pagella, garamond, crimson, calibri all mapped to 'times' or 'helvetica' -- no distinct rendering
2. Line 150 bug in `buildSeriesPdf.ts`: `renderBodyText` used `EXPORT_SPACING.fonts.pdf` (hardcoded 'helvetica') instead of user-selected `pdfFont`

**Files changed:**
- `src/constants/seriesExportConfig.ts` -- Added `PdfFontFiles` interface and `pdfFontFiles` property to `FontOption`; updated `pdfFamily` for 4 fonts to registered names; renamed crimson slot label to Century Schoolbook
- `src/utils/export/loadPdfFonts.ts` -- NEW: fetches TTF files from /fonts/, registers all 4 variants with jsPDF; no-op for built-in fonts
- `src/utils/export/buildSeriesPdf.ts` -- Line 150 bug fixed; `loadPdfFonts` called in both `buildSeriesPdf()` and `buildBookletPdf()`
- `public/fonts/` -- NEW: 16 TTF files (4 variants x 4 fonts): Pagella, EBGaramond, CrimsonPro (Century Schoolbook), Carlito

**Font sources (all open-source, license-safe):**
- TeX Gyre Pagella -- GUST Font License (Palatino substitute)
- EB Garamond -- OFL (converted from OTF; no BoldItalic in package -- Bold used as substitute)
- CrimsonPro slot -- URW C059 Century Schoolbook -- AFPL/GPL (all 4 variants clean)
- Carlito -- Apache 2.0 (Calibri-compatible)
- Times New Roman slot -- jsPDF built-in, no TTF needed

**SSOT compliance:** `seriesExportConfig.ts` is sole authority for all font metadata. `buildSeriesDocx.ts` untouched -- already correct.

**Deployment note:** 16 TTF files committed to git and served from `public/fonts/`. No CDN dependency. `loadPdfFonts.ts` fetches at export time -- parallel fetch, no impact on page load.

### SeriesExportModal Fixes

1. **SeriesExportProgress not rendering** -- Line 231 used bare `<p>` tag instead of `<SeriesExportProgress currentStepId={state.progressStepId} />`. Fixed.
2. **Dead Google Fonts load** -- Crimson Text still loading from Google Fonts after font slot was renamed to Century Schoolbook (system font). Removed. EB Garamond still loads from Google Fonts for preview panel only.
3. **audience_profile on LessonSeries** -- Investigated; `LessonSeries` type has no `audience_profile` field. Export pipeline correctly falls back to `resolveExportTerminology()` defaults. No change needed.

### Workflow Notes

- **Stale file in Downloads pattern:** `Copy-Item` and `[System.IO.File]::WriteAllText` both silently write the wrong version when a stale file with the same name exists in Downloads. Reliable fix: generate a Node `.cjs` script with the correct file content embedded via `JSON.stringify`, write via `fs.writeFileSync`. This is the proven method for ASCII-sensitive file writes.
- **ASCII guard and em-dashes in existing repo files:** The deploy guard correctly blocks pre-existing non-ASCII in a file being staged. The em-dashes in the previous `SeriesExportModal.tsx` (commit `a990e65`) were never remediated. They are now gone -- the new file is ASCII-clean.

### What Is NOT Yet Done

- Font and color palette choices for Build Lesson (single-lesson export) -- next session task
- `exportToPdf.ts` and `exportToDocx.ts` not yet wired to `loadPdfFonts` or color scheme picker
- Single-lesson export modal has no font/color picker UI
- PROJECT_MASTER.md WHAT'S NEXT update needed

### WHAT'S NEXT

**Phase A -- COMPLETE (March 23-24, 2026)**
**Phase B -- COMPLETE (March 25, 2026)**

**Current priority: Phase C -- Library and Content Management Improvements**

1. Retroactive series assignment -- add any existing lesson to any existing series after generation
2. Series lesson reordering -- position lessons within a series before publishing
3. Reshape history in Lesson Library -- every reshape recorded, searchable, viewable, exportable
4. Consistent toolbar everywhere -- Copy, Download, Email on lessons, devotionals, and series

**Carry-forward items (lower priority):**

5. **3 SSOT violations carry-forward (from March 10 afternoon):**
   - SERIES_EXPORT_FORMATS.BOOKLET = 'booklet_pdf' is dead code -- modal sends format: 'pdf' with layout: 'booklet'
   - doc.line() calls in buildBookletPdf use BK_W - BK_M instead of BK_W - BK_OUTER (lines 10.8pt too far right)
   - buildSeriesExportFilename() bypassed for booklet exports (resolves when violation 1 is fixed)

6. **Org landing page visual polish** -- No hero image or visual element above the fold. Mobile tier card experience creates long scroll on small screens (5 cards in single column).

7. **Admin UI feature flag toggles** -- Deferred post-launch
8. **Frontend org creation / upgrade paths** -- Deferred
9. **Multi-tenant migration** -- Phases 1-5 per MULTI_TENANT_MIGRATION_PLAN.md, not started

**Resolved in Phase A (no longer carry-forward):**
- ~~OrgSetup.tsx stale tier names~~ -- audited and fixed
- ~~pricingConfig.ts STRIPE_ORG vs orgPricingConfig.ts~~ -- STRIPE_ORG removed; orgPricingConfig.ts is sole authority
- ~~Booklet economical printing~~ -- completed
- ~~include_student_handouts column rename~~ -- 46th migration applied

---

## SESSION LOG: March 6, 2026 -- AudienceConfig System + SSOT Audit

### AudienceConfig System -- Phases 1-6 COMPLETE (commit f3966f6)

Full AudienceConfig pipeline implemented end-to-end:
- Role filter dropdowns added to Lesson Library and Series Library
- resolveExportTerminology() added to seriesExportConfig.ts as sole resolver for all participant-facing labels
- Both buildSeriesPdf.ts and buildSeriesDocx.ts call this helper
- Workflow Rule #18 established: never hardcode "Student", "Member", or "Attendee"
- Series-level exports always use "Group Handout" -- never a participant term

### SSOT Audit -- 8 violations fixed across 7 files (commit f3966f6)

Post-launch audit identified and resolved 8 SSOT violations in a single commit.

### Admin Panel Confirmed Working

- Feature Adoption view: live and confirmed
- Email column: confirmed
- Subscription Tier column: confirmed
- Pagination: 41 users displaying correctly

### Free-Tier Split Usage Counter

UsageDisplay.tsx shows split counter: "X of 3 full and X of 2 short lessons remaining" with color-coded progress bars. Confirmed working.

### FK Cascade Safety

14 foreign key constraints using NO ACTION converted to CASCADE or SET NULL. Prevents silent orphan data and failed deletes.

### Workflow Rules Added This Session

- Rule #18: AudienceConfig -- never hardcode participant strings
- Rule #19: Corrupted files -- restore from git before patching

---

## SESSION LOG: March 11, 2026 -- CLAUDE.md + Workflow Governance

### Claude Code Workflow Established

- Correct workflow confirmed: Claude.ai for planning, Claude Code for implementation
- CLAUDE.md created as the bridge document Claude Code reads at session start
- Priming protocol: every Claude Code session begins by reading CLAUDE.md and PROJECT_MASTER.md

### CLAUDE.md Created and Committed

CLAUDE.md placed in project root. Contains: full architecture principles, SSOT file map (13 authoritative files), deleted files list, file-writing rules (no BOM, WriteAllText, .cjs scripts), ASCII guard rules, all 19 workflow rules with Claude Code mechanism notes, debugging protocol, Series Export feature state, corrected 8-section names from pricingConfig.ts SSOT, free tier precise definition (3 full + 2 short, rolling 30-day), lesson packs (Small $15 / Medium $35 / Large $60), subscription tier limits.

Committed: DOCS: Add CLAUDE.md -- Claude Code architecture and workflow rules

### All 19 Workflow Rules Recovered and Documented

Rules 18 and 19 added to both CLAUDE.md and PROJECT_MASTER.md. Rule #3 annotated as known SSOT violation: App.tsx manually re-declares routes instead of importing from routes.ts. Future refactor task documented.

### Print Button Removal -- Plan Approved, NOT YET DEPLOYED

Goal: Remove all Print-to-browser choices from BLS UI.

Locations requiring action:
- DevotionalLibrary.tsx: two Print buttons (~lines 274-275 and ~329-331)
- DevotionalGenerator.tsx: one Print button (~line 601-603)
- BookletPrintModal.tsx: entire modal is print-focused -- confirm caller before deleting
- EnhanceLessonForm.tsx: Print button in toolbar (handlePrint / window.open)

Already clean: LessonExportButtons.tsx (Print removed in prior session)

Plan approved. NOT deployed. Carry to next session.

### Booklet Format -- Economical Printing Review (Not Implemented)

Reviewed ChatGPT recommendation for frugal volunteer teacher home printing. Recommended: body font 10.5pt -> 10pt, line spacing 15pt -> 1.10-1.15x, margins top 0.60" / bottom 0.65" / inner 0.70" / outer 0.65". Do NOT adopt 5.5x8.5 landscape fold (requires long-reach stapler, confuses volunteers). Color restraint already correct in BLS. Not yet implemented.

### deploy.ps1 AUTO-CLEANUP Block (added March 10 afternoon)

Block appended to deploy.ps1 that automatically removes stale Downloads files on every deploy. Patterns cleaned: *_live.*, *_original.*, *.cjs, fix_*.ps1. Runs on every deploy -- no reliance on memory.

### PROJECT_MASTER.md Update

Header date corrected to March 11, 2026. Rules 18-19 added. Bug 29 added. CLAUDE.md added to companion documents. WHAT'S NEXT updated. March 6 and March 11 session logs appended.

---

## SESSION LOG: March 12, 2026 -- Print Button Removal + Booklet PDF-Only Enforcement

1. Print buttons removed from DevotionalGenerator.tsx and DevotionalLibrary.tsx -- handlePrint function and Printer icon import removed from both files. Build clean. Deployed.

2. EnhanceLessonForm.tsx Print button -- still present in lesson toolbar. Separate task, not yet addressed.

3. Booklet layout now enforces PDF-only in SeriesExportModal.tsx -- Word Document radio is disabled with "PDF only for this layout" label when Booklet is selected. Matches Tri-Fold behavior. Unconditional format override at line 110-112 replaced with selectedFormat. Build clean. Deployed. Verified live.

---

## SESSION LOG: March 17, 2026 -- Org Page Repositioning + Help Page Updates

### Org Landing Page Repositioned as Ministry Leadership Entry Point

Complete rewrite of `src/pages/OrgLanding.tsx` to reposition the organization page from a SaaS product page to a ministry leadership entry point. Three commits deployed:

**Commit 22e6a06 -- FEATURE: Reposition org page as ministry leadership entry point**

All 10 requested changes implemented:
1. Hero section rewritten -- headline: "Shepherd Your Teaching Ministry with Clarity and Confidence"
2. Bridge statement added below hero -- "Faithful teaching doesn't happen by accident."
3. Value cards rewritten with ministry-focused body copy (Shared Lesson Pool, Shared Focus, Shepherd Oversight)
4. Positioning statement added -- "BibleLessonSpark does not replace your teachers. It strengthens them."
5. Tier section heading updated -- "Choose the Level of Support for Your Teaching Ministry"
6. Tier names updated in orgPricingConfig.ts SSOT (see below)
7. How It Works section added -- 5 numbered steps with scroll anchor
8. Differentiator line added -- "Traditional curriculum is written for a general audience months in advance."
9. Bottom trust line added -- "Designed for churches who want to teach faithfully."
10. All CTAs updated to ministry language -- "Start Shepherding Your Teaching Ministry"

**Commit c552d80 -- FIX: Second-pass refinement**

- Existing-org banner CTA changed from "Go to Org Manager" to "Go to Your Ministry Dashboard"
- Bridge statement spacing increased from py-8 to py-10 sm:py-12 for breathing room
- Personal subscription heading changed from "A Note About Personal Subscriptions" to "Your Own Preparation Matters Too"
- Personal subscription body tightened -- removed billing logistics language
- Bottom CTA supporting text changed from "Set up your organization in minutes" to "Gather your teachers. Set the direction. Begin preparing together."
- Removed unused imports (useSearchParams, Shield, BookOpen)
- Fixed redundant ternary on tier card CTA

### Shepherd Tier Names Updated (orgPricingConfig.ts SSOT)

Tier display names and blurbs updated in `src/constants/orgPricingConfig.ts`:

| Old displayName | New displayName | New bestFor |
|---|---|---|
| Single Staff | Foundation | For a small team beginning to align their teaching. |
| Starter | Strengthening | For ministries growing in consistency and clarity. |
| Growth | Multiplication | For ministries actively strengthening and multiplying discipleship. |
| Develop | Expansion | For larger ministries coordinating multiple classes and leaders. |
| Expansion | Network | For churches and organizations serving broad teaching networks. |

Tier keys (org_single_staff, org_starter, etc.), Stripe IDs, prices, and lesson limits are untouched. Most Popular badge remains on org_growth (now Multiplication). OrgLanding.tsx and OrgSetup.tsx both import display names from this SSOT file.

**NOTE:** Pre-existing SSOT tension: `pricingConfig.ts` has a STRIPE_ORG block with 4 org tiers (starter/growth/full/enterprise) while `orgPricingConfig.ts` has 5 tiers with different tier keys. The Stripe IDs partially overlap. This does not affect UI display names but should be unified in a future cleanup.

### Help Page Updated (commit 15addb2)

**Commit 15addb2 -- FIX: Update Help page Bible translations list and Shepherd tier names**

Two corrections in `src/pages/Help.tsx`:

1. Bible translations FAQ updated from "KJV, NIV, ESV, NASB, NLT, and CSB" to all 9 supported versions: "KJV, WEB, NKJV, NASB, ESV, NIV, CSB, NLT, and AMP"

2. Shepherd tier names FAQ updated from "Single Staff, Starter, Growth, Develop, and Expansion" to "Foundation, Strengthening, Multiplication, Expansion, and Network"

### Files Modified This Session

| File | Change |
|---|---|
| src/constants/orgPricingConfig.ts | Tier displayName and bestFor updates (SSOT) |
| src/pages/OrgLanding.tsx | Complete rewrite -- ministry leadership positioning |
| src/pages/Help.tsx | Bible translations list + tier names corrected |

### What Is NOT Yet Done

- OrgSetup.tsx has not been audited for stale hardcoded references to old tier names (it imports from orgPricingConfig.ts so display names are correct, but any inline copy referencing "Single Staff" or "Growth" by name should be checked)
- pricingConfig.ts STRIPE_ORG block and orgPricingConfig.ts tier key unification -- pre-existing tension, not introduced this session
- No hero image or visual element on the org landing page above the fold
- Mobile tier card experience -- 5 cards in single column creates long scroll on small screens
---

## SESSION LOG: March 20, 2026 -- Full SSOT Audit + Migration History Reconciliation

### Overview

Started with a button label overflow. Ended with a full architectural restoration of SSOT compliance, terminology consistency, dead code removal, and Supabase migration history reconciliation. 19 SSOT violations found and resolved. 45 Supabase migrations reconciled to zero drift.

---

### Fix 1: Org Pricing Button Label Overflow

**Problem:** Button label "Shepherd My Teaching Ministry" overflowed its boundary on all 5 pricing tier cards on `/org` page. Most visible on the "Multiplication" (Most Popular) highlighted card.

**Fix:** Changed to "Shepherd My Teachers" -- shorter, imperative, theologically apt (shepherding people, not a concept).

**File:** `src/pages/OrgLanding.tsx` -- single `.map()` loop drives all 5 cards; one edit updated all 5.

**Deploy:** `FIX: Shorten org pricing button label to prevent overflow`

---

### Fix 2: Feedback Form Frequency Cap + Branding Correction

**Problem 1:** Feedback form appeared after every lesson generation -- disruptive to teacher workflow.

**Fix:** Frequency cap via localStorage counter. Shows every 5th lesson generated. After submit: resets to 0 (first-timers) or requires 10 more (returning submitters). After dismiss: asks again after 2 more lessons. Manual Feedback button always works without cap.

**Problem 2:** Feedback form Ease of Use question said "LessonSparkUSA" instead of "BibleLessonSpark."

**Fix:** The question text lives in the `feedback_questions` database table (loaded dynamically at runtime). Updated via Admin Panel  Beta Feedback Questions manager. No code deploy needed -- live immediately.

**Deploy:** `FIX: Feedback form frequency cap (every 5th lesson) + branding correction`

---

### Fix 3: Full SSOT & Frontend-Drives-Backend Audit (19 Violations)

**Audit method:** Custom Claude Code task launched 4 parallel agents across all source areas. Findings saved to `SSOT_AUDIT_REPORT.md` in project root. No code changes during audit phase.

**Slash command added to CLAUDE.md:** `/audit-ssot` -- run at start of any session touching constants, configs, pricing, tier names, routes, or backend functions. Read-only diagnostic, saves report to `SSOT_AUDIT_REPORT.md`.

**All 19 violations resolved across 4 deploys:**

| # | Severity | Issue | Resolution |
|---|----------|-------|------------|
| 1 | Critical | Backend SECTION_NAMES out of sync | Synced backend mirror to frontend SSOT |
| 2 | Critical | Backend PLAN_FEATURES out of sync | Synced backend mirror to frontend SSOT |
| 3 | Critical | org-stripe-webhook queries org_tier_config | Replaced with TIER_LESSON_LIMITS from pricingConfig.ts SSOT |
| 4 | Critical | create-org-checkout-session queries pricing_plans | Replaced with STRIPE_INDIVIDUAL.personal.prices from SSOT |
| 5 | Critical | create-org-checkout-session queries org_tier_config | Replaced with STRIPE_ORG[tier].prices from SSOT |
| 6 | Critical | EnhanceLessonForm dead tier === 'admin' check | Changed to tier !== 'free' -- now covers all paid tiers |
| 7 | High | UPGRADE_PROMPTS "Student Handout" inconsistency | Resolved in project-wide rename (see Fix 4) |
| 8 | High | pricingConfig.ts stale comment | Resolved in project-wide rename |
| 9 | High | lessonStructure.ts hardcoded "Student Handout" | Resolved in project-wide rename |
| 10 | High | Hardcoded Stripe price IDs in checkout | Resolved in Critical #4 fix |
| 11 | High | App.tsx routes not using ROUTES constants | All 25 hardcoded paths replaced with ROUTES.* constants |
| 12 | Medium | Hardcoded route paths in 15+ components | All replaced with ROUTES constants |
| 13 | Medium | Hardcoded fallback lesson limits (useSubscription) | Replaced with TIER_LESSON_LIMITS.free from SSOT |
| 14 | Medium | Hardcoded fallback lesson limits (useRateLimit) | Replaced with TIER_LESSON_LIMITS.free from SSOT |
| 15 | Medium | "Student Handout" in multiple config files | Resolved in project-wide rename |
| 16 | Low | Help.tsx "Student Handout" | Resolved in project-wide rename |
| 17 | Low | Docs.tsx "Student Handout" | Resolved in project-wide rename |
| 18 | Low | Training.tsx "Student Handout" | Resolved in project-wide rename |
| 19 | Low | "Student Teaser" hardcoded label in EnhanceLessonForm | Renamed to "Group Teaser" |

**Deploy sequence:**
- `FIX: Replace Student Handout with Group Handout project-wide (safe instances only)`
- `FIX: Remove banned DB table queries in org webhook and checkout; fix dead admin tier check`
- `FIX: Replace hardcoded route paths in App.tsx with ROUTES constants (SSOT High #11)`
- `FIX: Replace hardcoded fallback limits and route paths; fix Student Teaser label (SSOT Medium/Low #12-14, #19)`

---

### Fix 4: Project-Wide "Student Handout"  "Group Handout" Rename

**Reason:** "Group Handout" is more accurate for a variety of ministry group settings (not just student/classroom contexts).

**Scope:** 87 replacements across 31 files.

**Safe renames (executed):**
- All display strings, section names, config labels, comments, documentation (~45 active file instances)
- Variable renames: STUDENT_HANDOUT_HEADING_REGEX  GROUP_HANDOUT_HEADING_REGEX, STUDENT_HANDOUT_STANDALONE_TITLE  GROUP_HANDOUT_STANDALONE_TITLE, STUDENT_HANDOUT_SECTION_NUMBER  GROUP_HANDOUT_SECTION_NUMBER
- BOOKLET_LABELS.studentHandout  BOOKLET_LABELS.groupHandout
- i18n keys updated in English, Spanish, and French

**Preserved untouched (functional identifiers):**
- `key: "student_handout"` in LESSON_SECTIONS -- drives content extraction; all existing lessons in database contain this text
- `featureFlag: "student_handout"` -- internal flag name
- `include_student_handouts` database column and all code references -- no migration created (column is on profiles table; referenced only by dead WorkspaceSettingsPanel which was subsequently deleted)
- `extractSection(lesson, 'student_handout')` call
- All backup/historical files

**Regex updated:** GROUP_HANDOUT_HEADING_REGEX now matches both "Student Handout" AND "Group Handout" so all previously generated lessons continue to export correctly.

**SSOT verified:** `src/constants/pricingConfig.ts` and `supabase/functions/_shared/pricingConfig.ts` match exactly on all 4 Group Handout references.

---

### Fix 5: Dead Code Removal -- WorkspaceSettingsPanel.tsx

**Finding:** WorkspaceSettingsPanel.tsx was never imported or rendered by any page or route. It referenced a `workspace_settings` table that does not exist in the live database. The column it managed (`include_student_handouts`) is actually on the `profiles` table. A migration file had been created targeting the wrong table.

**Action:**
- Deleted `src/components/workspace/WorkspaceSettingsPanel.tsx` (497 lines)
- Deleted `supabase/migrations/20260320_rename_include_student_handouts.sql` (incorrect migration)
- Removed 3 `include_group_handouts` type definitions from `src/integrations/supabase/types.ts`

**Note:** The `include_student_handouts` column may still exist on the live `profiles` table (cosmetic legacy). It is unreferenced by any active code. Low-priority rename via proper Supabase migration when convenient.

**Deploy:** `CLEANUP: Remove dead WorkspaceSettingsPanel and wrong migration file`

---

### Fix 6: Supabase Migration History Reconciliation

**Problem:** `npx supabase db push --linked` was failing because 7 migrations existed on the remote database with no matching local files (applied via Dashboard SQL editor), and 8 local migration files were not registered in the remote migration history. Total drift: 15 mismatched entries.

**Verification:** Confirmed all 8 local-only migrations were already fully applied to the live database schema via `information_schema` queries. The drift was purely in the `supabase_migrations.schema_migrations` tracking table, not in the actual schema.

**Repair:**
- Created 7 placeholder `.sql` files for remote-only migrations (Dashboard-applied, named `{timestamp}_dashboard_applied.sql`)
- Ran `npx supabase migration repair --status applied` for all 8 local-only migrations

**Result:** 45 total migrations now in perfect sync. Zero drift. `npx supabase db push --linked` is fully operational for future use.

**Deploy:** `FIX: Repair Supabase migration history drift (tracking only, no schema changes)`

---

### Files Modified This Session

| File | Change |
|---|---|
| src/pages/OrgLanding.tsx | Button label: "Shepherd My Teaching Ministry"  "Shepherd My Teachers" |
| src/pages/OrgLanding.tsx (via FeedbackModal) | Feedback frequency cap logic |
| 31 active source files | "Student Handout"  "Group Handout" (87 replacements) |
| src/components/workspace/WorkspaceSettingsPanel.tsx | DELETED (497 lines dead code) |
| supabase/migrations/20260320_rename_*.sql | DELETED (wrong table target) |
| src/integrations/supabase/types.ts | Removed 3 include_group_handouts type definitions |
| supabase/functions/org-stripe-webhook/index.ts | Replaced banned DB table queries with SSOT constants |
| supabase/functions/create-org-checkout-session/index.ts | Replaced banned DB table queries with SSOT constants |
| src/pages/EnhanceLessonForm.tsx | Fixed dead tier === 'admin' check; renamed "Student Teaser"  "Group Teaser" |
| src/App.tsx | All 25 hardcoded route paths replaced with ROUTES.* constants |
| src/constants/pricingConfig.ts + _shared mirror | Section names and plan features synced |
| src/hooks/useSubscription.tsx | Fallback lesson limit  TIER_LESSON_LIMITS.free |
| src/hooks/useRateLimit.ts | Fallback lesson limit  TIER_LESSON_LIMITS.free |
| 15+ component files | Hardcoded route paths  ROUTES constants |
| supabase/migrations/ | 7 placeholder files added for dashboard-applied migrations |
| CLAUDE.md | /audit-ssot slash command added; Rules 20-21 added |
| SSOT_AUDIT_REPORT.md | NEW -- full audit findings saved to project root |

### Architecture Notes Added This Session

- **Rule #20:** Supabase migration CLI is now operational. Use `npx supabase db push --linked` for all future migrations. Never apply migrations manually via Dashboard SQL editor.
- **Rule #21:** Run `/audit-ssot` at the start of any session touching constants, configs, pricing, tier names, routes, or backend functions.
- **App.tsx route SSOT violation (Rule #3) -- RESOLVED.** All 25 hardcoded route paths now use ROUTES.* constants. The known bug pattern (missing routes in App.tsx) is now protected at the source.

---

## SESSION LOG: March 22, 2026 -- Export Polish + Print Removal Complete

### Commit 719783c -- Three Targeted Fixes

**Fix 1: Century Schoolbook font label correction (seriesExportConfig.ts)**

The crimson font slot in `SERIES_EXPORT_FONT_OPTIONS` still displayed "Crimson Pro" as its label, cssFamily, and docxName despite the underlying TTF files being URW C059 Century Schoolbook (swapped March 10). The March 10 session log noted the rename but it had reverted or never landed in the SSOT.

- `label`: 'Crimson Pro' -> 'Century Schoolbook'
- `cssFamily`: '"Crimson Pro", "Crimson Text", Georgia, serif' -> '"Century Schoolbook", "C059", Georgia, serif'
- `docxName`: 'Crimson Pro' -> 'Century Schoolbook'
- `id` ('crimson') and `pdfFamily` ('CrimsonPro') unchanged -- internal identifiers tied to TTF filenames
- Stale comment in SeriesExportModal.tsx ("EB Garamond and Crimson Text are on Google Fonts") updated to reflect only EB Garamond is loaded

Both SeriesExportModal.tsx and LessonExportModal.tsx render `f.label` from the SSOT array, so the single SSOT edit fixed both modals.

**Fix 2: Stale beta program copy (Index.tsx line 89)**

"Request Early Access" dialog description said "Join our private beta program for Baptist teachers and church leaders." Platform launched February 28 and has been in production mode since March 10.

Changed to: "Join BibleLessonSpark and start creating lessons for your church."

BetaHubModal.tsx "Private Beta Hub" title is conditional on `isBetaMode()` and architecturally correct -- not touched.

**Fix 3: Live preview thumbnail added to LessonExportModal.tsx**

LessonExportModal.tsx had font picker, color picker, and format picker but no visual feedback. Added a live preview thumbnail matching the SeriesExportModal.tsx pattern:

- Added `getColorScheme`, `getFontOption` imports from seriesExportConfig.ts
- Added `pw` styles object and `PreviewPanel` function with inline HTML/CSS preview
- Preview shows: scheme tag, lesson title (primary color), scripture reference, horizontal rule (accent color), section label, body text, scripture blockquote, footer row
- Updates instantly when font or color selection changes
- Converted from single-column to two-column grid layout (`grid-cols-1 md:grid-cols-2`)
- Modal widened from `max-w-md` to `max-w-2xl`
- Cancel and Download buttons moved to right column below preview (matches SeriesExportModal)
- No new SSOT constants -- all data from seriesExportConfig.ts

### Commit (this session) -- BookletPrintModal Deletion

**EnhanceLessonForm.tsx Print button -- already clean.** Search for `handlePrint` and `Printer` returned zero matches. The Print button was silently removed during the March 20 SSOT audit session but was not tracked as a print removal task.

**BookletPrintModal.tsx (305 lines) -- orphaned dead code, deleted.** Never imported by any other file. Only references to `BookletPrintModal` were inside its own file definition.

### Print Button Removal -- COMPLETE

All print-to-browser UI elements now removed from the platform:
- DevotionalLibrary.tsx -- done March 12
- DevotionalGenerator.tsx -- done March 12
- EnhanceLessonForm.tsx -- done March 20 (during SSOT audit, not separately tracked)
- BookletPrintModal.tsx -- deleted March 22 (orphaned, zero consumers)
- LessonExportButtons.tsx -- already clean (prior session)

### Single-Lesson Export Font/Color/Preview -- COMPLETE

LessonExportModal.tsx now has full parity with SeriesExportModal.tsx for font picker, color scheme picker, and live preview. Both modals pull all options from seriesExportConfig.ts SSOT. No new constants introduced.

### Files Modified This Session

| File | Change |
|---|---|
| src/constants/seriesExportConfig.ts | Century Schoolbook label/cssFamily/docxName correction |
| src/components/SeriesExport/SeriesExportModal.tsx | Stale Crimson Text comment updated |
| src/pages/Index.tsx | "private beta program" -> production copy |
| src/components/dashboard/LessonExportModal.tsx | Live preview thumbnail, two-column layout, max-w-2xl |
| src/components/SeriesExport/BookletPrintModal.tsx | DELETED (305 lines, orphaned dead code) |
| PROJECT_MASTER.md | Session log, WHAT'S NEXT updated, Bug #33 added |

---

## SESSION LOG: March 22, 2026 (Afternoon -- UI Sidebar Navigation)

### Branch: ui-sidebar (Rule #9 temporarily suspended)

This session introduced sidebar navigation to the Dashboard, replacing the horizontal tab bar with a role-based sidebar shell. Work is on the `ui-sidebar` branch per Lynn's instruction. CLAUDE.md Rule #9 (single branch only) has a temporary override note that must be removed when `ui-sidebar` merges to `main`.

### Commits

| Hash | Description |
|---|---|
| f363e79 | FEATURE: Add sidebar navigation shell -- sidebarConfig.ts, AppShell.tsx, wire Dashboard.tsx |
| 65c920d | FIX: Move stray imports to top of Dashboard.tsx |
| 04c4f47 | FIX: Remove duplicate imports -- Footer.tsx (BRANDING), Help.tsx (BRANDING), DevotionalGenerator.tsx (ROUTES) |
| 36ff243 | FEATURE: Add hideUserMenu prop to Header -- sidebar replaces dropdown for AppShell pages |

### New Files Created

| File | Lines | Purpose |
|---|---|---|
| src/constants/sidebarConfig.ts | 230 | SSOT: sidebar items, sections, role-based arrays (mirrors navigationConfig.ts pattern) |
| src/components/layout/AppShell.tsx | 222 | Sidebar + content layout wrapper with role resolution and conditional sections |

### Architecture Decisions

**Governing Principle:** Every role lands on the lesson builder. The sidebar adds role-appropriate tools alongside it. Nobody's preparation work is ever displaced. Build Lesson is always the first item for every role.

**Sidebar Sections by Role:**

| Section | platformAdmin | orgLeader | orgMember | individual |
|---|---|---|---|---|
| Build & Prepare | always | always | always | always |
| My Teaching Team | always | always | always | only if hasTeam |
| Ministry Oversight | always | always | no | no |
| Platform Admin | always | no | no | no |
| Account | always | always | always | always |

**Three item types in sidebar:**
- Tab items (tabValue) -- switch dashboard tabs without navigation (Build Lesson, Lesson Library, Devotional Library, Series Library)
- Route items (route) -- navigate to separate pages via `<Link>` (Teaching Team, Org Manager, Admin Panel, Toolbelt)
- Action items (action) -- trigger callbacks (User Profile opens modal, Sign Out)

**Conditional sections:** Individual role's Teaching Team section uses `condition: 'hasTeam'` evaluated at runtime via `useTeachingTeam` hook's `hasTeam` return value. Solo teachers without a team do not see the section.

**hideUserMenu prop:** Header.tsx gained a `hideUserMenu` boolean prop (default false). When true, the avatar, name tag, dropdown menu, and "Lead a Team" link are all hidden. AppShell passes `hideUserMenu` so the sidebar replaces the dropdown. All 17 other pages that render Header directly are unaffected -- they pass no prop and get the default (false).

**forceMount preserved:** Dashboard.tsx line 297 still has `forceMount` on the Build Lesson TabsContent, preventing remount that would wipe profile defaults.

### Bugs Found and Fixed

1. **Stray imports after function declarations (Dashboard.tsx):** Three import statements (`useTeachingTeam`, `useOrgSharedFocus`, `useHelpVideo`) were placed after localStorage helper function declarations at module level. While ESM hoists imports, this was poor form. Moved all imports to top of file.

2. **Duplicate BRANDING import (Footer.tsx):** Lines 3 and 5 both imported `{ BRANDING } from "@/config/branding"`. Build compiled clean but browser threw `SyntaxError: Identifier 'BRANDING' has already been declared` causing blank white page. Removed duplicate.

3. **Duplicate BRANDING import (Help.tsx):** Lines 4 and 26 -- same pattern as Footer.tsx. Same blank white page symptom. Removed duplicate.

4. **Duplicate ROUTES import (DevotionalGenerator.tsx):** Lines 48 and 53 both imported `{ ROUTES } from "@/constants/routes"`. Removed duplicate.

5. **Known recurring bug documented:** Added CLAUDE.md debugging section documenting the duplicate BRANDING import pattern with a PowerShell sweep command to detect all instances in under 10 seconds.

### Current State of ui-sidebar Branch

- Sidebar renders correctly on /dashboard for platformAdmin role (Lynn's account)
- Role-based sections working -- Build & Prepare, My Teaching Team, Ministry Oversight, Platform Admin, Account all visible
- Header dropdown hidden when inside AppShell
- All 17 other pages (Admin, Account, OrgManager, TeachingTeam, etc.) unaffected -- Header renders with full dropdown as before
- Build clean at 3822 modules, zero errors
- Dev server confirmed running at localhost:8081

### Remaining Work on ui-sidebar Branch -- ALL COMPLETE

All 5 items completed. Branch merged to main March 25, 2026.

1. ~~Wrap remaining authenticated pages in AppShell~~ -- DONE (Phase A)
2. ~~Fix Organization Manager sidebar item route~~ -- DONE
3. ~~Standardize Dashboard vs Workspace terminology~~ -- DONE
4. ~~Test all five role configurations~~ -- DONE (Phase B regression test)
5. ~~Merge to main~~ -- DONE (March 25, 2026)

### Files Modified This Session

| File | Change |
|---|---|
| CLAUDE.md | Rule #9 temporary override for ui-sidebar branch; duplicate BRANDING import bug documentation |
| src/constants/sidebarConfig.ts | NEW: SSOT sidebar config (230 lines) |
| src/components/layout/AppShell.tsx | NEW: Sidebar + content layout wrapper (222 lines) |
| src/pages/Dashboard.tsx | Wired to AppShell, TabsList/TabsTrigger removed, imports reordered |
| src/components/layout/Header.tsx | Added hideUserMenu prop, wrapped dropdown in conditional |
| src/components/layout/Footer.tsx | Removed duplicate BRANDING import |
| src/pages/Help.tsx | Removed duplicate BRANDING import |
| src/components/DevotionalGenerator.tsx | Removed duplicate ROUTES import |
| PROJECT_MASTER.md | This session log |

---

## SESSION LOG: March 23-25, 2026 -- Phase A Completion, Phase B Merge, Sidebar Navigation Rework

### Phase A -- All 11 Tasks Completed (March 23-24, 2026)

**Tasks 1-4 (Sidebar completion):**
- All remaining authenticated pages migrated to AppShell: Teaching Team, Org Manager, Admin Panel, Manage Toolbelt, Pricing, Help, Training, Bonuses, More Tools, Devotionals, Account
- Dark mode color refinements across all pages
- Light mode color and contrast refinements
- Icon consistency audit completed

**Tasks 5-7 (Already done in prior sessions):**
- Print button removal (March 20), BookletPrintModal deletion (March 22), single-lesson export font/color picker (March 22)

**Task 8: OrgSetup.tsx stale tier name audit**
- Audited and fixed all hardcoded references to old tier names

**Task 9: Booklet economical printing**
- Body font adjusted to 10pt, line spacing refined to 1.10-1.15x per seriesExportConfig.ts SSOT

**Task 10: include_student_handouts column rename**
- 46th Supabase migration created: `20260324180000_rename_include_student_handouts.sql`
- Renames `include_student_handouts` to `include_group_handouts` on profiles table
- Safe conditional rename (IF EXISTS guard)

**Task 11: Unify pricingConfig.ts STRIPE_ORG with orgPricingConfig.ts**
- STRIPE_ORG block removed from pricingConfig.ts (comment at line 45 documents removal)
- orgPricingConfig.ts is now the sole authority for all org tier data: display names, Stripe IDs, prices, lesson limits
- All org edge functions (org-stripe-webhook, create-org-checkout-session) already import from _shared/pricingConfig.ts which delegates to orgPricingConfig.ts patterns

### Phase B -- Merge to Main (March 25, 2026)

- ui-sidebar branch merged to main via clean merge commit
- Full regression test across all roles
- Deployed to biblelessonspark.com via deploy.ps1
- All AppShell-migrated pages verified rendering correctly

### Sidebar Navigation Rework (March 25, 2026)

Complete rework of AppShell to be fully self-contained. Four commits on main:

**Commit f3a9819 -- FIX: PricingPage -- prevent layout flash by checking auth loading state before rendering**
- Initial fix: added authLoading early return to prevent Header/Footer flash

**Commit ef25296 -- FIX: PricingPage always uses AppShell -- no conditional logic, no flash, matches TeachingTeam pattern**
- Removed Header/Footer imports and conditional PageWrapper
- PricingPage always renders inside AppShell
- /pricing route wrapped in ProtectedRoute in App.tsx
- Simplified button text and badge logic (user always exists behind ProtectedRoute)

**Commit 87932d1 -- FIX: Move UserProfileModal into AppShell -- works on every page without per-page prop**
- UserProfileModal state and rendering moved from Dashboard.tsx into AppShell.tsx
- Removed onOpenProfile prop from AppShellProps interface
- Profile sidebar click now works on every page (Pricing, Teaching Team, Help, etc.)
- Removed orphaned handleProfileUpdated function from Dashboard

**Commit 39c789c -- REWORK: Complete sidebar navigation rework -- self-contained AppShell, tab navigation via location state, no prop drilling**
- AppShell props reduced to: `children: React.ReactNode` and `conditions?: Record<string, boolean>`
- Removed `activeTab`, `onTabChange`, `onOpenProfile` props entirely
- Tab items (Build Lesson, Lesson Library, etc.) now navigate via `useNavigate(ROUTES.DASHBOARD, { state: { tab: tabValue } })`
- Dashboard.tsx reads tab from `location.state?.tab` on mount and via useEffect
- Tab active state highlighting: checks `location.pathname === /dashboard && location.state.tab === tabValue`
- /help and /training routes wrapped in ProtectedRoute (they use AppShell which requires auth context)
- AppShell owns all navigation decisions -- no page passes navigation callbacks

### AppShell Architecture (as of March 25, 2026)

**Props:**
```typescript
interface AppShellProps {
  children: React.ReactNode;
  conditions?: Record<string, boolean>;
}
```

**Self-contained behaviors:**
- Tab items: navigate to /dashboard with state: { tab: tabValue }
- Route items: <Link> to item.route
- Action items: openProfile sets internal showProfileModal state; signOut calls signOut() then redirects
- Sidebar active state: tab items check location.state.tab; route items check location.pathname; action items never active
- UserProfileModal owned internally -- no page passes onOpenProfile

**Dark/light mode:**
- ThemeProvider.tsx provides `{ theme, toggleTheme }` context
- Theme toggle button in sidebar logo block
- Preference persisted in localStorage

### Files Modified This Session (March 25, 2026)

| File | Change |
|---|---|
| src/components/layout/AppShell.tsx | Complete rewrite: self-contained, location.state tab navigation, owns UserProfileModal, props reduced to children+conditions |
| src/pages/Dashboard.tsx | Reads tab from location.state, removed activeTab/onTabChange/onOpenProfile props, removed UserProfileModal |
| src/pages/PricingPage.tsx | Always uses AppShell, removed Header/Footer/conditional layout |
| src/App.tsx | /pricing, /help, /training wrapped in ProtectedRoute |

---

## SESSION LOG: March 25, 2026 -- Step 1 Card UI, Curriculum Upload Pipeline, Series Max Fix

### Overview
Complete rebuild of Step 1 (Choose Your Scriptural
Foundation) from a radio-button list to a three-card
selection UI, plus a full curriculum upload pipeline
with automatic scripture and focus extraction, plus
an emergency production fix for series lesson maximum.

### Features Delivered

**Step 1 Card UI (EnhanceLessonForm.tsx)**
- Replaced RadioGroup with 3 large selectable cards
  in a role="radiogroup" container with full keyboard
  navigation and accessibility
- Cards: Enhance Existing Curriculum, Build from a
  Bible Passage, Create from a Topic or Question
- No card pre-selected on page load -- contentInputType
  defaults to null so all three cards appear visually equal
- Removed Recommended badge from Card 2 -- all three
  options are equally valued
- Inputs reveal below card row after selection
- Combined passage and topic entry preserved for
  Cards 2 and 3
- Button renamed from "Continue to Step 2" to
  "Proceed to Step 2"
- RadioGroup and RadioGroupItem imports removed

**Curriculum Upload Pipeline -- File Upload (Card 1)**
- Multi-page upload: teachers upload multiple image
  or PDF files representing pages of printed curriculum
- Single styled button replaces native browser input:
  "Upload Curriculum -- PDF, TXT, JPG, JPEG, PNG"
  on first load
  "Add More Curriculum If Needed" after first upload
- Page list shows filenames with Remove buttons and
  running count: "Curriculum pages loaded: N"
- Scripture and focus auto-extracted from first uploaded
  file via Haiku (claude-haiku-4-5-20251001) call in
  extract-lesson Edge Function
- Scripture and focus lock after first file -- subsequent
  pages add content but do not overwrite identified values
- "Found in your curriculum" note displays extracted
  values as editable inputs
- Helper text: "Confirm or edit these before proceeding
  to Step 2."
- Removing first page clears locked values and
  re-extracts from new first page
- Clear All resets everything cleanly

**Curriculum Upload Pipeline -- Paste Text (Card 1)**
- Paste mode now also extracts scripture and focus
- "Find Scripture and Focus in My Curriculum" button
  triggers Haiku extraction on pasted text
  (minimum 200 characters)
- Button hides after extraction -- "Found in your
  curriculum" note appears identically to file upload
- extract-lesson Edge Function updated with Path A:
  accepts pastedText from formData, skips file parsing,
  runs same Haiku extraction, returns same response shape

**Step 1 Summary (collapsed view)**
- Curriculum path: shows extracted scripture and focus
  when available, falls back to character count
- Passage/topic path: shows values separated by " - "
  (non-ASCII separator replaced)

### Emergency Production Fix -- Series Maximum

**Bug:** User attempted to generate first lesson of a
12-lesson series. generate-lesson Edge Function rejected
with: "total_lessons must be a number between 2 and 7"

**Root Cause:** SSOT violation. Frontend seriesConfig.ts
had maxLessons: 12 but backend validation.ts had hardcoded
maximum of 7. Backend mirror file
supabase/functions/_shared/seriesConfig.ts did not exist
despite being documented as required in the frontend SSOT
file header.

**Fix -- 5 files:**
- src/constants/seriesConfig.ts: maxLessons 12 -> 13
  (covers full quarterly -- 13 weeks)
- supabase/functions/_shared/seriesConfig.ts: NEW file,
  exports MAX_SERIES_LESSONS=13 and MIN_SERIES_LESSONS=2
- supabase/functions/_shared/validation.ts: imports from
  mirror, replaced all hardcoded 7 and 2 references
- src/constants/teacherPreferences.ts: "(7 max)" ->
  "(13 max)"
- supabase/functions/_shared/teacherPreferences.ts:
  "(7 max)" -> "(13 max)"
  Plus: pre-existing em dashes cleaned from lines
  69, 241, 297, 606, 647, 662

**Resolution:** Lynn logged in as the affected user and
generated their first lesson personally. High-touch
pastoral response to a real person in need.

### Files Changed This Session
- src/components/dashboard/EnhanceLessonForm.tsx
- supabase/functions/extract-lesson/index.ts
- src/constants/seriesConfig.ts
- src/constants/teacherPreferences.ts
- supabase/functions/_shared/seriesConfig.ts (NEW)
- supabase/functions/_shared/validation.ts
- supabase/functions/_shared/teacherPreferences.ts

### Edge Functions Deployed This Session
- extract-lesson: deployed twice
  1. Initial Haiku extraction for file uploads
  2. Path A added for paste text extraction
- generate-lesson: deployed once for series max fix

### Architecture Notes
- extract-lesson handles one file at a time -- multi-page
  accumulation is managed entirely in the frontend
- generate-lesson receives combined extracted text via
  derived extractedContent constant joining pages with
  newline separator
- Theology profile governs lesson output regardless of
  curriculum theology -- structural coupling is real,
  theological override is authoritative
- BOM stripped from extract-lesson/index.ts source file
  (was causing ASCII guard failures on deploy)

### Bug History Additions
33. contentInputType defaulting to "passage" caused Card 2
    visual emphasis on page load. Fixed by changing default
    to null. March 25, 2026.
34. getStep1Summary non-ASCII separator tripped ASCII guard.
    Replaced with " - ". March 25, 2026.
35. Paste extraction not triggering -- Edge Function
    pastedText path was not deployed when frontend was
    tested. Deploy order matters: Edge Function must deploy
    before frontend changes that depend on it.
    March 25, 2026.
36. BOM in extract-lesson/index.ts blocked commits.
    Stripped via Node.js fs write without BOM encoding.
    March 25, 2026.
37. SSOT violation -- series maximum hardcoded in backend
    at 7 while frontend SSOT allowed 12. Backend mirror
    _shared/seriesConfig.ts never created. User attempt
    to generate a 12-lesson quarterly series failed with
    validation error. Fixed by creating mirror and updating
    maximum to 13. March 25, 2026.

### What Is NOT Yet Done (carry forward)
- Styling pass on Step 1 cards (visual refinement planned
  from start of session -- not yet completed)
- Landing page improvements (deferred post-tutorials)
- Paste text extraction: scripture/focus extraction works
  but requires teacher to click a button rather than being
  fully automatic like file upload path -- acceptable for
  now but worth revisiting

---

## SESSION LOG: March 26, 2026 -- Step 1 UI Polish + Dark Mode SSOT Fix

### Step 1 Card Visual Polish (EnhanceLessonForm.tsx)

Three contentInputType selection cards (curriculum, passage, topic) received
a full selection-state styling pass:
- Added `relative` positioning to each card button
- Changed `transition-colors` to `transition-all`
- Selected card: `shadow-md`, unselected: `shadow-sm`
- Selected card: small filled green dot (bg-primary) in top-right corner
- Selected card: icon and title text switch to `text-primary`
- All three cards treated identically -- no badge, label, or treatment
  implies preference between them

### Step 1 OR Separators

The three cards were originally in a CSS grid with no visual separation cue.
Volunteer teachers (ages 60-85) were not understanding they must choose
exactly one of the three options.

- Changed grid layout to flex row (md:flex-row, flex-col on mobile)
- Added bold "OR" separators between Card 1/Card 2 and Card 2/Card 3
- Added instructional heading: "Choose ONE Scriptural Foundation" with
  ONE underlined and Scriptural Foundation in GoldAccent (brand secondary)
  matching the Step 2 and Step 3 title styling

### Proceed Button Cleanup

Removed trailing question mark character from "Proceed to Step 2" and
"Proceed to Step 3" button labels.

### Dark Mode SSOT Fix (brand-values.json + generate-css.cjs + index.css)

The .dark block in index.css was hand-edited and out of sync with the
generator. The generator's hardcoded neutral 0 0% values would have wiped
the Forest Green dark theme on the next build.

Correct SSOT fix applied through the full chain:
- Added darkMode section to brand-values.json (surfaceHue 120, lifted
  lightness values for background/card/popover/muted/border/input/
  foreground/mutedForeground)
- Updated generate-css.cjs to read brandValues.darkMode and generate
  the .dark CSS block from it instead of hardcoded neutral values
- index.css regenerated -- dark block now matches SSOT exactly

### prebuild Script Added

package.json had no prebuild script despite index.css header claiming
the generator runs automatically before each build. Added:
  "prebuild": "node scripts/generate-css.cjs"
Generator now fires automatically on every npm run build.

### Files Changed This Session
- src/components/dashboard/EnhanceLessonForm.tsx
- src/config/brand-values.json
- scripts/generate-css.cjs
- src/index.css (regenerated)
- package.json

### What Is NOT Yet Done (carry forward)
- Landing page improvements (deferred post-tutorials)
- Paste text extraction: scripture/focus extraction works but requires
  teacher to click a button rather than being fully automatic like file
  upload path -- acceptable for now but worth revisiting
- Dark mode: conservative lightness lifts applied -- may need further
  adjustment after real-world review by users

---

## SESSION LOG: March 26, 2026 -- UI Polish + SSOT Fixes + Image Updates

### Step 1 Card Visual Polish (EnhanceLessonForm.tsx)
- Added relative positioning, transition-all, shadow-md/shadow-sm to all three contentInputType selection cards
- Selected card: green dot indicator top-right, icon and title switch to text-primary
- All three cards treated identically -- no badge or preference implied
- OR separators added between cards (bold, flex layout replacing grid)
- Step 1 title changed to "Choose ONE Scriptural Foundation" with ONE underlined and Scriptural Foundation in GoldAccent
- Trailing question marks removed from "Proceed to Step 2" and "Proceed to Step 3" buttons
- contentInputType confirmed initializing to null -- no card selected on fresh load

### Dark Mode SSOT Fix
- brand-values.json: Added darkMode section as SSOT for all .dark CSS variables (surfaceHue 120, lifted lightness values)
- generate-css.cjs: Updated to read brandValues.darkMode and generate .dark block from SSOT instead of hardcoded neutral 0 0% values
- index.css: Regenerated -- dark block now uses Forest Green hue with lifted surface values
- package.json: Added "prebuild": "node scripts/generate-css.cjs" -- generator now fires automatically on every npm run build
- Previous hand-edited .dark block was out of sync and would have been wiped on next build -- now SSOT-protected

### Booklet Economical Printing
- seriesExportConfig.ts: Added bookletBody: { fontPt: 10, lineHeight: 1.12 } alongside existing body: { fontPt: 11 }
- buildSeriesPdf.ts: All booklet functions now read from EXPORT_SPACING.bookletBody -- full-page body font 11pt untouched
- Reviewed and approved on localhost before deploy

### Org Tier Mapping Bug Fix (Critical)
- resolveTierFromPriceId in both pricingConfig.ts and _shared/pricingConfig.ts was using replace(/^org_/, '') to map org tier keys to SubscriptionTier values
- This produced invalid values for three tiers: org_single_staff -> single_staff, org_develop -> develop, org_expansion -> expansion
- Fix: replaced with explicit ORG_TIER_TO_SUBSCRIPTION_TIER mapping object in both files
- Correct mapping: org_single_staff -> starter, org_starter -> starter, org_growth -> growth, org_develop -> full, org_expansion -> enterprise
- Both stripe-webhook and org-stripe-webhook Edge Functions redeployed via npx supabase functions deploy
- SSOT compliant: frontend SSOT updated first, backend mirror updated to match exactly

### Items Confirmed Already Complete (no work needed)
- Print button removal: fully complete -- no BookletPrintModal, no handlePrint, no window.print anywhere in codebase
- Single-lesson export font and color picker: fully complete -- LessonExportModal.tsx, exportToPdf.ts, exportToDocx.ts all wired
- OrgSetup.tsx tier name audit: clean -- all display names pull from orgPricingConfig.ts SSOT dynamically
- pricingConfig.ts STRIPE_ORG vs orgPricingConfig.ts tension: resolved March 24 (Phase A11) -- STRIPE_ORG block removed, orgPricingConfig.ts is sole authority

### Hero Images Added
- src/assets/woman_using_BLS_at_home.jpg: Added to main site landing page hero (HeroSection.tsx) -- replaces previous placeholder
- public/bls_hero_org_manager.jpg: Added to /org landing page (OrgLanding.tsx) hero right column -- 4-teacher classroom scene, fully uncropped, scales naturally to any screen size
- OrgLanding.tsx hero: Two-column layout on desktop (text left, image right), image below text on mobile, no object-fit cropping -- full photo always visible

### Org Landing Page Mobile Tier Cards
- On mobile: only 3 middle tiers shown by default (Strengthening, Multiplication, Expansion)
- "See all plans" toggle reveals Foundation and Network tiers
- Toggle text changes to "Show less" when expanded
- showAllTiers is local React state -- no routing changes
- On sm and above all 5 tiers always visible

### Files Changed This Session
- src/components/dashboard/EnhanceLessonForm.tsx
- src/config/brand-values.json
- scripts/generate-css.cjs
- src/index.css (regenerated)
- package.json
- src/constants/seriesExportConfig.ts
- src/utils/export/buildSeriesPdf.ts
- src/constants/pricingConfig.ts
- supabase/functions/_shared/pricingConfig.ts
- src/components/landing/HeroSection.tsx
- src/pages/OrgLanding.tsx
- src/assets/woman_using_BLS_at_home.jpg (new)
- src/assets/bls_hero_org_manager.jpg (new)
- public/bls_hero_org_manager.jpg (new)

### Edge Functions Deployed This Session
- stripe-webhook: redeployed for org tier mapping fix
- org-stripe-webhook: redeployed for org tier mapping fix

### Bug History Additions
38. Org tier mapping produced invalid SubscriptionTier values -- replace(/^org_/, '') on org_single_staff, org_develop, org_expansion produced values not in the SubscriptionTier enum. Silent failure in webhook tier resolution for those three tiers. Fixed with explicit mapping object. March 26, 2026.
39. Accessibility requirements omitted from nav gating prompt -- Free-tier sidebar graying prompt was sent to CC without explicit WCAG requirements. Caught before deploy and corrected with follow-up prompt. Root fix: Rule 22 and Accessibility Verification Block added to CLAUDE.md and PROJECT_MASTER.md as permanent governance. April 4, 2026.

### What Is NOT Yet Done (carry forward)
- include_student_handouts column cosmetic rename -- low priority, no active code references it
- Admin UI feature flag toggles -- deferred post-launch
- Frontend org creation UI -- deferred post-launch
- Multi-tenant migration -- Phases 1-5 per MULTI_TENANT_MIGRATION_PLAN.md, not started
- Dark mode: conservative lightness lifts applied -- may need further adjustment after real-world user review

## SESSION LOG: March 27, 2026 -- Phase C Completion + Intensity Slider + Title Extraction

### ADDITIONAL WORK COMPLETED MARCH 27, 2026 (afternoon):

- Phase C3: Reshape history in Lesson Library -- shape badge (gold) on reshaped lesson cards, View Reshaped expander with content preview and copy button. Purple color corrected to gold for dark mode compatibility.
- Intensity slider bridge zone fix: neon green and yellow cast eliminated by reducing saturation to near-zero at anchor points 40 and 60. Smooth continuous dark-to-light progression.
- Series Library bugs fixed: lesson count mismatch resolved via batch count query, lesson title truncation corrected to line-clamp-2, blank screen fixed (isExpanded used before declaration -- temporal dead zone ReferenceError).
- Series lesson click-to-view: clicking a lesson row in the expanded series list opens the full lesson view.
- Return-to-series navigation: lesson view opened from Series Library shows "Back to Series" button, returns to Series Library with the same series expanded.
- Intermittent popout eliminated: pending-view spinner prevents EnhanceLessonForm from flashing while lesson loads.
- Series card pinning: pin icon on each series card, pinned series float to top of Series Library sorted by pin_order, most recently pinned moves to position 1, persists across sessions via database. Migration: 20260327180000_add_pin_order_to_lesson_series.sql.
- Lesson title extraction: generate-lesson Edge Function now extracts AI-generated title from Section 1 and saves it to lessons.title (previously stored user input like "Psalm 34:8" instead of the actual lesson title). Backfilled 5 existing untitled lessons.
- Guardrail violation logging: generate-lesson Edge Function now INSERTs to guardrail_violations table when violations are detected. Admin Panel GuardrailViolationsPanel already queries this table -- pipeline is now connected end-to-end.
- Auto-extract scripture and focus from pasted curriculum text: EnhanceLessonForm now auto-triggers extraction after 1-second debounce when 200+ characters are pasted, matching the file upload path behavior.

### OUTSTANDING CARRY-FORWARDS (updated):
- Phase C4: Consistent toolbar everywhere -- next task
- Phase C5: Devotional series
- Pre-existing Unicode in generate-lesson/index.ts lines 58-118
- Tutorial video scripts -- blocked until Lynn provides screenshots or screen recording of live platform


## SESSION LOG: March 31, 2026 -- Phase D Completion + Series Deletion

### Booklet Spread Simulation (Publishing Hub)

Completed the in-progress Phase D booklet preview simulation in `src/pages/PublishingHub.tsx`.

**What was there:** The booklet branch of the inline series preview had Part 1 (fold diagram + bullet points -- correct and kept) and Part 2 (a flat single-column scrollable content dump at 10px font -- placeholder quality).

**What was built:** Replaced Part 2 with a true booklet spread simulation. Added `buildBookletSpreads()` helper function inside the component that builds an array of logical half-pages (Cover, Table of Contents, one page per lesson, blank pad if needed for even count) and pairs them into spreads. Each spread renders as a landscape-proportioned container (500px wide, aspect ratio 5.5x8.5") with two side-by-side half-page panels divided by a dashed center fold line. Spread labels show "Spread N of N -- pp. X-Y". Actual fetched lesson content renders in each panel via the existing `renderBookletMarkdown()` function. Scrollable via the existing `preview-scroll-container` class. Group Handout note appears below spreads when checkbox is checked.

**Files changed:** `src/pages/PublishingHub.tsx`

**Deployed:** Committed as part of session work.

---

### Phase D -- Print Wing: COMPLETE

Full audit confirmed all Phase D Print Wing items are done:

- Part 1: Publishing Hub UI (font picker, color scheme picker, format picker, economical print toggle, scrollable preview panel, full-size preview modal) -- complete
- Part 2: All three libraries (Lesson, Devotional, Series) wired with Publish buttons navigating to `/publish?type=[type]&id=[id]` -- complete
- Booklet spread simulation -- completed this session
- Print button removal -- confirmed complete; all remaining Printer icon references in DevotionalLibrary.tsx, LessonExportButtons.tsx, SeriesExportButton.tsx, and sidebarConfig.ts are Publishing Hub navigation icons, not print triggers
- Single-lesson and devotional export font and color picker -- confirmed already complete; exportToPdf and exportToDocx both accept fontId, colorSchemeId, and economicalPrint; PublishingHub.tsx already passes picker selections through to both functions at the download handlers

**Phase E (Digital Wing -- shareable URLs, QR codes, ePub) is next. Explicitly out of scope for Phase D.**

---

### Series Deletion (commit 0be48f8)

Added the ability to delete a series from the Series Library. Previously, empty series had no deletion path.

**Rules:**
- Only empty series (0 lessons) can be deleted
- Series with lessons show a destructive toast: "Remove all lessons from this series before deleting it" -- no deletion occurs
- Two-step confirmation: trash icon appears on each card; clicking it shows inline "Delete series?" with "Yes, delete" and "Cancel" buttons; no modal
- On successful delete: toast confirmation, card removed, series list refreshed, expanded state cleared if the deleted series was expanded

**Implementation:**
- Trash2 icon added to lucide-react import
- deleteConfirmId state tracks which series is in confirm state
- deleting state tracks in-flight delete request
- handleDeleteSeries() checks lessonCounts[seriesId] before issuing the Supabase delete; if count > 0, shows toast and aborts
- Inline confirm UI replaces the trash button when deleteConfirmId === series.id; returns to trash icon on Cancel or completion
- Delete targets lesson_series table directly; safe because only empty series reach this path

**File changed:** `src/components/dashboard/SeriesLibrary.tsx`

**Deployed:** Commit 0be48f8

---

### What Is NOT Yet Done (carry forward)

- Phase E: Digital Wing -- shareable URLs, QR codes, ePub (explicitly post-Phase D)
- Tutorial video scripts -- still blocked pending current screenshots or screen recording from Lynn
- include_student_handouts column rename -- low priority cosmetic debt
- pricingConfig.ts STRIPE_ORG block vs orgPricingConfig.ts unification -- pre-existing tension, no functionality broken
- OrgSetup.tsx stale tier name audit -- imports from SSOT so display names are correct, but inline prose should be checked
- Multi-tenant migration -- Phases 1-5 per MULTI_TENANT_MIGRATION_PLAN.md, not started

---

## SESSION LOG: March 31, 2026 (Evening) -- Phase E Digital Wing

### Overview
Phase E (Digital Wing) built and deployed in full. All features are
Personal plan only.

### Phase E Part 1 -- Shareable URLs (commits 0ba5546, c81a3bc)

Database migrations added share_token, share_token_handout,
share_font_id, and share_color_scheme_id columns to lessons,
devotionals, and lesson_series tables.

Two share modes for lessons and series:
- Full Lesson (share_token): all sections
- Group Handout Only (share_token_handout): Section 8 only

Devotionals have a single share token (no handout variant).

Public SharedContentPage built at /share/:token. Page resolves
content by trying all type/scope combinations sequentially until
a match is found. Teacher font and color scheme reflected on the
shared page (stored at token-creation time as share_font_id and
share_color_scheme_id).

get-shared-content Edge Function deployed. Accepts POST body with
token, type, and scope parameters.

Share controls added to Publishing Hub for all three content types
(lessons, devotionals, series). Personal plan only.

Three bug fixes deployed during SharedContentPage wiring:
- 7b078a8: Add Authorization Bearer header to Edge Function fetch
- c085067: Use supabase.functions.invoke instead of raw fetch
- 0eb3763: Try both full and handout scopes when resolving token

### Phase E Option B -- Teacher Font and Color on Shared Pages
(commit 9a29cc3)

Shared pages now reflect the teacher's chosen font and color scheme.
Font family and color scheme stored at token-creation time so shared
page appearance is stable even if teacher later changes preferences.

### Phase E Part 2 -- QR Codes (commit 8e9831d)

QR code generated automatically for each active share link.
QR codes downloadable as PNG. Auto-generated on page load and on
share enable. Powered by client-side QR library -- no server calls.

### Phase E Parts 3 and 4 -- ePub and Flip-Booklet

ePub export: client-side generation using JSZip. Valid ePub 3
structure. Teacher font and color scheme applied. Covers lesson
series and devotional series.

Flip-booklet viewer: accessible via ?view=flipbook on shared
series URLs. Page-flip library loaded via dynamic import in
useEffect. Devotional series included in scope.

### Architecture Notes
- lesson_series has no series_type column -- series type inferred
  from which content table (lessons vs devotionals) has rows linked
  via series_id
- Tailwind class names in dynamically generated HTML strings are
  not detected by Tailwind build-time scanner -- inline styles used
  instead

### Files Changed
- supabase/migrations/ (share_token columns)
- src/pages/SharedContentPage.tsx (new)
- src/pages/PublishingHub.tsx
- supabase/functions/get-shared-content/ (new Edge Function)

### Edge Functions Deployed
- get-shared-content (new)

---

## SESSION LOG: April 3, 2026 -- Theme Visual Distinction

### Problem
Soft and Light sidebar themes were visually indistinguishable.
Dim and Dark themes were also nearly identical.

### Fix (commits de6f9c5, 57df598)

ThemeProvider.tsx anchor values updated:

Soft/Light fix:
- Soft background saturation dropped to 0 -- warm parchment
  (40 30% 92% / approx #F1EDE5)
- Light background saturation reduced -- crisp near-white
  (47 9% 98% / approx #FAFAF8)

Dim/Dark distinction improved in same pass.

All four modes now visually distinct at a glance.

### Files Changed
- src/components/layout/ThemeProvider.tsx

---

## SESSION LOG: April 4, 2026 -- Accessibility (WCAG 2.2 AA)

### Overview
Full accessibility audit and remediation of the lesson builder flow.
Goal: a blind teacher can successfully create and use a lesson without
friction. All work targets the main lesson builder -- no separate
accessible route was needed or built.

### Audit Method
Both EnhanceLessonForm.tsx and TeacherCustomization.tsx reviewed
in Claude.ai before any code was written. Five structural problems
identified. axe-core 4.11.2 automated audit run post-fix to verify.

### Problems Found and Fixed

P1 -- Accordion headers not keyboard accessible (Critical)
AccordionStep in EnhanceLessonForm.tsx and CardHeader in
TeacherCustomization.tsx both used div with onClick. Neither could
receive Tab focus or be activated with Enter or Space. Fixed by
replacing with proper button elements with aria-expanded. Nested
Button components (Watch Video, Edit) moved outside the toggle
button to eliminate invalid button-in-button HTML that was causing
Step 3 to fail to expand.
Commit: dd06127

P2 -- Step 2 auto-advanced to Step 3 without user action (UX + Accessibility)
A useEffect with 300ms timer fired setExpandedStep(3) the moment
isStep2Complete() returned true. With theology profile and Bible
version pre-populated from defaults, selecting age group instantly
completed Step 2 and jumped to Step 3 before user could review.
Removed the entire useEffect and prevStep2CompleteRef. Continue
button is now the sole mechanism for advancing Step 2 to Step 3.
Commit: dd06127

P3 -- Series dropdown had no label association (High)
Teaching Series label in TeacherCustomization.tsx had no htmlFor
and the SelectTrigger had no id. Added htmlFor="series-select" to
the label and id="series-select" to the trigger.
Commit: dd06127

P4 -- Delete profile button was icon-only (High)
Trash icon button had no aria-label. Screen reader announced
"button" with no context. Added aria-label="Delete profile".
Commit: dd06127

P5 -- Broken Tooltip inside SelectItem (Medium)
Teaching Style SelectItem contained a non-functional Tooltip and
Info icon wrapper. Tooltips cannot fire from inside a closed
dropdown list. Removed entirely. Unused imports cleaned up.
Commit: dd06127

P6 -- aria-required missing on Step 2 required fields (Low)
Age Group, Baptist Theology Profile, and Bible Version
SelectTriggers had visible asterisks but no aria-required="true".
Added to all three.
Commit: dd06127

P7 -- Bible passage autocomplete silent to screen readers (High)
Suggestion list was a raw div containing divs -- no ARIA roles,
no keyboard navigation, no announcement. Replaced with full ARIA
combobox pattern: role="combobox", aria-expanded,
aria-autocomplete="list", aria-controls, aria-haspopup="listbox"
on the Input; role="listbox" on the suggestion container;
role="option" with aria-selected on each item. Added Escape key
handler to dismiss suggestions. Added htmlFor/id association
between Label and Input.
Commit: 4fd7008

### What Was NOT Changed
All 17 Select dropdowns across both files already had correct
htmlFor/id label associations and were not touched. Step 1 radio
cards already had role="radiogroup", role="radio", aria-checked,
and arrow key navigation -- also not touched.

### Automated Audit Results
axe-core 4.11.2 run against localhost post-fix. Zero violations
on any form controls, accordion, autocomplete, or labels. Two
moderate violations reported (landmark-one-main,
page-has-heading-one) were confirmed false positives -- both
elements exist correctly in source but were not yet rendered when
the headless browser captured the page.

### Key Learnings
- Nested button-in-button HTML causes silent browser behavior
  failures. Always move action buttons outside the toggle button.
- Automated audits against unhydrated React pages produce false
  positives. Run axe-core after full React render only.
- Accessibility fixes benefit all users: removing auto-advance
  improved sighted UX; proper button semantics improved keyboard
  navigation for everyone.

### Files Changed
- src/components/dashboard/EnhanceLessonForm.tsx
- src/components/dashboard/TeacherCustomization.tsx

### Commits
- dd06127 ACCESSIBILITY: Fix accordion keyboard navigation,
  remove auto-advance, aria labels, required fields, series label
- 4fd7008 ACCESSIBILITY: Bible passage autocomplete ARIA
  combobox pattern, listbox, keyboard Escape dismiss
