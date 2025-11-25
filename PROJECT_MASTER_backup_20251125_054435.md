# LessonSparkUSA - Project Master Document

**Last Updated:** 2025-11-25  
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
✅ **Section 5 Enforcement:** 630-840 word minimum with depth requirements  
✅ **Student Teaser:** Time-neutral signoff, felt-needs only, displays at top  
✅ **No Word Counts:** Removed from section headers  
✅ **No Section 9 Duplication:** Teaser extracted and displayed separately  

### Export Features
✅ **PDF Export:** Calibri 11pt, compact professional spacing, correct title extraction  
✅ **DOCX Export:** Renamed "Document (editable)", correct parameters  
✅ **Print Function:** Calibri 11pt, 1.5 line spacing, 1-inch margins (Bible curriculum standard)  

### UI Improvements
✅ **View Display:** AI-generated title, tighter spacing (line-height 1.3)  
✅ **My Lessons Page:** AI-generated titles, 4 search filters (Passage/Title/Age/Theology)  
✅ **Export Buttons:** Copy, Print, Download (PDF/Document) with clear labels  
✅ **Progress Bar:** Smooth 0-99% progression during generation  

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
**Status:** Planning
**Priority:** CRITICAL - Must complete before production release
**Started:** November 25, 2025

### OBJECTIVES
Conduct comprehensive security audit and implement hardening measures to protect user data, prevent unauthorized access, and ensure compliance with data privacy standards before expanding beta program or production release.

### SECURITY DOMAINS

#### 8.1 API KEY & SECRETS MANAGEMENT
**Status:** Not Started
**Risk Level:** CRITICAL

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
**Status:** Not Started
**Risk Level:** CRITICAL

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
**Status:** Not Started
**Risk Level:** CRITICAL

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
**Status:** Not Started
**Risk Level:** HIGH

**Supabase Auth Settings to Verify:**

**In Supabase Dashboard → Authentication → Settings:**
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
**Status:** Not Started
**Risk Level:** MEDIUM

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
**Status:** Not Started
**Risk Level:** MEDIUM

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
**Status:** Not Started
**Risk Level:** HIGH

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
**Status:** Not Started
**Risk Level:** MEDIUM

**CORS Configuration:**
- [ ] Restrict Edge Functions to your domain only
- [ ] Configure allowed origins in Supabase
- [ ] Prevent cross-origin API abuse

**In Supabase Dashboard → Settings → API:**
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
**Status:** Not Started
**Risk Level:** MEDIUM

**Backup Strategy:**
- [ ] Enable Supabase daily automated backups
- [ ] Enable point-in-time recovery (PITR)
- [ ] Document restoration process
- [ ] Test restoration from backup (quarterly)

**In Supabase Dashboard → Database → Backups:**
- Enable daily backups (retained 7 days minimum)
- Enable PITR for production

**Disaster Recovery Plan:**
1. Database corruption → Restore from PITR
2. Accidental deletion → Restore specific table
3. Security breach → Rotate keys, audit logs, notify users
4. Service outage → Status page + user communication

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
1. ✅ 8.1 API Key & Secrets Management
2. ✅ 8.2 Row Level Security Policies
3. ✅ 8.3 Edge Function Authentication

**Week 2 - Authentication & Validation:**
4. ✅ 8.4 Authentication Hardening
5. ✅ 8.5 Input Validation & Sanitization
6. ✅ 8.6 Rate Limiting & Abuse Prevention

**Week 3 - Compliance & Infrastructure:**
7. ✅ 8.7 Data Privacy & Compliance
8. ✅ 8.8 CORS & Domain Security
9. ✅ 8.9 Backup & Disaster Recovery
10. ✅ 8.10 Security Monitoring & Logging

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

Phase 8 is complete when:
1. ✅ All 10 security domains implemented
2. ✅ All testing checklist items pass
3. ✅ No API keys in Git history
4. ✅ RLS policies on all user tables
5. ✅ Edge Function properly authenticated
6. ✅ Rate limiting enforced
7. ✅ Privacy policy published
8. ✅ Backup strategy enabled
9. ✅ Security documentation complete
10. ✅ Penetration testing passed

**Phase 8 Completion Date:** _________________

---

