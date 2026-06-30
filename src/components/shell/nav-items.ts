import { BookOpen, CircleCheck, LayoutGrid, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react';

/**
 * Module navigation — the single source for the rail AND the bottom nav.
 *
 * Both navs render the same five modules in the same order, mapped to routes
 * inside the (app) group. `label` is the rail's mono micro-label; `shortLabel`
 * is the bottom-nav label (HOME instead of DASH, mirroring the prototype).
 * Icons are static lucide glyphs.
 */
export interface NavItem {
  href: string;
  /** Rail micro-label (mono). */
  label: string;
  /** Bottom-nav label (mirrors the rail; "HOME" for the dashboard). */
  shortLabel: string;
  /** Accessible name for the link. */
  ariaLabel: string;
  Icon: LucideIcon;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/', label: 'DASH', shortLabel: 'HOME', ariaLabel: 'Dashboard', Icon: LayoutGrid },
  {
    href: '/productivity',
    label: 'FOCUS',
    shortLabel: 'FOCUS',
    ariaLabel: 'Productivity',
    Icon: CircleCheck,
  },
  { href: '/finance', label: 'FINANCE', shortLabel: 'FINANCE', ariaLabel: 'Finance', Icon: TrendingUp },
  { href: '/knowledge', label: 'KNOW', shortLabel: 'KNOW', ariaLabel: 'Knowledge', Icon: BookOpen },
  { href: '/ai', label: 'A.I.', shortLabel: 'A.I.', ariaLabel: 'A.I. Core', Icon: Sparkles },
];

/**
 * Whether `href` is the active module for the current `pathname`. The dashboard
 * (`/`) matches exactly; every other module also matches its sub-routes so the
 * highlight holds as deeper pages arrive in later sprints.
 */
export function isActiveModule(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
