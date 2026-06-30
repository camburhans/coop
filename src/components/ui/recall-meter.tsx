interface RecallMeterProps {
  /** Percentage 0–100. Drives the big figure and the fill width (static). */
  value: number;
  /** Mono caption beside the figure (e.g. "RECALL — 30 DAYS"). */
  label: string;
  className?: string;
}

/**
 * RecallMeter — the verse panel's memorization readout.
 *
 * Server Component. A big gold-gradient percentage with a mono label and a gold
 * track/fill bar. The fill width is STATIC (no animation; the prototype's
 * `fill-in` is Sprint 5). Styling lives in globals.css (`.recall-*`); only the
 * fill width is set inline since it is data-driven (a width, not a colour).
 */
export function RecallMeter({ value, label, className }: RecallMeterProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const classes = className ? `recall-meter ${className}` : 'recall-meter';

  return (
    <div className={classes}>
      <div className="recall-row">
        <span className="recall-big">{clamped}%</span>
        <span className="recall-lbl">{label}</span>
      </div>
      <div
        className="recall-track"
        role="progressbar"
        aria-label={label}
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="recall-fill" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
