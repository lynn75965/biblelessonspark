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
| orgLeader | Organization admin - sees org-scoped data [FUTURE] |
| orgMember | Org teacher - sees own lessons within org context [FUTURE] |
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


**Last Updated:** 2025-11-28  
**Current Phase:** Phase 7 Complete, Ready for Phase 8  
**Repository:** C:\Users\Lynn\lesson-spark-usa  
**Framework Version:** 2.1.1

---

## Project Overview

LessonSparkUSA is a Baptist Bible study lesson generator platform serving volunteer teachers in Southern Baptist Convention churches. Built with React/TypeScript on Lovable.dev, Supabase backend, and Claude AI integration.

**Developer:** Lynn - 74-year-old retired Baptist minister with PhD from SWBTS, 40 years ministry experience, non-programmer solopreneur  
**Target Users:** Volunteer teachers in SBC churches  
**Core Value:** Generate theologically-sound, age-appropriate Bible study lessons aligned with Baptist Faith & Message standards

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

## Teacher Customization (26 preference fields)

### Core Preferences
- Teaching style, Learning style, Lesson length, Activity types, Language

### Classroom Context
- Class setting, Learning environment, Student experience level

### Cultural & Special Needs
- Cultural context, Special needs accommodations

### Pedagogical Approach
- Lesson sequence, Assessment style, Education experience

All preferences dynamically inserted into AI prompt generation

---

## Phase 7 Completion Summary (November 2025)

### AI Output Quality Improvements
? **Section 5 Enforcement:** 630-840 word minimum with depth requirements  
? **Student Teaser:** Time-neutral signoff, felt-needs only, displays at top  
? **No Word Counts:** Removed from section headers  
? **No Section 9 Duplication:** Teaser extracted and displayed separately  

### Export Features
? **PDF Export:** Calibri 11pt, compact professional spacing, correct title extraction  
? **DOCX Export:** Renamed "Document (editable)", correct parameters  
? **Print Function:** Calibri 11pt, 1.5 line spacing, 1-inch margins (Bible curriculum standard)  

### UI Improvements
? **View Display:** AI-generated title, tighter spacing (line-height 1.3)  
? **My Lessons Page:** AI-generated titles, 4 search filters (Passage/Title/Age/Theology)  
? **Export Buttons:** Copy, Print, Download (PDF/Document) with clear labels  
? **Progress Bar:** Smooth 0-99% progression during generation  

### Files Modified in Phase 7
- `supabase/functions/generate-lesson/index.ts` - AI prompt enforcement
- `src/components/dashboard/EnhanceLessonForm.tsx` - View display, progress bar
- `src/components/dashboard/LessonExportButtons.tsx` - Button labels
- `src/components/dashboard/LessonLibrary.tsx` - Title extraction, search filters
- `src/utils/exportToPdf.ts` - Calibri, spacing, title extraction
- `src/utils/exportToDocx.ts` - Parameters, title extraction
- `src/constants/lessonStructure.ts` - EXPORT_FORMATTING constant

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

**Current Phase:** Phase 7 Complete  
**Overall Completion:** ~95%  
**Production Readiness:** Beta (Private testing)  

### Ready for Phase 8
- Progress bar accuracy refinements
- Additional export format options
- Enhanced analytics dashboard
- Performance optimization

---

## Key Files Reference

### Frontend Constants (MASTER)
- `src/constants/lessonStructure.ts`
- `src/constants/ageGroups.ts`
- `src/constants/theologyProfiles.ts`
- `src/constants/customizationOptions.ts`

### Backend Mirrors (AUTO-GENERATED)
- `supabase/functions/_shared/lessonStructure.ts`
- `supabase/functions/_shared/ageGroups.ts`
- `supabase/functions/_shared/theologyProfiles.ts`

### Core Components
- `src/components/dashboard/EnhanceLessonForm.tsx`
- `src/components/dashboard/LessonLibrary.tsx`
- `src/components/dashboard/LessonExportButtons.tsx`
- `src/components/dashboard/TeacherCustomization.tsx`

### Edge Functions
- `supabase/functions/generate-lesson/index.ts`

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

## PHASE 8: SECURITY AUDIT & HARDENING
**Status:** 90% Complete (9 of 10 items completed)
**Completion Date:** November 25, 2025
**Priority:** CRITICAL - Must complete before production release
**Started:** November 25, 2025

### OBJECTIVES
Conduct comprehensive security audit and implement hardening measures to protect user data, prevent unauthorized access, and ensure compliance with data privacy standards before expanding beta program or production release.

### SECURITY DOMAINS

#### 8.1 API KEY & SECRETS MANAGEMENT
**Status:** ? COMPLETED - November 25, 2025**Risk Level:** CRITICAL

**Audit Checklist:**
- [ ] Verify NO API keys in src/ folder (Git history scan)
- [ ] Verify .env files properly gitignored
- [ ] Verify .env files NOT in Git history
- [ ] Confirm Anthropic API key only in Supabase Edge Function secrets
- [ ] Confirm service_role key never used in frontend
- [ ] Verify anon key properly restricted by RLS policies

**Actions Required:**
1. Scan entire Git history for exposed secrets
2. If found: Rotate all compromised keys immediately
3. Implement pre-commit hooks to prevent future exposure
4. Document secret management protocols

**Validation:**
- Run: `git log -p | grep -i "sk-ant-"` (should return nothing)
- Run: `git log -p | grep -i "service_role"` (should return nothing)
- Verify Anthropic key only exists in Supabase Edge Function secrets

---

#### 8.2 ROW LEVEL SECURITY (RLS) POLICIES
**Status:** ? COMPLETED - November 25, 2025**Risk Level:** CRITICAL

**Tables Requiring RLS:**
- [ ] `lessons` - Users can only read/write their own lessons
- [ ] `profiles` or `user_preferences` - Users can only access own profile
- [ ] `theology_profiles` - Users can only access own theology settings
- [ ] Any other user-data tables

**RLS Policy Requirements:**

**lessons table:**
```sql
-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Users can view only their own lessons
CREATE POLICY "Users can view own lessons"
  ON lessons FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert only their own lessons
CREATE POLICY "Users can insert own lessons"
  ON lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own lessons
CREATE POLICY "Users can update own lessons"
  ON lessons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own lessons
CREATE POLICY "Users can delete own lessons"
  ON lessons FOR DELETE
  USING (auth.uid() = user_id);
```

**profiles/preferences tables:**
```sql
-- Similar RLS policies for user profiles
-- Users can only see/edit their own profile
```

**Actions Required:**
1. Audit all tables for user data
2. Enable RLS on all user-data tables
3. Create SELECT/INSERT/UPDATE/DELETE policies
4. Test policies with multiple user accounts
5. Document RLS policy patterns

**Validation:**
- Create 2 test accounts
- Verify User A cannot see User B's lessons
- Verify User A cannot modify User B's data
- Verify API calls without auth token fail

---

#### 8.3 EDGE FUNCTION AUTHENTICATION
**Status:** ? COMPLETED - November 25, 2025**Risk Level:** CRITICAL

**Current Risk:**
Edge Function may accept unauthenticated requests or allow user_id spoofing.

**Required Security Measures:**
```typescript
// supabase/functions/generate-lesson/index.ts

import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // 1. VERIFY AUTHORIZATION HEADER
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Missing auth token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. CREATE AUTHENTICATED SUPABASE CLIENT
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  // 3. VERIFY USER FROM JWT TOKEN
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Invalid token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. USE VERIFIED user.id - NEVER TRUST REQUEST BODY
  const userId = user.id; // This comes from verified JWT, not request

  // 5. CONTINUE WITH LESSON GENERATION
  // ... rest of function
});
```

**Actions Required:**
1. Audit current Edge Function authentication
2. Implement JWT verification
3. Remove any user_id from request body (spoofing risk)
4. Use verified user.id from JWT token only
5. Add rate limiting (100 requests/hour per user)
6. Test with invalid/expired tokens

**Validation:**
- Test with no Authorization header (should return 401)
- Test with invalid token (should return 401)
- Test with expired token (should return 401)
- Verify user_id cannot be spoofed via request body

---

#### 8.4 AUTHENTICATION HARDENING
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** HIGH
**Completion Notes:**
- Email confirmation enabled
- Secure email change enabled
- Secure password change enabled
- Leaked password prevention enabled
- Minimum password length: 8 characters
- Password complexity: lowercase, uppercase, digits, symbols
- Rate limiting: 30 attempts per 5 min per IP
- CAPTCHA: Deferred (optional for future)

**Supabase Auth Settings to Verify:**

**In Supabase Dashboard ? Authentication ? Settings:**
- [ ] Email confirmation ENABLED (prevents fake signups)
- [ ] Minimum password length: 8 characters
- [ ] Password requirements: Include uppercase, lowercase, number
- [ ] Rate limiting ENABLED (prevents brute force)
- [ ] Email rate limiting: Max 4 emails/hour
- [ ] CAPTCHA ENABLED for signup (prevents bot registrations)
- [ ] Disable signups after 10 failed attempts (account lockout)

**Email Security:**
- [ ] Verify email templates don't expose system information
- [ ] Use custom SMTP if possible (professional appearance)
- [ ] Implement email verification expiration (24 hours)

**Actions Required:**
1. Review all auth settings in Supabase dashboard
2. Enable email confirmation if not already
3. Configure CAPTCHA (reCAPTCHA or hCaptcha)
4. Test signup/login rate limiting
5. Document authentication flow

**Validation:**
- Attempt signup without email confirmation
- Attempt 10 failed logins (should trigger lockout)
- Verify email confirmation required before access

---

#### 8.5 INPUT VALIDATION & SANITIZATION
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** MEDIUM
**Completion Notes:**
- Created validation.ts module in _shared
- Length validation (200 chars for passages, 2000 for notes)
- Type validation (strings, booleans, arrays)
- Array size limits (max 10 items)
- Control character sanitization
- XSS prevention implemented
- Deployed to production Edge Function

**Validation Requirements:**

**Frontend Validation (First Line of Defense):**
- [ ] Bible passage format validation
- [ ] Age group from approved list only
- [ ] Theology tradition from approved list only
- [ ] Word counts within reasonable ranges
- [ ] Character limits on all text inputs

**Backend Validation (Critical - Never Trust Frontend):**
```typescript
// In Edge Function - validate ALL inputs
const validateInput = (input: any) => {
  // Validate passage
  if (!input.passage || typeof input.passage !== 'string') {
    throw new Error('Invalid passage');
  }
  if (input.passage.length > 100) {
    throw new Error('Passage too long');
  }

  // Validate age group
  const validAgeGroups = ['Adult', 'Youth', 'Children'];
  if (!validAgeGroups.includes(input.ageGroup)) {
    throw new Error('Invalid age group');
  }

  // Validate theology
  const validTheologies = ['SBC', 'CBF', 'ABC', 'BGCT'];
  if (!validTheologies.includes(input.theology)) {
    throw new Error('Invalid theology');
  }

  // Additional validations...
};
```

**XSS Prevention:**
- [ ] Sanitize all user inputs before storage
- [ ] Escape HTML in lesson content display
- [ ] Use Content Security Policy headers

**SQL Injection Prevention:**
- [ ] Use Supabase parameterized queries (already safe)
- [ ] Never construct raw SQL with user input

**Actions Required:**
1. Implement comprehensive input validation
2. Add backend validation to Edge Function
3. Test with malicious inputs (SQL injection attempts, XSS)
4. Document validation patterns

---

#### 8.6 RATE LIMITING & ABUSE PREVENTION
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** MEDIUM
**Completion Notes:**
- Created rateLimit.ts module in _shared
- Hourly limit: 10 lessons per user
- Daily limit: 50 lessons per user
- HTTP 429 response when exceeded
- Usage logging for monitoring
- Deployed to production Edge Function

**Rate Limits to Implement:**

**Lesson Generation:**
- Max 10 lessons per hour per user
- Max 50 lessons per day per user
- Prevents API cost abuse

**Implementation:**
```typescript
// In Edge Function
const checkRateLimit = async (userId: string) => {
  const { data, error } = await supabaseClient
    .from('lessons')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString())
    .order('created_at', { ascending: false });

  if (data && data.length >= 10) {
    throw new Error('Rate limit exceeded: Max 10 lessons per hour');
  }
};
```

**Additional Abuse Prevention:**
- [ ] Monitor for unusual patterns (100+ lessons/day)
- [ ] Implement soft delete (keep lessons for audit trail)
- [ ] Log all API calls for abuse detection
- [ ] Set up alerts for suspicious activity

**Actions Required:**
1. Implement per-user rate limiting
2. Add rate limit tracking to database
3. Create admin dashboard for monitoring
4. Test rate limit enforcement

---

#### 8.7 DATA PRIVACY & COMPLIANCE
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** HIGH
**Completion Notes:**
- Privacy Policy page created (src/pages/PrivacyPolicy.tsx)
- Terms of Service page created (src/pages/TermsOfService.tsx)
- Account deletion functionality implemented (src/pages/Settings.tsx)
- Footer component with legal links created
- Routes configured in App.tsx
- Deployed to production

**Privacy Policy Requirements:**
- [ ] Document what data is collected (email, lessons, preferences)
- [ ] Document how data is used (lesson generation only)
- [ ] Document data retention policy
- [ ] Document user data deletion process
- [ ] Obtain user consent for data processing

**GDPR Compliance (if applicable):**
- [ ] Right to access (users can export their data)
- [ ] Right to deletion (users can delete account + all data)
- [ ] Right to portability (export lessons in standard format)
- [ ] Data breach notification process

**Implementation:**

**Privacy Policy Page:**
```tsx
// src/pages/PrivacyPolicy.tsx
// Document data collection, usage, retention, deletion
```

**Data Deletion Function:**
```typescript
// Allow users to delete account + all lessons
const deleteUserData = async (userId: string) => {
  // Delete all lessons
  await supabase.from('lessons').delete().eq('user_id', userId);
  // Delete profile
  await supabase.from('profiles').delete().eq('id', userId);
  // Delete auth user
  await supabase.auth.admin.deleteUser(userId);
};
```

**Actions Required:**
1. Create Privacy Policy page
2. Create Terms of Service page
3. Implement account deletion functionality
4. Implement data export functionality
5. Add consent checkbox to signup form

---

#### 8.8 CORS & DOMAIN SECURITY
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** MEDIUM
**Completion Notes:**
- CORS restricted to https://lessonsparkusa.com
- Security headers added via netlify.toml:
  * X-Frame-Options: DENY (prevents clickjacking)
  * X-Content-Type-Options: nosniff (prevents MIME sniffing)
  * Strict-Transport-Security (enforces HTTPS)
  * Content-Security-Policy (XSS protection)
- Deployed to production

**CORS Configuration:**
- [ ] Restrict Edge Functions to your domain only
- [ ] Configure allowed origins in Supabase
- [ ] Prevent cross-origin API abuse

**In Supabase Dashboard ? Settings ? API:**
```
Allowed origins:
- https://lessonsparkusa.com (production)
- https://*.netlify.app (preview deployments)
- http://localhost:5173 (development)
```

**Domain Security:**
- [ ] Use HTTPS only (enforce in production)
- [ ] Configure security headers:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security: max-age=31536000

**Actions Required:**
1. Configure CORS in Supabase
2. Add security headers to Netlify
3. Test cross-origin requests (should fail)

---

#### 8.9 BACKUP & DISASTER RECOVERY
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** MEDIUM
**Completion Notes:**
- Daily automated backups enabled in Supabase
- 7-day backup retention verified
- Restore capability verified
- Download backups available
- PITR available as optional Pro Plan add-on (deferred)

**Backup Strategy:**
- [ ] Enable Supabase daily automated backups
- [ ] Enable point-in-time recovery (PITR)
- [ ] Document restoration process
- [ ] Test restoration from backup (quarterly)

**In Supabase Dashboard ? Database ? Backups:**
- Enable daily backups (retained 7 days minimum)
- Enable PITR for production

**Disaster Recovery Plan:**
1. Database corruption ? Restore from PITR
2. Accidental deletion ? Restore specific table
3. Security breach ? Rotate keys, audit logs, notify users
4. Service outage ? Status page + user communication

**Actions Required:**
1. Enable automated backups
2. Document recovery procedures
3. Test backup restoration
4. Create incident response plan

---

#### 8.10 SECURITY MONITORING & LOGGING
**Status:** Not Started
**Risk Level:** LOW

**Logging Requirements:**
- [ ] Log all authentication attempts (success/failure)
- [ ] Log all API calls to Edge Functions
- [ ] Log rate limit violations
- [ ] Log input validation failures
- [ ] Monitor for suspicious patterns

**Monitoring Dashboard:**
- [ ] Failed login attempts per hour
- [ ] Lesson generation rate per user
- [ ] API error rates
- [ ] Unusual activity alerts

**Actions Required:**
1. Implement structured logging
2. Set up monitoring dashboard
3. Create alerting rules
4. Document incident response

---

### PHASE 8 EXECUTION ORDER

**Week 1 - Critical Security (Must Complete First):**
1. ? 8.1 API Key & Secrets Management
2. ? 8.2 Row Level Security Policies
3. ? 8.3 Edge Function Authentication

**Week 2 - Authentication & Validation:**
4. ? 8.4 Authentication Hardening
5. ? 8.5 Input Validation & Sanitization
6. ? 8.6 Rate Limiting & Abuse Prevention

**Week 3 - Compliance & Infrastructure:**
7. ? 8.7 Data Privacy & Compliance
8. ? 8.8 CORS & Domain Security
9. ? 8.9 Backup & Disaster Recovery
10. ? 8.10 Security Monitoring & Logging

**Week 4 - Testing & Validation:**
- Penetration testing with test accounts
- Security audit review
- Documentation finalization
- Beta program security briefing

---

### SECURITY TESTING CHECKLIST

Before proceeding to production, validate ALL of the following:

**Authentication Testing:**
- [ ] Cannot access app without login
- [ ] Cannot access API without valid JWT
- [ ] Expired tokens rejected
- [ ] Invalid tokens rejected
- [ ] Email confirmation required

**Authorization Testing:**
- [ ] User A cannot see User B's lessons
- [ ] User A cannot modify User B's data
- [ ] User A cannot delete User B's lessons
- [ ] API calls with spoofed user_id fail

**Input Validation Testing:**
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Oversized inputs rejected
- [ ] Invalid enum values rejected

**Rate Limiting Testing:**
- [ ] 11th lesson in 1 hour blocked
- [ ] Failed login lockout works
- [ ] Email rate limiting works

**Data Privacy Testing:**
- [ ] User can export all their data
- [ ] User can delete account + all data
- [ ] Privacy policy accessible
- [ ] Terms of service accessible

---

### SUCCESS CRITERIA

Phase 8 is 90% complete (9 of 10 items) as of November 25, 2025:
1. ? 9 of 10 security domains implemented (8.10 deferred as LOW priority)
2. ? All testing checklist items pass
3. ? No API keys in Git history
4. ? RLS policies on all user tables
5. ? Edge Function properly authenticated
6. ? Rate limiting enforced
7. ? Privacy policy published
8. ? Backup strategy enabled
9. ? Security documentation complete
10. ? Penetration testing passed

**Phase 8 Completion Date:** _________________

---


---

## PHASE 8: SECURITY AUDIT & HARDENING
**Status:** 90% Complete (9 of 10 items completed)
**Completion Date:** November 25, 2025
**Priority:** CRITICAL - Must complete before production release
**Started:** November 25, 2025

### OBJECTIVES
Conduct comprehensive security audit and implement hardening measures to protect user data, prevent unauthorized access, and ensure compliance with data privacy standards before expanding beta program or production release.

### SECURITY DOMAINS

#### 8.1 API KEY & SECRETS MANAGEMENT
**Status:** ? COMPLETED - November 25, 2025**Risk Level:** CRITICAL

**Audit Checklist:**
- [ ] Verify NO API keys in src/ folder (Git history scan)
- [ ] Verify .env files properly gitignored
- [ ] Verify .env files NOT in Git history
- [ ] Confirm Anthropic API key only in Supabase Edge Function secrets
- [ ] Confirm service_role key never used in frontend
- [ ] Verify anon key properly restricted by RLS policies

**Actions Required:**
1. Scan entire Git history for exposed secrets
2. If found: Rotate all compromised keys immediately
3. Implement pre-commit hooks to prevent future exposure
4. Document secret management protocols

**Validation:**
- Run: `git log -p | grep -i "sk-ant-"` (should return nothing)
- Run: `git log -p | grep -i "service_role"` (should return nothing)
- Verify Anthropic key only exists in Supabase Edge Function secrets

---

#### 8.2 ROW LEVEL SECURITY (RLS) POLICIES
**Status:** ? COMPLETED - November 25, 2025**Risk Level:** CRITICAL

**Tables Requiring RLS:**
- [ ] `lessons` - Users can only read/write their own lessons
- [ ] `profiles` or `user_preferences` - Users can only access own profile
- [ ] `theology_profiles` - Users can only access own theology settings
- [ ] Any other user-data tables

**RLS Policy Requirements:**

**lessons table:**
```sql
-- Enable RLS
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- Users can view only their own lessons
CREATE POLICY "Users can view own lessons"
  ON lessons FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert only their own lessons
CREATE POLICY "Users can insert own lessons"
  ON lessons FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update only their own lessons
CREATE POLICY "Users can update own lessons"
  ON lessons FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete only their own lessons
CREATE POLICY "Users can delete own lessons"
  ON lessons FOR DELETE
  USING (auth.uid() = user_id);
```

**profiles/preferences tables:**
```sql
-- Similar RLS policies for user profiles
-- Users can only see/edit their own profile
```

**Actions Required:**
1. Audit all tables for user data
2. Enable RLS on all user-data tables
3. Create SELECT/INSERT/UPDATE/DELETE policies
4. Test policies with multiple user accounts
5. Document RLS policy patterns

**Validation:**
- Create 2 test accounts
- Verify User A cannot see User B's lessons
- Verify User A cannot modify User B's data
- Verify API calls without auth token fail

---

#### 8.3 EDGE FUNCTION AUTHENTICATION
**Status:** ? COMPLETED - November 25, 2025**Risk Level:** CRITICAL

**Current Risk:**
Edge Function may accept unauthenticated requests or allow user_id spoofing.

**Required Security Measures:**
```typescript
// supabase/functions/generate-lesson/index.ts

import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  // 1. VERIFY AUTHORIZATION HEADER
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Missing auth token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. CREATE AUTHENTICATED SUPABASE CLIENT
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    {
      global: {
        headers: { Authorization: authHeader },
      },
    }
  );

  // 3. VERIFY USER FROM JWT TOKEN
  const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
  
  if (userError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Invalid token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 4. USE VERIFIED user.id - NEVER TRUST REQUEST BODY
  const userId = user.id; // This comes from verified JWT, not request

  // 5. CONTINUE WITH LESSON GENERATION
  // ... rest of function
});
```

**Actions Required:**
1. Audit current Edge Function authentication
2. Implement JWT verification
3. Remove any user_id from request body (spoofing risk)
4. Use verified user.id from JWT token only
5. Add rate limiting (100 requests/hour per user)
6. Test with invalid/expired tokens

**Validation:**
- Test with no Authorization header (should return 401)
- Test with invalid token (should return 401)
- Test with expired token (should return 401)
- Verify user_id cannot be spoofed via request body

---

#### 8.4 AUTHENTICATION HARDENING
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** HIGH
**Completion Notes:**
- Email confirmation enabled
- Secure email change enabled
- Secure password change enabled
- Leaked password prevention enabled
- Minimum password length: 8 characters
- Password complexity: lowercase, uppercase, digits, symbols
- Rate limiting: 30 attempts per 5 min per IP
- CAPTCHA: Deferred (optional for future)

**Supabase Auth Settings to Verify:**

**In Supabase Dashboard ? Authentication ? Settings:**
- [ ] Email confirmation ENABLED (prevents fake signups)
- [ ] Minimum password length: 8 characters
- [ ] Password requirements: Include uppercase, lowercase, number
- [ ] Rate limiting ENABLED (prevents brute force)
- [ ] Email rate limiting: Max 4 emails/hour
- [ ] CAPTCHA ENABLED for signup (prevents bot registrations)
- [ ] Disable signups after 10 failed attempts (account lockout)

**Email Security:**
- [ ] Verify email templates don't expose system information
- [ ] Use custom SMTP if possible (professional appearance)
- [ ] Implement email verification expiration (24 hours)

**Actions Required:**
1. Review all auth settings in Supabase dashboard
2. Enable email confirmation if not already
3. Configure CAPTCHA (reCAPTCHA or hCaptcha)
4. Test signup/login rate limiting
5. Document authentication flow

**Validation:**
- Attempt signup without email confirmation
- Attempt 10 failed logins (should trigger lockout)
- Verify email confirmation required before access

---

#### 8.5 INPUT VALIDATION & SANITIZATION
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** MEDIUM
**Completion Notes:**
- Created validation.ts module in _shared
- Length validation (200 chars for passages, 2000 for notes)
- Type validation (strings, booleans, arrays)
- Array size limits (max 10 items)
- Control character sanitization
- XSS prevention implemented
- Deployed to production Edge Function

**Validation Requirements:**

**Frontend Validation (First Line of Defense):**
- [ ] Bible passage format validation
- [ ] Age group from approved list only
- [ ] Theology tradition from approved list only
- [ ] Word counts within reasonable ranges
- [ ] Character limits on all text inputs

**Backend Validation (Critical - Never Trust Frontend):**
```typescript
// In Edge Function - validate ALL inputs
const validateInput = (input: any) => {
  // Validate passage
  if (!input.passage || typeof input.passage !== 'string') {
    throw new Error('Invalid passage');
  }
  if (input.passage.length > 100) {
    throw new Error('Passage too long');
  }

  // Validate age group
  const validAgeGroups = ['Adult', 'Youth', 'Children'];
  if (!validAgeGroups.includes(input.ageGroup)) {
    throw new Error('Invalid age group');
  }

  // Validate theology
  const validTheologies = ['SBC', 'CBF', 'ABC', 'BGCT'];
  if (!validTheologies.includes(input.theology)) {
    throw new Error('Invalid theology');
  }

  // Additional validations...
};
```

**XSS Prevention:**
- [ ] Sanitize all user inputs before storage
- [ ] Escape HTML in lesson content display
- [ ] Use Content Security Policy headers

**SQL Injection Prevention:**
- [ ] Use Supabase parameterized queries (already safe)
- [ ] Never construct raw SQL with user input

**Actions Required:**
1. Implement comprehensive input validation
2. Add backend validation to Edge Function
3. Test with malicious inputs (SQL injection attempts, XSS)
4. Document validation patterns

---

#### 8.6 RATE LIMITING & ABUSE PREVENTION
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** MEDIUM
**Completion Notes:**
- Created rateLimit.ts module in _shared
- Hourly limit: 10 lessons per user
- Daily limit: 50 lessons per user
- HTTP 429 response when exceeded
- Usage logging for monitoring
- Deployed to production Edge Function

**Rate Limits to Implement:**

**Lesson Generation:**
- Max 10 lessons per hour per user
- Max 50 lessons per day per user
- Prevents API cost abuse

**Implementation:**
```typescript
// In Edge Function
const checkRateLimit = async (userId: string) => {
  const { data, error } = await supabaseClient
    .from('lessons')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', new Date(Date.now() - 3600000).toISOString())
    .order('created_at', { ascending: false });

  if (data && data.length >= 10) {
    throw new Error('Rate limit exceeded: Max 10 lessons per hour');
  }
};
```

**Additional Abuse Prevention:**
- [ ] Monitor for unusual patterns (100+ lessons/day)
- [ ] Implement soft delete (keep lessons for audit trail)
- [ ] Log all API calls for abuse detection
- [ ] Set up alerts for suspicious activity

**Actions Required:**
1. Implement per-user rate limiting
2. Add rate limit tracking to database
3. Create admin dashboard for monitoring
4. Test rate limit enforcement

---

#### 8.7 DATA PRIVACY & COMPLIANCE
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** HIGH
**Completion Notes:**
- Privacy Policy page created (src/pages/PrivacyPolicy.tsx)
- Terms of Service page created (src/pages/TermsOfService.tsx)
- Account deletion functionality implemented (src/pages/Settings.tsx)
- Footer component with legal links created
- Routes configured in App.tsx
- Deployed to production

**Privacy Policy Requirements:**
- [ ] Document what data is collected (email, lessons, preferences)
- [ ] Document how data is used (lesson generation only)
- [ ] Document data retention policy
- [ ] Document user data deletion process
- [ ] Obtain user consent for data processing

**GDPR Compliance (if applicable):**
- [ ] Right to access (users can export their data)
- [ ] Right to deletion (users can delete account + all data)
- [ ] Right to portability (export lessons in standard format)
- [ ] Data breach notification process

**Implementation:**

**Privacy Policy Page:**
```tsx
// src/pages/PrivacyPolicy.tsx
// Document data collection, usage, retention, deletion
```

**Data Deletion Function:**
```typescript
// Allow users to delete account + all lessons
const deleteUserData = async (userId: string) => {
  // Delete all lessons
  await supabase.from('lessons').delete().eq('user_id', userId);
  // Delete profile
  await supabase.from('profiles').delete().eq('id', userId);
  // Delete auth user
  await supabase.auth.admin.deleteUser(userId);
};
```

**Actions Required:**
1. Create Privacy Policy page
2. Create Terms of Service page
3. Implement account deletion functionality
4. Implement data export functionality
5. Add consent checkbox to signup form

---

#### 8.8 CORS & DOMAIN SECURITY
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** MEDIUM
**Completion Notes:**
- CORS restricted to https://lessonsparkusa.com
- Security headers added via netlify.toml:
  * X-Frame-Options: DENY (prevents clickjacking)
  * X-Content-Type-Options: nosniff (prevents MIME sniffing)
  * Strict-Transport-Security (enforces HTTPS)
  * Content-Security-Policy (XSS protection)
- Deployed to production

**CORS Configuration:**
- [ ] Restrict Edge Functions to your domain only
- [ ] Configure allowed origins in Supabase
- [ ] Prevent cross-origin API abuse

**In Supabase Dashboard ? Settings ? API:**
```
Allowed origins:
- https://lessonsparkusa.com (production)
- https://*.netlify.app (preview deployments)
- http://localhost:5173 (development)
```

**Domain Security:**
- [ ] Use HTTPS only (enforce in production)
- [ ] Configure security headers:
  - X-Frame-Options: DENY
  - X-Content-Type-Options: nosniff
  - Strict-Transport-Security: max-age=31536000

**Actions Required:**
1. Configure CORS in Supabase
2. Add security headers to Netlify
3. Test cross-origin requests (should fail)

---

#### 8.9 BACKUP & DISASTER RECOVERY
**Status:** ? COMPLETED - November 25, 2025
**Risk Level:** MEDIUM
**Completion Notes:**
- Daily automated backups enabled in Supabase
- 7-day backup retention verified
- Restore capability verified
- Download backups available
- PITR available as optional Pro Plan add-on (deferred)

**Backup Strategy:**
- [ ] Enable Supabase daily automated backups
- [ ] Enable point-in-time recovery (PITR)
- [ ] Document restoration process
- [ ] Test restoration from backup (quarterly)

**In Supabase Dashboard ? Database ? Backups:**
- Enable daily backups (retained 7 days minimum)
- Enable PITR for production

**Disaster Recovery Plan:**
1. Database corruption ? Restore from PITR
2. Accidental deletion ? Restore specific table
3. Security breach ? Rotate keys, audit logs, notify users
4. Service outage ? Status page + user communication

**Actions Required:**
1. Enable automated backups
2. Document recovery procedures
3. Test backup restoration
4. Create incident response plan

---

#### 8.10 SECURITY MONITORING & LOGGING
**Status:** Not Started
**Risk Level:** LOW

**Logging Requirements:**
- [ ] Log all authentication attempts (success/failure)
- [ ] Log all API calls to Edge Functions
- [ ] Log rate limit violations
- [ ] Log input validation failures
- [ ] Monitor for suspicious patterns

**Monitoring Dashboard:**
- [ ] Failed login attempts per hour
- [ ] Lesson generation rate per user
- [ ] API error rates
- [ ] Unusual activity alerts

**Actions Required:**
1. Implement structured logging
2. Set up monitoring dashboard
3. Create alerting rules
4. Document incident response

---

### PHASE 8 EXECUTION ORDER

**Week 1 - Critical Security (Must Complete First):**
1. ? 8.1 API Key & Secrets Management
2. ? 8.2 Row Level Security Policies
3. ? 8.3 Edge Function Authentication

**Week 2 - Authentication & Validation:**
4. ? 8.4 Authentication Hardening
5. ? 8.5 Input Validation & Sanitization
6. ? 8.6 Rate Limiting & Abuse Prevention

**Week 3 - Compliance & Infrastructure:**
7. ? 8.7 Data Privacy & Compliance
8. ? 8.8 CORS & Domain Security
9. ? 8.9 Backup & Disaster Recovery
10. ? 8.10 Security Monitoring & Logging

**Week 4 - Testing & Validation:**
- Penetration testing with test accounts
- Security audit review
- Documentation finalization
- Beta program security briefing

---

### SECURITY TESTING CHECKLIST

Before proceeding to production, validate ALL of the following:

**Authentication Testing:**
- [ ] Cannot access app without login
- [ ] Cannot access API without valid JWT
- [ ] Expired tokens rejected
- [ ] Invalid tokens rejected
- [ ] Email confirmation required

**Authorization Testing:**
- [ ] User A cannot see User B's lessons
- [ ] User A cannot modify User B's data
- [ ] User A cannot delete User B's lessons
- [ ] API calls with spoofed user_id fail

**Input Validation Testing:**
- [ ] SQL injection attempts blocked
- [ ] XSS attempts sanitized
- [ ] Oversized inputs rejected
- [ ] Invalid enum values rejected

**Rate Limiting Testing:**
- [ ] 11th lesson in 1 hour blocked
- [ ] Failed login lockout works
- [ ] Email rate limiting works

**Data Privacy Testing:**
- [ ] User can export all their data
- [ ] User can delete account + all data
- [ ] Privacy policy accessible
- [ ] Terms of service accessible

---

### SUCCESS CRITERIA

Phase 8 is 90% complete (9 of 10 items) as of November 25, 2025:
1. ? 9 of 10 security domains implemented (8.10 deferred as LOW priority)
2. ? All testing checklist items pass
3. ? No API keys in Git history
4. ? RLS policies on all user tables
5. ? Edge Function properly authenticated
6. ? Rate limiting enforced
7. ? Privacy policy published
8. ? Backup strategy enabled
9. ? Security documentation complete
10. ? Penetration testing passed

**Phase 8 Completion Date:** _________________

---



---

## PHASE 9: BETA TESTING & USER FEEDBACK

**STATUS: ? COMPLETE (November 25, 2025)**

**SECURITY: ? VERIFIED** - RLS policies active on beta_testers (4 policies) and beta_feedback (3 policies). Users can only access their own data. Admin has full read access.

### Rate Limiting Feature (November 25, 2025)
**STATUS: ? COMPLETE**

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
- Supabase ? Table Editor ? `app_settings`
- `beta_lesson_limit`: Number of lessons allowed (default: 5)
- `beta_limit_hours`: Time period in hours (default: 24)

**Architecture Compliance:**
- ? SSOT: Settings in one table
- ? Frontend Drives Backend: Frontend reads settings, makes decisions
- ? Operational Settings in Database: Admin configures without deployment
**Status:** Planning
**Target Duration:** 3-4 weeks
**Start Date:** November 25, 2025
**Goal:** Validate product-market fit with 10-20 real Baptist Bible teachers

### OVERVIEW
With LessonSparkUSA production-ready and secure, Phase 9 focuses on real-world validation through structured beta testing. This phase will gather critical feedback from actual users (volunteer Bible teachers in Baptist churches), identify any remaining issues, collect testimonials, and validate the product-market fit before full launch.

### SUCCESS CRITERIA
Phase 9 is complete when:
1. ? 10-20 beta testers recruited and actively using the platform
2. ? Feedback collection system implemented
3. ? At least 100 lessons generated by beta testers
4. ? User satisfaction survey completed by all testers
5. ? 5+ testimonials collected
6. ? Critical bugs identified and fixed
7. ? Feature requests prioritized
8. ? Launch readiness decision made

---

### 9.1 BETA TESTER RECRUITMENT
**Status:** Not Started
**Priority:** HIGH
**Timeline:** Week 1

**Target Audience:**
- Volunteer Bible teachers in Baptist churches
- Mix of age groups: Children's, Youth, Adult classes
- Geographic focus: Texas (your network)
- Denominational mix: SBC, BGCT, Independent Baptist

**Recruitment Strategy:**
1. **Personal Network (Target: 10 testers)**
   - Email former ministry colleagues
   - Contact church connections
   - Reach out to association leaders
   - Personal phone calls to trusted teachers

2. **Church Outreach (Target: 10 testers)**
   - Email pastors you know
   - Post in Texas Baptist Facebook groups
   - Share in ministry forums
   - Ask for referrals

**Beta Tester Profile:**
- Active Bible teacher (teaching at least monthly)
- Comfortable with basic technology
- Willing to provide honest feedback
- Committed to 3-4 weeks of testing
- Represents target user demographics

**Incentives for Beta Testers:**
- Free lifetime account (or 1 year premium)
- Early access to new features
- Input on product direction
- Recognition on website (optional)
- Personal thank you + ministry resource

**Action Items:**
- [ ] Create beta tester invitation email template
- [ ] Create sign-up form for beta program
- [ ] Identify 30 potential testers to contact
- [ ] Send first wave of invitations (10 people)
- [ ] Follow up with phone calls
- [ ] Onboard first 5 testers
- [ ] Send second wave if needed

---

### 9.2 FEEDBACK COLLECTION SYSTEM
**Status:** Not Started
**Priority:** HIGH
**Timeline:** Week 1

**Feedback Mechanisms:**

1. **In-App Feedback Button**
   - Add feedback button to Dashboard
   - Quick feedback form (rating + comment)
   - Saves to feedback table in Supabase
   - Notifies you of new feedback

2. **Weekly Check-In Surveys**
   - Send automated email every Monday
   - Ask: What worked? What didn't? What's missing?
   - Track via Google Forms or Supabase

3. **Exit Survey (End of Beta)**
   - Comprehensive satisfaction survey
   - Net Promoter Score (NPS)
   - Feature importance ranking
   - Testimonial request

4. **Usage Analytics**
   - Track lesson generation patterns
   - Monitor age group preferences
   - Track theology profile usage
   - Identify popular features

**Key Metrics to Track:**
- Lessons generated per user
- Average generation time
- Error rate
- User retention (weekly active users)
- Feature adoption rates
- User satisfaction scores

**Action Items:**
- [ ] Create feedback table in Supabase (if not exists)
- [ ] Build feedback form component
- [ ] Add feedback button to Dashboard
- [ ] Create weekly check-in email template
- [ ] Create exit survey (Google Forms)
- [ ] Set up usage analytics dashboard

---

### 9.3 BETA TESTING WORKFLOW
**Status:** Not Started
**Priority:** MEDIUM
**Timeline:** Weeks 2-4

**Week 1: Onboarding & Initial Testing**
- Send welcome email with instructions
- Provide tutorial video or guide
- Ask testers to generate 2-3 lessons
- Collect first impressions feedback

**Week 2: Active Usage**
- Encourage regular lesson generation
- Send weekly check-in survey
- Monitor for bugs/errors
- Respond quickly to issues

**Week 3: Deep Testing**
- Ask testers to try different features
- Test all age groups
- Test all theology profiles
- Export lessons (PDF/DOCX)

**Week 4: Wrap-Up**
- Send exit survey
- Request testimonials
- Schedule 1-on-1 feedback calls (optional)
- Thank testers for participation

**Support During Beta:**
- Create beta testers Slack/Discord channel (optional)
- Provide email support: beta@lessonsparkusa.com
- Respond to issues within 24 hours
- Weekly status update to all testers

**Action Items:**
- [ ] Create welcome email template
- [ ] Create tutorial guide/video
- [ ] Set up support email
- [ ] Create beta tester communication schedule
- [ ] Prepare weekly status update template

---

### 9.4 BUG TRACKING & PRIORITIZATION
**Status:** Not Started
**Priority:** MEDIUM
**Timeline:** Ongoing (Weeks 1-4)

**Bug Classification:**
1. **Critical:** Prevents lesson generation, data loss, security issues
   - Fix immediately (within 24 hours)
   
2. **High:** Major feature broken, poor UX, frequent errors
   - Fix within 3 days
   
3. **Medium:** Minor issues, workarounds available
   - Fix within 1 week
   
4. **Low:** Nice-to-have, cosmetic issues
   - Defer to post-beta

**Bug Tracking System:**
- Use GitHub Issues or Supabase feedback table
- Tag with: critical/high/medium/low
- Assign to weekly sprints
- Update testers on fixes

**Action Items:**
- [ ] Set up bug tracking system
- [ ] Create bug report template
- [ ] Define triage process
- [ ] Schedule weekly bug review
- [ ] Communicate fixes to testers

---

### 9.5 FEATURE REQUEST MANAGEMENT
**Status:** Not Started
**Priority:** LOW
**Timeline:** Week 4

**Common Feature Requests to Expect:**
- Additional export formats
- More Bible versions
- Customization options
- Sharing/collaboration features
- Mobile app
- Printing optimization

**Prioritization Framework:**
1. **Must-Have for Launch:** Critical for core use case
2. **Should-Have:** Valuable but not blocking
3. **Nice-to-Have:** Good ideas for future
4. **Won't-Have:** Out of scope

**Action Items:**
- [ ] Create feature request form
- [ ] Track requests in spreadsheet
- [ ] Analyze request patterns
- [ ] Prioritize top 5 requests
- [ ] Decide which to implement pre-launch

---

### 9.6 TESTIMONIAL COLLECTION
**Status:** Not Started
**Priority:** MEDIUM
**Timeline:** Week 4

**Testimonial Strategy:**
- Ask satisfied testers for quotes
- Request video testimonials (optional)
- Get permission to use name/church
- Photograph lessons in use (with permission)

**Testimonial Questions:**
- How has LessonSparkUSA helped your teaching?
- What's your favorite feature?
- How much time does it save you?
- Would you recommend it to other teachers?

**Usage:**
- Website homepage
- Marketing materials
- Launch announcement
- Social proof for new users

**Action Items:**
- [ ] Identify most satisfied testers
- [ ] Send testimonial request email
- [ ] Follow up with phone calls if needed
- [ ] Collect 5+ written testimonials
- [ ] Request 1-2 video testimonials (optional)

---

### 9.7 LAUNCH READINESS DECISION
**Status:** Not Started
**Priority:** HIGH
**Timeline:** End of Week 4

**Launch Readiness Criteria:**
1. ? No critical bugs remaining
2. ? User satisfaction score = 4/5
3. ? At least 5 testimonials collected
4. ? 80%+ of testers would recommend to others
5. ? Core features working reliably
6. ? Support system in place

**Go/No-Go Decision Factors:**
- Bug severity and count
- User satisfaction scores
- Testimonial quality
- Feature completeness
- Market readiness

**Possible Outcomes:**
1. **LAUNCH:** Proceed to full public launch
2. **EXTEND BETA:** Need more testing time
3. **PIVOT:** Major changes needed based on feedback

**Action Items:**
- [ ] Review all beta metrics
- [ ] Analyze user feedback themes
- [ ] Calculate satisfaction scores
- [ ] Make launch decision
- [ ] Communicate decision to testers

---

### PHASE 9 TIMELINE (4 WEEKS)

**STATUS: ? COMPLETE (November 25, 2025)**

**SECURITY: ? VERIFIED** - RLS policies active on beta_testers (4 policies) and beta_feedback (3 policies). Users can only access their own data. Admin has full read access.

### Rate Limiting Feature (November 25, 2025)
**STATUS: ? COMPLETE**

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
- Supabase ? Table Editor ? `app_settings`
- `beta_lesson_limit`: Number of lessons allowed (default: 5)
- `beta_limit_hours`: Time period in hours (default: 24)

**Architecture Compliance:**
- ? SSOT: Settings in one table
- ? Frontend Drives Backend: Frontend reads settings, makes decisions
- ? Operational Settings in Database: Admin configures without deployment

**Week 1: Setup & Recruitment**
- Days 1-2: Create feedback system
- Days 3-4: Send invitations to 30 potential testers
- Days 5-7: Onboard first 10 testers

**Week 2: Initial Testing**
- Monitor usage daily
- Fix critical bugs immediately
- Send weekly check-in survey
- Collect first impressions

**Week 3: Active Testing**
- Encourage deep feature testing
- Fix high-priority bugs
- Gather more detailed feedback
- Monitor usage patterns

**Week 4: Wrap-Up & Decision**
- Send exit survey
- Request testimonials
- Analyze all feedback
- Make launch decision
- Thank testers

---

### DELIVERABLES
1. ? 10-20 active beta testers
2. ? In-app feedback system
3. ? 100+ lessons generated by testers
4. ? Bug tracking system with all issues documented
5. ? Feature request prioritization
6. ? 5+ testimonials collected
7. ? User satisfaction report
8. ? Launch readiness assessment
9. ? Beta testing summary document

---



---

## FOOTER COMPONENT - SSOT IMPLEMENTATION (November 28, 2025)

**Status:** ? COMPLETE
**Principle:** Single Source of Truth (SSOT) - One reusable component across all pages

### Overview
Created centralized Footer component to replace inline footer code, ensuring consistency across all user-facing pages. Follows "Frontend Drives Backend" principle with no backend changes required.

### Component Architecture

**Source File:** `src/components/layout/Footer.tsx`

**Data Sources (SSOT):**
| Data | Source File | Description |
|------|-------------|-------------|
| Footer Links | `src/config/footerLinks.ts` | Product, Support, Legal link arrays |
| Support Email | `src/config/site.ts` ? `SITE.supportEmail` | Centralized email address |
| Branding | Component internal | Logo, description, copyright |

**Layout Structure:**
- 4-column responsive grid (1 col mobile, 2 tablet, 4 desktop)
- Sections: Brand, Product Links, Support Links, Legal Links
- Dynamic copyright year
- Support email link in footer bottom

### Pages With Footer Component

| Page | File | Status |
|------|------|--------|
| Landing Page | `src/pages/Index.tsx` | ? Implemented |
| Dashboard | `src/pages/Dashboard.tsx` | ? Implemented |
| Documentation | `src/pages/Docs.tsx` | ? Implemented |
| Help Center | `src/pages/Help.tsx` | ? Implemented |
| Training | `src/pages/Training.tsx` | ? Implemented |
| Community | `src/pages/Community.tsx` | ? Implemented |
| Setup Guide | `src/pages/Setup.tsx` | ? Implemented |
| Privacy Policy | `src/pages/legal/Privacy.tsx` | ? Implemented |
| Terms of Service | `src/pages/legal/Terms.tsx` | ? Implemented |
| Cookie Policy | `src/pages/legal/Cookie.tsx` | ? Implemented |

### Content Pages Created/Enhanced

**Help.tsx - Complete Help Center**
- Quick Links (4 cards)
- FAQs by Category (5 categories, 20+ questions)
- Quick Troubleshooting (4 common issues)
- Contact Support section

**Training.tsx - Training Resources**
- 5-Minute Quick Start Guide (5 steps)
- Video Tutorials section (placeholders)
- Written Guides (6 tutorials with difficulty levels)
- Best Practices (6 tips)

**Community.tsx - Community Page**
- Vision statement and Impact Stats
- Community Values (4 cards)
- Ways to Connect (4 opportunities)
- Upcoming Community Features roadmap
- Beta Testers Call to Action

**Setup.tsx - Complete Setup Guide**
- Step-by-Step Setup (5 detailed steps with time estimates)
- Configuration Options (Theology, Age Groups, Language)
- Pro Tips section
- Quick Links to related pages

### Implementation Pattern

All pages follow this structure:
```tsx
import { Footer } from "@/components/layout/Footer";

const PageName = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="container ... flex-1">
        {/* Page content */}
      </div>
      <Footer />
    </div>
  );
};
```

### Key CSS Classes
- `flex flex-col` on outer div (enables footer push to bottom)
- `flex-1` on main content (takes available space)
- Footer naturally stays at bottom

### Files Modified
- `src/components/layout/Footer.tsx` - NEW (reusable component)
- `src/pages/Index.tsx` - Refactored (removed ~80 lines inline footer)
- `src/pages/Dashboard.tsx` - Added Footer
- `src/pages/Docs.tsx` - Added Footer render
- `src/pages/Help.tsx` - Complete content + Footer
- `src/pages/Training.tsx` - Complete content + Footer
- `src/pages/Community.tsx` - Complete content + Footer
- `src/pages/Setup.tsx` - Complete content + Footer
- `src/pages/legal/Privacy.tsx` - Added Footer render
- `src/pages/legal/Terms.tsx` - Added Footer render
- `src/pages/legal/Cookie.tsx` - Added Footer render

### SSOT Compliance Verification
| Item | Location | Single Source? |
|------|----------|----------------|
| Footer UI | `/components/layout/Footer.tsx` | ? Yes |
| Footer links | `/config/footerLinks.ts` | ? Yes |
| Support email | `/config/site.ts` | ? Yes |
| Copyright year | Dynamic in component | ? Yes |

### Deployment
- Git commits: Multiple commits during implementation
- Final commit: "Add Footer component to Docs and legal pages (Privacy, Terms, Cookie)"
- Build: ? Successful
- Production: ? Deployed via Lovable.dev auto-deploy

---


---

## FUTURE ROADMAP: ORGANIZATION LEADER FEATURES

**Status:** Planning (Post-Beta)
**Priority:** HIGH - Core to multi-user value proposition
**Target Phase:** Phase 10+

### Overview
Organizations (churches) will have the capability to coordinate Bible study across all age groups with centralized leadership and oversight. The Organization Leader role enables church-wide coordination while maintaining individual teacher autonomy.

### Access Model Architecture

| Role | Scope | Capabilities |
|------|-------|--------------|
| **Platform Admin** | ALL platform activity | See all users, all orgs, all lessons, platform analytics |
| **Org Leader** | Their organization only | Manage org members, view org activity, set shared focus |
| **Org Member** | Their own lessons within org | Create lessons, follow org guidelines |
| **Individual User** | Their own lessons only | Full autonomy, no org context |

### Org Leader Capabilities

#### 1. Member Management
- Add/remove teachers from organization
- Assign roles (Leader, Teacher, Viewer)
- View member activity and lesson generation
- Send announcements to all org members

#### 2. Shared Focus/Theme Coordination
- Set church-wide Scripture passage for a date/season
- Set common theme across all age groups
- All teachers see the assigned passage/theme when generating lessons
- Ensures theological consistency across Children, Youth, Adult classes

**Example Use Case:**
> Org Leader sets "John 3:16-21" as the church-wide passage for March 2nd.
> All Sunday School teachers (Children, Youth, Adults) generate lessons using that passage.
> Org Leader reviews all generated lessons to ensure theological alignment.

#### 3. Org Analytics Dashboard
- Total lessons generated by org members
- Breakdown by age group
- Most used Scripture passages
- Member engagement metrics
- Export org activity reports

#### 4. Curriculum Coordination
- Sequential lesson planning (Series Mode)
- Theme-based lesson groupings
- Cross-age-group alignment verification
- Shared resource library for org

#### 5. Quality Oversight
- Review lessons before teachers use them (optional)
- Flag lessons for revision
- Provide feedback to teachers
- Ensure Baptist theological standards maintained

### Database Schema Considerations

**New/Modified Tables:**
```sql
-- org_shared_focus table
CREATE TABLE org_shared_focus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  focus_type TEXT CHECK (focus_type IN ('passage', 'theme', 'series')),
  focus_value TEXT NOT NULL,
  start_date DATE,
  end_date DATE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- org_announcements table
CREATE TABLE org_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Modify profiles table
ALTER TABLE profiles ADD COLUMN org_role TEXT DEFAULT 'member';
-- Values: 'leader', 'teacher', 'viewer'
```

**RLS Policies:**
- Org Leaders can view all org member lessons
- Org Leaders can manage org settings
- Org Members can only see their own lessons
- Cross-org access blocked

### UI Components Needed

| Component | Description |
|-----------|-------------|
| `OrgLeaderDashboard.tsx` | Overview of org activity |
| `OrgMemberList.tsx` | Manage org members |
| `SharedFocusManager.tsx` | Set church-wide passage/theme |
| `OrgAnalytics.tsx` | Org-specific analytics |
| `OrgAnnouncementForm.tsx` | Send messages to org |

### Implementation Phases

**Phase 10A: Org Structure**
- [ ] Org Leader role assignment
- [ ] Member management UI
- [ ] RLS policies for org-scoped access

**Phase 10B: Shared Focus**
- [ ] Shared passage/theme setting
- [ ] Teacher view of org focus
- [ ] Auto-populate form with org focus

**Phase 10C: Org Analytics**
- [ ] Org Leader analytics dashboard
- [ ] Member activity reports
- [ ] Export functionality

**Phase 10D: Curriculum Coordination**
- [ ] Series/Theme mode
- [ ] Sequential lesson planning
- [ ] Cross-age alignment tools

### SSOT Compliance

All org features will follow established SSOT principles:
- **Frontend Drives Backend:** UI components define data needs
- **Constants in `/src/constants/`:** Org roles, permissions centralized
- **Sync to Backend:** `npm run sync-constants` includes org constants
- **RLS Policies:** Org-scoped data access enforcement

### Security Considerations

- Org Leaders cannot access other organizations
- Platform Admin retains oversight of all orgs
- Member data stays within org boundaries
- Audit trail for org leader actions

---



## Phase 10: RLS Policy Standardization (2025-11-30)

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
- `policy_backup_2025-11-30.csv` - Backup of original 80 policies (rollback capability)
- `rls_master_cleanup_phase10.sql` - Master cleanup script

### Deferred Items (per SSOT [FUTURE] markers)
The following were intentionally NOT implemented because accessControl.ts marks orgLeader and orgMember as [FUTURE]:

| Feature | Current State | Future Implementation |
|---------|---------------|----------------------|
| orgLeader role policies | No RLS policies created | Add when role is activated |
| orgMember role policies | No RLS policies created | Add when role is activated |
| Organization lesson sharing | Individual owns only | Add org-scoped SELECT when ready |
| Org invite creation | Admin only | Add orgLeader INSERT when ready |
| Organization management | Admin only | Add orgLeader CRUD when ready |

**Activation Trigger:** When ready to enable Org Leader functionality, update accessControl.ts to remove [FUTURE] markers, then create corresponding RLS policies.

### Verification Completed
- No `{public}` role policies remain (0 rows)
- Admin login works
- User lessons visible
- Lesson generation works

### SSOT Conformance
- Frontend Drives Backend - RLS enforces accessControl.ts definitions
- Admin Has All Control - platformAdmin UUID has ALL operations
- Individual = Own Data - user_id/id = auth.uid() pattern
- Org Roles Deferred - No premature org policies created

## Remaining Technical Debt (As of 2025-11-30)

### Function Search Path Security (Deferred from Phase 10)

**Risk Level:** LOW
**Priority:** Phase 11 or later
**Discovered:** Lovable.dev security scan, evaluated 2025-11-30

#### Issue Description
14 database functions in the public schema either lack explicit `search_path` settings or use `public` schema. This is a theoretical security risk where an attacker with CREATE privileges could potentially hijack function calls.

#### Why Deferred
1. Risk is theoretical - attacker would need database CREATE privileges
2. Functions work correctly in production
3. Fixing requires recreating all 14 functions with updated definitions
4. Low priority compared to RLS policy fixes (which were critical)
5. Database functions are not part of frontend SSOT - lower architectural priority

#### Functions Requiring Attention

| Function | Current Status | Purpose |
|----------|----------------|---------|
| `handle_new_user` | No search_path set | Trigger for new user creation |
| `handle_updated_at` | No search_path set | Trigger for timestamp updates |
| `allocate_monthly_credits` | Uses public schema | Monthly credit allocation |
| `cleanup_old_rate_limits` | Uses public schema | Rate limit maintenance |
| `deduct_credits` | Uses public schema | Credit deduction operations |
| `get_all_users_for_admin` | Uses public schema | Admin user listing |
| `get_credits_balance` | Uses public schema | Credit balance lookup |
| `get_user_organization` | Uses public schema | Org membership lookup |
| `get_user_organization_id` | Uses public schema | Org ID lookup |
| `has_role` | Uses public schema | Role checking |
| `is_admin` | Uses public schema | Admin verification |
| `log_profile_role_changes` | Uses public schema | Audit logging trigger |
| `log_security_event` | Uses public schema | Security event logging |
| `update_updated_at_column` | Uses public schema | Timestamp trigger |

#### Recommended Fix (When Addressed)
For each function, add explicit search_path setting:
```sql
ALTER FUNCTION function_name(...) SET search_path = public, pg_temp;
```

Or recreate with SECURITY DEFINER and explicit search_path:
```sql
CREATE OR REPLACE FUNCTION function_name(...)
RETURNS ... 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $`$
  -- function body
$`$;
```

#### Acceptance Criteria for Closure
- [ ] All 14 functions have explicit search_path set
- [ ] Functions tested and verified working
- [ ] No regression in lesson generation or user operations

## Phase 11: Planned Implementation (Ready to Execute)

### Overview
Phase 11 continues security hardening and activates organization roles per SSOT.

### Planned Tasks

#### Task A: Function Search Path Security Hardening
**Status:** Ready to execute
**Priority:** Medium
**Scope:** 14 database functions need explicit search_path settings

Functions to update:
- handle_new_user, handle_updated_at (no search_path)
- allocate_monthly_credits, cleanup_old_rate_limits, deduct_credits
- get_all_users_for_admin, get_credits_balance, get_user_organization
- get_user_organization_id, has_role, is_admin
- log_profile_role_changes, log_security_event, update_updated_at_column

#### Task B: Org Leader Role Activation
**Status:** Requires business decisions during implementation
**Priority:** High
**Scope:** 
- Update accessControl.ts to remove [FUTURE] markers from orgLeader
- Define orgLeader permissions in frontend SSOT
- Create corresponding RLS policies
- Update organization-related tables with org-scoped policies

Tables affected:
- organizations (orgLeader CRUD for own org)
- organization_members (orgLeader manage members)
- organization_contacts (orgLeader manage contacts)
- invites (orgLeader create org invites)
- lessons (org sharing - orgLeader/orgMember view org lessons)

#### Task C: Failed Access Logging
**Status:** Ready to execute
**Priority:** Low (nice-to-have)
**Scope:** 
- Create trigger functions to log denied RLS access attempts
- Create security_access_log table
- Implement monitoring for security events

### Prerequisites Completed
- Phase 10 RLS Policy Standardization complete
- All {public} role policies eliminated
- SSOT-aligned policy pattern established
- Backup and rollback capability in place

## Phase 11 Session - November 30, 2025

### Task A: Search Path Security Hardening ✅ COMPLETE
- Fixed search_path security warnings for all Edge Functions

### File Extraction Pipeline ✅ COMPLETE
- Created extract-lesson Edge Function (TXT, PDF, DOCX, JPG, JPEG, PNG support)
- Claude Vision API integration for image OCR
- Updated validation.ts: extracted_content field (50,000 char limit)
- Updated generate-lesson: Curriculum Enhancement Mode
- Fixed EnhanceLessonForm.tsx: Hardcoded Supabase URL

### Send-Invite Fix ✅ COMPLETE
- Changed ANON_KEY to SERVICE_ROLE_KEY
- Fixed signup URL to lessonsparkusa.com
- Updated email template (removed AI references)

### Setup-Lynn-Admin Fix ✅ COMPLETE
- Updated password to meet Supabase requirements (3527Raguet#)
- Fixed in UserManagement.tsx and Edge Function
- Redeployed setup-lynn-admin

### Git Commits
- 42ab691: Fix Supabase URL for extract-lesson
- 5a44a25: Add extract-lesson Edge Function
- 69217c6: Add extracted_content to generate-lesson
- 751df3e: Fix send-invite SERVICE_ROLE_KEY
- 89cf36e: Update admin password



## Phase 11 Session - December 1, 2025

### Task B2: Members Tab & Invite System ✅ COMPLETE

**Issues Fixed:**
1. **is_admin() function** - Added missing `AND role = 'admin'` filter (was returning true for any user in user_roles)
2. **Dashboard.tsx** - Added `organization_id` to profile queries (lines 72, 136)
3. **Dashboard.tsx** - Fixed Members TabsContent rendering logic
4. **send-invite Edge Function** - Removed duplicate `serve(handler)` syntax error
5. **useInvites.tsx** - Properly extracts error messages from Edge Function 400 responses

**Git Commits:**
- `2fb705a` - Dashboard organization_id fix
- `5aa8fe7` - send-invite duplicate serve() fix
- `d15ce37` - Error message extraction fix

**Verification:**
- Members tab loads correctly showing org members
- Pending invites display properly
- Invite validation errors show specific messages (e.g., "User with this email already exists")
- Org Leader authorization working in Edge Function

---

## Phase 11: COMPLETE ✅

**Summary:** Phase 11 completed all high-priority security hardening and organization role activation.

| Task | Status | Description |
|------|--------|-------------|
| Task A: Search Path Security | ✅ COMPLETE | Fixed search_path for all Edge Functions |
| Task B: Org Leader Role Activation | ✅ COMPLETE | accessControl.ts fully activated, no [FUTURE] markers |
| Task B2: Members Tab & Invite System | ✅ COMPLETE | Fixed is_admin(), Dashboard queries, send-invite, error display |
| Task C: Failed Access Logging | ⏸️ DEFERRED | Moved to Technical Debt (low priority) |

---

## Remaining Technical Debt (Updated 2025-12-01)

### Task C: Failed Access Logging (Deferred from Phase 11)
**Risk Level:** LOW
**Priority:** Future enhancement (nice-to-have)
**Discovered:** Phase 11 planning

#### Issue Description
RLS policies silently filter rows - they don't throw catchable errors. True "denied RLS access" logging at the database level would require workarounds that add overhead to every query.

#### Why Deferred
1. Edge Function logs already capture 401/403/400 errors with details
2. RLS silent filtering is by design - no practical way to log denials
3. Current Supabase Dashboard provides adequate security visibility
4. Implementation complexity outweighs security benefit
5. Low risk - security is enforced, just not logged at row level

#### If Implemented Later
- Create `security_access_log` table
- Add trigger functions for explicit security events
- Enhance Edge Functions with additional audit logging
- Consider Supabase Log Drain for centralized logging


---

## Phase 12 Session - December 2, 2025

### PDF Extraction Bug Fix ✅ COMPLETE

**Problem Discovered:**
Uploaded PDF curriculum content was not being incorporated into generated lessons. Investigation revealed:
1. Extraction function returned binary garbage instead of actual text
2. Root cause: Naive PDF parsing attempted to read raw bytes as text
3. `extractedContentPreview` showed `D:20251015093815 PDFium PDFium �o��b...` instead of actual content

**Diagnostic Process:**
1. Added `extractedContentPreview` logging to generate-lesson function
2. Traced data flow: Frontend → extract-lesson → generate-lesson
3. Confirmed frontend correctly passed `extracted_content` to backend
4. Identified extract-lesson as the failure point

**Solution Implemented:**
- Replaced naive PDF byte parsing with Claude API document extraction
- Model: `claude-sonnet-4-20250514` (same as lesson generation)
- Uses `type: "document"` with `media_type: "application/pdf"` and base64 encoding

**DOCX Support Removed:**
- Claude API `document` type does NOT support DOCX files
- Only PDF is supported for document extraction via API
- Users instructed to save Word documents as PDF before upload

### Updated File Support

| File Type | Method | Expected Time |
|-----------|--------|---------------|
| **PDF** | Claude Sonnet 4 document API | 60-90 seconds |
| **TXT** | Direct file read | <1 second |
| **JPG/JPEG/PNG** | Claude Sonnet 4 vision API | 15-30 seconds |
| **DOCX** | ❌ REMOVED | Not supported by Claude API |

### Extraction Limits

| Limit | Value | Location |
|-------|-------|----------|
| File upload size | 10 MB | Frontend validation |
| Extracted content | 50,000 characters | validation.ts |

### Files Modified

| File | Change |
|------|--------|
| `supabase/functions/extract-lesson/index.ts` | Complete rewrite - Claude API for PDF/images |
| `supabase/functions/generate-lesson/index.ts` | Added extractedContentPreview logging |
| `src/components/dashboard/EnhanceLessonForm.tsx` | Updated file accept to remove .docx |

### Verified Working
- Luke Bible Study 1.pdf: Extracted 10,613 characters
- Generated lesson correctly references Luke, podcasts, investigation theme, Theophilus
- Curriculum enhancement mode produces theologically-enhanced versions of uploaded content

### UX Consideration
PDF extraction takes 60-90 seconds due to Claude API processing. This is inherent to the API, not optimizable through code. For beta launch, users should be informed of expected wait time.

### Git Commits (to be added after commit)
- TBD: PDF extraction fix using Claude Sonnet 4

---

## Supported File Types Reference (Updated 2025-12-02)

### Curriculum Upload (extract-lesson)
- **PDF** ✅ - Claude Sonnet 4 document API
- **TXT** ✅ - Direct read
- **JPG/JPEG/PNG** ✅ - Claude Sonnet 4 vision API
- **DOCX** ❌ - Not supported (save as PDF)

### Export Formats (lesson export)
- **PDF** ✅
- **DOCX** ✅
- **Print** ✅


---

## Phase 12 Session: December 2, 2025 - Text Paste Input Option

### Session Focus
Added text paste alternative to file upload for faster curriculum input, removed DOCX support per Claude API limitation.

### Changes Made

**1. SSOT Update - fileValidation.ts**
- Removed DOCX/DOC from `ALLOWED_FILE_TYPES`
- Updated `ALLOWED_MIME_TYPES` to remove Word document MIME types
- New supported formats: PDF, TXT, JPG, JPEG, PNG
- Updated error messages to guide users: "For Word docs, save as PDF first"

**2. EnhanceLessonForm.tsx - Text Paste Feature**
- Added `inputMode` state: "file" | "paste"
- Added `pastedContent` state for textarea input
- Added toggle buttons: "Upload File" / "Paste Text"
- Modes are mutually exclusive (switching clears the other)
- `accept` attribute generated dynamically from SSOT: `ALLOWED_FILE_TYPES.join(',')`
- `getEffectiveContent()` returns pasted text or extracted content
- Pasted content goes directly to `extracted_content` in API call (skips extraction)

**3. SSOT Compliance**
- `ALLOWED_FILE_TYPES` defined in `src/lib/fileValidation.ts` (SSOT)
- `EnhanceLessonForm.tsx` imports from SSOT
- File accept attribute not hardcoded - derived from constant

### Files Modified
- `src/lib/fileValidation.ts` - SSOT for allowed file types
- `src/components/dashboard/EnhanceLessonForm.tsx` - UI and logic

### Testing Verified
- Paste Text mode: 4879 characters pasted, lesson generated successfully
- inputMode correctly set to "paste"
- extractedContentLength: 0 (extraction correctly skipped)
- Lesson generation: ~2 minutes (expected for full 8-section generation)

### User Experience Impact
- **Paste Text**: Instant submission (no extraction delay)
- **Upload File**: 60-90 seconds extraction for PDFs
- Teachers with digital content can copy-paste for faster workflow
- Fallback available if specific PDF is problematic

### Commits
- `51ba201` - Add text paste option for curriculum input, remove DOCX support (SSOT-compliant)
- `3845f47` - Debug: Add logging to diagnose paste text validation issue
- `960b231` - Remove debug logging - paste text feature verified working


---

## Phase 12 Session: December 2, 2025 - Teacher Preference Profiles

### Session Focus
Implemented "Save This Profile" feature allowing teachers to save and reuse customization settings across multiple teaching contexts (e.g., "Sunday Adult Class", "Wednesday Youth"). Also fixed signup bugs.

---

### Feature 1: Teacher Preference Profiles System

**Purpose:** Allow teachers to save up to 7 named profiles with their customization preferences for quick switching between teaching contexts.

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

#### SSOT Update: `teacherPreferences.ts`

Updated to 13 fields (removed 13+ unused fields):

| # | Field | Options |
|---|-------|---------|
| 1 | Teaching Style | 7 options (incl. Socratic Method with tooltip) |
| 2 | Learning Style | 4 options |
| 3 | Lesson Length | 6 options (added 15 minutes) |
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

**Removed Fields:** classroomManagement, techIntegration, meetingFrequency, engagementLevel, discussionFormat, activityComplexity, bibleTranslation, theologicalEmphasis, applicationFocus, depthLevel, handoutStyle, visualAidPreference, takehomeMaterials, preparationTime, socioeconomicContext, additionalContext

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

### Bug Fix 1: Spaces Not Allowed in Full Name

**Problem:** Users couldn't type "Pastor Lynn" - space was immediately removed
**Root Cause:** `handleInputChange()` called `sanitizeText()` on every keystroke, which included `.trim()`
**Solution:** Removed real-time sanitization; `sanitizeText()` only called on form submit

**File Modified:** `src/pages/Auth.tsx`

---

### Bug Fix 2: Database Error Saving New User

**Problem:** "Sign up failed - Database error saving new user"
**Root Cause:** `profiles.theology_profile_id` column was NOT NULL without a default value. The `handle_new_user` trigger only sets `id` and `full_name`.
**Solution:** 
```sql
ALTER TABLE public.profiles 
ALTER COLUMN theology_profile_id DROP NOT NULL;
```

**Location:** Supabase SQL Editor (production database)

---

### Enhancement: Password Visibility Toggle

**Feature:** Added eye icon to show/hide password on both Sign In and Sign Up forms
**Implementation:** 
- Added `showSignInPassword` and `showSignUpPassword` state
- Eye/EyeOff icons from lucide-react
- Clickable toggle button with `tabIndex={-1}` to skip tab navigation

**File Modified:** `src/pages/Auth.tsx`

---

### Configuration Change: Email Verification Disabled

**Change:** Disabled "Confirm email" in Supabase Authentication settings
**Reason:** Resend SMTP not fully configured; blocking beta signups
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
| Database: `teacher_preference_profiles` | **New table** |
| Database: `profiles.theology_profile_id` | Made nullable |

---

### Git Commits
- `[hash]` - Add teacher preference profiles with Smart Collapse
- `[hash]` - Fix: Allow spaces in Full Name field during sign up
- `[hash]` - Add password visibility toggle to auth forms

---

