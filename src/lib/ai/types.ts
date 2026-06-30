/**
 * Provider-agnostic AI interface (Sprint 1 scaffold).
 *
 * Every AI call in C.O.O.P. flows through the {@link AIProvider} interface so
 * the concrete provider (Gemini Flash by default, per the architecture) sits
 * behind a single seam. Swapping providers — or routing harder queries to a
 * stronger model later — is a config change, never a rewrite (principle #7:
 * swap-ability over lock-in).
 *
 * These are pure type declarations with no runtime side effects, so this file
 * intentionally omits the 'server-only' guard: it is safe to import the shapes
 * anywhere. The concrete implementations (stub now, real provider in Sprint 4)
 * are the server-only modules.
 */

/** A request to turn a single piece of text into an embedding vector. */
export interface EmbedRequest {
  text: string;
}

/** The embedding produced for an {@link EmbedRequest}. */
export interface EmbedResponse {
  vector: number[];
  model: string;
}

/** A request for a grounded completion. */
export interface CompleteRequest {
  prompt: string;
  /** Grounding chunks from RAG retrieval (top pgvector matches). */
  context?: string[];
  /** Optional system instruction shaping the response. */
  system?: string;
}

/** The text produced for a {@link CompleteRequest}. */
export interface CompleteResponse {
  text: string;
  model: string;
}

/**
 * The single seam every AI call goes through: `embed` for semantic search /
 * memory, `complete` for grounded responses. Concrete providers implement
 * this; callers depend only on the interface.
 */
export interface AIProvider {
  embed(req: EmbedRequest): Promise<EmbedResponse>;
  complete(req: CompleteRequest): Promise<CompleteResponse>;
}
