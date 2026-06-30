import type { ReactNode } from 'react';

import { Ambient } from '@/components/shell/ambient';
import { BottomNav } from '@/components/shell/bottom-nav';
import { CommandBar } from '@/components/shell/command-bar';
import { StatusRail } from '@/components/shell/status-rail';

/**
 * (app) shell — the command-console frame wrapping every authenticated module.
 *
 * Server Component. A CSS grid: a 92px rail column + 1fr, rows auto (command
 * bar) + 1fr (scrolling main). The static <Ambient/> canvas sits behind it; the
 * <StatusRail/> fills the rail column and both grid rows; the <CommandBar/> caps
 * the content column; page content renders in <main>. <BottomNav/> is fixed and
 * only appears ≤760px (where the rail hides). The warm body radial shows
 * through. STATIC — the only moving element anywhere is the rail's live clock.
 */

/**
 * Render per request, not at build. The console is personalised and time-aware
 * (the Greeting and the command-bar date depend on "now") and sits behind the
 * auth proxy, so it must never be frozen into static HTML at deploy time.
 */
export const dynamic = 'force-dynamic';

export default function AppShellLayout({ children }: { children: ReactNode }) {
  return (
    <div className="console">
      <Ambient />
      <StatusRail />
      <CommandBar />
      <main className="main">{children}</main>
      <BottomNav />
    </div>
  );
}
