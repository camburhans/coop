# Sprint 1 — Verification Checklist

Every verification step from Sessions #1–#7, consolidated into one runnable
checklist. Run from the **repo root** on the Mac mini (the single host that is
both dev and prod). Items marked **[manual]** require a human (a phone, a
reboot, a destructive drill, or a hardware/account check) and cannot be driven
by tooling alone.

Conventions used below:

- `PROD` = the always-on Docker stack: app on `127.0.0.1:3000`, internal-only
  Postgres. Compose file `docker/docker-compose.yml` (project `coop-prod`).
- `DEV` = the disposable Postgres on `127.0.0.1:5433`. Compose file
  `docker/docker-compose.dev.yml` (project `coop-dev`). The dev *app* runs
  natively via `pnpm dev` on `3001` only while coding.
- `TS_URL` = `https://camerons-mac-mini.tail93b21c.ts.net` (Tailscale Serve →
  `127.0.0.1:3000`). Substitute your own `<mac-mini>.<tailnet>.ts.net`.

---

## 1. Repo & build

- [ ] **Working tree clean / on `main`**
  `git status --short && git branch --show-current`
- [ ] **Dependencies install cleanly**
  `pnpm install`
- [ ] **Lint passes with zero warnings**
  `pnpm lint`
- [ ] **Production build succeeds**
  `pnpm build`
- [ ] **`src/lib/env.ts` throws a readable error on a missing/invalid var**
  Import the validated env loader with required vars unset and confirm it
  throws (it lists the offending vars):
  `pnpm exec tsx --conditions react-server -e "import('./src/lib/env.ts').then(()=>console.log('FAIL: did not throw')).catch(e=>console.log('PASS: threw\n'+e.message))"`
- [ ] **Both env files are gitignored** (neither appears in status, both are ignored)
  `git check-ignore .env docker/.env`
- [ ] **No secrets committed** (templates only; real env files absent from the index)
  `git ls-files | grep -E '(^|/)\.env$' || echo "OK: no .env tracked"`

## 2. Containers

- [ ] **DEV Postgres up on host port 5433**
  `docker compose -f docker/docker-compose.dev.yml ps`
- [ ] **DEV Postgres answers `SELECT 1` on 5433**
  `docker compose -f docker/docker-compose.dev.yml exec -T dev-db psql -U coop -d coop_dev -c "SELECT 1;"`
- [ ] **PROD stack up: app (3000) + internal-only db**
  `docker compose -f docker/docker-compose.yml ps`
- [ ] **PROD app is loopback-bound** (`127.0.0.1:3000->3000/tcp`, not `0.0.0.0`)
  `docker compose -f docker/docker-compose.yml ps --format '{{.Service}} {{.Ports}}'`
- [ ] **PROD db has NO host port binding** (internal network only — the safety boundary)
  `docker compose -f docker/docker-compose.yml port db 5432 || echo "OK: db has no host port"`
- [ ] **Both DB healthchecks report healthy**
  `docker inspect --format '{{.Name}} {{.State.Health.Status}}' coop-prod-db-1 coop-dev-dev-db-1`
- [ ] **PROD app serves locally**
  `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/api/health`
- [ ] **`dev:db:reset` cleanly nukes + recreates DEV** (safe — dev is disposable; re-apply migrations after)
  `pnpm dev:db:reset` then `pnpm exec prisma migrate deploy`

## 3. Database & schema

> Schema commands target DEV via `.env` (`DATABASE_URL` → `localhost:5433`).
> PROD is reached through the compose network (`exec db` / the `migrate` service).

- [ ] **DEV migrations up to date, no drift**
  `pnpm exec prisma migrate status`
- [ ] **PROD migrations up to date** (run inside the network)
  `docker compose -f docker/docker-compose.yml --profile migrate run --rm migrate npx prisma migrate status`
- [ ] **All tables present (DEV)** — Project, Task, Account, Transaction, Note, CalendarEvent, Reminder, Verse, Link, Embedding
  `docker compose -f docker/docker-compose.dev.yml exec -T dev-db psql -U coop -d coop_dev -c "\dt"`
- [ ] **`Link` has indexes on `(from_type, from_id)` and `(to_type, to_id)`**
  `docker compose -f docker/docker-compose.dev.yml exec -T dev-db psql -U coop -d coop_dev -c "\di Link*"`
- [ ] **`Embedding` has the pgvector column + `ivfflat` ANN index**
  `docker compose -f docker/docker-compose.dev.yml exec -T dev-db psql -U coop -d coop_dev -c "\d \"Embedding\""`
- [ ] **`pnpm db:smoke` inserts/reads/deletes against DEV** (proves the model + Link table)
  `pnpm db:smoke`
- [ ] **`pnpm db:snapshot` writes a gzipped dump to `./snapshots`**
  `pnpm db:snapshot && ls -lh snapshots/`
- [ ] **Polymorphic Link sanity query** — "all entities linked to a project, any type" works as expected (hand-check the pattern in psql)

## 4. Auth & sessions

> Verified against the live PROD app on `127.0.0.1:3000`. (The plan in
> `docs/auth-test.md` targets the dev server on 3001; for sign-off we exercise
> the running production gate.) Run the **success path first**, then the
> failure/rate-limit path last — the in-memory limiter blocks the IP for 10 min
> once tripped.

- [ ] **Unauthenticated `/` redirects to `/unlock` (307)**
  `curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" http://localhost:3000/`
- [ ] **`/api/health` bypasses auth → 200 with `db:true`**
  `curl -s http://localhost:3000/api/health`
- [ ] **Correct passcode → 200 `{ok:true}` + `coop_session` cookie set**
  (reads the live passcode straight from the running container, never printing it)
  ```bash
  PASS=$(docker compose -f docker/docker-compose.yml exec -T app printenv APP_PASSCODE)
  curl -s -c /tmp/coop_jar.txt -w "\n%{http_code}\n" -H 'Content-Type: application/json' \
    -d "$(jq -nc --arg p "$PASS" '{passcode:$p}')" http://localhost:3000/api/auth/unlock
  grep coop_session /tmp/coop_jar.txt
  ```
- [ ] **Cookie flags: `HttpOnly`, `SameSite=Lax`, `Max-Age=2592000`**
  (Note: `Secure` is intentionally **off** — app is served over HTTP/Tailscale; see `src/lib/auth/session.ts`.)
  Inspect `Set-Cookie` on the unlock response above, or check `/tmp/coop_jar.txt`.
- [ ] **Valid session reaches the app → 200, renders "C.O.O.P. is online."**
  `curl -s -b /tmp/coop_jar.txt http://localhost:3000/ | grep "C.O.O.P. is online."`
- [ ] **Lock clears the session, then `/` redirects to `/unlock` again**
  ```bash
  curl -s -b /tmp/coop_jar.txt -X POST http://localhost:3000/api/auth/lock; echo
  curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -b /tmp/coop_jar.txt http://localhost:3000/
  ```
- [ ] **Wrong passcode → 401 `{ok:false}`, no cookie**
  `curl -s -w "\n%{http_code}\n" -H 'Content-Type: application/json' -d '{"passcode":"wrong"}' http://localhost:3000/api/auth/unlock`
- [ ] **Rate limit: 6 wrong attempts → `401`×5 then `429`** (run LAST — locks the IP for 10 min)
  ```bash
  for i in $(seq 1 6); do
    curl -s -o /dev/null -w "attempt $i: %{http_code}\n" -H 'Content-Type: application/json' \
      -d '{"passcode":"wrong"}' http://localhost:3000/api/auth/unlock
  done
  ```

## 5. Remote access (Tailscale)

- [ ] **Mac mini + phone are on the same tailnet**
  `tailscale status`
- [ ] **Tailscale Serve maps the tailnet name → `127.0.0.1:3000`**
  `tailscale serve status`
- [ ] **PROD reachable over Tailscale (HTTPS, no port) → health `db:true`**
  `curl -s "$TS_URL/api/health"` (where `TS_URL=https://camerons-mac-mini.tail93b21c.ts.net`)
- [ ] **[manual] Open the app from the phone over Tailscale** and unlock with the passcode (target < 10 s).
- [ ] **[manual] PROD NOT reachable outside the tailnet** — disable Tailscale on the phone and confirm `TS_URL` fails to load.
- [ ] **DEV server (3001) / DEV db (5433) are NOT exposed remotely** — only `127.0.0.1` bindings.
  `tailscale serve status` (should map only port 3000)
- [ ] **[manual] Mac mini reboot brings PROD back on its own** (Docker Desktop "Start at login" + `restart: unless-stopped`).

## 6. Backups & restore

- [ ] **Manual backup writes a fresh `coop-<ts>.sql.gz` to `$BACKUP_DIR`**
  `docker compose -f docker/docker-compose.yml --profile backup run --rm backup`
- [ ] **The dump is non-empty, gzipped, and contains SQL**
  ```bash
  BACKUP_DIR=$(grep '^BACKUP_DIR=' docker/.env | cut -d= -f2-)
  LATEST=$(ls -t "$BACKUP_DIR"/coop-*.sql.gz | head -1)
  file "$LATEST" && gunzip -c "$LATEST" | head -20
  ```
- [ ] **Nightly launchd backup job is installed (02:30 local)**
  `launchctl list | grep com.coop.backup`
- [ ] **[manual] Restore drill performed once** against the (empty) PROD db per
  `docs/restore.md`, ending with `/api/health` → `db:true`. **DESTRUCTIVE — operator runs this by hand; tooling must not.** Record the sign-off in `docs/restore.md`.
- [ ] **[manual] Time Machine active** on the Mac mini with an attached external drive.
  `tmutil destinationinfo` and `tmutil status`
- [ ] **[manual] Repo pushed to private GitHub**
  `git remote -v && git log origin/main -1 --oneline`

## 7. AI interface

- [ ] **Build still succeeds with the AI seam in place** (covered by §1 `pnpm build`).
- [ ] **`ai.embed()` / `ai.complete()` throw `AI not configured — Sprint 4`** (no network calls)
  `pnpm exec tsx --conditions react-server -e "import('./src/lib/ai/index.ts').then(m=>m.ai.embed({text:'x'})).then(()=>console.log('FAIL: no throw')).catch(e=>console.log('PASS: '+e.message))"`
- [ ] **`import { ai } from '@/lib/ai'` resolves from any server module** (factory returns the stub).

---

## Sign-off

When every box above is checked (manual items attested by the operator), capture
`docs/sprint-1-baseline.md` and tag `sprint-1-complete`. That baseline is what
every Sprint 2 change is measured against.
