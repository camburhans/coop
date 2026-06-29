# Auth — Manual Test Plan (Sprint 1)

The app passcode gate is the only application-layer security in V1 (Tailscale
covers the network layer). These steps verify the unlock → session → lock flow
end to end. Run them against the dev server (`pnpm dev`, http://localhost:3001)
with the dev Postgres up (`pnpm dev:db:up`).

The passcode is whatever `APP_PASSCODE` is set to in `.env`.

## Test steps

1. **Unauthenticated root redirects.** Visit `/` with no session cookie.
   - Expect: redirect (`307`) to `/unlock`.

2. **Wrong passcode is rejected.** On `/unlock`, enter an incorrect passcode.
   - Expect: error message shown, response `401 {ok:false}`, **no** session
     cookie set.

3. **Brute force is rate limited.** Submit a wrong passcode 6 times in a row.
   - Expect: attempts 1–5 return `401`; the 6th returns `429` (rate limited)
     for the rest of the 10-minute window. Limit is 5 failures / 10 min / IP.

4. **Correct passcode unlocks.** Enter the correct passcode.
   - Expect: redirect to `/`, and a `coop_session` cookie is set
     (`HttpOnly`, `SameSite=Lax`, `Max-Age=2592000` = 30 days, `Secure` in
     production only).
   - Note: if you just tripped the rate limit in step 3, wait out the window or
     restart the dev server (the limiter is in-memory) before testing this.

5. **Valid session reaches the app.** Visit `/` with the valid cookie.
   - Expect: `200`, page renders **"C.O.O.P. is online."** with a Lock button.

6. **Lock clears the session.** Click **Lock**.
   - Expect: `POST /api/auth/lock` returns `{ok:true}`, the `coop_session`
     cookie is cleared, and the page reload redirects back to `/unlock`.

7. **Health bypasses auth.** Request `/api/health` while unauthenticated.
   - Expect: `200` with `{ status: "ok", timestamp: <ISO>, db: true }` even with
     no session — so external uptime tooling can reach it.

## Automated check of the same flow (curl)

```bash
BASE=http://localhost:3001
PASS="<your APP_PASSCODE>"
JAR=/tmp/coop_cookies.txt

# 1: unauthenticated root -> 307 /unlock
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "$BASE/"

# 7: health, unauthenticated -> 200 + db:true
curl -s "$BASE/api/health"; echo

# 2 & 3: wrong passcode x6 -> 401 x5 then 429
for i in $(seq 1 6); do
  curl -s -o /dev/null -w "attempt $i: %{http_code}\n" \
    -H 'Content-Type: application/json' \
    -d '{"passcode":"wrong"}' "$BASE/api/auth/unlock"
done
# (restart dev server here to clear the in-memory limiter before step 4)

# 4: correct passcode -> 200 ok:true + Set-Cookie coop_session
curl -s -c "$JAR" -w "\n%{http_code}\n" \
  -H 'Content-Type: application/json' \
  -d "{\"passcode\":\"$PASS\"}" "$BASE/api/auth/unlock"

# 5: root with cookie -> 200 + "C.O.O.P. is online."
curl -s -b "$JAR" "$BASE/" | grep "C.O.O.P. is online."

# 6: lock clears cookie, then root -> 307 /unlock
curl -s -b "$JAR" -c "$JAR" -X POST "$BASE/api/auth/lock"; echo
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" -b "$JAR" "$BASE/"
```

## Last run

All 7 steps passed against `pnpm dev` (Next.js 16.2.9) with the dev Postgres
healthy on port 5433:

| # | Check | Result |
|---|-------|--------|
| 1 | `/` unauthenticated | `307` → `/unlock` |
| 2 | wrong passcode | `401 {ok:false}`, no cookie |
| 3 | 6th wrong attempt | `429` (5×`401` first) |
| 4 | correct passcode | `200 {ok:true}` + `coop_session` (HttpOnly, SameSite=Lax, 30d) |
| 5 | `/` with cookie | `200`, "C.O.O.P. is online." |
| 6 | lock then `/` | cookie cleared, `307` → `/unlock` |
| 7 | `/api/health` unauthenticated | `200`, `db:true` |

> The rate limiter is in-memory and per-IP (single-user, single-instance by
> design). It resets on server restart or after the 10-minute window.
