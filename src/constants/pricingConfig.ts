// ============================================================
// BIBLELESSONSPARK - PRICING CONFIGURATION (SSOT)
// Location: src/constants/pricingConfig.ts
//
// ARCHITECTURE PRINCIPLES:
// - Frontend drives backend: these constants are authoritative
// - Backend (Supabase) validates against values defined here
// - SSOT: all Stripe IDs, tier definitions, and section mappings
//   live here and are imported everywhere — never duplicated
//
// STRIPE CATALOG (complete as of 2026-02-21):
// - 1 Individual subscription: Personal
// - 4 Organization subscriptions: Starter, Growth, Full, Enterprise
// - 3 Lesson Packs (one-time): Small, Medium, Large
// - 2 Onboarding options (one-time): Guided Setup, White Glove
//
// Last Updated: 2026-02-21
// ============================================================

// ============================================================
// STRIPE IDS — INDIVIDUAL SUBSCRIPTION
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
// STRIPE IDS — ORGANIZATION SUBSCRIPTIONS
// ============================================================

export const STRIPE_ORG = {
  starter: {
    productId: 'prod_Tt8suAq0Ba5Kyy',
    prices: {
      monthly: 'price_1SvMaWI4GLksxBfVn6FVKKiG',
      annual:  'price_1SvMcVI4GLksxBfVLG7k1F12',
    },
    lessonsPerPeriod: 25,
  },
  growth: {
    productId: 'prod_Tt9AA0Mr8ggFm8',
    prices: {
      monthly: 'price_1SvMt9I4GLksxBfV5hc6Rsox',
      annual:  'price_1SvMsCI4GLksxBfVDy8YjZYu',
    },
    lessonsPerPeriod: 60,
  },
  full: {
    productId: 'prod_Tt9GvWKjoPutRs',
    prices: {
      monthly: 'price_1SvN1lI4GLksxBfVEpU7eKq5',
      annual:  'price_1SvMxmI4GLksxBfVVOY3cOpb',
    },
    lessonsPerPeriod: 120,
  },
  enterprise: {
    productId: 'prod_Tt9MztPmhtJnZ2',
    prices: {
      monthly: 'price_1SvN5RI4GLksxBfVrtZ2aDN9',
      annual:  'price_1SvN4CI4GLksxBfVgdN7qjsr',
    },
    lessonsPerPeriod: 250,
  },
} as const;

// ============================================================
// STRIPE IDS — LESSON PACKS (ONE-TIME PURCHASES)
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
// STRIPE IDS — ONBOARDING OPTIONS (ONE-TIME PURCHASES)
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
// Matches database enum exactly — frontend is authoritative
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
// SECTION ARRAYS — SINGLE SOURCE OF TRUTH
// These arrays define which lesson sections each tier receives.
// Import these constants — NEVER hardcode section numbers.
//
// FREE TIER SECTIONS: 1, 5, 8
//   Section 1: Lens + Lesson Overview
//   Section 5: Main Teaching Content (Teacher Transcript)
//   Section 8: Student Handout (Standalone)
//
// ALL PAID TIERS: all 8 sections
// ============================================================

export const TIER_SECTIONS: Record<SubscriptionTier, string[]> = {
  free:       ['1', '5', '8'],
  personal:   ['1', '2', '3', '4', '5', '6', '7', '8'],
  starter:    ['1', '2', '3', '4', '5', '6', '7', '8'],
  growth:     ['1', '2', '3', '4', '5', '6', '7', '8'],
  full:       ['1', '2', '3', '4', '5', '6', '7', '8'],
  enterprise: ['1', '2', '3', '4', '5', '6', '7', '8'],
} as const;

// Free tier sections as numbers (for comparison/display logic)
export const FREE_TIER_SECTION_NUMBERS = [1, 5, 8] as const;

// Full tier sections as numbers (for lessonTiers.ts and other imports)
export const FULL_TIER_SECTION_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

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
  '8': 'Student Handout (Standalone)',
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
    upgradeButton: 'Upgrade to Personal Plan',
    displayName: 'Teacher Plan',
  },
} as const;

// ============================================================
// FEATURE DEFINITIONS FOR PLAN COMPARISON DISPLAY
// ============================================================

export interface PlanFeature {
  name: string;
  includedInFree: boolean;
  includedInPaid: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { name: 'Lens + Lesson Overview',              includedInFree: true,  includedInPaid: true  },
  { name: 'Main Teaching Content',               includedInFree: true,  includedInPaid: true  },
  { name: 'Student Handout',                     includedInFree: true,  includedInPaid: true  },
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
] as const;

// ============================================================
// UPGRADE PROMPT COPY (SSOT for UI messaging)
// ============================================================

export const UPGRADE_PROMPTS = {
  limitReached: {
    title: "You've reached your 30-day lesson limit",
    description: "Upgrade for more lessons and complete 8-section lessons.",
  },
  featureTeaser: {
    title: "Unlock Complete Lessons",
    description: "Paid plans include 5 additional sections for well-rounded lessons.",
  },
  sections: {
    title: "Get All 8 Sections",
    freeIncluded: [
      'Lens + Lesson Overview',
      'Main Teaching Content',
      'Student Handout',
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
// DATABASE TYPE — matches Supabase pricing_plans table
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
