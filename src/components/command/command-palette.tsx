'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';

import { ProjectForm } from '@/components/productivity/project-form';
import { TaskForm } from '@/components/productivity/task-form';
import { ASK_STUB, respond } from '@/components/shell/respond';
import { useCommandPalette } from '@/stores/command-palette';
import { useUiPrefs } from '@/stores/ui-prefs';

type CommandGroup = 'NAVIGATE' | 'CREATE';

interface CommandItem {
  id: string;
  group: CommandGroup;
  label: string;
  /** Extra words folded into the match haystack (never shown). */
  keywords?: string;
  /** Right-aligned mono hint. */
  hint?: string;
  run: () => void;
}

/** Which face the palette is showing: the command list or a quick-add form. */
type Mode = 'command' | 'add-task' | 'add-project';

interface ProjectOption {
  id: string;
  name: string;
}

/** The fixed order the groups render in. */
const GROUP_ORDER: readonly CommandGroup[] = ['NAVIGATE', 'CREATE'];

/**
 * CommandPalette — the ⌘K "Ask C.O.O.P." surface.
 *
 * Client Component, always mounted in the (app) shell but only rendered (via a
 * portal to <body>, so panel `backdrop-filter` can't clip it) while open. A
 * dimmed scrim + a centered gilded card. STATIC: it appears in its final state
 * with NO open/close transition (Sprint 5).
 *
 * Three faces:
 *  - command list: NAVIGATE (modules, lock, motion/particle toggles) + CREATE
 *    (new task / new project). Simple case-insensitive substring filtering —
 *    NO semantic search. When the query matches no command, a single "Ask
 *    C.O.O.P" item appears; activating it drops the static {@link ASK_STUB}
 *    into the response toast (NO AI call, NO provider import).
 *  - add-task / add-project: the SAME TaskForm / ProjectForm the Focus page
 *    uses, so the shortcut has full parity (priority, status, due date, linked
 *    project) and can never drift from the module. A "← Back" affordance drops
 *    you back to the command list; the form's own Cancel closes the palette.
 *    Capture stays quick — the name/title autofocuses and Enter submits.
 *
 * Fully keyboard-driven: arrows move the selection, Enter activates, Escape
 * closes (via the global CommandHotkey).
 */
export function CommandPalette() {
  const isOpen = useCommandPalette((state) => state.isOpen);
  const query = useCommandPalette((state) => state.query);
  const setQuery = useCommandPalette((state) => state.setQuery);
  const close = useCommandPalette((state) => state.close);

  const toggleMotion = useUiPrefs((state) => state.toggleMotion);
  const toggleParticles = useUiPrefs((state) => state.toggleParticles);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('command');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Fresh open always lands on the command list with the first item selected.
  // Adjusting local state from the `isOpen` transition via the render-phase
  // "previous value" pattern (React's recommended alternative to an effect).
  const [prevOpen, setPrevOpen] = useState(isOpen);
  if (isOpen !== prevOpen) {
    setPrevOpen(isOpen);
    if (isOpen) {
      setMode('command');
      setSelectedIndex(0);
    }
  }

  // Autofocus the search field whenever the command list is showing.
  useEffect(() => {
    if (isOpen && mode === 'command') inputRef.current?.focus();
  }, [isOpen, mode]);

  const items = useMemo<CommandItem[]>(() => {
    const go = (href: string) => () => {
      close();
      router.push(href);
    };
    const lock = () => {
      void fetch('/api/auth/lock', { method: 'POST' }).finally(() => {
        window.location.assign('/unlock');
      });
    };

    return [
      { id: 'nav-dashboard', group: 'NAVIGATE', label: 'Dashboard', keywords: 'home dash', run: go('/') },
      {
        id: 'nav-productivity',
        group: 'NAVIGATE',
        label: 'Productivity',
        keywords: 'focus tasks projects prod',
        hint: 'FOCUS',
        run: go('/productivity'),
      },
      { id: 'nav-finance', group: 'NAVIGATE', label: 'Finance', keywords: 'money stewardship', run: go('/finance') },
      { id: 'nav-knowledge', group: 'NAVIGATE', label: 'Knowledge', keywords: 'know notes', run: go('/knowledge') },
      { id: 'nav-ai', group: 'NAVIGATE', label: 'A.I. Core', keywords: 'ai assistant coop', run: go('/ai') },
      { id: 'nav-lock', group: 'NAVIGATE', label: 'Lock app', keywords: 'logout sign out session', run: lock },
      { id: 'toggle-motion', group: 'NAVIGATE', label: 'Toggle motion', keywords: 'animation reduce', run: toggleMotion },
      {
        id: 'toggle-particles',
        group: 'NAVIGATE',
        label: 'Toggle particles',
        keywords: 'ambient field',
        run: toggleParticles,
      },
      { id: 'create-task', group: 'CREATE', label: 'New task…', keywords: 'add todo', run: () => setMode('add-task') },
      {
        id: 'create-project',
        group: 'CREATE',
        label: 'New project…',
        keywords: 'add',
        run: () => setMode('add-project'),
      },
    ];
  }, [close, router, toggleMotion, toggleParticles]);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!normalizedQuery) return items;
    return items.filter((item) =>
      `${item.label} ${item.keywords ?? ''}`.toLowerCase().includes(normalizedQuery),
    );
  }, [items, normalizedQuery]);

  // No command matched a non-empty query → offer the stubbed Ask path.
  const showAsk = normalizedQuery.length > 0 && filtered.length === 0;

  if (!isOpen) return null;

  function runAsk() {
    respond(ASK_STUB);
    close();
  }

  function onInputKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setSelectedIndex((index) => Math.min(index + 1, filtered.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setSelectedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if (showAsk) {
        runAsk();
        return;
      }
      filtered[selectedIndex]?.run();
    }
  }

  const body =
    mode === 'command' ? (
      <>
        <div className="cmd-palette-field">
          <span className="cmd-palette-spark" aria-hidden>
            ✦
          </span>
          <input
            ref={inputRef}
            className="cmd-palette-input"
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={onInputKeyDown}
            placeholder="Type a command, or ask C.O.O.P.…"
            aria-label="Command palette"
            autoComplete="off"
            spellCheck={false}
          />
          <span className="cmd-kbd" aria-hidden>
            ESC
          </span>
        </div>

        <div className="cmd-results" role="listbox" aria-label="Commands">
          {GROUP_ORDER.map((group) => {
            const groupItems = filtered.filter((item) => item.group === group);
            if (groupItems.length === 0) return null;
            return (
              <div key={group} className="cmd-group-wrap">
                <div className="cmd-group">{group}</div>
                {groupItems.map((item) => {
                  const index = filtered.indexOf(item);
                  const active = index === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={active}
                      className={active ? 'cmd-item is-active' : 'cmd-item'}
                      onMouseMove={() => setSelectedIndex(index)}
                      onClick={item.run}
                    >
                      <span className="cmd-item-label">{item.label}</span>
                      {item.hint ? <span className="cmd-item-hint">{item.hint}</span> : null}
                    </button>
                  );
                })}
              </div>
            );
          })}

          {showAsk ? (
            <div className="cmd-group-wrap">
              <div className="cmd-group">ASK</div>
              <button
                type="button"
                role="option"
                aria-selected
                className="cmd-item is-active"
                onClick={runAsk}
              >
                <span className="cmd-item-label">Ask C.O.O.P: “{query.trim()}”</span>
                <span className="cmd-item-hint" aria-hidden>
                  ↵
                </span>
              </button>
            </div>
          ) : null}
        </div>
      </>
    ) : (
      <div className="cmd-add">
        <div className="cmd-add-head">
          <button type="button" className="cmd-back" onClick={() => setMode('command')}>
            ← Back
          </button>
          <span className="cmd-add-title">{mode === 'add-task' ? 'New task' : 'New project'}</span>
        </div>
        {mode === 'add-task' ? <TaskFormLoader onClose={close} /> : <ProjectForm onClose={close} />}
      </div>
    );

  return createPortal(
    <div className="cmd-palette" role="presentation">
      <div className="cmd-palette-scrim" onClick={close} />
      <div className="cmd-palette-card" role="dialog" aria-modal="true" aria-label="Ask C.O.O.P.">
        {body}
      </div>
    </div>,
    document.body,
  );
}

/**
 * TaskFormLoader — wraps the real Focus-page {@link TaskForm} for the palette.
 *
 * TaskForm needs the project list for its "linked project" select. The Focus
 * page has that list server-side; here in the always-mounted palette we fetch
 * it on demand (only when the New-task face opens). Everything else — fields,
 * segmented priority/status, due date, validation, POST → router.refresh() — is
 * the module's own form, so the shortcut can never drift from the Focus page.
 */
function TaskFormLoader({ onClose }: { onClose: () => void }) {
  const [projects, setProjects] = useState<ProjectOption[]>([]);

  useEffect(() => {
    let active = true;
    void fetch('/api/projects')
      .then((res) => (res.ok ? (res.json() as Promise<ProjectOption[]>) : []))
      .then((data) => {
        if (active && Array.isArray(data)) {
          setProjects(data.map((p) => ({ id: p.id, name: p.name })));
        }
      })
      .catch(() => {
        /* projects stay empty — the select just shows "No project" */
      });
    return () => {
      active = false;
    };
  }, []);

  return <TaskForm projects={projects} onClose={onClose} />;
}
