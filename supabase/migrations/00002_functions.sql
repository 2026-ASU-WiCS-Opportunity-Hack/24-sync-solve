-- ============================================================
-- WIAL Platform - Database Functions & Triggers
-- Migration: 00002_functions
-- ============================================================

-- ============================================================
-- UTILITY: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER trg_chapters_updated_at
  BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_coach_profiles_updated_at
  BEFORE UPDATE ON coach_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_pages_updated_at
  BEFORE UPDATE ON pages
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_content_blocks_updated_at
  BEFORE UPDATE ON content_blocks
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER trg_payments_updated_at
  BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ============================================================
-- AUTH: auto-create profile on user signup
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- CONTENT VERSIONING: auto-create version on content_blocks change
-- ============================================================

CREATE OR REPLACE FUNCTION auto_version_content()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  next_version INTEGER;
BEGIN
  -- Only version when content actually changes
  IF OLD.content IS DISTINCT FROM NEW.content OR OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT COALESCE(MAX(version_number), 0) + 1
    INTO next_version
    FROM content_versions
    WHERE content_block_id = NEW.id;

    INSERT INTO content_versions (content_block_id, version_number, content, status, changed_by)
    VALUES (NEW.id, next_version, NEW.content, NEW.status, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_version_content
  AFTER UPDATE ON content_blocks
  FOR EACH ROW EXECUTE FUNCTION auto_version_content();

-- ============================================================
-- RBAC HELPER FUNCTIONS
-- ============================================================

-- Get the current user's role from profiles
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Get the current user's primary chapter_id
CREATE OR REPLACE FUNCTION get_user_chapter_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT chapter_id FROM public.profiles WHERE id = auth.uid();
$$;

-- Check if the current user has a specific role for a chapter
CREATE OR REPLACE FUNCTION user_has_chapter_role(p_chapter_id UUID, p_role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_chapter_roles
    WHERE user_id = auth.uid()
      AND chapter_id = p_chapter_id
      AND role = p_role
  )
  OR (
    -- Chapter leads also have access to their primary chapter
    p_role IN ('chapter_lead', 'content_editor')
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND chapter_id = p_chapter_id
        AND role IN ('super_admin', 'chapter_lead', 'content_editor')
    )
  );
$$;

-- Check if user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT public.get_user_role() = 'super_admin';
$$;

-- Check if user can edit a specific chapter
CREATE OR REPLACE FUNCTION can_edit_chapter(p_chapter_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    public.get_user_role() = 'super_admin'
    OR public.user_has_chapter_role(p_chapter_id, 'chapter_lead')
    OR public.user_has_chapter_role(p_chapter_id, 'content_editor');
$$;

-- ============================================================
-- AUDIT LOG HELPER
-- ============================================================

CREATE OR REPLACE FUNCTION log_audit(
  p_action      TEXT,
  p_entity_type TEXT,
  p_entity_id   UUID,
  p_chapter_id  UUID DEFAULT NULL,
  p_old_value   JSONB DEFAULT NULL,
  p_new_value   JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, entity_type, entity_id, chapter_id, old_value, new_value)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, p_chapter_id, p_old_value, p_new_value);
END;
$$;

-- ============================================================
-- CHAPTER PROVISIONING: create default pages for a new chapter
-- ============================================================

CREATE OR REPLACE FUNCTION provision_chapter_pages(p_chapter_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  page_id UUID;
BEGIN
  -- Homepage
  INSERT INTO public.pages (chapter_id, slug, title, description, sort_order)
  VALUES (p_chapter_id, 'home', 'Home', 'Chapter homepage', 0)
  RETURNING id INTO page_id;

  INSERT INTO public.content_blocks (page_id, block_type, content, sort_order, published_version)
  VALUES (
    page_id,
    'hero',
    '{"headline": "Welcome to Our Chapter", "subheadline": "Action Learning for Transformative Leadership", "cta_text": "Learn More", "cta_href": "/about"}'::jsonb,
    0,
    '{"headline": "Welcome to Our Chapter", "subheadline": "Action Learning for Transformative Leadership", "cta_text": "Learn More", "cta_href": "/about"}'::jsonb
  );

  -- About page
  INSERT INTO public.pages (chapter_id, slug, title, description, sort_order)
  VALUES (p_chapter_id, 'about', 'About', 'About our chapter', 1);

  -- Coaches page
  INSERT INTO public.pages (chapter_id, slug, title, description, sort_order)
  VALUES (p_chapter_id, 'coaches', 'Our Coaches', 'Meet our certified Action Learning coaches', 2);

  -- Events page
  INSERT INTO public.pages (chapter_id, slug, title, description, sort_order)
  VALUES (p_chapter_id, 'events', 'Events', 'Upcoming events and workshops', 3);

  -- Contact page
  INSERT INTO public.pages (chapter_id, slug, title, description, sort_order)
  VALUES (p_chapter_id, 'contact', 'Contact', 'Get in touch with our chapter', 4);

  -- Pay page
  INSERT INTO public.pages (chapter_id, slug, title, description, sort_order)
  VALUES (p_chapter_id, 'pay', 'Dues & Payments', 'Pay certification fees and membership dues', 5);
END;
$$;
