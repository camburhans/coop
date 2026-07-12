'use client';

import { useEffect } from 'react';

import { Panel } from '@/components/ui/panel';

/**
 * (app) error boundary.
 *
 * A quiet, STATIC gilded-glass panel shown when a module surface throws. No
 * alarm colours or motion — a calm mono label, a plain-language line, and a
 * single "Try again" affordance that calls Next's `reset()`. Error boundaries
 * must be Client Components.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the detail in the console for the operator; the UI stays calm.
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto mt-[8vh] max-w-[560px]">
      <Panel label="Something went sideways" meta="ERROR" className="text-center">
        <p className="panel-empty">
          C.O.O.P. hit a snag loading this surface. Nothing was lost.
        </p>
        {error.digest ? (
          <p className="mt-2 font-mono text-[10px] tracking-[0.2em] text-text-faint">
            REF · {error.digest}
          </p>
        ) : null}
        <div className="panel-foot mt-6">
          <button type="button" className="foot-link is-button" onClick={reset}>
            TRY AGAIN →
          </button>
        </div>
      </Panel>
    </div>
  );
}
