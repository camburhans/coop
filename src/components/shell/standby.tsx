import { Panel } from '@/components/ui/panel';

interface StandbyProps {
  /** The module name, shown large in Sora-200 (e.g. "Finance"). */
  name: string;
  /** A one-line description of what the module will hold. */
  sub: string;
}

/**
 * Standby — the "MODULE STANDBY" screen for surfaces C.O.O.P. has not yet
 * provisioned.
 *
 * Server Component. A centered gilded panel: an indigo presence dot, a mono
 * "MODULE STANDBY" label, the module name in Sora-200, a sub-line, a STATIC
 * shimmer bar (a fixed gold glint — no sweep; Sprint 5 animates it), and the
 * mono "C.O.O.P. IS PROVISIONING THIS SURFACE" note. Used by the /finance,
 * /knowledge, /ai and /productivity module pages until their real surfaces land.
 */
export function Standby({ name, sub }: StandbyProps) {
  return (
    <div className="standby">
      <Panel>
        <div className="standby-dot" aria-hidden />
        <div className="standby-label">MODULE STANDBY</div>
        <h2 className="standby-name">{name}</h2>
        <p className="standby-sub">{sub}</p>
        <div className="shimmer" aria-hidden />
        <p className="standby-note">C.O.O.P. IS PROVISIONING THIS SURFACE</p>
      </Panel>
    </div>
  );
}
