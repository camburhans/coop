import { Standby } from '@/components/shell/standby';

/**
 * /productivity — the Focus / Productivity module surface.
 *
 * Standby for now; this becomes the first REAL module in Session #4 (task flow,
 * focus blocks & habit telemetry).
 */
export default function ProductivityPage() {
  return <Standby name="Productivity" sub="Task flow, focus blocks & habit telemetry." />;
}
