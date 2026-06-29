import 'server-only';

import bcrypt from 'bcrypt';

import { env } from '@/lib/env';

/**
 * Passcode verification for the single-user app gate.
 *
 * `APP_PASSCODE` is the plaintext passcode supplied via env. We never store or
 * compare it directly. Instead, at module load we hash it ONCE with bcrypt and
 * keep only the hash in memory. Every `verifyPasscode` call then runs the
 * candidate input through `bcrypt.compare`, which performs a constant-time
 * comparison against that hash — so a wrong guess takes the same time whether
 * it is off by one character or completely different, defeating timing attacks.
 *
 * Memoizing the hash matters for two reasons:
 *  - bcrypt hashing is intentionally slow; doing it per request would add
 *    latency to every unlock attempt.
 *  - A single fixed hash means every comparison costs the same, which is what
 *    keeps the comparison side constant-time in practice.
 */

// Work factor for the one-time hash. 12 is a sensible 2025-era default:
// strong enough to be expensive to brute force, fast enough that the single
// startup hash is imperceptible.
const SALT_ROUNDS = 12;

// Computed exactly once, the first time this module is imported on the server.
const passcodeHash: string = bcrypt.hashSync(env.APP_PASSCODE, SALT_ROUNDS);

/**
 * Returns true when `input` matches the configured passcode.
 *
 * Uses `bcrypt.compare`, which is constant-time with respect to the hash, so it
 * does not leak how close a wrong guess was. An empty or non-string-ish input
 * simply fails the comparison.
 */
export async function verifyPasscode(input: string): Promise<boolean> {
  if (!input) {
    return false;
  }

  return bcrypt.compare(input, passcodeHash);
}
