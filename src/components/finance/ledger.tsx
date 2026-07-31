import type { AccountWithTxCount } from '@/lib/finance/accounts';
import type { TransactionWithAccount } from '@/lib/finance/transactions';

import { AccountsPanel } from './accounts-panel';
import { TransactionsPanel } from './transactions-panel';
import { toAccountView, toTxView } from './view';

interface LedgerProps {
  /** Every account, assets-first, each with its transaction count. */
  accounts: AccountWithTxCount[];
  /** The full ledger, newest first, each row with its account joined in. */
  transactions: TransactionWithAccount[];
}

/**
 * Ledger — the manual-CRUD pane: accounts (span 5) beside transactions (span 7).
 *
 * Server Component, and the SERIALIZATION SEAM. Prisma hands back `Decimal`
 * instances and `Date` objects; neither belongs in a Client Component's props
 * (a Decimal is a class instance and cannot cross the RSC boundary at all). So
 * every row is projected here through `view.ts` into plain views — money as
 * exact decimal strings, dates as `yyyy-mm-dd` — and the client panels below
 * only ever see those.
 *
 * Both panels share the same projected account list: the accounts panel renders
 * the cards, and the transactions panel needs it for its filter chips and its
 * form's required account select.
 */
export function Ledger({ accounts, transactions }: LedgerProps) {
  const accountViews = accounts.map(toAccountView);
  const txViews = transactions.map(toTxView);

  return (
    <div className="fin-grid">
      <AccountsPanel accounts={accountViews} />
      <TransactionsPanel accounts={accountViews} transactions={txViews} />
    </div>
  );
}
