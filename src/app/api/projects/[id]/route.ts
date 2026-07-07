import { NextResponse, type NextRequest } from 'next/server';

import { errorResponse, parseId } from '@/lib/api/http';
import { deleteProject, getProject, updateProject } from '@/lib/productivity/projects';
import { projectUpdateSchema } from '@/lib/validation/project';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** GET /api/projects/[id] — one project with its task count, or 404. */
export async function GET(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    return NextResponse.json(project);
  } catch (err) {
    return errorResponse(err);
  }
}

/** PATCH /api/projects/[id] — partial update. */
export async function PATCH(request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    const body: unknown = await request.json();
    const parsed = projectUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const project = await updateProject(id, parsed.data);
    return NextResponse.json(project);
  } catch (err) {
    return errorResponse(err);
  }
}

/** DELETE /api/projects/[id] — delete the project; its tasks are orphaned (projectId → null). */
export async function DELETE(_request: NextRequest, { params }: RouteContext): Promise<NextResponse> {
  try {
    const id = parseId((await params).id);
    await deleteProject(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
