'use client';

import { useEffect, useRef } from 'react';

/**
 * CommandField — the ⌘K "Ask C.O.O.P." input.
 *
 * Client Component. The field itself is still INERT this session (the real
 * command palette is Session #6 — typing and submitting do nothing yet). The
 * only behaviour wired here is the shortcut the ⌘K hint promises: pressing
 * ⌘K / Ctrl+K focuses the field, which triggers its static gold focus glow.
 * Enter is swallowed so a stray submit can't navigate.
 */
export function CommandField() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="cmd-field">
      <span className="cmd-spark" aria-hidden>
        ✦
      </span>
      <input
        ref={inputRef}
        className="cmd-input"
        type="text"
        placeholder="Speak to C.O.O.P. — say 'catch me up'…"
        aria-label="Ask C.O.O.P."
        autoComplete="off"
        spellCheck={false}
        onKeyDown={(event) => {
          if (event.key === 'Enter') event.preventDefault();
        }}
      />
      <span className="cmd-kbd" aria-hidden>
        ⌘K
      </span>
    </div>
  );
}
