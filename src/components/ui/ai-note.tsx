import type { ReactNode } from 'react';

interface AiNoteProps {
  children: ReactNode;
  className?: string;
}

/**
 * AiNote — C.O.O.P.'s threaded voice annotation.
 *
 * Server Component. An indigo ✦ glyph beside a mono text block, separated from
 * the panel body by a top border. Indigo is reserved for C.O.O.P.'s voice. In
 * Sprint 2 it renders whatever text it is given (static placeholder copy);
 * wrap words in <em> to emphasise them. Styling lives in globals.css
 * (`.ai-note`).
 */
export function AiNote({ children, className }: AiNoteProps) {
  const classes = className ? `ai-note ${className}` : 'ai-note';

  return (
    <div className={classes}>
      <span className="ai-note-glyph" aria-hidden="true">
        ✦
      </span>
      <p>{children}</p>
    </div>
  );
}
