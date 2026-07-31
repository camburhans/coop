import { NextResponse, type NextRequest } from 'next/server';

import { errorResponse, parseId } from '@/lib/api/http';
import {
  deleteTransaction,
  getTransaction,
  updateTransaction,
} from '@/lib/finance/transactions';
import { transactionUpdateSchema } from '@/lib/validation/transaction';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/transactions/[id] — one transaction with its account, or 404. */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    const transaction = await getTransaction(id);
    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    return NextResponse.json(transaction);
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH /api/transactions/[id] — partial update (source is never changed). */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    const body: unknown = await request.json();
    const parsed = transactionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const transaction = await updateTransaction(id, parsed.data);
    return NextResponse.json(transaction);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/transactions/[id] — delete the transaction. */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    await deleteTransaction(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
