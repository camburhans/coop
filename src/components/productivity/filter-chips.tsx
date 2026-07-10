'use client';

import type { Project } from '@prisma/client';

/** The task filter: `null` = all tasks, a project id, or `'none'` = unassigned. */
export type FilterValue = string | null | 'none';

interface FilterChipsProps {
  projects: Pick<Project, 'id' | 'name'>[];
  counts: {
    all: number;
    none: number;
    byProject: Record<string, number>;
  };
  value: FilterValue;
  onChange: (value: FilterValue) => void;
}

/**
 * FilterChips — the client-side task filter row (`.task-filter`).
 *
 * One chip for ALL, one per project, and one for unassigned ("NO PROJECT"),
 * each with a live count. Filtering is pure client state (the whole task set is
 * already loaded), so switching views is instant and never hits the server —
 * the calm, room-to-grow choice over the old `?projectId=` round-trip. Chips
 * are toggle buttons (`aria-pressed`), fully keyboard-reachable.
 */
export function FilterChips({ projects, counts, value, onChange }: FilterChipsProps) {
  return (
    <div className="task-filter">
      <button
        type="button"
        className={value === null ? 'tf-chip active' : 'tf-chip'}
        aria-pressed={value === null}
        onClick={() => onChange(null)}
      >
        ALL <b>{counts.all}</b>
      </button>

      {projects.map((p) => (
        <button
          key={p.id}
          type="button"
          className={value === p.id ? 'tf-chip active' : 'tf-chip'}
          aria-pressed={value === p.id}
          onClick={() => onChange(p.id)}
        >
          {p.name.toUpperCase()} <b>{counts.byProject[p.id] ?? 0}</b>
        </button>
      ))}

      <button
        type="button"
        className={value === 'none' ? 'tf-chip active' : 'tf-chip'}
        aria-pressed={value === 'none'}
        onClick={() => onChange('none')}
      >
        NO PROJECT <b>{counts.none}</b>
      </button>
    </div>
  );
}
