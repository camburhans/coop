import type { ReactNode } from 'react';

interface PanelProps {
  /** When set, renders the mono panel-head with this label (uppercased via CSS). */
  label?: string;
  /** Optional right-aligned mono metadata, shown only alongside `label`. */
  meta?: string;
  /** Extra classes merged onto the panel surface. */
  className?: string;
  children?: ReactNode;
}

/**
 * Panel — the shared gilded-glass primitive.
 *
 * Server Component. The ONLY place the gilded glass is defined: 20px radius,
 * backdrop blur, `var(--panel)` fill, deep shadow + faint warm inset highlight,
 * and the 1px GOLD gradient border drawn with the `::before` mask technique
 * (see `.panel` in globals.css). Hover lifts the border to `border-hover` plus
 * a low gold halo. STATIC — no transitions or animations (the prototype's
 * `rise` entrance is Sprint 5).
 *
 * Never re-implement blur / gold border / shadow elsewhere — compose this.
 */
export function Panel({ label, meta, className, children }: PanelProps) {
  const classes = className ? `panel ${className}` : 'panel';

  return (
    <section className={classes}>
      {label ? (
        <header className="panel-head">
          <span className="panel-label">{label}</span>
          {meta ? <span className="panel-meta">{meta}</span> : null}
        </header>
      ) : null}
      {children}
    </section>
  );
}
