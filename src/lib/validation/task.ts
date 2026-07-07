import { z } from 'zod';

import { Energy, Priority, TaskStatus } from '@prisma/client';

/**
 * Zod schemas for Task mutation input.
 *
 * Like the project schemas, the enum fields mirror the Prisma enums directly
 * and `dueDate` accepts an ISO date string (or Date) → Date (DATE column, so
 * only the calendar day persists; `null` clears it). Tasks are standalone by
 * default, so `projectId` is an optional, nullable UUID.
 *
 * Defaults (status TODO, priority MEDIUM, energy MEDIUM) live only on the
 * create schema. The update schema is a straight `.partial()` of the
 * default-free base, so a PATCH never silently resets an omitted field.
 */
const taskFields = {
  title: z.string().trim().min(1, 'title is required').max(200),
  projectId: z.uuid().nullable().optional(),
  status: z.enum(TaskStatus),
  priority: z.enum(Priority),
  energy: z.enum(Energy),
  dueDate: z.coerce.date().nullable().optional(),
  notes: z.string().trim().nullable().optional(),
};

export const taskCreateSchema = z.object({
  ...taskFields,
  status: taskFields.status.default(TaskStatus.TODO),
  priority: taskFields.priority.default(Priority.MEDIUM),
  energy: taskFields.energy.default(Energy.MEDIUM),
});

export const taskUpdateSchema = z.object(taskFields).partial();

/**
 * Input accepted by the task service. `z.input` keeps defaulted fields
 * optional and accepts an ISO date string for `dueDate`.
 */
export type TaskCreateInput = z.input<typeof taskCreateSchema>;
export type TaskUpdateInput = z.input<typeof taskUpdateSchema>;
