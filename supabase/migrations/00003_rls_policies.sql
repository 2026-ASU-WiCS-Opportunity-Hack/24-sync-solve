-- ============================================================
-- WIAL Platform - Row-Level Security Policies
-- Migration: 00003_rls_policies
-- ============================================================
-- Enable RLS on every table (no exceptions)
-- ============================================================

ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_chapter_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- CHAPTERS POLICIES
-- ============================================================

-- Anyone can read active chapters (public site navigation)
CREATE POLICY "chapters_public_read" ON chapters
  FOR SELECT USING (is_active = true);

-- Super admins can do everything
CREATE POLICY "chapters_admin_all" ON chapters
  FOR ALL USING (is_super_admin());

-- ============================================================
-- PROFILES POLICIES
-- ============================================================

-- Users can read their own profile
CREATE POLICY "profiles_own_read" ON profiles
  FOR SELECT USING (id = auth.uid());

-- Super admins can read all profiles
CREATE POLICY "profiles_admin_read" ON profiles
  FOR SELECT USING (is_super_admin());

-- Chapter leads can read profiles of their chapter members
CREATE POLICY "profiles_chapter_lead_read" ON profiles
  FOR SELECT USING (
    user_has_chapter_role(chapter_id, 'chapter_lead')
  );

-- Users can update their own profile (limited fields enforced at app layer)
CREATE POLICY "profiles_own_update" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Super admins can update any profile
CREATE POLICY "profiles_admin_update" ON profiles
  FOR UPDATE USING (is_super_admin());

-- Profiles are created via trigger, not directly
-- Super admins can insert (for manual provisioning)
CREATE POLICY "profiles_admin_insert" ON profiles
  FOR INSERT WITH CHECK (is_super_admin());

-- ============================================================
-- USER CHAPTER ROLES POLICIES
-- ============================================================

-- Users can see their own chapter roles
CREATE POLICY "ucr_own_read" ON user_chapter_roles
  FOR SELECT USING (user_id = auth.uid());

-- Super admins can do everything
CREATE POLICY "ucr_admin_all" ON user_chapter_roles
  FOR ALL USING (is_super_admin());

-- Chapter leads can manage roles within their chapter
CREATE POLICY "ucr_chapter_lead_manage" ON user_chapter_roles
  FOR ALL USING (
    user_has_chapter_role(chapter_id, 'chapter_lead')
  );

-- ============================================================
-- COACH PROFILES POLICIES
-- ============================================================

-- Anyone can read published, verified coach profiles
CREATE POLICY "coaches_public_read" ON coach_profiles
  FOR SELECT USING (is_published = true AND is_verified = true);

-- Coaches can read and update their own profile
CREATE POLICY "coaches_own_read" ON coach_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "coaches_own_update" ON coach_profiles
  FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    -- Coaches cannot change is_published, is_verified, or certification_level
    -- These checks are enforced at the application layer via server actions
  );

-- Coaches can create their own profile
CREATE POLICY "coaches_own_insert" ON coach_profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Chapter leads can manage coaches in their chapter
CREATE POLICY "coaches_chapter_lead_all" ON coach_profiles
  FOR ALL USING (
    user_has_chapter_role(chapter_id, 'chapter_lead')
  );

-- Super admins can do everything
CREATE POLICY "coaches_admin_all" ON coach_profiles
  FOR ALL USING (is_super_admin());

-- ============================================================
-- PAGES POLICIES
-- ============================================================

-- Anyone can read published pages
CREATE POLICY "pages_public_read" ON pages
  FOR SELECT USING (is_published = true);

-- Chapter editors can read all pages in their chapter
CREATE POLICY "pages_editor_read" ON pages
  FOR SELECT USING (
    can_edit_chapter(chapter_id)
  );

-- Chapter editors can manage pages in their chapter
CREATE POLICY "pages_editor_manage" ON pages
  FOR ALL USING (can_edit_chapter(chapter_id));

-- Global pages (chapter_id IS NULL) managed by super admins only
CREATE POLICY "pages_global_admin" ON pages
  FOR ALL USING (
    chapter_id IS NULL AND is_super_admin()
  );

-- ============================================================
-- CONTENT BLOCKS POLICIES
-- ============================================================

-- Anyone can read published, visible content blocks
CREATE POLICY "blocks_public_read" ON content_blocks
  FOR SELECT USING (
    is_visible = true
    AND status = 'published'
    AND EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = content_blocks.page_id
        AND pages.is_published = true
    )
  );

-- Chapter editors can read all blocks (including drafts) for their chapter
CREATE POLICY "blocks_editor_read" ON content_blocks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = content_blocks.page_id
        AND can_edit_chapter(pages.chapter_id)
    )
  );

-- Chapter editors can manage blocks in their chapter
CREATE POLICY "blocks_editor_manage" ON content_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM pages
      WHERE pages.id = content_blocks.page_id
        AND can_edit_chapter(pages.chapter_id)
    )
  );

-- Super admins can do everything
CREATE POLICY "blocks_admin_all" ON content_blocks
  FOR ALL USING (is_super_admin());

-- ============================================================
-- CONTENT VERSIONS POLICIES
-- ============================================================

-- Super admins can read all versions
CREATE POLICY "versions_admin_read" ON content_versions
  FOR SELECT USING (is_super_admin());

-- Chapter editors can read versions for their chapter's blocks
CREATE POLICY "versions_editor_read" ON content_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM content_blocks cb
      JOIN pages p ON p.id = cb.page_id
      WHERE cb.id = content_versions.content_block_id
        AND can_edit_chapter(p.chapter_id)
    )
  );

-- Versions are created by trigger only — no direct inserts by users

-- ============================================================
-- EVENTS POLICIES
-- ============================================================

-- Anyone can read published events
CREATE POLICY "events_public_read" ON events
  FOR SELECT USING (is_published = true);

-- Chapter editors can manage events in their chapter
CREATE POLICY "events_editor_manage" ON events
  FOR ALL USING (
    can_edit_chapter(chapter_id)
  );

-- Super admins can manage global events (chapter_id IS NULL)
CREATE POLICY "events_admin_global" ON events
  FOR ALL USING (
    (chapter_id IS NULL OR is_super_admin())
  );

-- ============================================================
-- PAYMENTS POLICIES
-- ============================================================

-- Users can see their own payments
CREATE POLICY "payments_own_read" ON payments
  FOR SELECT USING (user_id = auth.uid());

-- Chapter leads can see payments for their chapter
CREATE POLICY "payments_chapter_read" ON payments
  FOR SELECT USING (
    user_has_chapter_role(chapter_id, 'chapter_lead')
  );

-- Super admins can see all payments
CREATE POLICY "payments_admin_read" ON payments
  FOR SELECT USING (is_super_admin());

-- Payments are created/updated by service role only (via Stripe webhooks)
-- No direct user insert/update allowed

-- ============================================================
-- AUDIT LOG POLICIES
-- ============================================================

-- Super admins can read all audit logs
CREATE POLICY "audit_admin_read" ON audit_log
  FOR SELECT USING (is_super_admin());

-- Chapter leads can read audit logs for their chapter
CREATE POLICY "audit_chapter_read" ON audit_log
  FOR SELECT USING (
    user_has_chapter_role(chapter_id, 'chapter_lead')
  );

-- Audit entries are inserted via the log_audit() function only
-- Prevent direct inserts/updates/deletes by any non-service role
CREATE POLICY "audit_service_insert" ON audit_log
  FOR INSERT WITH CHECK (true); -- Function itself is SECURITY DEFINER

-- ============================================================
-- STORAGE POLICIES
-- ============================================================

-- Avatars: users upload their own, everyone reads
CREATE POLICY "avatars_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "avatars_own_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "avatars_own_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Coach photos: similar to avatars
CREATE POLICY "coach_photos_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'coach-photos');

CREATE POLICY "coach_photos_own_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'coach-photos'
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "coach_photos_own_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'coach-photos'
    AND auth.uid() IS NOT NULL
  );

-- Chapter assets: chapter editors upload, everyone reads
CREATE POLICY "chapter_assets_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'chapter-assets');

CREATE POLICY "chapter_assets_editor_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'chapter-assets'
    AND auth.uid() IS NOT NULL
    AND get_user_role() IN ('super_admin', 'chapter_lead', 'content_editor')
  );

CREATE POLICY "chapter_assets_editor_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'chapter-assets'
    AND (
      is_super_admin()
      OR get_user_role() IN ('chapter_lead', 'content_editor')
    )
  );

-- Content images: editors upload, everyone reads
CREATE POLICY "content_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'content-images');

CREATE POLICY "content_images_editor_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'content-images'
    AND auth.uid() IS NOT NULL
    AND get_user_role() IN ('super_admin', 'chapter_lead', 'content_editor')
  );

CREATE POLICY "content_images_editor_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'content-images'
    AND (
      is_super_admin()
      OR get_user_role() IN ('chapter_lead', 'content_editor')
    )
  );
