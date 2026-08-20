import { BudgetStandby } from '@/components/finance/budget-standby';
import { FinanceSurface } from '@/components/finance/finance-surface';
import { Ledger } from '@/components/finance/ledger';
import { Reporting } from '@/components/finance/reporting';
import { listAccounts } from '@/lib/finance/accounts';
import { parsePeriod, periodBounds } from '@/lib/finance/period';
import {
  getCashFlow,
  getNetWorth,
  getNetWorthSeries,
  getRecentTransactions,
  getSpendByCategory,
} from '@/lib/finance/reporting';
import { listTransactions } from '@/lib/finance/transactions';

/**
 * /finance — the Finance module surface (stewardship). Replaces the Sprint 2
 * standby screen.
 *
 * Server Component, and the ONLY data loader on this surface. It reads the
 * ledger (accounts with their transaction counts, plus the full transaction
 * list) and every reporting derivation straight from the service layer —
 * reads-in-RSC, per tech.md — then renders the three panes HERE and hands them
 * to the client {@link FinanceSurface} as props. The client owns only the active
 * tab, so switching views never refetches, and NO finance math ever reaches the
 * browser.
 *
 * The reporting period is a URL search param (`?period=month|quarter|ytd`) read
 * server-side, so changing it is a server round-trip that re-derives cash flow,
 * spend-by-category and the sparkline while the active tab (client state)
 * survives. Mutations flow through the Route Handlers under
 * /api/{accounts,transactions} followed by `router.refresh()`, which re-runs
 * this loader.
 *
 * Rendered per request (dynamic): the ledger is live and sits behind the auth
 * proxy, so it is never statically cached.
 */
export const dynamic = 'force-dynamic';

/** How many entries the Reporting pane's recent list shows. */
const RECENT_TX_LIMIT = 8;

/** How many categories the spend breakdown ranks. */
const SPEND_CATEGORY_LIMIT = 6;

interface FinancePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const params = await searchParams;
  const raw = params.period;
  const period = parsePeriod(typeof raw === 'string' ? raw : null);

  // One clock for the whole render. Each service call would otherwise take its
  // own `new Date()`, and a request that straddles midnight could label the
  // period from one day while bounding it by another.
  const now = new Date();
  const { label: periodLabel } = periodBounds(period, now);

  // Every read in one round-trip. The whole ledger is loaded because the filter
  // chips need live per-account counts and manual entry keeps the set small;
  // display is capped at 30 rows in the panel, not in the query.
  const [accounts, transactions, netWorth, cashFlow, categories, series, recent] =
    await Promise.all([
      listAccounts(),
      listTransactions(),
      getNetWorth(),
      getCashFlow(period, now),
      getSpendByCategory(period, SPEND_CATEGORY_LIMIT, now),
      getNetWorthSeries(period, now),
      getRecentTransactions(RECENT_TX_LIMIT),
    ]);

  return (
    <FinanceSurface
      reporting={
        <Reporting
          period={period}
          periodLabel={periodLabel}
          netWorth={netWorth}
          accounts={accounts}
          cashFlow={cashFlow}
          categories={categories}
          series={series}
          recent={recent}
        />
      }
      ledger={<Ledger accounts={accounts} transactions={transactions} />}
      budgeting={<BudgetStandby />}
    />
  );
}
