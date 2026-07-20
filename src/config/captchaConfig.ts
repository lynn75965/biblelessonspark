// SSOT for Cloudflare Turnstile gating. CAPTCHA_ENABLED is derived purely
// from whether VITE_TURNSTILE_SITE_KEY is set -- no other flag anywhere.
// Unset (production today): CaptchaWidget renders nothing and every auth
// call site omits captchaToken entirely, so behavior is identical to before
// Turnstile existed. Set: the widget renders and every gated Supabase auth
// call is required to carry a fresh token.
export const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

export const CAPTCHA_ENABLED = Boolean(TURNSTILE_SITE_KEY);

export const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

// How long to wait for a reset()+execute()'d widget to hand back a fresh
// token before giving up. A silent managed-mode re-pass resolves in well
// under a second, but if Cloudflare's risk engine decides the refreshed pass
// genuinely needs interaction, a real person needs time to see and solve it
// -- 30s gives that room without hanging the UI indefinitely.
export const TURNSTILE_REFRESH_TIMEOUT_MS = 30000;
