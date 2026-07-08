import { z } from 'zod';

/**
 * Zod schema for setting the current verse.
 *
 * The Scripture panel's "Set verse" affordance PUTs a free-text reference and
 * passage; both are required and length-bounded so a stray paste can't fill the
 * column. `reference` is a short citation ("Proverbs 3:5–6"); `text` is the
 * passage itself. Trimmed on the way in.
 */
export const verseSetSchema = z.object({
  reference: z.string().trim().min(1, 'reference is required').max(120),
  text: z.string().trim().min(1, 'text is required').max(1000),
});

export type VerseSetInput = z.input<typeof verseSetSchema>;
