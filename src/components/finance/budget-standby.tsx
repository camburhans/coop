import { Standby } from '@/components/shell/standby';

/**
 * BudgetStandby — the Budgeting tab's pane.
 *
 * Server Component, and deliberately inert. Budgeting is DEFERRED: targets and
 * envelopes need their own data model (a Budget/target table with period
 * windows), and inventing one from the ledger's rows would be a guess dressed
 * up as a feature. So this tab is honest about the wait rather than showing a
 * half-built number.
 *
 * Reuses the shared shell {@link Standby} block verbatim; the finance CSS only
 * seats it a little higher inside the tab surface. STATIC — the shimmer is a
 * fixed gold glint, not a sweep.
 */
export function BudgetStandby() {
  return (
    <Standby
      name="Budgeting"
      sub="Targets and envelopes, measured against the ledger."
      note="TARGETS & ENVELOPES · A LATER SPRINT"
    />
  );
}
