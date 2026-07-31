import { z } from 'zod';

import { TransactionSource } from '@prisma/client';

/**
 * Zod schemas for Transaction mutation input.
 *
 * `amount` is a single SIGNED number: negative = outflow, positive = inflow,
 * and never zero. The UI speaks flow (in/out) + a positive magnitude; the
 * finance view projection (src/components/finance/view.ts, a later session)
 * converts that pair into this one signed number before it reaches the schema.
 * The schema and service only ever see the signed amount. The service converts
 * it to a `Prisma.Decimal` before writing (money is never summed as a float).
 *
 * `accountId` is REQUIRED — every transaction belongs to an account (the
 * schema's `Transaction.accountId` is non-null; the prototype's "unlinked"
 * state is not carried into the app). `category` is trimmed and uppercased so
 * it round-trips as a stable, comparable key.
 *
 * Defaults live only on the create schema (`source` → MANUAL). The update
 * schema is a straight `.partial()` of the default-free base, so a PATCH never
 * silently resets an omitted field. (The service additionally never writes
 * `source` from an update — see transactions.ts — so it is always preserved.)
 */
const transactionFields = {
  accountId: z.uuid(),
  amount: z.coerce
    .number()
    .refine((n) => Number.isFinite(n), 'amount must be a finite number')
    .refine((n) => n !== 0, 'amount must be non-zero'),
  category: z.string().trim().min(1, 'category is required').max(60).toUpperCase(),
  description: z.string().trim().min(1, 'description is required').max(200),
  occurredOn: z.coerce.date(),
  source: z.enum(TransactionSource),
};

export const transactionCreateSchema = z.object({
  ...transactionFields,
  source: transactionFields.source.default(TransactionSource.MANUAL),
});

export const transactionUpdateSchema = z.object(transactionFields).partial();

/**
 * Input accepted by the transaction service. `z.input` keeps the defaulted
 * `source` optional and accepts an ISO date string / numeric amount string.
 */
export type TransactionCreateInput = z.input<typeof transactionCreateSchema>;
export type TransactionUpdateInput = z.input<typeof transactionUpdateSchema>;
