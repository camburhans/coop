import type { ReactNode } from 'react';

interface PanelGridProps {
  children: ReactNode;
}

/**
 * PanelGrid — the dashboard's 12-column command grid.
 *
 * Server Component. Centered, ~1520px max width, 22px gap. Children place
 * themselves with the design.md span classes (`p-priorities`, `p-calendar`,
 * `p-finance`, `p-verse`). The responsive collapse — two-up ≤1180px, single
 * column ≤760px — lives with those classes in globals.css.
 */
export function PanelGrid({ children }: PanelGridProps) {
  return <div className="grid">{children}</div>;
}
