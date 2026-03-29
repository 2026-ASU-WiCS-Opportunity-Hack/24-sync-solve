-- ============================================================
-- WIAL Platform - Add client_grid to block_type enum
-- Migration: 00012_add_client_grid_block_type
-- ============================================================
-- The client_grid block type is referenced in the application
-- (registry, schemas, types, editor) but was never added to
-- the PostgreSQL enum. Any attempt to insert or update a
-- content block with block_type = 'client_grid' would throw
-- a constraint violation. This migration resolves that.
--
-- Must run in its own transaction before any DML can reference
-- the new value (PostgreSQL requires ALTER TYPE ADD VALUE to
-- be committed first).
-- ============================================================

ALTER TYPE block_type ADD VALUE IF NOT EXISTS 'client_grid';

-- ============================================================
-- WIAL Platform - Fix rejected block public visibility
-- Migration: 00013_fix_rejected_block_visibility
-- ============================================================
-- When a pending content block is rejected, its status is set
-- to 'rejected' (correct semantic state). However, the
-- existing blocks_public_read RLS policy only allows
-- status = 'published', which would hide the block from
-- the public site — even though the old published content
-- (content column) is still valid and should remain visible.
--
-- Fix: update the public read policy to also allow 'rejected'
-- status, since a rejected block always retains its last
-- approved published content and should continue to display.
-- ============================================================

DROP POLICY IF EXISTS "blocks_public_read" ON content_blocks;

CREATE POLICY "blocks_public_read" ON content_blocks
  FOR SELECT USING (
    is_visible = true
    AND status IN ('published', 'rejected')
    AND EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = content_blocks.page_id
        AND pages.is_published = true
    )
  );

-- ============================================================
-- WIAL Platform - Global Settings Table
-- Migration: 00014_global_settings
-- ============================================================
-- Stores editable template-level text (footer tagline,
-- header subtitle, site-wide announcements) that super admins
-- can modify via the edit mode UI without a code deployment.
--
-- Key convention:
--   footer.tagline          → Footer tagline text
--   header.site_subtitle    → Subtitle shown next to WIAL logo
--                             on global (non-chapter) pages
-- ============================================================

CREATE TABLE global_settings (
  key         TEXT        PRIMARY KEY,
  value       TEXT        NOT NULL DEFAULT '',
  updated_by  UUID        REFERENCES profiles (id) ON DELETE SET NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for public header/footer rendering)
CREATE POLICY "settings_public_read" ON global_settings
  FOR SELECT USING (true);

-- Only super admins can create or modify settings
CREATE POLICY "settings_admin_write" ON global_settings
  FOR ALL USING (is_super_admin());

CREATE TRIGGER trg_global_settings_updated_at
  BEFORE UPDATE ON global_settings
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── Seed defaults ──────────────────────────────────────────────
INSERT INTO global_settings (key, value) VALUES
  ('footer.tagline',       'Transforming leaders through Action Learning'),
  ('header.site_subtitle', 'Action Learning')
ON CONFLICT (key) DO NOTHING;
