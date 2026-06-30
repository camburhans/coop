import { Sigil } from '@/components/ui/sigil';

import { RailNav } from './rail-nav';
import { SystemStatus } from './system-status';

/**
 * StatusRail — the fixed left command rail (~92px).
 *
 * Server Component shell: the gold Sigil + ring, the mono "C.O.O.P." id, the
 * module nav (client, for active state), and the footer SystemStatus. Gold
 * right edge, blurred warm surface. Hidden ≤760px (the BottomNav takes over).
 */
export function StatusRail() {
  return (
    <aside className="rail" aria-label="Status rail">
      <Sigil />
      <div className="rail-id">C.O.O.P.</div>
      <RailNav />
      <SystemStatus />
    </aside>
  );
}
