// ============================================================
// BIBLELESSONSPARK - CREATE ORG CHECKOUT SESSION
// Location: supabase/functions/create-org-checkout-session/index.ts
// ============================================================
// SSOT: Frontend drives backend
//   - priceId comes from frontend (orgPricingConfig.ts is SSOT)
//   - Personal subscription priceId from tier_config table (synced from pricingConfig.ts)
//   - Org types validated by frontend (organizationConfig.ts is SSOT)
// ============================================================
// Supports TWO modes:
//   1. EXISTING ORG: organization_id provided - upgrade existing org
//   2. SELF-SERVICE: orgMetadata provided - create org after payment
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Invalid user token");

    const body = await req.json();
    
    // Determine mode: existing org vs self-service
    const isExistingOrgMode = !!body.organization_id;
    const isSelfServiceMode = !!body.orgMetadata;

    if (!isExistingOrgMode && !isSelfServiceMode) {
      throw new Error("Must provide either organization_id (existing org) or orgMetadata (self-service)");
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("Stripe secret key not configured");

    const siteUrl = Deno.env.get("SITE_URL") || "https://biblelessonspark.com";

    // ================================================================
    // MODE 1: EXISTING ORGANIZATION (original behavior)
    // ================================================================
    if (isExistingOrgMode) {
      const { organization_id, tier, billing_interval } = body;
      if (!tier || !billing_interval) throw new Error("Missing required fields: tier, billing_interval");
      if (!["monthly", "annual"].includes(billing_interval)) throw new Error("Invalid billing_interval");

      const { data: org, error: orgError } = await supabase
        .from("organizations")
        .select("id, name, created_by, stripe_customer_id")
        .eq("id", organization_id)
        .single();
      if (orgError || !org) throw new Error("Organization not found");

      // Check authorization
      const { data: membership } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", organization_id)
        .eq("user_id", user.id)
        .single();

      const isOrgCreator = org.created_by === user.id;
      const isOrgOwnerOrManager = membership?.role === "owner" || membership?.role === "manager";
      if (!isOrgCreator && !isOrgOwnerOrManager) throw new Error("Only organization managers can subscribe");

      // Get tier config from database (synced from orgPricingConfig.ts SSOT)
      const { data: tierConfig, error: tierError } = await supabase
        .from("org_tier_config")
        .select("*")
        .eq("tier", tier)
        .eq("is_active", true)
        .single();
      if (tierError || !tierConfig) throw new Error(`Invalid tier: ${tier}`);

      const stripePriceId = billing_interval === "annual" 
        ? tierConfig.stripe_price_id_annual 
        : tierConfig.stripe_price_id_monthly;
      if (!stripePriceId) throw new Error(`No Stripe price for ${tier} ${billing_interval}`);

      let stripeCustomerId = org.stripe_customer_id;

      if (!stripeCustomerId) {
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", user.id)
          .single();
        
        const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
          method: "POST",
          headers: { 
            "Authorization": `Bearer ${stripeSecretKey}`, 
            "Content-Type": "application/x-www-form-urlencoded" 
          },
          body: new URLSearchParams({ 
            email: userProfile?.email || user.email || "", 
            name: org.name, 
            "metadata[organization_id]": organization_id, 
            "metadata[user_id]": user.id 
          }),
        });
        if (!customerResponse.ok) { 
          const err = await customerResponse.json(); 
          throw new Error(`Failed to create customer: ${err.error?.message}`); 
        }
        const customer = await customerResponse.json();
        stripeCustomerId = customer.id;
        await supabase.from("organizations").update({ stripe_customer_id: stripeCustomerId }).eq("id", organization_id);
      }

      const checkoutResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${stripeSecretKey}`, 
          "Content-Type": "application/x-www-form-urlencoded" 
        },
        body: new URLSearchParams({
          customer: stripeCustomerId, 
          "line_items[0][price]": stripePriceId, 
          "line_items[0][quantity]": "1", 
          mode: "subscription",
          success_url: `${siteUrl}/org?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${siteUrl}/org?checkout=cancelled`,
          allow_promotion_codes: "true",
          "metadata[organization_id]": organization_id, 
          "metadata[tier]": tier, 
          "metadata[billing_interval]": billing_interval,
          "subscription_data[metadata][organization_id]": organization_id, 
          "subscription_data[metadata][tier]": tier,
        }),
      });
      if (!checkoutResponse.ok) { 
        const err = await checkoutResponse.json(); 
        throw new Error(`Checkout failed: ${err.error?.message}`); 
      }
      const session = await checkoutResponse.json();

      return new Response(
        JSON.stringify({ checkout_url: session.url, session_id: session.id }), 
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ================================================================
    // MODE 2: SELF-SERVICE (create org after payment)
    // Frontend is SSOT - it provides priceId from orgPricingConfig.ts
    // ================================================================
    const { 
      priceId,           // From frontend SSOT (orgPricingConfig.ts)
      billingInterval,   // 'monthly' or 'annual'
      orgMetadata,       // Org details to create after payment
      includePersonalSubscription,  // Add personal sub to checkout
      successUrl,
      cancelUrl 
    } = body;

    // Validate required fields with specific error messages
    if (!priceId) throw new Error("Missing priceId");
    if (!billingInterval || !["monthly", "annual"].includes(billingInterval)) {
      throw new Error("Invalid or missing billingInterval");
    }
    
    // Detailed orgMetadata validation
    if (!orgMetadata) {
      throw new Error("Missing orgMetadata object");
    }
    if (!orgMetadata.orgName) {
      throw new Error("Missing orgMetadata.orgName");
    }
    if (!orgMetadata.orgType) {
      throw new Error("Missing orgMetadata.orgType");
    }
    if (!orgMetadata.leaderName) {
      throw new Error("Missing orgMetadata.leaderName");
    }
    if (!orgMetadata.leaderEmail) {
      throw new Error("Missing orgMetadata.leaderEmail");
    }
    
    console.log("orgMetadata validated:", JSON.stringify(orgMetadata));
    console.log("includePersonalSubscription:", includePersonalSubscription);

    // Get or create Stripe customer for this user
    let stripeCustomerId: string;

    const { data: existingSub } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (existingSub?.stripe_customer_id) {
      stripeCustomerId = existingSub.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${stripeSecretKey}`, 
          "Content-Type": "application/x-www-form-urlencoded" 
        },
        body: new URLSearchParams({ 
          email: orgMetadata.leaderEmail,
          name: orgMetadata.leaderName,
          "metadata[user_id]": user.id,
        }),
      });
      if (!customerResponse.ok) { 
        const err = await customerResponse.json(); 
        throw new Error(`Failed to create customer: ${err.error?.message}`); 
      }
      const customer = await customerResponse.json();
      stripeCustomerId = customer.id;

      // Save customer ID to user_subscriptions
      await supabase.from("user_subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: stripeCustomerId,
        tier: "free",
        status: "active",
      }, { onConflict: "user_id" });
    }

    // Build line items array
    // Line item 0: Org subscription (priceId from frontend SSOT)
    const lineItemParams: Record<string, string> = {
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
    };

    // Line item 1 (optional): Personal subscription
    if (includePersonalSubscription) {
      console.log("Looking up personal subscription price for billing interval:", billingInterval);
      
      // SSOT price IDs from pricingConfig.ts - used as fallback
      const PERSONAL_PRICE_MONTHLY = "price_1Sj3bRI4GLksxBfVfGVrgZXP";
      const PERSONAL_PRICE_ANNUAL = "price_1SMpypI4GLksxBfV6tytRIAO";
      
      // Try to get from database first (pricing_plans table)
      const { data: personalPlan, error: planError } = await supabase
        .from("pricing_plans")
        .select("stripe_price_id_monthly, stripe_price_id_annual")
        .eq("tier", "personal")
        .eq("is_active", true)
        .single();

      console.log("pricing_plans lookup result:", JSON.stringify(personalPlan));
      if (planError) {
        console.log("pricing_plans lookup error:", planError.message);
      }

      let personalPriceId: string | null = null;
      
      if (personalPlan) {
        personalPriceId = billingInterval === "annual"
          ? personalPlan.stripe_price_id_annual
          : personalPlan.stripe_price_id_monthly;
        console.log("Personal price ID from database:", personalPriceId);
      }
      
      // Fallback to hardcoded SSOT if database lookup failed
      if (!personalPriceId) {
        console.log("Using hardcoded SSOT fallback for personal price");
        personalPriceId = billingInterval === "annual" 
          ? PERSONAL_PRICE_ANNUAL 
          : PERSONAL_PRICE_MONTHLY;
      }

      // Add personal subscription as second line item
      lineItemParams["line_items[1][price]"] = personalPriceId;
      lineItemParams["line_items[1][quantity]"] = "1";
      console.log("SUCCESS: Added personal subscription line item with price:", personalPriceId);
    } else {
      console.log("Personal subscription not requested - includePersonalSubscription is false");
    }

    const finalSuccessUrl = successUrl || `${siteUrl}/org/success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancelUrl || `${siteUrl}/org/setup`;

    // Build checkout params with org metadata
    // The webhook will read this metadata and create the organization after payment
    const checkoutParams = new URLSearchParams({
      customer: stripeCustomerId,
      ...lineItemParams,
      mode: "subscription",
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      allow_promotion_codes: "true",
      // Session metadata - webhook reads this to create org
      "metadata[mode]": "self_service",
      "metadata[user_id]": user.id,
      "metadata[org_name]": orgMetadata.orgName,
      "metadata[org_type]": orgMetadata.orgType,
      "metadata[denomination]": orgMetadata.denomination || "",
      "metadata[leader_name]": orgMetadata.leaderName,
      "metadata[leader_email]": orgMetadata.leaderEmail,
      "metadata[org_email]": orgMetadata.orgEmail || "",
      "metadata[billing_interval]": billingInterval,
      "metadata[include_personal_subscription]": includePersonalSubscription ? "true" : "false",
      // Subscription metadata - persists on the subscription object
      "subscription_data[metadata][mode]": "self_service",
      "subscription_data[metadata][user_id]": user.id,
      "subscription_data[metadata][org_name]": orgMetadata.orgName,
      "subscription_data[metadata][org_type]": orgMetadata.orgType,
      "subscription_data[metadata][billing_interval]": billingInterval,
    });

    const checkoutResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${stripeSecretKey}`, 
        "Content-Type": "application/x-www-form-urlencoded" 
      },
      body: checkoutParams,
    });

    if (!checkoutResponse.ok) { 
      const err = await checkoutResponse.json(); 
      console.error("Stripe checkout error:", err);
      throw new Error(`Checkout failed: ${err.error?.message}`); 
    }
    const session = await checkoutResponse.json();

    console.log(`Self-service checkout created: session=${session.id}, user=${user.id}, org_name=${orgMetadata.orgName}`);

    // Return checkout_url per frontend SSOT (OrgSetup.tsx expects checkout_url or url)
    return new Response(
      JSON.stringify({ checkout_url: session.url, url: session.url, session_id: session.id }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }), 
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
