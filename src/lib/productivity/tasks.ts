import 'server-only';

import { Energy, Prisma, Priority, TaskStatus, type Task } from '@prisma/client';

import { prisma } from '@/lib/db/client';
import {
  taskCreateSchema,
  taskUpdateSchema,
  type TaskCreateInput,
  type TaskUpdateInput,
} from '@/lib/validation/task';

import { translatePrismaError } from './prisma-error';

export interface ListTasksOptions {
  /** Restrict to one project. Pass `null` to list only standalone tasks. */
  projectId?: string | null;
  status?: TaskStatus;
  energy?: Energy;
}

/** The fields `rankTasks` needs — a subset of Task, so callers may pass full rows. */
type RankableTask = Pick<Task, 'status' | 'priority' | 'dueDate' | 'energy'>;

/** Active work (TODO / IN_PROGRESS) sorts ahead of finished/blocked work. */
const STATUS_GROUP: Record<TaskStatus, number> = {
  [TaskStatus.TODO]: 0,
  [TaskStatus.IN_PROGRESS]: 0,
  [TaskStatus.DONE]: 1,
  [TaskStatus.BLOCKED]: 1,
};

/** Most important first. */
const PRIORITY_ORDER: Record<Priority, number> = {
  [Priority.CRITICAL]: 0,
  [Priority.HIGH]: 1,
  [Priority.MEDIUM]: 2,
  [Priority.LOW]: 3,
};

/** Final tiebreak: higher energy first. */
const ENERGY_ORDER: Record<Energy, number> = {
  [Energy.HIGH]: 0,
  [Energy.MEDIUM]: 1,
  [Energy.LOW]: 2,
};

/** Sooner due dates first; tasks with no due date sort last. */
function compareDueDate(a: Date | null, b: Date | null): number {
  if (a && b) return a.getTime() - b.getTime();
  if (a) return -1;
  if (b) return 1;
  return 0;
}

/**
 * The single source of truth for the "what should I do now" ordering.
 *
 * Both the dashboard Priorities panel and the productivity page rank tasks
 * through this one function, so the two can never disagree. The order is:
 *
 *   1. active status (TODO / IN_PROGRESS) before DONE / BLOCKED
 *   2. priority CRITICAL → HIGH → MEDIUM → LOW
 *   3. due date sooner first, with no-due-date last
 *   4. energy HIGH → MEDIUM → LOW as the final tiebreak
 *
 * Non-mutating: returns a new, sorted array.
 */
export function rankTasks<T extends RankableTask>(tasks: readonly T[]): T[] {
  return [...tasks].sort((a, b) => {
    const byStatus = STATUS_GROUP[a.status] - STATUS_GROUP[b.status];
    if (byStatus !== 0) return byStatus;

    const byPriority = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    if (byPriority !== 0) return byPriority;

    const byDue = compareDueDate(a.dueDate, b.dueDate);
    if (byDue !== 0) return byDue;

    return ENERGY_ORDER[a.energy] - ENERGY_ORDER[b.energy];
  });
}

/**
 * List tasks, optionally filtered by project / status / energy, returned in
 * the shared default rank order (see {@link rankTasks}). Ranking runs in the
 * application layer because the ordering (active-first, custom priority order,
 * nulls-last dates) does not map cleanly to a single SQL `ORDER BY`.
 */
export async function listTasks(opts: ListTasksOptions = {}): Promise<Task[]> {
  const where: Prisma.TaskWhereInput = {};
  if (opts.projectId !== undefined) where.projectId = opts.projectId;
  if (opts.status !== undefined) where.status = opts.status;
  if (opts.energy !== undefined) where.energy = opts.energy;

  const tasks = await prisma.task.findMany({
    where,
    orderBy: { createdAt: 'asc' },
  });

  return rankTasks(tasks);
}

export async function getTask(id: string): Promise<Task | null> {
  return prisma.task.findUnique({ where: { id } });
}

export async function createTask(input: TaskCreateInput): Promise<Task> {
  const data = taskCreateSchema.parse(input);
  try {
    return await prisma.task.create({ data });
  } catch (err) {
    // A bad projectId surfaces here as a foreign-key error.
    translatePrismaError(err, 'Task not found');
  }
}

export async function updateTask(id: string, input: TaskUpdateInput): Promise<Task> {
  const data = taskUpdateSchema.parse(input);
  try {
    return await prisma.task.update({ where: { id }, data });
  } catch (err) {
    translatePrismaError(err, `Task ${id} not found`);
  }
}

export async function deleteTask(id: string): Promise<void> {
  try {
    await prisma.task.delete({ where: { id } });
  } catch (err) {
    translatePrismaError(err, `Task ${id} not found`);
  }
}

/** Mark a task done. */
export async function completeTask(id: string): Promise<Task> {
  try {
    return await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.DONE },
    });
  } catch (err) {
    translatePrismaError(err, `Task ${id} not found`);
  }
}

/** Reopen a task back to TODO. */
export async function reopen(id: string): Promise<Task> {
  try {
    return await prisma.task.update({
      where: { id },
      data: { status: TaskStatus.TODO },
    });
  } catch (err) {
    translatePrismaError(err, `Task ${id} not found`);
  }
}
