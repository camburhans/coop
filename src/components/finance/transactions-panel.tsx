'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ProdModal } from '@/components/productivity/prod-modal';
import { AiNote } from '@/components/ui/ai-note';
import { Panel } from '@/components/ui/panel';

import { deleteJson } from './client-api';
import { fmtDate } from './format';
import { TxFilterChips, type TxFilterValue } from './tx-filter-chips';
import { TxForm } from './tx-form';
import { TxRow } from './tx-row';
import type { AccountView, TxView } from './view';

interface TransactionsPanelProps {
  accounts: AccountView[];
  /** The full ledger, newest first. */
  transactions: TxView[];
}

/** How many rows the panel shows at once (the prototype's cap). */
const TX_CAP = 30;

/**
 * TransactionsPanel — the ledger's transactions column (`.fin-tx-panel`, span 7).
 *
 * Client Component. Owns two pieces of genuine client state: the account filter
 * and the create/edit modal. Counts, the visible slice, the category datalist
 * and C.O.O.P.'s foot-note read are all derived here from the loaded ledger, so
 * narrowing is instant with no server round-trip. Mutations still go through the
 * Route Handlers followed by `router.refresh()`, which re-runs the server page
 * and feeds fresh rows back in while the filter selection survives.
 *
 * Display is capped at the latest {@link TX_CAP} entries of the current view —
 * with a mono note saying so, and pointing at the filter as the way to narrow.
 * The cap is on RENDERING only; every count above it is computed from the full
 * set, so a chip never lies about how much is there.
 *
 * Nothing here touches a balance. Entries are a record; balances are hand-kept.
 */
export function TransactionsPanel({ accounts, transactions }: TransactionsPanelProps) {
  const router = useRouter();
  const [filter, setFilter] = useState<TxFilterValue>(null);
  const [modal, setModal] = useState<{ item?: TxView } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // A filter can outlive its account (deleted, or gone on refresh). Fall back to
  // "all" rather than showing a permanently empty list.
  const activeFilter: TxFilterValue =
    filter !== null && !accounts.some((a) => a.id === filter) ? null : filter;

  const counts = useMemo(() => {
    const byAccount: Record<string, number> = {};
    for (const a of accounts) byAccount[a.id] = 0;
    for (const t of transactions) {
      if (t.accountId in byAccount) byAccount[t.accountId] = (byAccount[t.accountId] ?? 0) + 1;
    }
    return { all: transactions.length, byAccount };
  }, [accounts, transactions]);

  const visible = useMemo(
    () =>
      activeFilter === null
        ? transactions
        : transactions.filter((t) => t.accountId === activeFilter),
    [transactions, activeFilter],
  );

  const shown = visible.slice(0, TX_CAP);

  const categories = useMemo(
    () => [...new Set(transactions.map((t) => t.category))].sort(),
    [transactions],
  );

  /** C.O.O.P.'s stewardship read, keyed to the newest entry on the ledger. */
  const note = useMemo(() => {
    if (transactions.length === 0) {
      return 'An empty ledger tells no story — record the first entry and I’ll keep the account.';
    }
    // The service returns newest-first; reduce anyway so the read never depends
    // on ordering (yyyy-mm-dd compares correctly as a string).
    const newest = transactions.reduce((max, t) => (t.date > max ? t.date : max), transactions[0]!.date);
    return `Ledger current through ${fmtDate(newest)}. Balances here are manual — faithful entries are quiet stewardship, and I’ll keep the watch.`;
  }, [transactions]);

  async function remove(tx: TxView) {
    setBusyId(tx.id);
    const result = await deleteJson(`/api/transactions/${tx.id}`);
    setBusyId(null);
    if (result.ok) router.refresh();
  }

  return (
    <Panel className="fin-tx-panel">
      <header className="panel-head">
        <div className="panel-head-title">
          <span className="panel-label">Transactions</span>
          <span className="lbl-dim">
            {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
          </span>
        </div>
        <button type="button" className="prod-add" onClick={() => setModal({})}>
          <Plus aria-hidden strokeWidth={2} />
          Add entry
        </button>
      </header>

      <TxFilterChips
        accounts={accounts}
        counts={counts}
        value={activeFilter}
        onChange={setFilter}
      />

      {shown.length === 0 ? (
        <div className="prod-empty">
          <h4>Nothing in this view</h4>
          <p>
            {activeFilter === null
              ? 'Record your first entry to start the ledger.'
              : 'No entries for this account yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="ftx-list">
            {shown.map((t) => (
              <TxRow
                key={t.id}
                tx={t}
                busy={busyId === t.id}
                onEdit={() => setModal({ item: t })}
                onDelete={() => remove(t)}
              />
            ))}
          </div>
          {visible.length > TX_CAP ? (
            <p className="fin-cap-note">
              SHOWING LATEST {TX_CAP} OF {visible.length} — FILTER BY ACCOUNT TO NARROW
            </p>
          ) : null}
        </>
      )}

      <AiNote className="fin-note">{note}</AiNote>

      {modal ? (
        <ProdModal
          title={modal.item ? 'Edit Transaction' : 'New Transaction'}
          onClose={() => setModal(null)}
        >
          <TxForm
            tx={modal.item}
            accounts={accounts}
            categories={categories}
            defaultAccountId={activeFilter}
            onClose={() => setModal(null)}
          />
        </ProdModal>
      ) : null}
    </Panel>
  );
}
