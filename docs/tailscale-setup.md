# Tailscale Setup — Phone Access to Production

C.O.O.P. is never exposed to the public internet. The only way the owner's
phone reaches the production app is over [Tailscale](https://tailscale.com), an
encrypted private network (tailnet). Because dev and prod live on the same Mac
mini, Tailscale here is purely about reaching **prod (port 3000)** from your
phone — it is not about connecting to a remote server.

All steps below are **manual** and done once.

## Steps

1. **Install Tailscale on the Mac mini and sign in.**

   ```bash
   brew install --cask tailscale
   ```

   Launch Tailscale and sign in with your account (this account defines your
   tailnet).

2. **Bring the mini onto the tailnet.**

   ```bash
   tailscale up
   ```

3. **Note the Mac mini's Tailscale identity.** You'll need these to reach it
   from the phone:
   - Its Tailscale machine name, e.g. `coop-brain.tailnet-xxxx.ts.net`
   - Its Tailscale IP (the `100.x.y.z` address)

   ```bash
   tailscale status      # shows this machine's name and IP
   tailscale ip -4       # just the IPv4 tailnet address
   ```

4. **Install Tailscale on your phone and sign in to the SAME tailnet.** Use the
   identical account you used in step 1. The phone and the mini must be on the
   same tailnet to see each other.

5. **Expose prod to the tailnet with Tailscale Serve.** The prod container
   publishes its port on `127.0.0.1:3000` (loopback only), so a phone cannot
   reach it directly by IP — a loopback-bound port does not accept connections
   arriving on the Tailscale interface. Tailscale Serve bridges this: the
   tailscaled daemon listens on the tailnet and proxies to `127.0.0.1:3000`.
   This keeps prod **tailnet-only** (nothing on your home LAN) and adds HTTPS.

   First-time only — enable Serve/HTTPS for your tailnet in the admin console
   (Tailscale will print the exact enable link if it isn't on yet), then:

   ```bash
   tailscale serve --bg 3000     # proxy https://<mac-mini>.<tailnet>.ts.net -> 127.0.0.1:3000
   tailscale serve status        # confirm the mapping
   ```

6. **From the phone, browse to production over HTTPS (no port):**

   ```
   https://<mac-mini>.<tailnet>.ts.net
   ```

   for example `https://camerons-mac-mini.tail93b21c.ts.net`.

   > **Production only.** Never expose or browse to 3001 (the dev server) or
   > 5433 (the dev database). Those exist only for local development on the
   > machine itself. Serve only port 3000.

7. **(Optional) Enable MagicDNS** in the admin console for a clean short
   hostname. MagicDNS must be on for the `*.ts.net` name to resolve on the
   phone (it usually is by default).

### Alternative (NOT recommended): direct port binding

If you don't want to use Serve, change the prod port mapping in
`docker/docker-compose.yml` from `127.0.0.1:3000:3000` to `3000:3000` and
`pnpm prod:up`. The phone then uses `http://<mac-mini>.<tailnet>.ts.net:3000`.
**Tradeoff:** this also binds the app on every other interface, so anyone on
your home Wi-Fi/LAN can reach the passcode screen — it is no longer
tailnet-only. Prefer Serve unless you have a specific reason not to.

## Security reminders

- **The only thing protecting prod from other devices on your tailnet is the
  app passcode.** Keep the tailnet limited to YOUR devices only — do not share
  nodes, do not invite other users, and do not accept shared machines into this
  tailnet.
- **Only the production app (port 3000) should ever be reachable over
  Tailscale.** The dev server (3001) and the dev database (5433) are bound to
  localhost for work on the machine itself and must never be accessed remotely.
- If you ever do share the tailnet (don't, for V1), assume the passcode is your
  only remaining line of defense and treat it accordingly.
