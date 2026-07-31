import { NextResponse, type NextRequest } from 'next/server';

import { errorResponse } from '@/lib/api/http';
import { createAccount, listAccounts } from '@/lib/finance/accounts';
import { accountCreateSchema } from '@/lib/validation/account';

/**
 * GET /api/accounts — list accounts (assets first, then liabilities, by name),
 * each with its transaction count.
 *
 * Protected by the session proxy (src/proxy.ts): only /unlock, /api/auth/*,
 * and /api/health are public, so this route requires a valid session.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const accounts = await listAccounts();
    return NextResponse.json(accounts);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/accounts — create an account. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = accountCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const account = await createAccount(parsed.data);
    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
