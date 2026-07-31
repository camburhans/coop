'use client';

import type { AccountView } from './view';

/** The ledger filter: `null` = every entry, otherwise one account's id. */
export type TxFilterValue = string | null;

interface TxFilterChipsProps {
  accounts: AccountView[];
  counts: {
    all: number;
    byAccount: Record<string, number>;
  };
  value: TxFilterValue;
  onChange: (value: TxFilterValue) => void;
}

/**
 * TxFilterChips — the ledger's account filter row.
 *
 * Client Component reusing the productivity chip treatment verbatim
 * (`.task-filter` / `.tf-chip`): one chip for ALL plus one per account, each
 * carrying a live count. Filtering is pure client state — the whole ledger is
 * already loaded — so narrowing is instant and never hits the server.
 *
 * There is deliberately NO "UNLINKED" chip. `Transaction.accountId` is
 * non-null: every entry belongs to an account, so the prototype's orphan state
 * cannot occur here (design.md). Chips are toggle buttons, keyboard-reachable.
 */
export function TxFilterChips({ accounts, counts, value, onChange }: TxFilterChipsProps) {
  return (
    <div className="task-filter">
      <button
        type="button"
        className={value === null ? 'tf-chip active' : 'tf-chip'}
        aria-pressed={value === null}
        onClick={() => onChange(null)}
      >
        ALL <b>{counts.all}</b>
      </button>

      {accounts.map((a) => (
        <button
          key={a.id}
          type="button"
          className={value === a.id ? 'tf-chip active' : 'tf-chip'}
          aria-pressed={value === a.id}
          onClick={() => onChange(a.id)}
        >
          {a.name.toUpperCase()} <b>{counts.byAccount[a.id] ?? 0}</b>
        </button>
      ))}
    </div>
  );
}
