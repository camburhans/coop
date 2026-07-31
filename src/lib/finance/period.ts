import 'server-only';

/**
 * Reporting period selection. Mirrors the prototype's period model: THIS MONTH
 * (month-to-date), THIS QUARTER (quarter-to-date), and YEAR TO DATE.
 */
export type Period = 'month' | 'quarter' | 'ytd';

export interface PeriodBounds {
  /** Inclusive lower bound (first day of the period, at UTC midnight). */
  start: Date;
  /** Exclusive upper bound (start of tomorrow, at UTC midnight). */
  end: Date;
  /** The mono display label, e.g. "THIS MONTH". */
  label: string;
}

const LABELS: Record<Period, string> = {
  month: 'THIS MONTH',
  quarter: 'THIS QUARTER',
  ytd: 'YEAR TO DATE',
};

/** Parse an arbitrary string to a Period, defaulting to 'month'. */
export function parsePeriod(value: string | null | undefined): Period {
  return value === 'quarter' || value === 'ytd' ? value : 'month';
}

/**
 * Compute the bounds for a reporting period from the server's LOCAL calendar
 * day (mirroring the prototype's `periodStart`: month → the 1st, quarter → the
 * first day of the current 3-month block, ytd → Jan 1).
 *
 * The boundary Dates are built at UTC midnight of those calendar dates. That
 * is deliberate: `Transaction.occurredOn` is a `@db.Date`, which Prisma reads
 * back and compares as a UTC-midnight instant. Anchoring the bounds to UTC
 * midnight of the same calendar dates keeps the `gte start / lt end` range
 * free of the off-by-one drift you get from mixing local-midnight bounds with
 * a UTC-midnight column. `end` is the start of tomorrow, so today is fully
 * included.
 */
export function periodBounds(period: Period, now: Date = new Date()): PeriodBounds {
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  let startMonth: number;
  if (period === 'month') {
    startMonth = month;
  } else if (period === 'quarter') {
    startMonth = Math.floor(month / 3) * 3;
  } else {
    startMonth = 0;
  }

  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, month, day + 1));

  return { start, end, label: LABELS[period] };
}
