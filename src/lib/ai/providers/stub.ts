import 'server-only';

import type {
  AIProvider,
  CompleteRequest,
  CompleteResponse,
  EmbedRequest,
  EmbedResponse,
} from '@/lib/ai/types';

/**
 * No-op AI provider for Sprint 1.
 *
 * The AI layer is not wired until Sprint 4. Until then the factory hands back
 * this stub so the provider seam exists and type-checks across the codebase,
 * but any actual call fails loudly with a documented error rather than silently
 * returning fake data or attempting a network request. This keeps the
 * architecture's "no real AI until Sprint 4" boundary honest at runtime.
 */
export class StubProvider implements AIProvider {
  async embed(_req: EmbedRequest): Promise<EmbedResponse> {
    throw new Error('AI not configured — Sprint 4');
  }

  async complete(_req: CompleteRequest): Promise<CompleteResponse> {
    throw new Error('AI not configured — Sprint 4');
  }
}
