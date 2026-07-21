// ============================================================
// BIBLELESSONSPARK - CREATE CHECKOUT SESSION
// Location: supabase/functions/create-checkout-session/index.ts
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { getBranding, getBaseUrl } from "../_shared/branding.ts";
import { resolveTierFromPriceId } from "../_shared/pricingConfig.ts";
import { CONVERSION_EVENT_TYPES } from "../_shared/conversionEvents.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
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

    const { price_id, success_url, cancel_url, trigger_source, billing_interval } = await req.json();

    if (!price_id) {
      return new Response(JSON.stringify({ error: "Missing price_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SSOT gate: this endpoint is PERSONAL-TIER-ONLY by design (mode is
    // hardcoded to "subscription" below and only the individual Personal
    // plan is sold here). Organization tiers go through
    // create-org-checkout-session instead. The === "personal" scoping is
    // intentional, not an oversight -- do not widen this to "!== null"
    // without first reconsidering why an org price ID would ever need to
    // reach this function.
    if (resolveTierFromPriceId(price_id) !== "personal") {
      console.error(`Rejected checkout attempt: user=${user.id} attempted_price_id=${price_id}`);
      return new Response(JSON.stringify({ error: "Invalid price_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SSOT: Get base URL from branding config
    const branding = await getBranding(supabase);
    const baseUrl = getBaseUrl(branding);
    const baseOrigin = new URL(baseUrl).origin;

    const isSameOrigin = (url: string): boolean => {
      try {
        return new URL(url).origin === baseOrigin;
      } catch {
        return false;
      }
    };

    if (success_url && !isSameOrigin(success_url)) {
      console.error(`Rejected checkout attempt: user=${user.id} unsafe_success_url=${success_url}`);
      return new Response(JSON.stringify({ error: "Invalid success_url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (cancel_url && !isSameOrigin(cancel_url)) {
      console.error(`Rejected checkout attempt: user=${user.id} unsafe_cancel_url=${cancel_url}`);
      return new Response(JSON.stringify({ error: "Invalid cancel_url" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let customerId: string;

    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id, tier")
      .eq("user_id", user.id)
      .single();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;

      await supabase.from("user_subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        tier: "free",
        status: "active",
      }, { onConflict: "user_id" });
    }

    const finalSuccessUrl = success_url || `${baseUrl}/dashboard?payment=success`;
    const finalCancelUrl = cancel_url || `${baseUrl}/pricing?payment=canceled`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: price_id, quantity: 1 }],
      mode: "subscription",
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: { user_id: user.id },
      subscription_data: { metadata: { user_id: user.id } },
      allow_promotion_codes: true,
      consent_collection: { terms_of_service: "required" },
    });

    console.log(`Created checkout session ${session.id} for user ${user.id}`);

    // B7: server-side conversion event, service role -- bypasses RLS the
    // same way generate-lesson's guardrail_violations insert does. Never
    // blocks the checkout response on failure; a lost event is acceptable,
    // a broken checkout is not.
    const { error: eventError } = await supabase.from("conversion_events").insert({
      user_id: user.id,
      event_type: CONVERSION_EVENT_TYPES.CHECKOUT_STARTED,
      trigger_source: trigger_source ?? null,
      tier_at_event: existingSub?.tier ?? "free",
      meta: { billing_interval, price_id },
    });
    if (eventError) {
      console.error("Failed to log checkout_started conversion event:", eventError);
    }

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Checkout session error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
