// ============================================================
// LESSONSPARK USA - PRICING CONFIGURATION (SSOT-COMPLIANT)
// Location: src/constants/pricingConfig.ts
//
// SSOT RULE: Prices come from Stripe -> Supabase -> Frontend
// This file contains ONLY:
// - Stripe IDs (identifiers for checkout)
// - Section mappings (app-controlled)
// - Feature definitions (app-controlled)
// ============================================================

// Stripe IDs - Used for checkout redirect only
export const STRIPE_CONFIG = {
  PRODUCT_ID: 'prod_TJF2M7plp379IV',
  PRICES: {
    PERSONAL_MONTHLY: 'price_1Sj3bRI4GLksxBfVfGVrgZXP',
    PERSONAL_ANNUAL: 'price_1SMpypI4GLksxBfV6tytRIAO',
  },
} as const;

// Tier type - matches database enum
export type SubscriptionTier = 'free' | 'personal' | 'admin';
export type BillingInterval = 'month' | 'year';
export const DEFAULT_BILLING_INTERVAL: BillingInterval = 'year';
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

// Section mappings - App-controlled
export const TIER_SECTIONS = {
  free: ['1', '5', '8'],
  personal: ['1', '2', '3', '4', '5', '6', '7', '8'],
  admin: ['1', '2', '3', '4', '5', '6', '7', '8'],
} as const;

// Section names for display
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

// Feature definitions for comparison display
export interface PlanFeature {
  name: string;
  includedInFree: boolean;
  includedInPersonal: boolean;
}

export const PLAN_FEATURES: PlanFeature[] = [
  { name: 'Lens + Lesson Overview', includedInFree: true, includedInPersonal: true },
  { name: 'Main Teaching Content', includedInFree: true, includedInPersonal: true },
  { name: 'Student Handout', includedInFree: true, includedInPersonal: true },
  { name: 'Learning Objectives + Key Scriptures', includedInFree: false, includedInPersonal: true },
  { name: 'Theological Background (Deep-Dive)', includedInFree: false, includedInPersonal: true },
  { name: 'Opening Activities', includedInFree: false, includedInPersonal: true },
  { name: 'Interactive Activities', includedInFree: false, includedInPersonal: true },
  { name: 'Discussion & Assessment', includedInFree: false, includedInPersonal: true },
  { name: 'Student Teaser (Pre-Lesson)', includedInFree: false, includedInPersonal: true },
  { name: 'Modern Parables Generator', includedInFree: true, includedInPersonal: true },
  { name: 'PDF/DOCX Export', includedInFree: true, includedInPersonal: true },
  { name: 'All Age Groups', includedInFree: true, includedInPersonal: true },
  { name: 'All Theology Profiles', includedInFree: true, includedInPersonal: true },
  { name: 'All Bible Versions', includedInFree: true, includedInPersonal: true },
];

// Upgrade prompt copy
export const UPGRADE_PROMPTS = {
  limitReached: {
    title: "You've reached your monthly limit",
    description: "Upgrade to Personal for more lessons and complete 8-section lessons.",
  },
  featureTeaser: {
    title: "Unlock Complete Lessons",
    description: "Personal plan includes 5 additional sections for well-rounded lessons.",
  },
  sections: {
    title: "Get All 8 Sections",
    freeIncluded: ['Lens + Lesson Overview', 'Main Teaching Content', 'Student Handout'],
    personalAdds: [
      'Learning Objectives + Key Scriptures',
      'Theological Background (Deep-Dive)',
      'Opening Activities',
      'Interactive Activities',
      'Discussion & Assessment',
      'Student Teaser (Pre-Lesson)',
    ],
  },
} as const;

// Helper functions
export function getTierSections(tier: SubscriptionTier): string[] {
  return [...TIER_SECTIONS[tier]];
}

export function getSectionName(sectionNumber: string): string {
  return SECTION_NAMES[sectionNumber] || `Section ${sectionNumber}`;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;
}

// Database types - matches Supabase table
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


