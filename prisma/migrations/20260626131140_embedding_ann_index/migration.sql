-- Approximate-nearest-neighbor index for pgvector cosine similarity search.
-- Prisma cannot natively express ivfflat/hnsw indexes, so this is added by
-- raw SQL. ivfflat is fine for V1's scale; hnsw is an option later.
CREATE INDEX IF NOT EXISTS embedding_vector_ivfflat
  ON "Embedding"
  USING ivfflat (vector vector_cosine_ops)
  WITH (lists = 100);
