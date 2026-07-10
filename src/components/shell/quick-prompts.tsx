'use client';

import { ASK_STUB, respond } from './respond';

/**
 * The quick-prompt phrasings under the command field. Each drops C.O.O.P.'s
 * response toast — in Sprint 2 that is the static {@link ASK_STUB} for every
 * one of them (no reasoning engine until Sprint 4). The first chip carries the
 * gold ✦ spark, matching the prototype.
 */
const QUICK_PROMPTS = [
  'Catch me up',
  'How are my finances?',
  'What needs my attention?',
  "What's on today?",
] as const;

/**
 * QuickPrompts — the row of one-tap prompt chips in the command bar.
 *
 * Client Component. Every chip answers into the response toast with the
 * Sprint-2 stub; NOTHING here calls or imports an AI provider.
 */
export function QuickPrompts() {
  return (
    <div className="cmd-prompts">
      {QUICK_PROMPTS.map((prompt, index) => (
        <button key={prompt} type="button" className="qprompt" onClick={() => respond(ASK_STUB)}>
          {index === 0 ? <b aria-hidden>✦</b> : null}
          {prompt}
        </button>
      ))}
    </div>
  );
}
