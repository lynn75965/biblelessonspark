import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Hardcoded catalog
const CATALOG = [
  {
    name: "LessonSparkUSA — Essentials",
    description: "Perfect for individual teachers — 50 lesson credits per month",
    tier: "essentials",
    credits_monthly: 50,
    monthly: { amount_cents: 1900, lookup_key: "essentials_monthly", currency: "usd" },
    yearly: { amount_cents: 18200, lookup_key: "essentials_yearly", currency: "usd" },
  },
  {
    name: "LessonSparkUSA — Pro",
    description: "For power users — 200 lesson credits per month",
    tier: "pro",
    credits_monthly: 200,
    monthly: { amount_cents: 4900, lookup_key: "pro_monthly", currency: "usd" },
    yearly: { amount_cents: 47000, lookup_key: "pro_yearly", currency: "usd" },
  },
  {
    name: "LessonSparkUSA — Premium",
    description: "Unlimited lesson credits per month",
    tier: "premium",
    credits_monthly: null, // NULL means unlimited
    monthly: { amount_cents: 9900, lookup_key: "premium_monthly", currency: "usd" },
    yearly: { amount_cents: 95000, lookup_key: "premium_yearly", currency: "usd" },
  },
];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check admin auth
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify admin role
    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if we're in test mode
    const testKey = Deno.env.get("STRIPE_SECRET_KEY") || "";
    if (!testKey.startsWith("sk_test_")) {
      return new Response(
        JSON.stringify({ error: "This seeder only runs in test mode." }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const summary = {
      created: { products: 0, prices: 0 },
      reused: { products: 0, prices: 0 },
      plans_upserted: [] as any[],
    };

    // Process each catalog item
    for (const item of CATALOG) {
      console.log(`Processing: ${item.name}`);
      
      // Find or create product
      const existingProducts = await stripe.products.search({
        query: `name:'${item.name}'`,
      });

      let product;
      if (existingProducts.data.length > 0) {
        product = existingProducts.data[0];
        console.log(`Reusing product: ${product.id}`);
        summary.reused.products++;
      } else {
        product = await stripe.products.create({
          name: item.name,
          description: item.description,
          metadata: {
            tier: item.tier,
            credits_monthly: item.credits_monthly?.toString() || "UNLIMITED",
          },
        });
        console.log(`Created product: ${product.id}`);
        summary.created.products++;
      }

      // Process monthly price
      const monthlyLookupKey = item.monthly.lookup_key;
      let monthlyPrice;
      
      try {
        const existingMonthlyPrices = await stripe.prices.list({
          lookup_keys: [monthlyLookupKey],
          limit: 1,
        });

        if (existingMonthlyPrices.data.length > 0) {
          monthlyPrice = existingMonthlyPrices.data[0];
          console.log(`Reusing monthly price: ${monthlyPrice.id}`);
          summary.reused.prices++;
        } else {
          monthlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: item.monthly.amount_cents,
            currency: item.monthly.currency,
            recurring: { interval: "month" },
            lookup_key: monthlyLookupKey,
            billing_scheme: "per_unit",
            tax_behavior: "exclusive",
            metadata: {
              tier: item.tier,
              credits_monthly: item.credits_monthly?.toString() || "UNLIMITED",
            },
          });
          console.log(`Created monthly price: ${monthlyPrice.id}`);
          summary.created.prices++;
        }
      } catch (err) {
        console.error(`Error processing monthly price for ${item.name}:`, err);
        throw err;
      }

      // Process yearly price
      const yearlyLookupKey = item.yearly.lookup_key;
      let yearlyPrice;
      
      try {
        const existingYearlyPrices = await stripe.prices.list({
          lookup_keys: [yearlyLookupKey],
          limit: 1,
        });

        if (existingYearlyPrices.data.length > 0) {
          yearlyPrice = existingYearlyPrices.data[0];
          console.log(`Reusing yearly price: ${yearlyPrice.id}`);
          summary.reused.prices++;
        } else {
          yearlyPrice = await stripe.prices.create({
            product: product.id,
            unit_amount: item.yearly.amount_cents,
            currency: item.yearly.currency,
            recurring: { interval: "year" },
            lookup_key: yearlyLookupKey,
            billing_scheme: "per_unit",
            tax_behavior: "exclusive",
            metadata: {
              tier: item.tier,
              credits_monthly: item.credits_monthly?.toString() || "UNLIMITED",
            },
          });
          console.log(`Created yearly price: ${yearlyPrice.id}`);
          summary.created.prices++;
        }
      } catch (err) {
        console.error(`Error processing yearly price for ${item.name}:`, err);
        throw err;
      }

      // Upsert subscription_plans
      const planData = {
        name: item.name,
        lookup_key: monthlyLookupKey,
        price_monthly_cents: item.monthly.amount_cents,
        price_yearly_cents: item.yearly.amount_cents,
        currency: item.monthly.currency,
        credits_monthly: item.credits_monthly,
        stripe_product_id: product.id,
        stripe_price_id_monthly: monthlyPrice.id,
        stripe_price_id_yearly: yearlyPrice.id,
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error: upsertError } = await supabase
        .from("subscription_plans")
        .upsert(planData, { onConflict: "lookup_key" })
        .select()
        .single();

      if (upsertError) {
        console.error("Upsert error:", upsertError);
        throw upsertError;
      }

      summary.plans_upserted.push(upserted);
      console.log(`Upserted plan: ${item.name}`);
    }

    console.log("Seeding complete:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in seed-stripe-catalog:", error);
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
