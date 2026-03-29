-- ============================================================
-- STEP 1: RUN THIS LINE ALONE FIRST
-- ============================================================
ALTER TYPE resource_type ADD VALUE IF NOT EXISTS 'webinar';
-- ============================================================


-- ============================================================
-- STEP 2: RUN THE REST OF THIS SCRIPT AFTER STEP 1 IS COMMITTED
-- ============================================================

-- 2. Add content-specific columns to resources table
ALTER TABLE resources 
ADD COLUMN IF NOT EXISTS authors TEXT[],
ADD COLUMN IF NOT EXISTS published_year INTEGER,
ADD COLUMN IF NOT EXISTS presenter TEXT,
ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS marketing JSONB;

-- 3. Migrate data from journal_articles to resources
INSERT INTO resources (
  title, 
  description, 
  type, 
  url, 
  raw_text, 
  summary, 
  key_findings, 
  relevance_tags, 
  translations, 
  embedding, 
  authors, 
  published_year, 
  is_published,
  created_at
)
SELECT 
  title, 
  summary as description, 
  'article'::resource_type, 
  COALESCE(NULLIF(pdf_url, ''), NULLIF(source_url, ''), 'https://wial.org/resource/' || id), 
  raw_text, 
  summary, 
  key_findings, 
  relevance_tags, 
  translations, 
  embedding, 
  authors, 
  published_year, 
  is_published,
  created_at
FROM journal_articles
ON CONFLICT DO NOTHING;

-- 4. Migrate data from webinars to resources
INSERT INTO resources (
  title, 
  description, 
  type, 
  url, 
  presenter, 
  scheduled_at, 
  marketing, 
  chapter_id, 
  is_published,
  created_at
)
SELECT 
  title, 
  description, 
  'webinar'::resource_type, 
  COALESCE(NULLIF(recording_url, ''), 'https://wial.org/webinar/' || id), 
  presenter, 
  scheduled_at, 
  marketing, 
  chapter_id, 
  is_published,
  created_at
FROM webinars
ON CONFLICT DO NOTHING;

-- 5. Update the search_resources function to include new fields
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
  authors text[],
  presenter text,
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
    r.authors,
    r.presenter,
    1 - (r.embedding <=> query_embedding) AS similarity
  FROM resources r
  WHERE r.is_published = true
    AND 1 - (r.embedding <=> query_embedding) > match_threshold
  ORDER BY r.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
