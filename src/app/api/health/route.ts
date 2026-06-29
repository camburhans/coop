import { NextResponse } from 'next/server';

import { prisma } from '@/lib/db/client';

/**
 * GET /api/health
 *
 * Liveness/readiness probe for external uptime tooling. Returns 200 with a
 * small JSON body describing process and database health. The proxy allowlists
 * this path, so it works WITHOUT a session — uptime monitors should never need
 * the passcode.
 *
 * `db` reflects whether a trivial `SELECT 1` against Postgres succeeded. A DB
 * outage does not fail the endpoint itself (it still returns 200 so the monitor
 * can distinguish "app up, db down" from "app down"); the `db: false` flag
 * carries that signal.
 */
export async function GET(): Promise<NextResponse> {
  let db = false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    db = true;
  } catch {
    db = false;
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    db,
  });
}
