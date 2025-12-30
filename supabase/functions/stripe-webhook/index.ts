// ============================================================
// LESSONSPARK USA - STRIPE WEBHOOK
// Location: supabase/functions/stripe-webhook/index.ts
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!signature || !webhookSecret) {
      console.error("Missing signature or webhook secret");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Processing Stripe event: ${event.type}`);
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(supabase, session);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabase, subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabase, invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleCheckoutComplete(supabase: any, session: Stripe.Checkout.Session) {
  console.log("Checkout completed:", session.id);
  const userId = session.metadata?.user_id;
  if (!userId) {
    console.error("No user_id in checkout session metadata");
    return;
  }
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription ID in checkout session");
    return;
  }
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await updateUserSubscription(supabase, userId, session.customer as string, subscription);
}

async function handleSubscriptionUpdate(supabase: any, subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);
  const { data: existingSub } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", subscription.customer)
    .single();
  if (existingSub?.user_id) {
    await updateUserSubscription(supabase, existingSub.user_id, subscription.customer as string, subscription);
  }
}

async function handleSubscriptionCanceled(supabase: any, subscription: Stripe.Subscription) {
  console.log("Subscription canceled:", subscription.id);
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      tier: "free",
      status: "canceled",
      canceled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id);
  if (error) console.error("Error updating canceled subscription:", error);

  const { data: sub } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();
  if (sub?.user_id) {
    await supabase.from("profiles").update({ subscription_tier: "free" }).eq("id", sub.user_id);
  }
}

async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log("Payment succeeded for invoice:", invoice.id);
  if (!invoice.subscription) return;
  await supabase
    .from("user_subscriptions")
    .update({
      status: "active",
      lessons_used_this_period: 0,
      period_reset_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", invoice.subscription);
}

async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  console.log("Payment failed for invoice:", invoice.id);
  if (!invoice.subscription) return;
  await supabase
    .from("user_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", invoice.subscription);
}

async function updateUserSubscription(supabase: any, userId: string, customerId: string, subscription: Stripe.Subscription) {
  const priceId = subscription.items.data[0]?.price.id;
  const { data: plan } = await supabase
    .from("pricing_plans")
    .select("tier")
    .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_annual.eq.${priceId}`)
    .single();

  const tier = plan?.tier || "personal";
  const status = subscription.status === "active" ? "active" : 
                 subscription.status === "trialing" ? "trialing" :
                 subscription.status === "past_due" ? "past_due" : "incomplete";
  const interval = subscription.items.data[0]?.price.recurring?.interval;
  const billingInterval = interval === "year" ? "year" : "month";

  await supabase.from("user_subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    tier: tier,
    status: status,
    billing_interval: billingInterval,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    lessons_used_this_period: 0,
    period_reset_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  await supabase.from("profiles").update({ subscription_tier: tier }).eq("id", userId);
  console.log(`Updated user ${userId} to tier: ${tier}`);
}
