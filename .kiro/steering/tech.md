---
inclusion: always
---

# Technology Stack

## Locked choices (do not propose alternatives)

- Framework: Next.js 16 (App Router) + TypeScript (strict mode)
- Styling: Tailwind CSS
- Motion: Framer Motion (Sprint 5+, not Sprint 1)
- Backend: Next.js API routes / Route Handlers — single backend, no FastAPI
- Database: PostgreSQL 16 with the pgvector extension
- ORM: Prisma
- State: Zustand (client-only, Sprint 2+)
- AI: External API (Gemini Flash default) behind a provider-agnostic
  interface in `lib/ai/` — wired in Sprint 4, not Sprint 1
- Containerization: Docker Compose
- Remote access: Tailscale
- Auth (V1): single passcode → httpOnly cookie session

## Explicitly out of V1

- FastAPI / separate backend
- Three.js / R3F / WebGL
- Local LLMs (Ollama)
- Plaid / bank integrations
- Native iOS

## Environments (single host: the Mac mini is dev AND prod)

- Production: dockerized app on port 3000, Postgres on the internal
  docker network (no host port), volume coop_db_data, env file docker/.env.
  Always running (restart: unless-stopped).
- Development: native `pnpm dev` on port 3001, separate dockerized Postgres
  on host port 5433, volume coop_dev_db_data, env file .env. Run only while
  actively coding.
- Dev NEVER touches the production database. This is the hard rule.
- Promotion: develop against dev DB → commit → push → deploy script
  rebuilds prod container and runs `prisma migrate deploy` against prod DB.

## Versions

- Node 22+ (required — pnpm 11 needs Node >= 22.13; the Docker images use
  node:22-alpine)
- pnpm preferred (npm acceptable)
- Postgres 16 with pgvector extension

## Sprint 2 activations / clarifications

- State: Zustand is NOW in use (Sprint 2+). Use it ONLY for genuine
  client state: command-bar/palette open state, and UI prefs
  `motionEnabled` + `particlesEnabled` (both default true). Reflect those
  prefs onto the document body as the classes `no-motion` / `no-particles`
  — these are the exact hooks the prototype's CSS uses, so Sprint 5's
  motion drops in without rework. Do NOT put server data in Zustand.
- Motion: Framer Motion stays DEFERRED to Sprint 5. Sprint 2 ships static
  gilded glass with zero animation. Do not install framer-motion yet.
- Data access pattern (locked for Sprint 2):
  * Reads: Server Components import service functions from
    src/lib/productivity/ (and src/lib/verse/) directly.
  * Mutations: client components POST/PATCH/DELETE to Route Handlers
    under src/app/api/, which call the same service layer; then
    router.refresh() to revalidate. No Server Actions in V1 — Route
    Handlers only. Keep one pattern.
- Validation: zod schemas for all mutation input, in src/lib/validation/.
- Glow intensity: expose a `--glow-mult` CSS var (default 1) that scales
  all accent glows, matching the prototype. A future settings surface can
  tune it; Sprint 2 just defines it.
