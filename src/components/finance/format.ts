/**
 * Money + date formatters for the finance surface.
 *
 * Pure and framework-free, so they are safe on both sides of the RSC boundary
 * (the ledger's server projection and the client rows/forms use the same
 * helpers). Mirrors the prototype's `money()` / `fmtDate()`.
 *
 * MONEY DISCIPLINE (tech.md): all arithmetic happens on `Prisma.Decimal` in the
 * service layer. These helpers are the display EDGE — the one place a money
 * value becomes a JS number, and only to render it. Never sum through them.
 */

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const;

/**
 * Anything money-shaped that reads back as an exact decimal string: a decimal
 * string itself, a number, or a `Prisma.Decimal` (whose `toString()` is exact).
 */
export type MoneyLike = string | number | { toString(): string };

/**
 * "$1,234.56" — the MAGNITUDE of a value, always unsigned. The caller supplies
 * the sign as a glyph (`+` / `−`) and the colour tier, matching the prototype:
 * direction is carried by tint and prefix, never by a minus buried in the
 * figure. Pass `dec: 0` for the big hero figures.
 */
export function money(value: MoneyLike, dec = 2): string {
  const n = Number(String(value));
  const safe = Number.isFinite(n) ? Math.abs(n) : 0;
  return `$${safe.toLocaleString('en-US', {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  })}`;
}

/**
 * "JUL 9" — a mono, uppercase calendar day. Accepts a `yyyy-mm-dd` string (the
 * view model's date) or a Date.
 *
 * `Transaction.occurredOn` is a Postgres DATE, which Prisma hands back as a
 * Date pinned to UTC midnight, so every read here uses the UTC components. A
 * local-time read would drift a day west of Greenwich.
 */
export function fmtDate(value: string | Date | null | undefined): string {
  if (!value) return '—';

  if (value instanceof Date) {
    const month = MONTHS[value.getUTCMonth()];
    if (!month) return '—';
    return `${month} ${value.getUTCDate()}`;
  }

  const [, m, d] = value.split('-');
  const monthIndex = Number(m) - 1;
  const day = Number(d);
  const month = MONTHS[monthIndex];
  if (!month || !Number.isInteger(day)) return '—';
  return `${month} ${day}`;
}

/** `yyyy-mm-dd` (UTC calendar day) — serializable, and an `<input type="date">` value. */
export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);

  const y = value.getUTCFullYear();
  const m = String(value.getUTCMonth() + 1).padStart(2, '0');
  const d = String(value.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Today as `yyyy-mm-dd`, from the LOCAL calendar day (what "today" means to the owner). */
export function todayInputValue(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
