import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useRef, useState } from 'react';
import {
  CAPTCHA_ENABLED,
  TURNSTILE_SITE_KEY,
  TURNSTILE_SCRIPT_SRC,
  TURNSTILE_REFRESH_TIMEOUT_MS,
} from '@/config/captchaConfig';

interface TurnstileRenderOptions {
  sitekey: string;
  appearance?: 'always' | 'execute' | 'interaction-only';
  execution?: 'render' | 'execute';
  theme?: 'light' | 'dark' | 'auto';
  action?: string;
  callback?: (token: string) => void;
  'error-callback'?: (errorCode?: string) => void;
  'expired-callback'?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      execute: (container: HTMLElement, params?: TurnstileRenderOptions) => void;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

export interface CaptchaWidgetHandle {
  // Current token, or null if none has been minted yet (or one was already
  // consumed and not yet refreshed). Callers that only need one token per
  // page view can read this directly.
  getToken: () => string | null;
  // Resets the widget and resolves with the NEXT token Turnstile mints.
  // Used to chain a second gated Supabase call (e.g. sign-in immediately
  // after sign-up) without a page reload -- Turnstile tokens are single-use.
  refreshToken: () => Promise<string>;
}

interface CaptchaWidgetProps {
  // Accessible name for the security-check region (e.g. "Sign-in security check").
  label: string;
  action?: string;
  onTokenChange?: (token: string | null) => void;
  // Set false for a widget that must stay dormant until its first
  // refreshToken() call (see the dedicated-second-widget note below).
  // Defaults true: mint a token immediately so it's ready by submit time.
  autoExecute?: boolean;
}

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src^="${TURNSTILE_SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile script')));
      return;
    }
    const script = document.createElement('script');
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Turnstile script'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

// Renders a Cloudflare Turnstile widget in managed, interaction-only mode
// (invisible unless Cloudflare's risk engine decides a challenge is needed).
// Renders nothing at all when VITE_TURNSTILE_SITE_KEY is unset -- see
// captchaConfig.ts. Every call site that uses this widget must treat
// captchaToken as optional for that reason: with CAPTCHA disabled, no widget
// exists and no token is ever produced or required.
//
// execution: 'execute' + an explicit execute() call (rather than the
// execution: 'render' default, which auto-runs once on mount) is deliberate:
// Cloudflare has a confirmed bug where reset()'ing a widget whose first pass
// completed silently under appearance: 'interaction-only' can leave the
// widget stuck invisible if the reset-triggered pass decides it needs
// interaction -- the challenge UI never appears and the callback never
// fires. Driving every pass (first and refreshed) through an explicit
// execute() call, and pairing reset() with execute() in refreshToken()
// rather than relying on reset() alone, is Cloudflare's own documented
// workaround. See community.cloudflare.com "[BUG] Widget not displayed in
// interaction-only mode after turnstile.reset()".
//
// In practice that pairing was NOT sufficient on its own (verified against
// the throwaway project: reset()+execute() still timed out identically to
// reset() alone). The reliable pattern turned out to be autoExecute={false}
// on a SECOND, dedicated widget instance for any chained second-token need
// (e.g. the invite sign-up -> sign-in flow in Auth.tsx) -- its first-ever
// execute() at chain time is a genuinely fresh pass, never preceded by a
// reset() on an already-silently-passed widget, so the interaction-only
// visibility bug never has an opportunity to trigger. Prefer that pattern
// over reusing/resetting a widget that already produced a token.
const CaptchaWidget = forwardRef<CaptchaWidgetHandle, CaptchaWidgetProps>(function CaptchaWidget(
  { label, action, onTokenChange, autoExecute = true },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string | null>(null);
  const pendingRef = useRef<{ resolve: (token: string) => void; reject: (err: Error) => void; timeoutId: number } | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const domId = `turnstile-${useId()}`;

  const settlePending = useCallback((run: (p: NonNullable<typeof pendingRef.current>) => void) => {
    const pending = pendingRef.current;
    if (!pending) return;
    window.clearTimeout(pending.timeoutId);
    pendingRef.current = null;
    run(pending);
  }, []);

  const handleToken = useCallback((token: string) => {
    tokenRef.current = token;
    onTokenChange?.(token);
    setStatus('ready');
    settlePending((p) => p.resolve(token));
  }, [onTokenChange, settlePending]);

  const handleError = useCallback((errorCode?: string) => {
    tokenRef.current = null;
    onTokenChange?.(null);
    setStatus('error');
    settlePending((p) => p.reject(new Error(`Turnstile verification failed (${errorCode ?? 'no error code'})`)));
  }, [onTokenChange, settlePending]);

  const handleExpired = useCallback(() => {
    tokenRef.current = null;
    onTokenChange?.(null);
  }, [onTokenChange]);

  useEffect(() => {
    if (!CAPTCHA_ENABLED || !containerRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY as string,
          appearance: 'interaction-only',
          execution: 'execute',
          theme: 'auto',
          action,
          callback: handleToken,
          'error-callback': handleError,
          'expired-callback': handleExpired,
        });
        // execution: 'execute' disables auto-run on render -- kick off the
        // first pass explicitly so the token is ready by the time a normal
        // user reaches the submit button, matching prior auto-run UX.
        // Skipped when autoExecute is false: this widget stays dormant
        // (rendered but never run) until its first refreshToken() call.
        if (autoExecute) {
          window.turnstile.execute(containerRef.current);
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });

    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
    // Render once per mount; callback identities are stable across the
    // widget's lifetime via the refs above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    getToken: () => tokenRef.current,
    refreshToken: () => new Promise<string>((resolve, reject) => {
      if (!CAPTCHA_ENABLED || !widgetIdRef.current || !containerRef.current || !window.turnstile) {
        reject(new Error('Turnstile widget is not ready'));
        return;
      }
      settlePending((p) => p.reject(new Error('Superseded by a newer refreshToken call')));
      const timeoutId = window.setTimeout(() => {
        pendingRef.current = null;
        reject(new Error('Timed out waiting for a new security check token'));
      }, TURNSTILE_REFRESH_TIMEOUT_MS);
      pendingRef.current = { resolve, reject, timeoutId };
      tokenRef.current = null;
      setStatus('loading');
      // reset() alone is not reliable here -- see the note above the
      // component. Pairing it with an explicit execute() is the documented
      // workaround: reset() clears the consumed token/state, execute()
      // unambiguously (re-)triggers the next pass.
      window.turnstile.reset(widgetIdRef.current);
      window.turnstile.execute(containerRef.current);
    }),
  }), [settlePending]);

  if (!CAPTCHA_ENABLED) return null;

  return (
    <div role="group" aria-label={label} className="space-y-1">
      <div ref={containerRef} id={domId} />
      <p aria-live="polite" className="sr-only">
        {status === 'loading' && 'Running security check...'}
        {status === 'ready' && 'Security check complete.'}
      </p>
      {status === 'error' && (
        <p role="alert" className="text-xs text-destructive">
          Security check failed to load. Please refresh the page and try again.
        </p>
      )}
    </div>
  );
});

export default CaptchaWidget;
