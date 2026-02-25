// src/constants/orgPricingConfig.ts
// SSOT: Organization Pricing Configuration
// This file is the MASTER - database is synced via: npm run sync-org-pricing
//
// STACK 2 -- SHEPHERD TIERS (Organization)
// Single Staff | Starter | Growth | Develop | Expansion
//
// Updated: February 3, 2026

// ============================================
// ORGANIZATION SUBSCRIPTION TIERS
// ============================================

export interface OrgTier {
  tier: string;
  displayName: string;
  lessonsLimit: number;
  priceMonthly: number;
  priceAnnual: number;
  stripeProductId: string;
  stripePriceIdMonthly: string;
  stripePriceIdAnnual: string;
  description: string;
  bestFor: string;
  displayOrder: number;
  isActive: boolean;
}

export const ORG_TIERS: OrgTier[] = [
  {
    tier: 'org_single_staff',
    displayName: 'Single Staff',
    lessonsLimit: 20,
    priceMonthly: 19.00,
    priceAnnual: 190.00,
    stripeProductId: 'prod_TudPNi4TJKS8iP',
    stripePriceIdMonthly: 'price_1Swo8cI4GLksxBfVmjDOAPsy',
    stripePriceIdAnnual: 'price_1Swo8cI4GLksxBfVKrgbURbQ',
    description: '20 lessons per month shared across unlimited teachers',
    bestFor: 'Pastor + 3-5 teachers',
    displayOrder: 1,
    isActive: true,
  },
  {
    tier: 'org_starter',
    displayName: 'Starter',
    lessonsLimit: 30,
    priceMonthly: 29.00,
    priceAnnual: 290.00,
    stripeProductId: 'prod_Tt8suAq0Ba5Kyy',
    stripePriceIdMonthly: 'price_1SvMaWI4GLksxBfVn6FVKKiG',
    stripePriceIdAnnual: 'price_1SvMcVI4GLksxBfVLG7k1F12',
    description: '30 lessons per month shared across unlimited teachers',
    bestFor: '5-7 teachers',
    displayOrder: 2,
    isActive: true,
  },
  {
    tier: 'org_growth',
    displayName: 'Growth',
    lessonsLimit: 60,
    priceMonthly: 49.00,
    priceAnnual: 490.00,
    stripeProductId: 'prod_Tt9AA0Mr8ggFm8',
    stripePriceIdMonthly: 'price_1SvMt9I4GLksxBfV5hc6Rsox',
    stripePriceIdAnnual: 'price_1SvMsCI4GLksxBfVDy8YjZYu',
    description: '60 lessons per month shared across unlimited teachers',
    bestFor: '10-14 teachers',
    displayOrder: 3,
    isActive: true,
  },
  {
    tier: 'org_develop',
    displayName: 'Develop',
    lessonsLimit: 100,
    priceMonthly: 79.00,
    priceAnnual: 790.00,
    stripeProductId: 'prod_Tt9GvWKjoPutRs',
    stripePriceIdMonthly: 'price_1SvN1lI4GLksxBfVEpU7eKq5',
    stripePriceIdAnnual: 'price_1SvMxmI4GLksxBfVVOY3cOpb',
    description: '100 lessons per month shared across unlimited teachers',
    bestFor: '18-25 teachers',
    displayOrder: 4,
    isActive: true,
  },
  {
    tier: 'org_expansion',
    displayName: 'Expansion',
    lessonsLimit: 200,
    priceMonthly: 149.00,
    priceAnnual: 1490.00,
    stripeProductId: 'prod_Tt9MztPmhtJnZ2',
    stripePriceIdMonthly: 'price_1SvN5RI4GLksxBfVrtZ2aDN9',
    stripePriceIdAnnual: 'price_1SvN4CI4GLksxBfVgdN7qjsr',
    description: '200 lessons per month shared across unlimited teachers',
    bestFor: '35-50 teachers',
    displayOrder: 5,
    isActive: true,
  },
];

// ============================================
// LESSON PACKS (ONE-TIME PURCHASES)
// ============================================

export interface LessonPack {
  packType: string;
  displayName: string;
  lessonsIncluded: number;
  price: number;
  stripeProductId: string;
  stripePriceId: string;
  description: string;
  displayOrder: number;
  isActive: boolean;
}

export const LESSON_PACKS: LessonPack[] = [
  {
    packType: 'small',
    displayName: 'Lesson Pack - Small',
    lessonsIncluded: 10,
    price: 12.00,
    stripeProductId: 'prod_Tt9VeUiXCse3Vf',
    stripePriceId: 'price_1SvNC3I4GLksxBfVzzp79bQP',
    description: '10 bonus lessons - never expire',
    displayOrder: 1,
    isActive: true,
  },
  {
    packType: 'medium',
    displayName: 'Lesson Pack - Medium',
    lessonsIncluded: 25,
    price: 25.00,
    stripeProductId: 'prod_Tt9c9VetZN2qmn',
    stripePriceId: 'price_1SvNImI4GLksxBfVl7fegaD8',
    description: '25 bonus lessons - never expire',
    displayOrder: 2,
    isActive: true,
  },
  {
    packType: 'large',
    displayName: 'Lesson Pack - Large',
    lessonsIncluded: 50,
    price: 45.00,
    stripeProductId: 'prod_Tt9fZtm3WFiKlh',
    stripePriceId: 'price_1SvNM4I4GLksxBfVhC8Gt23X',
    description: '50 bonus lessons - never expire',
    displayOrder: 3,
    isActive: true,
  },
];

// ============================================
// ONBOARDING OPTIONS (ONE-TIME PURCHASES)
// ============================================

export interface OnboardingOption {
  onboardingType: string;
  displayName: string;
  price: number;
  stripeProductId: string;
  stripePriceId: string;
  description: string;
  features: string[];
  displayOrder: number;
  isActive: boolean;
}

export const ONBOARDING_OPTIONS: OnboardingOption[] = [
  {
    onboardingType: 'self_service',
    displayName: 'Self-Service',
    price: 0,
    stripeProductId: '',
    stripePriceId: '',
    description: 'Set up your organization yourself with our documentation and tutorials',
    features: [
      'Step-by-step documentation',
      'Video tutorials',
      'Email support',
    ],
    displayOrder: 0,
    isActive: true,
  },
  {
    onboardingType: 'guided_setup',
    displayName: 'Guided Setup',
    price: 99.00,
    stripeProductId: 'prod_Tt9iETbbQosHiR',
    stripePriceId: 'price_1SvNOjI4GLksxBfVddpRLRoS',
    description: '1-hour video call with hands-on setup assistance',
    features: [
      '1-hour video call',
      'Organization creation',
      'Shared Focus configuration',
      'Teacher invitation walkthrough',
      'Email support for first month',
    ],
    displayOrder: 1,
    isActive: true,
  },
  {
    onboardingType: 'white_glove',
    displayName: 'White Glove Onboarding',
    price: 249.00,
    stripeProductId: 'prod_Tt9lvUjuO8WJXK',
    stripePriceId: 'price_1SvNRyI4GLksxBfVQCm17bXq',
    description: 'Complete done-for-you setup with training',
    features: [
      'Full organization setup',
      'Shared Focus configured for your calendar',
      'All teachers invited',
      'Live team training session',
      '30-day priority support',
    ],
    displayOrder: 2,
    isActive: true,
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getOrgTierByStripeProductId = (productId: string): OrgTier | undefined => {
  return ORG_TIERS.find(tier => tier.stripeProductId === productId);
};

export const getOrgTierByStripePriceId = (priceId: string): OrgTier | undefined => {
  return ORG_TIERS.find(
    tier => tier.stripePriceIdMonthly === priceId || tier.stripePriceIdAnnual === priceId
  );
};

export const getOrgTierByTierKey = (tierKey: string): OrgTier | undefined => {
  return ORG_TIERS.find(tier => tier.tier === tierKey);
};

export const getLessonPackByStripePriceId = (priceId: string): LessonPack | undefined => {
  return LESSON_PACKS.find(pack => pack.stripePriceId === priceId);
};

export const getOnboardingByStripePriceId = (priceId: string): OnboardingOption | undefined => {
  return ONBOARDING_OPTIONS.find(opt => opt.stripePriceId === priceId);
};

export const isAnnualPrice = (priceId: string): boolean => {
  return ORG_TIERS.some(tier => tier.stripePriceIdAnnual === priceId);
};

export const getActiveOrgTiers = (): OrgTier[] => {
  return ORG_TIERS.filter(tier => tier.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
};

export const getActiveLessonPacks = (): LessonPack[] => {
  return LESSON_PACKS.filter(pack => pack.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
};

export const getActiveOnboardingOptions = (): OnboardingOption[] => {
  return ONBOARDING_OPTIONS.filter(opt => opt.isActive).sort((a, b) => a.displayOrder - b.displayOrder);
};
