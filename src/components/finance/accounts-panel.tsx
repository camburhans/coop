'use client';

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { ProdModal } from '@/components/productivity/prod-modal';
import { Panel } from '@/components/ui/panel';

import { AccountCard } from './account-card';
import { AccountForm } from './account-form';
import { deleteJson } from './client-api';
import type { AccountView } from './view';

interface AccountsPanelProps {
  accounts: AccountView[];
}

/**
 * AccountsPanel — the ledger's accounts column (`.fin-acct-panel`, span 5).
 *
 * Client Component. Owns the create/edit modal and the delete outcome; the cards
 * themselves are dumb. A gilded "+" pill opens the modal (reusing the
 * productivity `.prod-add` treatment and modal shell verbatim).
 *
 * DELETION IS GUARDED, not cascaded. The Prisma relation is
 * `onDelete: Cascade`, so a raw delete would take real financial records with
 * it; the service refuses instead and the handler answers 409. When that
 * happens we do NOT retry, force, or silently swallow it — we surface a calm
 * mono caution telling the owner what to do first. Only an account with zero
 * transactions actually deletes.
 */
export function AccountsPanel({ accounts }: AccountsPanelProps) {
  const router = useRouter();
  const [modal, setModal] = useState<{ item?: AccountView } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(account: AccountView) {
    setBusyId(account.id);
    const result = await deleteJson(`/api/accounts/${account.id}`);
    setBusyId(null);

    if (result.ok) {
      setNotice(null);
      router.refresh();
      return;
    }

    if (result.status === 409) {
      const n = account.txCount;
      setNotice(
        `${account.name.toUpperCase()} STILL HOLDS ${n} LEDGER ${n === 1 ? 'ENTRY' : 'ENTRIES'} · ` +
          'REASSIGN OR DELETE THIS ACCOUNT’S TRANSACTIONS FIRST',
      );
      return;
    }

    setNotice(result.error ? result.error.toUpperCase() : 'THAT DIDN’T GO THROUGH · TRY AGAIN');
  }

  return (
    <Panel className="fin-acct-panel">
      <header className="panel-head">
        <div className="panel-head-title">
          <span className="panel-label">Accounts</span>
          <span className="lbl-dim">{accounts.length} on ledger</span>
        </div>
        <button type="button" className="prod-add" onClick={() => setModal({})}>
          <Plus aria-hidden strokeWidth={2} />
          Add account
        </button>
      </header>

      {notice ? (
        <p className="fin-warn" role="status">
          {notice}
        </p>
      ) : null}

      {accounts.length === 0 ? (
        <div className="prod-empty">
          <h4>No accounts yet</h4>
          <p>Every balance here is entered by hand — add your first account.</p>
        </div>
      ) : (
        <div className="facct-list">
          {accounts.map((a) => (
            <AccountCard
              key={a.id}
              account={a}
              busy={busyId === a.id}
              onEdit={() => setModal({ item: a })}
              onDelete={() => remove(a)}
            />
          ))}
        </div>
      )}

      {modal ? (
        <ProdModal
          title={modal.item ? 'Edit Account' : 'New Account'}
          onClose={() => setModal(null)}
        >
          <AccountForm account={modal.item} onClose={() => setModal(null)} />
        </ProdModal>
      ) : null}
    </Panel>
  );
}
