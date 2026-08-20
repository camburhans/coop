import type { AccountType } from '@prisma/client';

import { toDateInputValue, type MoneyLike } from './format';

/**
 * View projection for the finance surface (Option B).
 *
 * The database keeps the full unified model: `Transaction.amount` is a single
 * SIGNED `Decimal` (negative = outflow), `Account.isLiability` carries the
 * asset/liability role, `Account.type` is the `AccountType` enum, and every
 * transaction belongs to an account. The prototype speaks a leaner language:
 * a `flow` of "in" | "out" plus a positive magnitude, a lowercase type, and a
 * plain `liability` flag.
 *
 * This module is the single, TOTAL mapping between the two — the only place
 * signed-amount handling lives (design.md: "signed-amount handling lives in the
 * finance view projection, not scattered"). Total matters: any value the DB can
 * hold projects cleanly, so nothing set outside this UI (a CSV import adapter, a
 * later surface) breaks the view or fails to round-trip.
 *
 * It also owns the SERIALIZATION boundary. `Prisma.Decimal` is a class instance
 * and cannot cross into a Client Component, so the projections below convert
 * money to exact DECIMAL STRINGS (never floats) and dates to `yyyy-mm-dd`.
 * Server Components project; client rows and forms consume the plain views.
 *
 * Pure and Prisma-runtime-free (the `AccountType` import is type-only, erased at
 * build), so it is safe in a client bundle.
 */

/** The prototype's direction: an outflow (negative) or an inflow (positive). */
export type Flow = 'in' | 'out';

/** The prototype's account role, the projection of `Account.isLiability`. */
export type AccountRole = 'asset' | 'liability';

/** Exact decimal string for a money value — no float ever passes through here. */
function decimalString(value: MoneyLike): string {
  return String(value).trim();
}

/**
 * True when a money value is negative. String-based on purpose: a decimal
 * string's sign is unambiguous, and `-0.00` is not an outflow.
 *
 * Exported because the sign of a figure is a PROJECTION decision, and this is
 * where those live: the reporting panels ask it whether a net worth, a period
 * net or a net position reads good or alert, so the "is this money negative?"
 * rule has exactly one definition (the same one `toFlow` uses) instead of a
 * `Number(x) < 0` scattered through the components.
 */
export function isNegativeMoney(value: MoneyLike): boolean {
  const raw = decimalString(value);
  return raw.startsWith('-') && /[1-9]/.test(raw);
}

/**
 * READ half of the direction projection: a signed DB amount → the prototype's
 * flow. Negative is an outflow; zero (which the schema forbids) and positive
 * read as an inflow.
 */
export function toFlow(amount: MoneyLike): Flow {
  return isNegativeMoney(amount) ? 'out' : 'in';
}

/** The unsigned magnitude of a signed amount, as an exact decimal string. */
export function magnitude(amount: MoneyLike): string {
  return decimalString(amount).replace(/^[+-]/, '');
}

/**
 * WRITE half of the direction projection: the form's flow + positive magnitude
 * → the single signed amount the API expects. Returned as a decimal STRING so
 * the value stays exact all the way to `Prisma.Decimal` (the zod schema coerces
 * it); the sign is applied textually rather than by float negation.
 */
export function toSignedAmount(flow: Flow, magnitudeValue: MoneyLike): string {
  const abs = magnitude(magnitudeValue);
  if (abs === '') return '';
  return flow === 'out' ? `-${abs}` : abs;
}

/**
 * The mono tag label for an account type. The Prisma enum values are already
 * the uppercase labels the design wants, but the map is explicit and TOTAL so a
 * new enum member is a compile error here rather than a blank tag in the UI.
 */
const TYPE_LABEL: Record<AccountType, string> = {
  CASH: 'CASH',
  CHECKING: 'CHECKING',
  SAVINGS: 'SAVINGS',
  INVESTMENT: 'INVESTMENT',
  CREDIT: 'CREDIT',
  LOAN: 'LOAN',
  ASSET: 'ASSET',
};

export function accountTypeLabel(type: AccountType): string {
  return TYPE_LABEL[type] ?? type;
}

/**
 * The role a type implies on a FRESH choice: CREDIT and LOAN are money owed, so
 * they default the account to a liability (mirrors the prototype's type→role
 * nudge). Only a default — the role segmented control stays authoritative, and
 * an existing account's stored role is never rewritten behind the owner's back.
 */
export function defaultRoleForType(type: AccountType): AccountRole {
  return type === 'CREDIT' || type === 'LOAN' ? 'liability' : 'asset';
}

/** `Account.isLiability` ↔ the prototype's role, both directions. */
export function toRole(isLiability: boolean): AccountRole {
  return isLiability ? 'liability' : 'asset';
}

export function toIsLiability(role: AccountRole): boolean {
  return role === 'liability';
}

/** Categories are free text but read as mono keys: trimmed and uppercased. */
export function normalizeCategory(value: string): string {
  return value.trim().toUpperCase();
}

/* ------------------------------------------------------------------
   Serializable view models
   ------------------------------------------------------------------ */

/** The Account columns this projection reads (structurally satisfied by the service payload). */
interface AccountRow {
  id: string;
  name: string;
  type: AccountType;
  balance: MoneyLike;
  isLiability: boolean;
  _count: { transactions: number };
}

/** One account, ready to cross into a Client Component. */
export interface AccountView {
  id: string;
  name: string;
  type: AccountType;
  /** Uppercase mono tag for `type`. */
  typeLabel: string;
  isLiability: boolean;
  /** Hand-kept balance as an exact decimal string, always a positive magnitude. */
  balance: string;
  /** How many transactions reference this account — drives the delete guard copy. */
  txCount: number;
}

export function toAccountView(account: AccountRow): AccountView {
  return {
    id: account.id,
    name: account.name,
    type: account.type,
    typeLabel: accountTypeLabel(account.type),
    isLiability: account.isLiability,
    balance: magnitude(account.balance),
    txCount: account._count.transactions,
  };
}

/** The Transaction columns this projection reads (plus its joined account). */
interface TransactionRow {
  id: string;
  accountId: string;
  amount: MoneyLike;
  category: string;
  description: string;
  occurredOn: Date | string;
  account: { name: string };
}

/** One ledger entry, ready to cross into a Client Component. */
export interface TxView {
  id: string;
  accountId: string;
  accountName: string;
  /** Projected direction — the row's tint and its +/− glyph. */
  flow: Flow;
  /** Unsigned amount as an exact decimal string (what the form edits). */
  magnitude: string;
  category: string;
  description: string;
  /** `yyyy-mm-dd`, the UTC calendar day of `occurredOn`. */
  date: string;
}

export function toTxView(tx: TransactionRow): TxView {
  return {
    id: tx.id,
    accountId: tx.accountId,
    accountName: tx.account.name,
    flow: toFlow(tx.amount),
    magnitude: magnitude(tx.amount),
    category: tx.category,
    description: tx.description,
    date: toDateInputValue(tx.occurredOn),
  };
}
