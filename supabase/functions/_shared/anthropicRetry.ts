/**
 * _shared/anthropicRetry.ts
 *
 * B4 -- centralized retry / model-fallback / graceful-degradation logic for
 * every Claude-calling edge function. Hand-maintained (Rule #24) -- no
 * frontend equivalent needed, since no frontend code calls Anthropic
 * directly. Pure data (timeouts, counts, backoff) lives in the SSOT at
 * _shared/modelConfig.ts (RETRY_CONFIG); this file is the orchestration logic
 * that consumes it.
 *
 * Two entry points:
 *   - callAnthropicNonStreaming(): used by generate-parable, reshape-lesson,
 *     generate-devotional, extract-lesson (all 5 call sites), toolbelt-reflect,
 *     and generate-lesson's non-streaming calls (guardrail rewrite, Phase 2
 *     supplements, Phase 2 rewrite).
 *   - openAnthropicStreamWithRetry(): used ONLY by generate-lesson's Phase-1
 *     SSE call. Retries/falls back ONLY the connection/first-byte phase --
 *     once a successful Response with a readable stream body is returned,
 *     the caller's existing SSE-parsing loop takes over unchanged. No further
 *     retry/fallback happens after that point (an SSE 200 has already
 *     reached the client; switching models mid-stream would corrupt content
 *     already shown to the teacher).
 *
 * Both share the same error-classification, backoff, and remaining-budget
 * logic via the internal runWithRetryAndFallback() so the sequencing is
 * written once.
 */

import { RETRY_CONFIG, type RetryCallSite } from "./modelConfig.ts";

export type AnthropicErrorClass =
  | "overloaded"
  | "rate_limit"
  | "server_error"
  | "network"
  | "client_error"
  | "malformed";

export type AnthropicGracefulCode = "AI_TEMPORARILY_UNAVAILABLE" | "AI_ERROR";

const BUSY_MESSAGE =
  "Our AI assistant is experiencing very heavy demand right now. Please try again in a few minutes.";
const GENERIC_RETRY_MESSAGE =
  "We ran into a problem generating that. Please try again in a moment.";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function logAttempt(
  functionName: string,
  callLabel: string,
  stage: "retryable" | "fatal" | "give_up",
  errorClass: AnthropicErrorClass,
  attempt: number,
  model: string,
  detail: string,
) {
  // No secrets, no user content -- function name, error class, attempt
  // number, and model used only.
  console.error(
    `[anthropicRetry] ${functionName}:${callLabel} stage=${stage} errorClass=${errorClass} attempt=${attempt} model=${model} detail=${detail}`,
  );
}

type AttemptOutcome<T> =
  | { kind: "success"; value: T }
  | { kind: "retryable"; errorClass: AnthropicErrorClass; detail: string; retryAfterMs?: number }
  | { kind: "fatal"; errorClass: AnthropicErrorClass; detail: string };

interface RunOptions<T> {
  functionName: string;
  callLabel: string;
  primaryModel: string;
  fallbackModel: string | null;
  totalBudgetMs: number;
  primaryAttemptTimeoutMs: number;
  /** If set (test-only), every attempt is forced to this outcome -- see getForcedErrorClass(). */
  forcedErrorClass?: AnthropicErrorClass | null;
  attempt: (model: string, timeoutMs: number, forced?: AnthropicErrorClass | null) => Promise<AttemptOutcome<T>>;
}

interface RunSuccess<T> {
  ok: true;
  value: T;
  modelUsed: string;
  attempts: number;
}

interface RunFailure {
  ok: false;
  code: AnthropicGracefulCode;
  error: string;
  errorClass: AnthropicErrorClass;
  attempts: number;
}

async function runWithRetryAndFallback<T>(opts: RunOptions<T>): Promise<RunSuccess<T> | RunFailure> {
  const startedAt = Date.now();
  let attempts = 0;

  function remainingBudgetMs(): number {
    return opts.totalBudgetMs - (Date.now() - startedAt);
  }

  async function tryOnce(model: string, wantedTimeoutMs: number): Promise<AttemptOutcome<T>> {
    attempts++;
    const timeoutMs = Math.max(1000, Math.min(wantedTimeoutMs, remainingBudgetMs()));
    return opts.attempt(model, timeoutMs, opts.forcedErrorClass ?? null);
  }

  function giveUp(errorClass: AnthropicErrorClass, code: AnthropicGracefulCode, message: string): RunFailure {
    logAttempt(opts.functionName, opts.callLabel, "give_up", errorClass, attempts, "n/a", "retries/fallback exhausted or budget exhausted");
    return { ok: false, code, error: message, errorClass, attempts };
  }

  // -- Attempt 1: primary model --
  let result = await tryOnce(opts.primaryModel, opts.primaryAttemptTimeoutMs);
  if (result.kind === "success") return { ok: true, value: result.value, modelUsed: opts.primaryModel, attempts };
  if (result.kind === "fatal") {
    logAttempt(opts.functionName, opts.callLabel, "fatal", result.errorClass, attempts, opts.primaryModel, result.detail);
    return { ok: false, code: "AI_ERROR", error: GENERIC_RETRY_MESSAGE, errorClass: result.errorClass, attempts };
  }
  logAttempt(opts.functionName, opts.callLabel, "retryable", result.errorClass, attempts, opts.primaryModel, result.detail);

  // -- 429 rate limit: bounded retry, same model only, no fallback ever --
  if (result.errorClass === "rate_limit") {
    for (let i = 0; i < RETRY_CONFIG.maxRateLimitRetries; i++) {
      const wait = Math.min(result.retryAfterMs ?? RETRY_CONFIG.backoffMs[0], RETRY_CONFIG.rateLimitRetryAfterCapMs);
      if (remainingBudgetMs() - wait < RETRY_CONFIG.minRemainingBudgetToAttemptMs) break;
      await sleep(wait);
      if (remainingBudgetMs() < RETRY_CONFIG.minRemainingBudgetToAttemptMs) break;
      result = await tryOnce(opts.primaryModel, opts.primaryAttemptTimeoutMs);
      if (result.kind === "success") return { ok: true, value: result.value, modelUsed: opts.primaryModel, attempts };
      if (result.kind === "fatal") {
        logAttempt(opts.functionName, opts.callLabel, "fatal", result.errorClass, attempts, opts.primaryModel, result.detail);
        return { ok: false, code: "AI_ERROR", error: GENERIC_RETRY_MESSAGE, errorClass: result.errorClass, attempts };
      }
      logAttempt(opts.functionName, opts.callLabel, "retryable", result.errorClass, attempts, opts.primaryModel, result.detail);
    }
    return giveUp("rate_limit", "AI_TEMPORARILY_UNAVAILABLE", BUSY_MESSAGE);
  }

  // -- overloaded / server_error / network / malformed: same-model retries first --
  for (let i = 0; i < RETRY_CONFIG.maxSameModelRetries; i++) {
    const wait = RETRY_CONFIG.backoffMs[Math.min(i, RETRY_CONFIG.backoffMs.length - 1)];
    if (remainingBudgetMs() - wait < RETRY_CONFIG.minRemainingBudgetToAttemptMs) {
      return giveUp(result.errorClass, "AI_TEMPORARILY_UNAVAILABLE", BUSY_MESSAGE);
    }
    await sleep(wait);
    if (remainingBudgetMs() < RETRY_CONFIG.minRemainingBudgetToAttemptMs) {
      return giveUp(result.errorClass, "AI_TEMPORARILY_UNAVAILABLE", BUSY_MESSAGE);
    }
    result = await tryOnce(opts.primaryModel, opts.primaryAttemptTimeoutMs);
    if (result.kind === "success") return { ok: true, value: result.value, modelUsed: opts.primaryModel, attempts };
    if (result.kind === "fatal") {
      logAttempt(opts.functionName, opts.callLabel, "fatal", result.errorClass, attempts, opts.primaryModel, result.detail);
      return { ok: false, code: "AI_ERROR", error: GENERIC_RETRY_MESSAGE, errorClass: result.errorClass, attempts };
    }
    logAttempt(opts.functionName, opts.callLabel, "retryable", result.errorClass, attempts, opts.primaryModel, result.detail);
  }

  // Malformed/empty completion: one retry only, no fallback-model attempt.
  if (result.errorClass === "malformed") {
    return giveUp("malformed", "AI_TEMPORARILY_UNAVAILABLE", BUSY_MESSAGE);
  }

  // -- Fallback model (overloaded / server_error / network only) --
  if (opts.fallbackModel) {
    for (let i = 0; i < RETRY_CONFIG.maxFallbackRetries; i++) {
      const wait = RETRY_CONFIG.backoffMs[Math.min(i, RETRY_CONFIG.backoffMs.length - 1)];
      if (remainingBudgetMs() - wait < RETRY_CONFIG.minRemainingBudgetToAttemptMs) {
        return giveUp(result.errorClass, "AI_TEMPORARILY_UNAVAILABLE", BUSY_MESSAGE);
      }
      await sleep(wait);
      if (remainingBudgetMs() < RETRY_CONFIG.minRemainingBudgetToAttemptMs) {
        return giveUp(result.errorClass, "AI_TEMPORARILY_UNAVAILABLE", BUSY_MESSAGE);
      }
      result = await tryOnce(opts.fallbackModel, opts.primaryAttemptTimeoutMs);
      if (result.kind === "success") return { ok: true, value: result.value, modelUsed: opts.fallbackModel, attempts };
      if (result.kind === "fatal") {
        logAttempt(opts.functionName, opts.callLabel, "fatal", result.errorClass, attempts, opts.fallbackModel, result.detail);
        return { ok: false, code: "AI_ERROR", error: GENERIC_RETRY_MESSAGE, errorClass: result.errorClass, attempts };
      }
      logAttempt(opts.functionName, opts.callLabel, "retryable", result.errorClass, attempts, opts.fallbackModel, result.detail);
    }
  }

  return giveUp(result.errorClass, "AI_TEMPORARILY_UNAVAILABLE", BUSY_MESSAGE);
}

// ============================================================================
// Shared fetch mechanics
// ============================================================================

function classifyErrorResponse(status: number, bodyText: string, retryAfterHeader: string | null):
  | { kind: "retryable"; errorClass: AnthropicErrorClass; detail: string; retryAfterMs?: number }
  | { kind: "fatal"; errorClass: AnthropicErrorClass; detail: string } {
  let parsedType: string | undefined;
  try {
    parsedType = JSON.parse(bodyText)?.error?.type;
  } catch {
    // not JSON -- fall through, status code alone still classifies it
  }

  if (status === 429) {
    const retryAfterMs = retryAfterHeader
      ? Math.min(Number(retryAfterHeader) * 1000, RETRY_CONFIG.rateLimitRetryAfterCapMs)
      : undefined;
    return { kind: "retryable", errorClass: "rate_limit", detail: `429 ${bodyText}`, retryAfterMs };
  }
  if (status === 529 || parsedType === "overloaded_error") {
    return { kind: "retryable", errorClass: "overloaded", detail: `${status} ${bodyText}` };
  }
  if (status >= 500) {
    return { kind: "retryable", errorClass: "server_error", detail: `${status} ${bodyText}` };
  }
  return { kind: "fatal", errorClass: "client_error", detail: `${status} ${bodyText}` };
}

function applyForcedError(forced: AnthropicErrorClass | null | undefined):
  | { kind: "retryable"; errorClass: AnthropicErrorClass; detail: string }
  | { kind: "fatal"; errorClass: AnthropicErrorClass; detail: string }
  | null {
  if (!forced) return null;
  if (forced === "client_error") {
    return { kind: "fatal", errorClass: "client_error", detail: "forced_test_error:client_error" };
  }
  return { kind: "retryable", errorClass: forced, detail: `forced_test_error:${forced}` };
}

export interface NonStreamingCallOptions {
  functionName: string;
  callLabel: string;
  callSite: RetryCallSite;
  apiKey: string;
  primaryModel: string;
  /** null => no model fallback (e.g. extract-lesson's fast/Haiku tagging calls) */
  fallbackModel: string | null;
  buildBody: (model: string) => Record<string, unknown>;
  /** Test-only forced error injection -- see getForcedErrorClass(). */
  forcedErrorClass?: AnthropicErrorClass | null;
}

export interface NonStreamingSuccess {
  ok: true;
  text: string;
  modelUsed: string;
  raw: unknown;
  attempts: number;
}

export interface NonStreamingFailure {
  ok: false;
  code: AnthropicGracefulCode;
  error: string;
  errorClass: AnthropicErrorClass;
  attempts: number;
}

export async function callAnthropicNonStreaming(
  opts: NonStreamingCallOptions,
): Promise<NonStreamingSuccess | NonStreamingFailure> {
  const totalBudgetMs = RETRY_CONFIG.totalBudgetMs[opts.callSite];
  const primaryAttemptTimeoutMs = RETRY_CONFIG.primaryAttemptTimeoutMs[opts.callSite];

  const result = await runWithRetryAndFallback<{ text: string; raw: unknown }>({
    functionName: opts.functionName,
    callLabel: opts.callLabel,
    primaryModel: opts.primaryModel,
    fallbackModel: opts.fallbackModel,
    totalBudgetMs,
    primaryAttemptTimeoutMs,
    forcedErrorClass: opts.forcedErrorClass,
    attempt: async (model, timeoutMs, forced) => {
      const forcedOutcome = applyForcedError(forced);
      if (forcedOutcome) return forcedOutcome;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": opts.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(opts.buildBody(model)),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!resp.ok) {
          const bodyText = await resp.text();
          return classifyErrorResponse(resp.status, bodyText, resp.headers.get("retry-after"));
        }

        const json = await resp.json();
        const text =
          (json as any)?.content?.find?.((c: any) => c?.type === "text")?.text ??
          (json as any)?.content?.[0]?.text ??
          "";
        if (!text) {
          return { kind: "retryable" as const, errorClass: "malformed" as const, detail: "empty_completion" };
        }
        return { kind: "success" as const, value: { text, raw: json } };
      } catch (e) {
        clearTimeout(timer);
        const isAbort = (e as Error)?.name === "AbortError";
        return {
          kind: "retryable" as const,
          errorClass: "network" as const,
          detail: isAbort ? "timeout" : ((e as Error)?.message ?? String(e)),
        };
      }
    },
  });

  if (result.ok) {
    return { ok: true, text: result.value.text, raw: result.value.raw, modelUsed: result.modelUsed, attempts: result.attempts };
  }
  return { ok: false, code: result.code, error: result.error, errorClass: result.errorClass, attempts: result.attempts };
}

export interface StreamCallOptions {
  functionName: string;
  callLabel: string;
  apiKey: string;
  primaryModel: string;
  fallbackModel: string | null;
  buildBody: (model: string) => Record<string, unknown>;
  forcedErrorClass?: AnthropicErrorClass | null;
}

export interface StreamSuccess {
  ok: true;
  response: Response;
  modelUsed: string;
  attempts: number;
  /**
   * The AbortController tied to the successful attempt's underlying fetch.
   * Its connection-phase timeout has already been cleared -- the caller
   * should attach its OWN post-connection watchdog (e.g. a stall guard that
   * aborts if no bytes arrive for N seconds) to THIS controller, since it's
   * the one actually wired to the in-flight request/response stream.
   */
  controller: AbortController;
}

export interface StreamFailure {
  ok: false;
  code: AnthropicGracefulCode;
  error: string;
  errorClass: AnthropicErrorClass;
  attempts: number;
}

/**
 * Retries/falls back ONLY the connection/first-byte phase of generate-lesson's
 * Phase-1 SSE call. Returns the raw Response (stream body untouched) on
 * success so the caller's existing SSE-parsing loop takes over unchanged.
 * Once this returns ok:true, no further retry/fallback happens -- an SSE 200
 * has already reached the client at that point in generate-lesson's flow.
 */
export async function openAnthropicStreamWithRetry(
  opts: StreamCallOptions,
): Promise<StreamSuccess | StreamFailure> {
  const timeoutMs = RETRY_CONFIG.streamConnectTimeoutMs;
  // Total budget for the connection phase only -- a handful of stream-connect
  // attempts, not the whole generation. Generous relative to the per-attempt
  // timeout since fast failures (429/500/529) return in seconds.
  const totalBudgetMs = timeoutMs * 4;

  const result = await runWithRetryAndFallback<{ response: Response; controller: AbortController }>({
    functionName: opts.functionName,
    callLabel: opts.callLabel,
    primaryModel: opts.primaryModel,
    fallbackModel: opts.fallbackModel,
    totalBudgetMs,
    primaryAttemptTimeoutMs: timeoutMs,
    forcedErrorClass: opts.forcedErrorClass,
    attempt: async (model, attemptTimeoutMs, forced) => {
      const forcedOutcome = applyForcedError(forced);
      if (forcedOutcome) return forcedOutcome;

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), attemptTimeoutMs);
      try {
        const resp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": opts.apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify(opts.buildBody(model)),
          signal: controller.signal,
        });
        clearTimeout(timer);

        if (!resp.ok) {
          const bodyText = await resp.text();
          return classifyErrorResponse(resp.status, bodyText, resp.headers.get("retry-after"));
        }
        // Success: hand the still-unread Response straight back, plus the
        // controller that's actually wired to it, so the caller's own
        // post-connection stall guard can abort the correct in-flight
        // request. We do NOT check for empty/malformed content here --
        // that's meaningless for a stream whose body hasn't been read yet.
        return { kind: "success" as const, value: { response: resp, controller } };
      } catch (e) {
        clearTimeout(timer);
        const isAbort = (e as Error)?.name === "AbortError";
        return {
          kind: "retryable" as const,
          errorClass: "network" as const,
          detail: isAbort ? "connect_timeout" : ((e as Error)?.message ?? String(e)),
        };
      }
    },
  });

  if (result.ok) {
    return { ok: true, response: result.value.response, controller: result.value.controller, modelUsed: result.modelUsed, attempts: result.attempts };
  }
  return { ok: false, code: result.code, error: result.error, errorClass: result.errorClass, attempts: result.attempts };
}

// ============================================================================
// Test-only forced-error injection
// ============================================================================
//
// Lets Lynn exercise every error class against the REAL deployed function
// (this project has no local Docker/Deno edge-function runtime, so "local"
// testing means testing the deployed function from a localhost frontend --
// see PROJECT_MASTER.md B2 restore-runbook notes) without needing Anthropic
// to actually be down or burning real API calls.
//
// Inert by default: returns null unless a TEST_FORCE_ERROR_TOKEN secret has
// been explicitly configured (via `supabase secrets set`) AND the incoming
// request supplies a matching x-blsp-test-token header AND a recognized
// x-blsp-test-force-error value. An ordinary teacher's request has no way to
// know the secret token, so it can never accidentally (or deliberately)
// trigger forced-error behavior in production. If the secret is never set,
// this function always returns null and the mechanism cannot fire at all.
// ============================================================================

const FORCE_ERROR_HEADER = "x-blsp-test-force-error";
const FORCE_ERROR_TOKEN_HEADER = "x-blsp-test-token";
const VALID_FORCED_CLASSES: AnthropicErrorClass[] = [
  "overloaded",
  "rate_limit",
  "server_error",
  "network",
  "client_error",
  "malformed",
];

export function getForcedErrorClass(req: Request): AnthropicErrorClass | null {
  const expectedToken = Deno.env.get("TEST_FORCE_ERROR_TOKEN");
  if (!expectedToken) return null;
  const providedToken = req.headers.get(FORCE_ERROR_TOKEN_HEADER);
  if (!providedToken || providedToken !== expectedToken) return null;
  const forced = req.headers.get(FORCE_ERROR_HEADER);
  if (!forced) return null;
  return VALID_FORCED_CLASSES.includes(forced as AnthropicErrorClass) ? (forced as AnthropicErrorClass) : null;
}
