/**
 * The response bridge — how any surface hands C.O.O.P.'s answer to the toast.
 *
 * A tiny window CustomEvent bus (mirroring the prototype's `coop:tweaks`
 * pattern) rather than a store, keeping zustand scoped to just palette + prefs
 * per tech.md. The command-bar quick-prompt chips and the palette's ASK path
 * call {@link respond}; <ResponseToast/> listens and renders.
 *
 * Sprint 2 has no reasoning engine — every answer is {@link ASK_STUB}. NOTHING
 * here calls or imports an AI provider; that lands in Sprint 4.
 */
export const RESPOND_EVENT = 'coop:respond';

/** The single Sprint-2 answer. C.O.O.P. can navigate and capture, not reason. */
export const ASK_STUB =
  "C.O.O.P.'s reasoning comes online in Sprint 4. For now I can navigate and capture tasks.";

export interface RespondDetail {
  text: string;
}

/** Push a line of C.O.O.P.'s voice to the response toast. No-op on the server. */
export function respond(text: string): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<RespondDetail>(RESPOND_EVENT, { detail: { text } }));
}
