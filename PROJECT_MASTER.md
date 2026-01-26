# PROJECT_MASTER.md
## BibleLessonSpark - Master Project Documentation
**Last Updated:** January 25, 2026 (Phase 21 - Email Automation & Soft Launch)
**Launch Date:** January 27, 2026

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
| `src/constants/pricingConfig.ts` | Tier sections, limits (MASTER for tier_config) |
| `src/constants/trialConfig.ts` | Trial system configuration |
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

## EMAIL INFRASTRUCTURE (Phase 21 - COMPLETE ✅)

### Architecture
```
User Signup → Supabase Auth → Resend SMTP → Verification Email
                                    ↓
                          User Verifies Email
                                    ↓
                    (Future) Webhook → I-Mail → Drip Sequence
```

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
| Password | Resend API key (re_...) |

### Resend Configuration
| Item | Status |
|------|--------|
| Domain | `biblelessonspark.com` ✅ Verified |
| API Key | Active |
| SMTP Access | Enabled |

### I-Mail Autoresponder (imail-cloud.com)
| Setting | Value |
|---------|-------|
| SMTP Host | `smtp.resend.com` |
| SMTP Port | `587` |
| SMTP Username | `resend` |
| SMTP Password | Resend API key |
| From Email | `noreply@biblelessonspark.com` |
| Reply-To | `support@biblelessonspark.com` |
| Use TLS | Yes |

### New User Onboarding Sequence (I-Mail)
| Send Day | Subject | Purpose |
|----------|---------|---------|
| 0 | Your first BibleLessonSpark lesson is ready to teach! | Welcome + first lesson CTA |
| 1 | A quick note about your free lessons | Free tier explanation (2 full + 3 short) |
| 3 | Save 10 minutes every week (here's how) | Teacher Profiles feature |
| 7 | Did you know? Your existing curriculum works here too | Curriculum Enhancement Mode |
| 14 | Give your class a sneak peek this week | Student Teaser feature |
| 21 | You prepare for your class. Who prepares your heart? | DevotionalSpark + upgrade CTA |
| 30 | Is your whole teaching team ready? | Organization features |

### Remaining Email Automation Work
| Task | Status |
|------|--------|
| I-Mail SMTP configured | ✅ Complete |
| 7-email sequence created | ✅ Complete |
| Supabase → I-Mail webhook | ⬜ Not started |
| Auto-add verified users to sequence | ⬜ Not started |

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
| free | 5 | [1,5,8] | false | 1 month |
| personal | 20 | [1,2,3,4,5,6,7,8] | true | 1 month |
| admin | 9999 | [1,2,3,4,5,6,7,8] | true | 1 month |

### Free Tier Details (for user communication)
- Lessons #1 & #2: Full 8-section lessons
- Lessons #3, #4, #5: Streamlined 3-section lessons (brief background, teaching transcript, student handout)
- Pattern resets every 30 days (forever free)

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
- `formatLoading()` - Returns "Loading…"

---

## SSOT COLOR SYSTEM (Phase 20.6 - 100% COMPLETE ✅)

### Architecture
```
branding.ts (SSOT - HEX colors)
    ↓ hexToHsl() converter
    ↓ generateTailwindCSSVariables()
    ↓
BrandingProvider.tsx (runtime injection)
    ↓ <style id="biblelessonspark-brand-variables">
    ↓
CSS Variables (--primary, --secondary, etc.)
    ↓
Tailwind classes (bg-primary, text-secondary)
    ↓
Components
```

### BibleLessonSpark Brand Colors
| Color | HEX | HSL | Usage |
|-------|-----|-----|-------|
| Forest Green | `#3D5C3D` | `120 20% 30%` | Primary - buttons, links, headers |
| Antique Gold | `#D4A74B` | `43 62% 56%` | Secondary - accents, badges |
| Burgundy | `#661A33` | `342 60% 25%` | Destructive - errors, warnings |
| Warm Cream | `#FFFEF9` | `50 100% 99%` | Background |
| Deep Gold | `#C9A754` | `43 50% 56%` | Accent |

### CSS Debugging Protocol
When colors appear wrong, run in browser DevTools Console:
```javascript
getComputedStyle(document.documentElement).getPropertyValue('--primary')
// Expected: "120 20% 30%" (Forest Green)
```

---

## TIER ENFORCEMENT SYSTEM (ACTIVE ✅)

### Behavior Matrix
| Platform Mode | User Tier | Sections Generated |
|---------------|-----------|-------------------|
| Beta | Any | All 8 sections |
| Production | Free | Sections 1, 5, 8 (3 sections) |
| Production | Personal | All 8 sections |
| Production | Admin | All 8 sections |

### Implementation Location
- `supabase/functions/generate-lesson/index.ts` - Filters sections based on tier
- `tier_config` table - SSOT for tier limits (synced via `npm run sync-tier-config`)
- `check_lesson_limit()` function - Reads from `tier_config` (no hardcoding)

---

## PERPETUAL FRESHNESS SYSTEM (Phase 20.11 - COMPLETE ✅)

### Purpose
Ensures lesson variety by applying different stylistic approaches to each lesson.

### Features
- **Freshness Mode Selection**: System selects from variety of lesson styles
- **Teaser Freshness**: Separate freshness mode for student teasers
- **Customization-Aware**: Skips freshness on elements teacher already specified
- **Baptist Terminology Guardrails**: Enforces proper terminology (ordinance vs sacrament)
- **Comprehensive Logging**: Tracks which modes selected, what was skipped

### Key Files
- `EnhanceLessonForm.tsx` - Transmits freshness mode to API
- `generate-lesson/index.ts` - Applies freshness with guardrails

---

## RLS SECURITY (Phase 20.13 - COMPLETE ✅)

### Tables with RLS Enabled
| Table | Policy | Notes |
|-------|--------|-------|
| `tier_config` | SELECT for all | Non-sensitive reference data |
| `anonymous_parable_usage` | SELECT + INSERT for anon | Warning for WITH CHECK(true) is acceptable |
| All other tables | Standard RLS | Per Supabase Security Advisor |

---

## JANUARY 27, 2026 LAUNCH STATUS

### ✅ COMPLETE - Ready for Launch
| Item | Status |
|------|--------|
| SSOT Color System | ✅ 100% compliant |
| SSOT Email Branding | ✅ BibleLessonSpark emails |
| SSOT UI Symbols | ✅ UTF-8 safe |
| SSOT Tier Config | ✅ Database reads from tier_config |
| Tier Enforcement | ✅ Active in Production mode |
| Duplicate Subscription Prevention | ✅ UNIQUE constraint + ON CONFLICT |
| Organization Invitations | ✅ Fixed infinite loop, email verification |
| Domain SSOT Compliance | ✅ All Edge Functions use branding config |
| Transfer Request System | ✅ Complete workflow |
| RLS Security | ✅ All tables secured |
| Platform Mode | ✅ Production |
| Header Logo + Wordmark | ✅ Matches footer |
| Save Profile UX | ✅ Moved to bottom of Step 3 |
| Perpetual Freshness | ✅ Customization-aware |
| Baptist Terminology Guardrails | ✅ Enforced in theology profiles |
| Email Verification | ✅ Supabase "Confirm email" enabled |
| Supabase SMTP | ✅ Configured for biblelessonspark.com via Resend |
| Domain Redirect | ✅ lessonsparkusa.com → biblelessonspark.com |
| I-Mail Autoresponder | ✅ SMTP configured, 7-email sequence built |
| Beta Tester Communication | ✅ Soft launch email drafted |

### 🟡 CONFIGURATION ITEMS (Pre-Launch)
| Item | Action | Status |
|------|--------|--------|
| Stripe Live Mode | Switch test keys to live in Supabase secrets | ⬜ |
| Resend Domain | Verify `biblelessonspark.com` in Resend dashboard | ✅ Verified |
| Show Pricing | Set to `true` in Admin Panel when ready | ⬜ |
| Supabase → I-Mail Webhook | Auto-add verified users to drip sequence | ⬜ Post-launch |

---

## CURRENT PLATFORM STATE

### Platform Mode: PRODUCTION
As of January 10, 2026, BibleLessonSpark is in **Production Mode**.

| Setting | Value |
|---------|-------|
| `system_settings.current_phase` | `production` |
| `system_settings.show_join_beta_button` | `false` |
| `feedback_questions.feedback_mode` | `production` |
| `feedbackConfig.ts CURRENT_FEEDBACK_MODE` | `production` |

### What Users See (Production Mode)
| Element | Value |
|---------|-------|
| Landing page badge | "Personalized Bible Studies Built In 3 Minutes" |
| Landing page CTA button | "Get Started" |
| Landing page trust text | "Trusted by Baptist teachers across the country" |
| "Join Beta" button | Hidden |
| Feedback modal title | "Share Your Feedback" |
| Community page CTA | "Ready to Transform Your Lesson Prep?" |

### What's Working
- ✅ Accordion-style 3-step lesson creation
- ✅ 8-section lesson generation (all users during Beta)
- ✅ Tier-based section filtering in Production mode
- ✅ Bible version copyright attribution in all exports (PDF, DOCX, Copy, Print)
- ✅ Legacy lesson formatting normalization (## headers → **bold:**)
- ✅ Organization invitations with BibleLessonSpark branding
- ✅ Save Profile button at bottom of Step 3 with clear explanation
- ✅ Header shows logo + wordmark matching footer
- ✅ Transfer request workflow for org member management
- ✅ Admin Panel shows transfer queue in Organizations tab
- ✅ Email verification on signup (Supabase → Resend SMTP)
- ✅ Domain redirect from legacy URL

---

## COMPLETED PHASES

### Phase 21 (Jan 25, 2026) - Email Automation & Soft Launch Preparation
**Email Infrastructure Setup**
- Configured I-Mail autoresponder with Resend SMTP (port 587)
- Created "New Users" list in I-Mail
- Built 7-email onboarding drip sequence
- Verified Supabase email confirmation working with biblelessonspark.com domain
- Updated Supabase SMTP port from 465 to 587

**Onboarding Sequence Created**
- Day 0: Welcome email with first lesson CTA
- Day 1: Free tier explanation (2 full + 3 short lessons per 30 days)
- Day 3: Teacher Profiles introduction
- Day 7: Curriculum Enhancement Mode
- Day 14: Student Teaser feature
- Day 21: DevotionalSpark + upgrade invitation
- Day 30: Organization features

**Soft Launch Preparation**
- Drafted beta tester announcement email (16 original testers)
- Confirmed domain redirect from lessonsparkusa.com to biblelessonspark.com
- Beta testers retain full access through end of February 2026

**Affiliate/Sharing Materials**
- Created comprehensive benefits inventory
- Developed talking points for different contexts (verbal, text, email, social)
- Built one-page reference sheet (HTML format for easy editing)
- Key messaging: "90 seconds — sparks preparation with full lesson"

### Phase 20.13 (Jan 21, 2026) - RLS Security & Transfer System Completion
- Enabled RLS on `tier_config` table with public SELECT policy
- Enabled RLS on `anonymous_parable_usage` table with anon SELECT + INSERT
- Fixed "Failed to load transfer requests" toast error (simplified query)
- Fixed destination org dropdown showing empty (changed `"active"` to `"approved"` status filter)
- Added TransferRequestQueue to Admin Panel → Organizations tab
- Confirmed attestation model for launch (offline teacher agreement)

### Phase 20.12 (Jan 20, 2026) - Organization Invitation Bugs & Domain SSOT
**Organization Invitation Infinite Loop Fix**
- Issue: 6,000+ requests to invites endpoint causing page crash
- Root cause: `toast` in useEffect dependency array changing on every render
- Fix: Removed toast from dependency array, added proper cleanup

**Email Verification Bypass for Invites**
- Issue: Invited users forced through email verification after signup
- Fix: Created `confirm-invite-email` Edge Function using Supabase admin API
- Result: Invited users go directly to dashboard after signup

**Session Management Fix**
- Issue: Supabase not maintaining session after signup with email confirmation
- Fix: Immediate sign-in for invited users after account creation

**Domain SSOT Compliance**
- Issue: Edge Functions using `SITE_URL` environment variable instead of branding config
- Fixed 5 Edge Functions to use `getBaseUrl(branding)`:
  - `send-invite`
  - `create-checkout-session`
  - `create-portal-session`
  - `send-focus-notification`
  - `send-auth-email`
- All URLs now correctly point to `biblelessonspark.com`

**Admin Panel Shared Focus Tab**
- Issue: Shared Focus tab showing blank in Admin Panel org detail view
- Fix: Wired OrgSharedFocusPanel component to OrgDetailView

**Transfer Request System Implementation**
- Created `transferRequestConfig.ts` SSOT for status definitions
- Created `transfer_requests` database table with RLS policies
- Built `TransferRequestForm.tsx` for Org Managers
- Built `TransferRequestQueue.tsx` for Admin review
- Integrated into OrgMemberManagement and Admin Panel

### Phase 20.11 (Jan 18-19, 2026) - Perpetual Freshness System
- Implemented freshness mode transmission to API
- Added teaser freshness selection
- Implemented customization-aware skipping (respects teacher preferences)
- Added Baptist terminology guardrails
- Comprehensive logging for debugging

### Phase 20.10 (Jan 17, 2026) - Export Formatting & Post-Launch Roadmap
- Fixed DOCX export spacing issues
- Fixed markdown symbols displaying in exports
- Created post-launch feature roadmap

### Phase 20.9 (Jan 16, 2026) - SSOT Deployment & Feedback Config
**Feedback Auto-Popup Fix**
- Issue: Feedback modal popping up on every export action (annoying UX)
- Root cause: `onExport` callback unconditionally triggered modal
- Fix: Added `autoPopupOnExport` flag to `FEEDBACK_TRIGGER` in `feedbackConfig.ts`
- SSOT compliance: `autoPopupOnExport` derived from `CURRENT_FEEDBACK_MODE`
  - Beta mode = true (auto-popup enabled)
  - Production mode = false (no auto-popup, rely on "Give Feedback" button)

**SSOT Deployment Script (deploy.ps1)**
- Issue: Commits pushed to wrong branch (`main` vs `biblelessonspark`)
- Fix: Created `deploy.ps1` script that:
  - Defines production branch once (`$PRODUCTION_BRANCH = "biblelessonspark"`)
  - Validates current branch before push
  - Single command deployment: `.\deploy.ps1 "commit message"`
- Prevents deployment errors from branch mismatch

### Phase 20.8 (Jan 15, 2026) - Tier Config SSOT & UX Improvements
**Bug Fix: Duplicate Subscription Records**
- Diagnosed usage count mismatch (Emily showed 2/5 but only 1 lesson existed)
- Found 4 users with duplicate subscription records
- Root cause: Race condition in `check_lesson_limit` creating duplicates
- Fix: Added UNIQUE constraint on `user_subscriptions.user_id`
- Fix: Updated `check_lesson_limit` to use `ON CONFLICT DO NOTHING`

**SSOT Tier Config System**
- Created `tier_config` database table
- Updated `check_lesson_limit` function to read from `tier_config`
- Created `scripts/sync-tier-config-to-db.cjs`
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
│   │   └── TeacherCustomization.tsx # Save Profile at bottom (Step 3)
│   ├── admin/
│   │   ├── OrganizationManagement.tsx  # Includes TransferRequestQueue
│   │   └── OrgDetailView.tsx           # Includes Shared Focus tab
│   ├── organization/
│   │   ├── TransferRequestForm.tsx     # Org Manager creates transfer
│   │   └── TransferRequestQueue.tsx    # Admin reviews transfers
├── config/
│   ├── branding.ts                  # SSOT: All brand colors
│   └── brand-values.json            # SSOT: Colors/typography JSON
├── constants/
│   ├── pricingConfig.ts             # TIER_SECTIONS, TIER_LIMITS (MASTER)
│   ├── uiSymbols.ts                 # UI symbols (UTF-8 safe)
│   ├── transferRequestConfig.ts     # Transfer request status SSOT
│   └── [other SSOT files]
```

### Backend (Edge Functions)
```
supabase/functions/
├── generate-lesson/
│   └── index.ts                     # Tier enforcement active
├── confirm-invite-email/
│   └── index.ts                     # Auto-confirms email for invited users
├── send-invite/
│   └── index.ts                     # Uses SSOT branding (biblelessonspark.com)
├── _shared/
│   ├── branding.ts                  # getBranding() helper
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
user_subscriptions                   # User's current tier + usage (UNIQUE on user_id)
transfer_requests                    # Org member transfer workflow
anonymous_parable_usage              # DevotionalSpark usage tracking (RLS: anon SELECT/INSERT)
branding_config                      # SSOT branding for edge functions
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

# Git commit and push
git add -A
git commit -m "message"
git push
```

---

## POST-LAUNCH ROADMAP

### Priority: HIGH (Immediate Post-Launch)

| Feature | Description | Estimated Effort |
|---------|-------------|------------------|
| Supabase → I-Mail Webhook | Auto-add verified users to drip sequence | 2-4 hours |

### Priority: LOW (Post-Launch Enhancements)

| Feature | Description | Estimated Effort |
|---------|-------------|------------------|
| In-App Teacher Approval | Teacher receives notification, approves/declines transfer in app | 6-8 hours |
| Export Formatting Admin Panel | Admin UI to adjust Print/DOCX/PDF formatting without code changes | 4-6 hours |
| Organization-Scoped Beta Management | Org Leaders create own feedback surveys + analytics | 8-12 hours |
| Series/Theme Mode | Sequential lesson planning across multiple weeks | 12-16 hours |
| Email/Text Lesson Delivery | Send lessons and teasers via email/SMS | 6-8 hours |
| White-Label Personalized Footer | Custom footer text for enterprise tenants | 2-3 hours |

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
| Jan 27, 2026 | Public launch |
| Feb 28, 2026 | Beta tester full access ends |
| Mar 1, 2026 | Beta testers transition to free tier or subscribe |

### Beta Tester Benefits (through Feb 28)
- 20 lessons per month
- All 8 sections
- Full feature access

### Post-Transition Options
- **Free tier**: 2 full lessons + 3 short lessons per 30 days (forever)
- **Personal subscription**: $9/month or $90/year ($7.50/month)

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

**SSOT Systems Status (All Complete ✅):**
- Color System (100% compliant - Forest Green #3D5C3D)
- Email Branding (BibleLessonSpark)
- UI Symbols (UTF-8 safe)
- Tier Config (database reads from tier_config table)
- Domain URLs (all Edge Functions use branding config)
- Transfer Request Statuses (transferRequestConfig.ts)

**Email Systems Status:**
- Supabase Auth SMTP: ✅ Configured (port 587, Resend)
- I-Mail Autoresponder: ✅ Configured (port 587, Resend)
- 7-email drip sequence: ✅ Built in I-Mail
- Webhook automation: ⬜ Not yet connected

**Database Protections:**
- UNIQUE constraint on `user_subscriptions.user_id` prevents duplicates
- `check_lesson_limit` uses `ON CONFLICT DO NOTHING` for race conditions
- RLS enabled on `tier_config` and `anonymous_parable_usage` tables

**Launch Status:**
- Launch Date: January 27, 2026
- All code complete
- Email verification working
- Domain redirect active
- Beta testers notified
