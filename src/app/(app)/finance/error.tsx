'use client';

import { useEffect } from 'react';

import { Panel } from '@/components/ui/panel';

/**
 * /finance error boundary.
 *
 * A quiet, STATIC gilded-glass panel shown when the Finance module fails to
 * load. Calm mono label, a plain line, and a single "Try again" wired to Next's
 * `reset()`. The reassurance is literal: reads never mutate, and balances are
 * hand-kept, so a failed load has changed nothing. Error boundaries must be
 * Client Components.
 */
export default function FinanceError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto mt-[8vh] max-w-[560px]">
      <Panel label="Finance is unavailable" meta="ERROR" className="text-center">
        <p className="panel-empty">
          C.O.O.P. couldn&apos;t read your accounts and ledger just now. Nothing was changed.
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
