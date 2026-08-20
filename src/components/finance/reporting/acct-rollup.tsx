import type { AccountWithTxCount } from '@/lib/finance/accounts';
import type { NetWorth } from '@/lib/finance/reporting';

import { Panel } from '@/components/ui/panel';

import { money } from '../format';
import { accountTypeLabel, isNegativeMoney } from '../view';

interface AcctRollupProps {
  /** Every account (assets first), straight from `listAccounts()`. */
  accounts: AccountWithTxCount[];
  /** The service's assets / liabilities / net — the same figures the hero shows. */
  netWorth: NetWorth;
}

/**
 * AcctRollup — assets against liabilities, and the net position they produce
 * (`.fin-acct-report`, span 7).
 *
 * Server Component. This is the panel that SHOWS THE WORK behind the hero
 * figure: every balance that feeds net worth, split into the two groups, with
 * NET POSITION at the foot. Because both panels read the same `getNetWorth()`
 * result, the total here can never drift from the total up there.
 *
 * Liabilities are printed with a leading "−" and tinted alert. That sign is
 * PRESENTATIONAL: `Account.balance` stores a positive magnitude and
 * `isLiability` carries the role, so the minus shows what the balance does to
 * net worth rather than what is stored.
 *
 * Read-only, like the whole Reporting pane — editing balances lives in LEDGER.
 */
export function AcctRollup({ accounts, netWorth }: AcctRollupProps) {
  const assets = accounts.filter((a) => !a.isLiability);
  const liabilities = accounts.filter((a) => a.isLiability);
  const negative = isNegativeMoney(netWorth.net);

  const meta =
    `ASSETS ${money(netWorth.assets, 0)} · LIABILITIES ${money(netWorth.liabilities, 0)}`;

  return (
    <Panel label="Accounts · Position" meta={meta} className="fin-acct-report">
      {accounts.length === 0 ? (
        <div className="prod-empty">
          <h4>No accounts on ledger</h4>
          <p>Add your first account in the LEDGER tab.</p>
        </div>
      ) : (
        <>
          <div className="sublabel">ASSETS</div>
          <AccountGroup accounts={assets} />

          <div className="sublabel">LIABILITIES</div>
          <AccountGroup accounts={liabilities} />

          <div className="facct-net">
            <span>NET POSITION</span>
            <em className={negative ? 'tone-alert' : 'tone-good'}>
              {negative ? '−' : ''}
              {money(netWorth.net)}
            </em>
          </div>
        </>
      )}
    </Panel>
  );
}

/** One group's rows, or a mono "NONE RECORDED" when the group is empty. */
function AccountGroup({ accounts }: { accounts: AccountWithTxCount[] }) {
  if (accounts.length === 0) {
    return <div className="facct-none">NONE RECORDED</div>;
  }

  return (
    <>
      {accounts.map((a) => (
        <div className="frep-row" key={a.id}>
          <span className="facct-name">{a.name}</span>
          <span className="facct-type">{accountTypeLabel(a.type)}</span>
          <span className={a.isLiability ? 'facct-bal liab' : 'facct-bal'}>
            {a.isLiability ? '−' : ''}
            {money(a.balance)}
          </span>
        </div>
      ))}
    </>
  );
}
