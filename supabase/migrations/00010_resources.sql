-- ============================================================
-- WIAL Platform - Resources Feature
-- Migration: 00010_resources
-- ============================================================
-- Adds a resources table for videos, articles, PDFs, and links.
-- RLS: published resources visible to all; management requires
-- editorial role (super_admin, content_editor, or chapter_lead
-- for chapter-scoped resources).
-- ============================================================

-- ── Resource type enum ────────────────────────────────────────

CREATE TYPE resource_type AS ENUM ('video', 'article', 'pdf', 'link');

-- ── Helper: check if the current user can manage resources ────

CREATE OR REPLACE FUNCTION can_manage_resource(resource_chapter_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN FALSE; END IF;

  -- Super admin can manage any resource
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND NOT COALESCE(is_suspended, false)
  ) THEN
    RETURN TRUE;
  END IF;

  -- Global resource (chapter_id IS NULL): global content_editor or chapter_lead
  IF resource_chapter_id IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('content_editor', 'chapter_lead')
        AND NOT COALESCE(is_suspended, false)
    );
  END IF;

  -- Chapter resource: must have chapter role in user_chapter_roles
  RETURN EXISTS (
    SELECT 1 FROM user_chapter_roles
    WHERE user_id  = auth.uid()
      AND chapter_id = resource_chapter_id
      AND role IN ('chapter_lead', 'content_editor')
      AND is_active = true
  );
END;
$$;

-- ── Resources table ───────────────────────────────────────────

CREATE TABLE resources (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id    UUID          REFERENCES chapters(id) ON DELETE CASCADE,
  title         TEXT          NOT NULL CHECK (length(trim(title)) > 0),
  description   TEXT,
  type          resource_type NOT NULL,
  url           TEXT          NOT NULL CHECK (length(trim(url)) > 0),
  thumbnail_url TEXT,
  category      TEXT,
  tags          TEXT[]        NOT NULL DEFAULT '{}',
  is_published  BOOLEAN       NOT NULL DEFAULT true,
  sort_order    INTEGER       NOT NULL DEFAULT 0,
  created_by    UUID          REFERENCES profiles(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- ── Indexes ───────────────────────────────────────────────────

CREATE INDEX resources_chapter_id_idx ON resources (chapter_id);
CREATE INDEX resources_type_idx        ON resources (type);
CREATE INDEX resources_is_published_idx ON resources (is_published);
CREATE INDEX resources_sort_order_idx  ON resources (sort_order, created_at DESC);

-- ── updated_at trigger ────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER resources_updated_at
  BEFORE UPDATE ON resources
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Row Level Security ────────────────────────────────────────

ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Read: published resources are public; unpublished only to editors
CREATE POLICY "resources_select" ON resources FOR SELECT USING (
  is_published = true
  OR can_manage_resource(chapter_id)
);

-- Insert/Update/Delete: editorial roles only
CREATE POLICY "resources_insert" ON resources FOR INSERT
  WITH CHECK (can_manage_resource(chapter_id));

CREATE POLICY "resources_update" ON resources FOR UPDATE
  USING (can_manage_resource(chapter_id))
  WITH CHECK (can_manage_resource(chapter_id));

CREATE POLICY "resources_delete" ON resources FOR DELETE
  USING (can_manage_resource(chapter_id));
