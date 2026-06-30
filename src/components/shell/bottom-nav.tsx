'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isActiveModule, NAV_ITEMS } from './nav-items';

/**
 * BottomNav — the fixed glass bottom nav for phones (shown only ≤760px, where
 * the rail is hidden).
 *
 * Client Component (reads `usePathname` for the active module). Mirrors the rail
 * with the same five modules — HOME/FOCUS/FINANCE/KNOW/A.I. — as static lucide
 * glyphs + mono labels. Visibility is handled in CSS (`.bottomnav`).
 */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottomnav" aria-label="Modules">
      {NAV_ITEMS.map(({ href, shortLabel, ariaLabel, Icon }) => {
        const active = isActiveModule(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? 'bn-btn is-active' : 'bn-btn'}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
          >
            <Icon aria-hidden strokeWidth={1.6} />
            <span>{shortLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
