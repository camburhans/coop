'use client';

import { create } from 'zustand';

/**
 * UI preference toggles (Sprint 2, zustand).
 *
 * Genuine client-only UI state per tech.md: the two motion prefs the prototype
 * exposes. Both default ON. A small client component reflects them onto
 * <body> as the classes `no-motion` / `no-particles` — the exact hooks the
 * prototype's CSS uses, so Sprint 5's motion layer drops in with no rework.
 *
 * Nothing consumes these visually yet in Sprint 2 (the ambient layer is static
 * and the particle field is empty); the wiring exists so toggling is real and
 * inspectable now.
 */
interface UiPrefsState {
  motionEnabled: boolean;
  particlesEnabled: boolean;
  toggleMotion: () => void;
  toggleParticles: () => void;
}

export const useUiPrefs = create<UiPrefsState>((set) => ({
  motionEnabled: true,
  particlesEnabled: true,
  toggleMotion: () => set((state) => ({ motionEnabled: !state.motionEnabled })),
  toggleParticles: () => set((state) => ({ particlesEnabled: !state.particlesEnabled })),
}));
