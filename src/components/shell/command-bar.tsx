import { StatusDot } from '@/components/ui/status-dot';

import { CommandField } from './command-field';
import { Greeting } from './greeting';
import { LiveClock } from './live-clock';

/**
 * The visible quick-prompt chips. Visual only in this session — they carry the
 * phrasing the real command palette (Session #6) will wire up.
 */
const QUICK_PROMPTS = [
  'Catch me up',
  'How are my finances?',
  'What needs my attention?',
  "What's on today?",
] as const;

/**
 * CommandBar — "the soul of the interface" (sticky top, blurred warm surface,
 * gold bottom border).
 *
 * Server Component. Three stacked rows:
 *  1. C.O.O.P.'s time-aware Greeting + a mono status cluster (date · weather ·
 *     live local time · indigo "C.O.O.P. READY").
 *  2. The ⌘K "Ask C.O.O.P." field (CommandField) — gold ✦ spark, ⌘K hint
 *     chip, a static gold focus glow. INERT this session: typing/submitting do
 *     nothing (the real palette is Session #6); the only wired behaviour is the
 *     ⌘K / Ctrl+K shortcut, which focuses the field.
 *  3. A row of quick-prompt chips — visual only here (wired in Session #6).
 *
 * The only live piece is the LiveClock. The date is the server date at render.
 */
export function CommandBar() {
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <header className="cmdbar" aria-label="Command bar">
      <div className="cmd-inner">
        <div className="cmd-top">
          <Greeting />
          <div className="cmd-status">
            <span>{today}</span>
            <span className="sep" aria-hidden>
              ·
            </span>
            <span className="cmd-weather">
              <b>72°</b> Sunny
            </span>
            <span className="sep" aria-hidden>
              ·
            </span>
            <span>
              <LiveClock /> LOCAL
            </span>
            <span className="sep" aria-hidden>
              ·
            </span>
            <span className="cmd-online">
              <StatusDot label="C.O.O.P. ready" /> C.O.O.P. READY
            </span>
          </div>
        </div>

        <CommandField />

        <div className="cmd-prompts">
          {QUICK_PROMPTS.map((prompt, index) => (
            <button key={prompt} type="button" className="qprompt">
              {index === 0 ? <b aria-hidden>✦</b> : null}
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
