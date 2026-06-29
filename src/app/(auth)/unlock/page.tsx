'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Unlock page — the app's single passcode gate.
 *
 * Sprint 1 keeps this intentionally plain: function over form. The full glass
 * aesthetic lands in Sprint 5. All it must do today is collect a passcode, POST
 * it to /api/auth/unlock, and on success send the owner to the dashboard.
 *
 * Lives in the (auth) route group, which the proxy allowlists — so it is
 * reachable without a session.
 */
export default function UnlockPage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });

      if (res.ok) {
        // Session cookie is set; go to the protected dashboard.
        router.push('/');
        router.refresh();
        return;
      }

      if (res.status === 429) {
        setError('Too many attempts. Wait a few minutes and try again.');
      } else {
        setError('Incorrect passcode.');
      }
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '320px',
          border: '1px solid #ccc',
          borderRadius: '8px',
          padding: '1.5rem',
        }}
      >
        <h1 style={{ marginTop: 0, fontSize: '1.25rem' }}>C.O.O.P.</h1>
        <p style={{ marginTop: 0, color: '#666', fontSize: '0.875rem' }}>
          Enter passcode to unlock.
        </p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            autoFocus
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            placeholder="Passcode"
            aria-label="Passcode"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '0.5rem',
              marginBottom: '0.75rem',
            }}
          />

          <button
            type="submit"
            disabled={submitting || passcode.length === 0}
            style={{
              width: '100%',
              padding: '0.5rem',
              cursor: submitting ? 'default' : 'pointer',
            }}
          >
            {submitting ? 'Unlocking…' : 'Unlock'}
          </button>
        </form>

        {error ? (
          <p role="alert" style={{ color: '#c00', fontSize: '0.875rem', marginBottom: 0 }}>
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
