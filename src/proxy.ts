import { NextResponse, type NextRequest } from 'next/server';

import { COOP_SESSION, verifySessionToken } from '@/lib/auth/session';

/**
 * Route protection (Next.js 16 "proxy" — formerly "middleware").
 *
 * Next 16 renamed the `middleware` file convention to `proxy` and the exported
 * function from `middleware` to `proxy`; behaviour is otherwise unchanged. This
 * matches the repo's structure steering (src/proxy.ts).
 *
 * Every request that reaches here (per the matcher below) must carry a valid
 * session cookie. The few routes that must work WITHOUT a session — the unlock
 * page, the auth endpoints, and the health check — are allowlisted explicitly.
 * Everything else without a valid session is redirected to /unlock.
 *
 * Verification uses `jose` (Edge-compatible) via verifySessionToken; no bcrypt
 * or Prisma is touched here, keeping the proxy within Edge runtime limits.
 */

/** Paths reachable without a session. */
const PUBLIC_PATHS = ['/unlock'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) {
    return true;
  }
  // Auth endpoints must be reachable to obtain/clear a session.
  if (pathname.startsWith('/api/auth/')) {
    return true;
  }
  // Health check is intentionally open so external uptime tooling can hit it.
  if (pathname === '/api/health') {
    return true;
  }
  return false;
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(COOP_SESSION)?.value ?? '';
  const hasValidSession = await verifySessionToken(token);

  if (hasValidSession) {
    return NextResponse.next();
  }

  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // No valid session and not a public path → send to the unlock page.
  const unlockUrl = new URL('/unlock', request.url);
  return NextResponse.redirect(unlockUrl);
}

/**
 * Matcher: run the proxy on everything EXCEPT Next internals and static files.
 *
 * The negative lookahead excludes `_next/static`, `_next/image`, the favicon,
 * and common static asset extensions, so the proxy never burns work on assets.
 * `/unlock`, `/api/auth/*`, and `/api/health` still match here but are
 * allowlisted inside `proxy()` above.
 */
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff2?|ttf)$).*)',
  ],
};
