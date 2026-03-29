-- Semantic search function for journal articles using pgvector cosine similarity
CREATE OR REPLACE FUNCTION search_articles(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count     int   DEFAULT 5
)
RETURNS TABLE (
  id             uuid,
  title          text,
  summary        text,
  relevance_tags text[],
  translations   jsonb,
  published_year int,
  similarity     float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ja.id,
    ja.title,
    ja.summary,
    ja.relevance_tags,
    ja.translations,
    ja.published_year,
    1 - (ja.embedding <=> query_embedding) AS similarity
  FROM journal_articles ja
  WHERE ja.is_published = true
    AND 1 - (ja.embedding <=> query_embedding) > match_threshold
  ORDER BY ja.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
