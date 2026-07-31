import 'server-only';

import { Prisma } from '@prisma/client';

import { BadRequestError, NotFoundError } from '@/lib/errors';

/**
 * Translate a Prisma write error into a domain error the HTTP layer
 * understands, or rethrow anything unrecognised. This never returns — it
 * always throws — so it can be called from a service `catch` block and
 * TypeScript will treat the block as terminating.
 *
 * Mirrors src/lib/productivity/prisma-error.ts (kept feature-local rather than
 * cross-imported, per the "no deep imports across feature boundaries"
 * convention).
 *
 * - P2025 (an operation depended on a record that was not found) → NotFoundError
 * - P2003 (foreign-key constraint failed, e.g. a bad accountId)  → BadRequestError
 */
export function translatePrismaError(err: unknown, notFoundMessage: string): never {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2025') {
      throw new NotFoundError(notFoundMessage);
    }
    if (err.code === 'P2003') {
      throw new BadRequestError('Referenced record does not exist');
    }
  }
  throw err;
}
