-- ============================================================
-- Migration 00007: RBAC & Suspension System
-- ============================================================
-- Depends on 00006 (adds 'user' enum value — must be committed first)
-- Implements:
--   1A. Migrate 'public' → 'user' + block future 'public' usage
--   1B. Suspension columns on profiles
--   1C. Active/suspension on user_chapter_roles
--   1D. Membership status on profiles
--   1E. Chapter requests table
--   1F. Coach applications table + RLS
--   1G. Coach visibility suspension + credly on coach_profiles
--   1H. New helper functions
--   1I. Update existing DB functions for suspension awareness
-- ============================================================

-- ── 1A. Migrate 'public' → 'user' and block future 'public' usage ───────────

UPDATE profiles SET role = 'user' WHERE role = 'public';
UPDATE user_chapter_roles SET role = 'user' WHERE role = 'public';

-- Block future 'public' usage via CHECK constraints
ALTER TABLE profiles
  ADD CONSTRAINT profiles_role_no_public CHECK (role != 'public');

ALTER TABLE user_chapter_roles
  ADD CONSTRAINT ucr_role_no_public CHECK (role != 'public');

-- New default for new user creation
ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user';

-- ── 1B. Suspension columns on profiles ──────────────────────────────────────

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_suspended        boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS suspended_at        timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason   text;

CREATE INDEX IF NOT EXISTS idx_profiles_suspended
  ON profiles (is_suspended) WHERE is_suspended = true;

-- ── 1C. Active/suspension on user_chapter_roles ────────────────────────────

ALTER TABLE user_chapter_roles
  ADD COLUMN IF NOT EXISTS is_active           boolean   NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS suspended_at        timestamptz,
  ADD COLUMN IF NOT EXISTS suspended_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS suspension_reason   text;

CREATE INDEX IF NOT EXISTS idx_ucr_active
  ON user_chapter_roles (is_active) WHERE is_active = true;

-- ── 1D. Membership status on profiles ───────────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_status') THEN
    CREATE TYPE membership_status AS ENUM ('none', 'active', 'expired');
  END IF;
END $$;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS membership_status      membership_status NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS membership_expires_at  timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_membership
  ON profiles (membership_status);

-- ── 1E. Chapter requests table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chapter_requests (
  id              uuid        PRIMARY KEY DEFAULT uuid_generate_v4(),
  requested_by    uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  slug            text        NOT NULL,
  name            text        NOT NULL,
  country_code    char(2)     NOT NULL,
  timezone        text        NOT NULL DEFAULT 'UTC',
  currency        char(3)     NOT NULL DEFAULT 'USD',
  accent_color    text        NOT NULL DEFAULT '#CC0000',
  contact_email   text,
  message         text,
  status          text        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at     timestamptz,
  review_notes    text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (slug)
);

CREATE INDEX IF NOT EXISTS idx_chapter_requests_status
  ON chapter_requests (status);

CREATE INDEX IF NOT EXISTS idx_chapter_requests_requester
  ON chapter_requests (requested_by);

ALTER TABLE chapter_requests ENABLE ROW LEVEL SECURITY;

-- Chapter leads can submit and view own requests
DROP POLICY IF EXISTS "cr_own" ON chapter_requests;
CREATE POLICY "cr_own" ON chapter_requests
  FOR ALL USING (requested_by = auth.uid());

-- Super admin manages all
DROP POLICY IF EXISTS "cr_admin" ON chapter_requests;
CREATE POLICY "cr_admin" ON chapter_requests
  FOR ALL USING (is_super_admin());

CREATE TRIGGER trg_chapter_requests_updated_at
  BEFORE UPDATE ON chapter_requests
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── 1F. Coach applications table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS coach_applications (
  id                  uuid           PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             uuid           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  chapter_id          uuid           NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  credly_url          text           NOT NULL,
  credly_verified     boolean        NOT NULL DEFAULT false,
  certification_level certification_level,
  message             text,
  status              text           NOT NULL DEFAULT 'pending'
                                     CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by         uuid           REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at         timestamptz,
  review_notes        text,
  created_at          timestamptz    NOT NULL DEFAULT now(),
  updated_at          timestamptz    NOT NULL DEFAULT now(),
  UNIQUE (user_id, chapter_id)
);

CREATE INDEX IF NOT EXISTS idx_coach_app_status  ON coach_applications (status);
CREATE INDEX IF NOT EXISTS idx_coach_app_chapter ON coach_applications (chapter_id);
CREATE INDEX IF NOT EXISTS idx_coach_app_user    ON coach_applications (user_id);

ALTER TABLE coach_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "coach_app_own_read"             ON coach_applications;
DROP POLICY IF EXISTS "coach_app_own_insert"            ON coach_applications;
DROP POLICY IF EXISTS "coach_app_chapter_lead_read"     ON coach_applications;
DROP POLICY IF EXISTS "coach_app_chapter_lead_update"   ON coach_applications;
DROP POLICY IF EXISTS "coach_app_admin_all"             ON coach_applications;

CREATE POLICY "coach_app_own_read" ON coach_applications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "coach_app_own_insert" ON coach_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "coach_app_chapter_lead_read" ON coach_applications
  FOR SELECT USING (user_has_chapter_role(chapter_id, 'chapter_lead'));

CREATE POLICY "coach_app_chapter_lead_update" ON coach_applications
  FOR UPDATE USING (user_has_chapter_role(chapter_id, 'chapter_lead'));

CREATE POLICY "coach_app_admin_all" ON coach_applications
  FOR ALL USING (is_super_admin());

CREATE TRIGGER trg_coach_applications_updated_at
  BEFORE UPDATE ON coach_applications
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- ── 1G. Coach visibility suspension + Credly on coach_profiles ─────────────

ALTER TABLE coach_profiles
  ADD COLUMN IF NOT EXISTS credly_url                    text,
  ADD COLUMN IF NOT EXISTS coaching_hours_verified       integer,
  ADD COLUMN IF NOT EXISTS profile_visibility_suspended  boolean   NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS visibility_suspended_at       timestamptz,
  ADD COLUMN IF NOT EXISTS visibility_suspended_by       uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Update public read policy to respect visibility suspension
DROP POLICY IF EXISTS "coaches_public_read" ON coach_profiles;
CREATE POLICY "coaches_public_read" ON coach_profiles
  FOR SELECT USING (
    is_published = true
    AND is_verified = true
    AND profile_visibility_suspended = false
  );

-- ── 1H. Update existing functions for suspension awareness ──────────────────

-- user_has_chapter_role: only count active, non-suspended roles
CREATE OR REPLACE FUNCTION user_has_chapter_role(p_chapter_id uuid, p_role public.user_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_chapter_roles
    WHERE user_id  = auth.uid()
      AND chapter_id = p_chapter_id
      AND role       = p_role
      AND is_active  = true
  )
  OR (
    p_role IN ('chapter_lead'::public.user_role, 'content_editor'::public.user_role)
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id         = auth.uid()
        AND chapter_id = p_chapter_id
        AND role       IN ('super_admin'::public.user_role, 'chapter_lead'::public.user_role, 'content_editor'::public.user_role)
        AND is_suspended = false
    )
  );
$$;

-- get_user_role: suspended users treated as 'user'
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS public.user_role LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE WHEN is_suspended THEN 'user'::public.user_role ELSE role END
  FROM public.profiles WHERE id = auth.uid();
$$;

-- ── 1I. New helper functions ────────────────────────────────────────────────

-- Get all active chapter roles for a user
CREATE OR REPLACE FUNCTION get_user_chapter_roles(p_user_id uuid)
RETURNS TABLE(chapter_id uuid, role public.user_role)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT ucr.chapter_id, ucr.role
  FROM public.user_chapter_roles ucr
  WHERE ucr.user_id = p_user_id AND ucr.is_active = true;
$$;

-- Count non-suspended super admins (for last-admin protection)
CREATE OR REPLACE FUNCTION count_active_super_admins()
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT count(*)::integer
  FROM public.profiles
  WHERE role = 'super_admin'::public.user_role AND is_suspended = false;
$$;

-- ── Grant execute permissions ────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION get_user_chapter_roles(uuid)               TO authenticated;
GRANT EXECUTE ON FUNCTION count_active_super_admins()                TO authenticated;
GRANT EXECUTE ON FUNCTION user_has_chapter_role(uuid, public.user_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_user_role()                            TO authenticated, anon;
