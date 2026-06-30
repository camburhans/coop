export type Energy = 'HIGH' | 'MEDIUM' | 'LOW';

interface EnergyTagProps {
  energy: Energy;
  className?: string;
}

/**
 * EnergyTag — a mono pill signalling energy level.
 *
 * Server Component. HIGH → good (green; high energy is positive), MEDIUM →
 * warn, LOW → text-faint. Styling lives in globals.css (`.energy.is-*`).
 */
export function EnergyTag({ energy, className }: EnergyTagProps) {
  const variant = energy === 'HIGH' ? 'is-hi' : energy === 'MEDIUM' ? 'is-md' : 'is-lo';
  const classes = ['energy', variant, className].filter(Boolean).join(' ');

  return <span className={classes}>{energy}</span>;
}
