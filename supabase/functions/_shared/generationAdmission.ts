/**
 * _shared/generationAdmission.ts
 *
 * B8 Session 1 -- thin wrapper around claim_generation_slot() /
 * release_generation_slot() (supabase/migrations/
 * 20260719120000_concurrency_admission_control.sql). Caps, buckets, and
 * stale thresholds come from the synced _shared/concurrencyConfig.ts
 * mirror (Rule #23) -- never hardcoded here.
 *
 * Hand-maintained shared utility (Rule #24) -- not itself in FILES_TO_SYNC.
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { CONCURRENCY_CONFIG, type ConcurrencySource } from './concurrencyConfig.ts';

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
