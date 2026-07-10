import type { TaskStatus } from '@prisma/client';

/**
 * Date helpers shared by the productivity server components (project card,
 * task list) and the client rows/forms. No `server-only` guard — these are
 * pure, framework-free formatters safe on both sides of the RSC boundary.
 *
 * `dueDate` columns are Postgres DATE values, which Prisma hands back as a
 * `Date` pinned to UTC midnight. Every helper here reads the UTC components so
 * the calendar day never drifts by a timezone offset (a local-time read of a
 * UTC-midnight date can land on the previous day west of Greenwich).
 */

const MONTHS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
] as const;

/** "JUL 9" — mono-friendly, uppercase, UTC-based. Adds the year if not the current one. */
export function formatDueDate(date: Date): string {
  const month = MONTHS[date.getUTCMonth()] ?? '';
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  const nowYear = new Date().getUTCFullYear();
  const base = `${month} ${day}`;
  return year === nowYear ? base : `${base} ${year}`;
}

/** The UTC calendar day for "today", as a Date at UTC midnight. */
function todayUtc(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * A due date is overdue when it falls strictly before today AND the task is
 * still open. DONE tasks are never overdue; a task due today is not yet late.
 */
export function isOverdue(date: Date | null, status: TaskStatus): boolean {
  if (!date || status === 'DONE') return false;
  return date.getTime() < todayUtc().getTime();
}

/**
 * True when a date falls strictly before today (UTC calendar day). Unlike
 * {@link isOverdue} this carries no status opinion, so callers that track
 * completion differently (e.g. projects, whose "done" is a status tier, not a
 * TaskStatus) can combine it with their own done check.
 */
export function isPastDue(date: Date | null): boolean {
  if (!date) return false;
  return date.getTime() < todayUtc().getTime();
}

/** Convert a Date (or null) to a `yyyy-mm-dd` string for an `<input type="date">`. */
export function toDateInputValue(date: Date | null | undefined): string {
  if (!date) return '';
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
