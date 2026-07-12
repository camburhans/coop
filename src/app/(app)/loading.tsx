import { PanelGrid } from '@/components/shell/panel-grid';
import { Panel } from '@/components/ui/panel';

/**
 * Dashboard loading state.
 *
 * Shown while the (app) home surface's server components resolve. A calm,
 * STATIC gilded-glass skeleton in the locked panel layout — muted blocks
 * standing in for each panel's content. No shimmer or motion (that is
 * Sprint 5); the blocks simply sit at a low opacity so the frame reads as
 * settling rather than broken.
 */

/** A muted placeholder bar. Width is passed as a Tailwind fraction/utility. */
function Bar({ className }: { className: string }) {
  return <div className={`h-3 rounded bg-panel-deep opacity-60 ${className}`} aria-hidden />;
}

function PanelSkeleton({ className }: { className?: string }) {
  return (
    <Panel label="Loading" meta="…" className={className}>
      <div className="flex flex-col gap-4 pt-2">
        <Bar className="w-3/4" />
        <Bar className="w-full" />
        <Bar className="w-2/3" />
        <Bar className="w-5/6" />
      </div>
    </Panel>
  );
}

export default function DashboardLoading() {
  return (
    <PanelGrid>
      <PanelSkeleton className="p-priorities" />
      <PanelSkeleton className="p-calendar" />
      <PanelSkeleton className="p-finance" />
      <PanelSkeleton className="p-verse" />
    </PanelGrid>
  );
}
