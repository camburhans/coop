import 'server-only';

import { SignJWT, jwtVerify } from 'jose';

import { env } from '@/lib/env';

/**
 * Signed session tokens for the single-user app gate.
 *
 * After a correct passcode, we issue a short, signed JWT and store it in an
 * httpOnly cookie. The token carries no sensitive data — it is purely a proof
 * that "this browser unlocked the app". Its signature (HS256 over
 * SESSION_SECRET) is what makes it tamper-proof: a client cannot forge or
 * extend a session without the server's secret.
 *
 * `jose` is used rather than a Node-only JWT library because the proxy
 * (route protection) runs in the Edge runtime, where `jose` works but native
 * crypto libraries do not. Keeping session logic here — and passcode/bcrypt
 * logic elsewhere — means this module is safe to import from the proxy.
 */

/** Name of the cookie that holds the session token. */
export const COOP_SESSION = 'coop_session';

/** Session lifetime in seconds (30 days). */
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

/**
 * Cookie options for the session cookie.
 *
 * - httpOnly: not readable from JS, mitigating XSS token theft.
 * - sameSite 'lax': sent on top-level navigations, blocks most CSRF.
 * - secure in production: only sent over HTTPS (dev over http stays usable).
 * - path '/': valid across the whole app.
 * - maxAge: matches the token expiry so the cookie and token expire together.
 */
export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: env.NODE_ENV === 'production',
  path: '/',
  maxAge: SESSION_MAX_AGE,
} as const;

// The signing secret as bytes, encoded once. HS256 (HMAC-SHA256) is symmetric:
// the same secret signs and verifies, which is exactly what a single-process
// single-user app needs.
const secretKey = new TextEncoder().encode(env.SESSION_SECRET);
const ALG = 'HS256';

/**
 * Creates a signed session token valid for 30 days.
 *
 * The payload is deliberately minimal (just standard claims) because there is
 * exactly one user — the token's only job is to prove a successful unlock.
 */
export async function createSessionToken(): Promise<string> {
  return new SignJWT({ scope: 'app' })
    .setProtectedHeader({ alg: ALG })
    .setSubject('owner')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey);
}

/**
 * Returns true when `token` is a valid, unexpired, correctly-signed session.
 *
 * Any verification failure (bad signature, expired, malformed, empty) resolves
 * to false rather than throwing, so callers can treat it as a simple boolean
 * gate.
 */
export async function verifySessionToken(token: string): Promise<boolean> {
  if (!token) {
    return false;
  }

  try {
    await jwtVerify(token, secretKey, { algorithms: [ALG] });
    return true;
  } catch {
    return false;
  }
}
