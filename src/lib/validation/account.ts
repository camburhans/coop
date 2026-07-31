import { z } from 'zod';

import { AccountType } from '@prisma/client';

/**
 * Zod schemas for Account mutation input.
 *
 * The `type` field mirrors the Prisma `AccountType` enum directly (zod 4's
 * `z.enum` accepts the generated enum object), so validation can never drift
 * from the database schema.
 *
 * `balance` is a NON-NEGATIVE MAGNITUDE. Balances are entered by hand and net
 * worth is computed as `assets − liabilities`; it is the `isLiability` flag —
 * not the sign of this number — that carries the direction in that math. So a
 * liability's balance is still stored as a positive amount owed (matching the
 * prototype's `min="0"` balance input). The service converts the validated
 * number to a `Prisma.Decimal` before it touches the DB.
 *
 * The shared field definitions carry NO defaults. Defaults live only on the
 * create schema, where an absent field genuinely means "use the default". The
 * update schema is a straight `.partial()` of the base, so a PATCH that omits
 * a field never silently resets it.
 */
const accountFields = {
  name: z.string().trim().min(1, 'name is required').max(120),
  type: z.enum(AccountType),
  balance: z.coerce
    .number()
    .refine((n) => Number.isFinite(n), 'balance must be a finite number')
    .nonnegative('balance must be zero or positive'),
  isLiability: z.boolean(),
};

export const accountCreateSchema = z.object({
  ...accountFields,
  isLiability: accountFields.isLiability.default(false),
});

export const accountUpdateSchema = z.object(accountFields).partial();

/**
 * Input accepted by the account service. `z.input` keeps the defaulted
 * `isLiability` optional and accepts a numeric string for `balance`.
 */
export type AccountCreateInput = z.input<typeof accountCreateSchema>;
export type AccountUpdateInput = z.input<typeof accountUpdateSchema>;
