'use client';

import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

/** The three finance views. */
type TabId = 'reporting' | 'ledger' | 'budgeting';

const TABS: readonly { id: TabId; label: string }[] = [
  { id: 'reporting', label: 'REPORTING' },
  { id: 'ledger', label: 'LEDGER' },
  { id: 'budgeting', label: 'BUDGETING' },
];

/**
 * Reporting leads: the daily question is "how are we doing?", and answering it
 * without a click is the point of the surface. Recording entries is the
 * deliberate act, one tab away.
 */
const DEFAULT_TAB: TabId = 'reporting';

interface FinanceSurfaceProps {
  /** Server-rendered panes, handed in as props. */
  reporting: ReactNode;
  ledger: ReactNode;
  budgeting: ReactNode;
}

/**
 * FinanceSurface — the gilded tab shell for the finance module.
 *
 * Client Component, and the ONLY client state on this surface: which tab is
 * active. Every pane is SERVER-rendered and passed in as a prop, so switching
 * tabs is a pure show/hide — no refetch, no loading flash, and the whole
 * surface stays a single server round-trip. (The panes themselves contain
 * client subtrees for the ledger's modals and filters; those hydrate normally.)
 *
 * Keyboard behaviour follows the WAI-ARIA tabs pattern and mirrors the
 * prototype's `setTab`: a roving tabindex (only the selected tab is a tab
 * stop), Arrow Left/Up and Right/Down to move with wraparound, Home/End to
 * jump, and `aria-selected` + `aria-controls` tying each tab to its pane.
 * Selection follows focus, which is the right call here because switching panes
 * costs nothing.
 *
 * STATIC — the active pill is a state change, not a transition; motion is
 * Sprint 5.
 */
export function FinanceSurface({ reporting, ledger, budgeting }: FinanceSurfaceProps) {
  const [active, setActive] = useState<TabId>(DEFAULT_TAB);
  const strip = useRef<HTMLDivElement | null>(null);

  const panes: Record<TabId, ReactNode> = { reporting, ledger, budgeting };

  /** Select a tab and move focus to it (the arrow/Home/End path). */
  function focusTab(id: TabId) {
    setActive(id);
    strip.current?.querySelector<HTMLButtonElement>(`#fin-tab-${id}`)?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const index = TABS.findIndex((t) => t.id === active);
    if (index === -1) return;

    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (index + 1) % TABS.length;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (index - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    if (next === null) return;

    e.preventDefault();
    const target = TABS[next];
    if (target) focusTab(target.id);
  }

  return (
    <div className="fin">
      <div
        className="fin-tabs"
        role="tablist"
        aria-label="Finance views"
        ref={strip}
        onKeyDown={onKeyDown}
      >
        {TABS.map((tab) => {
          const selected = tab.id === active;
          return (
            <button
              key={tab.id}
              id={`fin-tab-${tab.id}`}
              type="button"
              role="tab"
              className={selected ? 'fin-tab active' : 'fin-tab'}
              aria-selected={selected}
              aria-controls={`fin-pane-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {TABS.map((tab) => (
        <div
          key={tab.id}
          id={`fin-pane-${tab.id}`}
          role="tabpanel"
          aria-labelledby={`fin-tab-${tab.id}`}
          hidden={tab.id !== active}
          tabIndex={0}
        >
          {panes[tab.id]}
        </div>
      ))}
    </div>
  );
}
