'use client';

import { Pencil } from 'lucide-react';

import { DeleteButton } from '@/components/productivity/delete-button';

import { TxFields } from './tx-fields';
import type { TxView } from './view';

interface TxRowProps {
  tx: TxView;
  onEdit: () => void;
  onDelete: () => void;
  /** True while a mutation for this row is in flight. */
  busy?: boolean;
}

/**
 * TxRow — one ledger entry, WITH its actions (`.ftx-row.has-actions`).
 *
 * Client Component. The cells themselves come from the shared {@link TxFields}
 * so this row and Reporting's read-only recent list stay identical in how an
 * entry reads; all this adds is the action column.
 *
 * Delete reuses the productivity {@link DeleteButton} verbatim, so it is the
 * same two-click inline confirm used everywhere else in C.O.O.P. Deleting an
 * entry removes a RECORD only — no balance moves, because balances are manual.
 */
export function TxRow({ tx, onEdit, onDelete, busy }: TxRowProps) {
  return (
    <div className="ftx-row has-actions">
      <TxFields tx={tx} />

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
