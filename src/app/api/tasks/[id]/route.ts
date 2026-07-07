import { NextResponse, type NextRequest } from 'next/server';

import { errorResponse, parseId } from '@/lib/api/http';
import { deleteTask, getTask, updateTask } from '@/lib/productivity/tasks';
import { taskUpdateSchema } from '@/lib/validation/task';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/tasks/[id] — one task, or 404. */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    const task = await getTask(id);
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    return NextResponse.json(task);
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH /api/tasks/[id] — partial update. */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    const body: unknown = await request.json();
    const parsed = taskUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const task = await updateTask(id, parsed.data);
    return NextResponse.json(task);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/tasks/[id] — delete the task. */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    await deleteTask(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
