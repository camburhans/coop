import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { COOP_SESSION } from '@/lib/auth/session';

/**
 * POST /api/auth/lock
 *
 * Clears the session cookie, immediately locking the app. The next request
 * will fail the proxy's session check and be redirected to /unlock.
 *
 * Like /unlock, this route is excluded from the proxy's auth check so it can
 * always be reached (locking should never itself require being unlocked in a
 * way that deadlocks).
 */
export async function POST(): Promise<NextResponse> {
  const cookieStore = await cookies();
  cookieStore.delete(COOP_SESSION);

  return NextResponse.json({ ok: true });
}
