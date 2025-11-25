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
