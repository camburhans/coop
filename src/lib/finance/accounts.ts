import 'server-only';

import { Prisma, type Account } from '@prisma/client';

import { prisma } from '@/lib/db/client';
import { ConflictError, NotFoundError } from '@/lib/errors';
import {
  accountCreateSchema,
  accountUpdateSchema,
  type AccountCreateInput,
  type AccountUpdateInput,
} from '@/lib/validation/account';

import { translatePrismaError } from './prisma-error';

/** An account row plus a count of its transactions (drives the delete guard). */
export type AccountWithTxCount = Prisma.AccountGetPayload<{
  include: { _count: { select: { transactions: true } } };
}>;

const withTxCount = {
  _count: { select: { transactions: true } },
} satisfies Prisma.AccountInclude;

/**
 * List every account, each carrying its transaction count. Ordered
 * assets-first then liabilities, and by name within each group — a stable,
 * readable order for the ledger's account cards. The DB returns rows sorted by
 * name; a stable sort then floats liabilities to the bottom without disturbing
 * the alphabetical order inside each group.
 */
export async function listAccounts(): Promise<AccountWithTxCount[]> {
  const accounts = await prisma.account.findMany({
    include: withTxCount,
    orderBy: { name: 'asc' },
  });

  return [...accounts].sort(
    (a, b) => Number(a.isLiability) - Number(b.isLiability),
  );
}

export async function getAccount(id: string): Promise<AccountWithTxCount | null> {
  return prisma.account.findUnique({
    where: { id },
    include: withTxCount,
  });
}

export async function createAccount(input: AccountCreateInput): Promise<Account> {
  const data = accountCreateSchema.parse(input);
  return prisma.account.create({
    data: {
      name: data.name,
      type: data.type,
      isLiability: data.isLiability,
      // Money is stored as Decimal; convert the validated magnitude here rather
      // than handing Prisma a bare JS float.
      balance: new Prisma.Decimal(data.balance),
    },
  });
}

export async function updateAccount(
  id: string,
  input: AccountUpdateInput,
): Promise<Account> {
  const data = accountUpdateSchema.parse(input);

  // Build the patch from only the fields actually present, so an omitted field
  // is never reset. `balance` becomes a Decimal when supplied.
  const patch: Prisma.AccountUpdateInput = {};
  if (data.name !== undefined) patch.name = data.name;
  if (data.type !== undefined) patch.type = data.type;
  if (data.isLiability !== undefined) patch.isLiability = data.isLiability;
  if (data.balance !== undefined) patch.balance = new Prisma.Decimal(data.balance);

  try {
    return await prisma.account.update({ where: { id }, data: patch });
  } catch (err) {
    translatePrismaError(err, `Account ${id} not found`);
  }
}

/**
 * Delete an account — GUARDED. The Prisma relation is `onDelete: Cascade`, so
 * a raw delete would silently remove the account's real financial records with
 * it. We refuse that: if the account still has any transactions this throws a
 * {@link ConflictError} (→ HTTP 409). Only an account with zero transactions
 * can be deleted; the caller must remove or reassign its transactions first.
 */
export async function deleteAccount(id: string): Promise<void> {
  const account = await prisma.account.findUnique({
    where: { id },
    include: withTxCount,
  });

  if (!account) {
    throw new NotFoundError(`Account ${id} not found`);
  }

  if (account._count.transactions > 0) {
    throw new ConflictError(
      `Account has ${account._count.transactions} transaction(s); ` +
        'delete or reassign them before deleting the account.',
    );
  }

  try {
    await prisma.account.delete({ where: { id } });
  } catch (err) {
    translatePrismaError(err, `Account ${id} not found`);
  }
}
