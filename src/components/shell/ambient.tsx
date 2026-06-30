/**
 * Ambient — the static background canvas behind the whole instrument.
 *
 * Server Component. Renders the fixed background layers from the prototype:
 * three warm gold glow halos, a faint masked gold grid texture, a top
 * vignette, and an EMPTY `#particles` container. Everything sits at z-index 0
 * behind all content and is `pointer-events: none`.
 *
 * STATIC in Sprint 2 — nothing here moves and no particles are spawned. This
 * is the canvas Sprint 5 animates (halo drift, rising particle field), gated
 * behind the `.no-motion` / `.no-particles` body classes. All styling lives in
 * src/styles/globals.css so the tokens stay the single source of truth.
 */
export function Ambient() {
  return (
    <>
      <div className="ambient" aria-hidden="true">
        <div className="glow glow-a" />
        <div className="glow glow-b" />
        <div className="glow glow-c" />
        <div className="gridtex" />
        <div className="vignette" />
      </div>
      <div id="particles" aria-hidden="true" />
    </>
  );
}
