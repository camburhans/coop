import 'server-only';

import { Prisma } from '@prisma/client';

import { prisma } from '@/lib/db/client';

import { periodBounds, type Period } from './period';
import { listTransactions, type TransactionWithAccount } from './transactions';

/**
 * Finance reporting derivations — the read-only telemetry behind the Reporting
 * tab and the dashboard Finance panel.
 *
 * Two distinct sources of truth, kept separate on purpose:
 *   - NET WORTH comes from account BALANCES (manual, hand-kept). Transactions
 *     are never summed into it.
 *   - CASH FLOW, SPEND-BY-CATEGORY and the net-worth SERIES are derived from
 *     the transaction records in the selected period.
 *
 * All money arithmetic runs on Prisma.Decimal — never a JS float sum. Callers
 * format for display at the edge.
 */

const ZERO = new Prisma.Decimal(0);

export interface NetWorth {
  /** Σ balances of non-liability accounts. */
  assets: Prisma.Decimal;
  /** Σ balances of liability accounts (stored as positive magnitudes). */
  liabilities: Prisma.Decimal;
  /** assets − liabilities. */
  net: Prisma.Decimal;
}

/**
 * Net worth from account balances only: assets = Σ non-liability balances,
 * liabilities = Σ liability balances, net = assets − liabilities. Manual
 * balances are the single source — transactions do NOT feed this figure.
 */
export async function getNetWorth(): Promise<NetWorth> {
  const accounts = await prisma.account.findMany({
    select: { balance: true, isLiability: true },
  });

  let assets = ZERO;
  let liabilities = ZERO;
  for (const account of accounts) {
    if (account.isLiability) {
      liabilities = liabilities.add(account.balance);
    } else {
      assets = assets.add(account.balance);
    }
  }

  return { assets, liabilities, net: assets.sub(liabilities) };
}

export interface CashFlow {
  /** Σ positive amounts (inflows) in the period. */
  income: Prisma.Decimal;
  /** Σ magnitudes of negative amounts (outflows) in the period. */
  spend: Prisma.Decimal;
  /** income − spend. */
  net: Prisma.Decimal;
}

/**
 * Cash flow for the period, derived from transactions: income is the sum of
 * positive (inflow) amounts, spend the sum of the magnitudes of negative
 * (outflow) amounts, net = income − spend.
 */
export async function getCashFlow(
  period: Period,
  now: Date = new Date(),
): Promise<CashFlow> {
  const { start, end } = periodBounds(period, now);
  const txs = await prisma.transaction.findMany({
    where: { occurredOn: { gte: start, lt: end } },
    select: { amount: true },
  });

  let income = ZERO;
  let spend = ZERO;
  for (const { amount } of txs) {
    if (amount.isNegative()) {
      spend = spend.add(amount.abs());
    } else {
      income = income.add(amount);
    }
  }

  return { income, spend, net: income.sub(spend) };
}

export interface CategorySpend {
  category: string;
  amount: Prisma.Decimal;
}

/**
 * Outflows grouped by category for the period, each summed as a positive
 * magnitude, sorted largest-first and capped at `topN` (default 6). Inflows
 * are excluded — this is a spend breakdown.
 */
export async function getSpendByCategory(
  period: Period,
  topN = 6,
  now: Date = new Date(),
): Promise<CategorySpend[]> {
  const { start, end } = periodBounds(period, now);
  const txs = await prisma.transaction.findMany({
    where: { occurredOn: { gte: start, lt: end }, amount: { lt: 0 } },
    select: { category: true, amount: true },
  });

  const totals = new Map<string, Prisma.Decimal>();
  for (const { category, amount } of txs) {
    const current = totals.get(category) ?? ZERO;
    totals.set(category, current.add(amount.abs()));
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount.comparedTo(a.amount))
    .slice(0, topN);
}

export interface NetWorthSeries {
  /**
   * The cumulative net-worth trajectory across the period: one point per
   * distinct transaction day, plus the anchored starting point. The FIRST
   * point is `net − periodNet` and the LAST equals current net worth.
   */
  points: Prisma.Decimal[];
  /** First point: current net worth minus the period's net flow. */
  first: Prisma.Decimal;
  /** Last point: current net worth (from balances). */
  last: Prisma.Decimal;
  /** The period's net transaction flow (income − spend). */
  periodNet: Prisma.Decimal;
}

/**
 * A cumulative net-worth series across the period, anchored so the LAST point
 * equals current net worth and the FIRST equals `net − periodNet`. It walks
 * the daily net transaction flows from that starting point up to the present
 * net worth (this mirrors the prototype's spark math:
 * `renderSpark(periodTx, net - periodNet, periodNet)`).
 *
 * HONEST CAVEAT: this is a cash-flow TRAJECTORY reconstructed from transaction
 * records, not a stored balance history. C.O.O.P. keeps balances manually and
 * does not snapshot net worth over time, so past points are inferred from the
 * period's flows rather than measured. It is a shape for the sparkline, not an
 * audited ledger of historical net worth.
 */
export async function getNetWorthSeries(
  period: Period,
  now: Date = new Date(),
): Promise<NetWorthSeries> {
  const { start, end } = periodBounds(period, now);
  const [{ net }, txs] = await Promise.all([
    getNetWorth(),
    prisma.transaction.findMany({
      where: { occurredOn: { gte: start, lt: end } },
      select: { occurredOn: true, amount: true },
      orderBy: { occurredOn: 'asc' },
    }),
  ]);

  // Sum signed amounts per day, preserving day order.
  const byDay = new Map<string, Prisma.Decimal>();
  for (const { occurredOn, amount } of txs) {
    const key = occurredOn.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? ZERO).add(amount));
  }
  const days = [...byDay.keys()].sort();

  let periodNet = ZERO;
  for (const day of days) {
    periodNet = periodNet.add(byDay.get(day) as Prisma.Decimal);
  }

  const first = net.sub(periodNet);
  const points: Prisma.Decimal[] = [first];
  let running = first;
  for (const day of days) {
    running = running.add(byDay.get(day) as Prisma.Decimal);
    points.push(running);
  }
  // A period with no activity is a flat line: duplicate the anchor so callers
  // always get at least two points to draw between.
  if (points.length === 1) {
    points.push(first);
  }

  return { points, first, last: net, periodNet };
}

/**
 * The most recent transactions across all accounts (default 8), newest first,
 * each with its account joined in. Feeds the Reporting tab's "recent
 * transactions" list and the dashboard Finance panel.
 */
export async function getRecentTransactions(limit = 8): Promise<TransactionWithAccount[]> {
  return listTransactions({ limit });
}
