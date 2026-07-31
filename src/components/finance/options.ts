/**
 * Select/segmented option constants for the finance forms and chip rows.
 *
 * Defined as local string-literal arrays rather than imported from
 * `@prisma/client`, so the client form bundles carry no runtime Prisma
 * dependency. The literals mirror the Prisma enums exactly; the zod schemas on
 * the server (which DO derive from the enums) are the real guard — these only
 * populate the controls.
 */

/**
 * Account types, in the prototype's order, with its sentence-case labels for
 * the segmented control. The VALUES are the `AccountType` enum members; the mono
 * tag on a card uses `accountTypeLabel()` instead (see view.ts).
 */
export const ACCOUNT_TYPE_OPTIONS = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CHECKING', label: 'Checking' },
  { value: 'SAVINGS', label: 'Savings' },
  { value: 'INVESTMENT', label: 'Investment' },
  { value: 'CREDIT', label: 'Credit' },
  { value: 'LOAN', label: 'Loan' },
  { value: 'ASSET', label: 'Asset' },
] as const;

/** The asset/liability role — the projection of `Account.isLiability`. */
export const ACCOUNT_ROLE_OPTIONS = [
  { value: 'asset', label: 'Asset' },
  { value: 'liability', label: 'Liability' },
] as const;

/**
 * Transaction direction. Outflow leads because it is the common case, and
 * because it is the one that costs something — the prototype's order.
 */
export const FLOW_OPTIONS = [
  { value: 'out', label: 'Outflow' },
  { value: 'in', label: 'Inflow' },
] as const;

/**
 * Reporting period chips. `value` is the `?period=` search param read
 * server-side by `lib/finance/period.ts`; `label` is the short chip text
 * (the full mono labels — "THIS MONTH" / "THIS QUARTER" / "YEAR TO DATE" —
 * live once in period.ts and are rendered server-side).
 */
export const PERIOD_OPTIONS = [
  { value: 'month', label: 'THIS MONTH' },
  { value: 'quarter', label: 'QUARTER' },
  { value: 'ytd', label: 'YTD' },
] as const;
