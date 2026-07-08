import { AiNote } from '@/components/ui/ai-note';
import { Label } from '@/components/ui/label';
import { Panel } from '@/components/ui/panel';

/**
 * Static sparkline geometry. Purely decorative — a plausible upward drift, NOT
 * real data. Replaced with a real series when Finance is wired in Sprint 3.
 */
const SPARK_FILL =
  'M0 52 L22 49 L44 53 L66 44 L88 47 L110 38 L132 42 L154 33 L176 37 L198 27 L220 31 L242 22 L264 26 L286 17 L308 20 L318 13 L318 70 L0 70 Z';
const SPARK_LINE =
  'M0 52 L22 49 L44 53 L66 44 L88 47 L110 38 L132 42 L154 33 L176 37 L198 27 L220 31 L242 22 L264 26 L286 17 L308 20 L318 13';

/**
 * Finance · Stewardship — the hero-weight floor-left panel (7-wide).
 *
 * Server Component, and a first-class STATIC placeholder: a big gold-gradient
 * net-worth figure, a delta + budget chip, a sparkline, account chips, a
 * recent-spend list, an upcoming-bills line, and C.O.O.P.'s note. Every figure
 * is invented and marked "AWAITING SPRINT 3" — NO data is wired here (Finance
 * lands in Sprint 3). It is meant to look finished while reading clearly as
 * not-yet-live.
 */
export function FinancePlaceholder() {
  return (
    <Panel label="Finance · Stewardship" meta="AWAITING SPRINT 3" className="p-finance">
      <div className="networth-label">TOTAL NET WORTH</div>
      <div className="networth">$1,284,910</div>

      <div className="fin-status">
        <div className="delta">+$8,240 · +0.65% THIS MONTH</div>
        <span className="budget-chip is-ok">ON TRACK</span>
      </div>

      <svg className="spark" viewBox="0 0 320 70" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="finSparkStroke" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="var(--gold)" stopOpacity="0.5" />
            <stop offset="1" stopColor="var(--gold-hi)" />
          </linearGradient>
          <linearGradient id="finSparkFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--gold)" stopOpacity="0.16" />
            <stop offset="1" stopColor="var(--gold)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path fill="url(#finSparkFill)" d={SPARK_FILL} />
        <path className="line" stroke="url(#finSparkStroke)" d={SPARK_LINE} />
        <circle cx="318" cy="13" r="3" fill="var(--good)" />
      </svg>

      <div className="accounts">
        <div className="acct">
          <b>CHECKING</b>
          <strong>$24,180</strong>
          <i>OPERATING · LIQUID</i>
        </div>
        <div className="acct">
          <b>SAVINGS</b>
          <strong>$86,400</strong>
          <i>6-MONTH RESERVE</i>
        </div>
        <div className="acct">
          <b>INVESTMENTS</b>
          <strong>$1,174,330</strong>
          <i className="is-up">+1.2% TODAY</i>
        </div>
      </div>

      <div className="bills">
        <span className="bills-lbl">RECENT SPEND · LAST 7 DAYS</span>
        <span className="bills-val">
          <em>$1,905</em> · GROCERIES, FUEL, DINING
        </span>
      </div>

      <div className="bills mt-3">
        <span className="bills-lbl">UPCOMING BILLS · NEXT 7 DAYS</span>
        <span className="bills-val">
          <em>$3,420</em> · 4 DUE
        </span>
      </div>

      <AiNote>
        I&apos;ll watch your stewardship once Finance is wired in <em>Sprint 3</em>.
      </AiNote>

      <Label className="mt-4 block">PLACEHOLDER FIGURES · AWAITING SPRINT 3</Label>
    </Panel>
  );
}
