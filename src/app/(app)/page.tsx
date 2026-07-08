import { CalendarPanel } from '@/components/panels/calendar-panel';
import { FinancePlaceholder } from '@/components/panels/finance-placeholder';
import { PrioritiesPanel } from '@/components/panels/priorities-panel';
import { VersePanel } from '@/components/panels/verse-panel';
import { PanelGrid } from '@/components/shell/panel-grid';

/**
 * Dashboard ("/") — the command console's home surface.
 *
 * Four gilded panels in the locked layout: Priorities leads (top-left,
 * hero-weight 7×2, LIVE ranked tasks), Today's Calendar sits beside it
 * (top-right, LIVE — empty until seeded), and the floor row carries the Finance
 * hero (left, a first-class static placeholder until Sprint 3) and the
 * Scripture foundation (right, LIVE current verse).
 *
 * Rendered per request: three of the four panels read live data through the
 * service layer and sit behind the auth proxy, so the surface is never frozen
 * into static HTML at build time.
 */
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <PanelGrid>
      <PrioritiesPanel />
      <CalendarPanel />
      <FinancePlaceholder />
      <VersePanel />
    </PanelGrid>
  );
}
