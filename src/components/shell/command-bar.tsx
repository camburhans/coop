import { StatusDot } from '@/components/ui/status-dot';

import { CommandField } from './command-field';
import { Greeting } from './greeting';
import { LiveClock } from './live-clock';
import { QuickPrompts } from './quick-prompts';

/**
 * CommandBar — "the soul of the interface" (sticky top, blurred warm surface,
 * gold bottom border).
 *
 * Server Component. Three stacked rows:
 *  1. C.O.O.P.'s time-aware Greeting + a mono status cluster (date · weather ·
 *     live local time · indigo "C.O.O.P. READY").
 *  2. The "Ask C.O.O.P." field (CommandField) — a real text box: type a
 *     question, press Enter, and the answer lands in the response toast (the
 *     Sprint-2 stub for now). Separate from ⌘K, which opens the command palette
 *     (CommandHotkey); the ⌘K chip is just a hint for that shortcut.
 *  3. A row of quick-prompt chips (QuickPrompts) — each drops the Sprint-2 stub
 *     answer into the response toast.
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

        <QuickPrompts />
      </div>
    </header>
  );
}
