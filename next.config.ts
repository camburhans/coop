import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Emit a self-contained server build (.next/standalone) so the production
  // Docker image can run `node server.js` with a minimal traced node_modules.
  output: 'standalone',

  // Allow the dev server to be reached from the Mac mini's Tailscale hostname
  // (e.g. previewing /_design on the phone via `tailscale serve … 3001`).
  // Next blocks cross-origin dev asset/HMR requests by default; this allowlists
  // the tailnet origin. Dev-only — inert in the production build.
  allowedDevOrigins: ['camerons-mac-mini.tail93b21c.ts.net'],
};

export default nextConfig;
