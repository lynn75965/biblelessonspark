# LessonSparkUSA Master Project Document

**Last Updated:** November 24, 2025
**Current Phase:** Phase 5 - 95% Complete (Deployment Ready)
**Next Action:** Deploy optimized Edge Function
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
  - Tier 1: Lesson Plan structure (supreme/foundational, UNCHANGING)
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
| **Claude creative within bounds** | AI generates fresh content but MUST follow Tier 1 structure and Tier 2 parameters |
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
- Similar architectural pattern to the Edge Function itself

**Boundary Rules:**
- DO NOT add new customization OPTIONS in this file
- New options must be added to frontend constants FIRST
- This file only adds interpretation logic for existing options
- Does not violate "frontend drives backend" because frontend remains authoritative for structure

---

## TIERED ARCHITECTURE

### Tier 1 — Supreme/Foundational (UNCHANGING)
- **12-Section Lesson Structure** (~2000 words total)
- Section names, order, descriptions, required elements, word budgets
- Redundancy locks prevent content duplication
- These NEVER change based on user input

### Tier 2 — Customizations (User Selects from Admin Options)
- **Age Groups** (11 options with teaching profiles)
- **Theology Profiles** (4 Baptist traditions with full distinctives)
- **16 Teacher Customization Fields** (all with explicit directives)

### Tier 3 — Perpetual Freshness
- Claude generates creative content WITHIN Tier 1 structure
- Same structure, fresh illustrations/examples/wording each time
- User Tier 2 selections shape the creative boundaries

---

## PHASE STATUS

### PHASE 1-4: COMPLETE
- Foundation, Stability, User Experience, Expansion all complete
- 12-section framework operational
- SSOT architecture established

### PHASE 5: UI CUSTOMIZATION (95% COMPLETE)

**Completed:**
1. Expanded customization: 4 fields to 16 fields
2. Theology Profile migration (dual fields to single profile ID)
3. Database schema compliance
4. Word count optimization (2700 to 2000)
5. CORS fixes and syntax cleanup

**Optimizations Deployed (Nov 24, 2025):**

| Optimization | Change | Impact |
|--------------|--------|--------|
| max_tokens | 16,000 to 6,000 | Faster generation |
| temperature | 0.7 to 0.6 | More focused output |
| API timeout | None to 120 seconds | Prevents hanging |
| Timing diagnostics | Basic to Detailed | Pinpoints slow steps |
| Theology profiles | 3 to 10 distinctives each | Full theological guidance |
| Customization directives | Labels only to Explicit instructions | 16 fields actually affect output |
| Output format | Plain text to Markdown | Print-ready formatting |

**Expected Result:** Generation time reduced from 1:15+ (failing) to ~55-65 seconds (success)

### PHASE 6: TEASER GENERATION (PLANNED)
- New "Generate Teaser" button (post-lesson generation)
- 10 teaser approaches x 4 formats
- Separate Edge Function (~30 seconds)
- Must be BLIND to lesson content

### PHASE 7: PRINT-READY OUTPUT (PLANNED)
- Section parser for consistent formatting
- PDF export capability
- DOCX export capability
- Print stylesheet for clean output

---

## SSOT FILE LOCATIONS

### Frontend (Authoritative)
- `src/constants/theologyProfiles.ts` - 4 Baptist traditions
- `src/constants/ageGroups.ts` - 11 age groups
- `src/constants/lessonStructure.ts` - 12 sections

### Backend (Auto-generated mirrors)
- `supabase/functions/_shared/theologyProfiles.ts`
- `supabase/functions/_shared/ageGroups.ts`
- `supabase/functions/_shared/lessonStructure.ts`
- `supabase/functions/_shared/customizationDirectives.ts` (backend-only behavioral)

### Sync Command
```
npm run sync-constants
```

---

## THEOLOGY PROFILES (ENHANCED)

| Profile ID | Name | Distinctives |
|------------|------|--------------|
| southern-baptist-bfm-2000 | Southern Baptist (BF&M 2000) | 10 distinctives + hermeneutics + application focus |
| southern-baptist-bfm-1963 | Southern Baptist (BF&M 1963) | 10 distinctives + hermeneutics + application focus |
| reformed-baptist | Reformed Baptist | 10 distinctives + hermeneutics + application focus |
| independent-baptist | Independent Baptist | 10 distinctives + hermeneutics + application focus |

**Key Differences: BF&M 1963 vs 2000**
- **1963:** "Biblical authority" - record of revelation; "Christ is the criterion" hermeneutic
- **2000:** "Biblical inerrancy" - totally true and trustworthy; complementarian roles explicit

---

## CUSTOMIZATION FIELDS (16 Total)

All fields now have **explicit directives** that Claude must follow:

| Field | Options | Directive Impact |
|-------|---------|------------------|
| Teaching Style | 6 | Structures content delivery method |
| Learning Style | 5 | Includes visual/auditory/kinesthetic elements |
| Lesson Length | 5 | Adjusts content density and activity count |
| Group Size | 5 | Designs activities for group dynamics |
| Learning Environment | 6 | Adapts for classroom/home/virtual/outdoor |
| Student Experience | 4 | Adjusts theological depth and terminology |
| Cultural Context | 5 | Uses appropriate illustrations |
| Special Needs | 5 | Modifies language and accessibility |
| Lesson Sequence | 5 | Standalone vs series vs retreat format |
| Assessment Style | 6 | Includes appropriate evaluation methods |
| Activity Types | 7 | Includes selected activity categories |
| Language | 3 | Full lesson in selected language |
| Education Experience | 9 | Vocabulary and concept complexity |
| Bible Passage | Free text | Primary content source |
| Focused Topic | Free text | Alternative to passage |
| Additional Notes | Free text | Teacher-specific requests |

---

## DEBUGGING RESOURCES

### Supabase Dashboard
- Project: hphebzdftpjbiudpfcrs
- Functions: https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/functions/generate-lesson
- Logs: https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/functions/generate-lesson/logs

### GitHub
- Repository: https://github.com/lynn75965/lesson-spark-usa

### Netlify
- Site: lesson-spark-usa
- Domain: lessonsparkusa.com

---

## CRITICAL REMINDERS

1. **NEVER edit backend _shared/ files directly** - Edit frontend, run sync script
2. **ALWAYS check Supabase logs** before making changes
3. **Frontend drives backend** - UI defines the contract
4. **SSOT is sacred** - One definition, many consumers
5. **Test with:** John 3:16, Elementary Kids, Southern Baptist BF&M 2000
6. **Deploy in stages** - Verify each change before adding more

---

## SESSION LOG

### November 24, 2025
- Analyzed Edge Function for timeout causes
- Created optimized Edge Function (max_tokens, temperature, timeout, logging)
- Enhanced theology profiles (3 to 10 distinctives + hermeneutics + application focus)
- Built customization directives system (16 fields now have explicit instructions)
- Added Markdown output formatting
- Documented Architectural Ruling #1 (backend behavioral files)
- Deployed all optimizations

**Files deployed:**
- `optimized-generate-lesson-index.ts` to `supabase/functions/generate-lesson/index.ts`
- `customizationDirectives.ts` to `supabase/functions/_shared/customizationDirectives.ts`
- `theologyProfiles-ENHANCED.ts` to `src/constants/theologyProfiles.ts`

**Status:** Phase 5 deployment complete. Ready for testing.

---

**END OF MASTER DOCUMENT**

*This document is the Single Source of Truth for project continuity.*
*Update at the end of every session.*
*Paste at the start of every new chat.*
