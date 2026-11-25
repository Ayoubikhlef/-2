/**
 * Cloudflare Turnstile verification for the customer sign-in form.
 *
 * The widget key is public and lives in the frontend build; the secret key
 * stays on the server. Verification is skipped entirely when no secret is
 * configured, so local development and a temporary provider outage do not lock
 * customers out. Admin sign-in is exempted by the route itself (the admin
 * panel has mandatory two-factor authentication and must stay reachable even
 * when the captcha provider is down).
 */

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const MAX_TOKEN_LENGTH = 4096;

export type TurnstileResult = {
  ok: boolean;
  /** True when Cloudflare could not be reached or answered with an error. */
  unavailable?: boolean;
  codes?: string[];
};

export function isTurnstileConfigured(): boolean {
  return Boolean((process.env.TURNSTILE_SECRET_KEY || '').trim());
}

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string,
  expectedAction = 'customer-login'
): Promise<TurnstileResult> {
  const secret = (process.env.TURNSTILE_SECRET_KEY || '').trim();
  if (!secret) return { ok: true };

  const response = String(token || '').trim();
  if (!response || response.length > MAX_TOKEN_LENGTH) {
    return { ok: false, codes: ['missing-input-response'] };
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', response);
  if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`[Turnstile] siteverify returned HTTP ${res.status}`);
      return { ok: false, unavailable: true };
    }
    const payload: any = await res.json().catch(() => null);
    if (!payload || typeof payload.success !== 'boolean') {
      console.error('[Turnstile] siteverify returned an unexpected body');
      return { ok: false, unavailable: true };
    }
    if (payload.success && expectedAction && payload.action && payload.action !== expectedAction) {
      return { ok: false, codes: ['action-mismatch'] };
    }
    return {
      ok: payload.success,
      codes: Array.isArray(payload['error-codes']) ? payload['error-codes'].map(String) : [],
    };
  } catch (err: any) {
    console.error(`[Turnstile] verification failed: ${err?.name || 'Error'}`);
    return { ok: false, unavailable: true };
  } finally {
    clearTimeout(timer);
  }
}
