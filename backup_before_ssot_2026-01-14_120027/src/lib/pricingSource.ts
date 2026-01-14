/**
 * Single source of truth for pricing pulled from subscription_plans
 * (which is already synced from Stripe via the Admin "Sync from Stripe" button).
 */
import { supabase } from "@/integrations/supabase/client";

export type BillingCycle = "monthly" | "yearly";

export type UiPlan = {
  id: string;                 // e.g., "essentials" | "pro" | "premium"
  name: string;               // "Essentials"
  creditsMonthly: number | null; // null => unlimited
  priceCents: number;         // price for the selected cycle
  currency: string;           // "usd"
  lookupKey: string;          // correct Stripe lookup key for the selected cycle
  stripePriceId: string;      // Stripe price ID for the selected cycle
  bestValue?: boolean;        // highlight on yearly if desired
  description?: string;       // plan description
  features?: string[];        // plan features
};

export async function getPlans(cycle: BillingCycle): Promise<UiPlan[]> {
  const { data, error } = await supabase
    .from("subscription_plans")
    .select(`
      name,
      credits_monthly,
      currency,
      price_monthly_cents,
      price_yearly_cents,
      lookup_key,
      stripe_price_id_monthly,
      stripe_price_id_yearly
    `)
    .order("price_monthly_cents", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: any) => {
    const isYearly = cycle === "yearly";
    const priceCents = isYearly ? row.price_yearly_cents : row.price_monthly_cents;
    
    // Derive yearly key by replacing suffix if needed
    const lookupKey = isYearly
      ? String(row.lookup_key || "").replace("_monthly", "_yearly")
      : row.lookup_key;

    const stripePriceId = isYearly
      ? row.stripe_price_id_yearly
      : row.stripe_price_id_monthly;

    // Determine tier from name
    const tier = row.name?.toLowerCase?.() ?? "plan";
    
    return {
      id: tier,
      name: row.name,
      creditsMonthly: row.credits_monthly,
      priceCents,
      currency: row.currency ?? "usd",
      lookupKey,
      stripePriceId,
      bestValue: tier === "pro" // highlight Pro by default
    } as UiPlan;
  });
}

export function formatMoney(cents: number, currency = "USD") {
  return (cents / 100).toLocaleString(undefined, { 
    style: "currency", 
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });
}

export function monthlyEquivalentFromYearly(totalYearlyCents: number) {
  return Math.round(totalYearlyCents / 12);
}

// Map plan tiers to their feature sets
export function getPlanFeatures(planName: string): { 
  description: string;
  features: string[];
  limitations?: string[];
} {
  const name = planName.toLowerCase();
  
  if (name.includes("essential")) {
    return {
      description: "Perfect for individual teachers and small Sunday School classes",
      features: [
        "All age groups (Kids, Youth, Adults, Seniors)",
        "SBC, RB, IND doctrinal profiles",
        "Print & PDF export",
        "Email support",
        "Basic lesson library"
      ],
      limitations: [
        "Single user account",
        "Basic customization options"
      ]
    };
  }
  
  if (name.includes("pro")) {
    return {
      description: "Ideal for churches with multiple teachers and growing programs",
      features: [
        "Up to 10 teacher accounts",
        "Advanced lesson customization",
        "Lesson sharing & collaboration",
        "Organization branding",
        "Priority email support",
        "Advanced lesson library",
        "Usage analytics & insights",
        "Bulk lesson export"
      ]
    };
  }
  
  if (name.includes("premium")) {
    return {
      description: "Comprehensive solution for large churches and multi-campus ministries",
      features: [
        "Unlimited teacher accounts",
        "Custom doctrinal profiles",
        "White-label branding",
        "API access for integrations",
        "Phone & priority support",
        "Advanced analytics dashboard",
        "Custom training & onboarding",
        "Multi-campus management",
        "Advanced role permissions"
      ]
    };
  }
  
  return {
    description: "Flexible plan for your ministry needs",
    features: []
  };
}
