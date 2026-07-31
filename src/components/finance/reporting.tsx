import type { Period } from '@/lib/finance/period';

import { Panel } from '@/components/ui/panel';

interface ReportingProps {
  /** The selected reporting period, read from `?period=` server-side. */
  period: Period;
  /** That period's mono label (e.g. "THIS MONTH"), resolved by `lib/finance/period.ts`. */
  periodLabel: string;
}

/**
 * Reporting — the read-only telemetry pane.
 *
 * SCAFFOLD. The tab, its keyboard wiring and this pane's slot are live; the
 * figures land in the next session (net-worth hero + sparkline, cash flow,
 * assets-vs-liabilities rollup, spend by category, recent transactions — all
 * derived server-side through `src/lib/finance/reporting.ts`, which already
 * exists). The period selection is already plumbed end to end, so the surface
 * only needs its panels filled in.
 *
 * Server Component: every figure here will be derived in RSC and handed down,
 * so this pane never becomes a client fetch.
 */
export function Reporting({ period, periodLabel }: ReportingProps) {
  return (
    <div className="fin-grid">
      <Panel label="Reporting" meta={`${periodLabel} · STANDBY`} className="fin-recent">
        <div className="prod-empty">
          <h4>Telemetry is being provisioned</h4>
          <p>
            Net worth, cash flow, the account rollup and spend by category arrive with this
            surface. The LEDGER tab is live — every entry you record there feeds these figures.
          </p>
        </div>
        <p className="fin-loading">PERIOD · {period.toUpperCase()}</p>
      </Panel>
    </div>
  );
}
