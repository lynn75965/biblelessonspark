import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_ORG_WEBHOOK_SECRET");
    if (!stripeSecretKey || !webhookSecret) throw new Error("Missing Stripe configuration");

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");
    if (!signature) throw new Error("No Stripe signature");

    const sigParts = signature.split(",").reduce((acc, part) => { const [key, value] = part.split("="); acc[key] = value; return acc; }, {} as Record<string, string>);
    const timestamp = sigParts["t"];
    const expectedSig = sigParts["v1"];

    const signedPayload = `${timestamp}.${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(webhookSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
    const computedSig = Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
    if (computedSig !== expectedSig) throw new Error("Invalid signature");

    const event = JSON.parse(body);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing event: ${event.type}`);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata || {};
      if (metadata.organization_id && metadata.tier) {
        const { data: tierConfig } = await supabase.from("org_tier_config").select("lessons_limit").eq("tier", metadata.tier).single();
        if (tierConfig) {
          const now = new Date();
          const periodEnd = new Date(now);
          if (metadata.billing_interval === "annual") { periodEnd.setFullYear(periodEnd.getFullYear() + 1); } else { periodEnd.setMonth(periodEnd.getMonth() + 1); }
          await supabase.from("organizations").update({
            subscription_tier: metadata.tier, stripe_subscription_id: session.subscription, subscription_status: "active",
            lessons_limit: tierConfig.lessons_limit, lessons_used_this_period: 0,
            current_period_start: now.toISOString(), current_period_end: periodEnd.toISOString(), billing_interval: metadata.billing_interval,
          }).eq("id", metadata.organization_id);
          console.log(`Org ${metadata.organization_id} subscribed to ${metadata.tier}`);
        }
      } else if (metadata.purchase_type === "lesson_pack") {
        const lessonsToAdd = parseInt(metadata.lessons_included, 10);
        const { data: org } = await supabase.from("organizations").select("bonus_lessons").eq("id", metadata.organization_id).single();
        await supabase.from("organizations").update({ bonus_lessons: (org?.bonus_lessons || 0) + lessonsToAdd }).eq("id", metadata.organization_id);
        await supabase.from("org_lesson_pack_purchases").insert({
          organization_id: metadata.organization_id, pack_type: metadata.pack_type, lessons_added: lessonsToAdd,
          amount_paid: session.amount_total / 100, stripe_checkout_session_id: session.id, stripe_payment_intent_id: session.payment_intent,
        });
        console.log(`Org ${metadata.organization_id} purchased ${lessonsToAdd} bonus lessons`);
      } else if (metadata.purchase_type === "onboarding") {
        await supabase.from("org_onboarding_purchases").insert({
          organization_id: metadata.organization_id, onboarding_type: metadata.onboarding_type,
          amount_paid: session.amount_total / 100, stripe_checkout_session_id: session.id, stripe_payment_intent_id: session.payment_intent, status: "pending",
        });
        console.log(`Org ${metadata.organization_id} purchased ${metadata.onboarding_type} onboarding`);
      }
    } else if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const metadata = subscription.metadata || {};
      if (metadata.organization_id) {
        const priceId = subscription.items.data[0]?.price?.id;
        const { data: tierConfig } = await supabase.from("org_tier_config").select("tier, lessons_limit").or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_annual.eq.${priceId}`).single();
        const updateData: any = { subscription_status: subscription.status };
        if (tierConfig) { updateData.subscription_tier = tierConfig.tier; updateData.lessons_limit = tierConfig.lessons_limit; }
        if (subscription.current_period_start) { updateData.current_period_start = new Date(subscription.current_period_start * 1000).toISOString(); }
        if (subscription.current_period_end) { updateData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString(); }
        await supabase.from("organizations").update(updateData).eq("id", metadata.organization_id);
        console.log(`Org ${metadata.organization_id} subscription updated`);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const metadata = event.data.object.metadata || {};
      if (metadata.organization_id) {
        await supabase.from("organizations").update({ subscription_tier: null, stripe_subscription_id: null, subscription_status: "cancelled", lessons_limit: 0 }).eq("id", metadata.organization_id);
        console.log(`Org ${metadata.organization_id} subscription cancelled`);
      }
    } else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const subResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${invoice.subscription}`, { headers: { "Authorization": `Bearer ${stripeSecretKey}` } });
        const subscription = await subResponse.json();
        if (subscription.metadata?.organization_id) {
          await supabase.from("organizations").update({ subscription_status: "past_due" }).eq("id", subscription.metadata.organization_id);
          console.log(`Org ${subscription.metadata.organization_id} payment failed`);
        }
      }
    } else if (event.type === "invoice.paid") {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const subResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${invoice.subscription}`, { headers: { "Authorization": `Bearer ${stripeSecretKey}` } });
        const subscription = await subResponse.json();
        if (subscription.metadata?.organization_id) {
          await supabase.from("organizations").update({
            subscription_status: "active", lessons_used_this_period: 0,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }).eq("id", subscription.metadata.organization_id);
          console.log(`Org ${subscription.metadata.organization_id} invoice paid, lessons reset`);
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});
