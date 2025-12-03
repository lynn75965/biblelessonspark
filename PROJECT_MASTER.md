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

**Last Updated:** 2025-12-03  
**Current Phase:** Phase 12 In Progress  
**Repository:** C:\Users\Lynn\lesson-spark-usa  
**Framework Version:** 2.1.1

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
- `src/constants/theologyProfiles.ts` - Theology profiles (MASTER)
- `src/constants/teacherPreferences.ts` - Teacher customization (MASTER)

**Backend mirrors sync automatically:**
- `supabase/functions/_shared/lessonStructure.ts` (MIRROR)
- `supabase/functions/_shared/ageGroups.ts` (MIRROR)
- `supabase/functions/_shared/theologyProfiles.ts` (MIRROR)

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

## Current Lesson Structure (Version 2.1.1)

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

## Theology Profiles

### Available Profiles
1. **Southern Baptist (BF&M 2000)** - Primary profile
2. **Southern Baptist (BF&M 1963)** - Conservative alternative
3. **Reformed Baptist** - Calvinist emphasis
4. **Independent Baptist** - Autonomous church governance

### Profile Components
- Description
- Distinctives (key beliefs)
- Hermeneutics approach
- Application emphasis

---

## Age Groups (10 groups)

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

Each includes: vocabulary level, conceptual depth, teaching profile

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
| 7 | Education Experience | 4 options |
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
- **Section 5 Word Count:** Target 630-840, occasionally generates 500-600 words (LLM non-determinism)
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

**Current Phase:** Phase 12 In Progress  
**Overall Completion:** ~98%  
**Production Readiness:** Beta (Active testing)

### Current Focus (Phase 12)
- ✅ Teacher Preference Profiles - Complete
- ✅ Auth Bug Fixes - Complete
- ⏳ Email SMTP Configuration - Pending
- ⏳ Beta Tester Onboarding - In Progress

### Pending Configuration
- Configure Resend SMTP in Supabase for email verification
- Re-enable email confirmation after SMTP configured

---

## Key Files Reference

### Frontend Constants (MASTER)
- `src/constants/lessonStructure.ts`
- `src/constants/ageGroups.ts`
- `src/constants/theologyProfiles.ts`
- `src/constants/teacherPreferences.ts`
- `src/constants/accessControl.ts`
- `src/lib/fileValidation.ts`

### Backend Mirrors (AUTO-GENERATED)
- `supabase/functions/_shared/lessonStructure.ts`
- `supabase/functions/_shared/ageGroups.ts`
- `supabase/functions/_shared/theologyProfiles.ts`

### Core Components
- `src/components/dashboard/EnhanceLessonForm.tsx`
- `src/components/dashboard/LessonLibrary.tsx`
- `src/components/dashboard/LessonExportButtons.tsx`
- `src/components/dashboard/TeacherCustomization.tsx`

### Hooks
- `src/hooks/useTeacherProfiles.ts`
- `src/hooks/useRateLimit.ts`
- `src/hooks/useInvites.tsx`

### Edge Functions
- `supabase/functions/generate-lesson/index.ts`
- `supabase/functions/extract-lesson/index.ts`
- `supabase/functions/send-invite/index.ts`
- `supabase/functions/setup-lynn-admin/index.ts`

### Utilities
- `src/utils/exportToPdf.ts`
- `src/utils/exportToDocx.ts`
- `scripts/sync-constants.cjs`

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

### GitHub
- **Repository:** https://github.com/lynn75965/lesson-spark-usa

### Production
- **Domain:** https://lessonsparkusa.com
- **Hosting:** Netlify (auto-deploy from GitHub)

---

# PHASE HISTORY

---

## Phase 7: AI Output & Export (November 2025) ✅ COMPLETE

### AI Output Quality Improvements
- **Section 5 Enforcement:** 630-840 word minimum with depth requirements  
- **Student Teaser:** Time-neutral signoff, felt-needs only, displays at top  
- **No Word Counts:** Removed from section headers  
- **No Section 9 Duplication:** Teaser extracted and displayed separately  

### Export Features
- **PDF Export:** Calibri 11pt, compact professional spacing, correct title extraction  
- **DOCX Export:** Renamed "Document (editable)", correct parameters  
- **Print Function:** Calibri 11pt, 1.5 line spacing, 1-inch margins (Bible curriculum standard)  

### UI Improvements
- **View Display:** AI-generated title, tighter spacing (line-height 1.3)  
- **My Lessons Page:** AI-generated titles, 4 search filters (Passage/Title/Age/Theology)  
- **Export Buttons:** Copy, Print, Download (PDF/Document) with clear labels  
- **Progress Bar:** Smooth 0-99% progression during generation  

### Files Modified
- `supabase/functions/generate-lesson/index.ts` - AI prompt enforcement
- `src/components/dashboard/EnhanceLessonForm.tsx` - View display, progress bar
- `src/components/dashboard/LessonExportButtons.tsx` - Button labels
- `src/components/dashboard/LessonLibrary.tsx` - Title extraction, search filters
- `src/utils/exportToPdf.ts` - Calibri, spacing, title extraction
- `src/utils/exportToDocx.ts` - Parameters, title extraction
- `src/constants/lessonStructure.ts` - EXPORT_FORMATTING constant

---

## Phase 8: Security Audit & Hardening (November 25, 2025) ✅ 90% COMPLETE

**Status:** 9 of 10 security domains completed  
**Priority:** CRITICAL - Required before production release

### Security Domains Completed

#### 8.1 API Key & Secrets Management ✅
- No API keys in src/ folder
- .env files properly gitignored
- Anthropic API key only in Supabase Edge Function secrets
- service_role key never used in frontend

#### 8.2 Row Level Security (RLS) Policies ✅
- RLS enabled on all user-data tables
- SELECT/INSERT/UPDATE/DELETE policies created
- User isolation verified with test accounts

#### 8.3 Edge Function Authentication ✅
- JWT verification implemented
- user_id from verified token only (no spoofing)
- 401 responses for missing/invalid tokens

#### 8.4 Authentication Hardening ✅
- Email confirmation: **TEMPORARILY DISABLED** (pending SMTP config)
- Secure email/password change enabled
- Leaked password prevention enabled
- Minimum password: 8 characters with complexity
- Rate limiting: 30 attempts per 5 min per IP
- CAPTCHA: Deferred (optional for future)

#### 8.5 Input Validation & Sanitization ✅
- validation.ts module in _shared
- Length validation (200 chars passages, 2000 notes)
- Type validation, array size limits
- Control character sanitization
- XSS prevention implemented

#### 8.6 Rate Limiting & Abuse Prevention ✅
- rateLimit.ts module in _shared
- Hourly limit: 10 lessons per user
- Daily limit: 50 lessons per user
- HTTP 429 response when exceeded

#### 8.7 Data Privacy & Compliance ✅
- Privacy Policy page created
- Terms of Service page created
- Account deletion functionality implemented
- Footer component with legal links

#### 8.8 CORS & Domain Security ✅
- CORS restricted to https://lessonsparkusa.com
- Security headers via netlify.toml:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security
  - Content-Security-Policy

#### 8.9 Backup & Disaster Recovery ✅
- Daily automated backups enabled
- 7-day backup retention verified
- PITR available as Pro Plan add-on (deferred)

#### 8.10 Security Monitoring & Logging ⏸️ DEFERRED
- Risk Level: LOW
- Moved to Technical Debt

---

## Phase 9: Beta Testing & User Feedback (November 25, 2025) ✅ COMPLETE

### Rate Limiting Feature ✅
**Components:**
- `src/hooks/useRateLimit.ts` - Rate limit checking hook
- `app_settings` table - Admin-configurable operational settings
- Usage indicator in EnhanceLessonForm.tsx

**Behavior:**
- Beta testers: 5 lessons per 24-hour period
- Admin (UUID: b8708e6b-eeef-4ff5-9f0b-57d808ef8762): Exempt (unlimited)
- Display: "X of 5 lessons used (resets in Y hours)"
- At limit: Red banner, Generate button disabled

**Admin Configuration (No Deployment Required):**
- Supabase → Table Editor → `app_settings`
- `beta_lesson_limit`: Number of lessons allowed (default: 5)
- `beta_limit_hours`: Time period in hours (default: 24)

### Beta Infrastructure Ready
- RLS policies active on beta_testers (4 policies) and beta_feedback (3 policies)
- Users can only access their own data
- Admin has full read access

### Beta Testing Tasks (Planning Phase)
- Recruit 10-20 beta testers from Texas Baptist network
- In-app feedback system ready
- Weekly check-in survey templates prepared
- Bug tracking via GitHub Issues or Supabase

---

## Phase 10: RLS Policy Standardization (November 30, 2025) ✅ COMPLETE

### Summary
Comprehensive security refactor replacing all `{public}` role RLS policies with proper `{authenticated}` role policies aligned with frontend SSOT.

### Problem Identified
- Lovable.dev scaffolding created 80 RLS policies using `{public}` role instead of `{authenticated}`
- Policy names were correct ("Users can...") but role assignment was wrong
- `{public}` role grants access to EVERYONE including unauthenticated visitors

### Solution Implemented
- Dropped all 80 existing policies
- Created 66 new SSOT-aligned policies across 22 tables
- All policies now use `authenticated` or `service_role` (except 1 legitimate `anon` for invite claims)

### Policy Pattern Applied

| Policy Type | Role | Purpose |
|-------------|------|---------|
| `admin_full_access` | authenticated | Lynn's UUID gets ALL operations |
| `users_*_own` | authenticated | Users access their own data only |
| `service_role_access` | service_role | Backend Edge Functions |
| `anon_claim_by_token` | anon | Invite claim links only (invites table) |

### Tables Updated (22 total)
admin_audit, app_settings, beta_feedback, beta_testers, credits_ledger, events, feedback, invites, lessons, notifications, organization_contacts, organization_members, organizations, outputs, profiles, rate_limits, refinements, setup_progress, stripe_events, subscription_plans, user_roles, user_subscriptions

### Files Created
- `policy_backup_2025-11-30.csv` - Backup of original 80 policies
- `rls_master_cleanup_phase10.sql` - Master cleanup script

### SSOT Conformance
- Frontend Drives Backend - RLS enforces accessControl.ts definitions
- Admin Has All Control - platformAdmin UUID has ALL operations
- Individual = Own Data - user_id/id = auth.uid() pattern
- Org Roles Active - orgLeader policies now implemented

---

## Phase 11: Org Leader Activation (November 30 - December 1, 2025) ✅ COMPLETE

### Task A: Search Path Security Hardening ✅
- Fixed search_path security warnings for all Edge Functions

### Task B: File Extraction Pipeline ✅
- Created extract-lesson Edge Function
- Supported formats: TXT, PDF, JPG, JPEG, PNG
- Claude Vision API integration for image OCR
- Updated validation.ts: extracted_content field (50,000 char limit)
- Updated generate-lesson: Curriculum Enhancement Mode

### Task B2: Members Tab & Invite System ✅

**Issues Fixed:**
1. **is_admin() function** - Added missing `AND role = 'admin'` filter
2. **Dashboard.tsx** - Added `organization_id` to profile queries
3. **Dashboard.tsx** - Fixed Members TabsContent rendering logic
4. **send-invite Edge Function** - Removed duplicate `serve(handler)` syntax error
5. **useInvites.tsx** - Properly extracts error messages from Edge Function 400 responses

**Verification:**
- Members tab loads correctly showing org members
- Pending invites display properly
- Invite validation errors show specific messages
- Org Leader authorization working in Edge Function

### Git Commits
- `42ab691` - Fix Supabase URL for extract-lesson
- `5a44a25` - Add extract-lesson Edge Function
- `69217c6` - Add extracted_content to generate-lesson
- `751df3e` - Fix send-invite SERVICE_ROLE_KEY
- `89cf36e` - Update admin password
- `2fb705a` - Dashboard organization_id fix
- `5aa8fe7` - send-invite duplicate serve() fix
- `d15ce37` - Error message extraction fix

---

## Phase 12: Teacher Profiles & UX Improvements (December 2, 2025) 🔄 IN PROGRESS

### Session 1: PDF Extraction Bug Fix ✅

**Problem:** Uploaded PDF curriculum content was not being incorporated into generated lessons.

**Root Cause:** Naive PDF parsing attempted to read raw bytes as text, returning binary garbage.

**Solution:** Replaced with Claude API document extraction using `claude-sonnet-4-20250514`.

**DOCX Support Removed:** Claude API `document` type does NOT support DOCX files. Users instructed to save Word documents as PDF before upload.

#### Updated File Support

| File Type | Method | Expected Time |
|-----------|--------|---------------|
| **PDF** | Claude Sonnet 4 document API | 60-90 seconds |
| **TXT** | Direct file read | <1 second |
| **JPG/JPEG/PNG** | Claude Sonnet 4 vision API | 15-30 seconds |
| **DOCX** | ❌ REMOVED | Not supported by Claude API |

---

### Session 2: Text Paste Input Option ✅

**Feature:** Added text paste alternative to file upload for faster curriculum input.

**Changes Made:**

1. **SSOT Update - fileValidation.ts**
   - Removed DOCX/DOC from `ALLOWED_FILE_TYPES`
   - New supported formats: PDF, TXT, JPG, JPEG, PNG
   - Updated error messages: "For Word docs, save as PDF first"

2. **EnhanceLessonForm.tsx - Text Paste Feature**
   - Added `inputMode` state: "file" | "paste"
   - Toggle buttons: "Upload File" / "Paste Text"
   - Modes are mutually exclusive
   - Pasted content goes directly to `extracted_content` (skips extraction)

**User Experience Impact:**
- **Paste Text**: Instant submission (no extraction delay)
- **Upload File**: 60-90 seconds extraction for PDFs
- Teachers with digital content can copy-paste for faster workflow

**Git Commits:**
- `51ba201` - Add text paste option for curriculum input, remove DOCX support (SSOT-compliant)
- `3845f47` - Debug: Add logging to diagnose paste text validation issue
- `960b231` - Remove debug logging - paste text feature verified working

---

### Session 3: Teacher Preference Profiles System ✅

**Purpose:** Allow teachers to save up to 7 named profiles with their customization preferences for quick switching between teaching contexts (e.g., "Sunday Adult Class", "Wednesday Youth").

#### Database: `teacher_preference_profiles` Table
```sql
CREATE TABLE teacher_preference_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,  -- max 50 chars, unique per user
  is_default BOOLEAN DEFAULT false,
  preferences JSONB NOT NULL,  -- stores 13 fields, no content validation
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Constraints:**
- Max 7 profiles per user (trigger-enforced)
- Only one default profile per user (auto-enforced by trigger)
- Profile names 1-50 characters, unique per user
- RLS: Users can only access their own profiles

#### New Files Created

| File | Purpose |
|------|---------|
| `src/hooks/useTeacherProfiles.ts` | CRUD operations for profiles |

#### Files Modified

| File | Changes |
|------|---------|
| `src/constants/teacherPreferences.ts` | 13 fields, added Lesson Sequence/Language/Activity Types |
| `src/components/dashboard/TeacherCustomization.tsx` | Profile dropdown, save modal, delete confirmation, Part of Series UI |
| `src/components/dashboard/EnhanceLessonForm.tsx` | Integrates profile hook, auto-loads default profile |

#### Smart Collapse Behavior
- **New users (no profiles):** Section collapsed
- **Users with saved profiles:** Section expanded, default profile auto-loaded

#### Part of Series Feature
- When "Part of Series" selected, shows "Lesson X of Y" inputs
- Validation: X ≤ Y, max 7 lessons in a series
- **Position NOT saved in profile** (lesson-specific, resets each time)

#### SSOT Compliance Verified
✅ All field definitions in `teacherPreferences.ts`  
✅ Database stores JSONB with no content validation  
✅ Frontend drives backend behavior  
✅ RLS policies enforce user isolation

---

### Session 3: Auth.tsx Bug Fixes ✅

#### Bug Fix 1: Spaces Not Allowed in Full Name

**Problem:** Users couldn't type "Pastor Lynn" - space was immediately removed  
**Root Cause:** `handleInputChange()` called `sanitizeText()` on every keystroke, which included `.trim()`  
**Solution:** Removed real-time sanitization; `sanitizeText()` only called on form submit

**File Modified:** `src/pages/Auth.tsx`

---

#### Bug Fix 2: Database Error Saving New User

**Problem:** "Sign up failed - Database error saving new user"  
**Root Cause:** `profiles.theology_profile_id` column was NOT NULL without a default value. The `handle_new_user` trigger only sets `id` and `full_name`.  
**Solution:** 
```sql
ALTER TABLE public.profiles 
ALTER COLUMN theology_profile_id DROP NOT NULL;
```

**Location:** Supabase SQL Editor (production database)

---

#### Enhancement: Password Visibility Toggle ✅

**Feature:** Added eye icon to show/hide password on both Sign In and Sign Up forms  
**Implementation:** 
- Added `showSignInPassword` and `showSignUpPassword` state
- Eye/EyeOff icons from lucide-react
- Clickable toggle button with `tabIndex={-1}` to skip tab navigation

**File Modified:** `src/pages/Auth.tsx`

---

### Configuration Change: Email Verification Disabled ⚠️

**Change:** Disabled "Confirm email" in Supabase Authentication settings  
**Reason:** Resend SMTP not fully configured; was blocking beta signups  
**Location:** Supabase Dashboard → Authentication → Providers → Email → Confirm email: OFF  
**Future:** Configure Resend SMTP for production email verification

---

### Files Modified This Session

| File | Change Type |
|------|-------------|
| `src/constants/teacherPreferences.ts` | Major update - 13 fields, SSOT cleanup |
| `src/hooks/useTeacherProfiles.ts` | **New file** - profile CRUD hook |
| `src/components/dashboard/TeacherCustomization.tsx` | Major update - profile UI |
| `src/components/dashboard/EnhanceLessonForm.tsx` | Major update - profile integration |
| `src/pages/Auth.tsx` | Bug fix + enhancement |
| `src/lib/fileValidation.ts` | SSOT for allowed file types |
| Database: `teacher_preference_profiles` | **New table** |
| Database: `profiles.theology_profile_id` | Made nullable |

---

### Git Commits (Phase 12 - Teacher Profiles Session)

> **TODO:** Replace placeholders with actual commit hashes from `git log`

- `[PLACEHOLDER]` - Add teacher preference profiles with Smart Collapse
- `[PLACEHOLDER]` - Fix: Allow spaces in Full Name field during sign up
- `[PLACEHOLDER]` - Add password visibility toggle to auth forms

---

# SUPPLEMENTARY DOCUMENTATION

---

## Footer Component - SSOT Implementation (November 28, 2025) ✅

**Status:** COMPLETE  
**Principle:** Single Source of Truth (SSOT) - One reusable component across all pages

### Overview
Created centralized Footer component to replace inline footer code, ensuring consistency across all user-facing pages.

### Component Architecture

**Source File:** `src/components/layout/Footer.tsx`

**Data Sources (SSOT):**

| Data | Source File | Description |
|------|-------------|-------------|
| Footer Links | `src/config/footerLinks.ts` | Product, Support, Legal link arrays |
| Support Email | `src/config/site.ts` → `SITE.supportEmail` | Centralized email address |
| Branding | Component internal | Logo, description, copyright |

### Pages With Footer Component

| Page | File | Status |
|------|------|--------|
| Landing Page | `src/pages/Index.tsx` | ✅ |
| Dashboard | `src/pages/Dashboard.tsx` | ✅ |
| Documentation | `src/pages/Docs.tsx` | ✅ |
| Help Center | `src/pages/Help.tsx` | ✅ |
| Training | `src/pages/Training.tsx` | ✅ |
| Community | `src/pages/Community.tsx` | ✅ |
| Setup Guide | `src/pages/Setup.tsx` | ✅ |
| Privacy Policy | `src/pages/legal/Privacy.tsx` | ✅ |
| Terms of Service | `src/pages/legal/Terms.tsx` | ✅ |
| Cookie Policy | `src/pages/legal/Cookie.tsx` | ✅ |

---

## Future Roadmap: Organization Leader Features

**Status:** Planning (Post-Beta)  
**Priority:** HIGH - Core to multi-user value proposition  
**Target Phase:** Phase 13+

### Overview
Organizations (churches) will have the capability to coordinate Bible study across all age groups with centralized leadership and oversight.

### Access Model Architecture

| Role | Scope | Capabilities |
|------|-------|--------------|
| **Platform Admin** | ALL platform activity | See all users, all orgs, all lessons, platform analytics |
| **Org Leader** | Their organization only | Manage org members, view org activity, set shared focus |
| **Org Member** | Their own lessons within org | Create lessons, follow org guidelines |
| **Individual User** | Their own lessons only | Full autonomy, no org context |

### Planned Org Leader Capabilities

1. **Member Management** - Add/remove teachers, assign roles, view activity
2. **Shared Focus/Theme Coordination** - Set church-wide Scripture passage/theme
3. **Org Analytics Dashboard** - Usage reports by age group, engagement metrics
4. **Curriculum Coordination** - Sequential lesson planning, cross-age alignment
5. **Quality Oversight** - Review lessons before use (optional)

### Implementation Phases (Future)

- **Phase 13A:** Org Structure - Leader role assignment, member management UI
- **Phase 13B:** Shared Focus - Passage/theme setting, auto-populate forms
- **Phase 13C:** Org Analytics - Dashboard, activity reports, exports
- **Phase 13D:** Curriculum Coordination - Series mode, alignment tools

---

## Supported File Types Reference

### Curriculum Upload (extract-lesson)
- **PDF** ✅ - Claude Sonnet 4 document API (60-90 seconds)
- **TXT** ✅ - Direct read (<1 second)
- **JPG/JPEG/PNG** ✅ - Claude Sonnet 4 vision API (15-30 seconds)
- **DOCX** ❌ - Not supported (save as PDF)

### Export Formats (lesson export)
- **PDF** ✅
- **DOCX** ✅
- **Print** ✅

### Extraction Limits

| Limit | Value | Location |
|-------|-------|----------|
| File upload size | 10 MB | Frontend validation |
| Extracted content | 50,000 characters | validation.ts |

---

## Technical Debt Backlog

### Security Monitoring & Logging (Deferred from Phase 8.10)

**Risk Level:** LOW  
**Priority:** Future enhancement

**Scope:**
- Log all authentication attempts (success/failure)
- Log all API calls to Edge Functions
- Log rate limit violations
- Create monitoring dashboard
- Set up alerting rules

---

### Failed Access Logging (Deferred from Phase 11)

**Risk Level:** LOW  
**Priority:** Future enhancement (nice-to-have)

**Issue:** RLS policies silently filter rows - they don't throw catchable errors. True "denied RLS access" logging would require workarounds that add overhead.

**Why Deferred:**
- Edge Function logs already capture 401/403/400 errors
- RLS silent filtering is by design
- Implementation complexity outweighs security benefit
- Security is enforced, just not logged at row level

**If Implemented Later:**
- Create `security_access_log` table
- Add trigger functions for explicit security events
- Consider Supabase Log Drain for centralized logging

---

### Function Search Path Security (Deferred from Phase 10)

**Risk Level:** LOW  
**Priority:** Phase 14 or later

**Issue:** 14 database functions lack explicit `search_path` settings. Theoretical risk where attacker with CREATE privileges could hijack function calls.

**Why Deferred:**
- Risk is theoretical - requires database CREATE privileges
- Functions work correctly in production
- Low priority compared to other tasks

**Functions Requiring Attention:**
- handle_new_user, handle_updated_at
- allocate_monthly_credits, cleanup_old_rate_limits, deduct_credits
- get_all_users_for_admin, get_credits_balance, get_user_organization
- get_user_organization_id, has_role, is_admin
- log_profile_role_changes, log_security_event, update_updated_at_column

**Recommended Fix:**
```sql
ALTER FUNCTION function_name(...) SET search_path = public, pg_temp;
```


---

## Claude API Cost Management

### Pricing Structure (Claude Sonnet 4)

| Token Type | Cost per Million | Notes |
|------------|------------------|-------|
| Input tokens | $3.00 | Prompt sent to Claude |
| Output tokens | $15.00 | Lesson content generated |
| Cached input (write) | $3.75 | First request creates cache (+25%) |
| Cached input (read) | $0.30 | Subsequent requests use cache (-90%) |

### Prompt Caching Implementation

**Status:** ✅ Implemented December 3, 2025  
**Location:** `supabase/functions/generate-lesson/index.ts`

**Cache Structure:**
```
┌─────────────────────────────────────────┐
│ BLOCK 1: Base System Prompt             │
│ (Framework, sections, rules, checklist) │
│ cache_control: { type: 'ephemeral' }    │ ← CACHED (same for ALL users)
├─────────────────────────────────────────┤
│ BLOCK 2: Theology Profile               │
│ (BF&M 2000, BF&M 1963, etc.)            │
│ cache_control: { type: 'ephemeral' }    │ ← CACHED (per theology tradition)
├─────────────────────────────────────────┤
│ BLOCK 3: Dynamic Content                │
│ (Age group, teacher prefs, teaser)      │
│ NO cache_control                        │ ← NOT cached (varies per request)
└─────────────────────────────────────────┘
```

**Cache Behavior:**
- TTL: 5 minutes (refreshes on each use)
- Cache hits require same theology profile within 5-minute window
- Teacher customization profiles do NOT cache (vary per user)
- Output tokens are never cached (always full price)

### Per-Lesson Cost Breakdown

| Component | Tokens | Without Caching | With Caching (Hit) |
|-----------|--------|-----------------|-------------------|
| Cached Input (base + theology) | ~3,000 | $0.009 | $0.0009 |
| Non-Cached Input (dynamic + user) | ~1,500 | $0.0045 | $0.0045 |
| Output (lesson content) | ~3,500 | $0.0525 | $0.0525 |
| **TOTAL per lesson** | ~8,000 | **~$0.066** | **~$0.058** |

**Per-lesson savings with caching: ~12-15%**

### Monthly Cost Projections

| Users | Lessons/User/Month | Total Lessons | Without Caching | With Caching |
|------:|:------------------:|:-------------:|----------------:|-------------:|
| 10 | 5 | 50 | $3.30 | $2.90 |
| 25 | 5 | 125 | $8.25 | $7.25 |
| 50 | 5 | 250 | $16.50 | $14.50 |
| 100 | 5 | 500 | $33.00 | $29.00 |
| 200 | 5 | 1,000 | $66.00 | $58.00 |
| 500 | 5 | 2,500 | $165.00 | $145.00 |
| 750 | 5 | 3,750 | $247.50 | $217.50 |

### Budget Configuration

**Monthly Budget Ceiling:** $200  
**Platform:** Anthropic Console (console.anthropic.com)  
**Billing:** Prepaid credits with auto-reload

**Recommended Settings:**
- Initial credits: $50-100
- Auto-reload threshold: $20
- Spending alert: $150/month

### Budget Capacity

| Scenario | Max Lessons/Month | Max Users (at 5 lessons each) |
|----------|------------------:|------------------------------:|
| Without Caching | ~3,000 | ~600 users |
| With Caching | ~3,450 | ~690 users |

### Growth Projections

| Phase | Users | Lessons/Month | Est. Cost | Within Budget? |
|-------|------:|:-------------:|----------:|:--------------:|
| Beta (Current) | 20 | 100 | $5.80 | ✅ Yes |
| Early Launch | 50 | 250 | $14.50 | ✅ Yes |
| Growing | 100 | 500 | $29.00 | ✅ Yes |
| Established | 250 | 1,250 | $72.50 | ✅ Yes |
| Thriving | 500 | 2,500 | $145.00 | ✅ Yes |
| **Budget Ceiling** | **~690** | **~3,450** | **~$200** | ⚠️ Limit |

### Cost Monitoring

**Log Location:** Supabase Dashboard → Functions → generate-lesson → Logs

**Cache Performance Indicators:**
```
[CACHE] Cache WRITE: Created cache with XXXX tokens    ← First request
[CACHE] Cache HIT! Read XXXX tokens from cache         ← Subsequent requests
```

**Metadata Tracking:** Each lesson stores cache stats in `metadata.cacheStats`:
- `cacheCreationTokens` - Tokens written to cache
- `cacheReadTokens` - Tokens read from cache
- `uncachedInputTokens` - Non-cached input tokens
- `cacheHit` - Boolean indicating cache hit

### Cost Optimization Notes

1. **Output tokens dominate cost** - 5x more expensive than input; caching doesn't affect output
2. **Curriculum Enhancement mode costs more** - Pasted curriculum increases input tokens 2-3x
3. **Cache hits require traffic** - Same theology profile within 5 minutes gets cache benefit
4. **Monitor weekly** - Check Anthropic Console dashboard for actual vs. projected costs

### Scaling Triggers

| Trigger | Action |
|---------|--------|
| Approaching 3,000 lessons/month | Review rate limits, consider tiered pricing |
| Consistent $150+/month | Evaluate subscription pricing to cover costs |
| 1,000+ active users | Implement usage-based pricing or tiered plans |

---

# ACTION ITEMS

## Immediate (Before Next Beta Tester)

| Task | Priority | Status |
|------|----------|--------|
| Configure Resend SMTP in Supabase | HIGH | ⏳ Pending |
| Re-enable email confirmation | HIGH | ⏳ After SMTP |
| Test teacher profile save/load/delete | MEDIUM | ⏳ Pending |
| Add actual Git commit hashes to this doc | LOW | ⏳ Pending |

## Resend SMTP Configuration Details

**Location:** Supabase Dashboard → Authentication → SMTP Settings

| Setting | Value |
|---------|-------|
| Host | smtp.resend.com |
| Port | 465 |
| Username | resend |
| Password | Your API key (re_...) |
| Sender email | Requires verified domain in Resend |

---

*End of Document*
