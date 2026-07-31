'use client';

import { Pencil } from 'lucide-react';

import { DeleteButton } from '@/components/productivity/delete-button';

import { fmtDate, money } from './format';
import type { TxView } from './view';

interface TxRowProps {
  tx: TxView;
  onEdit: () => void;
  onDelete: () => void;
  /** True while a mutation for this row is in flight. */
  busy?: boolean;
}

/**
 * TxRow — one ledger entry (`.ftx-row`).
 *
 * Client Component. A mono date, the description in Sora, a mono meta line
 * (category chip + the owning account), then the amount — tinted and signed by
 * DIRECTION: an inflow reads good with a "+", an outflow reads alert with a
 * "−". That pairing is the projection from the single signed `Decimal` the
 * database stores (see view.ts); the magnitude itself is always printed
 * unsigned.
 *
 * Delete reuses the productivity {@link DeleteButton} verbatim, so it is the
 * same two-click inline confirm used everywhere else in C.O.O.P. Deleting an
 * entry removes a RECORD only — no balance moves, because balances are manual.
 */
export function TxRow({ tx, onEdit, onDelete, busy }: TxRowProps) {
  const out = tx.flow === 'out';

  return (
    <div className="ftx-row has-actions">
      <span className="ftx-date">{fmtDate(tx.date)}</span>

      <div className="ftx-body">
        <span className="ftx-desc" title={tx.description}>
          {tx.description}
        </span>
        <div className="ftx-meta">
          <span className="fcat-chip">{tx.category}</span>
          <span className="ftx-acct">{tx.accountName.toUpperCase()}</span>
        </div>
      </div>

      <span className={out ? 'ftx-amt out' : 'ftx-amt in'}>
        {out ? '\u2212' : '+'}
        {money(tx.magnitude)}
      </span>

      <div className="row-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onEdit}
          disabled={busy}
          aria-label={`Edit ${tx.description}`}
          title="Edit"
        >
          <Pencil aria-hidden strokeWidth={1.6} />
        </button>
        <DeleteButton label={tx.description} onConfirm={onDelete} disabled={busy} />
      </div>
    </div>
  );
}
