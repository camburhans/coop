'use client';

import { Pencil } from 'lucide-react';

import { DeleteButton } from '@/components/productivity/delete-button';

import { money } from './format';
import type { AccountView } from './view';

interface AccountCardProps {
  account: AccountView;
  onEdit: () => void;
  onDelete: () => void;
  /** True while a mutation for this card is in flight. */
  busy?: boolean;
}

/**
 * AccountCard — one account on the ledger (`.facct-row`).
 *
 * Client Component. The name in Sora, a mono tag showing the REAL `AccountType`
 * enum label, a LIABILITY tag when the account is money owed, and the hand-kept
 * balance in mono — tinted alert and prefixed "−" for a liability, because that
 * is the side of net worth it lands on. Edit and delete sit in `.row-actions`.
 *
 * Delete reuses the productivity {@link DeleteButton} verbatim (design.md: the
 * finance surface reuses those control primitives), so it is the same two-click
 * inline confirm — first click arms, second within ~2.6s commits. The parent
 * owns what happens next, including the refused-delete guard.
 *
 * Nothing here writes a balance from transaction activity: balances are MANUAL,
 * and this card only displays what the owner entered.
 */
export function AccountCard({ account, onEdit, onDelete, busy }: AccountCardProps) {
  return (
    <div className="facct-row">
      <div className="facct-main">
        <span className="facct-name" title={account.name}>
          {account.name}
        </span>
        <div className="facct-sub">
          <span className="facct-type">{account.typeLabel}</span>
          {account.isLiability ? <em className="liab-tag">LIABILITY</em> : null}
        </div>
      </div>

      <span className={account.isLiability ? 'facct-bal liab' : 'facct-bal'}>
        {account.isLiability ? '\u2212' : ''}
        {money(account.balance)}
      </span>

      <div className="row-actions">
        <button
          type="button"
          className="icon-btn"
          onClick={onEdit}
          disabled={busy}
          aria-label={`Edit ${account.name}`}
          title="Edit"
        >
          <Pencil aria-hidden strokeWidth={1.6} />
        </button>
        <DeleteButton label={account.name} onConfirm={onDelete} disabled={busy} />
      </div>
    </div>
  );
}
