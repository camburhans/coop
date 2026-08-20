import type { CashFlow as CashFlowFigures } from '@/lib/finance/reporting';

import { Panel } from '@/components/ui/panel';

import { money } from '../format';
import { isNegativeMoney } from '../view';

interface CashFlowProps {
  /** Income, spend and net for the period — derived by the reporting service. */
  figures: CashFlowFigures;
  /** The period's mono label, e.g. "THIS MONTH". */
  periodLabel: string;
}

/**
 * CashFlow — income against spend for the selected period (`.fin-cash`, span 5).
 *
 * Server Component. `getCashFlow` did the summing on `Prisma.Decimal`; this
 * panel only renders it. The one calculation here is the BAR SPLIT, and it stays
 * on Decimal too (`income / (income + spend)`) — the ratio only becomes a
 * percentage string at the moment it enters a style attribute.
 *
 * This is a cash-flow reading, NOT a budget verdict: there is no budget model in
 * V1, so nothing here says "on track". Colour follows the finance semantics —
 * good for money in, alert for money out, and the net takes whichever it earned.
 */
export function CashFlow({ figures, periodLabel }: CashFlowProps) {
  const { income, spend, net } = figures;
  const total = income.add(spend);
  const quiet = total.isZero();
  const negative = isNegativeMoney(net);

  return (
    <Panel label="Cash flow" meta={periodLabel} className="fin-cash">
      {quiet ? (
        <div className="prod-empty">
          <h4>No activity yet</h4>
          <p>Nothing recorded for this period — the ledger is quiet.</p>
        </div>
      ) : (
        <>
          <div className="flow-figs">
            <div className="flow-fig">
              <b>INCOME</b>
              <strong className="tone-good">{money(income)}</strong>
            </div>
            <div className="flow-fig">
              <b>SPEND</b>
              <strong className="tone-alert">{money(spend)}</strong>
            </div>
          </div>

          {/* Two segments, exact-split by Decimal; aria-hidden because the
              figures above already state the numbers. */}
          <div className="flow-bar" aria-hidden>
            <span
              className="fb-in"
              style={{ width: `${income.div(total).mul(100).toFixed(1)}%` }}
            />
            <span
              className="fb-out"
              style={{ width: `${spend.div(total).mul(100).toFixed(1)}%` }}
            />
          </div>

          <div className="flow-net">
            <span>NET · {periodLabel}</span>
            <em className={negative ? 'tone-alert' : 'tone-good'}>
              {negative ? '−' : '+'}
              {money(net)}
            </em>
          </div>
        </>
      )}
    </Panel>
  );
}
