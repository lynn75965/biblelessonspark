// ============================================================
// BIBLELESSONSPARK - STRIPE WEBHOOK
// Location: supabase/functions/stripe-webhook/index.ts
// ============================================================
// Handles:
//   1. Personal subscription checkouts
//   2. Org subscription checkouts for existing orgs
//   3. Self-service org creation - creates org after payment
//
// SSOT COMPLIANCE (Feb 26, 2026):
//   - Tier resolution uses resolveTierFromPriceId from pricingConfig.ts
//   - NEVER queries tier_config or pricing_plans for tier mapping
//   - Fallback: resolves user by Stripe customer email when
//     metadata.user_id is missing
// ============================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import {
  resolveTierFromPriceId,
  TIER_LESSON_LIMITS,
  type SubscriptionTier,
} from '../_shared/pricingConfig.ts';

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

// ============================================================
// HELPER: Find user ID from Stripe customer
// Tries: 1) user_subscriptions by stripe_customer_id
//        2) profiles by email (from Stripe customer object)
// This ensures webhook works even without metadata.user_id
// ============================================================
async function resolveUserIdFromCustomer(
  supabase: any,
  customerId: string
): Promise<string | null> {
  // Try 1: Look up by stripe_customer_id in user_subscriptions
  const { data: existingSub } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customerId)
    .single();

  if (existingSub?.user_id) {
    console.log(`Resolved user by stripe_customer_id: ${existingSub.user_id}`);
    return existingSub.user_id;
  }

  // Try 2: Get email from Stripe customer, look up in profiles
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (customer && !customer.deleted && customer.email) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customer.email)
        .single();

      if (profile?.id) {
        console.log(`Resolved user by Stripe customer email (${customer.email}): ${profile.id}`);
        return profile.id;
      } else {
        console.error(`No profile found for Stripe customer email: ${customer.email}`);
      }
    }
  } catch (err) {
    console.error("Error retrieving Stripe customer:", err);
  }

  return null;
}

// ============================================================
// CHECKOUT COMPLETE HANDLER
// ============================================================
async function handleCheckoutComplete(supabase: any, session: Stripe.Checkout.Session) {
  console.log("Checkout completed:", session.id);
  
  const metadata = session.metadata || {};
  const mode = metadata.mode;

  // ============================================================
  // SELF-SERVICE ORG CREATION MODE
  // ============================================================
  if (mode === "self_service") {
    console.log("Self-service org creation mode detected");
    await handleSelfServiceOrgCreation(supabase, session);
    return;
  }

  // ============================================================
  // EXISTING ORG SUBSCRIPTION MODE
  // ============================================================
  if (metadata.organization_id) {
    console.log("Existing org subscription mode detected");
    await handleExistingOrgCheckout(supabase, session);
    return;
  }

  // ============================================================
  // PERSONAL SUBSCRIPTION MODE
  // Resolve user from metadata OR by Stripe customer email
  // ============================================================
  let userId = metadata.user_id;
  
  if (!userId && session.customer) {
    console.log("No user_id in metadata - resolving from Stripe customer");
    userId = await resolveUserIdFromCustomer(supabase, session.customer as string);
  }
  
  if (!userId) {
    console.error("Could not resolve user_id from metadata or Stripe customer");
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

// ============================================================
// SELF-SERVICE ORG CREATION
// Creates organization after successful payment
// ============================================================
async function handleSelfServiceOrgCreation(supabase: any, session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  
  const userId = metadata.user_id;
  const orgName = metadata.org_name;
  const orgType = metadata.org_type;
  const denomination = metadata.denomination || null;
  const leaderName = metadata.leader_name;
  const leaderEmail = metadata.leader_email;
  const orgEmail = metadata.org_email || null;
  const billingInterval = metadata.billing_interval;
  const includePersonalSub = metadata.include_personal_subscription === "true";

  if (!userId || !orgName || !orgType) {
    console.error("Missing required metadata for self-service org creation:", metadata);
    return;
  }

  console.log(`Creating org: ${orgName} for user: ${userId}`);

  // Get the subscription to determine tier
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription ID in self-service checkout");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Resolve org tier from price ID using SSOT
  const priceId = subscription.items.data[0]?.price.id;
  const orgTier = resolveTierFromPriceId(priceId || '') || 'starter';
  const lessonsLimit = TIER_LESSON_LIMITS[orgTier as SubscriptionTier] || 25;

  // 1. Create the organization
  const { data: newOrg, error: orgError } = await supabase
    .from("organizations")
    .insert({
      name: orgName,
      org_type: orgType,
      denomination: denomination,
      email: orgEmail || leaderEmail,
      created_by: userId,
      stripe_customer_id: session.customer as string,
      subscription_tier: orgTier,
      subscription_status: "active",
      billing_interval: billingInterval,
      lessons_remaining: lessonsLimit,
      lessons_limit: lessonsLimit,
      is_active: true,
    })
    .select("id")
    .single();

  if (orgError) {
    console.error("Error creating organization:", orgError);
    return;
  }

  const orgId = newOrg.id;
  console.log(`Organization created: ${orgId}`);

  // 2. Add user as org owner/manager
  const { error: memberError } = await supabase
    .from("organization_members")
    .insert({
      organization_id: orgId,
      user_id: userId,
      role: "owner",
      email: leaderEmail,
      display_name: leaderName,
      status: "active",
      joined_at: new Date().toISOString(),
    });

  if (memberError) {
    console.error("Error adding org member:", memberError);
  } else {
    console.log(`User ${userId} added as owner of org ${orgId}`);
  }

  // 3. Create org_subscriptions record
  const { error: orgSubError } = await supabase
    .from("org_subscriptions")
    .insert({
      organization_id: orgId,
      stripe_customer_id: session.customer as string,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      tier: orgTier,
      status: "active",
      billing_interval: billingInterval === "annual" ? "year" : "month",
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      lessons_limit: lessonsLimit,
      lessons_used_this_period: 0,
    });

  if (orgSubError) {
    console.error("Error creating org subscription:", orgSubError);
  } else {
    console.log(`Org subscription created for org ${orgId}`);
  }

  // 4. If personal subscription was included, handle it
  if (includePersonalSub && subscription.items.data.length > 1) {
    console.log("Processing bundled personal subscription");
    const personalPriceId = subscription.items.data[1]?.price.id;
    
    if (personalPriceId) {
      const personalTier = resolveTierFromPriceId(personalPriceId) || 'personal';
      const personalLimit = TIER_LESSON_LIMITS[personalTier] || 20;

      await supabase.from("user_subscriptions").upsert({
        user_id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscriptionId,
        stripe_price_id: personalPriceId,
        tier: personalTier,
        status: "active",
        billing_interval: billingInterval === "annual" ? "year" : "month",
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        lessons_limit: personalLimit,
        lessons_used: 0,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      await supabase.from("profiles").update({ subscription_tier: personalTier }).eq("id", userId);
      console.log(`Personal subscription activated for user ${userId}: ${personalTier}`);
    }
  }

  // 5. Update user's profile with primary_organization_id
  await supabase
    .from("profiles")
    .update({ primary_organization_id: orgId })
    .eq("id", userId);

  console.log(`Self-service org creation complete: org=${orgId}, user=${userId}, tier=${orgTier}`);
}

// ============================================================
// EXISTING ORG CHECKOUT
// Updates subscription for an existing organization
// ============================================================
async function handleExistingOrgCheckout(supabase: any, session: Stripe.Checkout.Session) {
  const metadata = session.metadata || {};
  const orgId = metadata.organization_id;
  const tier = metadata.tier;
  const billingInterval = metadata.billing_interval;

  if (!orgId) {
    console.error("No organization_id in metadata");
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error("No subscription ID in checkout session");
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  // Use SSOT for lesson limit
  const resolvedTier = resolveTierFromPriceId(priceId || '') || tier || 'starter';
  const lessonsLimit = TIER_LESSON_LIMITS[resolvedTier as SubscriptionTier] || 25;

  // Update organization
  await supabase
    .from("organizations")
    .update({
      subscription_tier: resolvedTier,
      subscription_status: "active",
      billing_interval: billingInterval,
      stripe_customer_id: session.customer as string,
      lessons_limit: lessonsLimit,
      lessons_remaining: lessonsLimit,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orgId);

  // Upsert org_subscriptions
  await supabase.from("org_subscriptions").upsert({
    organization_id: orgId,
    stripe_customer_id: session.customer as string,
    stripe_subscription_id: subscriptionId,
    stripe_price_id: priceId,
    tier: resolvedTier,
    status: "active",
    billing_interval: billingInterval === "annual" ? "year" : "month",
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    lessons_limit: lessonsLimit,
    lessons_used_this_period: 0,
  }, { onConflict: "organization_id" });

  console.log(`Existing org subscription updated: org=${orgId}, tier=${resolvedTier}`);
}

// ============================================================
// SUBSCRIPTION UPDATE HANDLER
// ============================================================
async function handleSubscriptionUpdate(supabase: any, subscription: Stripe.Subscription) {
  console.log("Subscription updated:", subscription.id);
  
  // Check if this is an org subscription
  const orgMetadata = subscription.metadata;
  if (orgMetadata?.organization_id || orgMetadata?.mode === "self_service") {
    console.log("Org subscription update - handled by checkout.session.completed");
    return;
  }

  // Personal subscription update - resolve user
  const customerId = subscription.customer as string;
  const userId = await resolveUserIdFromCustomer(supabase, customerId);
    
  if (userId) {
    await updateUserSubscription(supabase, userId, customerId, subscription);
  } else {
    console.error("Could not resolve user for subscription update:", subscription.id);
  }
}

// ============================================================
// SUBSCRIPTION CANCELED HANDLER
// ============================================================
async function handleSubscriptionCanceled(supabase: any, subscription: Stripe.Subscription) {
  console.log("Subscription canceled:", subscription.id);
  
  // Check if org subscription
  const { data: orgSub } = await supabase
    .from("org_subscriptions")
    .select("organization_id")
    .eq("stripe_subscription_id", subscription.id)
    .single();

  if (orgSub?.organization_id) {
    // Handle org subscription cancellation
    await supabase
      .from("org_subscriptions")
      .update({
        status: "canceled",
        canceled_at: new Date().toISOString(),
      })
      .eq("stripe_subscription_id", subscription.id);

    await supabase
      .from("organizations")
      .update({
        subscription_status: "canceled",
        updated_at: new Date().toISOString(),
      })
      .eq("id", orgSub.organization_id);

    console.log(`Org subscription canceled: org=${orgSub.organization_id}`);
    return;
  }

  // Personal subscription cancellation
  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      tier: "free",
      status: "canceled",
      lessons_limit: TIER_LESSON_LIMITS.free,
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

// ============================================================
// PAYMENT SUCCEEDED HANDLER
// ============================================================
async function handlePaymentSucceeded(supabase: any, invoice: Stripe.Invoice) {
  console.log("Payment succeeded for invoice:", invoice.id);
  if (!invoice.subscription) return;

  // Check if org subscription
  const { data: orgSub } = await supabase
    .from("org_subscriptions")
    .select("organization_id, lessons_limit")
    .eq("stripe_subscription_id", invoice.subscription)
    .single();

  if (orgSub?.organization_id) {
    // Reset org lesson pool
    await supabase
      .from("org_subscriptions")
      .update({
        status: "active",
        lessons_used_this_period: 0,
      })
      .eq("stripe_subscription_id", invoice.subscription);

    await supabase
      .from("organizations")
      .update({
        lessons_remaining: orgSub.lessons_limit,
        subscription_status: "active",
      })
      .eq("id", orgSub.organization_id);

    console.log(`Org lesson pool reset: org=${orgSub.organization_id}`);
    return;
  }

  // Personal subscription payment
  await supabase
    .from("user_subscriptions")
    .update({
      status: "active",
      lessons_used: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", invoice.subscription);
}

// ============================================================
// PAYMENT FAILED HANDLER
// ============================================================
async function handlePaymentFailed(supabase: any, invoice: Stripe.Invoice) {
  console.log("Payment failed for invoice:", invoice.id);
  if (!invoice.subscription) return;

  // Check if org subscription
  const { data: orgSub } = await supabase
    .from("org_subscriptions")
    .select("organization_id")
    .eq("stripe_subscription_id", invoice.subscription)
    .single();

  if (orgSub?.organization_id) {
    await supabase
      .from("org_subscriptions")
      .update({ status: "past_due" })
      .eq("stripe_subscription_id", invoice.subscription);

    await supabase
      .from("organizations")
      .update({ subscription_status: "past_due" })
      .eq("id", orgSub.organization_id);

    console.log(`Org payment failed: org=${orgSub.organization_id}`);
    return;
  }

  // Personal subscription
  await supabase
    .from("user_subscriptions")
    .update({ status: "past_due", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", invoice.subscription);
}

// ============================================================
// UPDATE USER SUBSCRIPTION (personal subscriptions)
// SSOT: Uses resolveTierFromPriceId from pricingConfig.ts
// NEVER queries tier_config or pricing_plans for tier mapping
// ============================================================
async function updateUserSubscription(
  supabase: any,
  userId: string,
  customerId: string,
  subscription: Stripe.Subscription
) {
  const priceId = subscription.items.data[0]?.price.id;
  
  // SSOT: Resolve tier from price ID using pricingConfig.ts
  const tier: SubscriptionTier = resolveTierFromPriceId(priceId || '') || 'personal';
  const lessonsLimit = TIER_LESSON_LIMITS[tier] || 20;

  console.log(`SSOT tier resolution: priceId=${priceId} -> tier=${tier}, limit=${lessonsLimit}`);

  const status = subscription.status === "active" ? "active" : 
                 subscription.status === "trialing" ? "trialing" :
                 subscription.status === "past_due" ? "past_due" : "incomplete";
  const interval = subscription.items.data[0]?.price.recurring?.interval;
  const billingInterval = interval === "year" ? "year" : "month";

  const { error: upsertError } = await supabase.from("user_subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    tier: tier,
    status: status,
    billing_interval: billingInterval,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    lessons_limit: lessonsLimit,
    lessons_used: 0,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (upsertError) {
    console.error(`Error upserting user_subscriptions for ${userId}:`, upsertError);
    return;
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ subscription_tier: tier })
    .eq("id", userId);

  if (profileError) {
    console.error(`Error updating profile tier for ${userId}:`, profileError);
    return;
  }

  console.log(`Updated user ${userId}: tier=${tier}, limit=${lessonsLimit}, interval=${billingInterval}`);
}
