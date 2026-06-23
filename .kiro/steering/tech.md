---
inclusion: always
---

# Technology Stack

## Locked choices (do not propose alternatives)
- Framework: Next.js 15 (App Router) + TypeScript (strict mode)
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
- Node 20+
- pnpm preferred (npm acceptable)
- Postgres 16 with pgvector extension
