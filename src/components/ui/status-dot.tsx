interface StatusDotProps {
  /** Accessible label for the presence state (e.g. "C.O.O.P. ready"). */
  label?: string;
  className?: string;
}

/**
 * StatusDot — a small INDIGO presence dot (C.O.O.P.'s voice cue).
 *
 * Server Component. Indigo is reserved for C.O.O.P.'s presence/voice. STATIC —
 * the "breathe" pulse is Sprint 5. Styling lives in globals.css (`.status-dot`).
 */
export function StatusDot({ label, className }: StatusDotProps) {
  const classes = className ? `status-dot ${className}` : 'status-dot';

  return (
    <span
      className={classes}
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  );
}
