'use client';

import { useState } from 'react';

/**
 * Client-side Lock control for the otherwise-server landing page.
 *
 * POSTs to /api/auth/lock (which clears the session cookie) and then reloads.
 * After reload the proxy sees no valid session and redirects to /unlock,
 * proving the lock half of the auth flow.
 */
export function LockButton() {
  const [locking, setLocking] = useState(false);

  async function handleLock() {
    setLocking(true);
    try {
      await fetch('/api/auth/lock', { method: 'POST' });
    } finally {
      // Full reload so the proxy re-evaluates the (now missing) session.
      window.location.reload();
    }
  }

  return (
    <button type="button" onClick={handleLock} disabled={locking}>
      {locking ? 'Locking…' : 'Lock'}
    </button>
  );
}
