import { NextResponse, type NextRequest } from 'next/server';

import { errorResponse, parseId } from '@/lib/api/http';
import { deleteAccount, getAccount, updateAccount } from '@/lib/finance/accounts';
import { accountUpdateSchema } from '@/lib/validation/account';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/accounts/[id] — one account with its transaction count, or 404. */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    const account = await getAccount(id);
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    return NextResponse.json(account);
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH /api/accounts/[id] — partial update. */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    const body: unknown = await request.json();
    const parsed = accountUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const account = await updateAccount(id, parsed.data);
    return NextResponse.json(account);
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * DELETE /api/accounts/[id] — delete the account. GUARDED: if it still has
 * transactions the service throws a ConflictError → 409 (we never cascade-
 * delete real financial records). Delete or reassign its transactions first.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    await deleteAccount(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
