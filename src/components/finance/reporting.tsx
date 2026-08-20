import type { AccountWithTxCount } from '@/lib/finance/accounts';
import type { Period } from '@/lib/finance/period';
import type {
  CashFlow as CashFlowFigures,
  CategorySpend,
  NetWorth,
  NetWorthSeries,
} from '@/lib/finance/reporting';
import type { TransactionWithAccount } from '@/lib/finance/transactions';

import { AcctRollup } from './reporting/acct-rollup';
import { CashFlow } from './reporting/cash-flow';
import { NetWorthHero } from './reporting/net-worth-hero';
import { RecentTx } from './reporting/recent-tx';
import { SpendByCategory } from './reporting/spend-by-category';

interface ReportingProps {
  /** The selected reporting period, read from `?period=` server-side. */
  period: Period;
  /** That period's mono label (e.g. "THIS MONTH"), resolved by `lib/finance/period.ts`. */
  periodLabel: string;
  /** Assets / liabilities / net from hand-kept BALANCES. */
  netWorth: NetWorth;
  /** Every account, assets first — the rollup's rows. */
  accounts: AccountWithTxCount[];
  /** Income / spend / net derived from the period's transactions. */
  cashFlow: CashFlowFigures;
  /** Outflows per category for the period, ranked and capped. */
  categories: CategorySpend[];
  /** The period's derived net-worth trajectory (see the sparkline's caveat). */
  series: NetWorthSeries;
  /** The newest ledger entries, period-independent. */
  recent: TransactionWithAccount[];
}

/**
 * Reporting — the read-only telemetry pane.
 *
 * Server Component, and a pure LAYOUT: it owns the 12-col grid and nothing else.
 * Every figure it hands down was derived by `src/lib/finance/reporting.ts` in
 * the page loader, so no math happens here and none happens in the browser — the
 * only client code in this pane is the period chips, which just push a URL.
 *
 * The two sources of truth stay visibly separate: net worth and the rollup read
 * hand-kept BALANCES, while cash flow, spend-by-category and the sparkline are
 * derived from the period's TRANSACTIONS. Nothing on this surface mutates
 * anything — recording and correcting entries lives in the LEDGER tab.
 *
 * Budgeting figures are absent on purpose: there is no budget model in V1, so
 * there is no target to measure against and nothing here claims one.
 */
export function Reporting({
  period,
  periodLabel,
  netWorth,
  accounts,
  cashFlow,
  categories,
  series,
  recent,
}: ReportingProps) {
  // "Any activity at all?" — amounts are non-zero by schema, so an empty period
  // is exactly the one where both sides of the flow are zero.
  const hasActivity = !cashFlow.income.isZero() || !cashFlow.spend.isZero();

  return (
    <div className="fin-grid">
      <NetWorthHero
        netWorth={netWorth}
        accountCount={accounts.length}
        series={series}
        hasActivity={hasActivity}
        period={period}
        periodLabel={periodLabel}
      />
      <CashFlow figures={cashFlow} periodLabel={periodLabel} />
      <AcctRollup accounts={accounts} netWorth={netWorth} />
      <SpendByCategory categories={categories} periodLabel={periodLabel} />
      <RecentTx transactions={recent} />
    </div>
  );
}
