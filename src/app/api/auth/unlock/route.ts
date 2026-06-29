import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { verifyPasscode } from '@/lib/auth/passcode';
import {
  isRateLimited,
  recordFailedAttempt,
  resetAttempts,
  retryAfterSeconds,
} from '@/lib/auth/rate-limit';
import {
  COOP_SESSION,
  SESSION_COOKIE_OPTIONS,
  createSessionToken,
} from '@/lib/auth/session';

/**
 * POST /api/auth/unlock
 *
 * Body: { passcode: string }
 *
 * Verifies the passcode and, on success, issues the session cookie. Protected
 * by a per-IP in-memory rate limit (5 failures / 10 minutes) so the gate can't
 * be brute-forced even by a device already on the tailnet.
 *
 * This route is intentionally excluded from the proxy's auth check (it is how
 * you get a session in the first place).
 */
export async function POST(request: Request): Promise<NextResponse> {
  const ip = clientIp(request);

  // Block first — a rate-limited client never even reaches passcode checking,
  // so it cannot keep the bcrypt comparison busy or learn anything from timing.
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { ok: false, error: 'Too many attempts. Try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(retryAfterSeconds(ip)) },
      },
    );
  }

  // Parse the body defensively — a malformed body is just a failed attempt.
  let passcode: unknown;
  try {
    const body = await request.json();
    passcode = (body as { passcode?: unknown })?.passcode;
  } catch {
    passcode = undefined;
  }

  if (typeof passcode !== 'string' || passcode.length === 0) {
    recordFailedAttempt(ip);
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const valid = await verifyPasscode(passcode);

  if (!valid) {
    recordFailedAttempt(ip);
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  // Success: clear the failure counter and set the signed session cookie.
  resetAttempts(ip);

  const token = await createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(COOP_SESSION, token, SESSION_COOKIE_OPTIONS);

  return NextResponse.json({ ok: true });
}

/**
 * Best-effort client IP for rate-limit keying. Behind Tailscale/single-host
 * there is no hostile proxy spoofing these headers, so trusting the standard
 * forwarding headers (then falling back to a constant) is acceptable.
 */
function clientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    const first = forwardedFor.split(',')[0]?.trim();
    if (first) {
      return first;
    }
  }
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}
