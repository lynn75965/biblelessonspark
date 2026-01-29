# PROJECT_MASTER.md
## BibleLessonSpark - Master Project Documentation
**Last Updated:** January 29, 2026 (Phase 23 - Teacher Toolbelt Complete)
**Launch Date:** January 27, 2026 ✅ LAUNCHED

---

## QUICK REFERENCE

| Item | Value |
|------|-------|
| **Local URL** | http://localhost:8080 |
| **Production URL** | https://biblelessonspark.com |
| **Legacy URL** | https://lessonsparkusa.com (redirects to production) |
| **Branch** | biblelessonspark |
| **Local Path** | C:\Users\Lynn\lesson-spark-usa |
| **Supabase Project** | hphebzdftpjbiudpfcrs |
| **Platform Mode** | Production (as of Jan 10, 2026) |
| **Launch Date** | January 27, 2026 |
| **Reset Logic** | Rolling 30-day periods (per-user, not calendar month) |

---

## ARCHITECTURE PRINCIPLES

### SSOT (Single Source of Truth)
- **Frontend drives backend** - All constants defined in `src/constants/` and `src/config/`
- Backend mirrors auto-generated via `npm run sync-constants`
- Database branding synced via `npm run sync-branding`
- Database tier config synced via `npm run sync-tier-config`
- Never edit `supabase/functions/_shared/` directly

### Key SSOT Files
| File | Purpose |
|------|---------|
| `src/constants/ageGroups.ts` | Age group definitions |
| `src/constants/bibleVersions.ts` | Bible versions + copyright notices |
| `src/constants/theologyProfiles.ts` | 10 Baptist theological traditions |
| `src/constants/lessonStructure.ts` | 8-section lesson framework |
| `src/constants/devotionalConfig.ts` | DevotionalSpark configuration |
| `src/constants/toolbeltConfig.ts` | **Teacher Toolbelt configuration** |
| `src/constants/pricingConfig.ts` | Tier sections, limits (MASTER for tier_config) |
| `src/constants/trialConfig.ts` | Trial system configuration (rolling 30-day) |
| `src/constants/tenantConfig.ts` | White-label tenant configuration |
| `src/constants/feedbackConfig.ts` | Feedback mode (beta/production), auto-popup config |
| `src/constants/systemSettings.ts` | Platform mode helpers |
| `src/constants/uiSymbols.ts` | UI symbols (UTF-8 safe) |
| `src/constants/metricsViewerConfig.ts` | Chart colors for analytics |
| `src/constants/transferRequestConfig.ts` | Transfer request workflow statuses |
| `src/config/branding.ts` | **SSOT for ALL colors** |
| `src/config/brand-values.json` | **SSOT for colors/typography** |

### Sync Commands
| Command | Purpose |
|---------|---------|
| `npm run sync-constants` | Syncs src/constants/ → supabase/functions/_shared/ |
| `npm run sync-branding` | Syncs branding → branding_config table |
| `npm run sync-tier-config` | Syncs tier config → tier_config table |

---

## TEACHER TOOLBELT SYSTEM (Phase 23 - COMPLETE ✅)

### Overview
Teacher Toolbelt is a free, public resource offering genuine help to volunteer Baptist Bible teachers through micro-tools that provide pastoral reflections. It serves as a pre-subscription marketing system that leads with service, not sales.

### Strategic Flow
```
eBook Download → Email Sequence → Toolbelt → Email Capture → Nurture Sequence → BLS Subscription
```

### Architecture
| Component | Location | Purpose |
|-----------|----------|---------|
| `toolbeltConfig.ts` | `src/constants/` | SSOT configuration |
| `ToolbeltLanding.tsx` | `src/pages/toolbelt/` | Landing page with tool cards |
| `ToolbeltLessonFit.tsx` | `src/pages/toolbelt/` | Tool 1: Does This Lesson Fit? |
| `ToolbeltLeftOut.tsx` | `src/pages/toolbelt/` | Tool 2: What Can Be Left Out? |
| `ToolbeltOneTruth.tsx` | `src/pages/toolbelt/` | Tool 3: One-Truth Focus Finder |
| `ToolbeltAdmin.tsx` | `src/pages/` | Admin management center |
| `toolbelt-reflect` | Edge Function | AI reflection generation |
| `send-toolbelt-sequence` | Edge Function | Nurture email automation |

### The Three Tools

| Tool | Purpose | Route |
|------|---------|-------|
| Does This Lesson Fit My Class? | Name mismatch patterns | `/toolbelt/lesson-fit` |
| What Can Be Left Out Safely? | Distinguish essential from supporting | `/toolbelt/left-out-safely` |
| One-Truth Focus Finder | Articulate central truth | `/toolbelt/one-truth` |

### Voice Guardrails ⚠️ CRITICAL

Claude's role is to **reflect, not instruct**. Every reflection must:

| Requirement | Implementation |
|-------------|----------------|
| **Reflect, don't instruct** | Never give advice ("You should...") |
| **Affirm, don't diagnose** | Never label problems ("Your issue is...") |
| **Pastoral tone** | Warm, calm, dignified |
| **Prose only** | No bullet points in reflections |
| **No questions** | Reflection, not interrogation |
| **No BLS mentions** | Product awareness only in emails |
| **No doctrinal positions** | Stay theologically neutral |

### Voice Prohibitions (Hard Rules)
- ❌ Do NOT give prescriptive advice
- ❌ Do NOT diagnose problems
- ❌ Do NOT mention BibleLessonSpark in tool reflections
- ❌ Do NOT take doctrinal positions
- ❌ Do NOT use bullet points in output
- ❌ Do NOT ask questions in output
- ❌ Do NOT imply the teacher is failing

### Output Structure (All Tools)
1. **Headline:** "Here's what your instincts are picking up" (or similar)
2. **2-3 reflective paragraphs:** Naming patterns, validating feelings
3. **Closing reassurance:** Affirming their attentiveness and care

### Database Tables

#### toolbelt_usage
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| tool_id | text | "lesson-fit", "left-out", "one-truth" |
| session_id | text | Anonymous session tracking |
| tokens_used | integer | Claude API tokens consumed |
| created_at | timestamp | When the call occurred |

#### toolbelt_email_captures
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| email | text | Captured email (unique) |
| tool_id | text | Which tool they used |
| reflection_sent | boolean | Immediate email delivered? |
| created_at | timestamp | When captured |

#### toolbelt_email_templates
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| tenant_id | text | Multi-tenant support |
| sequence_order | integer | Position in sequence |
| send_day | integer | Days after capture to send |
| subject | text | Email subject line |
| body | text | Email content |
| is_html | boolean | Rich text or plain text |
| is_active | boolean | Enable/disable |

#### toolbelt_email_tracking
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| email_capture_id | uuid | FK to captures |
| last_email_sent | integer | Count of emails sent |
| unsubscribed | boolean | Opt-out flag |

### Admin Panel Tabs

| Tab | Purpose |
|-----|---------|
| Usage Report | Calls today/week/month, API cost estimate, tool breakdown |
| Email Sequences | Rich text editor for nurture emails |
| Email Captures | List of captured emails with search/filter |
| Guardrails Status | Display current configuration (read-only) |

### Email Sequence (7 Emails)

| # | Day | Subject | Focus |
|---|-----|---------|-------|
| 0 | Immediate | Your reflection from [Tool Name] | Reflection + warm intro |
| 1 | Day 1 | When a lesson doesn't quite fit | Tool 1 value |
| 2 | Day 3-4 | When carrying everything feels heavy | Tool 2 value |
| 3 | Day 7 | When you want to teach with clarity | Tool 3 value |
| 4 | Day 14 | A quiet encouragement for your teaching | Teaching tip (value) |
| 5 | Day 21 | When preparation needs a home | Soft BLS bridge |
| 6 | Day 30 | Still here if helpful | Final gentle invitation |

### Routes

**Public (No Auth):**
```
/toolbelt                    → Landing page (tool index)
/toolbelt/lesson-fit         → Tool 1: Does This Lesson Fit?
/toolbelt/left-out-safely    → Tool 2: What Can Be Left Out?
/toolbelt/one-truth          → Tool 3: One-Truth Focus Finder
```

**Protected (Admin Only):**
```
/admin/toolbelt              → Toolbelt management center
```

### Key Design Decisions
- **No authentication required** for tools (reduces friction)
- **Session-only results** (never persist user inputs/outputs)
- **Email capture is optional** (service framing: "email this to yourself")
- **Separate admin page** (`/admin/toolbelt`, not tabs in main admin)
- **Pastoral tone always** (never commercial or pressured)

---

## DEVOTIONALSPARK SYSTEM (Phase 22 - v2.1 COMPLETE ✅)

### Overview
DevotionalSpark generates personal devotionals anchored to BibleLessonSpark lessons. The devotional helps readers **internalize and live out** the lesson's truth through reflective writing—it does NOT reteach or summarize the lesson.

### Architecture
| Component | Location | Purpose |
|-----------|----------|---------|
| `devotionalConfig.ts` | `src/constants/` | SSOT configuration |
| `DevotionalGenerator.tsx` | `src/components/dashboard/` | Generation UI |
| `DevotionalLibrary.tsx` | `src/components/dashboard/` | Library with actions |
| `useDevotionals.ts` | `src/hooks/` | Data fetching hook |
| `generate-devotional` | Edge Function (v2.1) | AI generation |

### Configuration Options

| Setting | Options |
|---------|---------|
| **Target** | Preschool, Children, Youth, Adult |
| **Length** | 3 min (~400-500 words), 5 min (~700-900 words), 10 min (~1200-1500 words) |

### Inherited Parameters (Hidden from User)
- Theology Profile (from lesson)
- Bible Version (from lesson)
- Age-appropriate vocabulary (from lesson, overridable by Target)

### Length-Based Experiential Differentiation

| Length | Purpose | Feel |
|--------|---------|------|
| **3-min** | Anchor the Heart | One insight, one truth carried into the day |
| **5-min** | Shape the Daily Posture | Companion for the morning, space to breathe |
| **10-min** | Form the Inner Life | Unhurried, space to sit and be formed |

---

## DEVOTIONALSPARK SIGNATURE VOICE (v2.1) ⚠️ CRITICAL

### Core Principles
The devotional creates **space for reader-induced insight**. The writer opens doors; the reader walks through with their own experience.

| Principle | Implementation |
|-----------|----------------|
| **Creates space** | Universal human moments, not hypothetical "you probably felt..." |
| **Smooth prose** | Short sentences, conversational rhythm, never pedantic |
| **Scripture illuminates** | Doesn't drive an outline; let it land |
| **Reader-focused** | Draw from their experience, not a fabricated writer's journey |
| **Warm "we"** | Only for genuine community ("we who believe..."), never to insert writer into reader's life |

### Voice Prohibitions
| Prohibited | Why |
|------------|-----|
| ❌ Fabricated first-person ("I remember when...") | Claude has no such memories—this is dishonest |
| ❌ Presumptuous "you" ("Perhaps you felt...") | Lectures the reader; presumes to know their experience |
| ❌ Inserting "we" ("We have all struggled...") | Writer granting unearned intimacy |
| ❌ Teaching/sermon tone | This is reflection, not instruction |
| ❌ Bullet points, numbered lists | Destroys devotional flow |
| ❌ Dense academic paragraphs | Must be smooth, insightful, conversational |

### Voice Examples

**WRONG (presumptuous):**
> "Perhaps it was the first time you prayed in a crowded restaurant, or spoke naturally about your faith to a curious neighbor..."

**RIGHT (creates space):**
> "There's a weight that lifts when shame finally loosens its grip. Not all at once—just a conversation that flows easier, a truth spoken simply because it's true."

The reader supplies their own memory. The writing opens the door.

---

## DEVOTIONALSPARK PRAYER REQUIREMENTS ⚠️ CRITICAL

### Prayer Voice
| Requirement | Implementation |
|-------------|----------------|
| **Personal** | Always "I" and "me" — never "we" and "us" |
| **Earned** | Flows naturally from the reflection |
| **Ends with Jesus** | Every prayer references Christ and His work |

### Prayer Ending Examples (Vary These)
- "...through Jesus, whose grace found me when I had nothing to offer. Amen."
- "...because the cross already spoke what my words cannot. Amen."
- "...in the name of Jesus, who finished what I could never begin. Amen."
- "...through Christ, who stands even now as my advocate. Amen."
- "...because of Jesus, who was never ashamed to call me His own. Amen."
- "...through the One who carried what I could not. Amen."

**NEVER:** End with just "Amen" without acknowledging Christ.

---

## DEVOTIONALSPARK ABIDING PRESENCE

God's presence is acknowledged **lightly**—woven through, not announced.

| Valence | How Presence Is Felt |
|---------|---------------------|
| **Virtue** | Comfort, nearness ("You are held." / "Grace has arrived.") |
| **Cautionary** | Holy witness, mercy within truth ("He sees." / "Mercy still.") |
| **Complex** | Presence in the tension ("Even here, not alone.") |

**NEVER:** "God is RIGHT HERE with you NOW!" — this is overstatement.

---

## MORAL VALENCE GUARDRAIL ⚠️ CRITICAL

Prevents theological inversion (the flaw that killed Modern Parable Generator).

| Valence | Scripture Type | Theme Direction |
|---------|----------------|-----------------|
| **VIRTUE** | Grace, love, faith, promise passages | Encouragement, hope, gratitude |
| **CAUTIONARY** | Warning, judgment, conviction passages | Confession, humility, honest reckoning |
| **COMPLEX** | Passages with both elements | Nuanced, honors both dimensions |

### Hard Rules
- Grace texts (Romans 8, Psalm 23, Ephesians 2) = VIRTUE only
- Judgment texts (Isaiah 14, Ezekiel 28) = CAUTIONARY only
- **NEVER** pair grace Scripture with guilt/condemnation themes
- **NEVER** pair judgment Scripture with celebration themes

---

## SCRIPTURE HANDLING (Current Approach)

| Aspect | Implementation |
|--------|----------------|
| **Quotation** | Direct quotation permitted for ALL versions |
| **Citation** | Always include book, chapter, verse + version abbreviation |
| **Fair Use** | ~10 verses or fewer per devotion |
| **Copyright Notice** | Auto-appended to output when version requires |

**Example:**
> "And we know that in all things God works for the good of those who love him" (Romans 8:28, NIV).

---

## EMAIL AUTOMATION SYSTEM (Phase 21.2 - COMPLETE ✅)

### Architecture Overview
```
User Signs Up → Supabase Auth → Resend SMTP → Verification Email
                                      ↓
                            User Verifies Email
                                      ↓
                      Database Trigger (on_email_verified)
                                      ↓
                      Adds user to email_sequence_tracking
                                      ↓
                      Hourly Cron Job (pg_cron)
                                      ↓
                      send-sequence-email Edge Function
                                      ↓
                      Resend API → Branded HTML Email
```

### Key Decision: Native Supabase vs I-Mail
Initially planned to use I-Mail autoresponder, but pivoted to **native Supabase solution** because:
- Full control over email templates and timing
- No external webhook dependency
- Admin Panel integration for template editing
- Database-driven = SSOT compliant

### Database Tables

#### email_sequence_templates
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| tenant_id | text | Multi-tenant support (default: 'default') |
| sequence_order | integer | Email position (1-7) |
| send_day | integer | Days after signup to send (0, 1, 3, 7, 14, 21, 30) |
| subject | text | Email subject line |
| body | text | Email content (plain text or HTML) |
| is_active | boolean | Enable/disable individual emails |
| is_html | boolean | true = raw HTML, false = auto-convert plain text |
| created_at | timestamp | Record creation |
| updated_at | timestamp | Last modification |

#### email_sequence_tracking
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | References auth.users |
| email | text | User's email address |
| full_name | text | User's display name |
| sequence_started_at | timestamp | When user verified email |
| last_email_sent | integer | Count of emails sent (0-7) |
| last_email_sent_at | timestamp | When last email was sent |
| unsubscribed | boolean | Opt-out flag |
| created_at | timestamp | Record creation |

### 7-Email Onboarding Sequence

| # | Day | Subject | Purpose |
|---|-----|---------|---------|
| 1 | 0 | Let's get a BibleLessonSpark lesson ready to teach! | Welcome + first lesson CTA |
| 2 | 1 | A quick note about your free lessons | Free tier explanation |
| 3 | 3 | Save 10 minutes every week (here's how) | Teacher Profiles feature |
| 4 | 7 | Did you know? Your existing curriculum works here too | Curriculum Enhancement Mode |
| 5 | 14 | Give your class a sneak peek this week | Student Teaser feature |
| 6 | 21 | You prepare for your class. Who prepares your heart? | DevotionalSpark + upgrade |
| 7 | 30 | Is your whole teaching team ready? | Organization features |

### Resend Configuration
| Item | Value |
|------|-------|
| Domain | `biblelessonspark.com` ✅ Verified |
| API Key | Stored in Supabase secrets as `RESEND_API_KEY` |
| From Email | `noreply@biblelessonspark.com` |
| Reply-To | `support@biblelessonspark.com` |

---

## SSOT TIER CONFIG SYSTEM (Phase 20.8 - COMPLETE ✅)

### Architecture
```
pricingConfig.ts (FRONTEND MASTER)
        ↓ npm run sync-tier-config
tier_config table (DATABASE)
        ↓
check_lesson_limit() function
        ↓
API responses (no hardcoding)
```

### Database Table: tier_config
| tier | lessons_limit | sections_allowed | includes_teaser | reset_interval |
|------|---------------|------------------|-----------------|----------------|
| free | 5 | [1,5,8] | false | 30 days |
| personal | 20 | [1,2,3,4,5,6,7,8] | true | 30 days |
| admin | 9999 | [1,2,3,4,5,6,7,8] | true | 30 days |

### Reset Logic: Rolling 30-Day Periods ⚠️ IMPORTANT
- **NOT calendar month** - Each user's period is individual
- **Free users**: 30-day period starts from email verification date
- **Subscribers**: 30-day period starts from subscription date (aligns with Stripe billing)
- **Reset trigger**: When `reset_date` passes, `lessons_used` resets to 0 and new `reset_date` = NOW() + 30 days
- **Perpetual**: Free tier never expires - continues rolling forever

### Free Tier Details (for user communication)
- **Lessons #1 & #2**: Full 8-section lessons
- **Lessons #3, #4, #5**: Streamlined 3-section lessons (Lens + Overview, Teaching Transcript, Student Handout)
- **Reset**: Every 30 days from signup (rolling, not calendar month)
- **Duration**: Perpetual (forever free - no expiration)

### Personal Tier Details
- **20 lessons per 30-day period**: All 8 sections
- **Includes**: Student Teaser feature
- **Reset**: Every 30 days from subscription date (aligns with Stripe billing cycle)

---

## TRANSFER REQUEST SYSTEM (Phase 20.12-20.13 - COMPLETE ✅)

### Workflow
```
Org Manager ↔ Teacher (offline agreement)
      │
      ├── Org Manager creates Transfer Request
      │   (confirms teacher agreed via attestation)
      │
      ↓
Platform Admin
      ├── Reviews request in Admin Panel → Organizations tab
      ├── Approves or Denies
      └── If approved, member moves immediately
```

### Database Table: transfer_requests
| Column | Type | Purpose |
|--------|------|---------|
| id | uuid | Primary key |
| user_id | uuid | Teacher being transferred |
| from_organization_id | uuid | Current org |
| to_organization_id | uuid (nullable) | Destination org |
| status | enum | pending_admin, admin_approved, admin_denied, cancelled |
| reason | text | Why transfer is requested |
| teacher_agreement_confirmed | boolean | Org manager attestation |
| teacher_agreement_date | timestamp | When agreement occurred |
| admin_notes | text | Admin's response/notes |

---

## SSOT UI SYMBOLS SYSTEM (Phase 20.7 - COMPLETE ✅)

### Purpose
Prevents UTF-8 encoding corruption when files are edited across different systems.

### Files
| Location | Type |
|----------|------|
| `src/constants/uiSymbols.ts` | Frontend MASTER |
| `supabase/functions/_shared/uiSymbols.ts` | Backend mirror |

### Available Symbols
```typescript
export const UI_SYMBOLS = {
  BULLET: '•',
  EM_DASH: '—',
  ELLIPSIS: '…',
  CHECK: '✓',
  STAR: '★',
  SPARKLES: '✨',
} as const;
```

---

## CHANGELOG

### Phase 23 (Jan 29, 2026) - Teacher Toolbelt Complete ✅
**Free micro-tools for volunteer Baptist Bible teachers**

**Components Created:**
- `toolbeltConfig.ts` - SSOT configuration with tool definitions, guardrails, prompts
- `ToolbeltLanding.tsx` - Landing page with tool cards
- `ToolbeltLessonFit.tsx` - Tool 1: Does This Lesson Fit My Class?
- `ToolbeltLeftOut.tsx` - Tool 2: What Can Be Left Out Safely?
- `ToolbeltOneTruth.tsx` - Tool 3: One-Truth Focus Finder
- `ToolbeltAdmin.tsx` - Admin management center with 4 tabs
- `ToolbeltUsageReport.tsx` - Usage analytics dashboard
- `ToolbeltEmailManager.tsx` - Rich text email editor with ReactQuill
- `ToolbeltEmailCaptures.tsx` - Email capture list with search
- `ToolbeltGuardrailsStatus.tsx` - Configuration display

**Edge Functions:**
- `toolbelt-reflect` - AI reflection generation with voice guardrails
- `send-toolbelt-sequence` - Automated nurture email delivery

**Database Tables:**
- `toolbelt_usage` - API call tracking
- `toolbelt_email_captures` - Email collection
- `toolbelt_email_templates` - Nurture sequence content
- `toolbelt_email_tracking` - Delivery progress

**Key Features:**
- No authentication required (reduces friction)
- Pastoral voice: reflect, affirm, never prescribe
- Session-only results (privacy-preserving)
- Optional email capture with service framing
- 7-email nurture sequence
- Admin panel with usage analytics and email management
- ReactQuill rich text editor with link toolbar

**Routes:**
- `/toolbelt` - Landing page
- `/toolbelt/lesson-fit` - Tool 1
- `/toolbelt/left-out-safely` - Tool 2
- `/toolbelt/one-truth` - Tool 3
- `/admin/toolbelt` - Admin management

### Phase 22 (Jan 27, 2026) - DevotionalSpark Style v2.1 🚀 LAUNCH DAY
**Complete rewrite of DevotionalSpark voice and prompt architecture**

**Key Changes:**
- Removed "invisible writer" concept → Now "creates space for reader-induced insight"
- Smooth, conversational prose—never pedantic
- Prayer always personal (I/me) and ends with reference to Jesus
- Abiding presence of God acknowledged lightly, not announced
- Moral valence guardrail maintained from parable system

### Phase 21.4 (Jan 26, 2026) - FeaturesSection SSOT Compliance
- Landing page Features section now fully SSOT-compliant
- All feature badges now HOVER-activated (HoverCard)
- Founder quote banner replaces stats banner

### Phase 21.3 (Jan 26, 2026) - Rolling 30-Day Reset Documentation
- Clarified reset logic: Rolling 30-day periods (not calendar month)
- Updated `trialConfig.ts` with `resetPeriod: 'rolling30'`

### Phase 21.2 (Jan 26, 2026) - Rich Text Email Editor + SSOT Compliance
- Added ReactQuill rich text editor to Admin Panel Email Sequences
- Preview button shows exact email appearance

### Phase 21.1 (Jan 26, 2026) - Native Email Automation System
- Created `email_sequence_templates` and `email_sequence_tracking` tables
- Created `on_email_verified` trigger
- Created hourly cron job via pg_cron
- Created `send-sequence-email` Edge Function

### Phase 20.8 (Jan 16, 2026) - SSOT Tier Config System
- Created `tier_config` database table
- `check_lesson_limit()` now reads from database

### Phase 20.7 (Jan 15, 2026) - UTF-8 Encoding Fix + UI Symbols SSOT
- Created `src/constants/uiSymbols.ts` as SSOT for UI symbols
- Fixed 18 encoding corruptions across 10 files

---

## FILE LOCATIONS

### Frontend
```
src/
├── components/
│   ├── BrandingProvider.tsx         # Runtime CSS variable injection
│   ├── layout/
│   │   ├── Header.tsx               # Logo + wordmark
│   │   └── Footer.tsx               # Logo + wordmark
│   ├── dashboard/
│   │   ├── EnhanceLessonForm.tsx    # 3-step accordion
│   │   ├── DevotionalGenerator.tsx  # DevotionalSpark UI
│   │   └── DevotionalLibrary.tsx    # Devotional library
│   ├── admin/
│   │   ├── OrganizationManagement.tsx
│   │   ├── EmailSequenceManager.tsx # BLS onboarding emails
│   │   └── toolbelt/                # Toolbelt admin components
│   │       ├── ToolbeltUsageReport.tsx
│   │       ├── ToolbeltEmailManager.tsx
│   │       ├── ToolbeltEmailCaptures.tsx
│   │       └── ToolbeltGuardrailsStatus.tsx
│   └── toolbelt/                    # Toolbelt shared components
│       └── ToolbeltReflectionForm.tsx
├── pages/
│   ├── Admin.tsx
│   ├── ToolbeltAdmin.tsx            # Toolbelt admin center
│   └── toolbelt/                    # Toolbelt public pages
│       ├── ToolbeltLanding.tsx
│       ├── ToolbeltLessonFit.tsx
│       ├── ToolbeltLeftOut.tsx
│       └── ToolbeltOneTruth.tsx
├── config/
│   ├── branding.ts                  # SSOT: All brand colors
│   └── brand-values.json            # SSOT: Colors/typography JSON
├── constants/
│   ├── toolbeltConfig.ts            # Toolbelt SSOT
│   ├── pricingConfig.ts             # Tier config MASTER
│   ├── devotionalConfig.ts          # DevotionalSpark config
│   └── [other SSOT files]
```

### Backend (Edge Functions)
```
supabase/functions/
├── generate-lesson/
├── generate-devotional/             # DevotionalSpark v2.1
├── send-sequence-email/             # BLS onboarding emails
├── toolbelt-reflect/                # Toolbelt AI reflection
├── send-toolbelt-sequence/          # Toolbelt nurture emails
└── _shared/
    ├── branding.ts
    ├── toolbeltConfig.ts            # Backend mirror
    ├── devotionalConfig.ts
    └── [other mirrors]
```

### Database Tables
```
# Core BLS
tier_config                          # SSOT for tier limits/sections
user_subscriptions                   # User's current tier + usage
devotionals                          # Generated devotionals
branding_config                      # SSOT branding for edge functions

# Email (BLS Onboarding)
email_sequence_templates             # Onboarding email content (7 emails)
email_sequence_tracking              # User progress through sequence

# Teacher Toolbelt
toolbelt_usage                       # API call tracking
toolbelt_email_captures              # Email collection
toolbelt_email_templates             # Nurture sequence content
toolbelt_email_tracking              # Delivery progress

# Organizations
transfer_requests                    # Org member transfer workflow
```

---

## DEPLOYMENT COMMANDS

```powershell
# SSOT Deployment (RECOMMENDED - prevents branch mismatch)
.\deploy.ps1 "commit message"

# Frontend hot reload
npm run dev

# Build for production
npm run build

# Sync constants to backend
npm run sync-constants

# Sync branding to database
npm run sync-branding

# Sync tier config to database
npm run sync-tier-config

# Deploy all edge functions
npx supabase functions deploy

# Deploy specific edge function
npx supabase functions deploy toolbelt-reflect

# Regenerate Supabase types (after schema changes)
npx supabase gen types typescript --project-id hphebzdftpjbiudpfcrs > src/integrations/supabase/types.ts

# Git commit and push
git add -A
git commit -m "message"
git push
```

---

## POST-LAUNCH ROADMAP

### Priority: LOW (Post-Launch Enhancements)

| Feature | Description | Estimated Effort |
|---------|-------------|------------------|
| In-App Teacher Approval | Teacher receives notification, approves/declines transfer in app | 6-8 hours |
| Export Formatting Admin Panel | Admin UI to adjust Print/DOCX/PDF formatting without code changes | 4-6 hours |
| Organization-Scoped Beta Management | Org Leaders create own feedback surveys + analytics | 8-12 hours |
| Series/Theme Mode | Sequential lesson planning across multiple weeks | 12-16 hours |
| Email/Text Lesson Delivery | Send lessons and teasers via email/SMS | 6-8 hours |
| White-Label Personalized Footer | Custom footer text for enterprise tenants | 2-3 hours |
| Email Unsubscribe Link | Add one-click unsubscribe to automated emails | 2-3 hours |

---

## BETA TESTER TRANSITION

### Timeline
| Date | Event |
|------|-------|
| Jan 25, 2026 | Soft launch announcement sent to 16 beta testers |
| Jan 27, 2026 | Public launch ✅ |
| Feb 28, 2026 | Beta tester full access ends |
| Mar 1, 2026 | Beta testers transition to free tier or subscribe |

### Post-Transition Options
| Tier | Lessons | Sections | Reset | Cost |
|------|---------|----------|-------|------|
| **Free** | 5 per period (2 full + 3 partial) | 8 for first 2, then 1/5/8 | Rolling 30 days | Forever free |
| **Personal** | 20 per period | All 8 | Rolling 30 days | $9/month or $90/year |

---

## SESSION HANDOFF NOTES

**For next Claude instance:**
- Lynn is a non-programmer; provide complete, copy-paste ready solutions
- Follow Claude Debugging Protocol: diagnose root cause before proposing fixes
- All solutions must be SSOT compliant (frontend drives backend)
- Platform is in Production mode - no "Beta" references in UI

**Key Commands:**
- `.\deploy.ps1 "message"` - SSOT deployment (validates branch, prevents errors)
- `npm run sync-constants` - Syncs constants to edge functions
- `npm run sync-branding` - Syncs branding to database
- `npm run sync-tier-config` - Syncs tier limits to database
- `npx supabase functions deploy toolbelt-reflect` - Deploy Toolbelt reflection
- `npx supabase functions deploy send-toolbelt-sequence` - Deploy Toolbelt emails
- `npx supabase gen types typescript --project-id hphebzdftpjbiudpfcrs > src/integrations/supabase/types.ts` - Regenerate types

**Reset Logic (Important for Support):**
- All tiers use **rolling 30-day periods** (not calendar month)
- Each user's `reset_date` is stored in `user_subscriptions` table
- Free user period starts from email verification
- Subscriber period starts from subscription date (matches Stripe billing)

**SSOT Systems Status (All Complete ✅):**
- Color System (100% compliant - Forest Green #3D5C3D)
- Email Branding (BibleLessonSpark)
- UI Symbols (UTF-8 safe)
- Tier Config (database reads from tier_config table)
- Domain URLs (all Edge Functions use branding config)
- Transfer Request Statuses (transferRequestConfig.ts)
- Email Sequence Templates (database-driven, Admin Panel editable)
- Reset Logic (rolling 30-day, documented in trialConfig.ts)
- FeaturesSection (dynamic from 5 SSOT files, hover-activated)
- DevotionalSpark v2.1 (smooth prose, reader-focused, prayer ends with Jesus)
- **Teacher Toolbelt (Phase 23)** - Complete with 3 tools, admin panel, email sequence

**Teacher Toolbelt Status (All Complete ✅):**
- Public routes: `/toolbelt`, `/toolbelt/lesson-fit`, `/toolbelt/left-out-safely`, `/toolbelt/one-truth`
- Admin route: `/admin/toolbelt`
- Edge Functions: `toolbelt-reflect`, `send-toolbelt-sequence`
- Database: 4 tables created with RLS
- Email sequence: 7 templates loaded
- Admin panel: 4 tabs (Usage, Emails, Captures, Guardrails)
- ReactQuill editor with link toolbar

**Email Automation Status (All Complete ✅):**
- BLS Onboarding: `email_sequence_templates`, `email_sequence_tracking`
- Toolbelt Nurture: `toolbelt_email_templates`, `toolbelt_email_tracking`
- Triggers and cron jobs active for both sequences

**Database Protections:**
- UNIQUE constraint on `user_subscriptions.user_id` prevents duplicates
- UNIQUE constraint on `toolbelt_email_captures.email` prevents duplicates
- RLS enabled on all Toolbelt tables
- `user_parable_usage` view fixed with SECURITY INVOKER

**Dependencies:**
- `react-quill` - Rich text editor for email templates (both BLS and Toolbelt)

**Launch Status:**
- Launch Date: January 27, 2026 ✅ LAUNCHED
- Teacher Toolbelt: January 29, 2026 ✅ COMPLETE
- All code complete ✅
- All routes verified ✅
- Email automation working ✅
- Admin panel functional ✅
