'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

interface VerseSetProps {
  /** The current verse, when one is set — pre-fills the form for editing. */
  current?: { reference: string; text: string };
}

/**
 * VerseSet — the Scripture panel's minimal "set verse" affordance.
 *
 * Client Component. A mono toggle reveals a two-field inline form (reference +
 * passage) that PUTs to `/api/verse/current` and `router.refresh()`es on
 * success so the server-rendered panel picks up the new verse. Kept
 * self-contained (its own fetch) rather than reaching into another feature's
 * client helpers. No animation (Sprint 5).
 */
export function VerseSet({ current }: VerseSetProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reference, setReference] = useState(current?.reference ?? '');
  const [text, setText] = useState(current?.text ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/verse/current', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.trim(), text: text.trim() }),
      });

      if (res.ok) {
        router.refresh();
        setOpen(false);
        setSubmitting(false);
        return;
      }

      const data: unknown = await res.json().catch(() => null);
      const message =
        data && typeof data === 'object' && typeof (data as { error?: unknown }).error === 'string'
          ? (data as { error: string }).error
          : 'Could not save the verse. Please try again.';
      setError(message === 'ValidationError' ? 'Reference and passage are required.' : message);
    } catch {
      setError('Network error. Please try again.');
    }
    setSubmitting(false);
  }

  if (!open) {
    return (
      <button type="button" className="foot-link is-button" onClick={() => setOpen(true)}>
        {current ? 'CHANGE VERSE →' : 'SET VERSE →'}
      </button>
    );
  }

  return (
    <form className="verse-set" onSubmit={handleSubmit} noValidate>
      <div className="field">
        <label className="field-label" htmlFor="verse-reference">
          Reference
        </label>
        <input
          id="verse-reference"
          className="field-input"
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          placeholder="Proverbs 3:5–6"
          maxLength={120}
          autoFocus
        />
      </div>

      <div className="field">
        <label className="field-label" htmlFor="verse-text">
          Passage
        </label>
        <textarea
          id="verse-text"
          className="field-input"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Trust in the Lord with all thine heart…"
          maxLength={1000}
        />
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      <div className="form-actions">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setOpen(false)}
          disabled={submitting}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Set verse'}
        </button>
      </div>
    </form>
  );
}
