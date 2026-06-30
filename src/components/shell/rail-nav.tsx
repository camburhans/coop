'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isActiveModule, NAV_ITEMS } from './nav-items';

/**
 * RailNav — the vertical module switcher inside the status rail.
 *
 * Client Component (it reads `usePathname` to mark the active module). Each item
 * is a Link with a static lucide glyph + mono micro-label. The active item gets
 * `is-active` (gold-hi text, gilded fill, gold left-edge bar). STATIC — no
 * transitions; only the route-driven active state changes.
 */
export function RailNav() {
  const pathname = usePathname();

  return (
    <nav className="rail-nav" aria-label="Modules">
      {NAV_ITEMS.map(({ href, label, ariaLabel, Icon }) => {
        const active = isActiveModule(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            className={active ? 'nav-btn is-active' : 'nav-btn'}
            aria-label={ariaLabel}
            aria-current={active ? 'page' : undefined}
          >
            <Icon aria-hidden strokeWidth={1.6} />
            <span className="nav-lbl">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
