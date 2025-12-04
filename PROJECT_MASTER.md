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

**Last Updated:** 2025-12-04
**Current Phase:** Phase 12.5 Complete
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
- Stripe (payment processing)
- Anthropic Claude API (lesson generation)
- Canva (design export)
- Vercel (potential deployment target)

---

## Single Source of Truth (SSOT) Architecture

### Master Vision Principle: Frontend Drives Backend

**All data definitions originate from frontend constants:**
- `src/constants/lessonStructure.ts` - Lesson framework (MASTER)
- `src/constants/ageGroups.ts` - Age group definitions (MASTER)
- `src/constants/theologyProfiles.ts` - Theology profiles with guardrails (MASTER)
- `src/constants/teacherPreferences.ts` - Teacher customization (MASTER)
- `src/constants/bibleVersions.ts` - Bible versions with copyright status (MASTER)

**Backend mirrors sync automatically:**
- `supabase/functions/_shared/lessonStructure.ts` (MIRROR)
- `supabase/functions/_shared/ageGroups.ts` (MIRROR)
- `supabase/functions/_shared/theologyProfiles.ts` (MIRROR)
- `supabase/functions/_shared/bibleVersions.ts` (MIRROR)

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

### Copyright Guardrails Integration

The Edge Function injects copyright guardrails into every lesson generation:

**Public Domain Example (KJV):**
```
## SCRIPTURE QUOTATION GUIDELINES
Bible Version: King James Version (KJV)
Copyright Status: Public Domain

You MAY directly quote Scripture passages from the KJV.
Always include verse references (e.g., John 3:16).
```

**Copyrighted Example (NIV):**
```
## SCRIPTURE QUOTATION GUIDELINES
Bible Version: New International Version (NIV)
Copyright Status: Copyrighted

You must PARAPHRASE all Scripture content.
DO NOT directly quote from the NIV.
Always include verse references (e.g., John 3:16) so readers can look up passages.
Use phrases like "In this passage, Paul teaches that..." or "The verse tells us..."
```

### Lesson Metadata

Generated lessons include Bible version metadata:
```typescript
metadata: {
  bibleVersion: "New International Version",
  bibleVersionAbbreviation: "NIV",
  copyrightStatus: "copyrighted"
}
```

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

### Profile Structure (SSOT)

Each profile in `theologyProfiles.ts` contains:

| Field | Purpose |
|-------|---------|
| `id` | Database identifier |
| `name` / `shortName` | Display names |
| `displayOrder` | Controls dropdown sequence (1-10) |
| `isDefault` | Boolean flag (only Baptist Core Beliefs = true) |
| `summary` | USER-FACING description shown in UI |
| `filterContent` | BACKEND ONLY - full theological lens for AI prompt |
| `avoidTerminology` | Array of prohibited terms |
| `preferredTerminology` | Substitution map |
| `requiredTerminology` | Terms that MUST appear (Reformed/Primitive only) |
| `guardrails` | Content prohibition rules |
| `securityDoctrine` | 'eternal' or 'conditional' or 'perseverance' |
| `tulipStance` | 'anti' or 'pro' |

### Helper Functions (SSOT-compliant)

| Function | Purpose |
|----------|---------|
| `getTheologyProfile(id)` | Get single profile by ID |
| `getDefaultTheologyProfile()` | Returns Baptist Core Beliefs |
| `getTheologyProfilesSorted()` | Returns profiles in displayOrder |
| `getTheologyProfileOptions()` | User-facing subset for dropdowns |
| `generateTheologicalGuardrails(profileId)` | Generates complete guardrails block for AI prompt |

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

## Known Issues & Limitations

### AI Output Quality (Non-Deterministic)
- **Section 5 Word Count:** Target 630-840, occasionally generates 500-600 words
- **Teaser Quality:** Occasionally reveals content despite 11 prohibitions
- **Solution Deferred:** Post-generation validation not yet implemented

### Future Enhancements
- Post-generation word count validation
- Automatic Section 5 expansion if under 630 words
- Teaser content validation for prohibited phrases

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

**Current Phase:** Phase 12.5 Complete
**Overall Completion:** ~99%
**Production Readiness:** Beta (Active testing with theological guardrails)

### Phase 12 Summary
- Teacher Preference Profiles - Complete
- Auth Bug Fixes - Complete
- UI Improvements (Create Lesson 3-step cards) - Complete
- Prompt Caching Implementation - Complete
- 10 Theology Profiles with Guardrails - Complete
- SSOT Compliance Audit & Fixes - Complete
- Filter Matching Bug Fix - Complete
- Edge Function Guardrails Integration - Complete
- Bible Version Selection with Copyright Guardrails - Complete
- Security Advisor Clean (0 errors, 0 warnings) - Complete
- Email SMTP Configuration - Pending
- Beta Tester Onboarding - In Progress

### Pending Configuration
- Configure Resend SMTP in Supabase for email verification
- Re-enable email confirmation after SMTP configured

---

## Key Files Reference

### Frontend Constants (MASTER)
- `src/constants/lessonStructure.ts`
- `src/constants/ageGroups.ts`
- `src/constants/theologyProfiles.ts` - **10 profiles with guardrails**
- `src/constants/teacherPreferences.ts`
- `src/constants/bibleVersions.ts` - **7 versions with copyright guardrails**
- `src/constants/accessControl.ts`
- `src/lib/fileValidation.ts`

### Backend Mirrors (AUTO-GENERATED)
- `supabase/functions/_shared/lessonStructure.ts`
- `supabase/functions/_shared/ageGroups.ts`
- `supabase/functions/_shared/theologyProfiles.ts` - **Includes generateTheologicalGuardrails()**
- `supabase/functions/_shared/bibleVersions.ts` - **Includes generateCopyrightGuardrails()**
- `supabase/functions/_shared/validation.ts` - **Includes bible_version_id validation**

### Core Components
- `src/components/dashboard/EnhanceLessonForm.tsx` - Profile/age summaries, Bible version dropdown, 3-step cards
- `src/components/dashboard/LessonLibrary.tsx` - SSOT badge colors, snake_case filters
- `src/components/dashboard/LessonExportButtons.tsx`
- `src/components/dashboard/TeacherCustomization.tsx` - "None" option, profile management

### Hooks
- `src/hooks/useTeacherProfiles.ts`
- `src/hooks/useRateLimit.ts`
- `src/hooks/useInvites.tsx`

### Edge Functions
- `supabase/functions/generate-lesson/index.ts` - **Theological + Copyright guardrails integration**
- `supabase/functions/extract-lesson/index.ts`
- `supabase/functions/send-invite/index.ts`
- `supabase/functions/setup-lynn-admin/index.ts`

### Utilities
- `src/utils/exportToPdf.ts`
- `src/utils/exportToDocx.ts`
- `scripts/sync-constants.cjs` - **Syncs 5 constants files including bibleVersions.ts**

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

### UI Improvements
- **View Display:** AI-generated title, tighter spacing (line-height 1.3)
- **My Lessons Page:** AI-generated titles, 4 search filters
- **Export Buttons:** Copy, Print, Download (PDF/Document) with clear labels
- **Progress Bar:** Smooth 0-99% progression during generation

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
- Beta testers: 5 lessons per 24-hour period
- Admin exempt (unlimited)
- Display: "X of 5 lessons used (resets in Y hours)"
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

## Phase 12: Teacher Profiles & UX Improvements (December 2-4, 2025) - COMPLETE

### Session 1: PDF Extraction Bug Fix
- Replaced naive PDF parsing with Claude API document extraction

### Session 2: Text Paste Input Option
- Added text paste alternative to file upload

### Session 3: Teacher Preference Profiles System
- Up to 7 named profiles per user
- Smart Collapse behavior
- Part of Series feature

### Session 4: UI Redesign
- 3-step card layout for Create Lesson page
- Brand styling with gold accents, teal badges

### Session 5: Prompt Caching Implementation
- 50-70% cost reduction potential

### Session 6: My Lesson Library Improvements
- Renamed to "My Lesson Library"
- Focused viewer mode
- Scrollbar accessibility

### Session 7: Theological Guardrails & SSOT Compliance

**10 Theology Profiles with Complete Guardrails:**
- Prohibited terminology lists
- Required substitutions
- Required terminology (Reformed/Primitive only)
- Content prohibition rules
- Security doctrine classification
- TULIP stance classification

**Edge Function Integration:**
- `generateTheologicalGuardrails()` integrated into lesson generation
- Guardrails injected into every AI prompt

**SSOT Compliance Fixes:**
- Filter matching fixed (snake_case keys)
- Badge colors keyed by ID (order-independent)

**UI Enhancements:**
- Theology profile summary display
- Age group description display
- "-- None --" option in Load Profile dropdown

**Git Commits (Session 7):**
- `596ef7a` - 10 theology profiles with guardrails
- `70d6fc7` - Fix component file paths
- `1e97861` - Theology profile summary display
- `a8011df` - Age group description display
- `d09754b` - "None" option in Load Profile
- `c5346a6` - Filter matching fix (snake_case)

### Session 8: Bible Version Selection with Copyright Guardrails

**7 Bible Versions Implemented:**

| Version | Copyright | AI Behavior |
|---------|-----------|-------------|
| KJV | Public Domain | Direct quotation |
| WEB | Public Domain | Direct quotation |
| NKJV | Copyrighted | Paraphrase only |
| NASB | Copyrighted | Paraphrase only |
| ESV | Copyrighted | Paraphrase only |
| NIV | Copyrighted | Paraphrase only |
| CSB | Copyrighted | Paraphrase only |

**SSOT Implementation:**
- Frontend master: `src/constants/bibleVersions.ts`
- Backend mirror: `supabase/functions/_shared/bibleVersions.ts`
- Sync script updated: `scripts/sync-constants.cjs`

**Copyright Guardrails:**
- `generateCopyrightGuardrails(versionId)` function
- Public domain: AI quotes directly
- Copyrighted: AI paraphrases with verse references
- Guardrails injected into system prompt

**UI Integration:**
- Bible Version dropdown in Step 2 (EnhanceLessonForm.tsx)
- Copyright description displays below dropdown
- Default: KJV (public domain)

**Security Fixes:**
- RLS enabled on `bible_versions` table
- Policies created for authenticated read access
- Function search_path hardened (4 functions)
- Security Advisor: **0 errors, 0 warnings, 0 suggestions**

**Validation Updates:**
- `validation.ts` updated with `bible_version_id` field
- Edge Function accepts optional `bible_version_id` parameter
- Lesson metadata includes Bible version info

**Git Commits (Session 8):**
- `4eb76fa` - Add Bible Version selection with copyright guardrails (SSOT)
- `bf44211` - Fix: Guard against undefined distinctives in theology profiles

---

# SUPPLEMENTARY DOCUMENTATION

---

## Footer Component - SSOT Implementation

**Source File:** `src/components/layout/Footer.tsx`

Used on: Landing Page, Dashboard, Documentation, Help Center, Training, Community, Setup Guide, Privacy Policy, Terms of Service, Cookie Policy

---

## Future Roadmap: Organization Leader Features

**Target Phase:** Phase 13+

### Planned Capabilities
1. Member Management
2. Shared Focus/Theme Coordination
3. Org Analytics Dashboard
4. Curriculum Coordination
5. Quality Oversight

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

## Technical Debt Backlog

- Security Monitoring & Logging (LOW priority)
- Failed Access Logging (LOW priority)

---

# ACTION ITEMS

## Immediate

| Task | Priority | Status |
|------|----------|--------|
| Configure Resend SMTP in Supabase | HIGH | Pending |
| Re-enable email confirmation | HIGH | After SMTP |
| Test Bible version copyright guardrails (public domain vs copyrighted) | MEDIUM | Pending |
| Test theological guardrails across all 10 profiles | MEDIUM | Pending |

---

*End of Document*
