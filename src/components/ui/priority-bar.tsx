export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

interface PriorityBarProps {
  priority: Priority;
  className?: string;
}

/**
 * PriorityBar — a 3px vertical bar coloured by priority.
 *
 * Server Component. LOW → gold (base), MEDIUM → warn, HIGH/CRITICAL → alert,
 * each with a matching halo scaled by `--glow-mult`. Styling lives in
 * globals.css (`.pbar`, `.pbar.is-med`, `.pbar.is-high`).
 */
export function PriorityBar({ priority, className }: PriorityBarProps) {
  const variant = priority === 'MEDIUM' ? 'is-med' : priority === 'LOW' ? '' : 'is-high';
  const classes = ['pbar', variant, className].filter(Boolean).join(' ');

  return <span className={classes} role="presentation" />;
}
