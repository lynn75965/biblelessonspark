/**
 * _shared/generationAdmission.ts
 *
 * B8 Session 1 -- thin wrapper around claim_generation_slot() /
 * release_generation_slot() (supabase/migrations/
 * 20260719120000_concurrency_admission_control.sql). B8 Session 2 adds
 * renewGenerationSlot() (heartbeat, generate-lesson only) and
 * setModelCooldown() (the cooldown writer, called from
 * _shared/anthropicRetry.ts's give-up path) -- both backed by RPCs added
 * in supabase/migrations/20260719140000_generate_lesson_admission_wiring.sql.
 * Caps, buckets, stale thresholds, and the heartbeat/cooldown durations come
 * from the synced _shared/concurrencyConfig.ts mirror (Rule #23) -- never
 * hardcoded here.
 *
 * Hand-maintained shared utility (Rule #24) -- not itself in FILES_TO_SYNC.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CONCURRENCY_CONFIG, type ConcurrencySource, type ModelBucket } from './concurrencyConfig.ts';

export type AdmissionRejectReason = 'cooldown' | 'at_capacity';

export type AdmissionResult =
  | { claimed: true; slotId: string }
  | { claimed: false; reason: AdmissionRejectReason };

/**
 * Claims one concurrency slot for `source`. Fails OPEN, not closed, on an
 * RPC error -- deliberately the opposite posture from edgeRateLimit.ts's
 * checkRateLimits(). Rate limiting is a security/abuse control (fail
 * closed is correct there); this is a load-shedding courtesy against a
 * self-imposed ceiling that no vendor limit actually requires (see
 * B8_CONCURRENCY_ADMISSION_DESIGN.md derivation). A transient DB error on
 * THIS specific RPC would otherwise become a new single point of failure
 * bigger than the problem it solves -- it's a shared bucket-level lock, so
 * a systemic DB hiccup could otherwise reject every in-flight request
 * across all 5 (soon 6) generators simultaneously. Failing open here just
 * means: on a DB error, the request proceeds unthrottled for that one
 * attempt, exactly as if admission control didn't exist yet.
 */
export async function claimGenerationSlot(
  supabase: SupabaseClient,
  params: { source: ConcurrencySource; userId: string | null },
): Promise<AdmissionResult> {
  const bucket = CONCURRENCY_CONFIG.sourceBucket[params.source];
  const ceiling = CONCURRENCY_CONFIG.bucketCeiling[bucket];
  const ttlSeconds = CONCURRENCY_CONFIG.staleThresholdSeconds[params.source];

  const { data, error } = await supabase.rpc('claim_generation_slot', {
    p_source: params.source,
    p_model_bucket: bucket,
    p_user_id: params.userId,
    p_ceiling: ceiling,
    p_ttl_seconds: ttlSeconds,
  });

  if (error) {
    console.error('[generationAdmission] claim_generation_slot error (failing open):', params.source, error.message);
    return { claimed: true, slotId: '' };
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.claimed) {
    return { claimed: false, reason: (row?.reason as AdmissionRejectReason) ?? 'at_capacity' };
  }
  return { claimed: true, slotId: row.slot_id as string };
}

/**
 * Releases a previously claimed slot. Best-effort, matching
 * refundRateLimits()'s posture: a release failure is logged and swallowed
 * rather than surfaced, since a leaked slot self-heals via the claim RPC's
 * own stale-row reclamation (Resolution 2) at worst
 * staleThresholdSeconds[source] later -- never permanently lost capacity.
 * No-ops on the '' sentinel slotId returned by a fail-open claim (nothing
 * was ever inserted, so there is nothing to release).
 */
export async function releaseGenerationSlot(supabase: SupabaseClient, slotId: string): Promise<void> {
  if (!slotId) return;
  try {
    const { error } = await supabase.rpc('release_generation_slot', { p_slot_id: slotId });
    if (error) {
      console.error('[generationAdmission] release_generation_slot error (self-heals at TTL expiry):', slotId, error.message);
    }
  } catch (e) {
    console.error('[generationAdmission] release_generation_slot threw (self-heals at TTL expiry):', slotId, (e as Error)?.message ?? e);
  }
}

/**
 * B8 Session 2, generate-lesson only. Renews a claimed slot's expiry --
 * called on a heartbeat tick (piggybacked on generate-lesson's existing
 * 5s stall-guard cadence, but a SEPARATE interval with its own, longer
 * lifetime spanning Phase 1 + Phase 2, not stallTimer itself -- see the
 * Session 2 design note on why the two must not share one interval).
 * Returns whether a row was actually found and updated: `false` means
 * the slot was already stale-swept by another claim's reclamation step
 * before this heartbeat reached it. The CALLER decides what to do with
 * that (generate-lesson's answer: log it, stop heartbeating, and keep
 * the generation running -- a live, successful stream must never be
 * aborted over an admission-control bookkeeping race). This function
 * itself makes no behavioral decision, only reports the fact.
 */
export async function renewGenerationSlot(supabase: SupabaseClient, slotId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('renew_generation_slot', {
      p_slot_id: slotId,
      p_renewal_seconds: CONCURRENCY_CONFIG.heartbeat.renewalWindowSeconds,
    });
    if (error) {
      console.error('[generationAdmission] renew_generation_slot error:', slotId, error.message);
      return true; // unknown state -- don't treat a transient RPC error as "slot is gone"
    }
    return data === true;
  } catch (e) {
    console.error('[generationAdmission] renew_generation_slot threw:', slotId, (e as Error)?.message ?? e);
    return true; // same reasoning -- a thrown network error isn't evidence the slot was reclaimed
  }
}

/**
 * B8 Session 2. Called from _shared/anthropicRetry.ts's give-up path when
 * retries+fallback are exhausted on 'overloaded' or 'rate_limit' only --
 * see anthropicRetry.ts for the exact trigger condition. Best-effort: a
 * failure to set the cooldown is logged and swallowed, matching
 * releaseGenerationSlot()'s posture -- this is an optimization (stop
 * hammering an overloaded bucket sooner), not a security control, so a
 * DB hiccup here must never surface as a secondary failure on top of the
 * Anthropic failure already being reported to the caller.
 */
export async function setModelCooldown(supabase: SupabaseClient, modelBucket: ModelBucket, seconds: number): Promise<void> {
  try {
    const { error } = await supabase.rpc('set_model_cooldown', {
      p_model_bucket: modelBucket,
      p_seconds: seconds,
    });
    if (error) {
      console.error('[generationAdmission] set_model_cooldown error (non-fatal):', modelBucket, error.message);
    }
  } catch (e) {
    console.error('[generationAdmission] set_model_cooldown threw (non-fatal):', modelBucket, (e as Error)?.message ?? e);
  }
}
