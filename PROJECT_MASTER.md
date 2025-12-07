# LessonSparkUSA - Project Master Document

---

## ⚠️ CRITICAL: DUAL ROLE SYSTEM ARCHITECTURE

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

**Last Updated:** 2025-12-07
**Current Phase:** Phase 12.8 In Progress (Beta Launch)
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
- **Platform:** Lovable.dev (automatic GitHub deployment)
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
| src/constants/accessControl.ts | — | Role definitions (frontend only) |
| src/constants/validation.ts | supabase/functions/_shared/validation.ts | Input validation rules |
| src/constants/routes.ts | supabase/functions/_shared/routes.ts | Application route definitions |
| src/config/site.ts | — | Site branding constants |

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
| Sync Direction | Frontend → Backend | Stripe → Supabase (webhook) |
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
| **Free** | 5 | Basic only | $0 | — |
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

**Current Phase:** Phase 12.8 In Progress (Beta Launch)
**Overall Completion:** ~95% (Core product ready for beta)
**Production Readiness:** Beta (Individual users, no payment)

### Phase 12 Summary

| Task | Status |
|------|--------|
| Teacher Preference Profiles | ✅ Complete |
| Auth Bug Fixes | ✅ Complete |
| UI Improvements (Create Lesson 3-step cards) | ✅ Complete |
| Prompt Caching Implementation | ✅ Complete |
| 10 Theology Profiles with Guardrails | ✅ Complete |
| SSOT Compliance Audit & Fixes | ✅ Complete |
| Filter Matching Bug Fix | ✅ Complete |
| Edge Function Guardrails Integration | ✅ Complete |
| Bible Version Selection with Copyright Guardrails | ✅ Complete |
| Security Advisor Clean (0 errors, 0 warnings) | ✅ Complete |
| Mobile Responsiveness Audit (30+ files) | ✅ Complete |
| Guardrail Violation Logging System | ✅ Complete |
| Admin Panel Guardrails Tab | ✅ Complete |
| Email SMTP Configuration | ✅ Complete |
| Password Validation SSOT | ✅ Complete |
| Forgot Password Flow | ✅ Complete |
| Lesson Tiers SSOT | 🔄 In Progress |
| Generation Metrics SSOT | 🔄 In Progress |
| Beta Tester Onboarding | 🔄 In Progress |

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
| Security Monitoring & Logging | LOW | Deferred |
| Failed Access Logging | LOW | Deferred |
| Frontend warning toast for guardrail violations | MEDIUM | Pending |
| System Analytics dashboard implementation | MEDIUM | Pending |
| System Settings panel implementation | LOW | Deferred |
| Quick Tier evaluation (post-beta data) | MEDIUM | Pending beta data |

---

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

*End of Document*
