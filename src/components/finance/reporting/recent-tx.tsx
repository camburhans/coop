import type { TransactionWithAccount } from '@/lib/finance/transactions';

import { Panel } from '@/components/ui/panel';

import { TxFields } from '../tx-fields';
import { toTxView } from '../view';

interface RecentTxProps {
  /** The newest entries across all accounts, from `getRecentTransactions()`. */
  transactions: TransactionWithAccount[];
}

/**
 * RecentTx — the latest entries on the ledger (`.fin-recent`, full width).
 *
 * Server Component, and read-only by design: Reporting is telemetry, so these
 * rows carry NO edit or delete buttons (hence plain `.ftx-row`, not
 * `.has-actions`). Recording and correcting entries belongs to the LEDGER tab,
 * one click away — keeping mutation in one place means there is only ever one
 * answer to "where do I change this?".
 *
 * The cells come from the shared {@link TxFields}, so an entry reads exactly the
 * same here as it does in the ledger. This is also the serialization seam for
 * the pane: Prisma `Decimal` and `Date` values are projected through `view.ts`
 * into plain views before rendering.
 *
 * Deliberately period-INDEPENDENT: it answers "what did I last record?", which
 * shouldn't go blank just because the owner is looking at a quiet quarter.
 */
export function RecentTx({ transactions }: RecentTxProps) {
  const rows = transactions.map(toTxView);

  return (
    <Panel
      label="Recent transactions"
      meta={rows.length ? `LATEST ${rows.length}` : 'NONE'}
      className="fin-recent"
    >
      {rows.length === 0 ? (
        <div className="prod-empty">
          <h4>No transactions yet</h4>
          <p>Record your first entry in the LEDGER tab.</p>
        </div>
      ) : (
        <div className="ftx-list">
          {rows.map((tx) => (
            <div className="ftx-row" key={tx.id}>
              <TxFields tx={tx} />
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
