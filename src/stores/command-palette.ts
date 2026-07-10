'use client';

import { create } from 'zustand';

/**
 * Command-palette open state (Sprint 2, zustand).
 *
 * Genuine client-only UI state per tech.md: whether the ⌘K palette is open and
 * the current search query. NOTHING server-owned lives here — the palette
 * fetches projects on demand and mutates through the Route Handlers. The store
 * exists so the global ⌘K hotkey, the command-bar trigger field, and the
 * palette overlay can all share one source of truth without prop-drilling
 * through the server layout.
 *
 * `close` also clears the query so the palette always reopens empty; `toggle`
 * mirrors that (closing resets, opening leaves the query untouched).
 */
interface CommandPaletteState {
  isOpen: boolean;
  query: string;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setQuery: (query: string) => void;
}

export const useCommandPalette = create<CommandPaletteState>((set) => ({
  isOpen: false,
  query: '',
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false, query: '' }),
  toggle: () => set((state) => (state.isOpen ? { isOpen: false, query: '' } : { isOpen: true })),
  setQuery: (query) => set({ query }),
}));
