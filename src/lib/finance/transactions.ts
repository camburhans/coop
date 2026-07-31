import 'server-only';

import { Prisma, TransactionSource, type Transaction } from '@prisma/client';

import { prisma } from '@/lib/db/client';
import {
  transactionCreateSchema,
  transactionUpdateSchema,
  type TransactionCreateInput,
  type TransactionUpdateInput,
} from '@/lib/validation/transaction';

import { translatePrismaError } from './prisma-error';

/** A transaction row with its parent account joined in (for row display). */
export type TransactionWithAccount = Prisma.TransactionGetPayload<{
  include: { account: true };
}>;

export interface ListTransactionsOptions {
  /** Restrict to one account. */
  accountId?: string;
  /** Cap the number of rows (the Ledger shows 30, Reporting's recent ~8). */
  limit?: number;
}

/**
 * List transactions, optionally filtered by account and capped by `limit`,
 * newest first (by `occurredOn`, then `createdAt` as the tiebreak for same-day
 * entries). Each row carries its account relation for display.
 *
 * NOTE: transactions are a ledger/record only — this never reads or writes
 * `Account.balance`. Balances are maintained by hand (see the finance steering
 * "balances are MANUAL" rule).
 */
export async function listTransactions(
  opts: ListTransactionsOptions = {},
): Promise<TransactionWithAccount[]> {
  const where: Prisma.TransactionWhereInput = {};
  if (opts.accountId !== undefined) where.accountId = opts.accountId;

  return prisma.transaction.findMany({
    where,
    include: { account: true },
    orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }],
    ...(opts.limit !== undefined ? { take: opts.limit } : {}),
  });
}

export async function getTransaction(id: string): Promise<TransactionWithAccount | null> {
  return prisma.transaction.findUnique({
    where: { id },
    include: { account: true },
  });
}

export async function createTransaction(
  input: TransactionCreateInput,
): Promise<Transaction> {
  const data = transactionCreateSchema.parse(input);
  try {
    return await prisma.transaction.create({
      data: {
        accountId: data.accountId,
        // Signed amount → Decimal. Never summed as a float, never mutated onto
        // the account balance (no double-entry this sprint).
        amount: new Prisma.Decimal(data.amount),
        category: data.category,
        description: data.description,
        occurredOn: data.occurredOn,
        // MANUAL is the only source written this sprint. CSV import is deferred
        // behind a future pluggable import-source adapter, so we force MANUAL
        // here regardless of input and never write CSV_IMPORT.
        source: TransactionSource.MANUAL,
      },
    });
  } catch (err) {
    // A bad accountId surfaces here as a foreign-key error (P2003) → 400.
    translatePrismaError(err, 'Transaction not found');
  }
}

export async function updateTransaction(
  id: string,
  input: TransactionUpdateInput,
): Promise<Transaction> {
  const data = transactionUpdateSchema.parse(input);

  // Patch only the supplied fields so an omitted one is preserved. `source` is
  // deliberately NOT written from an update: it is a service-managed column
  // (always MANUAL this sprint), so leaving it out preserves the stored value
  // and makes it impossible to introduce CSV_IMPORT through a PATCH.
  const patch: Prisma.TransactionUncheckedUpdateInput = {};
  if (data.accountId !== undefined) patch.accountId = data.accountId;
  if (data.amount !== undefined) patch.amount = new Prisma.Decimal(data.amount);
  if (data.category !== undefined) patch.category = data.category;
  if (data.description !== undefined) patch.description = data.description;
  if (data.occurredOn !== undefined) patch.occurredOn = data.occurredOn;

  try {
    return await prisma.transaction.update({ where: { id }, data: patch });
  } catch (err) {
    // A bad accountId (P2003) → 400; a missing transaction (P2025) → 404.
    translatePrismaError(err, `Transaction ${id} not found`);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    await prisma.transaction.delete({ where: { id } });
  } catch (err) {
    translatePrismaError(err, `Transaction ${id} not found`);
  }
}
