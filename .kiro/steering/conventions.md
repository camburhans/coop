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
