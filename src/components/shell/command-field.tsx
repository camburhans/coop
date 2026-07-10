'use client';

import { useState, type KeyboardEvent } from 'react';

import { ASK_STUB, respond } from './respond';

/**
 * CommandField — the inline "Ask C.O.O.P." text box in the command bar.
 *
 * Client Component. A real text field: type a question, press Enter, and
 * C.O.O.P. answers in the response toast. In Sprint 2 every answer is the
 * static {@link ASK_STUB} (no reasoning until Sprint 4) — NOTHING here calls or
 * imports an AI provider.
 *
 * Deliberately SEPARATE from the ⌘K command palette: this field is for asking;
 * ⌘K (wired globally by CommandHotkey) opens the command surface for navigating
 * and creating. The ⌘K chip is just a discoverability hint for that shortcut.
 */
export function CommandField() {
  const [value, setValue] = useState('');

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (!value.trim()) return;
    respond(ASK_STUB);
    setValue('');
  }

  return (
    <div className="cmd-field">
      <span className="cmd-spark" aria-hidden>
        ✦
      </span>
      <input
        className="cmd-input"
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Speak to C.O.O.P. — say 'catch me up'…"
        aria-label="Ask C.O.O.P."
        autoComplete="off"
        spellCheck={false}
      />
      <span className="cmd-kbd" aria-hidden>
        ⌘K
      </span>
    </div>
  );
}
