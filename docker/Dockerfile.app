# syntax=docker/dockerfile:1

# =============================================================================
# Multi-stage build for the C.O.O.P. Next.js app (production).
#
# Uses Next.js "standalone" output: the runner image carries only the minimal
# server + traced node_modules that Next emits, not the full dependency tree.
# This keeps the prod image lean — important on the 16GB Mac mini host.
# =============================================================================

# -----------------------------------------------------------------------------
# Stage 1 — deps: install full dependencies with pnpm (cached layer)
# -----------------------------------------------------------------------------
FROM node:22-alpine AS deps
# libc6-compat helps some native deps run on Alpine's musl libc.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Enable pnpm via the bundled corepack, pinned to the toolchain version.
# The repo's lockfile (v9.0) and pnpm-workspace.yaml (allowBuilds) are pnpm 11
# artifacts; pnpm 11 requires Node >= 22.13, hence the node:22-alpine base.
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# Only the manifest + lockfile so this layer caches unless deps change.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# -----------------------------------------------------------------------------
# Stage 2 — builder: copy source and build the standalone server
# -----------------------------------------------------------------------------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.9.0 --activate

# Reuse the installed dependencies from the deps stage.
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Disable Next.js telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

RUN pnpm build

# -----------------------------------------------------------------------------
# Stage 3 — runner: minimal image that serves the standalone build
# -----------------------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run as a non-root user.
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Public assets (served statically).
COPY --from=builder /app/public ./public

# The standalone server bundle (includes a minimal node_modules + server.js).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
# Static assets emitted by the build (JS/CSS chunks).
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

# server.js is emitted at the root of the standalone output.
CMD ["node", "server.js"]
