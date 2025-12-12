# LessonSparkUSA - Project Master Document

---

## âš ï¸ CRITICAL: DUAL ROLE SYSTEM ARCHITECTURE

> **THIS SECTION IS MANDATORY READING BEFORE ANY ROLE-RELATED CHANGES**

### Overview

LessonSparkUSA uses TWO distinct role systems that serve different purposes. These are intentionally separate and must remain synchronized through documented mapping.

### Database Roles (user_roles.role - app_role enum)

**Purpose:** Capability-based permissions (what a user CAN do)

| Role | Description |
|------|-------------|
| admin | Platform administrator - full system access |
| teacher | Standard user - create/manage own lessons |
| moderator | Future: content moderation capabilities |

**Location:** user_roles table, column role (type: app_role enum)

### Frontend Roles (accessControl.ts - ROLES constant)

**Purpose:** Access scope (what a user CAN SEE)

| Role | Description |
|------|-------------|
| platformAdmin | Lynn - sees all platform data, all users, all analytics |
| orgLeader | Organization admin - sees org-scoped data |
| orgMember | Org teacher - sees own lessons within org context |
| individual | Personal workspace - sees only own lessons |

**Location:** src/constants/accessControl.ts

### Role Mapping (Database to Frontend)

The getEffectiveRole() function in accessControl.ts performs this mapping:

| Database Role | Context | Frontend Role |
|---------------|---------|---------------|
| admin | any | platformAdmin |
| teacher/moderator | hasOrganization + org admin | orgLeader |
| teacher/moderator | hasOrganization + org member | orgMember |
| teacher/moderator | no organization | individual |

### Why Two Systems?

1. **Separation of Concerns:**
   - Database roles = security/capability (enforced by RLS)
   - Frontend roles = UI visibility (enforced by React components)

2. **Flexibility:**
   - A teacher in database can be orgLeader OR orgMember OR individual depending on context
   - An admin is always platformAdmin regardless of context

3. **Future-Proofing:**
   - Organization features will use context, not new database roles
   - Adding org context does not require database migration

### SSOT Compliance

| System | SSOT Location | Sync Method |
|--------|---------------|-------------|
| Database roles | app_role enum in PostgreSQL | Manual migration |
| Frontend roles | src/constants/accessControl.ts | Code changes |
| Role mapping | getEffectiveRole() in accessControl.ts | Code changes |

### MODIFICATION RULES

1. **To add a new DATABASE role:**
   - Add to app_role enum via SQL migration
   - Update getEffectiveRole() mapping
   - Update this documentation

2. **To add a new FRONTEND role:**
   - Add to ROLES constant in accessControl.ts
   - Update TAB_ACCESS and FEATURE_ACCESS
   - Update getEffectiveRole() mapping
   - Update this documentation

3. **NEVER:**
   - Assume database role = frontend role
   - Change one system without updating the mapping
   - Skip updating this documentation

### Related Files

- src/constants/accessControl.ts - Frontend role definitions and mapping
- src/integrations/supabase/types.ts - Generated types including app_role
- Database: user_roles table, app_role enum
- Database: has_role() function for RLS checks

---

**Last Updated:** 2025-12-12
**Current Phase:** Phase 13 (SSOT Compliance Complete)
**Repository:** C:\Users\Lynn\lesson-spark-usa
**Framework Version:** 2.1.2

---

## Project Overview

LessonSparkUSA is a Baptist Bible study lesson generator platform serving volunteer teachers in Baptist churches. Built with React/TypeScript on Lovable.dev, Supabase backend, and Claude AI integration.

**Developer:** Lynn - retired Baptist minister with PhD from SWBTS, 55 years ministry experience, non-programmer solopreneur
**Target Users:** Volunteer teachers in Baptist churches
**Core Value:** Generate theologically-sound, age-appropriate Bible study lessons aligned with Baptist beliefs and distinctives as practiced in local Baptist congregations

---

## Guiding Principles

| Principle | Implementation |
|-----------|----------------|
| **Christian values guide all decisions** | Development choices honor biblical standards |
| **Admin controls boundaries** | Lynn manages all constants files; only admin can add/modify options |
| **Users select, not create** | Dropdowns populated from constants; no free-form structural input |
| **Frontend is SSOT** | Constants live in src/constants/; synced to backend via script |
| **Claude creative within bounds** | AI generates fresh content but MUST follow structure and parameters |
| **Export-ready architecture** | All logic portable; no platform-specific dependencies |

---

## Current Architecture

### Frontend
- **Platform:** Netlify (automatic GitHub deployment) — DO NOT use Lovable.dev for deployment
- **Stack:** React, TypeScript, Vite
- **UI:** Shadcn/ui components, Tailwind CSS
- **State:** React hooks, Supabase client

### Backend
- **Database:** Supabase PostgreSQL
- **AI Processing:** Supabase Edge Functions (Deno) + Anthropic Claude API (claude-sonnet-4-20250514)
- **Authentication:** Supabase Auth
- **Storage:** Supabase Storage

### Key Integrations
- Stripe (payment processing - Phase 14)
- Anthropic Claude API (lesson generation)
- Canva (design export)
- Vercel (potential deployment target)

---

## Single Source of Truth (SSOT) Architecture

### Master Vision Principle: Frontend Drives Backend

**All data definitions originate from frontend constants:**

| Frontend (MASTER) | Backend (MIRROR) | Purpose |
|-------------------|------------------|---------|
| src/constants/lessonStructure.ts | supabase/functions/_shared/lessonStructure.ts | Lesson framework (8 sections) |
| src/constants/lessonTiers.ts | supabase/functions/_shared/lessonTiers.ts | Basic/Full tier definitions |
| src/constants/ageGroups.ts | supabase/functions/_shared/ageGroups.ts | Age group definitions |
| src/constants/theologyProfiles.ts | supabase/functions/_shared/theologyProfiles.ts | 10 profiles with guardrails |
| src/constants/teacherPreferences.ts | supabase/functions/_shared/teacherPreferences.ts | Teacher customization options |
| src/constants/bibleVersions.ts | supabase/functions/_shared/bibleVersions.ts | 7 versions with copyright guardrails |
| src/constants/generationMetrics.ts | supabase/functions/_shared/generationMetrics.ts | Device/timing tracking |
| src/constants/accessControl.ts | â€” | Role definitions (frontend only) |
| src/constants/validation.ts | supabase/functions/_shared/validation.ts | Input validation rules |
| src/constants/routes.ts | supabase/functions/_shared/routes.ts | Application route definitions |
| src/config/site.ts | â€” | Site branding constants |

### SSOT Exception: Pricing

**Pricing is NOT managed via frontend constants.** See "Pricing Architecture" section below.

**Sync Process:**
```bash
npm run sync-constants
```

**Build-Time Validation:**
- Script: `scripts/sync-constants.cjs`
- Auto-generates backend mirrors with timestamps
- Prevents backend-only edits
- Maintains architectural integrity

---

## Beta Program Configuration

### Current Beta Settings

| Setting | Value |
|---------|-------|
| Rate Limit | 7 lessons per 24-hour period |
| Tier Access | Full (8 sections + teaser) for all beta testers |
| Pricing Display | Hidden - no pricing shown during beta |
| Payment Required | No - all beta testers use platform free |
| Admin Limit | Unlimited (exempt from rate limit) |

### Beta Scope

| Included in Beta | Excluded (Post-Beta) |
|------------------|----------------------|
| Individual users | Organization features |
| Full lesson generation | Organization billing |
| All theology profiles | Org leader dashboard |
| All Bible versions | Member management |
| Export (PDF/DOCX) | Lesson pool limits |
| Device/timing logging | Paid tier enforcement |

---

## Beta Feedback System

### Architecture (SSOT Compliant)

**SSOT Exception:** Feedback questions are stored in database (not frontend constants) because:
- Admin needs to modify questions without code deployment
- Questions evolve during beta based on feedback patterns
- FeedbackQuestionsManager provides UI for question management

| Layer | SSOT Location | Purpose |
|-------|---------------|---------|
| Questions | `feedback_questions` table | Question definitions, ordering, options |
| Mode/Timing | `src/constants/feedbackConfig.ts` | Beta vs production mode, trigger delays |
| Styling | `src/constants/feedbackConfig.ts` | Shared form styles, NPS button classes |
| Analytics Config | `src/constants/feedbackConfig.ts` | Summary cards, table columns, chart config |

### Database Schema

**Table:** `feedback_questions`

| Column | Type | Purpose |
|--------|------|---------|
| id | UUID | Primary key |
| question_key | TEXT | Unique identifier (e.g., 'overall_rating') |
| column_name | TEXT | Maps to `feedback` table column |
| label | TEXT | Display label |
| description | TEXT | Help text shown below question |
| placeholder | TEXT | Placeholder for textarea inputs |
| question_type | TEXT | stars, nps, select, boolean, textarea |
| options | JSONB | Options array for select types |
| is_required | BOOLEAN | Required field flag |
| min_value | INTEGER | Min value for numeric types |
| max_value | INTEGER | Max value for numeric types |
| max_length | INTEGER | Max chars for textarea |
| display_order | INTEGER | Sort order in form |
| is_active | BOOLEAN | Show/hide question |
| feedback_mode | TEXT | 'beta' or 'production' |

**RPC Function:** `get_feedback_questions(p_mode TEXT)`
- Returns questions filtered by mode
- Aliases columns to camelCase for TypeScript compatibility
- Used by `BetaFeedbackForm.tsx`

### Trigger Points

| Trigger | Behavior |
|---------|----------|
| "Give Feedback" button | Opens modal immediately |
| After lesson export | 3-second delay, then modal (configurable via FEEDBACK_TRIGGER.exportDelayMs) |

### Admin Management

**Location:** Admin Panel â†’ Beta Program tab â†’ Scroll to "Beta Feedback Questions"

**Capabilities:**
- Add new questions
- Edit existing questions (label, description, options)
- Reorder questions (drag-and-drop or display_order)
- Toggle active/inactive
- Preview question types

---

## Database Triggers & Sync Functions

### Email Synchronization (profiles.email)

**Purpose:** Keep `profiles.email` in sync with `auth.users.email` to avoid direct joins to Supabase's auth schema.

| Component | Type | Description |
|-----------|------|-------------|
| `profiles.email` | Column | User's email address, synced from auth.users |
| `sync_user_email()` | Function | Trigger function that copies email on INSERT or UPDATE |
| `on_auth_user_email_update` | Trigger | Fires on auth.users changes, calls sync function |

**Why This Exists:**
- Supabase Security Advisor flagged views joining `auth.users` as "Exposed Auth Users"
- SSOT principle: User data should live in tables we control (`profiles`), not auth schema
- Views now join `profiles.email` instead of `auth.users.email`

**Affected Views (updated December 10, 2025):**

| View | Change |
|------|--------|
| `beta_feedback_view` | Now joins `profiles.email` instead of `auth.users.email` |
| `production_feedback_view` | Now joins `profiles.email` instead of `auth.users.email` |
| `guardrail_violation_summary` | No email join (aggregates only), security_invoker added |

**Security Properties Applied:**
- All three views set to `security_invoker = true` (respects RLS)
- All database functions set with explicit `search_path = public`

---

## Current Lesson Structure (Version 2.1.2)

### Required Sections (8 sections)
1. **Lens + Lesson Overview** (150-250 words)
2. **Learning Objectives + Key Scriptures** (150-250 words)
3. **Theological Background (Deep-Dive)** (450-600 words)
4. **Opening Activities** (120-200 words)
5. **Main Teaching Content (Teacher Transcript)** (630-840 words) - SPOKEN WORDS with depth
6. **Interactive Activities** (150-250 words)
7. **Discussion & Assessment** (200-300 words)
8. **Student Handout (Standalone)** (250-400 words)

**Total Word Target:** 2,100-2,790 words

### Optional Section
9. **Student Teaser (Pre-Lesson)** (50-100 words) - Displays at top of lesson, not as Section 9

### Key Architecture Principles
- **Section 3 = ALL deep theology** (prevents redundancy)
- **Section 5 = SPOKEN classroom delivery** (what teacher actually says)
- **Section 8 = FRESH student content** (not copied from teacher sections)
- **Teaser = FELT NEEDS ONLY** (zero content revelation, time-neutral signoff)
- **No word count metadata in output**

---

## Lesson Tiers (2 Tiers)

### Tier Structure

| Tier ID | Display Name | Sections | Teaser | Word Target | Est. Time | Post-Beta Access |
|---------|--------------|----------|--------|-------------|-----------|------------------|
| `basic` | Quick Lesson | 3 (1, 5, 8) | No | 1,030-1,490 | 30-60 sec | Free users |
| `full` | Complete Lesson | 8 (all) | Yes | 2,100-2,790 | 60-90 sec | Paid users |

**Beta:** All users have Full tier access.

### Basic Tier Sections

| Section # | Name | Word Target |
|-----------|------|-------------|
| 1 | Lens + Lesson Overview | 150-250 |
| 5 | Main Teaching Content (Teacher Transcript) | 630-840 |
| 8 | Student Handout (Standalone) | 250-400 |

**Rationale:** These three sections provide the irreducible core - teacher context (1), spoken classroom delivery (5), and student takeaway (8).

### Full Tier Sections

All 8 sections as defined in Current Lesson Structure, plus optional Student Teaser.

### SSOT Location

**Master:** `src/constants/lessonTiers.ts`
**Mirror:** `supabase/functions/_shared/lessonTiers.ts`

### Post-Beta Tier Access Logic

| User Type | Frontend Role | Tier Access |
|-----------|---------------|-------------|
| Free Individual | individual | Basic only |
| Paid Individual | individual | Basic + Full (choice) |
| Org Member | orgMember | Basic + Full (shared pool) |
| Org Leader | orgLeader | Basic + Full (always) |
| Platform Admin | platformAdmin | Basic + Full (unlimited) |

---

## Pricing Architecture (Phase 14 - Post-Beta)

### SSOT Exception: Stripe as Source of Truth

**Pricing does NOT follow the "frontend drives backend" principle.**

| Principle | Standard Approach | Pricing Exception |
|-----------|-------------------|-------------------|
| SSOT Location | Frontend constants | Stripe Dashboard |
| Change Origin | Edit .ts file, deploy | Edit in Stripe |
| Sync Direction | Frontend â†’ Backend | Stripe â†’ Supabase (webhook) |
| Lynn's Workflow | Code change required | No code change needed |

### Rationale for Exception

Lynn rarely changes pricing, but when changes happen:
- Change should be made in ONE place (Stripe)
- Change should automatically reflect in LessonSparkUSA
- No manual sync to Supabase or code files required

### Pricing Data Ownership

| Data Type | SSOT Location | Managed By |
|-----------|---------------|------------|
| Plan prices | Stripe | Lynn via Stripe Dashboard |
| Plan names | Stripe | Lynn via Stripe Dashboard |
| Discounts/coupons | Stripe | Lynn via Stripe Dashboard |
| Lessons per month | Supabase | Lynn via Supabase Dashboard |
| Tier access (basic/full) | Supabase | Lynn via Supabase Dashboard |
| Features list | Supabase | Lynn via Supabase Dashboard |
| Best for description | Supabase | Lynn via Supabase Dashboard |
| Display order | Supabase | Lynn via Supabase Dashboard |

### Planned Pricing (Post-Beta Implementation)

**Individual Plans:**

| Plan | Lessons/Month | Tier Access | Monthly | Annual (2 mo. free) |
|------|---------------|-------------|---------|---------------------|
| **Free** | 5 | Basic only | $0 | â€” |
| **Personal** | 20 | Full | $9 | $90 |

**Organization Plans (Phase 13):**

| Plan | Lessons/Month | Monthly | Annual (2 mo. free) | Best For |
|------|---------------|---------|---------------------|----------|
| **Starter** | 25 | $29 | $290 | 5-8 teachers |
| **Growth** | 60 | $59 | $590 | 10-15 teachers |
| **Ministry** | 120 | $99 | $990 | 20-30 teachers |
| **Enterprise** | 250 | $179 | $1,790 | 40+ teachers |

**Organization Model:** Lesson Pool (unlimited members, shared lesson count per billing period)

### Implementation Plan (Phase 14)

| Step | Who | Action |
|------|-----|--------|
| 1 | Lynn | Create/update Stripe products and prices |
| 2 | Lynn | Note Stripe product and price IDs |
| 3 | Claude | Create `pricing_plans` table in Supabase |
| 4 | Claude | Create `stripe-webhook` Edge Function |
| 5 | Lynn | Register webhook URL in Stripe Dashboard |
| 6 | Lynn | Populate Supabase table with Stripe IDs + app data |
| 7 | Claude | Create frontend hook to read pricing from Supabase |
| 8 | Claude | Build pricing display UI |

---

## Generation Metrics Tracking

### Purpose

Track device/browser information and generation timing to:
1. Identify mobile timeout patterns
2. Inform Quick tier necessity decision (post-beta)
3. Optimize generation performance

### Tracked Data

| Category | Fields |
|----------|--------|
| **Device** | user_agent, device_type, browser, os |
| **Timing** | generation_start, generation_end, generation_duration_ms |
| **Request** | tier_requested, sections_requested, sections_generated |
| **Outcome** | status (started/completed/timeout/error), error_message |
| **Network** | connection_type |

### Valid Values (SSOT-Defined)

| Field | Valid Values |
|-------|--------------|
| device_type | mobile, tablet, desktop, unknown |
| status | started, completed, timeout, error |
| connection_type | slow-2g, 2g, 3g, 4g, wifi, ethernet, unknown |

### SSOT Location

**Master:** `src/constants/generationMetrics.ts`
**Mirror:** `supabase/functions/_shared/generationMetrics.ts`

### Database Table

**Table:** `generation_metrics` (to be created)
**RLS:** Users view own; Service role insert/update; Admin view all

### Admin Views (Planned)

- `generation_metrics_summary` - Aggregated stats by device/tier/status
- `mobile_timeout_analysis` - 30-day mobile timeout patterns

---

## Bible Versions (7 Versions with Copyright Guardrails)

### Available Bible Versions

| # | ID | Name | Abbreviation | Copyright Status |
|---|-----|------|--------------|------------------|
| 1 | `kjv` | King James Version | KJV | Public Domain |
| 2 | `nkjv` | New King James Version | NKJV | Copyrighted |
| 3 | `nasb` | New American Standard Bible | NASB | Copyrighted |
| 4 | `esv` | English Standard Version | ESV | Copyrighted |
| 5 | `niv` | New International Version | NIV | Copyrighted |
| 6 | `csb` | Christian Standard Bible | CSB | Copyrighted |
| 7 | `web` | World English Bible | WEB | Public Domain |

### Copyright Guardrails System

| Copyright Status | AI Behavior |
|------------------|-------------|
| **Public Domain** (KJV, WEB) | Direct Scripture quotation permitted |
| **Copyrighted** (NKJV, NASB, ESV, NIV, CSB) | Paraphrase only with verse references |

### SSOT Location: `src/constants/bibleVersions.ts`

**Structure:**
```typescript
interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  copyrightStatus: 'public_domain' | 'copyrighted';
  description: string;
  displayOrder: number;
  isDefault: boolean;
}
```

### Helper Functions (SSOT-compliant)

| Function | Purpose |
|----------|---------|
| `getBibleVersion(id)` | Get single version by ID |
| `getDefaultBibleVersion()` | Returns KJV (default) |
| `getBibleVersionsSorted()` | Returns versions in displayOrder |
| `generateCopyrightGuardrails(versionId)` | Generates copyright rules for AI prompt |

---

## Theology Profiles (10 Profiles with Guardrails)

### Available Profiles

| # | Profile ID | Display Name | Default |
|---|------------|--------------|---------|
| 1 | `baptist-core-beliefs` | Baptist Core Beliefs | YES |
| 2 | `southern-baptist-bfm-1963` | Southern Baptist (BF&M 1963) | |
| 3 | `southern-baptist-bfm-2000` | Southern Baptist (BF&M 2000) | |
| 4 | `national-baptist-convention` | National Baptist Convention (USA) | |
| 5 | `independent-baptist` | Independent Baptist | |
| 6 | `missionary-baptist` | Missionary Baptist | |
| 7 | `general-baptist` | General Baptist | |
| 8 | `free-will-baptist` | Free Will Baptist | |
| 9 | `primitive-baptist` | Primitive Baptist | |
| 10 | `reformed-baptist` | Reformed Baptist | |

### Theological Stance Categories

| Category | Profiles |
|----------|----------|
| **Anti-TULIP** (8) | Baptist Core, SBC 1963, SBC 2000, National, Independent, Missionary, General, Free Will |
| **Pro-TULIP** (2) | Reformed Baptist, Primitive Baptist |

### Security Doctrine Categories

| Doctrine | Profiles |
|----------|----------|
| **Eternal Security** | Baptist Core, SBC 1963, SBC 2000, National, Independent, Missionary, General |
| **Conditional Security** | Free Will Baptist |
| **Perseverance of Saints** | Reformed Baptist, Primitive Baptist |

### SSOT Location: `src/constants/theologyProfiles.ts`

---

## Age Groups (11 groups)

1. Preschoolers (Ages 3-5)
2. Elementary Kids (Ages 6-10)
3. Preteens & Middle Schoolers (Ages 11-14)
4. High School Students (Ages 15-18)
5. College & Early Career (Ages 19-25)
6. Young Adults (Ages 26-35)
7. Mid-Life Adults (Ages 36-50)
8. Experienced Adults (Ages 51-65)
9. Active Seniors (Ages 66-75)
10. Senior Adults (Ages 76+)
11. Mixed Groups (Multi-generational)

Each includes: vocabulary level, conceptual depth, teaching profile, description

---

## Teacher Customization (13 preference fields)

### SSOT Location: `src/constants/teacherPreferences.ts`

| # | Field | Options |
|---|-------|---------|
| 1 | Teaching Style | 7 options (incl. Socratic Method with tooltip) |
| 2 | Learning Style | 4 options |
| 3 | Lesson Length | 6 options (15, 30, 45, 60, 75, 90 minutes) |
| 4 | Group Size | 5 options |
| 5 | Learning Environment | 4 options |
| 6 | Student Experience Level | 4 options |
| 7 | Education Experience | 5 options (incl. Preschool) |
| 8 | Cultural Context | 3 options |
| 9 | Special Needs | 6 options |
| 10 | Lesson Sequence | 2 options: Single Lesson, Part of Series |
| 11 | Assessment Style | 4 options |
| 12 | Language | 3 options: English, Spanish, French |
| 13 | Activity Types | 7 checkboxes |

All preferences dynamically inserted into AI prompt generation.

---

## Development Protocols

### Claude Debugging Protocol
1. **Root-cause diagnosis BEFORE solutions**
2. **Complete solutions over piecemeal fixes**
3. **Verify file changes before proceeding**
4. **Explicit permission required for code changes**
5. **Copy-paste ready PowerShell commands**

### File Update Process
1. Present complete file contents
2. Provide PowerShell Set-Content command
3. Await user confirmation before next step
4. Build and test after changes

### Deployment Process
```bash
# Frontend
npm run build
npm run dev

# Backend (Edge Functions)
npx supabase functions deploy generate-lesson --project-ref hphebzdftpjbiudpfcrs

# Constants Sync
npm run sync-constants
```

---

## Project Status

**Current Phase:** Phase 13 (SSOT Compliance Complete)
**Overall Completion:** ~97% (Core product + feedback + security ready)
**Production Readiness:** Beta (Individual users, no payment)

### Phase 12 Summary

| Task | Status |
|------|--------|
| Teacher Preference Profiles | âœ… Complete |
| Auth Bug Fixes | âœ… Complete |
| UI Improvements (Create Lesson 3-step cards) | âœ… Complete |
| Prompt Caching Implementation | âœ… Complete |
| 10 Theology Profiles with Guardrails | âœ… Complete |
| SSOT Compliance Audit & Fixes | âœ… Complete |
| Filter Matching Bug Fix | âœ… Complete |
| Edge Function Guardrails Integration | âœ… Complete |
| Bible Version Selection with Copyright Guardrails | âœ… Complete |
| Security Advisor Clean (0 errors, 0 warnings) | âœ… Complete |
| Mobile Responsiveness Audit (30+ files) | âœ… Complete |
| Guardrail Violation Logging System | âœ… Complete |
| Admin Panel Guardrails Tab | âœ… Complete |
| Email SMTP Configuration | âœ… Complete |
| Password Validation SSOT | âœ… Complete |
| Forgot Password Flow | âœ… Complete |
| Beta Feedback System (Database-driven) | âœ… Complete |
| FeedbackQuestionsManager Admin | âœ… Complete |
| Security Advisor Fixes (0 errors, 0 warnings) | âœ… Complete |
| Lesson Tiers SSOT | ðŸ”„ In Progress |
| Generation Metrics SSOT | ðŸ”„ In Progress |
| Beta Tester Onboarding | ðŸ”„ In Progress |

---

## Key Files Reference

### Frontend Constants (MASTER)

| File | Purpose |
|------|---------|
| src/constants/lessonStructure.ts | Lesson framework (8 sections) |
| src/constants/lessonTiers.ts | Basic/Full tier definitions |
| src/constants/ageGroups.ts | Age group definitions |
| src/constants/theologyProfiles.ts | 10 profiles with guardrails |
| src/constants/teacherPreferences.ts | Teacher customization options |
| src/constants/bibleVersions.ts | 7 versions with copyright guardrails |
| src/constants/generationMetrics.ts | Device/timing tracking |
| src/constants/feedbackConfig.ts | Beta feedback mode, timing, styling, analytics |
| src/constants/accessControl.ts | Role definitions and mapping |
| src/constants/validation.ts | Input validation rules |
| src/constants/routes.ts | Application route definitions |
| src/config/site.ts | Site branding constants |
| src/lib/fileValidation.ts | File upload validation |

### Backend Mirrors (AUTO-GENERATED)

| File | Purpose |
|------|---------|
| supabase/functions/_shared/lessonStructure.ts | Lesson framework mirror |
| supabase/functions/_shared/lessonTiers.ts | Tier definitions mirror |
| supabase/functions/_shared/ageGroups.ts | Age groups mirror |
| supabase/functions/_shared/theologyProfiles.ts | Theology profiles + guardrails mirror |
| supabase/functions/_shared/bibleVersions.ts | Bible versions + copyright guardrails mirror |
| supabase/functions/_shared/generationMetrics.ts | Metrics tracking mirror |
| supabase/functions/_shared/validation.ts | Validation rules mirror |
| supabase/functions/_shared/routes.ts | Routes mirror |

### Core Components

| File | Purpose |
|------|---------|
| src/components/dashboard/EnhanceLessonForm.tsx | Profile/age summaries, Bible version dropdown, 3-step cards |
| src/components/dashboard/LessonLibrary.tsx | SSOT badge colors, snake_case filters |
| src/components/dashboard/LessonExportButtons.tsx | Export functionality |
| src/components/dashboard/TeacherCustomization.tsx | "None" option, profile management |
| src/components/landing/FeaturesSection.tsx | 10 theology profiles with mobile popovers |

### Admin Components

| File | Purpose |
|------|---------|
| src/pages/Admin.tsx | Admin panel with 8 tabs including Guardrails |
| src/components/admin/GuardrailViolationsPanel.tsx | Violation monitoring dashboard |
| src/components/admin/FeedbackQuestionsManager.tsx | Beta feedback questions CRUD |
| src/components/admin/UserManagement.tsx | User management |
| src/components/admin/OrganizationManagement.tsx | Organization management |
| src/components/admin/PricingPlansManager.tsx | Pricing plans management |
| src/components/analytics/BetaAnalyticsDashboard.tsx | Beta analytics |

### Edge Functions

| File | Purpose |
|------|---------|
| supabase/functions/generate-lesson/index.ts | Lesson generation with guardrails |
| supabase/functions/extract-lesson/index.ts | File extraction |
| supabase/functions/send-invite/index.ts | Invite emails |
| supabase/functions/setup-lynn-admin/index.ts | Admin setup |

---

## Admin Panel Tabs (8 Tabs)

| Tab | Icon | Component | Status |
|-----|------|-----------|--------|
| User Management | Users | UserManagement | Active |
| Organizations | Building2 | OrganizationManagement | Active |
| Beta Program | Rocket | BetaAnalyticsDashboard | Active |
| Pricing & Plans | DollarSign | PricingPlansManager | Active |
| Guardrails | ShieldAlert | GuardrailViolationsPanel | Active |
| System Analytics | BarChart3 | Placeholder | Coming Soon |
| System Settings | Settings | Placeholder | Coming Soon |
| Security | Shield | Placeholder | Coming Soon |

---

## Technical Debt Backlog

| Item | Priority | Status |
|------|----------|--------|
| SSOT Compliance Audit (see below) | HIGH | Post-Beta |
| Security Monitoring & Logging | LOW | Deferred |
| Failed Access Logging | LOW | Deferred |
| Frontend warning toast for guardrail violations | MEDIUM | Pending |
| System Analytics dashboard implementation | MEDIUM | Pending |
| System Settings panel implementation | LOW | Deferred |
| Quick Tier evaluation (post-beta data) | MEDIUM | Pending beta data |

---

## SSOT Compliance Audit (December 7, 2025)

**Status:** DOCUMENTED - Do NOT fix during beta (risk of disruption)

### Finding 1: Backend Files Without Frontend MASTER

These files exist in `supabase/functions/_shared/` but have no frontend source in `src/constants/`:

| Backend File | Risk Level | Action Needed |
|--------------|------------|---------------|
| customizationDirectives.ts | MEDIUM | Investigate: Move to frontend or delete |
| rateLimit.ts | HIGH | Investigate: Actively used by generate-lesson |
| theologicalPreferences.ts | MEDIUM | Delete after verifying no imports |

**Violation:** These files originated in backend, violating "frontend drives backend" principle.

### Finding 2: Frontend Files NOT in Sync Script

These files exist in `src/constants/` but are NOT in `sync-constants.cjs`:

| Frontend File | Backend Exists? | Risk Level | Action Needed |
|---------------|-----------------|------------|---------------|
| contracts.ts | Yes | MEDIUM | Add to sync after comparing versions |
| validation.ts | Yes | HIGH | Compare versions before syncing |
| routes.ts | Yes | MEDIUM | Add to sync after comparing versions |
| programConfig.ts | No | LOW | Determine if backend mirror needed |

**Violation:** Backend versions may have diverged from frontend. Sync would overwrite.

### Finding 3: Hardcoded Values in Edge Functions

| File | Hardcoded Value | Should Import From |
|------|-----------------|-------------------|
| setup-lynn-admin/index.ts | validRoles = ['admin', 'teacher', 'moderator'] | accessControl.ts |

**Violation:** Role definitions defined in backend, not imported from SSOT.

### Current Sync Script Coverage

**Files in sync-constants.cjs (7 files):**
- ageGroups.ts
- bibleVersions.ts
- generationMetrics.ts
- lessonStructure.ts
- lessonTiers.ts
- teacherPreferences.ts
- theologyProfiles.ts

**Files NOT in sync (need investigation):**
- contracts.ts
- validation.ts
- routes.ts
- programConfig.ts (may not need backend mirror)

### Post-Beta Remediation Plan

| Step | Action | Risk Mitigation |
|------|--------|-----------------|
| 1 | Compare frontend/backend validation.ts line-by-line | Document differences |
| 2 | Compare frontend/backend routes.ts line-by-line | Document differences |
| 3 | Compare frontend/backend contracts.ts line-by-line | Document differences |
| 4 | Check all Edge Function imports for theologicalPreferences.ts | Grep for imports |
| 5 | Decide: Move rateLimit.ts to frontend or document exception | Architectural decision |
| 6 | Decide: Move customizationDirectives.ts to frontend or delete | Architectural decision |
| 7 | Add verified files to sync-constants.cjs | One at a time with testing |
| 8 | Remove theologicalPreferences.ts if no imports found | After verification |
| 9 | Refactor hardcoded arrays to use SSOT imports | Edge Function updates |

### Why NOT Fix During Beta

1. **rateLimit.ts** - Actively controls lesson limits. Breaking this disrupts all users.
2. **validation.ts** - Backend may have validation logic not in frontend. Overwriting breaks Edge Function.
3. **System is working** - These are architectural issues, not functional bugs.
4. **Risk vs. Reward** - High risk of disruption, zero user-facing benefit.
## Contact & Support

**Developer:** Lynn (Nacogdoches, Texas)
**Repository Path:** C:\Users\Lynn\lesson-spark-usa
**Documentation:** This file (PROJECT_MASTER.md)

---

## Debugging Resources

### Supabase Dashboard
- **Project ID:** hphebzdftpjbiudpfcrs
- **Functions:** https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/functions
- **Logs:** https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/logs
- **Security Advisor:** https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/advisors/security

### GitHub
- **Repository:** https://github.com/lynn75965/lesson-spark-usa

### Production
- **Domain:** https://lessonsparkusa.com
- **Hosting:** Netlify (auto-deploy from GitHub)

---

## Supported File Types

### Curriculum Upload
- **PDF** - Claude Sonnet 4 document API (60-90 seconds)
- **TXT** - Direct read (less than 1 second)
- **JPG/JPEG/PNG** - Claude Sonnet 4 vision API (15-30 seconds)
- **DOCX** - Not supported (save as PDF)

### Export Formats
- **PDF** - Supported
- **DOCX** - Supported
- **Print** - Supported

---

# PHASE HISTORY

---

## Phase 7: AI Output & Export (November 2025) - COMPLETE

### AI Output Quality Improvements
- **Section 5 Enforcement:** 630-840 word minimum with depth requirements
- **Student Teaser:** Time-neutral signoff, felt-needs only, displays at top
- **No Word Counts:** Removed from section headers
- **No Section 9 Duplication:** Teaser extracted and displayed separately

### Export Features
- **PDF Export:** Calibri 11pt, compact professional spacing, correct title extraction
- **DOCX Export:** Renamed "Document (editable)", correct parameters
- **Print Function:** Calibri 11pt, 1.5 line spacing, 1-inch margins

---

## Phase 8: Security Audit & Hardening (November 25, 2025) - 90% COMPLETE

**Status:** 9 of 10 security domains completed

### Security Domains Completed
- 8.1 API Key & Secrets Management
- 8.2 Row Level Security (RLS) Policies
- 8.3 Edge Function Authentication
- 8.4 Authentication Hardening
- 8.5 Input Validation & Sanitization
- 8.6 Rate Limiting & Abuse Prevention
- 8.7 Data Privacy & Compliance
- 8.8 CORS & Domain Security
- 8.9 Backup & Disaster Recovery
- 8.10 Security Monitoring & Logging - DEFERRED

---

## Phase 9: Beta Testing & User Feedback (November 25, 2025) - COMPLETE

### Rate Limiting Feature
- Beta testers: 7 lessons per 24-hour period
- Admin exempt (unlimited)
- Display: "X of 7 lessons used (resets in Y hours)"
- At limit: Red banner, Generate button disabled

---

## Phase 10: RLS Policy Standardization (November 30, 2025) - COMPLETE

- Dropped all 80 existing `{public}` role policies
- Created 66 new SSOT-aligned policies across 22 tables
- All policies now use `authenticated` or `service_role`

---

## Phase 11: Org Leader Activation (November 30 - December 1, 2025) - COMPLETE

- Search Path Security Hardening
- File Extraction Pipeline (PDF, TXT, JPG, PNG)
- Members Tab & Invite System

---

## Phase 12: Teacher Profiles & UX Improvements (December 2-7, 2025) - IN PROGRESS

### Session 1-6: Core Improvements
- PDF Extraction Bug Fix (Claude API)
- Text Paste Input Option
- Teacher Preference Profiles System (up to 7 profiles)
- UI Redesign (3-step cards)
- Prompt Caching Implementation
- My Lesson Library Improvements

### Session 7: Theological Guardrails & SSOT Compliance
- 10 Theology Profiles with Complete Guardrails
- Edge Function Integration
- SSOT Compliance Fixes

### Session 8: Bible Version Selection with Copyright Guardrails
- 7 Bible Versions with copyright detection
- Public domain: direct quotation
- Copyrighted: paraphrase only

### Session 9: Mobile Responsiveness Audit
- 30+ files updated for mobile compatibility

### Session 10: Guardrail Violation Logging System
- Database table and admin panel for violation monitoring

### Session 11: Email Infrastructure & Invite System Fixes
- Google Workspace + Resend SMTP configuration
- Invite system bug fix

### Session 12: Auth Improvements & SSOT Compliance
- PreferencesLens SSOT fix
- Email support button fixes
- Password validation SSOT
- Forgot password flow

### Session 12 Continued: Mobile Timeout & Tier Strategy (December 7, 2025)

**Decisions Made:**

| Decision | Outcome |
|----------|---------|
| Tier Structure | 2 tiers: Basic (3 sections) + Full (8 sections) |
| Quick Tier | DEFERRED - evaluate after beta mobile testing data |
| Basic Sections | 1 (Overview), 5 (Teaching), 8 (Handout) |
| Logging Approach | New `generation_metrics` table for device/timing data |
| Org Pricing Model | Lesson Pool (unlimited members, shared count) |
| Beta Scope | Individuals only; Organizations deferred to Phase 13 |
| Pricing Implementation | Deferred to Phase 14 (post-beta) |
| Pricing Architecture | Stripe as SSOT, webhook sync to Supabase |

**SSOT Constants to Create:**

| File | Purpose | Status |
|------|---------|--------|
| src/constants/lessonTiers.ts | Basic/Full tier definitions | Ready |
| src/constants/generationMetrics.ts | Device/timing tracking enums | Ready |

**NOT Creating (Deferred to Phase 14):**
- `src/constants/pricingPlans.ts` - Pricing managed via Stripe + Supabase

### Session 13: Beta Feedback System (December 9, 2025) - COMPLETE

**Database-Driven Beta Survey Implementation:**

| Component | Description |
|-----------|-------------|
| Database Table | `feedback_questions` - stores all survey questions |
| RPC Function | `get_feedback_questions(p_mode)` - returns questions with camelCase aliases |
| Form Component | `BetaFeedbackForm.tsx` - fetches questions dynamically from database |
| Modal Wrapper | `BetaFeedbackModal.tsx` - SSOT wrapper for form display |
| Admin Manager | `FeedbackQuestionsManager.tsx` - add/edit/reorder questions |
| Config SSOT | `src/constants/feedbackConfig.ts` - mode, timing, styling |

**Beta Survey Questions (9 questions):**

| # | Question Key | Type | Required |
|---|--------------|------|----------|
| 1 | overall_rating | stars (1-5) | Yes |
| 2 | ease_of_use | select | Yes |
| 3 | lesson_quality | select | Yes |
| 4 | time_saved | select | No |
| 5 | nps_score | NPS (0-10) | Yes |
| 6 | would_pay | select | Yes |
| 7 | best_feature | textarea | No |
| 8 | improvements | textarea | No |
| 9 | ui_issues | textarea | No |

**SSOT Architecture:**

| Layer | SSOT Location | Purpose |
|-------|---------------|---------|
| Questions | `feedback_questions` table (database) | Question definitions, ordering, options |
| Mode/Timing | `src/constants/feedbackConfig.ts` | Beta vs production mode, trigger delays |
| Styling | `src/constants/feedbackConfig.ts` | Shared form styles, NPS button classes |
| Analytics | `src/constants/feedbackConfig.ts` | Summary cards, table columns, chart config |

**Trigger Points:**
- Floating "Give Feedback" button (bottom-right of Dashboard)
- 3-second delay after any lesson export (Copy, Print, Download)

**SSOT Fixes Applied:**
- Unified to single `showBetaFeedbackModal` state in Dashboard
- Removed duplicate modal in BetaFeedbackButton
- BetaFeedbackButton accepts `onClick` prop instead of containing modal
- Export delay configured in `feedbackConfig.ts` (FEEDBACK_TRIGGER.exportDelayMs)

**UX Improvements:**
- Responsive NPS buttons (single row desktop, 2 rows mobile)
- Removed "Not at all likely" label, kept only "Extremely likely"
- 3-second delay after export before feedback modal appears

### Session 14: Security Advisor Fixes (December 10, 2025) - COMPLETE

**Issue:** Supabase Security Advisor flagged 5 errors (sent monthly alert email)
- 2x "Exposed Auth Users" â€” views joining `auth.users` directly
- 3x "Security Definer View" â€” views bypassing RLS

**Resolution:**

| Step | Action |
|------|--------|
| 1 | Added `email` column to `profiles` table |
| 2 | Created `sync_user_email()` trigger function |
| 3 | Created `on_auth_user_email_update` trigger on `auth.users` |
| 4 | Backfilled existing profiles with email from auth.users |
| 5 | Recreated `beta_feedback_view` to join `profiles` instead of `auth.users` |
| 6 | Recreated `production_feedback_view` to join `profiles` instead of `auth.users` |
| 7 | Recreated `guardrail_violation_summary` (no auth.users reference) |
| 8 | Set all three views to `security_invoker = true` |
| 9 | Set 7 flagged functions to explicit `search_path = public` |

**Functions with search_path fixed:**

| Function | Signature |
|----------|-----------|
| `sync_user_email` | () |
| `update_feedback_questions_timestamp` | () |
| `get_all_feedback_questions` | (p_mode text) |
| `get_feedback_questions` | (p_mode text) |
| `get_beta_feedback_analytics` | (p_start_date timestamptz, p_end_date timestamptz) |
| `get_production_feedback_analytics` | (p_start_date timestamptz, p_end_date timestamptz) |
| `get_feedback_analytics` | (p_mode text, p_start_date timestamptz, p_end_date timestamptz) |

**Result:** 0 errors, 0 warnings in Security Advisor

**SSOT Impact:**
- `profiles` table now includes `email` column (synced automatically from auth.users)
- Frontend/backend code should reference `profiles.email`, not `auth.users.email`
- Email sync is automatic via database trigger (no code changes needed)

### Session 15: SSOT Compliance Audit & Lesson Formatting (December 11-12, 2025) - COMPLETE

**Objective:** Comprehensive audit and remediation of SSOT violations across codebase

**SSOT Violations Found & Fixed:**

| Violation Type | Files Affected | Resolution |
|----------------|----------------|------------|
| Duplicate type definitions | 4 files | Centralized in contracts.ts |
| Hardcoded theology options | 3 files | Import from theologyProfiles.ts |
| Hardcoded age groups | 2 files | Import from ageGroups.ts |
| Duplicate formatting logic | 2 files | Centralized in formatLessonContent.ts |

**New SSOT Source Files Created:**

| File | Purpose | Consumers |
|------|---------|-----------|
| src/constants/contracts.ts | Type definitions (Lesson, Organization, OrganizationMember) | useLessons, useOrganization, AllLessonsPanel, OrganizationManagement |
| src/utils/formatLessonContent.ts | Lesson content HTML formatting | AllLessonsPanel, LessonExportButtons, EnhanceLessonForm |

**formatLessonContent.ts Exports:**

| Export | Purpose |
|--------|---------|
| formatLessonContentToHtml() | Convert markdown to HTML (screen display) |
| formatLessonContentForPrint() | Convert markdown to HTML (print/export) |
| LESSON_CONTENT_CONTAINER_CLASSES | Tailwind classes for content wrapper |
| LESSON_CONTENT_CONTAINER_STYLES | Inline styles for scrollbar customization |

**Key Features of formatLessonContent.ts:**
- Normalizes line endings (Windows \r\n to Unix \n)
- Pre-processes AI content lacking line breaks
- Converts ## headers, **bold**, --- rules to HTML
- Supports both screen display (Tailwind) and print (inline styles)

**Commits (8 total):**

| Commit | Description |
|--------|-------------|
| e5b0d9d | Centralize lesson formatting in shared utility |
| f588951 | Organization components use THEOLOGY_PROFILE_OPTIONS |
| 8aa26f4 | Age groups use AGE_GROUPS constant |
| 06a7639 | BetaSignup uses THEOLOGY_PROFILE_OPTIONS |
| 93e21b5 | OrganizationManagement imports Organization from contracts |
| 9442183 | Add line ending normalization to lesson formatting |
| b83113d | Handle AI content lacking line breaks |
| 6e6b384 | Apply lesson content container classes and type imports |

**Files Modified (10 total):**
- src/constants/contracts.ts
- src/utils/formatLessonContent.ts
- src/hooks/useLessons.tsx
- src/hooks/useOrganization.tsx
- src/components/admin/AllLessonsPanel.tsx
- src/components/admin/OrganizationManagement.tsx
- src/components/dashboard/LessonExportButtons.tsx
- src/components/dashboard/OrganizationSettingsModal.tsx
- src/components/organization/OrganizationSetup.tsx
- src/pages/BetaSignup.tsx

**Deployment Architecture Confirmed:**

| Stage | System |
|-------|--------|
| Local Development | C:\Users\Lynn\lesson-spark-usa |
| Version Control | GitHub (lynn75965/lesson-spark-usa) |
| Deployment | Netlify (automatic from main branch) |
| Production | lessonsparkusa.com |

**CRITICAL:** DO NOT use Lovable.dev for deployment or editing - causes unauthorized code modifications.

**Lesson Learned:**
- Always run git status after modifications to verify all files are staged
- Never assume code is deployed without checking Netlify dashboard
- Include verification commands after every change

---

## Phase 13: Organization Features (Post-Beta) - PLANNED

**Status:** Deferred until beta feedback stabilizes core product

**Prerequisites:**
- Beta testing complete with individual users
- Mobile timeout data analyzed
- Core lesson generation stable

### Phase 13.1: Organization Database Schema
- Add org subscription fields
- Add billing period tracking
- Add subscription status

### Phase 13.2: Stripe Organization Integration
- Create org products in Stripe (Starter, Growth, Ministry, Enterprise)
- Org checkout flow
- Webhook handling

### Phase 13.3: Organization Creation Flow
- Self-service org creation
- Plan selection based on teacher count

### Phase 13.4: Organization Leader Dashboard
- Usage tracker
- Member management
- Invite system
- Billing management

### Phase 13.5: Organization Member Experience
- Org context display
- Pool awareness
- Limit warnings

### Phase 13.6: Lesson Pool Tracking
- Count lessons by org
- Reset on billing period
- Enforce limits

**Estimated Effort:** 18-26 hours

### Phase 13.7: Organization Beta Phase Infrastructure (Approved 2025-12-11)

**Purpose:** Allow Org Leaders to run pilot programs when first launching their organization, with Admin-controlled activation.

**Design Principle:** Reuse platform beta infrastructure at organization scope. Admin controls activation; Org Leader views analytics.

#### Database Schema Additions

**organizations table additions:**
| Column | Type | Purpose |
|--------|------|---------|
| beta_mode | BOOLEAN DEFAULT false | Is org currently in beta phase? |
| beta_start_date | TIMESTAMPTZ | When beta was activated |
| beta_end_date | TIMESTAMPTZ | When beta ended (or scheduled end) |
| beta_activated_by | UUID FK profiles | Admin who enabled beta mode |

**organization_members table additions:**
| Column | Type | Purpose |
|--------|------|---------|
| joined_during_beta | BOOLEAN DEFAULT false | Auto-set true if org.beta_mode = true at join time |

#### Access Control

| Feature | Allowed Roles | Notes |
|---------|---------------|-------|
| activateOrgBeta | platformAdmin | Only Admin can enable |
| deactivateOrgBeta | platformAdmin | Only Admin can disable |
| viewOrgBetaAnalytics | platformAdmin, orgLeader | Both can view org-scoped analytics |

#### Component Reusability

| Component | Platform Beta | Org Beta | Modification |
|-----------|---------------|----------|--------------|
| feedbackConfig.ts | âœ… | âœ… | Add scope parameter |
| BetaAnalyticsDashboard.tsx | âœ… | âœ… | Add org_id filter prop |
| feedback_questions table | âœ… | âœ… | Add scope column |
| beta_feedback_view | âœ… | âœ… | Add org join condition |
| Summary card definitions | âœ… | âœ… | No change needed |

#### Admin Workflow
```
Admin Panel â†’ Organizations â†’ [Org Name] â†’ Actions â†’ Enable Beta Mode
```

This sets:
- organizations.beta_mode = true
- organizations.beta_start_date = now()
- organizations.beta_activated_by = admin user id

New members joining while beta_mode = true automatically get:
- organization_members.joined_during_beta = true

#### Org Leader Workflow

When org beta is active, Org Leader sees:
- "Org Beta Analytics" tab in their dashboard
- Metrics scoped to their organization only
- Feedback from their org members only

#### Grandfathering Support

`joined_during_beta = true` persists after org beta ends, enabling:
- Recognition of early adopters within organization
- Potential org-level loyalty discounts
- Testimonial identification

#### Transition Command

Admin ends org beta via:
```
Admin Panel â†’ Organizations â†’ [Org Name] â†’ Actions â†’ End Beta Mode
```

This sets:
- organizations.beta_mode = false
- organizations.beta_end_date = now()

Members retain joined_during_beta = true for historical tracking.

**Estimated Effort:** 4-6 hours (leverages platform beta infrastructure)

**Dependencies:** Phase 13.1-13.6 must be complete (organization tables exist)

### Phase 13.8: Context-Based Navigation Architecture (Approved 2025-12-11)

**Purpose:** Establish three distinct contexts with dedicated routes, eliminating current Dashboard conflation.

**Terminology Standards:**
| Code Constant | Display Name | Scope |
|---------------|--------------|-------|
| platformAdmin | Administrator | Platform-wide (Lynn only) |
| orgLeader | Organization Manager | Organization-scoped |
| orgMember | Organization Member | Org context, personal lessons |
| individual | Individual User | Personal scope only |

**Route Architecture:**
| Route | Name | Access | Data Scope |
|-------|------|--------|------------|
| /admin | Administrator Panel | Administrator only | All platform data |
| /org | Organization Manager | Org Managers + Administrator | Org-scoped data |
| /workspace | My Workspace | All authenticated users | Personal data only |

**Header Navigation by Role:**

*Administrator:*
- Administrator Panel -> /admin
- Organization Manager -> /org
- My Workspace -> /workspace
- Settings -> /account

*Organization Manager (non-admin):*
- Organization Manager -> /org
- My Workspace -> /workspace
- Settings -> /account

*Individual User:*
- My Workspace -> /workspace
- Settings -> /account

**Data Scoping Matrix:**
| Context | Lessons | Members | Analytics | Settings |
|---------|---------|---------|-----------|----------|
| Administrator Panel | All platform | All users | Platform-wide | System |
| Organization Manager | Org only | Org members | Org-scoped | Org settings |
| My Workspace | My lessons | None | Personal stats | My preferences |

**Implementation Tasks:**

**13.8.1:** Create src/constants/navigationConfig.ts (SSOT for menu items by role)

**13.8.2:** Refactor /dashboard to /workspace (personal-only view)

**13.8.3:** Create Organization Manager page at /org

**13.8.4:** Update Header.tsx to use navigationConfig.ts

**13.8.5:** Add redirect /dashboard -> /workspace for backward compatibility

**Estimated Effort:** 8-12 hours


### Phase 13.9: Admin Organization Drill-Down (Approved 2025-12-11)

**Purpose:** Enable Platform Admin to access ALL organization data (members, lessons, analytics) directly from Admin Panel Organizations tab via drill-down interface.

**Principle:** Admin Panel = Universal Access. Platform Admin can perform ANY operation without navigating elsewhere.

**Drill-Down Structure:**
- Organizations Tab (default): Table of all orgs
- Click org row ? Org Detail View with sub-tabs:
  - **Details:** Edit name, denomination, status, description
  - **Members:** View all, add ANY user, remove ANY user, change roles
  - **Lessons:** View metadata AND full content, edit capability
  - **Analytics:** Org-scoped metrics (lesson count, active users, etc.)

**Implementation Tasks:**
- **13.9.1:** Add drill-down state management to OrganizationManagement.tsx
- **13.9.2:** Create OrgDetailView component with sub-tabs
- **13.9.3:** Adapt OrgMemberManagement for admin context (add any user to org)
- **13.9.4:** Create OrgLessonsPanel (metadata table + view/edit modal)
- **13.9.5:** Create OrgAnalyticsPanel (org-scoped metrics)

**Estimated Effort:** 6-10 hours
**Dependencies:** Can implement navigation structure immediately; Org Manager content builds incrementally

---

## Phase 14: Pricing & Billing Implementation (Post-Beta) - PLANNED

**Status:** Deferred until after Phase 13

### Phase 14.1: Stripe Setup
- Create/update individual products (Free, Personal)
- Create monthly and annual prices
- Note all Stripe IDs

### Phase 14.2: Supabase Pricing Table
- Create `pricing_plans` table
- Columns for Stripe IDs (synced via webhook)
- Columns for app data (lessons_per_month, tier_access, features)

### Phase 14.3: Stripe Webhook
- Create `stripe-webhook` Edge Function
- Handle price.updated, product.updated events
- Auto-sync changes to Supabase

### Phase 14.4: Frontend Pricing Display
- Create `usePricingPlans()` hook (reads from Supabase)
- Update pricing page to use dynamic data
- Remove any hardcoded prices

### Phase 14.5: Checkout Integration
- Connect tier selection to Stripe checkout
- Handle successful payment
- Update user subscription status

**Estimated Effort:** 8-12 hours

---

# ACTION ITEMS

## Immediate (Beta Launch)

| Task | Priority | Status |
|------|----------|--------|
| Create lessonTiers.ts SSOT | HIGH | Ready |
| Create generationMetrics.ts SSOT | HIGH | Ready |
| Update sync-constants.cjs | HIGH | Pending |
| Create generation_metrics table | MEDIUM | Pending (after SSOT) |
| Beta tester onboarding | HIGH | In Progress |

## Post-Beta

| Task | Priority | Phase |
|------|----------|-------|
| Analyze mobile timeout data | HIGH | Post-Beta |
| Decide on Quick tier necessity | MEDIUM | Post-Beta |
| Organization features | HIGH | Phase 13 |
| Stripe pricing setup | HIGH | Phase 14 |
| Pricing webhook integration | HIGH | Phase 14 |

---

## Phase 15: Perpetual Freshness - PLANNED

**Status:** Deferred until core features stabilized

**Purpose:** Ensure every lesson generation produces meaningfully different content, even for the same passage with the same settings. Prevent stale, repetitive outputs.

### Three-Tier Architecture Context

| Tier | Name | Freshness Impact |
|------|------|------------------|
| Tier 1 | Foundational Structure | None - intentionally stable (section names, order, word budgets) |
| Tier 2 | User Customizations | Some variation - different age/theology produces different output |
| Tier 3 | Perpetual Freshness | Claude generates creative content WITHIN Tier 1 structure |

**Principle:** Same structure, fresh content every time.

### Phase 15.1: Freshen Up User Control

- Add "Freshen Up" checkbox to lesson generation form
- Default: OFF (standard generation)
- When ON: Claude explicitly varies approach
- Store preference in user profile (optional persistence)

### Phase 15.2: Varied Content Elements

Instruct Claude to vary these elements across generations:

| Element | Variation Approach |
|---------|-------------------|
| Illustrations/Stories | Different examples for same theological point |
| Teaching Angles | Rotate: evangelistic, discipleship, apologetic, narrative |
| Activity Types | Different activities for same learning objective |
| Opening Hooks | Varied introductions (question, story, statistic, quote) |
| Application Examples | Different real-world scenarios |

### Phase 15.3: Contextual Awareness

- **Date awareness:** Pass current date to Claude
- **Holiday/Seasonal themes:** Christmas, Easter, Thanksgiving, back-to-school, New Year
- **Christian calendar:** Advent, Lent, Pentecost awareness
- **Current events:** Tasteful, non-political references (limited by Claude's training cutoff)

### Phase 15.4: Edge Function Prompt Updates

Add freshness instructions to lesson generation prompt:

- "Vary your illustrations and examples from previous generations"
- "Use different teaching angles when appropriate"
- "Never repeat the same opening hook for the same passage"
- "Consider current date for seasonal relevance: {current_date}"

### Phase 15.5: Freshness Tracking (Optional)

- Log illustration/example themes used per passage
- Avoid repetition for same user generating same passage
- Analytics: Track freshness satisfaction in feedback

**Estimated Effort:** 6-10 hours

**Dependencies:** 
- Core lesson generation stable
- Feedback system in place to measure satisfaction

---

*End of Document*
