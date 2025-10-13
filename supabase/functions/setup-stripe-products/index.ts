import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const results = {
      products: [] as any[],
      prices: [] as any[],
    };

    // Product 1: Essentials
    const essentialsProduct = await stripe.products.create({
      name: "LessonSparkUSA — Essentials",
      description: "Perfect for individual teachers — 50 lesson credits per month",
      metadata: {
        tier: "essentials",
        credits_monthly: "50",
      },
    });
    results.products.push(essentialsProduct);

    const essentialsMonthly = await stripe.prices.create({
      product: essentialsProduct.id,
      unit_amount: 1900,
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: "essentials_monthly",
      billing_scheme: "per_unit",
      tax_behavior: "exclusive",
      metadata: {
        tier: "essentials",
        credits_monthly: "50",
      },
    });
    results.prices.push(essentialsMonthly);

    const essentialsYearly = await stripe.prices.create({
      product: essentialsProduct.id,
      unit_amount: 18200,
      currency: "usd",
      recurring: { interval: "year" },
      lookup_key: "essentials_yearly",
      billing_scheme: "per_unit",
      tax_behavior: "exclusive",
      metadata: {
        tier: "essentials",
        credits_monthly: "50",
      },
    });
    results.prices.push(essentialsYearly);

    // Product 2: Pro
    const proProduct = await stripe.products.create({
      name: "LessonSparkUSA — Pro",
      description: "For power users — 200 lesson credits per month",
      metadata: {
        tier: "pro",
        credits_monthly: "200",
      },
    });
    results.products.push(proProduct);

    const proMonthly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 4900,
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: "pro_monthly",
      billing_scheme: "per_unit",
      tax_behavior: "exclusive",
      metadata: {
        tier: "pro",
        credits_monthly: "200",
      },
    });
    results.prices.push(proMonthly);

    const proYearly = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 47000,
      currency: "usd",
      recurring: { interval: "year" },
      lookup_key: "pro_yearly",
      billing_scheme: "per_unit",
      tax_behavior: "exclusive",
      metadata: {
        tier: "pro",
        credits_monthly: "200",
      },
    });
    results.prices.push(proYearly);

    // Product 3: Premium
    const premiumProduct = await stripe.products.create({
      name: "LessonSparkUSA — Premium",
      description: "Unlimited lesson credits per month",
      metadata: {
        tier: "premium",
        credits_monthly: "UNLIMITED",
      },
    });
    results.products.push(premiumProduct);

    const premiumMonthly = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 9900,
      currency: "usd",
      recurring: { interval: "month" },
      lookup_key: "premium_monthly",
      billing_scheme: "per_unit",
      tax_behavior: "exclusive",
      metadata: {
        tier: "premium",
        credits_monthly: "UNLIMITED",
      },
    });
    results.prices.push(premiumMonthly);

    const premiumYearly = await stripe.prices.create({
      product: premiumProduct.id,
      unit_amount: 95000,
      currency: "usd",
      recurring: { interval: "year" },
      lookup_key: "premium_yearly",
      billing_scheme: "per_unit",
      tax_behavior: "exclusive",
      metadata: {
        tier: "premium",
        credits_monthly: "UNLIMITED",
      },
    });
    results.prices.push(premiumYearly);

    // Update subscription_plans table with Stripe price IDs
    await supabase
      .from("subscription_plans")
      .update({
        lookup_key: "essentials_monthly",
      })
      .eq("name", "Essentials");

    await supabase
      .from("subscription_plans")
      .update({
        lookup_key: "pro_monthly",
      })
      .eq("name", "Pro");

    await supabase
      .from("subscription_plans")
      .update({
        lookup_key: "premium_monthly",
      })
      .eq("name", "Premium");

    return new Response(
      JSON.stringify({
        success: true,
        message: "All Stripe products and prices created successfully",
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error setting up Stripe products:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
