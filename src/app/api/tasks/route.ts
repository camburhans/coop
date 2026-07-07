import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

import { Energy, TaskStatus } from '@prisma/client';

import { errorResponse } from '@/lib/api/http';
import { createTask, listTasks } from '@/lib/productivity/tasks';
import { taskCreateSchema } from '@/lib/validation/task';

/** Query params for GET /api/tasks — all optional filters. */
const listQuerySchema = z.object({
  projectId: z.uuid().optional(),
  status: z.enum(TaskStatus).optional(),
  energy: z.enum(Energy).optional(),
});

/**
 * GET /api/tasks?projectId=&status=&energy= — list tasks in the shared default
 * rank order, optionally filtered.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = request.nextUrl;
    const parsed = listQuerySchema.safeParse({
      projectId: searchParams.get('projectId') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      energy: searchParams.get('energy') ?? undefined,
    });
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const tasks = await listTasks(parsed.data);
    return NextResponse.json(tasks);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/tasks — create a task (standalone or attached to a project). */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = taskCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const task = await createTask(parsed.data);
    return NextResponse.json(task, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
