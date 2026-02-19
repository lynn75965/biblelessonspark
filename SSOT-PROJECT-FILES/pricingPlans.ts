// =============================================================================
// PRICING PLANS CONFIGURATION
// SSOT MASTER: Frontend pricing definitions
// Stripe owns: prices, billing | App owns: features, limits
// =============================================================================

/**
 * Stripe Product and Price IDs
 * Update these if Stripe IDs change
 */
export const STRIPE_IDS = {
  products: {
    essentials: 'prod_TJF2M7plp379IV',
    pro: 'prod_TJT1yqKwLMidbP',
    premier: 'prod_TJT6WBj71oclG9',
  },
  prices: {
    essentials_monthly: 'price_1SMcYaI4GLksxBfVXv4fu4dB',
    essentials_annual: 'price_1SMpypI4GLksxBfV6tytRIAO',
    pro_monthly: 'price_1SMq5II4GLksxBfVnORQ6zUg',
    pro_annual: 'price_1SMq5II4GLksxBfVH004gJ2Y',
    premier_monthly: 'price_1SMqAII4GLksxBfVm7HzrDUK',
    premier_annual: 'price_1SMqAII4GLksxBfV4K7Jm0W0',
  },
} as const;

/**
 * Plan tier types
 */
export type PlanTier = 'free' | 'essentials' | 'pro' | 'premier';
export type BillingInterval = 'monthly' | 'annual';
export type LessonTierAccess = 'basic' | 'full';

/**
 * Plan feature configuration
 */
export interface PlanFeatures {
  lessonsPerMonth: number | 'unlimited';
  tierAccess: LessonTierAccess;
  exportFormats: ('pdf' | 'docx' | 'print')[];
  customization: boolean;
  prioritySupport: boolean;
  teamMembers: number;
  orgFeatures: boolean;
}

/**
 * Complete plan configuration
 */
export interface PricingPlan {
  id: PlanTier;
  name: string;
  description: string;
  stripeProductId: string | null;
  prices: {
    monthly: { amount: number; stripePriceId: string | null };
    annual: { amount: number; stripePriceId: string | null };
  };
  features: PlanFeatures;
  popular?: boolean;
}

/**
 * All pricing plans - SSOT for app features
 */
export const PRICING_PLANS: Record<PlanTier, PricingPlan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Try BibleLessonSpark with limited features',
    stripeProductId: null,
    prices: {
      monthly: { amount: 0, stripePriceId: null },
      annual: { amount: 0, stripePriceId: null },
    },
    features: {
      lessonsPerMonth: 3,
      tierAccess: 'basic',
      exportFormats: ['print'],
      customization: false,
      prioritySupport: false,
      teamMembers: 1,
      orgFeatures: false,
    },
  },
  essentials: {
    id: 'essentials',
    name: 'Essentials',
    description: 'Perfect for individual teachers and small Bible-study groups',
    stripeProductId: STRIPE_IDS.products.essentials,
    prices: {
      monthly: { amount: 799, stripePriceId: STRIPE_IDS.prices.essentials_monthly },
      annual: { amount: 7990, stripePriceId: STRIPE_IDS.prices.essentials_annual },
    },
    features: {
      lessonsPerMonth: 20,
      tierAccess: 'full',
      exportFormats: ['pdf', 'docx', 'print'],
      customization: true,
      prioritySupport: false,
      teamMembers: 1,
      orgFeatures: false,
    },
    popular: true,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Ideal for churches with multiple teachers and growing programs',
    stripeProductId: STRIPE_IDS.products.pro,
    prices: {
      monthly: { amount: 3900, stripePriceId: STRIPE_IDS.prices.pro_monthly },
      annual: { amount: 39900, stripePriceId: STRIPE_IDS.prices.pro_annual },
    },
    features: {
      lessonsPerMonth: 100,
      tierAccess: 'full',
      exportFormats: ['pdf', 'docx', 'print'],
      customization: true,
      prioritySupport: true,
      teamMembers: 10,
      orgFeatures: true,
    },
  },
  premier: {
    id: 'premier',
    name: 'Premier',
    description: 'Comprehensive solution for large churches and multi-campus ministries',
    stripeProductId: STRIPE_IDS.products.premier,
    prices: {
      monthly: { amount: 7900, stripePriceId: STRIPE_IDS.prices.premier_monthly },
      annual: { amount: 79900, stripePriceId: STRIPE_IDS.prices.premier_annual },
    },
    features: {
      lessonsPerMonth: 'unlimited',
      tierAccess: 'full',
      exportFormats: ['pdf', 'docx', 'print'],
      customization: true,
      prioritySupport: true,
      teamMembers: 50,
      orgFeatures: true,
    },
  },
} as const;

/**
 * Helper: Get plan by Stripe product ID
 */
export function getPlanByProductId(productId: string): PricingPlan | null {
  return Object.values(PRICING_PLANS).find(p => p.stripeProductId === productId) || null;
}

/**
 * Helper: Get plan by Stripe price ID
 */
export function getPlanByPriceId(priceId: string): { plan: PricingPlan; interval: BillingInterval } | null {
  for (const plan of Object.values(PRICING_PLANS)) {
    if (plan.prices.monthly.stripePriceId === priceId) {
      return { plan, interval: 'monthly' };
    }
    if (plan.prices.annual.stripePriceId === priceId) {
      return { plan, interval: 'annual' };
    }
  }
  return null;
}

/**
 * Helper: Format price for display
 */
export function formatPrice(amountInCents: number): string {
  return `$${(amountInCents / 100).toFixed(2)}`;
}

/**
 * Helper: Get plans array for display
 */
export function getPlansArray(): PricingPlan[] {
  return Object.values(PRICING_PLANS);
}

/**
 * Helper: Get paid plans only
 */
export function getPaidPlans(): PricingPlan[] {
  return Object.values(PRICING_PLANS).filter(p => p.id !== 'free');
}
