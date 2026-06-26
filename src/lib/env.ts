import 'server-only';

import { z } from 'zod';

/**
 * Validated environment loader.
 *
 * The same loader serves BOTH environments — which env file is loaded
 * (.env for dev, docker/.env for prod) determines the values. The loader
 * does not care which environment it is running in; it only enforces shape.
 *
 * Importing this module on the client is prevented by 'server-only' above.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  APP_PASSCODE: z.string().min(8, 'APP_PASSCODE must be at least 8 characters'),
  SESSION_SECRET: z.string().min(32, 'SESSION_SECRET must be at least 32 characters'),
  // Optional in Sprint 1 — not used until Sprint 4 (AI layer).
  AI_API_KEY: z.string().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
  throw new Error(`Invalid environment variables:\n${issues}`);
}

export const env = parsed.data;
