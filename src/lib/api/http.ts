import { NextResponse } from 'next/server';
import { z, ZodError } from 'zod';

import { BadRequestError, NotFoundError } from '@/lib/errors';

const idSchema = z.uuid();

/**
 * Validate a route `[id]` segment as a UUID. Throws {@link BadRequestError}
 * (→ 400) for a malformed id so a bad path never reaches Prisma.
 */
export function parseId(id: string): string {
  const result = idSchema.safeParse(id);
  if (!result.success) {
    throw new BadRequestError('Invalid id');
  }
  return result.data;
}

/**
 * Map an error from the validation/service layer to a JSON response. Route
 * handlers wrap their logic in a try/catch and defer here so every endpoint
 * answers with consistent status codes and shapes.
 *
 * - ZodError                    → 400 with field-level issues
 * - BadRequestError             → 400
 * - NotFoundError               → 404
 * - SyntaxError (bad JSON body) → 400
 * - anything else               → 500 (logged)
 */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: 'ValidationError',
        issues: err.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  if (err instanceof BadRequestError) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  if (err instanceof NotFoundError) {
    return NextResponse.json({ error: err.message }, { status: 404 });
  }

  if (err instanceof SyntaxError) {
    // Thrown by Request.json() when the body is not valid JSON.
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  console.error('Unhandled API error:', err);
  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
