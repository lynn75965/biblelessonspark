# PROJECT_MASTER.md
## BibleLessonSpark - Master Project Documentation
**Last Updated:** January 17, 2026 (Phase 20.10 - Export Formatting & Post-Launch Roadmap)
**Launch Date:** January 20, 2026

---

## QUICK REFERENCE

| Item | Value |
|------|-------|
| **Local URL** | http://localhost:8080 |
| **Production URL** | https://biblelessonspark.com |
| **Legacy URL** | https://lessonsparkusa.com |
| **Branch** | biblelessonspark |
| **Local Path** | C:\Users\Lynn\lesson-spark-usa |
| **Supabase Project** | hphebzdftpjbiudpfcrs |
| **Platform Mode** | Production (as of Jan 10, 2026) |
| **Launch Date** | January 20, 2026 |

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
| `src/config/branding.ts` | **SSOT for ALL colors** |
| `src/config/brand-values.json` | **SSOT for colors/typography** |

### Sync Commands
| Command | Purpose |
|---------|---------|
| `npm run sync-constants` | Syncs src/constants/ → supabase/functions/_shared/ |
| `npm run sync-branding` | Syncs branding → branding_config table |
| `npm run sync-tier-config` | Syncs tier config → tier_config table |

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

### Key Database Functions
| Function | Purpose |
|----------|---------|
| `check_lesson_limit(user_id)` | Returns tier info, reads from `tier_config` table |
| `increment_lesson_usage(user_id)` | Increments `lessons_used` in `user_subscriptions` |

### Duplicate Subscription Prevention
- UNIQUE constraint on `user_subscriptions.user_id`
- `check_lesson_limit` uses `ON CONFLICT DO NOTHING` for race condition handling

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

## JANUARY 20, 2026 LAUNCH STATUS

### ✅ COMPLETE - Ready for Launch
| Item | Status |
|------|--------|
| SSOT Color System | ✅ 100% compliant |
| SSOT Email Branding | ✅ BibleLessonSpark emails |
| SSOT UI Symbols | ✅ UTF-8 safe |
| SSOT Tier Config | ✅ Database reads from tier_config |
| Tier Enforcement | ✅ Active in Production mode |
| Duplicate Subscription Prevention | ✅ UNIQUE constraint + ON CONFLICT |
| Organization Invitations | ✅ Working |
| Platform Mode | ✅ Production |
| Header Logo + Wordmark | ✅ Matches footer |
| Save Profile UX | ✅ Moved to bottom of Step 3 |

### 🟡 CONFIGURATION ITEMS (Pre-Launch)
| Item | Action |
|------|--------|
| Stripe Live Mode | Switch test keys to live in Supabase secrets |
| Resend Domain | Verify `biblelessonspark.com` in Resend dashboard |
| Show Pricing | Set to `true` in Admin Panel when ready |

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

---

## COMPLETED PHASES

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
- Root cause: Race condition in `check_lesson_limit` creating duplicates when multiple requests hit simultaneously
- Fix: Added UNIQUE constraint on `user_subscriptions.user_id`
- Fix: Updated `check_lesson_limit` to use `ON CONFLICT DO NOTHING`
- Cleaned up all existing duplicate records

**SSOT Tier Config System**
- Created `tier_config` database table
- Updated `check_lesson_limit` function to read from `tier_config` (removed all hardcoded values)
- Created `scripts/sync-tier-config-to-db.cjs`
- Added `npm run sync-tier-config` command to package.json

**UX Improvements**
- Header now shows logo + wordmark (was showing icon only due to invalid `xs` breakpoint)
- Save Profile button moved from top-right corner to bottom of Step 3 with clear explanation
- Added helpful text: "Save these settings for future lessons? Create a profile to quickly apply these preferences next time."

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
├── config/
│   ├── branding.ts                  # SSOT: All brand colors
│   └── brand-values.json            # SSOT: Colors/typography JSON
├── constants/
│   ├── pricingConfig.ts             # TIER_SECTIONS, TIER_LIMITS (MASTER)
│   ├── uiSymbols.ts                 # UI symbols (UTF-8 safe)
│   └── [other SSOT files]
```

### Backend (Edge Functions)
```
supabase/functions/
├── generate-lesson/
│   └── index.ts                     # Tier enforcement active
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

### Database Tables (Tier System)
```
tier_config                          # SSOT for tier limits/sections
user_subscriptions                   # User's current tier + usage (UNIQUE on user_id)
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

### Priority: LOW (Post-Launch Enhancements)

| Feature | Description | Estimated Effort |
|---------|-------------|------------------|
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

**Database Protections:**
- UNIQUE constraint on `user_subscriptions.user_id` prevents duplicates
- `check_lesson_limit` uses `ON CONFLICT DO NOTHING` for race conditions

**Launch Countdown:**
- Launch Date: January 20, 2026
- All code complete
- Only configuration items remain (Stripe live keys, Resend domain, show_pricing toggle)
