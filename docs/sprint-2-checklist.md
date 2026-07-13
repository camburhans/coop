# Sprint 2 — Verification Checklist

The single runnable checklist for Sprint 2 (Productivity + dashboard shell,
"Midnight & Gilt"). Consolidates every verification step from Sessions #1–#7
into one place, grouped by surface. Run this against **dev** (port 3001, seeded
dev DB) before promoting, then re-confirm the marked items against **prod**
(port 3000) after `scripts/deploy.sh`.

## Legend

- **[dev]** — verified against the dev environment only (port 3001, dev DB on
  5433). UI look/behaviour, seed, and the dev-guarded scripts live here.
- **[dev+prod]** — must pass on dev **and** be re-confirmed on prod after
  promotion (build integrity, migrations, health, phone-over-Tailscale, the
  fact that prod holds only real hand-entered data).

Environment reminders: dev app `pnpm dev` on `http://localhost:3001`, dev DB on
`localhost:5433/coop_dev` (`.env`). Prod app in Docker on
`http://localhost:3000` reached from the phone via Tailscale Serve; prod DB
internal-only. Get a dev session with the passcode from `.env`:

```bash
# obtain a session cookie for hitting protected API routes on dev
curl -s -c /tmp/coop-dev.cookies -H 'Content-Type: application/json' \
  -d '{"passcode":"<APP_PASSCODE from .env>"}' \
  http://localhost:3001/api/auth/unlock
```

---

## 1. Design system & shell  *(Sessions #1–#2)*

| # | Item | Command / URL / interaction | Scope |
|---|------|------------------------------|-------|
| 1.1 | Three fonts render — Sora (UI/display), Spline Sans Mono (metadata/labels), Newsreader italic (scripture only) | Visit `http://localhost:3001/` — check a heading (Sora), a mono status label, the verse line (serif) | [dev] |
| 1.2 | Every Midnight & Gilt token exists as a CSS var **and** a Tailwind utility, values matching `design.md` exactly | Inspect `src/styles/globals.css` `:root`; grep tokens; visually confirm swatches | [dev] |
| 1.3 | `<Panel>` primitive shows warm glass + gold gradient border + shadow + mono panel-head | Any dashboard panel at `/` | [dev] |
| 1.4 | Indigo used only for C.O.O.P.'s voice (presence dot, "now" marker, ai-note glyph, response toast); gold everywhere else | Visual scan of `/` and `/productivity` | [dev] |
| 1.5 | Ambient layer renders but is completely still; `#particles` empty; nothing animates (live clock is the only ticking element) | Inspect DOM at `/`; watch for motion | [dev] |
| 1.6 | No `framer-motion` dependency; no keyframes/transitions added | `grep -i framer package.json` (expect none) | [dev+prod] |
| 1.7 | No hardcoded hex colors outside `globals.css` | `grep -rniE '#[0-9a-f]{3,6}' src/components src/app --include=*.tsx` (expect none of the token hexes) | [dev] |
| 1.8 | Command-console shell renders: gold sigil rail + command bar + four gilded panels; Priorities leads top-left, Finance hero on floor row | `http://localhost:3001/` | [dev] |
| 1.9 | Live clock ticks (HH:MM); greeting is time-of-day aware and in C.O.O.P.'s voice | Watch the command bar for ~60s | [dev] |
| 1.10 | Quick-prompt chips render; ⌘K field focuses with a static gold glow (inert until palette) | Click the ⌘K field | [dev] |
| 1.11 | Active nav item shows gold treatment as you move between routes; `/finance`, `/knowledge`, `/ai` show the standby screen | Navigate rail items | [dev] |
| 1.12 | Responsive: ≤1180px → two-up; ≤760px → rail replaced by glass bottom nav, single column | Resize browser | [dev] |

---

## 2. Productivity — data + UI  *(Sessions #3–#4)*

| # | Item | Command / URL / interaction | Scope |
|---|------|------------------------------|-------|
| 2.1 | Service-layer smoke passes and prints the expected rank order | `pnpm prod:smoke` (dev) | [dev] |
| 2.2 | `rankTasks()` is the single shared ranking used by services and panels | Code check: `src/lib/productivity/tasks.ts` exports `rankTasks`; imported by priorities panel + productivity page | [dev] |
| 2.3 | Deleting a project **nulls** child tasks' `projectId` (does NOT cascade-delete tasks) | Covered by smoke script assertion + UI test 2.11 | [dev] |
| 2.4 | Invalid POST body returns 400 with a readable zod error | `curl -s -b /tmp/coop-dev.cookies -H 'Content-Type: application/json' -d '{}' http://localhost:3001/api/projects` | [dev] |
| 2.5 | `/api/projects` and `/api/tasks` require a session | `curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/projects` without cookie (expect 401/redirect) | [dev+prod] |
| 2.6 | Smoke/seed scripts refuse a non-dev `DATABASE_URL` (5433 / coop_dev guard) | Inspect guard in `scripts/productivity-smoke.ts` + `scripts/seed-dev.ts` | [dev] |
| 2.7 | Create / edit / complete-reopen / delete projects and tasks entirely from the UI | `http://localhost:3001/productivity` | [dev] |
| 2.8 | Task order in the UI matches `rankTasks()` (e.g. critical dateless beats low due-tomorrow) | Inspect `/productivity` task list order | [dev] |
| 2.9 | Client-side filtering works from a project card and the filter chips; counts live | Click a project card / chips | [dev] |
| 2.10 | Project cards show completion progress bar; Tasks panel shows C.O.O.P.'s foot-note read | `/productivity` | [dev] |
| 2.11 | Overdue dates show alert treatment; completed tasks render muted; delete uses two-click inline confirm; empty states show for no projects / no tasks-in-view | `/productivity` interactions | [dev] |
| 2.12 | Deleting a project leaves its tasks intact with `projectId = null` | Delete a project with tasks; confirm tasks survive under "NO PROJECT" | [dev] |
| 2.13 | A CRITICAL / IN_PROGRESS / PAUSED value set via the API still renders (Option B projection is total) | PATCH a task/project via API to an off-form enum, confirm it renders | [dev] |
| 2.14 | No Server Actions; mutations go through Route Handlers only | Code check | [dev] |

---

## 3. Dashboard panels — live + placeholder  *(Session #5)*

| # | Item | Command / URL / interaction | Scope |
|---|------|------------------------------|-------|
| 3.1 | Priorities · Mission (lead panel) shows real ranked tasks and refreshes after a completion; order matches `/productivity` | `http://localhost:3001/` after seeding | [dev] |
| 3.2 | Scripture · Foundation renders in Newsreader serif italic with a gold dropcap; setting a verse persists; only one `is_current` ever | Use the "Set verse" affordance; `curl -s -b /tmp/coop-dev.cookies http://localhost:3001/api/verse/current` | [dev] |
| 3.3 | Today's Calendar renders today's events as a timeline with an indigo "now" node (post-seed) and a clean "No events today" empty state otherwise | `/` after seed | [dev] |
| 3.4 | Finance · Stewardship is the hero-weight placeholder, looks first-class, tagged "AWAITING SPRINT 3", wires NO real numbers | `/` | [dev] |
| 3.5 | `ai-note` annotations show static indigo copy and make **no** AI/provider call | `/` + Network tab (no calls to any AI host) | [dev] |
| 3.6 | No standalone Intelligence Briefing panel exists (that role is the command-bar toast) | Visual check of `/` | [dev] |

---

## 4. Command bar / palette  *(Session #6)*

| # | Item | Command / URL / interaction | Scope |
|---|------|------------------------------|-------|
| 4.1 | ⌘K / Ctrl+K toggles the palette anywhere in `(app)`; Escape closes; full keyboard nav (arrows + Enter) works | Press ⌘K on `/` and `/productivity` | [dev] |
| 4.2 | Navigation routes correctly (e.g. "prod" → Productivity); "Lock app" locks (POST `/api/auth/lock`) | Palette interactions | [dev] |
| 4.3 | Quick-add task/project creates real rows; the dashboard reflects them after refresh | "New task…" in palette → check Priorities | [dev] |
| 4.4 | Quick-prompt chips and the "Ask C.O.O.P." path show the stub in the **indigo response toast** and make **no** AI/provider call | Click a chip; type a non-command query; watch Network tab | [dev] |
| 4.5 | "Toggle motion" / "Toggle particles" flip the `no-motion` / `no-particles` body classes; defaults are on | Toggle in palette; inspect `<body>` classList | [dev] |
| 4.6 | No typewriter, no open/close transitions | Visual check | [dev] |

---

## 5. Seed · empty/error · mobile  *(Session #7)*

| # | Item | Command / URL / interaction | Scope |
|---|------|------------------------------|-------|
| 5.1 | `pnpm db:seed:reset` populates the dev DB; the dashboard comes alive (ranked priorities, today's calendar timeline with a "now" node, a serif verse) | `pnpm db:seed:reset` then reload `/` | [dev] |
| 5.2 | The seed script **refuses** a non-dev `DATABASE_URL` | Run with a non-5433 URL (or inspect guard); expect non-zero exit | [dev] |
| 5.3 | Every panel + `/productivity` has honest empty states; nothing blank or crashing on no data | Reset dev DB empty; load `/` and `/productivity` | [dev] |
| 5.4 | `loading.tsx` / `error.tsx` render calm static states for `(app)` + `/productivity` | Code check + observe on slow load | [dev] |
| 5.5 | Mobile layout holds at ≤760px: bottom nav, single column, usable palette/forms, toast docks to bottom | Resize / real device on LAN | [dev] |
| 5.6 | `/_design` preview from Session #1 removed or gated | Confirm `/_design` is gone/gated | [dev] |

---

## 6. Build & lint  *(all sessions / gate for promotion)*

| # | Item | Command / URL / interaction | Scope |
|---|------|------------------------------|-------|
| 6.1 | `pnpm lint` clean (zero warnings) | `pnpm lint` | [dev+prod] |
| 6.2 | `pnpm build` passes | `pnpm build` | [dev+prod] |
| 6.3 | `prisma migrate status` up-to-date; Sprint 2 added **no** new migrations (still 2: `_init`, `_embedding_ann_index`) | `pnpm exec prisma migrate status` (dev) + migrate-service (prod) | [dev+prod] |
| 6.4 | No schema drift; `prisma/migrations/` unchanged since Sprint 1 | `git log --oneline -- prisma/migrations` | [dev+prod] |

---

## 7. Promotion gate  *(Session #8 — prod only)*

| # | Item | Command / URL / interaction | Scope |
|---|------|------------------------------|-------|
| 7.1 | Sprint 1 nightly backup launchd job still installed | `launchctl list \| grep com.coop.backup` | [prod] |
| 7.2 | Last prod backup file is recent | `ls -lt "$BACKUP_DIR"/coop-*.sql.gz \| head` | [prod] |
| 7.3 | `docker/.env` (prod) `DATABASE_URL` points at the prod db (`db:5432/coop`), NOT the dev DB | inspect `docker/.env` (redacted) | [prod] |
| 7.4 | Fresh pre-promotion prod snapshot taken | `docker compose -f docker/docker-compose.yml --profile backup run --rm backup` | [prod] |
| 7.5 | `scripts/deploy.sh` promotes cleanly; `prisma migrate deploy` reports **nothing to apply** (NO-OP this sprint) | `./scripts/deploy.sh` | [prod] |
| 7.6 | Prod healthy after deploy | `docker compose -f docker/docker-compose.yml ps`; `curl -s http://localhost:3000/api/health` → `db:true` | [prod] |
| 7.7 | Dashboard, `/productivity`, and ⌘K all work on the phone over Tailscale against prod | phone → `https://<mac-mini>.<tailnet>.ts.net` | [prod] |
| 7.8 | At least one **real** project + task created on prod from the phone; Priorities lead panel reflects it | phone interaction | [prod] |
| 7.9 | Production contains only real hand-entered data — the dev seed never touched it | confirm no seed markers in prod | [prod] |
