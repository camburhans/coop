import 'server-only';

import { Prisma, Priority, ProjectStatus, type Project } from '@prisma/client';

import { prisma } from '@/lib/db/client';
import {
  projectCreateSchema,
  projectUpdateSchema,
  type ProjectCreateInput,
  type ProjectUpdateInput,
} from '@/lib/validation/project';

import { translatePrismaError } from './prisma-error';

/** A project row plus a count of its tasks. */
export type ProjectWithTaskCount = Prisma.ProjectGetPayload<{
  include: { _count: { select: { tasks: true } } };
}>;

/** ACTIVE projects rank ahead of everything else (paused/done/archived). */
function activeRank(status: ProjectStatus): number {
  return status === ProjectStatus.ACTIVE ? 0 : 1;
}

/** Most important first. */
const PRIORITY_ORDER: Record<Priority, number> = {
  [Priority.CRITICAL]: 0,
  [Priority.HIGH]: 1,
  [Priority.MEDIUM]: 2,
  [Priority.LOW]: 3,
};

/**
 * List projects ordered active-first, then priority (critical → low), then
 * most-recently-updated. The database returns rows already sorted by
 * `updatedAt` desc; a stable sort then applies the active/priority keys,
 * leaving `updatedAt` desc as the final tiebreak. Each row carries
 * `_count.tasks`.
 */
export async function listProjects(): Promise<ProjectWithTaskCount[]> {
  const projects = await prisma.project.findMany({
    include: { _count: { select: { tasks: true } } },
    orderBy: { updatedAt: 'desc' },
  });

  return [...projects].sort((a, b) => {
    const byActive = activeRank(a.status) - activeRank(b.status);
    if (byActive !== 0) return byActive;
    return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    // Ties fall through to the DB's updatedAt-desc order (stable sort).
  });
}

export async function getProject(id: string): Promise<ProjectWithTaskCount | null> {
  return prisma.project.findUnique({
    where: { id },
    include: { _count: { select: { tasks: true } } },
  });
}

export async function createProject(input: ProjectCreateInput): Promise<Project> {
  const data = projectCreateSchema.parse(input);
  return prisma.project.create({ data });
}

export async function updateProject(
  id: string,
  input: ProjectUpdateInput,
): Promise<Project> {
  const data = projectUpdateSchema.parse(input);
  try {
    return await prisma.project.update({ where: { id }, data });
  } catch (err) {
    translatePrismaError(err, `Project ${id} not found`);
  }
}

/**
 * Delete a project and orphan its tasks: child tasks are set to
 * `projectId = null` rather than cascade-deleted, so standalone work survives
 * the project it once belonged to. Done in a transaction so a task is never
 * left pointing at a project that no longer exists.
 */
export async function deleteProject(id: string): Promise<void> {
  try {
    await prisma.$transaction([
      prisma.task.updateMany({
        where: { projectId: id },
        data: { projectId: null },
      }),
      prisma.project.delete({ where: { id } }),
    ]);
  } catch (err) {
    translatePrismaError(err, `Project ${id} not found`);
  }
}
