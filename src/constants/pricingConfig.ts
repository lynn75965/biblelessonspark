// ============================================================
// BIBLELESSONSPARK - PRICING CONFIGURATION (SSOT)
// Location: src/constants/pricingConfig.ts
//
// ARCHITECTURE PRINCIPLES:
// - Frontend drives backend: these constants are authoritative
// - Backend (Supabase) validates against values defined here
// - SSOT: all Stripe IDs, tier definitions, and section mappings
//   live here and are imported everywhere \u2014 never duplicated
//
// STRIPE CATALOG (complete as of 2026-03-24):
// - 1 Individual subscription: Personal (defined here)
// - 5 Organization subscriptions: see orgPricingConfig.ts (sole authority)
// - 3 Lesson Packs (one-time): Small, Medium, Large
// - 2 Onboarding options (one-time): Guided Setup, White Glove
//
// Mirror: supabase/functions/_shared/pricingConfig.ts
// DO NOT EDIT MIRROR DIRECTLY
//
// CHANGELOG:
//   2026-03-02: Added 'Series Curriculum Export' to PLAN_FEATURES
//
// Last Updated: 2026-03-24
// ============================================================

import { getOrgTierByStripePriceId } from './orgPricingConfig';
// Section-shape SSOT lives in lessonTiers.ts. The section-number constants
// below are DERIVED from it -- the literal numbers live in exactly one place.
import { FULL_SECTIONS, SHORT_SECTIONS } from './lessonTiers';

// ============================================================
// STRIPE IDS \u2014 INDIVIDUAL SUBSCRIPTION
// ============================================================

export const STRIPE_INDIVIDUAL = {
  personal: {
    productId: 'prod_TJF2M7plp379IV',
    prices: {
      monthly: 'price_1Sj3bRI4GLksxBfVfGVrgZXP',
      annual:  'price_1SMpypI4GLksxBfV6tytRIAO',
    },
    lessonsPerPeriod: 20,
  },
} as const;

// ============================================================
// ORGANIZATION SUBSCRIPTIONS -- SOLE AUTHORITY: orgPricingConfig.ts
// STRIPE_ORG block removed 2026-03-24 (Phase A11).
// All org tier data (Stripe IDs, lesson limits, display names)
// now lives exclusively in orgPricingConfig.ts.
// ============================================================

// ============================================================
// STRIPE IDS \u2014 LESSON PACKS (ONE-TIME PURCHASES)
//
// BACKEND-ONLY SOURCE. These priceCents/priceId values exist for
// Stripe webhook resolution and future backend price lookups.
// The UI does NOT consume this object. The single UI-consumed source
// for lesson packs (display name, dollar price, lesson count) is
// LESSON_PACKS in src/constants/orgPricingConfig.ts. Keep both in sync
// (same pack_type keys: small | medium | large) to prevent re-drift.
// ============================================================

export const STRIPE_LESSON_PACKS = {
  small: {
    productId: 'prod_Tt9VeUiXCse3Vf',
    priceId:   'price_1SvNC3I4GLksxBfVzzp79bQP',
    lessons:   10,
    priceCents: 1500,
  },
  medium: {
    productId: 'prod_Tt9c9VetZN2qmn',
    priceId:   'price_1SvNImI4GLksxBfVl7fegaD8',
    lessons:   25,
    priceCents: 3500,
  },
  large: {
    productId: 'prod_Tt9fZtm3WFiKlh',
    priceId:   'price_1SvNM4I4GLksxBfVhC8Gt23X',
    lessons:   50,
    priceCents: 6000,
  },
} as const;

// ============================================================
// STRIPE IDS \u2014 ONBOARDING OPTIONS (ONE-TIME PURCHASES)
// ============================================================

export const STRIPE_ONBOARDING = {
  guidedSetup: {
    productId:  'prod_Tt9iETbbQosHiR',
    priceId:    'price_1SvNOjI4GLksxBfVddpRLRoS',
    priceCents: 9900,
  },
  whiteGlove: {
    productId:  'prod_Tt9lvUjuO8WJXK',
    priceId:    'price_1SvNRyI4GLksxBfVQCm17bXq',
    priceCents: 24900,
  },
} as const;

// ============================================================
// SUBSCRIPTION TIER TYPE
// Matches database enum exactly \u2014 frontend is authoritative
// NOTE: 'admin' is a ROLE (see accessControl.ts), not a tier
// ============================================================

export type SubscriptionTier =
  | 'free'
  | 'personal'
  | 'starter'
  | 'growth'
  | 'full'
  | 'enterprise';

export type BillingInterval = 'month' | 'year';
export const DEFAULT_BILLING_INTERVAL: BillingInterval = 'year';

export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'trialing'
  | 'incomplete';

// ============================================================
// TIER LESSON LIMITS
// Source of truth for how many lessons each tier receives
// per rolling 30-day period
// ============================================================

export const TIER_LESSON_LIMITS: Record<SubscriptionTier, number> = {
  free:       5,
  personal:   20,
  starter:    25,
  growth:     60,
  full:       120,
  enterprise: 250,
} as const;

// ============================================================
// SECTION ARRAYS \u2014 SINGLE SOURCE OF TRUTH
// These arrays define which lesson sections each tier receives.
// Import these constants \u2014 NEVER hardcode section numbers.
//
// FREE TIER SECTIONS: 1, 5, 8
//   Section 1: Lens + Lesson Overview
//   Section 5: Main Teaching Content (Teacher Transcript)
//   Section 8: Group Handout (Standalone)
//
// ALL PAID TIERS: all 8 sections
// ============================================================

// DERIVED FROM lessonTiers.ts (canonical section-shape SSOT).
// Re-exported under the SAME names and shapes that every consumer already
// imports -- only the source of the numbers moved. Free -> SHORT shape,
// all paid tiers -> FULL shape.
export const FREE_TIER_SECTION_NUMBERS = SHORT_SECTIONS;
export const FULL_TIER_SECTION_NUMBERS = FULL_SECTIONS;

const FULL_SECTION_STRINGS  = FULL_SECTIONS.map(String);
const SHORT_SECTION_STRINGS = SHORT_SECTIONS.map(String);

export const TIER_SECTIONS: Record<SubscriptionTier, string[]> = {
  free:       SHORT_SECTION_STRINGS,
  personal:   FULL_SECTION_STRINGS,
  starter:    FULL_SECTION_STRINGS,
  growth:     FULL_SECTION_STRINGS,
  full:       FULL_SECTION_STRINGS,
  enterprise: FULL_SECTION_STRINGS,
};

// ============================================================
// SECTION NAMES (SSOT for display)
// ============================================================

export const SECTION_NAMES: Record<string, string> = {
  '1': 'Lens + Lesson Overview',
  '2': 'Learning Objectives + Key Scriptures',
  '3': 'Theological Background (Deep-Dive)',
  '4': 'Opening Activities',
  '5': 'Main Teaching Content (Teacher Transcript)',
  '6': 'Interactive Activities',
  '7': 'Discussion & Assessment',
  '8': 'Group Handout (Standalone)',
} as const;

// ============================================================
// PRICING DISPLAY TEXT (SSOT for UI)
// ============================================================

export const PRICING_DISPLAY = {
  free: {
    displayText: 'Free',
    sectionsIncluded: 3,
    lessonsPerMonth: TIER_LESSON_LIMITS.free,
    complimentaryFullLessons: 3,
  },
  personal: {
    monthly: {
      amount: 9,
      interval: 'month' as const,
      displayText: '$9/month',
    },
    annual: {
      amount: 90,
      monthlyEquivalent: 7.50,
      interval: 'year' as const,
      displayText: '$90/year',
      displayTextWithSavings: '$7.50/month (billed $90/year)',
    },
    ctaShort: '$9/mo or $90/yr',
    ctaFull: '$9 monthly or $7.50 monthly (paid $90 yearly)',
    displayName: 'Personal Plan',
  },
} as const;

// ============================================================
// FEATURE DEFINITIONS FOR PLAN COMPARISON DISPLAY
// CHANGELOG 2026-03-02: Added 'Series Curriculum Export'
// ============================================================

export interface PlanFeature {
  name: string;
  includedInFree: boolean;
  includedInPaid: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { name: 'Lens + Lesson Overview',              includedInFree: true,  includedInPaid: true  },
  { name: 'Main Teaching Content',               includedInFree: true,  includedInPaid: true  },
  { name: 'Group Handout',                     includedInFree: true,  includedInPaid: true  },
  { name: 'Learning Objectives + Key Scriptures',includedInFree: false, includedInPaid: true  },
  { name: 'Theological Background (Deep-Dive)',  includedInFree: false, includedInPaid: true  },
  { name: 'Opening Activities',                  includedInFree: false, includedInPaid: true  },
  { name: 'Interactive Activities',              includedInFree: false, includedInPaid: true  },
  { name: 'Discussion & Assessment',             includedInFree: false, includedInPaid: true  },
  { name: 'Modern Parables Generator',           includedInFree: true,  includedInPaid: true  },
  { name: 'PDF/DOCX Export',                     includedInFree: true,  includedInPaid: true  },
  { name: 'All Age Groups',                      includedInFree: true,  includedInPaid: true  },
  { name: 'All Theology Profiles',               includedInFree: true,  includedInPaid: true  },
  { name: 'All Bible Versions',                  includedInFree: true,  includedInPaid: true  },
  { name: 'Series Curriculum Export',            includedInFree: false, includedInPaid: true  },
] as const;

// ============================================================
// UPGRADE PROMPT COPY (SSOT for UI messaging)
// ============================================================

export const UPGRADE_PROMPTS = {
  limitReached: {
    title: "You've reached your monthly limit",
    description: "Upgrade for more lessons and complete 8-section lessons.",
  },
  featureTeaser: {
    title: "Ready to Do Even More for Your Class?",
    description: "You have already taken the first step \u2014 preparing a lesson grounded in Scripture. The Personal Plan gives you everything that comes next: the theological depth your class deserves, activities that move truth from heard to experienced, a DevotionalSpark follow-up that carries the passage into their week, and the tools to build and publish a complete quarterly curriculum your class holds in their hands.",
  },
  sections: {
    title: "Get All 8 Sections",
    freeIncluded: [
      'Lens + Lesson Overview',
      'Main Teaching Content',
      'Group Handout',
    ],
    paidAdds: [
      'Learning Objectives + Key Scriptures',
      'Theological Background (Deep-Dive)',
      'Opening Activities',
      'Interactive Activities',
      'Discussion & Assessment',
    ],
  },
} as const;

// ============================================================
// HELPER FUNCTIONS
// ============================================================

export function getTierSections(tier: SubscriptionTier): string[] {
  return [...TIER_SECTIONS[tier]];
}

export function getSectionName(sectionNumber: string): string {
  return SECTION_NAMES[sectionNumber] || `Section ${sectionNumber}`;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

export function getTierLessonLimit(tier: SubscriptionTier): number {
  return TIER_LESSON_LIMITS[tier];
}

export function isOrgTier(tier: SubscriptionTier): boolean {
  return ['starter', 'growth', 'full', 'enterprise'].includes(tier);
}

export function isPaidTier(tier: SubscriptionTier): boolean {
  return tier !== 'free';
}

// ============================================================
// PRICE-TO-TIER RESOLVER (SSOT)
// Stripe webhook and Edge Functions use these to map Stripe
// price IDs to subscription tiers and lesson limits.
// NEVER query tier_config or pricing_plans tables for this.
// Added: 2026-02-26
// ============================================================

const ORG_TIER_TO_SUBSCRIPTION_TIER: Record<string, SubscriptionTier> = {
  org_single_staff: 'starter',
  org_starter:      'starter',
  org_growth:       'growth',
  org_develop:      'full',
  org_expansion:    'enterprise',
};

export function resolveTierFromPriceId(priceId: string): SubscriptionTier | null {
  // Individual subscriptions
  const personal = STRIPE_INDIVIDUAL.personal;
  if (priceId === personal.prices.monthly || priceId === personal.prices.annual) {
    return 'personal';
  }
  // Organization subscriptions -- delegate to orgPricingConfig.ts (sole authority)
  const orgTier = getOrgTierByStripePriceId(priceId);
  if (orgTier) {
    const tierName = ORG_TIER_TO_SUBSCRIPTION_TIER[orgTier.tier] ?? null;
    return tierName;
  }
  return null;
}

export function getLessonLimitForPriceId(priceId: string): number {
  // Individual
  const personal = STRIPE_INDIVIDUAL.personal;
  if (priceId === personal.prices.monthly || priceId === personal.prices.annual) {
    return personal.lessonsPerPeriod;
  }
  // Organization -- delegate to orgPricingConfig.ts (sole authority)
  const orgTier = getOrgTierByStripePriceId(priceId);
  if (orgTier) {
    return orgTier.lessonsLimit;
  }
  return TIER_LESSON_LIMITS.free;
}

// ============================================================
// DATABASE TYPE \u2014 matches Supabase pricing_plans table
// ============================================================

export interface PricingPlanFromDB {
  id: string;
  stripe_product_id: string;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  plan_name: string;
  tier: SubscriptionTier;
  price_monthly: number;
  price_annual: number;
  lessons_per_month: number;
  sections_included: string[];
  includes_teaser: boolean;
  includes_modern_parables: boolean;
  display_order: number;
  is_active: boolean;
  best_for: string | null;
}
