'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface ProdModalProps {
  /** Mono head title, e.g. "New Task" / "Edit Project". */
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * ProdModal — the productivity create/edit overlay (`.prod-modal`).
 *
 * Client Component, rendered through a portal to `document.body` so its fixed
 * scrim resolves against the viewport rather than a blurred panel (panels carry
 * `backdrop-filter`, which would otherwise become the containing block and clip
 * the modal). Closes on scrim click, Escape, or the ✕. STATIC — it mounts in
 * its final state; the prototype's fade-in is deferred with all other motion to
 * Sprint 5.
 *
 * The body + footer (Cancel/Save) are supplied by the form passed as children,
 * so the form owns submission and validation.
 */
export function ProdModal({ title, onClose, children }: ProdModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div className="prod-modal show" role="presentation">
      <div className="prod-modal-scrim" onClick={onClose} />
      <div className="prod-modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <div className="pm-head">
          <span>{title}</span>
          <button type="button" className="pm-x" aria-label="Close" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
