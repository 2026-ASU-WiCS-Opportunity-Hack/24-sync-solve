-- ============================================================
-- WIAL Platform - Resource Completion & Certification Progress
-- Migration: 00011_resource_completion
-- ============================================================
-- Adds:
--   resource_completions      — per-user completion records with 2-year expiry
--   certification_requirements — admin-defined required resources per cert level
--   user_certifications        — earned / pending / expired certifications
-- ============================================================

-- ── resource_completions ──────────────────────────────────────

CREATE TABLE resource_completions (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  resource_id  UUID        NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL DEFAULT now() + INTERVAL '2 years',
  UNIQUE (user_id, resource_id)
);

CREATE INDEX resource_completions_user_idx     ON resource_completions (user_id);
CREATE INDEX resource_completions_resource_idx ON resource_completions (resource_id);
CREATE INDEX resource_completions_expires_idx  ON resource_completions (expires_at);

CREATE TRIGGER resource_completions_updated_at
  BEFORE UPDATE ON resource_completions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE resource_completions ENABLE ROW LEVEL SECURITY;

-- Users can read and write their own completions only
CREATE POLICY "completions_select" ON resource_completions FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  ));

CREATE POLICY "completions_insert" ON resource_completions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "completions_update" ON resource_completions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ── certification_requirements ────────────────────────────────

CREATE TABLE certification_requirements (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  level       TEXT     NOT NULL CHECK (level IN ('CALC', 'PALC', 'SALC', 'MALC')),
  resource_id UUID     NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  is_required BOOLEAN  NOT NULL DEFAULT true,
  sort_order  INTEGER  NOT NULL DEFAULT 0,
  created_by  UUID     REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (level, resource_id)
);

CREATE INDEX cert_requirements_level_idx ON certification_requirements (level);
CREATE INDEX cert_requirements_resource_idx ON certification_requirements (resource_id);

ALTER TABLE certification_requirements ENABLE ROW LEVEL SECURITY;

-- Public can read requirements; only editors can manage them
CREATE POLICY "cert_requirements_select" ON certification_requirements FOR SELECT
  USING (true);

CREATE POLICY "cert_requirements_insert" ON certification_requirements FOR INSERT
  WITH CHECK (can_manage_resource(NULL));

CREATE POLICY "cert_requirements_update" ON certification_requirements FOR UPDATE
  USING (can_manage_resource(NULL))
  WITH CHECK (can_manage_resource(NULL));

CREATE POLICY "cert_requirements_delete" ON certification_requirements FOR DELETE
  USING (can_manage_resource(NULL));

-- ── user_certifications ───────────────────────────────────────

CREATE TABLE user_certifications (
  id          UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID     NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  level       TEXT     NOT NULL CHECK (level IN ('CALC', 'PALC', 'SALC', 'MALC')),
  status      TEXT     NOT NULL DEFAULT 'pending_approval'
                       CHECK (status IN ('pending_approval', 'approved', 'expired', 'revoked')),
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  approved_by UUID     REFERENCES profiles(id) ON DELETE SET NULL,
  expires_at  TIMESTAMPTZ,
  notes       TEXT
);

CREATE INDEX user_certifications_user_idx   ON user_certifications (user_id);
CREATE INDEX user_certifications_level_idx  ON user_certifications (level, status);

ALTER TABLE user_certifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own; super_admin can see all
CREATE POLICY "user_certs_select" ON user_certifications FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  ));

-- Users can submit their own application (insert)
CREATE POLICY "user_certs_insert" ON user_certifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Only super_admin can update (approve/revoke/expire)
CREATE POLICY "user_certs_update" ON user_certifications FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin'
  ));
