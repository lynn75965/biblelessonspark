# LessonSparkUSA Master Project Document

**Last Updated:** November 24, 2025
**Current Phase:** Phase 5 - Complete (8-Section Framework Deployed)
**Next Action:** Test lesson generation, then Phase 6 (Teaser)
**Project Owner:** Lynn (Admin)
**Tech Stack:** React/TypeScript (Lovable.dev), Supabase Edge Functions, PostgreSQL, Stripe, Claude/Anthropic API, GitHub, Netlify, PowerShell

---

## COMPREHENSIVE VISION (NEVER CHANGES)

- True SSOT for fixed structural values
- One-location management (add once, works everywhere)
- Easy to add new preferences - Change one place, works everywhere
- Frontend drives backend (frontend is source of truth)
- Freshness: Dynamic, non-repetitive output
- Tiered architecture:
  - Tier 1: Lesson Plan structure (supreme/foundational)
  - Tier 2: Customizations (theological preferences, user preferences)
- All actions support potential export from Lovable.dev
- Keep logic in Supabase Edge Functions (portable) and local repository
- Avoid Lovable-specific dependencies
- Christian values guide all development decisions

---

## GOVERNANCE MODEL

| Principle | Implementation |
|-----------|----------------|
| **Admin controls boundaries** | Lynn manages all constants files; only admin can add/remove/modify options |
| **Users select, not create** | Dropdowns populated from constants; no free-form structural input |
| **Frontend is SSOT** | Constants live in src/constants/; synced to backend via script |
| **Claude creative within bounds** | AI generates fresh content but MUST follow structure and parameters |
| **Export-ready architecture** | All logic portable; no Lovable-specific dependencies |

---

## ARCHITECTURAL RULINGS

### Ruling #1: Backend Behavioral Files (November 24, 2025)

**File:** `customizationDirectives.ts`
**Location:** `supabase/functions/_shared/customizationDirectives.ts` (backend-only)
**Decision:** Option A — Accept as backend-only behavioral file

**Rationale:**
- SSOT governs *what options exist* (frontend constants define dropdown choices)
- This file defines *how Claude interprets* those options (behavioral logic)
- Customization directives are instructions for Claude, not structural definitions

**Boundary Rules:**
- DO NOT add new customization OPTIONS in this file
- New options must be added to frontend constants FIRST
- This file only adds interpretation logic for existing options

---

## 8-SECTION LESSONSPARK FRAMEWORK (Version 2.0.0)

**Governance Principle:** "Maximum sophistication with minimum redundancy"

### Section Structure

| # | Section Name | Words | Purpose | Redundancy Lock |
|---|--------------|-------|---------|-----------------|
| 1 | Lens + Lesson Overview | 150-250 | Frame the lesson | None |
| 2 | Learning Objectives + Key Scriptures | 150-250 | Measurable outcomes | None |
| 3 | Theological Background (Deep-Dive) | 450-600 | **ALL theology here** | None |
| 4 | Opening Activities | 120-200 | Hooks, warm-ups | Section 3 |
| 5 | Main Teaching Content (Transcript) | 450-600 | Spoken classroom delivery | Section 3 |
| 6 | Interactive Activities | 150-250 | Reinforcement activities | Sections 3, 4 |
| 7 | Discussion & Assessment | 200-300 | Comprehension checks | Sections 3, 5 |
| 8 | Student Handout (Standalone) | 250-400 | Fresh student takeaway | Sections 3, 5, 7 |

**Total Word Target:** 1,920 - 2,850 words

### Redundancy Prevention Architecture

- Section 3 contains ALL deep theology — never repeated elsewhere
- Sections 4-8 have `redundancyLock` arrays preventing content duplication
- Each section has explicit `prohibitions` defining what CANNOT appear
- Edge Function dynamically builds prompts from SSOT

### Admin Control Points (in lessonStructure.ts)
```typescript
// Per section, admin controls:
minWords: number;        // Word floor
maxWords: number;        // Word ceiling
contentRules: string[];  // What MUST appear
prohibitions: string[];  // What CANNOT appear
redundancyLock: string[];// Prevents duplication from listed sections
enabled: boolean;        // Turn sections on/off
```

---

## TIERED ARCHITECTURE

### Tier 1 — Supreme/Foundational
- **8-Section Lesson Structure** (~2,400 words average)
- Section names, order, descriptions, word budgets
- Redundancy locks prevent content duplication
- Admin-controlled via SSOT

### Tier 2 — Customizations (User Selects from Admin Options)
- **Age Groups** (11 options with teaching profiles)
- **Theology Profiles** (4 Baptist traditions with 10 distinctives each)
- **16 Teacher Customization Fields** (all with explicit directives)

### Tier 3 — Perpetual Freshness
- Claude generates creative content WITHIN Tier 1 structure
- Same structure, fresh illustrations/examples/wording each time
- User Tier 2 selections shape the creative boundaries

---

## PHASE STATUS

### PHASE 1-4: COMPLETE
- Foundation, Stability, User Experience, Expansion complete
- SSOT architecture established

### PHASE 5: 8-SECTION FRAMEWORK - COMPLETE
- Reduced from 12 sections (~5000 words) to 8 sections (~2400 words)
- Implemented redundancy locks
- Enhanced theology profiles (10 distinctives each)
- Customization directives system (16 fields with explicit instructions)
- 120-second timeout with AbortController
- Timing diagnostics in logs

### PHASE 6: TEASER GENERATION (NEXT)
- Add Section 9: Student Primer / Teaser
- Pre-lesson motivational message
- `deliveryTiming: 'pre-lesson'` already supported in interface
- Separate generation or combined — TBD

### PHASE 7: PRINT-READY OUTPUT (PLANNED)
- PDF export capability
- DOCX export capability
- Section parser for consistent formatting

---

## SSOT FILE LOCATIONS

### Frontend (Authoritative)
- `src/constants/lessonStructure.ts` - 8-section framework (v2.0.0)
- `src/constants/theologyProfiles.ts` - 4 Baptist traditions
- `src/constants/ageGroups.ts` - 11 age groups

### Backend (Auto-generated mirrors)
- `supabase/functions/_shared/lessonStructure.ts`
- `supabase/functions/_shared/theologyProfiles.ts`
- `supabase/functions/_shared/ageGroups.ts`
- `supabase/functions/_shared/customizationDirectives.ts` (backend-only behavioral)

### Sync Command
```
npm run sync-constants
```

---

## THEOLOGY PROFILES

| Profile ID | Name | Distinctives |
|------------|------|--------------|
| southern-baptist-bfm-2000 | Southern Baptist (BF&M 2000) | 10 distinctives + hermeneutics |
| southern-baptist-bfm-1963 | Southern Baptist (BF&M 1963) | 10 distinctives + hermeneutics |
| reformed-baptist | Reformed Baptist | 10 distinctives + hermeneutics |
| independent-baptist | Independent Baptist | 10 distinctives + hermeneutics |

---

## DEBUGGING RESOURCES

- **Supabase Project:** hphebzdftpjbiudpfcrs
- **Supabase Logs:** https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/functions/generate-lesson/logs
- **GitHub:** https://github.com/lynn75965/lesson-spark-usa
- **Live Site:** https://lessonsparkusa.com

---

## CRITICAL REMINDERS

1. **NEVER edit backend _shared/ files directly** - Edit frontend, run sync script
2. **ALWAYS check Supabase logs** before making changes
3. **Frontend drives backend** - UI defines the contract
4. **SSOT is sacred** - One definition, many consumers
5. **Test with:** John 3:16, Elementary Kids, Southern Baptist BF&M 2000

---

## SESSION LOG

### November 24, 2025

**Morning Session:**
- Deployed optimized Edge Function (12-section) — worked but wrong architecture
- Discovered conflict: lessonStructure.ts (12-section) vs lessonSections.ts (8-section)
- Confirmed 8-section framework from Nov 22 was correct but never synced

**Resolution:**
- Replaced lessonStructure.ts with 8-section content
- Archived lessonSections.ts (consolidated to single file)
- Created new Edge Function with dynamic prompt builder
- Reads redundancyLock, prohibitions, contentRules from SSOT
- Synced to backend
- Documented Architectural Ruling #1 (backend behavioral files)

**Files Changed:**
- `src/constants/lessonStructure.ts` — Now 8-section (v2.0.0)
- `supabase/functions/_shared/lessonStructure.ts` — Synced
- `supabase/functions/generate-lesson/index.ts` — New dynamic prompt builder
- `PROJECT_MASTER.md` — Updated

**Status:** Ready for testing

---

**END OF MASTER DOCUMENT**

*This document is the Single Source of Truth for project continuity.*
*Update at the end of every session.*
