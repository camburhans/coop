import { NextResponse, type NextRequest } from 'next/server';

import { errorResponse } from '@/lib/api/http';
import { createProject, listProjects } from '@/lib/productivity/projects';
import { projectCreateSchema } from '@/lib/validation/project';

/**
 * GET /api/projects — list projects in the service's default order
 * (active-first, then priority, then most recently updated), each with a task
 * count.
 *
 * Protected by the session proxy (src/proxy.ts): only /unlock, /api/auth/*,
 * and /api/health are public, so this route requires a valid session.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const projects = await listProjects();
    return NextResponse.json(projects);
  } catch (err) {
    return errorResponse(err);
  }
}

/** POST /api/projects — create a project. */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = projectCreateSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const project = await createProject(parsed.data);
    return NextResponse.json(project, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
