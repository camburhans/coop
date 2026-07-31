import { Panel } from '@/components/ui/panel';

interface StandbyProps {
  /** The module name, shown large in Sora-200 (e.g. "Finance"). */
  name: string;
  /** A one-line description of what the module will hold. */
  sub: string;
  /**
   * The mono foot note. Defaults to the provisioning line; pass a specific one
   * when a surface is deferred for a known reason (e.g. the Finance module's
   * Budgeting tab, which is waiting on its own data model).
   */
  note?: string;
}

/**
 * Standby — the "MODULE STANDBY" screen for surfaces C.O.O.P. has not yet
 * provisioned.
 *
 * Server Component. A centered gilded panel: an indigo presence dot, a mono
 * "MODULE STANDBY" label, the module name in Sora-200, a sub-line, a STATIC
 * shimmer bar (a fixed gold glint — no sweep; Sprint 5 animates it), and a mono
 * foot note. Used by the /knowledge and /ai module pages, and by the Finance
 * module's Budgeting tab, until their real surfaces land.
 */
export function Standby({ name, sub, note = 'C.O.O.P. IS PROVISIONING THIS SURFACE' }: StandbyProps) {
  return (
    <div className="standby">
      <Panel>
        <div className="standby-dot" aria-hidden />
        <div className="standby-label">MODULE STANDBY</div>
        <h2 className="standby-name">{name}</h2>
        <p className="standby-sub">{sub}</p>
        <div className="shimmer" aria-hidden />
        <p className="standby-note">{note}</p>
      </Panel>
    </div>
  );
}
