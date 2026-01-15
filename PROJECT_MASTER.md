# PROJECT_MASTER.md
## BibleLessonSpark - Master Project Documentation
**Last Updated:** January 15, 2026 (Phase 20.7 - UTF-8 Encoding Fix + UI Symbols SSOT Complete)

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
| `src/constants/metricsViewerConfig.ts` | Chart colors for analytics (SSOT compliant) |
| `src/constants/uiSymbols.ts` | **UI symbols constant** - Clean UTF-8 symbols (NEW Phase 20.7) |
| `src/config/branding.ts` | **SSOT for ALL colors** - HEX definitions, generates CSS variables |
| `src/config/brand-values.json` | **SSOT for colors/typography** - JSON source for sync script |
| `src/components/BrandingProvider.tsx` | Runtime CSS variable injection from branding.ts |
| `src/utils/formatLessonContent.ts` | SSOT for lesson content HTML formatting |
| `scripts/sync-branding-to-db.cjs` | **Syncs branding from frontend SSOT → database** |

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

### Database Branding Sync (Phase 20.6)
```
src/config/brand-values.json (SSOT colors/typography)
        ↓
scripts/sync-branding-to-db.cjs
        ↓ npm run sync-branding
        ↓
Database: branding_config table
        ↓
Edge functions: getBranding() helper
        ↓
Emails show "BibleLessonSpark" branding
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

### Full Codebase Audit Results (Jan 15, 2026)
| File | Status | Notes |
|------|--------|-------|
| `branding.ts` | ✅ SSOT Source | All colors defined here |
| `tenantConfig.ts` | ✅ Compliant | Imports from BRANDING |
| `BrandingProvider.tsx` | ✅ Compliant | Generates from branding.ts |
| `tailwind.config.ts` | ✅ Compliant | References CSS variables only |
| `index.css` | ✅ Compliant | No hardcoded colors |
| `useBranding.ts` | ✅ Compliant | Imports from BRANDING |
| `TenantBrandingPanel.tsx` | ✅ Compliant | Placeholders reference BRANDING |
| `DebugPanel.tsx` | ✅ Compliant | Uses BRANDING.colors.accent.dark |
| `BetaAnalyticsDashboard.tsx` | ✅ Compliant | Uses metricsViewerConfig CHART_COLORS |
| `EnrollmentAnalyticsPanel.tsx` | ✅ Compliant | Uses metricsViewerConfig CHART_COLORS |
| `SystemAnalyticsDashboard.tsx` | ✅ Compliant | Uses semantic Tailwind classes |
| `OrgAnalyticsPanel.tsx` | ✅ Compliant | Uses semantic Tailwind classes |
| `FeedbackQuestionsManager.tsx` | ⚠️ Safe | Instructional example text only |
| `LessonExportButtons.tsx` | ⚠️ Special | Print template (may need hardcoded) |

### Color Compliance Summary
| Metric | Count |
|--------|-------|
| Starting violations (Jan 13) | 151 |
| Remaining violations | 0 |
| **Total fixed** | **151 (100%)** |

### Database Color Cleanup (Jan 15, 2026)
| Table | Issue | Fix |
|-------|-------|-----|
| `tenant_config` | Had salmon `#E4572E` | Updated to `#3D5C3D` (Forest Green) |
| `branding_config` | Had old LessonSpark USA values | Synced via `npm run sync-branding` |

### To Rebrand Entire App
Edit ONLY `src/config/branding.ts` and `src/config/brand-values.json`:
```typescript
colors: {
  primary: { DEFAULT: "#3D5C3D" },   // Change this → all primary elements update
  secondary: { DEFAULT: "#D4A74B" }, // Change this → all secondary elements update
}
```
Then run: `npm run sync-branding` to update database.

---

## SSOT UI SYMBOLS SYSTEM (Phase 20.7 - COMPLETE ✅)

### Purpose
Prevents UTF-8 encoding corruption that displays symbols like `â€¢`, `â€"`, `âœ"` instead of `•`, `—`, `✓`.

### Architecture
```
src/constants/uiSymbols.ts (FRONTEND MASTER)
        ↓ npm run sync-constants
supabase/functions/_shared/uiSymbols.ts (BACKEND MIRROR)
```

### Available Symbols
| Constant | Symbol | Usage |
|----------|--------|-------|
| `UI_SYMBOLS.BULLET` | • | Lists, separators |
| `UI_SYMBOLS.EM_DASH` | — | "None" options, ranges |
| `UI_SYMBOLS.ELLIPSIS` | … | Loading states |
| `UI_SYMBOLS.CHECK` | ✓ | Success indicators |
| `UI_SYMBOLS.STAR` | ★ | Ratings, favorites |
| `UI_SYMBOLS.SPARKLES` | ✨ | AI-generated content |

### Helper Functions
```typescript
import { UI_SYMBOLS, joinWithBullet, formatNoneOption, formatLoading } from '@/constants/uiSymbols';

joinWithBullet(['A', 'B', 'C'])  // "A • B • C"
formatNoneOption('None')         // "— None —"
formatLoading('Processing')      // "Processing…"
```

### Files Updated (Phase 20.7)
| File | Symbols Used |
|------|--------------|
| `GuardrailViolationsPanel.tsx` | `UI_SYMBOLS.BULLET` |
| `TeacherCustomization.tsx` | `UI_SYMBOLS.STAR`, `formatNoneOption()` |
| `DevotionalGenerator.tsx` | `UI_SYMBOLS.BULLET` |
| `ParableGenerator.tsx` | `UI_SYMBOLS.BULLET`, `UI_SYMBOLS.EM_DASH` |
| `HeroSection.tsx` | `joinWithBullet()` |
| `PricingSection.tsx` | `formatLoading()` |
| `metricsViewerConfig.ts` | `UI_SYMBOLS.EM_DASH` |
| `Parables.tsx` | `UI_SYMBOLS.SPARKLES`, `UI_SYMBOLS.EM_DASH` |
| `BibleVersionSelector.tsx` | Direct symbols (static content) |
| `generate-lesson/index.ts` | Direct symbols (backend prompts) |

---

## TIER ENFORCEMENT SYSTEM (COMPLETE ✅ - ACTIVE)

### Status: PRODUCTION MODE - TIER ENFORCEMENT ACTIVE

Verified January 15, 2026: `system_settings.current_phase = 'production'`

### How It Works
```
User generates lesson
        ↓
generate-lesson edge function
        ↓
Check system_settings.current_phase
        ↓
IF 'production':
    Get user's subscription_tier
    Filter sections by TIER_SECTIONS[tier]
        ↓
IF 'beta':
    All users get 8 sections
```

### Tier Sections (from pricingConfig.ts)
```typescript
export const TIER_SECTIONS = {
  free: ['1', '5', '8'],           // 3 sections
  personal: ['1', '2', '3', '4', '5', '6', '7', '8'],  // All 8
  admin: ['1', '2', '3', '4', '5', '6', '7', '8'],
} as const;
```

### Free Tier Sections
| Section | Name | Purpose |
|---------|------|---------|
| 1 | Lens + Lesson Overview | Theological framework |
| 5 | Main Teaching Content | Teacher transcript |
| 8 | Student Handout | Takeaway for students |

### Behavior Matrix
| Platform Mode | User Tier | Sections Generated |
|---------------|-----------|-------------------|
| Private Beta | Free | 8 (all) |
| Private Beta | Personal | 8 (all) |
| Public Beta | Free | 8 (all) |
| Public Beta | Personal | 8 (all) |
| **Production** | **Free** | **3 (1, 5, 8)** |
| **Production** | **Personal** | **8 (all)** |

### White-Label Automatic Monetization
When any tenant switches from Beta → Production in Admin Panel:
- Tier enforcement activates automatically
- No code deployment required
- Free users immediately see 3 sections
- Paid users continue to see 8 sections

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
| **Tier Enforcement** | **ACTIVE** |

### What Users See (Production Mode)
| Element | Value |
|---------|-------|
| Landing page badge | "Personalized Bible Studies Built In 3 Minutes" |
| Landing page CTA button | "Get Started" |
| Landing page trust text | "Trusted by Baptist teachers across the country" |
| "Join Beta" button | Hidden |
| Feedback modal title | "Share Your Feedback" |
| Community page CTA | "Ready to Transform Your Lesson Prep?" |

### What's Working ✅
- Accordion-style 3-step lesson creation
- Tier-based section generation (3 for free, 8 for personal)
- Bible version copyright attribution in all exports (PDF, DOCX, Copy, Print)
- Legacy lesson formatting normalization (## headers → **bold:**)
- DevotionalSpark with progress indicator
- Parable Generator
- Organization management with invitations
- Admin Panel with analytics dashboards
- White-label infrastructure (preserved but hidden)
- SSOT Color System (100% complete)
- SSOT Email Branding (BibleLessonSpark emails)
- SSOT UI Symbols (UTF-8 encoding fixed)
- Trial system for free users

---

## JANUARY 20, 2026 LAUNCH STATUS

### ✅ COMPLETE - Ready for Launch
| Item | Status | Notes |
|------|--------|-------|
| SSOT Color System | ✅ 100% | Forest Green (#3D5C3D) everywhere |
| SSOT Email Branding | ✅ Complete | BibleLessonSpark emails working |
| SSOT UI Symbols | ✅ Complete | UTF-8 encoding fixed |
| Tier Enforcement | ✅ Active | Free: 3 sections, Personal: 8 sections |
| Organization Invitations | ✅ Working | Forest Green button, correct branding |
| Platform Mode | ✅ Production | No "Beta" references in UI |
| Analytics Dashboards | ✅ SSOT Compliant | CHART_COLORS from metricsViewerConfig |

### 🟡 CONFIGURATION ITEMS (Pre-Launch)
| Item | Action Required |
|------|-----------------|
| **Stripe Live Mode** | Switch test keys to live keys in Supabase secrets |
| **Resend Domain** | Verify `biblelessonspark.com` in Resend dashboard |
| **Show Pricing** | Set to `true` in Admin Panel when ready to display pricing |

### How to Complete Configuration Items

**Stripe Live Mode:**
1. Go to Supabase Dashboard → Settings → Edge Functions → Secrets
2. Update `STRIPE_SECRET_KEY` from `sk_test_...` to `sk_live_...`
3. Update `STRIPE_WEBHOOK_SECRET` to live webhook secret

**Resend Domain:**
1. Go to Resend Dashboard → Domains
2. Add `biblelessonspark.com`
3. Add DNS records to your domain registrar
4. Wait for verification (can take up to 48 hours)

**Show Pricing:**
1. Go to Admin Panel → System Settings
2. Set `show_pricing` to `true`

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
│   │   ├── DevotionalLibrary.tsx    # Modal with formatted display
│   │   ├── TeacherCustomization.tsx # Uses UI_SYMBOLS for profile selector
│   │   └── DebugPanel.tsx           # Job tracker overlay (SSOT compliant)
│   ├── landing/
│   │   ├── HeroSection.tsx          # Mode-aware, uses joinWithBullet()
│   │   └── PricingSection.tsx       # Uses formatLoading()
│   ├── admin/
│   │   ├── BetaAnalyticsDashboard.tsx   # Charts use CHART_COLORS from SSOT
│   │   ├── EnrollmentAnalyticsPanel.tsx # Charts use CHART_COLORS from SSOT
│   │   ├── SystemAnalyticsDashboard.tsx # Semantic Tailwind classes
│   │   ├── GuardrailViolationsPanel.tsx # Uses UI_SYMBOLS.BULLET
│   │   └── TenantBrandingPanel.tsx      # Placeholders reference BRANDING
│   ├── org/
│   │   └── OrgAnalyticsPanel.tsx        # Semantic Tailwind classes
│   ├── BetaFeedbackModal.tsx        # Mode-aware feedback title
│   ├── DevotionalGenerator.tsx      # Progress indicator, UI_SYMBOLS.BULLET
│   └── ParableGenerator.tsx         # UI_SYMBOLS.BULLET, UI_SYMBOLS.EM_DASH
├── config/
│   ├── branding.ts                  # SSOT: All brand colors, generates CSS variables
│   └── brand-values.json            # SSOT: Colors/typography JSON source
├── constants/
│   ├── uiSymbols.ts                 # SSOT: UI symbols constant (NEW Phase 20.7)
│   ├── tenantConfig.ts              # SSOT for tenant configuration (imports BRANDING)
│   ├── metricsViewerConfig.ts       # SSOT for chart colors (imports BRANDING)
│   ├── feedbackConfig.ts            # CURRENT_FEEDBACK_MODE
│   ├── systemSettings.ts            # isBetaMode() helper
│   ├── pricingConfig.ts             # TIER_SECTIONS defined here
│   └── [other SSOT files]
├── pages/
│   ├── PricingPage.tsx              # Uses brand-aware Tailwind classes
│   ├── Community.tsx                # Mode-aware CTA section
│   ├── Parables.tsx                 # Uses UI_SYMBOLS.SPARKLES, UI_SYMBOLS.EM_DASH
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
│   └── index.ts                     # Tier enforcement ACTIVE
├── generate-devotional/
│   └── index.ts                     # Bible version copyright attribution
├── send-invite/
│   ├── index.ts                     # Uses SSOT branding helpers
│   └── _templates/
│       └── invite-email.tsx         # Accepts appName prop, Forest Green button
├── _shared/
│   ├── branding.ts                  # SSOT: getBranding(), getEmailFrom(), getEmailSubject()
│   ├── routes.ts                    # URL builders (buildInviteUrl)
│   ├── uiSymbols.ts                 # SSOT: Backend mirror of UI symbols (NEW Phase 20.7)
│   ├── bibleVersions.ts             # Synced from frontend (has copyrightNotice)
│   ├── theologyProfiles.ts
│   ├── ageGroups.ts
│   ├── pricingConfig.ts             # TIER_SECTIONS for tier enforcement
│   └── trialConfig.ts
```

### Scripts
```
scripts/
├── sync-constants.cjs               # Syncs src/constants/ → supabase/functions/_shared/
├── sync-branding-to-db.cjs          # Syncs branding from frontend SSOT → database
└── generate-css.cjs                 # Generates CSS from brand-values.json
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

# Sync branding to database
npm run sync-branding

# Deploy edge function
npx supabase functions deploy generate-lesson --no-verify-jwt

# Deploy all edge functions
npx supabase functions deploy

# Git commit and push (triggers Netlify deploy)
git add -A
git commit -m "Description of changes"
git push
```

---

## COMPLETED PHASES

### Phase 20.7 (Jan 15, 2026) - UTF-8 Encoding Fix + UI Symbols SSOT
- Created `src/constants/uiSymbols.ts` as SSOT for all UI symbols
- Created `supabase/functions/_shared/uiSymbols.ts` backend mirror
- Fixed 18 encoding corruptions across 10 files
- Replaced garbled characters (`â€¢`, `â€"`, `âœ"`) with clean symbols (`•`, `—`, `✓`)
- Added helper functions: `joinWithBullet()`, `formatNoneOption()`, `formatLoading()`

### Phase 20.6 (Jan 15, 2026) - SSOT Email Branding & Database Sync
- Fixed organization invitation emails showing "LessonSpark USA" instead of "BibleLessonSpark"
- Created `npm run sync-branding` command
- Created `scripts/sync-branding-to-db.cjs`
- Updated `_shared/branding.ts` with getBranding(), getEmailFrom(), getEmailSubject() helpers
- Updated `send-invite/index.ts` to use SSOT branding
- Updated `invite-email.tsx` to accept appName prop
- Removed salmon `#E4572E` from database `tenant_config`
- Synced branding_config table via npm run sync-branding
- Verified tier enforcement is ACTIVE (current_phase = production)

### Phase 20.5 (Jan 15, 2026) - SSOT Color Compliance Cleanup
- Fixed 151 hardcoded color violations across codebase
- Cleaned `BetaAnalyticsDashboard.tsx` (22 violations)
- Cleaned `EnrollmentAnalyticsPanel.tsx` (9 violations)
- Cleaned `SystemAnalyticsDashboard.tsx` (7 violations)
- Cleaned `OrgAnalyticsPanel.tsx` (11 violations)
- Cleaned `TenantBrandingPanel.tsx` (2 violations)
- Cleaned `DebugPanel.tsx` (1 violation)
- Achieved 100% SSOT color compliance

### Phase 20.4 (Jan 14, 2026) - SSOT Architecture Consolidation
- Created `src/config/brand-values.json` as single source of truth
- Updated `scripts/generate-css.cjs` to import from brand-values.json
- Updated `src/config/branding.ts` to import from brand-values.json
- Fixed duplicate `tenantConfig.ts` causing import conflicts
- Changed font from Inter to Poppins
- Reduced violations from 151 to 106 (30% improvement)

### Phase 20.3 (Jan 10-14, 2026) - Production Mode & Domain Launch
- Switched platform from Beta to Production mode
- Launched biblelessonspark.com domain
- Connected Netlify deployment
- Removed "Beta" references from UI
- Preserved white-label beta infrastructure (hidden)

---

## SESSION HANDOFF NOTES

**For next Claude instance:**
- Lynn is a non-programmer; provide complete, copy-paste ready solutions
- Follow Claude Debugging Protocol: diagnose root cause before proposing fixes
- All solutions must be SSOT compliant (frontend drives backend)
- Test with actual data before declaring success
- Platform is now in Production mode - all user-facing text should avoid "Beta" references
- White-label beta infrastructure is preserved but hidden
- **SSOT Color System is 100% COMPLETE** - Forest Green (#3D5C3D) is live
- **SSOT Email Branding is COMPLETE** - BibleLessonSpark emails working
- **SSOT UI Symbols is COMPLETE** - UTF-8 encoding issues fixed
- **Tier Enforcement is ACTIVE** - Free users get 3 sections, Personal get 8
- **All analytics dashboards use CHART_COLORS from metricsViewerConfig.ts**
- If colors appear wrong, use CSS Debugging Protocol in this document
- **New command:** `npm run sync-branding` syncs frontend branding to database
- **New SSOT file:** `src/constants/uiSymbols.ts` for clean UI symbols

---

## REMAINING FOR LAUNCH (Configuration Only)

| Item | Priority | Action |
|------|----------|--------|
| Stripe Live Mode | HIGH | Switch test keys to live in Supabase secrets |
| Resend Domain | HIGH | Verify `biblelessonspark.com` in Resend dashboard |
| Show Pricing | MEDIUM | Set to `true` in Admin Panel when ready |

**Note:** All code-related launch items are COMPLETE. Only configuration changes remain.
