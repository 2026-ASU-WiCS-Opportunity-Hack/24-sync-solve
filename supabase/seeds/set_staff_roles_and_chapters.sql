-- ============================================================
-- WIAL Platform - Staff role + chapter assignment seed
-- File: supabase/seeds/set_staff_roles_and_chapters.sql
-- ============================================================
-- Purpose:
-- - Assign manually created users to chapter_lead/content_editor roles
-- - Set primary chapter_id on profiles
-- - Add user_chapter_roles rows for explicit RBAC mapping
--
-- Assumes:
-- - auth users already exist and profile rows were auto-created
-- - chapter slugs usa and nigeria exist from base seed
-- ============================================================

BEGIN;

-- Optional safety: ensure temp remains super admin for admin access.
UPDATE profiles p
SET role = 'super_admin'::user_role,
    full_name = COALESCE(NULLIF(p.full_name, ''), 'WIAL Platform Admin')
WHERE p.email = 'temp@gmail.com'
   OR p.id::text = 'b0e42634-842a-4f90-93f7-517c7b01470c';

WITH staff_targets AS (
  SELECT *
  FROM (
    VALUES
      (
        '279d47d5-9589-424a-bb5f-7c8f19f55a80'::uuid,
        'chplead1@gmail.com'::text,
        'chapter_lead'::user_role,
        'usa'::text,
        'USA Chapter Lead'::text
      ),
      (
        'df6879cc-abf0-4e5a-8c55-5e8fa95d2b12'::uuid,
        'chplead2@gmail.com'::text,
        'chapter_lead'::user_role,
        'nigeria'::text,
        'Nigeria Chapter Lead'::text
      ),
      (
        'f1d22a7f-04b0-4495-b4b7-5f1301824cc5'::uuid,
        'conedit1@gmail.com'::text,
        'content_editor'::user_role,
        'usa'::text,
        'USA Content Editor'::text
      ),
      (
        '9b7744d7-0a01-4d2b-91a7-c64c51ecadda'::uuid,
        'conedit2@gmail.com'::text,
        'content_editor'::user_role,
        'nigeria'::text,
        'Nigeria Content Editor'::text
      )
  ) AS t(user_id, email, role, chapter_slug, fallback_name)
),
resolved AS (
  SELECT
    p.id AS profile_id,
    p.email,
    st.role,
    c.id AS chapter_id,
    st.chapter_slug,
    st.fallback_name
  FROM staff_targets st
  JOIN profiles p
    ON p.id = st.user_id
    OR p.email = st.email
  JOIN chapters c
    ON c.slug = st.chapter_slug
)
UPDATE profiles p
SET role = r.role,
    chapter_id = r.chapter_id,
    full_name = COALESCE(NULLIF(p.full_name, ''), r.fallback_name)
FROM resolved r
WHERE p.id = r.profile_id;

-- Add explicit chapter-role mappings (useful for multi-chapter logic and audits).
WITH staff_targets AS (
  SELECT *
  FROM (
    VALUES
      ('279d47d5-9589-424a-bb5f-7c8f19f55a80'::uuid, 'chplead1@gmail.com'::text, 'chapter_lead'::user_role, 'usa'::text),
      ('df6879cc-abf0-4e5a-8c55-5e8fa95d2b12'::uuid, 'chplead2@gmail.com'::text, 'chapter_lead'::user_role, 'nigeria'::text),
      ('f1d22a7f-04b0-4495-b4b7-5f1301824cc5'::uuid, 'conedit1@gmail.com'::text, 'content_editor'::user_role, 'usa'::text),
      ('9b7744d7-0a01-4d2b-91a7-c64c51ecadda'::uuid, 'conedit2@gmail.com'::text, 'content_editor'::user_role, 'nigeria'::text)
  ) AS t(user_id, email, role, chapter_slug)
),
resolved AS (
  SELECT
    p.id AS user_id,
    c.id AS chapter_id,
    st.role
  FROM staff_targets st
  JOIN profiles p
    ON p.id = st.user_id
    OR p.email = st.email
  JOIN chapters c
    ON c.slug = st.chapter_slug
),
granted_by_admin AS (
  SELECT id AS granted_by
  FROM profiles
  WHERE email = 'temp@gmail.com'
  LIMIT 1
)
INSERT INTO user_chapter_roles (user_id, chapter_id, role, granted_by)
SELECT
  r.user_id,
  r.chapter_id,
  r.role,
  gba.granted_by
FROM resolved r
LEFT JOIN granted_by_admin gba ON true
ON CONFLICT (user_id, chapter_id, role) DO NOTHING;

COMMIT;

-- Optional verification queries:
-- SELECT email, role, chapter_id FROM profiles
-- WHERE email IN ('chplead1@gmail.com','chplead2@gmail.com','conedit1@gmail.com','conedit2@gmail.com','temp@gmail.com')
-- ORDER BY email;
--
-- SELECT p.email, c.slug, ucr.role
-- FROM user_chapter_roles ucr
-- JOIN profiles p ON p.id = ucr.user_id
-- JOIN chapters c ON c.id = ucr.chapter_id
-- WHERE p.email IN ('chplead1@gmail.com','chplead2@gmail.com','conedit1@gmail.com','conedit2@gmail.com')
-- ORDER BY p.email, c.slug, ucr.role;
