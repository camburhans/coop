import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { errorResponse } from '@/lib/api/http';
import { createTransaction, listTransactions } from '@/lib/finance/transactions';
import { transactionCreateSchema } from '@/lib/validation/transaction';

/** Query params for GET /api/transactions — an optional account filter. */
const listQuerySchema = z.object({
  accountId: z.uuid().optional(),
});

/**
 * GET /api/transactions?accountId= — list transactions newest-first, optionally
 * filtered to one account, each with its account joined in.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = listQuerySchema.safeParse({
      accountId: searchParams.get('accountId') ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const transactions = await listTransactions(parsed.data);
    return NextResponse.json(transactions);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/transactions — create a transaction (source is forced to MANUAL). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = transactionCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const transaction = await createTransaction(parsed.data);
    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
