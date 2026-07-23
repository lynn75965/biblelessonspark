import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { timingSafeEqual } from "https://deno.land/std@0.168.0/crypto/timing_safe_equal.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ORG_TIERS } from "../_shared/pricingConfig.ts";
import type { SubscriptionTier } from "../_shared/pricingConfig.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

// Mirrors the Stripe SDK's Webhook.DEFAULT_TOLERANCE (stripe-node
// v14.21.0, src/Webhooks.ts) -- confirmed 300 seconds (5 minutes) from
// the pinned package's own source this session, not assumed.
const REPLAY_TOLERANCE_SECONDS = 300;

// expectedSig is validated as exactly 64 lowercase hex chars before this
// is ever called (see the malformed-header guard below), so this always
// produces exactly 32 bytes -- the same length as the computed SHA-256
// HMAC digest it gets compared against.
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

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

    // Strict parse: split each comma-separated part on the FIRST "="
    // only. The prior `part.split("=")` destructured as [key, value]
    // truncated any value containing "=" -- this doesn't.
    const sigFields: Record<string, string> = {};
    for (const part of signature.split(",")) {
      const eqIndex = part.indexOf("=");
      if (eqIndex === -1) continue;
      sigFields[part.slice(0, eqIndex)] = part.slice(eqIndex + 1);
    }
    const timestampRaw = sigFields["t"];
    const expectedSig = sigFields["v1"];

    // Malformed-header guard -- reject BEFORE any HMAC work or DB write.
    // Logged distinctly from a genuine signature mismatch so the two
    // are distinguishable in the logs; the client-facing error stays
    // the same generic "Invalid signature" shape either way, so a
    // caller can't learn which specific check failed.
    const timestampNum = Number(timestampRaw);
    const hasValidTimestamp = !!timestampRaw && Number.isFinite(timestampNum);
    const hasValidSigHex = !!expectedSig && /^[0-9a-f]{64}$/.test(expectedSig);
    if (!hasValidTimestamp || !hasValidSigHex) {
      console.error("Malformed Stripe-Signature header");
      throw new Error("Invalid signature");
    }

    // Replay-window guard -- mirrors the Stripe SDK's own tolerance
    // check (constructEventAsync -> DEFAULT_TOLERANCE). t= is UNIX
    // seconds; Date.now() is milliseconds, so divide by 1000 before
    // comparing. Rejects both stale AND implausibly-future timestamps.
    const nowSeconds = Math.floor(Date.now() / 1000);
    if (Math.abs(nowSeconds - timestampNum) > REPLAY_TOLERANCE_SECONDS) {
      console.error(`Stripe-Signature timestamp outside tolerance: now=${nowSeconds} t=${timestampNum}`);
      throw new Error("Invalid signature");
    }

    const signedPayload = `${timestampRaw}.${body}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey("raw", encoder.encode(webhookSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));

    // Constant-time comparison via Deno std's timingSafeEqual, which
    // compares raw bytes, not strings. expectedSig is already validated
    // above as exactly 64 lowercase hex chars (a 32-byte SHA-256
    // digest), so decoding it back to bytes and comparing directly
    // against the computed digest bytes avoids ever needing to
    // hex-encode the computed side just for a string comparison --
    // both operands are guaranteed the same 32-byte length by
    // construction, which is required for timingSafeEqual to be
    // meaningful (it does not itself define behavior for mismatched
    // lengths beyond returning false).
    if (!timingSafeEqual(new Uint8Array(signatureBuffer), hexToBytes(expectedSig))) {
      throw new Error("Invalid signature");
    }

    const event = JSON.parse(body);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Processing event: ${event.type}`);

    // Idempotency gate -- insert the event ID before any state change. A
    // UNIQUE violation (Postgres code 23505) means this exact event was
    // already processed; return 200 immediately without re-running any
    // handler, matching Stripe's expectation for a successfully-handled
    // delivery.
    const { error: idempotencyError } = await supabase
      .from("stripe_events")
      .insert({ event_id: event.id, event_type: event.type });

    if (idempotencyError) {
      if (idempotencyError.code === "23505") {
        console.log(`Duplicate event ${event.id} (${event.type}) -- already processed, skipping`);
        return new Response(JSON.stringify({ received: true, duplicate: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }
      // Fail CLOSED -- cannot confirm this event has not already been
      // processed, so reject with a non-2xx and let Stripe retry later
      // rather than risk double-processing a real event.
      console.error(`stripe_events insert failed for ${event.id}, failing closed:`, idempotencyError.message);
      return new Response(JSON.stringify({ error: "Idempotency check failed" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
    }

    try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata || {};
      if (metadata.organization_id && metadata.tier) {
        // SSOT: ORG_TIERS in pricingConfig.ts is the authority for org tier
        // limits -- metadata.tier carries an ORG_TIERS name, never a
        // SubscriptionTier name, so TIER_LESSON_LIMITS is the wrong
        // dictionary for this lookup entirely. Never query org_tier_config.
        const orgTierConfig = ORG_TIERS.find(t => t.tier === metadata.tier);
        if (!orgTierConfig) {
          console.error(`Unknown org tier in checkout metadata: ${metadata.tier} (org ${metadata.organization_id}) -- refusing to guess a limit`);
        } else {
          const lessonsLimit = orgTierConfig.lessonsLimit;
          const now = new Date();
          const periodEnd = new Date(now);
          if (metadata.billing_interval === "annual") { periodEnd.setFullYear(periodEnd.getFullYear() + 1); } else { periodEnd.setMonth(periodEnd.getMonth() + 1); }
          await supabase.from("organizations").update({
            subscription_tier: metadata.tier, stripe_subscription_id: session.subscription, subscription_status: "active",
            lessons_limit: lessonsLimit, lessons_used_this_period: 0,
            current_period_start: now.toISOString(), current_period_end: periodEnd.toISOString(), billing_interval: metadata.billing_interval,
          }).eq("id", metadata.organization_id);
          console.log(`Org ${metadata.organization_id} subscribed to ${metadata.tier} (limit: ${lessonsLimit})`);
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
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.created") {
      const subscription = event.data.object;
      const metadata = subscription.metadata || {};
      if (metadata.organization_id) {
        const priceId = subscription.items.data[0]?.price?.id;
        // SSOT: ORG_TIERS in pricingConfig.ts is the authority for org tier
        // limits -- resolve directly against ORG_TIERS by Stripe price ID,
        // matching create-org-checkout-session's own SSOT gate. Never route
        // an org price through resolveTierFromPriceId/TIER_LESSON_LIMITS --
        // those translate into the unrelated individual-plan SubscriptionTier
        // vocabulary, which no org-side reader of subscription_tier expects.
        const orgTierConfig = ORG_TIERS.find(t => t.priceMonthly === priceId || t.priceAnnual === priceId);
        const updateData: {
          subscription_status: string;
          subscription_tier?: string;
          lessons_limit?: number;
          current_period_start?: string;
          current_period_end?: string;
        } = { subscription_status: subscription.status };
        if (orgTierConfig) {
          updateData.subscription_tier = orgTierConfig.tier;
          updateData.lessons_limit = orgTierConfig.lessonsLimit;
        } else {
          console.error(`Unresolvable org price ID in subscription ${subscription.id}: ${priceId} -- refusing to guess a tier/limit`);
        }
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
        if (!subResponse.ok) {
          const errText = await subResponse.text();
          console.error(`Failed to fetch subscription ${invoice.subscription}: ${subResponse.status} ${errText}`);
          throw new Error(`Stripe subscription fetch failed: ${subResponse.status}`);
        }
        const subscription = await subResponse.json();
        if (subscription.metadata?.organization_id) {
          await supabase.from("organizations").update({ subscription_status: "past_due" }).eq("id", subscription.metadata.organization_id);
          console.log(`Org ${subscription.metadata.organization_id} payment failed`);
        }
      }
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      if (invoice.subscription) {
        const subResponse = await fetch(`https://api.stripe.com/v1/subscriptions/${invoice.subscription}`, { headers: { "Authorization": `Bearer ${stripeSecretKey}` } });
        if (!subResponse.ok) {
          const errText = await subResponse.text();
          console.error(`Failed to fetch subscription ${invoice.subscription}: ${subResponse.status} ${errText}`);
          throw new Error(`Stripe subscription fetch failed: ${subResponse.status}`);
        }
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
    } catch (processingError) {
      // The event was marked seen above, but processing itself failed
      // partway through. Roll back the marker so Stripe's automatic
      // redelivery is not silently swallowed by the idempotency gate --
      // it will be reprocessed from scratch on retry instead of being
      // lost forever.
      console.error(`Processing failed for event ${event.id} after being marked seen -- rolling back idempotency marker so retry can reprocess:`, processingError.message);
      await supabase.from("stripe_events").delete().eq("event_id", event.id);
      throw processingError;
    }

    return new Response(JSON.stringify({ received: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
  } catch (error) {
    console.error("Webhook error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});
