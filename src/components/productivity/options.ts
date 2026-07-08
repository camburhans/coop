/**
 * Select-option constants for the productivity forms.
 *
 * Defined as local string-literal arrays rather than imported from
 * `@prisma/client` so the client form bundles carry no runtime Prisma
 * dependency. The literals mirror the Prisma enums exactly; the zod schemas on
 * the server (which DO derive from the enums) are the real guard — these just
 * populate the dropdowns.
 */

export const PROJECT_STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'PAUSED', label: 'Paused' },
  { value: 'DONE', label: 'Done' },
  { value: 'ARCHIVED', label: 'Archived' },
] as const;

export const TASK_STATUS_OPTIONS = [
  { value: 'TODO', label: 'To do' },
  { value: 'IN_PROGRESS', label: 'In progress' },
  { value: 'DONE', label: 'Done' },
  { value: 'BLOCKED', label: 'Blocked' },
] as const;

export const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
] as const;

export const ENERGY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
] as const;

/** Short mono label for a status, shown in cards/rows. */
export const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  DONE: 'DONE',
  ARCHIVED: 'ARCHIVED',
  TODO: 'TO DO',
  IN_PROGRESS: 'IN PROGRESS',
  BLOCKED: 'BLOCKED',
};
