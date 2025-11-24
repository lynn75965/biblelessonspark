# LESSONSPARKUSA MASTER PLAN
Last Updated: 2025-11-23 21:30 CT
Status: Phase 5 In Progress - Timeout Debugging Required

## PROJECT OVERVIEW
Baptist Bible study lesson generator serving volunteer teachers in Southern Baptist Convention churches. Built on Lovable.dev with React/TypeScript, Supabase backend, Claude AI generation, and Stripe payments.

## CORE ARCHITECTURE PRINCIPLES
1. **Single Source of Truth (SSOT)**: All constants defined once in authoritative files
2. **Frontend Drives Backend**: UI defines contracts, backend serves them
3. **Maximum Sophistication, Minimum Redundancy**: Clean, efficient code
4. **Tiered Governance**: Admin controls boundaries, users select options, AI generates within guardrails

## TECHNOLOGY STACK
- **Frontend**: React, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **AI**: Claude Sonnet 4 (Anthropic API)
- **Payments**: Stripe
- **Hosting**: Netlify (custom domain: lessonsparkusa.com)
- **Version Control**: GitHub (lynn75965/lesson-spark-usa)
- **Development**: Lovable.dev with automatic deployment

## SSOT ARCHITECTURE

### Tier 1: Supreme/Foundational (UNCHANGING)
**Location**: `/src/constants/` (frontend) + `/supabase/functions/_shared/` (backend mirror)

1. **lessonStructure.ts** - 12 sections, word counts, required elements
   - Current: 2000 total words (optimized from 2700)
   - Version: 1.1.0
   - Sections: Overview, Objectives, Scripture, Background, Opening, Teaching, Activities, Discussion, Applications, Assessment, Handout, Preparation

2. **ageGroups.ts** - 11 age groups with teaching profiles
   - Preschoolers (3-5) through Senior Adults (65+)
   - Each with: vocabulary level, conceptual depth, attention span

3. **theologyProfiles.ts** - 4 Baptist traditions
   - Southern Baptist (BF&M 1963 & 2000)
   - Reformed Baptist (1689 Confession)
   - Independent Baptist
   - Each with: distinctives, hermeneutics, applications

### Tier 2: Admin-Controlled Options
**Location**: Component-level constants (will migrate to database)

4. **teachingStyles.ts** - 6 options
   - Lecture, Discussion-Based, Storytelling, Socratic Method, Experiential, Mixed

5. **lessonLengths.ts** - 5 options
   - 30, 45, 60, 75, 90 minutes

6. **activityTypes.ts** - 7 options
   - Written reflection, Verbal interaction, Creative arts, Drama & role-play, Games & movement, Music & worship, Prayer practices

7. **languages.ts** - 3 options
   - English, Spanish, French

8. **groupSizes.ts** - 5 options (formerly "classSetting")
   - Small group, Large group, One-on-one, Family, Mixed

9. **learningEnvironments.ts** - 6 options
   - Church classroom, Fellowship hall, Home, Outdoor, Virtual, Mixed

10. **studentExperience.ts** - 4 options
    - New believers, Mature Christians, Mixed, Seekers

11. **culturalContexts.ts** - 5 options
    - Urban, Suburban, Rural, International, Multicultural

12. **specialNeeds.ts** - 5 options
    - None, Learning disabilities, Visual/hearing impaired, ESL learners, Mixed

13. **lessonSequence.ts** - 5 options
    - Single lesson, Workshop, Retreat, Series, VBS

14. **assessmentStyles.ts** - 7 options
    - Informal discussion, Written reflection, Quiz/test, Questionnaire, Presentation, Project-based, Observation

15. **learningStyles.ts** - 5 options (NEW - Phase 5)
    - Visual, Auditory, Kinesthetic, Reading/Writing, Mixed

16. **educationExperience.ts** - 9 options (NEW - Phase 5)
    - Elementary through Doctoral/Advanced Degree

### Tier 3: User Input
- Bible passage (optional)
- Focused topic (optional)
- Additional notes (optional)
- File upload (optional)
- Selected options from Tier 2

## PHASE COMPLETION STATUS

### ✅ PHASE 1: Foundation (COMPLETE)
- Core lesson structure (8 sections → 12 sections)
- SSOT architecture established
- Theology profile system
- Age group targeting
- Database schema

### ✅ PHASE 2: Stability (COMPLETE)
- HTTP 400 error resolution
- Timeout fixes (11 sections → 8 sections)
- Lesson generation under 3 minutes
- Framework optimization

### ✅ PHASE 3: User Experience (COMPLETE)
- Beta program removal
- Public-ready platform
- User onboarding flow
- Error handling improvements

### ✅ PHASE 4: Expansion (COMPLETE)
- Multilingual support (English, Spanish, French)
- 8 sections → 12 sections (with word count optimization)
- Framework restoration with stability maintained

### 🔄 PHASE 5: UI CUSTOMIZATION (IN PROGRESS - 95% COMPLETE)

**Completed:**
1. ✅ Single Source of Truth implementation across 4 phases
2. ✅ Theology Profile migration (duplicate fields → profile ID)
3. ✅ Form restoration with SSOT compliance
4. ✅ Age group dropdown fix (.label property)
5. ✅ Wizard → Collapsible interface (476 lines → 144 lines)
6. ✅ Expanded customization: 4 fields → 16 fields
7. ✅ New dropdowns: Group Size, Learning Environment, Student Experience, Cultural Context, Special Needs, Lesson Sequence, Assessment Style, Learning Style, Education Experience
8. ✅ Edge Function updated for 16 fields
9. ✅ Database schema compliance (removed 'enhanced_text')
10. ✅ Word count optimization (2700 → 2000)
11. ✅ Teaser generation removed (deferred to Phase 6)
12. ✅ CORS fixes
13. ✅ Syntax error cleanup

**Current Blocker:**
❌ Lesson generation timeout at ~1:15 minutes
- Progress reaches 50-75% then fails
- Error: "Edge Function returned a non-2xx status code"
- Target: Complete in <2 minutes (Supabase timeout: 2.5 min)
- Needs: Supabase log analysis to identify exact failure point

**Next Steps:**
1. Check Supabase logs for exact error
2. Identify failure cause (Anthropic timeout, DB insert, Edge Function limit)
3. Implement targeted fix based on error type
4. Options: Further reduce words (2000→1500), increase timeout, chunk generation

### 📋 PHASE 6: SEPARATE TEASER GENERATION (PLANNED)
**Scope:**
- New "Generate Teaser" button (post-lesson generation)
- 10 teaser approaches (question, scenario, mystery, etc.)
- 4 formats each (SMS, social media, printable, announcement)
- Separate Edge Function call (~30 seconds)
- Standalone document output

**Requirements:**
- Must be BLIND to lesson content
- Builds anticipation without revealing passage/topic
- Age-appropriate for selected group
- Multi-format for various communication channels

### 📋 PHASE 7: ADVANCED FEATURES (PLANNED)
- Lesson editing/versioning
- Template library
- Team collaboration
- Analytics dashboard
- Mobile optimization

## DATABASE SCHEMA

### lessons table
```sql
- id (uuid, primary key)
- created_at (timestamp)
- updated_at (timestamp)
- user_id (uuid, foreign key)
- organization_id (uuid, nullable)
- title (text)
- original_text (text)
- filters (jsonb) - stores all customization selections
- metadata (jsonb) - generation info, version, word count
```

**filters structure:**
```json
{
  "bible_passage": "John 3:16",
  "focused_topic": null,
  "age_group": "elementary",
  "theology_profile_id": "southern-baptist-2000",
  "teaching_style": "discussion",
  "lesson_length": "45",
  "activity_types": ["verbal", "creative"],
  "language": "english",
  "class_setting": "small-group",
  "learning_environment": "classroom",
  "student_experience": "mixed",
  "cultural_context": "suburban",
  "special_needs": "none",
  "lesson_sequence": "single",
  "assessment_style": "informal",
  "learning_style": "mixed",
  "education_experience": "high-school",
  "additional_notes": "Focus on practical application"
}
```

## EDGE FUNCTION ARCHITECTURE

### generate-lesson/index.ts
**Purpose**: Main lesson generation endpoint

**Flow:**
1. Authenticate user (Bearer token)
2. Validate required fields (bible_passage OR focused_topic, age_group, theology_profile_id)
3. Look up age group from AGE_GROUPS (SSOT)
4. Look up theology profile from THEOLOGY_PROFILES (SSOT)
5. Build system prompt with:
   - Theology framework and distinctives
   - Age group context and teaching profile
   - Lesson structure (from LESSON_SECTIONS)
   - Customization context (all 16 optional fields)
6. Call Anthropic API (Claude Sonnet 4)
   - Model: claude-sonnet-4-20250514
   - Max tokens: 16000
   - Temperature: 0.7
7. Save to database (lessons table)
8. Return lesson with metadata

**Current Configuration:**
- Target word count: 2000 words
- Expected generation time: ~1:45 minutes
- Timeout limit: 150 seconds (2.5 minutes)
- **ISSUE**: Timing out at ~1:15 minutes

## DEPLOYMENT PROCESS

### Frontend (Lovable → Netlify)
1. Edit in Lovable.dev
2. Auto-commit to GitHub (lynn75965/lesson-spark-usa)
3. Netlify auto-deploys from main branch
4. Live at: lessonsparkusa.com

### Backend (Supabase Edge Functions)
```powershell
# Deploy single function
supabase functions deploy generate-lesson

# Deploy all functions
supabase functions deploy
```

### Sync Constants (Frontend → Backend)
```powershell
# Manual sync (temporary until automated)
# Copy from src/constants/ to supabase/functions/_shared/
```

## KEY FILES

### Frontend
- `src/components/dashboard/EnhanceLessonForm.tsx` - Main form with 16 fields
- `src/components/dashboard/TeacherCustomization.tsx` - Collapsible customization section
- `src/constants/*.ts` - SSOT definitions (Tier 1 & 2)
- `src/integrations/supabase/types.ts` - Generated types

### Backend
- `supabase/functions/generate-lesson/index.ts` - Main Edge Function
- `supabase/functions/_shared/lessonStructure.ts` - 12 sections (2000 words)
- `supabase/functions/_shared/ageGroups.ts` - 11 age groups
- `supabase/functions/_shared/theologyProfiles.ts` - 4 Baptist traditions

## DEVELOPMENT WORKFLOW

1. **Feature Planning**
   - Define user need
   - Check SSOT compliance
   - Plan frontend-first

2. **Implementation**
   - Frontend: Edit in Lovable.dev
   - Backend: Local PowerShell + Supabase CLI
   - Test: lessonsparkusa.com/dashboard

3. **Deployment**
   - Frontend: Auto-deploy via Netlify
   - Backend: Manual `supabase functions deploy`
   - Verify: Check Supabase logs

4. **Debugging**
   - Browser console (F12) for frontend
   - Supabase logs for backend
   - PowerShell for local testing

## DEBUGGING RESOURCES

### Supabase Dashboard
- Project: hphebzdftpjbiudpfcrs
- Functions: https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/functions/generate-lesson
- Logs: https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/functions/generate-lesson/logs
- Database: https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/editor

### GitHub
- Repository: https://github.com/lynn75965/lesson-spark-usa
- Latest commits visible in PowerShell: `git log --oneline -10`

### Netlify
- Site: lesson-spark-usa
- Deploys: Auto from main branch
- Domain: lessonsparkusa.com

## CRITICAL REMINDERS

1. **NEVER edit backend _shared/ files without updating frontend constants first**
2. **ALWAYS check Supabase logs before making changes**
3. **ALWAYS verify database schema before modifying insert statements**
4. **Frontend drives backend** - UI defines the contract
5. **SSOT is sacred** - One definition, many consumers
6. **Test with**: John 3:16, Elementary Kids, Southern Baptist BF&M 2000

## CURRENT PRIORITY

**FIX TIMEOUT ISSUE**
- Status: Generation failing at ~1:15 minutes (50-75% progress)
- Target: Complete in <2 minutes
- Action: Check Supabase logs for exact error
- URL: https://supabase.com/dashboard/project/hphebzdftpjbiudpfcrs/functions/generate-lesson/logs

## MARKET CONTEXT

- SBC Total Population: 14.8 million
- LifeWay-Served: 6 million
- Unserved Opportunity: 8.8 million
- Target: Volunteer teachers in SBC churches
- Unique Value: Mass customization at scale (16 personalization options)

## THEOLOGICAL STANDARDS

All content generation must align with selected Baptist tradition:
- **Southern Baptist (BF&M 2000)**: Inerrancy, believer's baptism, congregational polity
- **Southern Baptist (BF&M 1963)**: Conservative interpretation, traditional values
- **Reformed Baptist (1689)**: Covenant theology, doctrines of grace
- **Independent Baptist**: Soul liberty, church autonomy, KJV preference

Content shaped invisibly by theology profile - users see results, not the guardrails.

---

**LAST SESSION**: Phase 5 UI expansion complete, timeout debugging required
**NEXT SESSION**: Check Supabase logs, identify timeout cause, implement fix
**REPOSITORY**: https://github.com/lynn75965/lesson-spark-usa
**LIVE SITE**: https://lessonsparkusa.com