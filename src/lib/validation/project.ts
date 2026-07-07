import { z } from 'zod';

import { Priority, ProjectStatus } from '@prisma/client';

/**
 * Zod schemas for Project mutation input.
 *
 * The enum fields mirror the Prisma enums directly (zod 4's `z.enum` accepts
 * the generated enum objects), so validation can never drift from the database
 * schema. `dueDate` accepts an ISO date string (or a Date) and normalises to a
 * Date; the column is a DATE, so only the calendar day is persisted. `null`
 * clears the date, and omitting it leaves it unchanged on update — dates are
 * optional per the architecture ("priority/energy driven, dates optional").
 *
 * The shared field definitions deliberately carry NO defaults. Defaults live
 * only on the create schema, where an absent field genuinely means "use the
 * default". The update schema is a straight `.partial()` of the base, so a
 * PATCH that omits a field never silently resets it to a default.
 */
const projectFields = {
  name: z.string().trim().min(1, 'name is required').max(120),
  description: z.string().trim().nullable().optional(),
  status: z.enum(ProjectStatus),
  priority: z.enum(Priority),
  dueDate: z.coerce.date().nullable().optional(),
};

export const projectCreateSchema = z.object({
  ...projectFields,
  status: projectFields.status.default(ProjectStatus.ACTIVE),
  priority: projectFields.priority.default(Priority.MEDIUM),
});

export const projectUpdateSchema = z.object(projectFields).partial();

/**
 * Input accepted by the project service. `z.input` keeps defaulted fields
 * optional (so callers may omit status/priority) and accepts an ISO date
 * string for `dueDate`.
 */
export type ProjectCreateInput = z.input<typeof projectCreateSchema>;
export type ProjectUpdateInput = z.input<typeof projectUpdateSchema>;
