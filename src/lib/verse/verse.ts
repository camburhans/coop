import 'server-only';

import type { Verse } from '@prisma/client';

import { prisma } from '@/lib/db/client';
import { verseSetSchema, type VerseSetInput } from '@/lib/validation/verse';

/**
 * Scripture service — the current-verse source of truth.
 *
 * The dashboard's Scripture panel reads {@link getCurrentVerse} in an RSC; the
 * "Set verse" affordance writes through the Route Handler to
 * {@link setCurrentVerse}. Memorization / recall logic is intentionally absent
 * here (that is the owner's later method, Architecture §4) — this only tracks
 * which single verse is currently on the board.
 */

/** The verse flagged `is_current`, or `null` when none is set. */
export async function getCurrentVerse(): Promise<Verse | null> {
  return prisma.verse.findFirst({
    where: { isCurrent: true },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Make `{ reference, text }` the current verse.
 *
 * Runs in a transaction that first clears `is_current` on every other row, then
 * creates the new verse already flagged current — so the "exactly one current"
 * invariant (Architecture §4) is enforced here, in one atomic write, rather
 * than trusted to callers. Returns the newly created current verse.
 */
export async function setCurrentVerse(input: VerseSetInput): Promise<Verse> {
  const data = verseSetSchema.parse(input);

  return prisma.$transaction(async (tx) => {
    await tx.verse.updateMany({
      where: { isCurrent: true },
      data: { isCurrent: false },
    });

    return tx.verse.create({
      data: { reference: data.reference, text: data.text, isCurrent: true },
    });
  });
}
