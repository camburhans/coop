import { NextResponse, type NextRequest } from 'next/server';

import { errorResponse } from '@/lib/api/http';
import { verseSetSchema } from '@/lib/validation/verse';
import { getCurrentVerse, setCurrentVerse } from '@/lib/verse/verse';

/**
 * GET /api/verse/current — the current verse, or `null` when none is set.
 *
 * (The dashboard reads the verse directly through the service in its RSC; this
 * handler exists for parity and for clients of the set affordance.)
 */
export async function GET(): Promise<NextResponse> {
  try {
    const verse = await getCurrentVerse();
    return NextResponse.json(verse);
  } catch (err) {
    return errorResponse(err);
  }
}

/** PUT /api/verse/current — set `{ reference, text }` as the one current verse. */
export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = verseSetSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(parsed.error);
    }
    const verse = await setCurrentVerse(parsed.data);
    return NextResponse.json(verse);
  } catch (err) {
    return errorResponse(err);
  }
}
