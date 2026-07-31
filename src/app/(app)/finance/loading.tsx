import { Panel } from '@/components/ui/panel';

/**
 * /finance loading state.
 *
 * A calm, STATIC skeleton in the Ledger frame (Accounts | Transactions) — the
 * tab the surface opens on. Muted low-opacity blocks stand in for the account
 * cards and ledger rows while the server page resolves, with a mono readout in
 * place of each panel's live count. No shimmer or motion (that is Sprint 5).
 */

function Bar({ className }: { className: string }) {
  return <div className={`h-3 rounded bg-panel-deep opacity-60 ${className}`} aria-hidden />;
}

function Block() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-panel-deep/40 p-4">
      <Bar className="w-1/2" />
      <Bar className="w-full" />
    </div>
  );
}

export default function FinanceLoading() {
  return (
    <div className="fin">
      <div className="fin-grid">
        <Panel className="fin-acct-panel">
          <header className="panel-head">
            <div className="panel-head-title">
              <span className="panel-label">Accounts</span>
              <span className="lbl-dim">loading…</span>
            </div>
          </header>
          <div className="flex flex-col gap-3">
            <Block />
            <Block />
          </div>
        </Panel>

        <Panel className="fin-tx-panel">
          <header className="panel-head">
            <div className="panel-head-title">
              <span className="panel-label">Transactions</span>
              <span className="lbl-dim">loading…</span>
            </div>
          </header>
          <div className="flex flex-col gap-3">
            <Block />
            <Block />
            <Block />
          </div>
          <p className="fin-loading">READING THE LEDGER</p>
        </Panel>
      </div>
    </div>
  );
}
