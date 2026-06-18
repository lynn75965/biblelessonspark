/**
 * _shared/edgeRateLimit.ts
 *
 * Shared fail-CLOSED rate limiting for PUBLIC edge functions. Backed by the
 * public.rate_limits table and the service_role-only increment_rate_limit RPC
 * (migration 20260618120000). Used by send-toolbelt-reflection and
 * toolbelt-reflect.
 *
 * Hand-maintained shared utility (Rule #24) -- not in FILES_TO_SYNC.
 */

export interface RateLimitScope {
  endpoint: string;     // namespacing tag, e.g. "toolbelt-reflect:ip"
  identifier: string;   // the IP, session id, email, or "GLOBAL"
  windowStart: string;  // ISO timestamp, truncated to the window start
  cap: number;          // max requests allowed within the window
}

export interface RateLimitResult {
  blocked: boolean;
  scope?: string;
  counts: Record<string, number>;
}

/**
 * Best-effort client IP. x-forwarded-for is client-spoofable in Supabase Edge
 * Functions; the real client IP is the RIGHTMOST entry (proxies append it), so
 * the leftmost value is never trusted. cf-connecting-ip (if Cloudflare-fronted)
 * is preferred. IP is a secondary control only -- per-identity and global caps
 * are the spoof-proof primary defenses.
 */
export function getClientIP(req: Request): string {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf.trim();
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((p) => p.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

/** Window-start ISO timestamps, truncated to the current UTC hour and day. */
export function windowStartsISO(): { hour: string; day: string } {
  const now = new Date();
  const hour = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), now.getUTCHours()
  )).toISOString();
  const day = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()
  )).toISOString();
  return { hour, day };
}

/**
 * Fail-CLOSED multi-scope rate limit. Increments each scope atomically via the
 * service_role-only increment_rate_limit RPC and rejects if any returned count
 * exceeds its cap. Any RPC error => blocked (fail closed). Scopes are checked
 * in order; the first to trip is returned.
 */
export async function checkRateLimits(
  supabase: any,
  scopes: RateLimitScope[],
): Promise<RateLimitResult> {
  const counts: Record<string, number> = {};
  for (const s of scopes) {
    try {
      const { data, error } = await supabase.rpc("increment_rate_limit", {
        p_endpoint: s.endpoint,
        p_identifier: s.identifier,
        p_window_start: s.windowStart,
      });
      if (error) {
        console.error("[edgeRateLimit] increment_rate_limit error (fail closed):", s.endpoint, error.message);
        return { blocked: true, scope: s.endpoint, counts };
      }
      const count = Array.isArray(data) ? data[0] : data;
      if (typeof count === "number") counts[s.endpoint] = count;
      if (typeof count !== "number" || count > s.cap) {
        return { blocked: true, scope: s.endpoint, counts };
      }
    } catch (e) {
      // A THROWN rejection (network blip, PostgREST unavailable, timeout) must
      // fail CLOSED -- same as a returned error -- never propagate as a 500.
      console.error("[edgeRateLimit] increment_rate_limit threw (fail closed):", s.endpoint, (e as Error)?.message ?? e);
      return { blocked: true, scope: s.endpoint, counts };
    }
  }
  return { blocked: false, counts };
}
