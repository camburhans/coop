import 'server-only';

import { env } from '@/lib/env';

import { StubProvider } from '@/lib/ai/providers/stub';
import type { AIProvider } from '@/lib/ai/types';

/**
 * Provider factory — the single place that decides which concrete
 * {@link AIProvider} the rest of the app talks to.
 *
 * Sprint 1 always resolves to {@link StubProvider}: the seam exists and
 * type-checks everywhere, but no real embedding/completion logic and no
 * network calls happen yet. `AI_API_KEY` is optional in Sprint 1 (see
 * `lib/env.ts`); we branch on it now only to lock in the shape of the
 * Sprint 4 swap.
 *
 * Sprint 4 will create `src/lib/ai/providers/gemini.ts` (a real
 * `GeminiProvider implements AIProvider`) and return it from the configured
 * branch below — a config change at this one seam, never a rewrite of callers.
 */
function createProvider(): AIProvider {
  if (!env.AI_API_KEY) {
    // No key configured: stay fully offline with the stub.
    return new StubProvider();
  }

  // Key present, but real providers are out of scope until Sprint 4.
  // TODO(Sprint 4): import and return `new GeminiProvider(env.AI_API_KEY)`
  // from `src/lib/ai/providers/gemini.ts` instead of the stub.
  return new StubProvider();
}

/** The app-wide AI provider. Import this; never construct providers directly. */
export const ai: AIProvider = createProvider();

export type {
  AIProvider,
  CompleteRequest,
  CompleteResponse,
  EmbedRequest,
  EmbedResponse,
} from '@/lib/ai/types';
