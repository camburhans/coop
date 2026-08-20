import type { CategorySpend } from '@/lib/finance/reporting';

import { Panel } from '@/components/ui/panel';

import { money } from '../format';

interface SpendByCategoryProps {
  /** Outflows per category, largest first, already capped by the service. */
  categories: CategorySpend[];
  /** The period's mono label, e.g. "THIS MONTH". */
  periodLabel: string;
}

/** Even the smallest bar keeps a visible stub, so a tiny category still reads. */
const MIN_WIDTH_PCT = 4;

/**
 * SpendByCategory — where the period's outflows went (`.fin-cats`, span 5).
 *
 * Server Component. `getSpendByCategory` grouped, summed and ranked on
 * `Prisma.Decimal` and capped the list; this panel only draws it. Bars are
 * scaled RELATIVE to the largest category (not to total spend), so the list
 * reads as a ranking — which is the question it answers.
 *
 * Inflows are excluded by the service: this is a spend breakdown, and folding a
 * paycheque in would flatten every real category into noise.
 */
export function SpendByCategory({ categories, periodLabel }: SpendByCategoryProps) {
  const largest = categories[0]?.amount;
  const meta = categories.length
    ? `${categories.length} ${categories.length === 1 ? 'CATEGORY' : 'CATEGORIES'} · ${periodLabel}`
    : periodLabel;

  return (
    <Panel label="Spend by category" meta={meta} className="fin-cats">
      {!largest ? (
        <div className="prod-empty">
          <h4>No spend recorded</h4>
          <p>No outflows this period — nothing to break down.</p>
        </div>
      ) : (
        <div className="fcat-list">
          {categories.map((row) => {
            // Share of the largest category, kept on Decimal until it becomes a
            // CSS width. Nothing is summed here.
            const share = row.amount.div(largest).mul(100).toNumber();
            const width = Math.max(MIN_WIDTH_PCT, share).toFixed(1);

            return (
              <div className="fcat-row" key={row.category}>
                <span className="fcat-name" title={row.category}>
                  {row.category}
                </span>
                <div className="fcat-track" aria-hidden>
                  <div className="fcat-fill" style={{ width: `${width}%` }} />
                </div>
                <span className="fcat-amt">{money(row.amount)}</span>
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}
