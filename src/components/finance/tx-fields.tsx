import { fmtDate, money } from './format';
import type { TxView } from './view';

interface TxFieldsProps {
  tx: TxView;
}

/**
 * TxFields — the cells of a ledger row (`.ftx-row`), without the row itself.
 *
 * Presentational and boundary-agnostic (no 'use client'), so BOTH sides use it:
 * the Ledger's interactive {@link TxRow} wraps it with edit/delete actions, and
 * Reporting's read-only recent list renders it bare. One definition means the
 * two lists can never drift apart in how an entry reads.
 *
 * A mono date, the description in Sora, a mono meta line (category chip + the
 * owning account), then the amount — tinted and signed by DIRECTION: an inflow
 * reads good with a "+", an outflow reads alert with a "−". That pairing is the
 * projection of the single signed `Decimal` the database stores (see view.ts);
 * the magnitude itself always prints unsigned.
 */
export function TxFields({ tx }: TxFieldsProps) {
  const out = tx.flow === 'out';

  return (
    <>
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
    </>
  );
}
