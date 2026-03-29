-- Enable pgvector (safe to run again if already enabled)
CREATE EXTENSION IF NOT EXISTS vector;

-- Journal articles table
CREATE TABLE journal_articles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  authors       TEXT[],
  published_year INT,
  source_url    TEXT,
  pdf_url       TEXT,
  raw_text      TEXT,
  summary       TEXT,
  key_findings  JSONB,           -- [{ finding: string, tags: string[] }]
  relevance_tags TEXT[],
  translations  JSONB,           -- { es: { summary }, pt: { summary }, fr: { summary } }
  embedding     vector(1536),    -- OpenAI text-embedding-3-small
  is_published  BOOLEAN DEFAULT false,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Webinars table
CREATE TABLE webinars (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT,
  presenter       TEXT,
  scheduled_at    TIMESTAMPTZ,
  recording_url   TEXT,
  chapter_id      UUID REFERENCES chapters(id),
  marketing       JSONB,  -- { linkedin_post, email_subject, email_body, content_outline }
  is_published    BOOLEAN DEFAULT false,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);


CREATE INDEX idx_articles_embedding ON journal_articles USING hnsw(embedding vector_cosine_ops);

-- Updated_at triggers
CREATE TRIGGER set_articles_updated_at
  BEFORE UPDATE ON journal_articles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_webinars_updated_at
  BEFORE UPDATE ON webinars
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- RLS
ALTER TABLE journal_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE webinars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_articles" ON journal_articles
  FOR SELECT USING (is_published = true);

CREATE POLICY "public_read_webinars" ON webinars
  FOR SELECT USING (is_published = true);

CREATE POLICY "admin_all_articles" ON journal_articles
  FOR ALL USING (is_super_admin());

CREATE POLICY "admin_all_webinars" ON webinars
  FOR ALL USING (is_super_admin());

-- Storage bucket for PDFs (private - copyrighted content)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('article-pdfs', 'article-pdfs', false, 52428800, ARRAY['application/pdf']);
