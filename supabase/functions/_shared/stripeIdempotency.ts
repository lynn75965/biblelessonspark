// Hand-maintained (Rule #24) -- backend-only Stripe idempotency-key
// derivation, no frontend counterpart. Shared by every function that
// creates a mutating Stripe checkout session so the bucket width and key
// format can never drift between call sites.
//
// A double-click, a back-button resubmit, a second tab, or a network-level
// retry can all trigger the same logical checkout twice within seconds.
// This key lets Stripe recognize the retry and return the original
// session instead of creating a second one. It is deliberately coarse
// (bucketed, not per-millisecond) -- a fresh random value per attempt
// would provide no protection at all, since a retry would generate a
// different key and Stripe would treat it as a brand new request.
//
// ACCEPTED EDGE CASE: two accidental attempts that straddle a bucket
// boundary land in different buckets and both succeed. Narrow window,
// accepted deliberately -- a rolling window would require state that does
// not currently exist. See PROJECT_MASTER.md for the design record.

export const BUCKET_MS = 5 * 60 * 1000; // 5 minutes

export function buildIdempotencyKey(operation: string, parts: string[]): string {
  const bucket = Math.floor(Date.now() / BUCKET_MS);
  return [operation, ...parts, String(bucket)].join(':');
}
