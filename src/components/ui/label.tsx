import type { ReactNode } from 'react';

interface LabelProps {
  children: ReactNode;
  /** `faint` (default) or `soft` — the two caption tones from design.md. */
  tone?: 'faint' | 'soft';
  className?: string;
}

/**
 * Label — a mono, uppercase, tracked-out caption.
 *
 * Server Component. Used for metadata captions and section labels. Defaults to
 * the `text-faint` tone; pass `tone="soft"` for the brighter `text-soft`.
 * Styling lives in globals.css (`.coop-label`).
 */
export function Label({ children, tone = 'faint', className }: LabelProps) {
  const classes = ['coop-label', tone === 'soft' ? 'is-soft' : '', className]
    .filter(Boolean)
    .join(' ');

  return <span className={classes}>{children}</span>;
}
