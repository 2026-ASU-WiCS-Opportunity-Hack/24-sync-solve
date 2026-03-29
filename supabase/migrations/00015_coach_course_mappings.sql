-- Migration: 00015_coach_course_mappings
-- Purpose: Bidirectional mapping between coaches and courses (resources)

CREATE TABLE IF NOT EXISTS coach_course_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_profile_id UUID NOT NULL REFERENCES coach_profiles(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (coach_profile_id, resource_id)
);

CREATE INDEX IF NOT EXISTS coach_course_mappings_coach_idx
  ON coach_course_mappings (coach_profile_id);

CREATE INDEX IF NOT EXISTS coach_course_mappings_resource_idx
  ON coach_course_mappings (resource_id);

ALTER TABLE coach_course_mappings ENABLE ROW LEVEL SECURITY;

-- Public can read mappings only when both linked entities are publicly visible.
CREATE POLICY "coach_course_mappings_select_public"
  ON coach_course_mappings FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM coach_profiles cp
      JOIN resources r ON r.id = coach_course_mappings.resource_id
      WHERE cp.id = coach_course_mappings.coach_profile_id
        AND cp.is_published = TRUE
        AND cp.is_verified = TRUE
        AND r.is_published = TRUE
    )
    OR is_super_admin(auth.uid())
  );

-- Content managers can manage mappings for resources they can manage.
CREATE POLICY "coach_course_mappings_insert_manage"
  ON coach_course_mappings FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      is_super_admin(auth.uid())
      OR can_manage_resource(auth.uid(), (
        SELECT chapter_id FROM resources WHERE id = coach_course_mappings.resource_id
      ))
    )
  );

CREATE POLICY "coach_course_mappings_update_manage"
  ON coach_course_mappings FOR UPDATE
  USING (
    auth.uid() IS NOT NULL
    AND (
      is_super_admin(auth.uid())
      OR can_manage_resource(auth.uid(), (
        SELECT chapter_id FROM resources WHERE id = coach_course_mappings.resource_id
      ))
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      is_super_admin(auth.uid())
      OR can_manage_resource(auth.uid(), (
        SELECT chapter_id FROM resources WHERE id = coach_course_mappings.resource_id
      ))
    )
  );

CREATE POLICY "coach_course_mappings_delete_manage"
  ON coach_course_mappings FOR DELETE
  USING (
    auth.uid() IS NOT NULL
    AND (
      is_super_admin(auth.uid())
      OR can_manage_resource(auth.uid(), (
        SELECT chapter_id FROM resources WHERE id = coach_course_mappings.resource_id
      ))
    )
  );

-- Best-effort backfill using existing presenter/authors metadata.
INSERT INTO coach_course_mappings (coach_profile_id, resource_id)
SELECT DISTINCT cp.id, r.id
FROM resources r
JOIN profiles p
  ON LOWER(TRIM(p.full_name)) = LOWER(TRIM(r.presenter))
JOIN coach_profiles cp
  ON cp.user_id = p.id
WHERE r.presenter IS NOT NULL
  AND TRIM(r.presenter) <> ''
ON CONFLICT (coach_profile_id, resource_id) DO NOTHING;

INSERT INTO coach_course_mappings (coach_profile_id, resource_id)
SELECT DISTINCT cp.id, r.id
FROM resources r
JOIN LATERAL UNNEST(COALESCE(r.authors, ARRAY[]::TEXT[])) AS author_name ON TRUE
JOIN profiles p
  ON LOWER(TRIM(p.full_name)) = LOWER(TRIM(author_name))
JOIN coach_profiles cp
  ON cp.user_id = p.id
WHERE TRIM(author_name) <> ''
ON CONFLICT (coach_profile_id, resource_id) DO NOTHING;
