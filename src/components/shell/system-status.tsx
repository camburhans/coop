import { StatusDot } from '@/components/ui/status-dot';

import { LiveClock } from './live-clock';

/**
 * SystemStatus — the rail's footer presence block.
 *
 * Server Component. An indigo presence dot (C.O.O.P.'s voice cue) + mono
 * "READY", above the LiveClock. The clock is the only moving piece.
 */
export function SystemStatus() {
  return (
    <div className="rail-sys">
      <div className="rail-presence">
        <StatusDot label="C.O.O.P. ready" />
        <b>READY</b>
      </div>
      <LiveClock className="rail-clock" />
    </div>
  );
}
