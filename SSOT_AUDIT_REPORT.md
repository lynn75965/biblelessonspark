# SSOT AUDIT REPORT -- March 20, 2026

## Auditor: Claude Code (automated)
## Scope: All active source files in src/, supabase/functions/, and App.tsx
## Rules Checked: SSOT (Single Source of Truth) + Frontend Drives Backend

---

## VIOLATIONS FOUND

### --- CRITICAL (breaks functionality or creates data mismatch) ---

**1. Backend _shared/pricingConfig.ts out of sync with frontend SSOT**

- File: `supabase/functions/_shared/pricingConfig.ts`
- Line: 201
- Rule: Frontend-Drives-Backend
- Issue: SECTION_NAMES['8'] = 'Student Handout (Standalone)' but frontend SSOT at `src/constants/pricingConfig.ts:201` defines it as 'Group Handout (Standalone)'. The backend mirror has not been updated.
- Recommended Fix: Copy the current frontend `src/constants/pricingConfig.ts` SECTION_NAMES block to the backend `_shared/pricingConfig.ts` mirror.

**2. Backend _shared/pricingConfig.ts PLAN_FEATURES out of sync**

- File: `supabase/functions/_shared/pricingConfig.ts`
- Line: 249
- Rule: Frontend-Drives-Backend
- Issue: PLAN_FEATURES[2].name = 'Student Handout' but frontend SSOT at `src/constants/pricingConfig.ts:249` defines it as 'Group Handout'. Backend mirror is stale.
- Recommended Fix: Sync PLAN_FEATURES array from frontend SSOT to backend mirror.

**3. org-stripe-webhook queries org_tier_config table (Rule #17 violation)**

- File: `supabase/functions/org-stripe-webhook/index.ts`
- Lines: 45, 78
- Rule: Frontend-Drives-Backend
- Issue: Queries `org_tier_config` database table to resolve tier and lesson limits. Per CLAUDE.md Rule #17, tier resolution must use pricingConfig.ts SSOT constants, never database table lookups.
- Recommended Fix: Import `TIER_LESSON_LIMITS` from `_shared/pricingConfig.ts` and use it for limit resolution instead of the database query.

**4. create-org-checkout-session queries pricing_plans table (Rule #17 violation)**

- File: `supabase/functions/create-org-checkout-session/index.ts`
- Lines: 255-261
- Rule: Frontend-Drives-Backend
- Issue: Queries `pricing_plans` database table to look up Stripe price IDs. Rule #17 explicitly bans querying `pricing_plans`.
- Recommended Fix: Remove the database query. Use the hardcoded SSOT fallback values already present at lines 252-253, or better yet, import from `_shared/pricingConfig.ts`.

**5. create-org-checkout-session queries org_tier_config table**

- File: `supabase/functions/create-org-checkout-session/index.ts`
- Line: 84
- Rule: Frontend-Drives-Backend
- Issue: Queries `org_tier_config` database table for tier configuration.
- Recommended Fix: Import tier config from `_shared/pricingConfig.ts` instead.

**6. EnhanceLessonForm treats "admin" as a subscription tier**

- File: `src/components/dashboard/EnhanceLessonForm.tsx`
- Line: 557
- Rule: SSOT
- Issue: `tier === 'admin'` check in `isPaidUser` logic. Per CLAUDE.md and pricingConfig.ts line 125, "admin" is a ROLE (accessControl.ts), NOT a valid SubscriptionTier. This check can never be true since the tier enum is `free|personal|starter|growth|full|enterprise`.
- Recommended Fix: Replace with a role-based check (e.g., `role === 'admin'`) or remove the dead branch entirely.

---

### --- HIGH (drift risk, internal inconsistency) ---

**7. Internal inconsistency in pricingConfig.ts UPGRADE_PROMPTS**

- File: `src/constants/pricingConfig.ts`
- Line: 281
- Rule: SSOT
- Issue: `UPGRADE_PROMPTS.sections.freeIncluded` lists 'Student Handout', but `SECTION_NAMES['8']` at line 201 in the same file defines it as 'Group Handout (Standalone)'. Internal self-contradiction within the SSOT file.
- Recommended Fix: Change line 281 from 'Student Handout' to 'Group Handout' to match SECTION_NAMES.

**8. Internal inconsistency in pricingConfig.ts comment**

- File: `src/constants/pricingConfig.ts`
- Line: 169
- Rule: SSOT
- Issue: Comment reads "Section 8: Student Handout (Standalone)" but SECTION_NAMES at line 201 defines it as "Group Handout (Standalone)". Stale comment.
- Recommended Fix: Update comment to match SECTION_NAMES.

**9. lessonStructure.ts hardcodes "Student Handout" independently**

- File: `src/constants/lessonStructure.ts`
- Lines: 155, 157, 168
- Rule: SSOT
- Issue: `section8Title`, `section8StandaloneTitle`, and the `getSection8StandaloneTitle()` fallback all hardcode "Student Handout" rather than importing from pricingConfig.ts SECTION_NAMES. Note: lessonStructure.ts is the SSOT for export formatting (per SSOT File Map), so it has legitimate ownership of these values. However, the naming conflicts with SECTION_NAMES['8'] = "Group Handout (Standalone)".
- Recommended Fix: Clarify naming convention. For individual lesson exports, "Student Handout" is correct (teachers hand it to students). For series-level exports, "Group Handout" is correct (per Rule #12). Document this distinction explicitly in both files.

**10. Hardcoded Stripe price IDs in create-org-checkout-session**

- File: `supabase/functions/create-org-checkout-session/index.ts`
- Lines: 252-253
- Rule: Frontend-Drives-Backend
- Issue: `PERSONAL_PRICE_MONTHLY` and `PERSONAL_PRICE_ANNUAL` are hardcoded as local constants instead of imported from `_shared/pricingConfig.ts` where they are already defined.
- Recommended Fix: Import from `_shared/pricingConfig.ts` STRIPE_INDIVIDUAL constants.

**11. App.tsx route paths not imported from routes.ts (known violation)**

- File: `src/App.tsx`
- Lines: 55-149 (all route declarations)
- Rule: SSOT
- Issue: Every `<Route path="...">` uses hardcoded string literals instead of importing from `src/constants/routes.ts`. Already documented in CLAUDE.md Rule #3 as a known SSOT violation requiring future refactor.
- Recommended Fix: Import ROUTES object and use `path={ROUTES.HOME}`, `path={ROUTES.AUTH}`, etc. (deferred -- manual verification required until refactored)

---

### --- MEDIUM (hardcoded values that should reference SSOT) ---

**12. Hardcoded route paths across 15+ components**

- Files (sample):
  - `src/components/landing/PricingSection.tsx` lines 37, 39, 62, 250
  - `src/components/dashboard/UsageDisplay.tsx` line 134
  - `src/components/ProtectedRoute.tsx` line 17
  - `src/components/setup/SetupChecklist.tsx` lines 62, 96, 107, 164, 192
  - `src/pages/Admin.tsx` lines 64, 76
  - `src/pages/Account.tsx` line 17
  - `src/pages/OrgSuccess.tsx` lines 177, 209, 377
  - `src/pages/OrgSetup.tsx` lines 199, 310
  - `src/pages/OrgLanding.tsx` lines 136, 163
  - `src/pages/PricingPage.tsx` lines 50, 56
  - `src/pages/Settings.tsx` lines 51, 60
  - `src/pages/Index.tsx` line 44
  - `src/pages/Auth.tsx` line 1023
- Rule: SSOT
- Issue: `navigate('/auth')`, `navigate('/pricing')`, `navigate('/org-manager')`, etc. use hardcoded path strings. 27 files import from `routes.ts`, but many navigation calls still use raw strings.
- Recommended Fix: Replace all `navigate('/path')` calls with `navigate(ROUTES.PATH)` from routes.ts. Low urgency since route paths rarely change, but creates drift risk.

**13. Hardcoded fallback lesson limits in hooks**

- File: `src/hooks/useSubscription.tsx`
- Lines: 39, 72
- Rule: SSOT
- Issue: `lessonsLimit: 5` hardcoded as default/fallback. Matches current free-tier limit, but should import `TIER_LESSON_LIMITS.free` from pricingConfig.ts.
- Recommended Fix: `import { TIER_LESSON_LIMITS } from '@/constants/pricingConfig'` and use `TIER_LESSON_LIMITS.free` as fallback.

**14. Hardcoded fallback lesson limit in useRateLimit**

- File: `src/hooks/useRateLimit.ts`
- Line: 18
- Rule: SSOT
- Issue: `lessonsAllowed: 5` hardcoded as default. Same as #13.
- Recommended Fix: Import from TIER_LESSON_LIMITS.free.

**15. "Student Handout" in bookletConfig.ts, emailDeliveryConfig.ts, featureFlags.ts**

- Files:
  - `src/constants/bookletConfig.ts` lines 331, 338, 356, 357, 384
  - `src/constants/emailDeliveryConfig.ts` lines 63-64
  - `src/constants/featureFlags.ts` lines 43-44
  - `src/constants/lessonShapeProfiles.ts` line 96
- Rule: SSOT
- Issue: Multiple config files independently define "Student Handout" labels. These are user-facing labels for individual lesson contexts (correct per current convention), but they don't import from a single source. If the terminology ever changes, each file must be updated independently.
- Recommended Fix: Consider extracting a shared constant for the individual-lesson Section 8 label. Low priority since the distinction between "Student Handout" (individual) and "Group Handout" (series) is intentional.

---

### --- LOW (documentation/copy drift) ---

**16. Help.tsx hardcodes "Student Handout" in FAQ copy**

- File: `src/pages/Help.tsx`
- Line: 132
- Rule: SSOT
- Issue: FAQ answer hardcodes "Student Handout" as section name. Should ideally reference SECTION_NAMES, but this is user-facing copy describing the individual lesson section (correct term for individual lessons).
- Recommended Fix: No code change needed, but note that if section naming changes, this copy must be manually updated.

**17. Docs.tsx hardcodes section name "Student Handout"**

- File: `src/pages/Docs.tsx`
- Line: 79
- Rule: SSOT
- Issue: Documentation hardcodes "Student Handout" as section name.
- Recommended Fix: Same as #16.

**18. Training.tsx hardcodes "Student Handout" in tutorial title**

- File: `src/pages/Training.tsx`
- Line: 116
- Rule: SSOT
- Issue: Tutorial step title hardcodes "Use the Student Handout".
- Recommended Fix: Same as #16.

**19. EnhanceLessonForm hardcodes "Student Teaser" label**

- File: `src/components/dashboard/EnhanceLessonForm.tsx`
- Lines: 2063, 2068
- Rule: SSOT
- Issue: "Student Teaser (Pre-Lesson)" and "Share with students" hardcoded in JSX. The label "Student Teaser" also appears in `featureFlags.ts:43` -- neither imports from a shared SSOT constant.
- Recommended Fix: Low priority. The "Student Teaser" feature name is consistent across its two locations. Could be extracted to a feature label constant if the naming might change.

---

## CLEAN AREAS

- **Tier names (SubscriptionTier enum):** All active components import from pricingConfig.ts. No hardcoded tier string literals found outside SSOT definitions.
- **Pricing amounts ($9/$90/$15/$35/$60):** All pricing display values import from PRICING_DISPLAY in pricingConfig.ts. Zero hardcoded dollar amounts in components.
- **TIER_LESSON_LIMITS:** Core business logic correctly imports limits. Only fallback defaults are hardcoded (violations #13-14).
- **Branding "BibleLessonSpark":** Fully centralized in branding.ts. Zero instances of "LessonSparkUSA" in active src/ files.
- **Theology profiles:** All 10 Baptist traditions centralized in theologyProfiles.ts with no duplication.
- **Age groups:** Centralized in ageGroups.ts, imported correctly throughout.
- **Audience terminology triad:** `resolveExportTerminology()` in seriesExportConfig.ts properly used for series exports.
- **Series export config:** Color palettes, margins, fonts all centralized in seriesExportConfig.ts.
- **stripe-webhook (individual):** Correctly imports `resolveTierFromPriceId` and `TIER_LESSON_LIMITS` from _shared/pricingConfig.ts. Zero database queries for tier resolution. This is the model for how org-stripe-webhook should work.
- **generate-lesson edge function:** Correctly imports trial config from _shared/trialConfig.ts.
- **_shared/subscriptionCheck.ts:** Correctly imports TIER_SECTIONS from _shared/pricingConfig.ts.
- **Feature flags:** Centralized in featureFlags.ts with `hasFeatureAccess()` helper.
- **Validation rules:** Centralized in validation.ts, no duplication found.
- **Access control / roles:** Centralized in accessControl.ts, no duplication found.
- **Bible version handling:** Lowercase enforcement working correctly per Rule #15.

---

## SUMMARY

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 6     | Backend mirror out of sync (2), banned DB queries (3), dead "admin" tier check (1) |
| High     | 5     | Internal naming inconsistency (3), hardcoded Stripe IDs (1), App.tsx routes (1, known) |
| Medium   | 4     | Hardcoded route paths (1 pattern, 15+ files), hardcoded fallback limits (2), scattered "Student Handout" labels (1 pattern) |
| Low      | 4     | Documentation/copy using hardcoded section names |
| **Total**| **19**|  |

### Priority Recommendations

1. **Immediate:** Sync `_shared/pricingConfig.ts` with frontend SSOT (fixes #1, #2)
2. **Immediate:** Refactor `org-stripe-webhook` and `create-org-checkout-session` to stop querying banned database tables (fixes #3, #4, #5, #10)
3. **Soon:** Fix `isPaidUser` admin check in EnhanceLessonForm.tsx (fix #6)
4. **Soon:** Resolve "Student Handout" vs "Group Handout" naming within pricingConfig.ts itself (fixes #7, #8)
5. **Deferred:** App.tsx route refactor (known debt, documented in CLAUDE.md Rule #3)
6. **Deferred:** Replace hardcoded navigate() paths with ROUTES constants across components
