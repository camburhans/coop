import 'server-only';

/**
 * Tiny in-memory rate limiter for failed unlock attempts.
 *
 * Scope is deliberately minimal: this app is single-user and single-instance
 * (one Next process on the Mac mini behind Tailscale). A process-local Map is
 * therefore sufficient — there is no second instance to coordinate with, and
 * losing the counters on restart is acceptable. If C.O.O.P. ever runs
 * multi-instance, this would move to a shared store (e.g. Redis).
 *
 * Policy: at most MAX_FAILED failed attempts per WINDOW_MS, per key (IP).
 * Once the limit is hit, the key stays blocked until the window elapses.
 */

const MAX_FAILED = 5;
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes

type Bucket = {
  count: number;
  // Epoch ms when the current window started; the window expires WINDOW_MS later.
  windowStart: number;
};

// Cache the Map on globalThis so Next.js hot-reload in dev does not reset the
// counters on every code change (mirrors the Prisma client singleton pattern).
const globalForRateLimit = globalThis as unknown as {
  unlockAttempts: Map<string, Bucket> | undefined;
};

const attempts: Map<string, Bucket> = globalForRateLimit.unlockAttempts ?? new Map();

if (!globalForRateLimit.unlockAttempts) {
  globalForRateLimit.unlockAttempts = attempts;
}

/** Returns the live bucket for `key`, resetting it if its window has expired. */
function currentBucket(key: string, now: number): Bucket {
  const existing = attempts.get(key);
  if (!existing || now - existing.windowStart > WINDOW_MS) {
    const fresh: Bucket = { count: 0, windowStart: now };
    attempts.set(key, fresh);
    return fresh;
  }
  return existing;
}

/**
 * True when `key` has already used up its allowance and is still inside the
 * block window. Call this BEFORE verifying the passcode.
 */
export function isRateLimited(key: string, now: number = Date.now()): boolean {
  const bucket = currentBucket(key, now);
  return bucket.count >= MAX_FAILED;
}

/** Records one failed attempt for `key` within the current window. */
export function recordFailedAttempt(key: string, now: number = Date.now()): void {
  const bucket = currentBucket(key, now);
  bucket.count += 1;
}

/** Clears the counter for `key` — called after a successful unlock. */
export function resetAttempts(key: string): void {
  attempts.delete(key);
}

/**
 * Seconds remaining until `key`'s window resets. Useful for a Retry-After
 * header on 429 responses.
 */
export function retryAfterSeconds(key: string, now: number = Date.now()): number {
  const bucket = attempts.get(key);
  if (!bucket) {
    return 0;
  }
  const remainingMs = Math.max(0, bucket.windowStart + WINDOW_MS - now);
  return Math.ceil(remainingMs / 1000);
}
