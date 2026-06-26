import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Emit a self-contained server build (.next/standalone) so the production
  // Docker image can run `node server.js` with a minimal traced node_modules.
  output: 'standalone',
};

export default nextConfig;
