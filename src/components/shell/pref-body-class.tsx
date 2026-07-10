'use client';

import { useEffect } from 'react';

import { useUiPrefs } from '@/stores/ui-prefs';

/**
 * PrefBodyClass — reflects the ui-prefs toggles onto <body>.
 *
 * Client Component, renders nothing. Adds `no-motion` when motion is disabled
 * and `no-particles` when particles are disabled — the exact class hooks the
 * prototype's CSS keys off. In Sprint 2 these are inert (the ambient layer is
 * static, the particle field empty); Sprint 5's animations gate on them with
 * zero rework. Toggling from the command palette is real and inspectable now.
 */
export function PrefBodyClass() {
  const motionEnabled = useUiPrefs((state) => state.motionEnabled);
  const particlesEnabled = useUiPrefs((state) => state.particlesEnabled);

  useEffect(() => {
    document.body.classList.toggle('no-motion', !motionEnabled);
  }, [motionEnabled]);

  useEffect(() => {
    document.body.classList.toggle('no-particles', !particlesEnabled);
  }, [particlesEnabled]);

  return null;
}
