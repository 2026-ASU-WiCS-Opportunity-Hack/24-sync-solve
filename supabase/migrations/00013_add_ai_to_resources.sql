-- ============================================================
-- WIAL Platform - Add AI Capabilities to Resources
-- Migration: 00013_add_ai_to_resources
-- ============================================================
-- Enhances the `resources` table with the AI capabilities
-- previously only available to `journal_articles`.
-- Adds vector embeddings, summaries, key findings, etc.
-- ============================================================

-- 1. Add AI Columns to `resources`
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS raw_text TEXT,
ADD COLUMN IF NOT EXISTS summary TEXT,
ADD COLUMN IF NOT EXISTS key_findings JSONB,
ADD COLUMN IF NOT EXISTS relevance_tags TEXT[],
ADD COLUMN IF NOT EXISTS translations JSONB,
ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- 2. Create HNSW Index for semantic search on the resources table
CREATE INDEX IF NOT EXISTS idx_resources_embedding 
  ON resources USING hnsw(embedding vector_cosine_ops);

-- 3. Create the semantic search RPC function for resources
CREATE OR REPLACE FUNCTION search_resources (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type resource_type,
  url text,
  tags text[],
  summary text,
  key_findings jsonb,
  translations jsonb,
  similarity float
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.title,
    r.description,
    r.type,
    r.url,
    r.tags,
    r.summary,
    r.key_findings,
    r.translations,
    1 - (r.embedding <=> query_embedding) AS similarity
  FROM resources r
  WHERE r.is_published = true
    AND 1 - (r.embedding <=> query_embedding) > match_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
