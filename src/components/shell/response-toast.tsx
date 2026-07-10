'use client';

import { useEffect, useRef, useState } from 'react';

import { RESPOND_EVENT, type RespondDetail } from './respond';

/** How long an answer lingers before it auto-dismisses. */
const DISMISS_MS = 6500;

/**
 * ResponseToast — where every "Ask C.O.O.P." answer lands.
 *
 * Client Component. Fixed, indigo-accented (indigo = C.O.O.P.'s voice), it
 * listens on the {@link RESPOND_EVENT} bus and shows the latest line. STATIC
 * per Sprint 2: the text renders directly — NO typewriter, NO enter/exit
 * animation (both are Sprint 5). It simply mounts, then auto-dismisses after a
 * few seconds; a fresh answer replaces the current one and resets the timer.
 * `aria-live` announces it to assistive tech.
 */
export function ResponseToast() {
  const [text, setText] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onRespond(event: Event) {
      const detail = (event as CustomEvent<RespondDetail>).detail;
      if (!detail?.text) return;
      setText(detail.text);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setText(null), DISMISS_MS);
    }

    window.addEventListener(RESPOND_EVENT, onRespond);
    return () => {
      window.removeEventListener(RESPOND_EVENT, onRespond);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  if (text === null) return null;

  return (
    <div className="coop-toast" role="status" aria-live="polite">
      <b>C.O.O.P. ▸ Response</b>
      <p>{text}</p>
    </div>
  );
}
