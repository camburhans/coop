---
inclusion: always
---

# Code Conventions

## TypeScript

- strict: true in tsconfig (noImplicitAny, strictNullChecks, etc.)
- No `any`. No `as unknown as X` escape hatches.
- Prefer types from Prisma client over hand-rolled duplicates.

## Naming

- Files: kebab-case (auth-session.ts, not authSession.ts)
- React components: PascalCase exports from kebab-case files
- DB tables (Prisma model): PascalCase singular (Project, not projects)
- DB columns: snake_case via @map where needed for SQL ergonomics

## Imports

- Absolute imports via `@/*` alias (configured in tsconfig)
- Group: external, then @/lib, then @/components, then relative
- No deep imports across feature boundaries

## Server vs client

- Server Components by default
- "use client" only where needed (interactivity, hooks, browser APIs)
- Server-only modules: `import 'server-only'` at top

## Commits

- Conventional commits: feat:, fix:, chore:, docs:, refactor:
- One logical change per commit
- Reference sprint in message: "feat(sprint-1): ..."

## Components & UI (Sprint 2+)

- Server Components by default; "use client" only for interactivity.
- Styling via Tailwind utilities mapped to the design.md tokens. NEVER
  hardcode hex colors in components — use the token classes/vars. A color
  you "need" that isn't a token is a design.md decision, not an inline.
- Gilded glass uses the shared <Panel> primitive — never re-implement the
  blur / gold gradient border / shadow per component.
- Mono (Spline Sans Mono) for ALL metadata, labels, timestamps, tags,
  status readouts. Sora for UI + display figures. Newsreader (serif,
  italic) ONLY for scripture/verse text.
- Indigo is reserved for C.O.O.P.'s "voice": the presence dot, the
  calendar "now" marker, ai-note annotations, the response toast. Gold is
  the signature accent for everything else. Don't mix these roles.
- Empty, loading, and error states are required for any data-backed view.
- Everything keyboard-reachable; ⌘K and all forms work without a mouse.
