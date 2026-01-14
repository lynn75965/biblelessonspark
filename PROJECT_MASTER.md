# PROJECT_MASTER.md
## LessonSparkUSA - Master Project Documentation
**Last Updated:** January 13, 2026 (Phase 20 - SSOT Color System COMPLETE)

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

---

## ARCHITECTURE PRINCIPLES

### SSOT (Single Source of Truth)
- **Frontend drives backend** - All constants defined in `src/constants/`
- Backend mirrors auto-generated via `npm run sync-constants`
- Never edit `supabase/functions/_shared/` directly

### Key SSOT Files
| File | Purpose |
|------|---------|
| `src/constants/ageGroups.ts` | Age group definitions |
| `src/constants/bibleVersions.ts` | Bible versions + copyright notices |
| `src/constants/theologyProfiles.ts` | 10 Baptist theological traditions |
| `src/constants/lessonStructure.ts` | 8-section lesson framework |
| `src/constants/pricingConfig.ts` | Tier sections (free vs personal) |
| `src/constants/trialConfig.ts` | Trial system configuration |
| `src/constants/tenantConfig.ts` | White-label tenant configuration (imports from branding.ts) |
| `src/constants/feedbackConfig.ts` | Feedback mode (beta/production) |
| `src/constants/systemSettings.ts` | Platform mode helpers |
| `src/config/branding.ts` | **SSOT for ALL colors** - HEX definitions, generates CSS variables |
| `src/components/BrandingProvider.tsx` | Runtime CSS variable injection from branding.ts |
| `src/utils/formatLessonContent.ts` | SSOT for lesson content HTML formatting |

---

## SSOT COLOR SYSTEM (Phase 20 - COMPLETE ✅)

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

### Tenant Override Flow
```
branding.ts (base HEX colors)
    ↓
DEFAULT_TENANT_CONFIG (imports BRANDING.colors)
    ↓
BrandingProvider.tsx (injects CSS variables)
    ↓
Admin Panel tenant overrides (optional)
    ↓
Final rendered colors
```

### BibleLessonSpark Brand Colors
| Color | HEX | HSL | Usage |
|-------|-----|-----|-------|
| Forest Green | `#3D5C3D` | `120 20% 30%` | Primary - buttons, links, headers |
| Antique Gold | `#D4A74B` | `43 62% 56%` | Secondary - accents, badges |
| Burgundy | `#661A33` | `342 60% 25%` | Destructive - errors, warnings |
| Warm Cream | `#FFFEF9` | `50 100% 99%` | Background |
| Deep Gold | `#C9A754` | `43 50% 56%` | Accent |

### Key Functions in branding.ts
| Function | Purpose |
|----------|---------|
| `hexToHsl(hex)` | Converts HEX to HSL format for Tailwind |
| `adjustLightness(hsl, amount)` | Creates lighter/darker variants |
| `generateTailwindCSSVariables()` | Outputs complete CSS variable block |

### CSS Debugging Protocol
When colors appear wrong, run these in browser DevTools Console:
```javascript
// Check what --primary is set to
getComputedStyle(document.documentElement).getPropertyValue('--primary')
// Expected: "120 20% 30%" (Forest Green)

// Find ALL style tags injecting CSS variables
document.querySelectorAll('style').forEach((s, i) => {
  if (s.textContent.includes('--primary')) {
    console.log(`Style ${i}:`, s.id || 'no-id', s.textContent.substring(0, 200));
  }
});

// Check for cascade conflicts
const styles = getComputedStyle(document.documentElement);
['--primary', '--secondary', '--background', '--foreground'].forEach(v => {
  console.log(v, styles.getPropertyValue(v));
});
```

### White-Label Override Flow
1. BrandingProvider injects base CSS variables from branding.ts
2. If tenant has custom colors in Admin Panel, they override `--primary`/`--secondary`
3. Tailwind classes automatically use correct colors

### Files Involved (SSOT Compliant)
| File | Role | SSOT Status |
|------|------|-------------|
| `src/config/branding.ts` | SSOT - all HEX colors defined here | ✅ Source |
| `src/constants/tenantConfig.ts` | Imports from BRANDING (line 186) | ✅ Compliant |
| `src/components/BrandingProvider.tsx` | Injects CSS vars + applies tenant overrides | ✅ Compliant |
| `src/main.tsx` | Wraps app with BrandingProvider | ✅ Compliant |
| `src/index.css` | Stripped of color definitions (runtime generated) | ✅ Compliant |

### To Rebrand Entire App
Edit ONLY `src/config/branding.ts`:
```typescript
colors: {
  primary: { DEFAULT: "#3D5C3D" },   // Change this → all primary elements update
  secondary: { DEFAULT: "#D4A74B" }, // Change this → all secondary elements update
}
```

---

## CURRENT PLATFORM STATE

### Platform Mode: PRODUCTION
As of January 10, 2026, LessonSparkUSA.com is in **Production Mode**.

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
- ✅ Bible version copyright attribution in all exports (PDF, DOCX, Copy, Print)
- ✅ Legacy lesson formatting normalization (## headers → **bold:**)
- ✅ Lesson Library with export functionality
- ✅ Devotional Library (DevotionalSpark) with proper formatting
- ✅ Devotional Generator with progress indicator
- ✅ Bible version inheritance from lesson to devotional
- ✅ Copyright attribution in devotionals (copyrighted versions only)
- ✅ Organization management
- ✅ Admin Panel with Beta Trial Management
- ✅ Platform Mode toggle (Beta/Production) in Admin Panel
- ✅ Admin bypass for rate limits
- ✅ Mode-aware UI components (auto-switch beta/production text)
- ✅ SSOT tenant configuration for white-label deployments
- ✅ **SSOT Color System - Forest Green branding live** (Phase 20)

### What's Defined But NOT Enforced
- ⏳ **Tier-based section filtering** - SSOT exists, edge function doesn't enforce
- ⏳ **Free tier restrictions** - Currently all users get 8 sections
- ⏳ **Monthly trial system** - Database columns exist, logic not enforced

---

## BETA → PRODUCTION TRANSITION (Completed Jan 10, 2026)

### Database Changes Made
```sql
-- System Settings
UPDATE system_settings SET setting_value = 'production' WHERE setting_key = 'current_phase';
UPDATE system_settings SET setting_value = 'false' WHERE setting_key = 'show_join_beta_button';

-- Feedback Questions
UPDATE feedback_questions SET feedback_mode = 'production';

-- Tenant Config
UPDATE tenant_config SET prod_landing_badge_text = 'Personalized Bible Studies Built In 3 Minutes' WHERE tenant_id = 'lessonsparkusa';

-- New columns added
ALTER TABLE tenant_config ADD COLUMN beta_landing_badge_text TEXT;
ALTER TABLE tenant_config ADD COLUMN feedback_modal_title TEXT;
```

### Code Changes Made
| File | Change |
|------|--------|
| `branding.ts` | 6 user-facing "Beta" text values updated to production equivalents |
| `feedbackConfig.ts` | `CURRENT_FEEDBACK_MODE` → `'production'` |
| `tenantConfig.ts` | Added `beta_landing_badge_text` field mapping + updated defaults |
| `HeroSection.tsx` | Now reads badge text from `tenant_config` (fully SSOT) |
| `BetaFeedbackModal.tsx` | Mode-aware: shows "Share Your Feedback" in production |
| `Community.tsx` | Mode-aware: shows production CTA in production mode |
| `Help.tsx` | Removed all beta/credit references, updated to subscription model |

### Files Updated for Mode-Awareness
These components now check `isBetaMode(settings.current_phase)` and display appropriate text:

- `src/components/BetaFeedbackModal.tsx`
- `src/pages/Community.tsx`
- `src/components/landing/HeroSection.tsx` (reads from tenant_config)

---

## WHITE-LABEL BETA → PRODUCTION TRANSITION CHECKLIST

Use this checklist when transitioning any white-label tenant from Beta to Production:
```
TENANT: _________________ DATE: _________________

DATABASE CHANGES
□ system_settings.current_phase → 'production'
□ system_settings.show_join_beta_button → 'false'
□ feedback_questions.feedback_mode → 'production'
□ Delete pending beta tester notifications (if any)
□ Set tenant_config.prod_landing_badge_text
□ Set tenant_config.prod_landing_cta_button
□ Set tenant_config.prod_landing_trust_text

CODE CONFIGURATION
□ feedbackConfig.ts → CURRENT_FEEDBACK_MODE = 'production'

VERIFICATION
□ npm run build (no errors)
□ Landing page shows production badge text
□ Landing page shows production CTA button
□ "Join Beta" button is hidden
□ Feedback modal shows "Share Your Feedback"
□ Community page shows production CTA
□ Help page has no beta/credit references

NOTES:
_________________________________________________
```

### What's Preserved for White-Label Tenants
- All `beta:` configuration structure in code (untouched)
- All beta UI components (hidden by mode, not deleted)
- All beta database fields and columns
- Admin panel beta management tools
- Per-organization beta program capability
- TenantBrandingPanel beta text customization

---

## TIER SYSTEM (Ready for Production)

### SSOT Definition (src/constants/pricingConfig.ts)
```typescript
export const TIER_SECTIONS = {
  free: ['1', '5', '8'],           // 3 sections
  personal: ['1', '2', '3', '4', '5', '6', '7', '8'],  // All 8
  admin: ['1', '2', '3', '4', '5', '6', '7', '8'],
} as const;
```

### Section Mapping
| Section | Name | Free | Personal |
|---------|------|------|----------|
| 1 | Theological Lens + Overview | ✅ | ✅ |
| 2 | Learning Objectives + Key Scriptures | ❌ | ✅ |
| 3 | Theological Background (Deep-Dive) | ❌ | ✅ |
| 4 | Opening Activities | ❌ | ✅ |
| 5 | Main Teaching Content (Teacher Transcript) | ✅ | ✅ |
| 6 | Interactive Activities | ❌ | ✅ |
| 7 | Discussion & Assessment | ❌ | ✅ |
| 8 | Student Handout | ✅ | ✅ |

### Subscription Model
| Tier | Lessons/Month | Sections |
|------|---------------|----------|
| Free | 5 | 3 (1, 5, 8) |
| Personal | 20 | 8 (all) |

---

## PRE-PRODUCTION CHECKLIST

### ✅ COMPLETED
| Item | Status | Date |
|------|--------|------|
| Platform Mode Architecture | ✅ | Jan 2026 |
| Admin Panel System Settings toggle | ✅ | Jan 2026 |
| Tier enforcement logic defined | ✅ | Jan 2026 |
| Stripe integration (webhook, checkout, subscription sync) | ✅ | Dec 2025 |
| Trial grant/revoke UI | ✅ | Jan 2026 |
| DevotionalSpark integration | ✅ | Dec 2025 |
| Legacy content formatting normalization | ✅ | Jan 10, 2026 |
| Devotional Bible version inheritance | ✅ | Jan 10, 2026 |
| Devotional copyright attribution | ✅ | Jan 10, 2026 |
| Devotional progress indicator | ✅ | Jan 10, 2026 |
| **Beta → Production UI Transition** | ✅ | Jan 10, 2026 |
| **HeroSection.tsx SSOT Compliance** | ✅ | Jan 10, 2026 |
| **Mode-aware components** | ✅ | Jan 10, 2026 |
| **Help.tsx subscription model update** | ✅ | Jan 10, 2026 |
| **SSOT Color System (Phase 20)** | ✅ | Jan 13, 2026 |

### 🔴 OUTSTANDING - Must Fix Before Full Launch
| Item | Priority | Notes |
|------|----------|-------|
| **Organization Invitation Bug** | HIGH | Invitations not working properly |
| **Tier Enforcement in Edge Function** | HIGH | generate-lesson needs to filter sections by tier |

### 🟡 CONFIGURATION - Before Launch
| Item | Action Required |
|------|-----------------|
| Stripe Live Mode | Switch test keys to live keys in Supabase secrets |
| Email Configuration | Verify password reset, invitation emails work |
| Show Pricing | Set to `true` in Admin Panel when ready |
| Support Email | Verify configured in tenant_config |

### 🟢 MEDIUM PRIORITY - Post-Launch Polish
| Item | Notes |
|------|-------|
| `useBranding.ts` fallback colors | Lines 14-15 have `#4F46E5` instead of `#3D5C3D` |
| `TenantBrandingPanel.tsx` placeholder | Line 56 has `#E4572E` placeholder value |

---

## COMPLETED PHASE 20 (Jan 13, 2026)

### SSOT Color System - ROOT CAUSE FIX

**Problem:** Salmon color (`#E4572E` / `14 77% 54%`) persisted despite BrandingProvider correctly injecting Forest Green (`#3D5C3D` / `120 20% 30%`).

**Root Cause:** `DEFAULT_TENANT_CONFIG` in `src/constants/tenantConfig.ts` (line 186) had hardcoded salmon color `#E4572E` instead of importing from `BRANDING`.

**Solution Applied:**
```typescript
// BEFORE (line 186 tenantConfig.ts):
primary_color: "#E4572E",  // ❌ Hardcoded salmon

// AFTER:
import { BRANDING } from '@/config/branding';
primary_color: BRANDING.colors.primary.DEFAULT,  // ✅ SSOT compliant
```

**Files Modified:**
| File | Change |
|------|--------|
| `src/constants/tenantConfig.ts` | Added `import { BRANDING }`, replaced all hardcoded color values with BRANDING references |

**Verification:** 
- Production live at biblelessonspark.com shows Forest Green
- DevTools: `getComputedStyle(document.documentElement).getPropertyValue('--primary')` returns `120 20% 30%`

**Git Commit:** `fe0bec5` - "Fix: tenantConfig imports from BRANDING SSOT"

### Full Codebase Audit Results
| File | Status | Notes |
|------|--------|-------|
| `branding.ts` | ✅ SSOT Source | All colors defined here |
| `tenantConfig.ts` | ✅ Fixed | Now imports from BRANDING |
| `BrandingProvider.tsx` | ✅ Compliant | Generates from branding.ts |
| `tailwind.config.ts` | ✅ Compliant | References CSS variables only |
| `index.css` | ✅ Compliant | No hardcoded colors |
| `useBranding.ts` | ⚠️ Medium | Fallback `#4F46E5` (not user-facing) |
| `TenantBrandingPanel.tsx` | ⚠️ Medium | Placeholder `#E4572E` (admin only) |

---

## COMPLETED PREVIOUS SESSION (Jan 10, 2026)

### Beta → Production Transition
- ✅ Updated `system_settings.current_phase` → `production`
- ✅ Updated `system_settings.show_join_beta_button` → `false`
- ✅ Updated `feedback_questions.feedback_mode` → `production`
- ✅ Added `beta_landing_badge_text` column to `tenant_config`
- ✅ Added `feedback_modal_title` column to `tenant_config`
- ✅ Set production landing page text for LessonSparkUSA tenant

### SSOT Compliance Improvements
- ✅ `HeroSection.tsx` now reads badge text from `tenant_config` (was hardcoded)
- ✅ `tenantConfig.ts` updated with `beta.landingPage.badgeText` mapping
- ✅ All beta default text values updated to remove "Beta" references

### Mode-Aware Components
- ✅ `BetaFeedbackModal.tsx` - Shows "Share Your Feedback" in production
- ✅ `Community.tsx` - Shows production CTA in production mode
- ✅ `Help.tsx` - Removed all beta/credit language, updated to subscription model

### Lesson Formatting Fixes
- ✅ Created `normalizeLegacyContent()` in `formatLessonContent.ts`
- ✅ Converts legacy `## headers` → `**bold:**` format
- ✅ Converts plain `1. 2. 3.` → `**1)** **2)** **3)**` (parentheses to avoid list CSS)
- ✅ Fixed `parseLessonSections` regex to not match question lines as section headers
- ✅ Applied to `EnhanceLessonForm.tsx` for consistent rendering

### Devotional Formatting Fixes
- ✅ Fixed `DevotionalLibrary.tsx` modal display (raw markdown → formatted text)
- ✅ Fixed `DevotionalGenerator.tsx` page display
- ✅ Added `normalizeLegacyContent()` to both components

### Devotional Bible Version & Copyright
- ✅ Fixed `LessonLibrary.tsx` - reads `filters?.bible_version_id` (was `bible_version`)
- ✅ Bible version now correctly passed from lesson to devotional generator
- ✅ Edge function `generate-devotional` appends copyright notice for copyrighted versions
- ✅ Duplicate copyright prevention (checks if AI already included it)

### Devotional Progress Indicator
- ✅ Added `useEffect` progress timer matching lesson generator pattern
- ✅ Progress rate based on `lengthId` (short/medium/long)
- ✅ Sets 100% on successful completion

---

## WHITE-LABEL ARCHITECTURE

### Tenant Configuration SSOT
All tenant-specific text is stored in `tenant_config` table and accessed via `useTenant()` hook.

| Category | Database Columns | Frontend Access |
|----------|------------------|-----------------|
| Beta Landing Page | `beta_landing_*` | `tenant.beta.landingPage.*` |
| Beta Form | `beta_form_*` | `tenant.beta.form.*` |
| Beta Dashboard | `beta_dashboard_*` | `tenant.beta.dashboardPrompt.*` |
| Beta Messages | `beta_msg_*` | `tenant.beta.messages.*` |
| Production Landing | `prod_landing_*` | `tenant.production.landingPage.*` |

### Mode Detection
```typescript
import { isBetaMode } from "@/constants/systemSettings";
import { useSystemSettings } from "@/hooks/useSystemSettings";

const { settings } = useSystemSettings();
const isInBetaMode = isBetaMode(settings.current_phase as string);
```

### What White-Label Gets
- Custom branding (logo, colors, name)
- Own user base
- Own subscription management
- Independent beta program capability
- Automatic tier enforcement when they switch to Production
- Full control over all UI text via TenantBrandingPanel

---

## FILE LOCATIONS

### Frontend
```
src/
├── components/
│   ├── BrandingProvider.tsx         # Runtime CSS variable injection (SSOT colors)
│   ├── dashboard/
│   │   ├── EnhanceLessonForm.tsx    # 3-step accordion + section rendering
│   │   ├── LessonExportButtons.tsx  # Export with copyright
│   │   ├── LessonLibrary.tsx        # Devotional launch with bible_version_id
│   │   └── DevotionalLibrary.tsx    # Modal with formatted display
│   ├── landing/
│   │   └── HeroSection.tsx          # Mode-aware, reads from tenant_config
│   ├── BetaFeedbackModal.tsx        # Mode-aware feedback title
│   └── DevotionalGenerator.tsx      # Progress indicator + formatted display
├── config/
│   └── branding.ts                  # SSOT: All brand colors, generates CSS variables
├── constants/
│   ├── tenantConfig.ts              # SSOT for tenant configuration (imports BRANDING)
│   ├── feedbackConfig.ts            # CURRENT_FEEDBACK_MODE
│   ├── systemSettings.ts            # isBetaMode() helper
│   ├── pricingConfig.ts             # TIER_SECTIONS defined here
│   └── [other SSOT files]
├── pages/
│   ├── PricingPage.tsx              # Uses brand-aware Tailwind classes
│   ├── Community.tsx                # Mode-aware CTA section
│   ├── Help.tsx                     # Subscription model FAQ
│   └── Dashboard.tsx                # Settings tab removed
├── index.css                        # Stripped of colors (runtime generated)
├── main.tsx                         # BrandingProvider wrapper
└── utils/
    ├── formatLessonContent.ts       # SSOT: normalizeLegacyContent() exported
    ├── exportToPdf.ts               # Copyright footer
    └── exportToDocx.ts              # Copyright footer
```

### Backend (Edge Functions)
```
supabase/functions/
├── generate-lesson/
│   └── index.ts                     # NEEDS tier enforcement
├── generate-devotional/
│   └── index.ts                     # Bible version copyright attribution
├── _shared/
│   ├── bibleVersions.ts             # Synced from frontend (has copyrightNotice)
│   ├── theologyProfiles.ts
│   ├── ageGroups.ts
│   └── trialConfig.ts
```

---

## DEPLOYMENT COMMANDS
```powershell
# Frontend hot reload (development)
npm run dev

# Build for production
npm run build

# Sync constants to backend
npm run sync-constants

# Deploy edge function
npx supabase functions deploy generate-lesson --no-verify-jwt

# Deploy all edge functions
npx supabase functions deploy
```

---

## NEXT SESSION PRIORITIES

### 1. Fix Organization Invitation Bug
- Investigate why invitations aren't working
- Test invite flow end-to-end

### 2. Implement Tier Enforcement in generate-lesson
**Goal:** Automatic tier-based section filtering when Platform Mode = Production

**Steps:**
1. Add `TIER_SECTIONS` to `_shared/pricingConfig.ts`
2. Modify `generate-lesson/index.ts` to:
   - Check platform mode from `system_settings`
   - Get user's subscription tier
   - Filter prompt to only generate allowed sections
3. Test: Beta mode = 8 sections, Production mode = tier-based

**This enables:** White-label automatic monetization on Production switch

### 3. (Medium Priority) Fix Remaining Fallback Colors
- `src/hooks/useBranding.ts` lines 14-15: Change `#4F46E5` to `BRANDING.colors.primary.DEFAULT`
- `src/components/admin/TenantBrandingPanel.tsx` line 56: Change `#E4572E` placeholder

---

## SESSION HANDOFF NOTES

**For next Claude instance:**
- Lynn is a non-programmer; provide complete, copy-paste ready solutions
- Follow Claude Debugging Protocol: diagnose root cause before proposing fixes
- All solutions must be SSOT compliant (frontend drives backend)
- Test with actual data before declaring success
- Platform is now in Production mode - all user-facing text should avoid "Beta" references
- White-label beta infrastructure is preserved but hidden
- **SSOT Color System is COMPLETE** - Forest Green (#3D5C3D) is live
- If colors appear wrong, use CSS Debugging Protocol in this document
