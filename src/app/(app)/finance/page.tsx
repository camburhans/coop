import { BudgetStandby } from '@/components/finance/budget-standby';
import { FinanceSurface } from '@/components/finance/finance-surface';
import { Ledger } from '@/components/finance/ledger';
import { Reporting } from '@/components/finance/reporting';
import { listAccounts } from '@/lib/finance/accounts';
import { parsePeriod, periodBounds } from '@/lib/finance/period';
import { listTransactions } from '@/lib/finance/transactions';

/**
 * /finance — the Finance module surface (stewardship). Replaces the Sprint 2
 * standby screen.
 *
 * Server Component. Reads the accounts (each with its transaction count) and the
 * full transaction ledger straight from the service layer — reads-in-RSC, per
 * tech.md — and renders the three panes HERE, handing them to the client
 * {@link FinanceSurface} as props. The client owns only the active tab, so
 * switching views never refetches.
 *
 * The reporting period is a URL search param (`?period=month|quarter|ytd`) read
 * server-side, so every derivation stays in RSC. Mutations flow through the
 * Route Handlers under /api/{accounts,transactions} followed by
 * `router.refresh()`, which re-runs this loader.
 *
 * Rendered per request (dynamic): the ledger is live and sits behind the auth
 * proxy, so it is never statically cached.
 */
export const dynamic = 'force-dynamic';

interface FinancePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FinancePage({ searchParams }: FinancePageProps) {
  const params = await searchParams;
  const raw = params.period;
  const period = parsePeriod(typeof raw === 'string' ? raw : null);
  const { label: periodLabel } = periodBounds(period);

  // The whole ledger is loaded once: the filter chips need live per-account
  // counts, and manual entry keeps this set small. Display is capped at 30 rows
  // in the panel, not in the query.
  const [accounts, transactions] = await Promise.all([listAccounts(), listTransactions()]);

  return (
    <FinanceSurface
      reporting={<Reporting period={period} periodLabel={periodLabel} />}
      ledger={<Ledger accounts={accounts} transactions={transactions} />}
      budgeting={<BudgetStandby />}
    />
  );
}
