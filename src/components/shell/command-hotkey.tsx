'use client';

import { useEffect } from 'react';

import { useCommandPalette } from '@/stores/command-palette';

/**
 * CommandHotkey — the global keyboard bridge for the command palette.
 *
 * Client Component, renders nothing. Mounted once in the (app) shell so ⌘K /
 * Ctrl+K toggles the palette from anywhere in an authenticated view, and
 * Escape closes it. The palette overlay owns its own in-input arrow/Enter
 * handling; this only covers the app-wide open/close shortcut.
 */
export function CommandHotkey() {
  const toggle = useCommandPalette((state) => state.toggle);
  const close = useCommandPalette((state) => state.close);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      } else if (event.key === 'Escape') {
        close();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggle, close]);

  return null;
}
