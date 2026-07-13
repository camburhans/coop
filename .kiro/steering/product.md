---
inclusion: always
---

# C.O.O.P. — Product Context

C.O.O.P. (Cognitive Operations & Optimization Platform) is a private,
single-user life operating system. One owner, one Mac mini, remote phone
access via Tailscale.

**North Star:** Show me what I need to do, show me how the different areas
of my life are looking, and keep me organized.

## Core principles (do not violate)

1. Foundation first — data layer, services, AI layer, THEN cinematic UI.
2. Functional without animation — UI must work with all motion disabled.
3. Calm on the hundredth view — daily-use tool, not a showpiece.
4. Local-first, private by default.
5. One unified data model — every domain connects via a generic Link table.
6. Tight V1 scope — no Plaid, no Google Calendar, no native mobile, no
   heavy 3D, no agentic automation in V1.
7. Swap-ability over lock-in — external dependencies (especially AI)
   sit behind clean interfaces.

## V1 sprint plan

- Sprint 1: Foundation — repo, Docker, Postgres+pgvector, full Prisma
  schema, auth, Tailscale, backups. (COMPLETE — tag sprint-1-complete)
- Sprint 2: Productivity + dashboard shell. "Midnight & Gilt"
  design system as code, command-console shell, Projects + Tasks
  end-to-end, four live/placeholder panels, ⌘K command bar. Static
  gilded glass only — NO motion (that is Sprint 5).
  (COMPLETE — tag sprint-2-complete; promoted to prod)
- Sprint 3 (current): Finance (manual + CSV) — replaces the Finance placeholder.
- Sprint 4: AI layer (embeddings, RAG) — powers "Ask C.O.O.P." + ai-notes.
- Sprint 5: Visual polish — ports the prototype's MOTION layer (ambient
  gold drift, particle field, breathing pulses, entrance animations,
  typewriter response). The motion layer lives here and nowhere earlier.

## The three pillars (the system's spine)

Finance = stewardship. Priorities = mission. Scripture = foundation.
Calendar and system status are secondary. Every design and product
decision serves surfacing these three at a glance.
