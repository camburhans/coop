'use client';

import { Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface DeleteButtonProps {
  /** Name of the thing being deleted, for the accessible label. */
  label: string;
  /** Fired only on the SECOND click (the confirmed delete). */
  onConfirm: () => void;
  disabled?: boolean;
}

/** Auto-disarm window for the two-click confirm, in ms (matches the prototype). */
const ARM_MS = 2600;

/**
 * DeleteButton — a two-click, inline delete confirm (the prototype's `armDelete`).
 *
 * First click arms the button (turns alert-red via `.confirming`); a second
 * click within {@link ARM_MS} confirms. If the window lapses it disarms
 * quietly. This replaces the blocking `window.confirm()` with a calmer,
 * reversible affordance and keeps deletes keyboard-reachable. `stopPropagation`
 * keeps a click off the surrounding card (which would otherwise toggle the
 * task filter).
 */
export function DeleteButton({ label, onConfirm, disabled }: DeleteButtonProps) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation();
    if (armed) {
      if (timer.current) clearTimeout(timer.current);
      setArmed(false);
      onConfirm();
      return;
    }
    setArmed(true);
    timer.current = setTimeout(() => setArmed(false), ARM_MS);
  }

  return (
    <button
      type="button"
      data-del
      className={armed ? 'icon-btn confirming' : 'icon-btn'}
      onClick={handleClick}
      disabled={disabled}
      title={armed ? 'Click again to delete' : 'Delete'}
      aria-label={armed ? `Confirm delete ${label}` : `Delete ${label}`}
    >
      <Trash2 aria-hidden strokeWidth={1.6} />
    </button>
  );
}
