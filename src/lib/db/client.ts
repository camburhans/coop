import 'server-only';

import { PrismaClient } from '@prisma/client';

/**
 * Prisma client singleton.
 *
 * In development, Next.js hot-reload re-evaluates modules on every change. A
 * fresh `new PrismaClient()` per reload would exhaust the database connection
 * pool, so the instance is cached on `globalThis`. In production a single
 * fresh instance is created for the process lifetime.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
