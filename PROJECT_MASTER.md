# LessonSparkUSA Master Project Document

**Last Updated:** November 21, 2025  
**Current Phase:** Phase 2 - Age Groups SSOT  
**Next Action:** Create src/constants/ageGroups.ts  
**Project Owner:** Lynn (Admin)  
**Tech Stack:** React/TypeScript (Lovable.dev), Supabase Edge Functions, PostgreSQL, Stripe, Claude/Anthropic API, GitHub, Netlify, PowerShell

---

## COMPREHENSIVE VISION (NEVER CHANGES)

✅ True SSOT for fixed structural values  
✅ One-location management (add once, works everywhere)  
✅ Easy to add new preferences - Change one place, works everywhere  
✅ Frontend drives backend (frontend is source of truth)  
✅ Freshness: Dynamic, non-repetitive output  
✅ Tiered architecture:
- Tier 1: Lesson Plan structure (supreme/foundational, UNCHANGING)
- Tier 2: Customizations (theological preferences, user preferences)

✅ All actions support potential export from Lovable.dev  
✅ Keep logic in Supabase Edge Functions (portable) and local repository  
✅ Avoid Lovable-specific dependencies  
✅ Christian values guide all development decisions

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

## TIERED ARCHITECTURE

**Tier 1 — Supreme/Foundational (UNCHANGING)**
- 12-Section Lesson Structure
- Section names, order, descriptions, required elements
- These NEVER change based on user input

**Tier 2 — Customizations (User Selects from Admin Options)**
- Age Groups (with teaching profiles)
- Theological Preferences (4 Baptist traditions)
- SB Confession Versions (BFM 1963, BFM 2000)
- Bible Versions
- Teacher Preferences (class size, learning styles, etc.)
- Language Options

**Tier 3 — Perpetual Freshness**
- Claude generates creative content WITHIN Tier 1 structure
- Same structure, fresh illustrations/examples/wording each time
- User's Tier 2 selections shape the creative boundaries

---

## IMPLEMENTATION PHASES

### Phase 0: Foundation ✅ COMPLETE

| # | Task | Status | Dependencies | Notes |
|---|------|--------|--------------|-------|
| 0.1 | Create src/constants/ directory structure | ✅ Complete | None | |
| 0.2 | Create src/constants/index.ts (single export point) | ✅ Complete | 0.1 | |
| 0.3 | Create src/constants/contracts.ts (TypeScript interfaces) | ✅ Complete | 0.1 | |
| 0.4 | Create sync-constants.ps1 script | ✅ Complete | 0.1 | |
| 0.5 | Create validate-constants.ps1 script | ✅ Complete | 0.3 | |
| 0.6 | Create deploy.ps1 automation script | ✅ Complete | 0.4, 0.5 | |
| 0.7 | Test foundation scripts work correctly | ✅ Complete | 0.6 | PHASE GATE ✅ |

### Phase 1: Lesson Structure SSOT ✅ COMPLETE

| # | Task | Status | Dependencies | Notes |
|---|------|--------|--------------|-------|
| 1.1 | Create src/constants/lessonStructure.ts | ✅ Complete | Phase 0 | |
| 1.2 | Define LessonSection interface in contracts.ts | ✅ Complete | 0.3 | Done in Phase 0.3 |
| 1.3 | Add version tag to lesson structure | ✅ Complete | 1.1 | LESSON_STRUCTURE_VERSION |
| 1.4 | Update Edge Function to receive structure from request | ✅ Complete | 1.1 | Imports from _shared |
| 1.5 | Update Edge Function to build prompt from received structure | ✅ Complete | 1.4 | buildLessonStructurePrompt() |
| 1.6 | Update EnhanceLessonForm to import and send structure | ✅ Complete | 1.1 | Backend pulls from SSOT |
| 1.7 | Add explicit "MUST include ALL sections" instruction | ✅ Complete | 1.5 | |
| 1.8 | Increase max_tokens to 8000 | ✅ Complete | 1.5 | |
| 1.9 | Test lesson generation includes all 12 sections | ✅ Complete | 1.8 | |
| 1.10 | Verify Student Handout (Section 11) generates | ✅ Complete | 1.9 | PHASE GATE ✅ |

### Phase 2: Age Groups SSOT

**Goal:** Consolidate all age group data (options, descriptions, teaching profiles) into one file.

| # | Task | Status | Dependencies | Notes |
|---|------|--------|--------------|-------|
| 2.1 | Create src/constants/ageGroups.ts | ⬜ Not Started | Phase 1 | |
| 2.2 | Define AgeGroup interface with teaching profile | ⬜ Not Started | 0.3 | Done in Phase 0.3 |
| 2.3 | Migrate options from src/lib/constants.ts | ⬜ Not Started | 2.1 | |
| 2.4 | Migrate descriptions from src/lib/constants.ts | ⬜ Not Started | 2.1 | |
| 2.5 | Migrate teaching profiles from Edge Function | ⬜ Not Started | 2.1 | |
| 2.6 | Implement ID + Lookup pattern | ⬜ Not Started | 2.5 | |
| 2.7 | Update Edge Function to lookup by ID | ⬜ Not Started | 2.6 | |
| 2.8 | Update EnhanceLessonForm to send ID only | ⬜ Not Started | 2.6 | |
| 2.9 | Add fallback defaults | ⬜ Not Started | 2.7 | |
| 2.10 | Remove old src/lib/constants.ts age group code | ⬜ Not Started | 2.8 | |
| 2.11 | Remove old _shared/constants.ts age group code | ⬜ Not Started | 2.8 | |
| 2.12 | Test all age groups work correctly | ⬜ Not Started | 2.11 | PHASE GATE |

### Phase 3: Theological Preferences SSOT

**Goal:** Move theological lenses and confession versions to frontend constants.

| # | Task | Status | Dependencies | Notes |
|---|------|--------|--------------|-------|
| 3.1 | Create src/constants/theologicalPreferences.ts | ⬜ Not Started | Phase 2 | |
| 3.2 | Define TheologicalPreference interface | ⬜ Not Started | 0.3 | Done in Phase 0.3 |
| 3.3 | Define ConfessionVersion interface | ⬜ Not Started | 0.3 | Done in Phase 0.3 |
| 3.4 | Migrate 4 Baptist traditions from Edge Function | ⬜ Not Started | 3.1 | |
| 3.5 | Migrate BFM versions from Edge Function | ⬜ Not Started | 3.1 | |
| 3.6 | Implement ID + Lookup pattern | ⬜ Not Started | 3.5 | |
| 3.7 | Update Edge Function to lookup by ID | ⬜ Not Started | 3.6 | |
| 3.8 | Update EnhanceLessonForm to send ID only | ⬜ Not Started | 3.6 | |
| 3.9 | Add fallback defaults | ⬜ Not Started | 3.7 | |
| 3.10 | Remove old theologicalLenses from Edge Function | ⬜ Not Started | 3.8 | |
| 3.11 | Test all theological preferences work correctly | ⬜ Not Started | 3.10 | PHASE GATE |

### Phase 4: Teacher Preferences SSOT

**Goal:** Consolidate all teacher customization options into constants.

| # | Task | Status | Dependencies | Notes |
|---|------|--------|--------------|-------|
| 4.1 | Create src/constants/teacherPreferences.ts | ⬜ Not Started | Phase 3 | |
| 4.2 | Define interfaces for each preference type | ⬜ Not Started | 0.3 | Done in Phase 0.3 |
| 4.3 | Migrate class size options | ⬜ Not Started | 4.1 | |
| 4.4 | Migrate session duration options | ⬜ Not Started | 4.1 | |
| 4.5 | Migrate learning style options | ⬜ Not Started | 4.1 | |
| 4.6 | Migrate engagement level options | ⬜ Not Started | 4.1 | |
| 4.7 | Migrate discussion format options | ⬜ Not Started | 4.1 | |
| 4.8 | Migrate activity complexity options | ⬜ Not Started | 4.1 | |
| 4.9 | Migrate handout style options | ⬜ Not Started | 4.1 | |
| 4.10 | Migrate visual aid preference options | ⬜ Not Started | 4.1 | |
| 4.11 | Migrate preparation time options | ⬜ Not Started | 4.1 | |
| 4.12 | Update TeacherCustomization component | ⬜ Not Started | 4.11 | |
| 4.13 | Test all teacher preferences work correctly | ⬜ Not Started | 4.12 | PHASE GATE |

### Phase 5: System Options & Bible Versions SSOT

**Goal:** Consolidate remaining options and verify Bible versions.

| # | Task | Status | Dependencies | Notes |
|---|------|--------|--------------|-------|
| 5.1 | Create src/constants/systemOptions.ts | ⬜ Not Started | Phase 4 | |
| 5.2 | Migrate enhancement types | ⬜ Not Started | 5.1 | |
| 5.3 | Migrate source types | ⬜ Not Started | 5.1 | |
| 5.4 | Migrate language options | ⬜ Not Started | 5.1 | |
| 5.5 | Verify bibleTranslations.ts is complete | ⬜ Not Started | 5.1 | Already exists |
| 5.6 | Move bibleTranslations.ts to constants directory | ⬜ Not Started | 5.5 | |
| 5.7 | Update all imports to use new location | ⬜ Not Started | 5.6 | |
| 5.8 | Test all system options work correctly | ⬜ Not Started | 5.7 | PHASE GATE |

### Phase 6: Validation & Error Handling

**Goal:** Single validation layer with comprehensive error handling.

| # | Task | Status | Dependencies | Notes |
|---|------|--------|--------------|-------|
| 6.1 | Create validation utility in Edge Function | ⬜ Not Started | Phase 5 | |
| 6.2 | Implement ID whitelist validation | ⬜ Not Started | 6.1 | |
| 6.3 | Implement input sanitization | ⬜ Not Started | 6.1 | |
| 6.4 | Implement string length limits | ⬜ Not Started | 6.1 | |
| 6.5 | Create comprehensive error messages | ⬜ Not Started | 6.1 | |
| 6.6 | Test validation catches all invalid inputs | ⬜ Not Started | 6.5 | PHASE GATE |

### Phase 7: User Experience Improvements

**Goal:** Eliminate timeout issues and improve feedback.

| # | Task | Status | Dependencies | Notes |
|---|------|--------|--------------|-------|
| 7.1 | Research Claude API streaming implementation | ⬜ Not Started | Phase 6 | |
| 7.2 | Implement streaming response in Edge Function | ⬜ Not Started | 7.1 | |
| 7.3 | Update frontend to handle streaming | ⬜ Not Started | 7.2 | |
| 7.4 | Add progress indicator ("Generating Section X...") | ⬜ Not Started | 7.3 | |
| 7.5 | Test streaming eliminates timeout | ⬜ Not Started | 7.4 | PHASE GATE |

### Phase 8: Operations & Monitoring

**Goal:** Add logging, health checks, and operational improvements.

| # | Task | Status | Dependencies | Notes |
|---|------|--------|--------------|-------|
| 8.1 | Create structured logging utility | ⬜ Not Started | Phase 7 | |
| 8.2 | Add logging to Edge Function | ⬜ Not Started | 8.1 | |
| 8.3 | Create health check endpoint | ⬜ Not Started | 8.1 | |
| 8.4 | Add database indexes for performance | ⬜ Not Started | 8.1 | |
| 8.5 | Test logging and health check work | ⬜ Not Started | 8.4 | PHASE GATE |

### Phase 9: Data Integrity

**Goal:** Prevent duplicates and handle failures gracefully.

| # | Task | Status | Dependencies | Notes |
|---|------|--------|--------------|-------|
| 9.1 | Implement request idempotency | ⬜ Not Started | Phase 8 | |
| 9.2 | Add requestId to frontend requests | ⬜ Not Started | 9.1 | |
| 9.3 | Add duplicate check in Edge Function | ⬜ Not Started | 9.2 | |
| 9.4 | Implement graceful degradation | ⬜ Not Started | 9.1 | |
| 9.5 | Test idempotency prevents duplicates | ⬜ Not Started | 9.4 | PHASE GATE |

---

## KNOWN ISSUES

| # | Issue | Severity | Status | Related Phase | Notes |
|---|-------|----------|--------|---------------|-------|
| 1 | Frontend timeout during generation (>2 min) | High | Open | Phase 7 | Lesson saves successfully but UI shows "Generation Failed" |
| 2 | Section 12 truncation (ends mid-sentence) | Medium | Open | Phase 7 | max_tokens may need increase or streaming |
| 3 | Empty section labels in View display | Low | Open | Future | Need SSOT UI integration |
| 4 | View button not working | Medium | ✅ Fixed | N/A | Fixed Nov 21, 2025 |

---

## FILES CHANGED TRACKER

| File | Last Changed | Session Date | Status |
|------|--------------|--------------|--------|
| src/constants/index.ts | Nov 21, 2025 | Nov 21, 2025 | ✅ Created |
| src/constants/contracts.ts | Nov 21, 2025 | Nov 21, 2025 | ✅ Created |
| src/constants/lessonStructure.ts | Nov 21, 2025 | Nov 21, 2025 | ✅ Created |
| supabase/functions/_shared/lessonStructure.ts | Nov 21, 2025 | Nov 21, 2025 | ✅ Created (Deno version) |
| supabase/functions/_shared/contracts.ts | Nov 21, 2025 | Nov 21, 2025 | ✅ Synced |
| supabase/functions/generate-lesson/index.ts | Nov 21, 2025 | Nov 21, 2025 | ✅ Updated - imports SSOT, max_tokens 8000 |
| src/components/dashboard/EnhanceLessonForm.tsx | Nov 21, 2025 | Nov 21, 2025 | ✅ Fixed View button |
| sync-constants.ps1 | Nov 21, 2025 | Nov 21, 2025 | ✅ Created |
| validate-constants.ps1 | Nov 21, 2025 | Nov 21, 2025 | ✅ Created |
| deploy.ps1 | Nov 21, 2025 | Nov 21, 2025 | ✅ Created |

---

## CONSTANTS FILES STATUS

| File | Contents | Status |
|------|----------|--------|
| src/constants/index.ts | Exports all constants | ✅ Created |
| src/constants/contracts.ts | TypeScript interfaces | ✅ Created |
| src/constants/lessonStructure.ts | 12-section Tier 1 structure | ✅ Created |
| src/constants/ageGroups.ts | Age groups + teaching profiles | ⬜ Not Created |
| src/constants/theologicalPreferences.ts | 4 Baptist traditions + versions | ⬜ Not Created |
| src/constants/teacherPreferences.ts | All customization options | ⬜ Not Created |
| src/constants/systemOptions.ts | Enhancement types, source types, languages | ⬜ Not Created |
| src/constants/bibleVersions.ts | Moved from bibleTranslations.ts | ⬜ Not Created |

---

## SCRIPTS STATUS

| Script | Purpose | Status |
|--------|---------|--------|
| sync-constants.ps1 | Copy frontend constants to backend _shared | ✅ Created & Tested |
| validate-constants.ps1 | Verify constants are valid before deploy | ✅ Created & Tested |
| deploy.ps1 | Full deployment automation | ✅ Created & Tested |

---

## DATABASE TABLES REFERENCE

| Table | Key Columns | Notes |
|-------|-------------|-------|
| lessons | id, title, original_text, source_type, upload_path, filters (jsonb), user_id, organization_id, created_at | Content stored in original_text |
| profiles | id, preferred_age_group, preferred_language, org_setup_dismissed | User preferences |
| user_roles | user_id, role, organization_id | Authoritative source for roles |
| organizations | id, name, default_doctrine | Organization settings |

---

## SESSION PROTOCOLS

### Starting a New Chat
1. Paste this entire document into the new chat
2. Wait for Claude to confirm understanding
3. Claude should state:
   - Current Phase
   - Last completed task
   - Next action to take
4. Confirm or correct before proceeding
5. Work ONLY on the next checklist item

### During a Session
1. Complete tasks in order — no skipping ahead
2. Test each change before marking complete
3. Note any issues discovered in KNOWN ISSUES
4. Update FILES CHANGED TRACKER for every file modified

### Ending a Session
1. Claude provides updated PROJECT_MASTER.md
2. Update all checkboxes for completed items
3. Update CURRENT SESSION WORK LOG
4. Save to local repository: C:\Users\Lynn\lesson-spark-usa\PROJECT_MASTER.md
5. Optionally commit to GitHub for version history

### Phase Gates
Before moving to next phase:
1. ALL items in current phase must be ✅ Complete
2. System must be tested and working
3. No regressions introduced
4. Lynn confirms approval to proceed

---

## CURRENT SESSION WORK LOG

### Session: November 21, 2025 (Afternoon)

**Focus:** Phase 0 Foundation + Phase 1 Lesson Structure SSOT

**Completed:**
- ✅ Phase 0.1: Created src/constants/ directory
- ✅ Phase 0.2: Created index.ts (single export point)
- ✅ Phase 0.3: Created contracts.ts (all TypeScript interfaces)
- ✅ Phase 0.4: Created sync-constants.ps1
- ✅ Phase 0.5: Created validate-constants.ps1
- ✅ Phase 0.6: Created deploy.ps1
- ✅ Phase 0.7: Tested all foundation scripts - PHASE GATE PASSED
- ✅ Phase 1.1: Created lessonStructure.ts with all 12 sections
- ✅ Phase 1.2-1.3: Already done in Phase 0.3
- ✅ Phase 1.4-1.5: Updated Edge Function to import and use SSOT structure
- ✅ Phase 1.6-1.8: Backend pulls from SSOT, max_tokens increased to 8000
- ✅ Phase 1.9-1.10: Tested - ALL 12 SECTIONS GENERATE including Student Handout! - PHASE GATE PASSED
- ✅ Fixed View button (setEnhancedResult when viewing)
- ✅ Verified Copy/Print/Download all work

**Issues Discovered:**
- Frontend timeout shows "Generation Failed" but lesson saves successfully (Phase 7)
- Section 12 sometimes truncates mid-sentence (Phase 7 - streaming)
- Empty section labels show in View mode (Future - SSOT UI integration)

**Deferred by Decision:**
- Empty labels fix deferred to future phase for proper SSOT UI integration

**Next Session Should:**
1. Begin Phase 2.1: Create src/constants/ageGroups.ts
2. Follow the phase checklist in order
3. Do NOT skip to "more interesting" tasks

---

## ARCHITECTURAL DECISIONS LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| Nov 21, 2025 | Frontend constants are SSOT | Follows "frontend drives backend" principle |
| Nov 21, 2025 | Admin controls all boundaries | Users select from options, cannot create new ones |
| Nov 21, 2025 | ID + Lookup pattern for requests | Smaller payloads, prevents malformed data |
| Nov 21, 2025 | Sync script for backend constants | True SSOT with automated sync |
| Nov 21, 2025 | Teaching profiles belong in frontend | Part of age group constants, admin-controlled |
| Nov 21, 2025 | Deno-compatible version for backend | Backend needs separate file without TypeScript imports |
| Nov 21, 2025 | Defer UI empty labels fix | Proper fix requires SSOT UI integration |

---

## QUICK REFERENCE: The 12-Section Lesson Structure (Tier 1)

1. Lesson Overview
2. Learning Objectives
3. Key Scripture Passages
4. Theological Background
5. Opening Activities
6. Main Teaching Content
7. Interactive Activities
8. Discussion Questions
9. Life Applications
10. Assessment Methods
11. Student Handout
12. Teacher Preparation Notes

---

## QUICK REFERENCE: Theological Preferences (Tier 2)

1. Southern Baptist (SBC)
   - BFM 1963
   - BFM 2000
2. Reformed Baptist (RB)
3. Independent Baptist (IB)

---

## QUICK REFERENCE: Age Groups (Tier 2)

1. Preschoolers (Ages 3-5)
2. Elementary Kids (Ages 6-10)
3. Preteens & Middle Schoolers (Ages 11-14)
4. High School Students (Ages 15-18)
5. College & Early Career (Ages 19-25)
6. Young Adults (Ages 26-35)
7. Mid-Life Adults (Ages 36-50)
8. Mature Adults (Ages 51-65)
9. Active Seniors (Ages 66-75)
10. Senior Adults (Ages 76+)
11. Mixed Groups

---

## EMERGENCY RECOVERY

If something breaks badly:
1. Check GitHub for last working commit
2. Revert to that commit: `git checkout [commit-hash] -- [file]`
3. Redeploy Edge Functions: `npx supabase functions deploy generate-lesson --project-ref hphebzdftpjbiudpfcrs`
4. Document what broke in KNOWN ISSUES

---

## CONTACT & RESOURCES

- **Supabase Dashboard:** https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs
- **Netlify Dashboard:** https://app.netlify.com/projects/lesson-spark-usa
- **Live Site:** https://lessonsparkusa.com
- **GitHub Repo:** https://github.com/lynn75965/lesson-spark-usa
- **Local Path:** C:\Users\Lynn\lesson-spark-usa

---

**END OF MASTER DOCUMENT**

*This document is the Single Source of Truth for project continuity.*  
*Update at the end of every session.*  
*Paste at the start of every new chat.*
