import type { Priority, ProjectStatus, Task, TaskStatus } from '@prisma/client';

/**
 * View projection for the productivity surface (Option B).
 *
 * The database keeps the full "unified data model" enums (four project
 * statuses, four priorities, four task statuses, plus energy/notes/description).
 * The productivity UI — ported from `design-reference/productivity.{css,js}` —
 * speaks a deliberately leaner visual language: three project-status tiers,
 * three priority tiers, and a binary done/open task state.
 *
 * These helpers are the single, TOTAL mapping between the two. "Total" matters:
 * every enum value the database can hold resolves to a visual tier here, so a
 * value set outside the reduced forms (via the API, a seed, or a future
 * surface) still renders correctly instead of falling through. That is the
 * "room to grow" — reintroducing CRITICAL, IN_PROGRESS, energy, etc. needs no
 * migration and never breaks this view.
 *
 * Pills show the REAL enum label (see `STATUS_LABEL`/priority text in the
 * components); only the COLOUR tier is projected here.
 */

/** The three project-status colour tiers the design uses (gold / indigo / faint). */
export type ProjectStatusTier = 'active' | 'done' | 'planned';

/**
 * Map a Prisma `ProjectStatus` to its visual tier.
 * ACTIVE → active (gold), DONE → done (indigo). PAUSED and ARCHIVED collapse
 * into the quiet "planned" tier (neutral/faint accent) — there is no PLANNED
 * enum value, so this tier is where every not-active/not-done status lands.
 */
export function projectStatusTier(status: ProjectStatus): ProjectStatusTier {
  switch (status) {
    case 'ACTIVE':
      return 'active';
    case 'DONE':
      return 'done';
    case 'PAUSED':
    case 'ARCHIVED':
      return 'planned';
    default:
      return 'planned';
  }
}

/** The three priority colour tiers the design uses (alert / warn / faint). */
export type PriorityTier = 'high' | 'medium' | 'low';

/**
 * Map a Prisma `Priority` to its visual tier. CRITICAL folds into `high`
 * (there is no fourth accent colour); MEDIUM → medium; LOW → low.
 */
export function priorityTier(priority: Priority): PriorityTier {
  switch (priority) {
    case 'CRITICAL':
    case 'HIGH':
      return 'high';
    case 'MEDIUM':
      return 'medium';
    case 'LOW':
      return 'low';
    default:
      return 'medium';
  }
}

/** True when a task reads as complete. Every non-DONE status is "open". */
export function isTaskDone(status: TaskStatus): boolean {
  return status === 'DONE';
}

/** Task-completion tally for a set of tasks (used by the project progress bar). */
export interface TaskTally {
  total: number;
  done: number;
  /** Whole-percent complete (0 when there are no tasks). */
  pct: number;
}

/** Count total/done tasks and the percent complete for one project's tasks. */
export function tallyTasks(tasks: readonly Task[]): TaskTally {
  const total = tasks.length;
  const done = tasks.reduce((n, t) => (isTaskDone(t.status) ? n + 1 : n), 0);
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return { total, done, pct };
}
