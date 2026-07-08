'use client';

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

import { Panel } from '@/components/ui/panel';

interface ModalProps {
  /** Mono panel-head label (e.g. "NEW PROJECT"). */
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Modal — a centered overlay wrapping a gilded {@link Panel}.
 *
 * Client Component. Rendered through a portal to `document.body` so its
 * `position: fixed` backdrop resolves against the VIEWPORT, not the panel it
 * was triggered from. (The panels carry `backdrop-filter`, which would
 * otherwise become the containing block for a fixed child and trap/clip the
 * modal inside that column — the bug this fixes.) Conditional render only, no
 * animation. Closes on backdrop click, Escape, or the ✕ button.
 *
 * The modal is only ever rendered in response to a client-side click (its
 * parent's `open` state starts false), so it never runs during SSR and
 * `document.body` is always present when the portal mounts.
 */
export function Modal({ title, onClose, children }: ModalProps) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-card" role="dialog" aria-modal="true" aria-label={title}>
        <Panel>
          <header className="panel-head">
            <span className="panel-label">{title}</span>
            <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
              ✕
            </button>
          </header>
          {children}
        </Panel>
      </div>
    </div>,
    document.body,
  );
}
