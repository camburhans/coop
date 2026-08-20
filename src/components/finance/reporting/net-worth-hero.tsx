import type { Period } from '@/lib/finance/period';
import type { NetWorth, NetWorthSeries } from '@/lib/finance/reporting';

import { Panel } from '@/components/ui/panel';

import { fmtDate, money, todayInputValue } from '../format';
import { PeriodChips } from '../period-chips';
import { isNegativeMoney } from '../view';
import { Sparkline } from './sparkline';

interface NetWorthHeroProps {
  /** Assets, liabilities and net — all from hand-kept BALANCES. */
  netWorth: NetWorth;
  /** How many accounts the figure is drawn from (the AS OF line). */
  accountCount: number;
  /** The period's derived trajectory + its net flow. */
  series: NetWorthSeries;
  /** False when the period holds no transactions at all. */
  hasActivity: boolean;
  /** The selected period — drives the chips' active state. */
  period: Period;
  /** That period's mono label, e.g. "THIS MONTH". */
  periodLabel: string;
}

/**
 * NetWorthHero — the lead panel of the Reporting pane (`.fin-hero`, span 7).
 *
 * Server Component. Every figure arrives pre-derived from
 * `src/lib/finance/reporting.ts`; nothing is computed here beyond choosing a
 * glyph and a tone. Two DIFFERENT sources sit deliberately side by side:
 *
 *   - the big figure is NET WORTH from account balances (manual, authoritative),
 *   - the delta line is the period's NET TRANSACTION FLOW from the ledger.
 *
 * They are not the same measurement and the copy says so — the delta is always
 * stamped with its period, so it never reads as "net worth changed by X".
 *
 * The period chips are the only client code in this panel, and they only push a
 * URL. All the math stays on the server.
 */
export function NetWorthHero({
  netWorth,
  accountCount,
  series,
  hasActivity,
  period,
  periodLabel,
}: NetWorthHeroProps) {
  const negativeNet = isNegativeMoney(netWorth.net);
  const negativeFlow = isNegativeMoney(series.periodNet);

  const accountWord = accountCount === 1 ? 'ACCOUNT' : 'ACCOUNTS';
  const asOf = `AS OF ${fmtDate(todayInputValue())} · ${accountCount} ${accountWord}`;

  /* The delta is honest about having nothing to report, rather than showing $0. */
  let deltaTone = 'fin-delta tone-neutral';
  let deltaText: string;
  if (accountCount === 0) {
    deltaText = 'NO ACCOUNTS ON LEDGER';
  } else if (!hasActivity) {
    deltaText = `NO ACTIVITY · ${periodLabel}`;
  } else {
    deltaTone = negativeFlow ? 'fin-delta tone-alert' : 'fin-delta tone-good';
    deltaText = `${negativeFlow ? '▼ −' : '▲ +'}${money(series.periodNet)} · ${periodLabel}`;
  }

  return (
    <Panel label="Net worth · Telemetry" meta={asOf} className="fin-hero">
      <div className="networth-label">TOTAL NET WORTH</div>
      <div className="networth">
        {negativeNet ? '−' : ''}
        {money(netWorth.net, 0)}
      </div>

      <div className="fin-status-row">
        <span className={deltaTone}>{deltaText}</span>
        <PeriodChips value={period} />
      </div>

      {/*
        With no accounts there is no trajectory to draw — a flat line at zero
        would be decoration pretending to be data. A quiet PERIOD still draws
        (flat at current net worth), because "nothing moved" is a real reading.
      */}
      {accountCount > 0 ? (
        <Sparkline
          points={series.points}
          negative={negativeFlow}
          label={`Net worth trajectory · ${periodLabel}`}
        />
      ) : null}
    </Panel>
  );
}
