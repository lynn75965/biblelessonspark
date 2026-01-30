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

    const { organization_id, tier, billing_interval } = await req.json();
    if (!organization_id || !tier || !billing_interval) throw new Error("Missing required fields");
    if (!["monthly", "annual"].includes(billing_interval)) throw new Error("Invalid billing_interval");

    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, name, created_by, stripe_customer_id")
      .eq("id", organization_id)
      .single();
    if (orgError || !org) throw new Error("Organization not found");

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id, organization_role")
      .eq("id", user.id)
      .single();

    const isOrgCreator = org.created_by === user.id;
    const isOrgManager = profile?.organization_id === organization_id && profile?.organization_role === "manager";
    if (!isOrgCreator && !isOrgManager) throw new Error("Only organization managers can subscribe");

    const { data: tierConfig, error: tierError } = await supabase
      .from("org_tier_config")
      .select("*")
      .eq("tier", tier)
      .eq("is_active", true)
      .single();
    if (tierError || !tierConfig) throw new Error(`Invalid tier: ${tier}`);

    const stripePriceId = billing_interval === "annual" ? tierConfig.stripe_price_id_annual : tierConfig.stripe_price_id_monthly;
    if (!stripePriceId) throw new Error(`No Stripe price for ${tier} ${billing_interval}`);

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("Stripe secret key not configured");

    let stripeCustomerId = org.stripe_customer_id;

    if (!stripeCustomerId) {
      const { data: userProfile } = await supabase.from("profiles").select("email, full_name").eq("id", user.id).single();
      const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
        method: "POST",
        headers: { "Authorization": `Bearer ${stripeSecretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ email: userProfile?.email || user.email || "", name: org.name, "metadata[organization_id]": organization_id, "metadata[user_id]": user.id }),
      });
      if (!customerResponse.ok) { const err = await customerResponse.json(); throw new Error(`Failed to create customer: ${err.error?.message}`); }
      const customer = await customerResponse.json();
      stripeCustomerId = customer.id;
      await supabase.from("organizations").update({ stripe_customer_id: stripeCustomerId }).eq("id", organization_id);
    }

    const siteUrl = Deno.env.get("SITE_URL") || "https://biblelessonspark.com";
    const checkoutResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${stripeSecretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        customer: stripeCustomerId, "line_items[0][price]": stripePriceId, "line_items[0][quantity]": "1", mode: "subscription",
        success_url: `${siteUrl}/org-manager?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${siteUrl}/org-manager?checkout=cancelled`,
        "metadata[organization_id]": organization_id, "metadata[tier]": tier, "metadata[billing_interval]": billing_interval,
        "subscription_data[metadata][organization_id]": organization_id, "subscription_data[metadata][tier]": tier,
      }),
    });
    if (!checkoutResponse.ok) { const err = await checkoutResponse.json(); throw new Error(`Checkout failed: ${err.error?.message}`); }
    const session = await checkoutResponse.json();

    return new Response(JSON.stringify({ url: session.url, session_id: session.id }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});
