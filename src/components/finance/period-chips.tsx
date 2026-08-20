'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { Period } from '@/lib/finance/period';

import { PERIOD_OPTIONS } from './options';

interface PeriodChipsProps {
  /** The period currently in effect, resolved server-side from `?period=`. */
  value: Period;
}

/**
 * PeriodChips — THIS MONTH / QUARTER / YTD for the Reporting pane.
 *
 * Client Component, but it holds NO state: the selected period lives in the URL
 * (`?period=month|quarter|ytd`) and is read server-side, so every figure the
 * chips affect is re-derived in RSC. This component only navigates. That is the
 * whole reason the period is a search param rather than `useState` — no finance
 * math is allowed to run in the browser.
 *
 * `router.replace` (not `push`) keeps the back button meaningful: flipping
 * between periods is a change of view, not a place you came from. It is a soft
 * navigation to the same route, so the surface's active tab — real client state
 * in `FinanceSurface` — survives untouched, and `scroll: false` keeps the page
 * where the owner left it.
 *
 * `month` is the default `parsePeriod` falls back to, so selecting it drops the
 * param instead of writing a redundant one. Other search params are preserved.
 *
 * Reuses the productivity `.tf-chip` treatment verbatim. Chips are toggle
 * buttons (`aria-pressed`) inside a labelled group, fully keyboard-reachable.
 */
export function PeriodChips({ value }: PeriodChipsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function select(next: Period) {
    if (next === value) return;

    const params = new URLSearchParams(searchParams.toString());
    if (next === 'month') params.delete('period');
    else params.set('period', next);

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  return (
    <div className="fin-periods" role="group" aria-label="Reporting period">
      {PERIOD_OPTIONS.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            className={active ? 'tf-chip active' : 'tf-chip'}
            aria-pressed={active}
            onClick={() => select(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
