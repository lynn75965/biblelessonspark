import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Canonical lookup keys for our pricing
const CANONICAL_LOOKUP_KEYS = [
  "essentials_monthly",
  "essentials_yearly",
  "pro_monthly",
  "pro_yearly",
  "premium_monthly",
  "premium_yearly",
];

// Map lookup keys to tier and interval
const getLookupKeyInfo = (lookupKey: string) => {
  const [tier, interval] = lookupKey.split("_");
  return { tier, interval };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY") || "";

    if (!stripeKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log mode for diagnostics (no key details exposed)
    const mode = stripeKey.startsWith("sk_test_") ? "test" : "live";
    console.log(`Stripe sync running in ${mode} mode`);

    // Let the SDK use its default API version for maximum compatibility
    const stripe = new Stripe(stripeKey, {
      httpClient: Stripe.createFetchHttpClient(),
    });

    const summary = {
      mode,
      updated: [] as any[],
      reused: [] as string[],
      errors: [] as any[],
    };

    // Group lookup keys by tier (monthly/yearly pairs)
    const tierGroups: Record<string, { monthly?: any; yearly?: any }> = {};

    for (const lookupKey of CANONICAL_LOOKUP_KEYS) {
      console.log(`Fetching price for lookup_key: ${lookupKey}`);

      try {
        const prices = await stripe.prices.list({
          lookup_keys: [lookupKey],
          limit: 1,
        });

        if (prices.data.length === 0) {
          console.log(`No price found for ${lookupKey}`);
          summary.errors.push({ lookupKey, error: "Price not found in Stripe" });
          continue;
        }

        const price = prices.data[0];
        const { tier, interval } = getLookupKeyInfo(lookupKey);

        if (!tierGroups[tier]) {
          tierGroups[tier] = {};
        }

        tierGroups[tier][interval] = {
          lookupKey,
          priceId: price.id,
          productId: typeof price.product === 'string' ? price.product : price.product.id,
          amount: price.unit_amount,
          currency: price.currency,
        };

        console.log(`Found price ${price.id} for ${lookupKey}: ${price.unit_amount} ${price.currency}`);
      } catch (err) {
        console.error(`Error fetching ${lookupKey}:`, err);
        summary.errors.push({ lookupKey, error: err.message });
      }
    }

    // Now upsert subscription_plans for each tier
    for (const [tier, data] of Object.entries(tierGroups)) {
      if (!data.monthly || !data.yearly) {
        console.log(`Incomplete data for ${tier}, skipping`);
        summary.errors.push({ tier, error: "Missing monthly or yearly price" });
        continue;
      }

      // Get existing plan to preserve name, description, credits_monthly
      const { data: existingPlan } = await supabase
        .from("subscription_plans")
        .select("*")
        .eq("lookup_key", data.monthly.lookupKey)
        .single();

      // Determine credits_monthly based on tier
      let creditsMonthly = existingPlan?.credits_monthly;
      if (creditsMonthly === undefined) {
        creditsMonthly = tier === "essentials" ? 50 : tier === "pro" ? 200 : null;
      }

      const planData = {
        name: existingPlan?.name || `BibleLessonSpark — ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
        lookup_key: data.monthly.lookupKey,
        price_monthly_cents: data.monthly.amount,
        price_yearly_cents: data.yearly.amount,
        currency: data.monthly.currency,
        credits_monthly: creditsMonthly,
        stripe_product_id: data.monthly.productId,
        stripe_price_id_monthly: data.monthly.priceId,
        stripe_price_id_yearly: data.yearly.priceId,
        updated_at: new Date().toISOString(),
      };

      const { data: upserted, error: upsertError } = await supabase
        .from("subscription_plans")
        .upsert(planData, { onConflict: "lookup_key" })
        .select()
        .single();

      if (upsertError) {
        console.error(`Upsert error for ${tier}:`, upsertError);
        summary.errors.push({ tier, error: upsertError.message });
      } else {
        console.log(`Upserted plan for ${tier}`);
        summary.updated.push(upserted);
      }
    }

    console.log("Sync complete:", summary);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in sync-pricing-from-stripe:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: "Check Supabase Edge Function logs for full stack trace",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
