// ============================================================
// BIBLELESSONSPARK - CREATE CHECKOUT SESSION
// Location: supabase/functions/create-checkout-session/index.ts
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { getBranding, getBaseUrl } from "../_shared/branding.ts";

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

    const { price_id, success_url, cancel_url } = await req.json();

    if (!price_id) {
      return new Response(JSON.stringify({ error: "Missing price_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let customerId: string;

    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
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

    // SSOT: Get base URL from branding config
    const branding = await getBranding(supabase);
    const baseUrl = getBaseUrl(branding);
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
    });

    console.log(`Created checkout session ${session.id} for user ${user.id}`);

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

