/**
 * _shared/cronEmailConfig.ts
 *
 * Backend-only batch-pacing config for the two cron-driven email senders
 * (send-sequence-email, send-toolbelt-sequence). Hand-maintained (Rule #24)
 * -- no frontend equivalent needed, since no frontend code paces cron runs.
 *
 * CRON_EMAIL_BATCH_SIZE is a DEFENSIVE STARTING VALUE, not derived from a
 * verified Resend account quota (unavailable as of 2026-07-23). Revisit once
 * the real ceiling is known, or once either tracking table's eligible-row
 * count regularly exceeds this value in steady state.
 */

export const CRON_EMAIL_BATCH_SIZE = 20;

export const CRON_EMAIL_FAILURES_TABLE = "cron_email_failures" as const;
