import type { MoneyLike } from '../format';

interface SparklineProps {
  /**
   * The series to draw, oldest → newest. Comes from
   * `getNetWorthSeries(period).points` — a DERIVED trajectory, not a stored
   * balance history (see the caveat below).
   */
  points: MoneyLike[];
  /** True when the period's net flow is negative — tints the end dot alert. */
  negative?: boolean;
  /**
   * Prefix for this instance's gradient ids. SVG `<defs>` ids are
   * document-global, so two sparklines on one page (Reporting and, later, the
   * dashboard Finance panel) must not share them.
   */
  idPrefix?: string;
  /** Accessible description of what the line shows. */
  label?: string;
}

/* Prototype geometry (renderSpark): a 320×70 box drawn 0…318 wide, 8…56 tall. */
const VIEW_W = 320;
const VIEW_H = 70;
const W = 318;
const TOP = 8;
const BOT = 56;

/**
 * Sparkline — the net-worth trajectory under the hero figure.
 *
 * Server Component and completely static: a `<path>` for the line, a second for
 * the gold gradient fill beneath it, and a dot on the last point. No animation,
 * no client JavaScript, no measurement — the geometry is computed here on the
 * server from the series the reporting service already derived.
 *
 * HONEST CAVEAT (carried up from `getNetWorthSeries`): C.O.O.P. does not
 * snapshot net worth over time. Balances are hand-kept, so this line is a
 * cash-flow trajectory reconstructed from the period's transactions, anchored so
 * the LAST point equals current net worth. It is the shape of the period's
 * movement, not a measured history — which is why it is drawn as a soft
 * unlabelled sparkline rather than an axed chart that would imply precision it
 * doesn't have.
 *
 * DISPLAY EDGE: this is one of the few places money becomes a JS number, and
 * only to turn values into pixel coordinates. Nothing here is summed — the
 * service did all the arithmetic on `Prisma.Decimal`.
 */
export function Sparkline({
  points,
  negative = false,
  idPrefix = 'fin-spark',
  label = 'Net worth trajectory for the selected period',
}: SparklineProps) {
  const values = points.map((p) => Number(String(p))).filter((n) => Number.isFinite(n));

  // A line needs two ends. The service already guarantees this (a quiet period
  // duplicates its anchor), but a single point still draws flat rather than
  // throwing away the panel.
  if (values.length === 0) return null;
  if (values.length === 1) values.push(values[0] as number);

  const min = Math.min(...values);
  const rawMax = Math.max(...values);
  // A flat series would divide by zero; give it a nominal 1-unit range so it
  // renders as a level line across the bottom of the band.
  const max = rawMax - min < 1 ? min + 1 : rawMax;

  const coords = values.map((value, i) => {
    const x = (i / (values.length - 1)) * W;
    const y = BOT - ((value - min) / (max - min)) * (BOT - TOP);
    return { x: x.toFixed(1), y: y.toFixed(1) };
  });

  const line = coords.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  const fill = `${line} L${W} ${VIEW_H} L0 ${VIEW_H} Z`;
  const last = coords[coords.length - 1] as { x: string; y: string };

  const strokeId = `${idPrefix}-stroke`;
  const fillId = `${idPrefix}-fill`;

  return (
    <svg
      className="spark"
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label={label}
    >
      <defs>
        <linearGradient id={strokeId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--gold)" stopOpacity="0.5" />
          <stop offset="1" stopColor="var(--gold-hi)" />
        </linearGradient>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--gold)" stopOpacity="0" />
        </linearGradient>
      </defs>

      <path d={fill} fill={`url(#${fillId})`} />
      <path className="line" d={line} stroke={`url(#${strokeId})`} />
      <circle
        className={negative ? 'enddot is-alert' : 'enddot'}
        cx={last.x}
        cy={last.y}
        r="3"
      />
    </svg>
  );
}
