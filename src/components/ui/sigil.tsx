interface SigilProps {
  className?: string;
}

/**
 * Sigil — C.O.O.P.'s gold monogram "C".
 *
 * Server Component. A gold-gradient (gold-hi → gold) rounded tile with an inset
 * highlight and a gold halo, wrapped by a static `sigil-ring` outline. STATIC —
 * the ring's pulse is Sprint 5. Styling lives in globals.css (`.sigil*`).
 */
export function Sigil({ className }: SigilProps) {
  const classes = className ? `sigil-wrap ${className}` : 'sigil-wrap';

  return (
    <span className={classes} aria-label="C.O.O.P.">
      <span className="sigil" aria-hidden="true">
        C
      </span>
      <span className="sigil-ring" aria-hidden="true" />
    </span>
  );
}
