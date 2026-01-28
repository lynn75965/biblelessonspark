# PROJECT_MASTER.md
## BibleLessonSpark - Master Project Documentation
**Last Updated:** January 27, 2026 (Phase 22 - DevotionalSpark Style v2.1)
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

### Database Trigger: on_email_verified
```sql
-- Fires when user confirms email (email_confirmed_at changes from NULL)
-- Adds user to email_sequence_tracking automatically
CREATE TRIGGER on_email_verified
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL)
EXECUTE FUNCTION handle_email_verified();
```

### Cron Job (pg_cron)
```sql
-- Runs hourly to process email queue
SELECT cron.schedule(
  'send-sequence-emails',
  '0 * * * *',  -- Every hour at minute 0
  $$SELECT net.http_post(
    url := 'https://hphebzdftpjbiudpfcrs.supabase.co/functions/v1/send-sequence-email',
    headers := '{"Authorization": "Bearer [SERVICE_ROLE_KEY]"}'::jsonb
  )$$
);
```

### Edge Function: send-sequence-email

**Location:** `supabase/functions/send-sequence-email/index.ts`

**Features:**
- Reads templates from `email_sequence_templates` table
- Checks `email_sequence_tracking` for users needing emails
- Converts plain text to HTML with smart formatting:
  - URLs on their own line → styled green buttons
  - Lines starting with `-` or `•` → bullet lists
  - Double line breaks → paragraph spacing
- If `is_html=true`, uses body content as-is (wrapped in template)
- Branded header/footer added automatically
- Personalization: `{name}` and `{email}` variables
- Sends via Resend API
- Updates tracking record after successful send

**HTML Email Template Structure:**
```
┌─────────────────────────────────────────┐
│  ✦ BibleLessonSpark (green header)      │
│  Personalized Bible Studies in Minutes  │
├─────────────────────────────────────────┤
│                                         │
│  [Email body content - Georgia font]    │
│                                         │
│  [Green CTA button if URL present]      │
│                                         │
├─────────────────────────────────────────┤
│  Footer: Help link, copyright           │
└─────────────────────────────────────────┘
```

**Brand Colors Used:**
- Header gradient: #3D5C3D → #4A6F4A (Forest Green)
- Background: #FFFEF9 (Cream)
- Button: #3D5C3D (Forest Green)
- Text: #1a1a1a (Dark)
- Font: Georgia, serif

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

### Admin Panel: Email Sequences Tab

**Location:** Admin Panel → Email Sequences

**Features:**
- View all 7 email templates in collapsible cards
- Edit subject line, body content, send day
- Toggle Active/Inactive per email
- Toggle Plain Text / Rich Text mode
- **Rich Text Editor** (ReactQuill) with toolbar:
  - Bold, Italic, Underline
  - Headers (H1, H2, H3)
  - Bullet lists, Numbered lists
  - Links
  - Text alignment
- **Preview button** - Shows exact email appearance in modal
- Add new emails to sequence
- Delete emails from sequence

**Component:** `src/components/admin/EmailSequenceManager.tsx`
- Uses Supabase generated types (SSOT compliant)
- ReactQuill for rich text editing
- Converts Quill HTML to email-safe inline styles

### Testing the Email System

**Manual Test (Admin Panel):**
1. Go to Admin Panel → Email Sequences
2. Click "Test Edge Function" button
3. Check Supabase logs for results

**Add Test User to Sequence:**
```sql
INSERT INTO email_sequence_tracking (user_id, email, full_name, sequence_started_at)
VALUES ('user-uuid-here', 'test@example.com', 'Test User', now());
```

**Check Sequence Status:**
```sql
SELECT * FROM email_sequence_tracking ORDER BY created_at DESC;
```

### Resend Configuration
| Item | Value |
|------|-------|
| Domain | `biblelessonspark.com` ✅ Verified |
| API Key | Stored in Supabase secrets as `RESEND_API_KEY` |
| From Email | `noreply@biblelessonspark.com` |
| Reply-To | `support@biblelessonspark.com` |

### Supabase Auth Email Settings
| Setting | Value |
|---------|-------|
| Confirm email | ✅ Enabled |
| Custom SMTP | ✅ Enabled |
| Sender email | `support@biblelessonspark.com` |
| Sender name | `BibleLessonSpark Support` |
| Host | `smtp.resend.com` |
| Port | `587` |
| Username | `resend` |
| Password | Resend API key |

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

### How Reset Works (Database Function)
```sql
-- When reset_date has passed:
UPDATE user_subscriptions
SET lessons_used = 0,
    reset_date = NOW() + INTERVAL '30 days'
WHERE user_id = p_user_id;
```

### Free Tier Details (for user communication)
- **Lessons #1 & #2**: Full 8-section lessons
- **Lessons #3, #4, #5**: Streamlined 3-section lessons (Lens + Overview, Teaching Transcript, Student Handout)
- **Reset**: Every 30 days from signup (rolling, not calendar month)
- **Duration**: Perpetual (forever free - no expiration)

### Personal Tier Details
- **20 lessons per 30-day period**: All 8 sections
- **Includes**: Student Teaser feature
- **Reset**: Every 30 days from subscription date (aligns with Stripe billing cycle)

### User Communication: Free Tier Value Proposition
```
✓ 2 complete Bible study lessons every 30 days (all 8 sections)
✓ 3 additional streamlined lessons (core teaching content)
✓ Resets automatically every 30 days from your signup
✓ No credit card required - free forever
✓ Upgrade anytime for unlimited full lessons
```

### Key Database Functions
| Function | Purpose |
|----------|---------|
| `check_lesson_limit(user_id)` | Returns tier info, reads from `tier_config` table |
| `increment_lesson_usage(user_id)` | Increments `lessons_used` in `user_subscriptions` |

### Duplicate Subscription Prevention
- UNIQUE constraint on `user_subscriptions.user_id`
- `check_lesson_limit` uses `ON CONFLICT DO NOTHING` for race condition handling

---

## TRANSFER REQUEST SYSTEM (Phase 20.12-20.13 - COMPLETE ✅)

### Workflow
```
Org Manager ←→ Teacher (offline agreement)
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

### Key Components
| Component | Location | Purpose |
|-----------|----------|---------|
| `TransferRequestForm.tsx` | Org Manager Dashboard | Create transfer requests |
| `TransferRequestQueue.tsx` | Admin Panel → Organizations | Review/process requests |
| `transferRequestConfig.ts` | SSOT | Status definitions, helpers |

### Notes
- Uses **attestation model** for launch - Org Manager certifies offline agreement with Teacher
- Destination org dropdown shows only orgs with status "approved"
- In-app teacher approval workflow deferred to post-launch enhancement

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

### Helper Functions
- `joinWithBullet(items)` - Join array with bullet separator
- `formatNoneOption()` - Returns "— None —"

---

## CHANGELOG

### Phase 22 (Jan 27, 2026) - DevotionalSpark Style v2.1 🚀 LAUNCH DAY
**Complete rewrite of DevotionalSpark voice and prompt architecture**

**Key Changes:**
- Removed "invisible writer" concept → Now "creates space for reader-induced insight"
- Smooth, conversational prose—never pedantic
- Prayer always personal (I/me) and ends with reference to Jesus
- Abiding presence of God acknowledged lightly, not announced
- Moral valence guardrail maintained from parable system

**Voice Philosophy:**
- Universal human moments, not hypothetical "you probably felt..."
- Writer opens doors; reader walks through with own experience
- "We" only for genuine community, not to insert writer into reader's life

**Prayer Requirements:**
- Always personal: "I" and "me"
- Always ends with Jesus and His work
- Varied endings, not ritualistic

**Edge Function:** `generate-devotional` v2.1.0

### Phase 21.4 (Jan 26, 2026) - FeaturesSection SSOT Compliance
**Landing page Features section now fully SSOT-compliant**

**Dynamic Data Sources:**
- Age groups from `ageGroups.ts` (10 displayed, excludes "Mixed")
- Theology profiles from `theologyProfiles.ts` (10 profiles)
- Bible versions from `bibleVersions.ts` (8 versions)
- Lesson sections from `lessonStructure.ts` (8 sections)
- Teacher customizations from `teacherPreferences.ts` (6 teaching styles, 6 lesson lengths, 5 group sizes, 6 environments)

**UX Improvements:**
- All feature badges now HOVER-activated (HoverCard) instead of click
- "Personalized to Your Class" card shows capability counts with hover details
- Founder quote banner replaces stats banner

**Component:** `src/components/landing/FeaturesSection.tsx`

### Phase 21.3 (Jan 26, 2026) - Rolling 30-Day Reset Documentation
- Clarified reset logic: Rolling 30-day periods (not calendar month)
- Updated `trialConfig.ts` with `resetPeriod: 'rolling30'` and `resetIntervalDays: 30`
- Updated user-facing messages to reflect rolling reset
- Added helper functions: `getDaysUntilReset()`, `getNextTrialResetFormatted(userResetDate)`
- Database function `check_lesson_limit` already implemented rolling logic correctly

### Phase 21.2 (Jan 26, 2026) - Rich Text Email Editor + SSOT Compliance
- Added ReactQuill rich text editor to Admin Panel Email Sequences
- Toolbar: Bold, Italic, Underline, Headers, Lists, Links, Alignment
- Preview button shows exact email appearance
- Component now uses Supabase generated types (SSOT compliant)
- Added `is_html` column to `email_sequence_templates` table
- Plain text mode auto-converts to HTML; HTML mode uses content as-is

### Phase 21.1 (Jan 26, 2026) - Native Email Automation System
**Major pivot from I-Mail to native Supabase solution**

**Database:**
- Created `email_sequence_templates` table (7 default templates)
- Created `email_sequence_tracking` table
- Created `on_email_verified` trigger (auto-adds verified users)
- Created hourly cron job via pg_cron

**Edge Function:**
- Created `send-sequence-email` Edge Function
- Branded HTML email template (Forest Green header, Georgia font)
- Smart plain text → HTML conversion
- URL detection: main CTAs → buttons, secondary → inline links
- Personalization: `{name}` and `{email}` variables
- Plain text fallback for non-HTML email clients

**Admin Panel:**
- Added "Email Sequences" tab
- View/edit all 7 templates
- Toggle Active/Inactive
- Add/delete templates
- Test Edge Function button

### Phase 21 (Jan 25, 2026) - Email Strategy & I-Mail Setup
- Drafted 7-email onboarding sequence content
- Configured I-Mail autoresponder with Resend SMTP
- Decided to pivot to native solution (Phase 21.1)

### Phase 20.8 (Jan 16, 2026) - SSOT Tier Config System
- Created `tier_config` database table
- `check_lesson_limit()` now reads from database
- Added `npm run sync-tier-config` command

**UX Improvements**
- Header now shows logo + wordmark (fixed invalid `xs` breakpoint)
- Save Profile button moved to bottom of Step 3 with clear explanation

### Phase 20.7 (Jan 15, 2026) - UTF-8 Encoding Fix + UI Symbols SSOT
- Created `src/constants/uiSymbols.ts` as SSOT for UI symbols
- Created `supabase/functions/_shared/uiSymbols.ts` backend mirror
- Fixed 18 encoding corruptions across 10 files
- All special characters (•, —, …, ✓, ★, ✨) now centralized

### Phase 20.6 (Jan 15, 2026) - SSOT Email Branding & Database Sync
- Fixed organization invitation emails showing "LessonSpark USA" → "BibleLessonSpark"
- Created `npm run sync-branding` command
- Updated email templates to use Forest Green button
- Created `branding_config` table for edge function access

### Phase 20.5 (Jan 15, 2026) - SSOT Color Compliance Cleanup
- Fixed 151 hardcoded color violations (100% compliance achieved)
- All colors now flow from `branding.ts` SSOT

### Phase 20.4 (Jan 14, 2026) - SSOT Architecture Consolidation
- Created `src/config/brand-values.json` as single source of truth
- Changed font from Inter to Poppins

### Phase 20.3 (Jan 10-14, 2026) - Production Mode & Domain Launch
- Switched platform from Beta to Production mode
- Launched biblelessonspark.com domain
- Connected Netlify deployment

---

## FILE LOCATIONS

### Frontend
```
src/
├── components/
│   ├── BrandingProvider.tsx         # Runtime CSS variable injection
│   ├── layout/
│   │   ├── Header.tsx               # Logo + wordmark (SSOT from BRANDING)
│   │   └── Footer.tsx               # Logo + wordmark (SSOT from BRANDING)
│   ├── dashboard/
│   │   ├── EnhanceLessonForm.tsx    # 3-step accordion
│   │   ├── TeacherCustomization.tsx # Save Profile at bottom (Step 3)
│   │   ├── DevotionalGenerator.tsx  # DevotionalSpark UI
│   │   └── DevotionalLibrary.tsx    # Devotional library
│   ├── admin/
│   │   ├── OrganizationManagement.tsx  # Includes TransferRequestQueue
│   │   ├── OrgDetailView.tsx           # Includes Shared Focus tab
│   │   └── EmailSequenceManager.tsx    # Rich text email editor
│   ├── organization/
│   │   ├── TransferRequestForm.tsx     # Org Manager creates transfer
│   │   └── TransferRequestQueue.tsx    # Admin reviews transfers
│   ├── landing/
│   │   └── FeaturesSection.tsx         # SSOT: Ages, Theology, Versions, Sections, Preferences
├── config/
│   ├── branding.ts                  # SSOT: All brand colors
│   └── brand-values.json            # SSOT: Colors/typography JSON
├── constants/
│   ├── pricingConfig.ts             # TIER_SECTIONS, TIER_LIMITS (MASTER)
│   ├── trialConfig.ts               # Trial/reset configuration (rolling 30-day)
│   ├── devotionalConfig.ts          # DevotionalSpark configuration
│   ├── uiSymbols.ts                 # UI symbols (UTF-8 safe)
│   ├── transferRequestConfig.ts     # Transfer request status SSOT
│   └── [other SSOT files]
```

### Backend (Edge Functions)
```
supabase/functions/
├── generate-lesson/
│   └── index.ts                     # Tier enforcement active
├── generate-devotional/
│   └── index.ts                     # DevotionalSpark v2.1 (Jan 27, 2026)
├── confirm-invite-email/
│   └── index.ts                     # Auto-confirms email for invited users
├── send-invite/
│   └── index.ts                     # Uses SSOT branding (biblelessonspark.com)
├── send-sequence-email/
│   └── index.ts                     # Automated onboarding emails
├── _shared/
│   ├── branding.ts                  # getBranding() helper
│   ├── devotionalConfig.ts          # DevotionalSpark SSOT mirror
│   ├── theologyProfiles.ts          # Theology guardrails
│   ├── bibleVersions.ts             # Copyright guardrails
│   ├── uiSymbols.ts                 # Backend mirror
│   └── pricingConfig.ts             # Backend mirror
```

### Scripts
```
scripts/
├── sync-constants.cjs               # Syncs src/constants/ → _shared/
├── sync-branding-to-db.cjs          # Syncs branding → branding_config table
└── sync-tier-config-to-db.cjs       # Syncs tier config → tier_config table

deploy.ps1                           # SSOT deployment script (root directory)
```

### Database Tables
```
tier_config                          # SSOT for tier limits/sections (RLS: SELECT all)
user_subscriptions                   # User's current tier + usage + reset_date (UNIQUE on user_id)
transfer_requests                    # Org member transfer workflow
devotionals                          # Generated devotionals
branding_config                      # SSOT branding for edge functions
email_sequence_templates             # Onboarding email content (7 emails)
email_sequence_tracking              # User progress through email sequence
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
npx supabase functions deploy generate-devotional

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

### Export Formatting Admin Panel (Details)
**Purpose:** Allow admin to adjust Print/DOCX/PDF formatting without code deployments
**Location:** Admin Panel → New "Export Settings" tab
**Settings to expose:**
- Font family (Calibri, Georgia, Times New Roman, etc.)
- Font sizes (body, title, section headers, metadata, footer)
- Page margins
- Paragraph/section spacing
- Colors (teaser box background, border, text colors)

**Storage:** `platform_settings` table with JSON config column
**Implementation:** Export files read from database config, fallback to `lessonStructure.ts` defaults
**Benefit:** Self-service formatting tweaks, white-label customization for enterprise clients

---

## BETA TESTER TRANSITION

### Timeline
| Date | Event |
|------|-------|
| Jan 25, 2026 | Soft launch announcement sent to 16 beta testers |
| Jan 27, 2026 | Public launch ✅ |
| Feb 28, 2026 | Beta tester full access ends |
| Mar 1, 2026 | Beta testers transition to free tier or subscribe |

### Beta Tester Benefits (through Feb 28)
- 20 lessons per 30-day period
- All 8 sections
- Full feature access

### Post-Transition Options
| Tier | Lessons | Sections | Reset | Cost |
|------|---------|----------|-------|------|
| **Free** | 5 per period (2 full + 3 partial) | 8 for first 2, then 1/5/8 | Rolling 30 days | Forever free |
| **Personal** | 20 per period | All 8 | Rolling 30 days | $9/month or $90/year |

### User Communication: Free Tier Value Proposition
```
✓ 2 complete Bible study lessons every 30 days (all 8 sections)
✓ 3 additional streamlined lessons (core teaching content)
✓ Resets automatically every 30 days from your signup
✓ No credit card required - free forever
✓ Upgrade anytime for unlimited full lessons
```

---

## SESSION HANDOFF NOTES

**For next Claude instance:**
- Lynn is a non-programmer; provide complete, copy-paste ready solutions
- Follow Claude Debugging Protocol: diagnose root cause before proposing fixes
- All solutions must be SSOT compliant (frontend drives backend)
- Platform is in Production mode - no "Beta" references in UI

**Key Commands:**
- `.\deploy.ps1 "message"` - SSOT deployment (validates branch, prevents errors)
- `npm run sync-branding` - Syncs branding to database
- `npm run sync-tier-config` - Syncs tier limits to database
- `npm run sync-constants` - Syncs constants to edge functions
- `npx supabase functions deploy generate-devotional` - Deploy DevotionalSpark
- `npx supabase gen types typescript --project-id hphebzdftpjbiudpfcrs > src/integrations/supabase/types.ts` - Regenerate types after schema changes

**Reset Logic (Important for Support):**
- All tiers use **rolling 30-day periods** (not calendar month)
- Each user's `reset_date` is stored in `user_subscriptions` table
- Free user period starts from email verification
- Subscriber period starts from subscription date (matches Stripe billing)
- To check a user's reset date: `SELECT reset_date FROM user_subscriptions WHERE user_id = '[uuid]'`

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

**Email Automation Status (All Complete ✅):**
- Database tables: `email_sequence_templates`, `email_sequence_tracking`
- Trigger: `on_email_verified` auto-adds users
- Cron: Hourly job invokes Edge Function
- Edge Function: `send-sequence-email` sends branded HTML
- Admin Panel: Rich text editor with preview
- 7-email sequence loaded and active

**DevotionalSpark v2.1 Status (All Complete ✅):**
- Edge Function deployed: `generate-devotional` v2.1.0
- Voice: Creates space for reader-induced insight
- Prose: Smooth, conversational, never pedantic
- Prayer: Personal (I/me), always ends with Jesus
- Presence: God acknowledged lightly, not announced
- Valence: Moral guardrail active (prevents inversion)

**Database Protections:**
- UNIQUE constraint on `user_subscriptions.user_id` prevents duplicates
- `check_lesson_limit` uses `ON CONFLICT DO NOTHING` for race conditions
- RLS enabled on `tier_config` and `devotionals` tables

**Dependencies Added (Jan 26, 2026):**
- `react-quill` - Rich text editor for email templates

**Launch Status:**
- Launch Date: January 27, 2026 ✅ LAUNCHED
- All code complete ✅
- Email verification working ✅
- Email automation working ✅
- Domain redirect active ✅
- Beta testers notified ✅
- Rolling 30-day reset documented ✅
- DevotionalSpark v2.1 deployed ✅
