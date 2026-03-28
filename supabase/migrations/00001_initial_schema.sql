-- ============================================================
-- WIAL Platform - Initial Schema
-- Migration: 00001_initial_schema
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";    -- For similarity/full-text search
CREATE EXTENSION IF NOT EXISTS "unaccent";   -- For accent-insensitive search

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('super_admin', 'chapter_lead', 'content_editor', 'coach', 'public');

CREATE TYPE certification_level AS ENUM ('CALC', 'PALC', 'SALC', 'MALC');

CREATE TYPE content_status AS ENUM ('draft', 'published', 'pending_approval', 'rejected');

CREATE TYPE block_type AS ENUM (
  'hero',
  'text',
  'image',
  'cta',
  'team_grid',
  'coach_list',
  'event_list',
  'testimonial',
  'faq',
  'contact_form',
  'stats',
  'video',
  'divider'
);

CREATE TYPE payment_type AS ENUM ('enrollment_fee', 'certification_fee', 'membership_dues', 'event_registration');

CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'succeeded', 'failed', 'refunded');

CREATE TYPE event_type AS ENUM ('workshop', 'webinar', 'conference', 'certification', 'networking', 'other');

-- ============================================================
-- CHAPTERS
-- ============================================================

CREATE TABLE chapters (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,
  country_code   CHAR(2) NOT NULL,
  timezone       TEXT NOT NULL DEFAULT 'UTC',
  currency       CHAR(3) NOT NULL DEFAULT 'USD',
  accent_color   TEXT NOT NULL DEFAULT '#CC0000',
  logo_url       TEXT,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  stripe_account_id TEXT,
  contact_email  TEXT,
  website_url    TEXT,
  settings       JSONB NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chapters_slug_format CHECK (slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT chapters_accent_color_format CHECK (accent_color ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT chapters_currency_format CHECK (currency ~ '^[A-Z]{3}$')
);

CREATE INDEX idx_chapters_slug ON chapters (slug);
CREATE INDEX idx_chapters_active ON chapters (is_active) WHERE is_active = true;

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  phone       TEXT,
  role        user_role NOT NULL DEFAULT 'public',
  chapter_id  UUID REFERENCES chapters (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles (role);
CREATE INDEX idx_profiles_chapter ON profiles (chapter_id);
CREATE INDEX idx_profiles_email ON profiles (email);

-- ============================================================
-- USER CHAPTER ROLES (multi-chapter role assignments)
-- ============================================================

CREATE TABLE user_chapter_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
  chapter_id  UUID NOT NULL REFERENCES chapters (id) ON DELETE CASCADE,
  role        user_role NOT NULL,
  granted_by  UUID REFERENCES profiles (id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (user_id, chapter_id, role)
);

CREATE INDEX idx_ucr_user ON user_chapter_roles (user_id);
CREATE INDEX idx_ucr_chapter ON user_chapter_roles (chapter_id);

-- ============================================================
-- COACH PROFILES
-- ============================================================

CREATE TABLE coach_profiles (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id              UUID NOT NULL UNIQUE REFERENCES profiles (id) ON DELETE CASCADE,
  chapter_id           UUID REFERENCES chapters (id) ON DELETE SET NULL,
  certification_level  certification_level NOT NULL,
  bio                  TEXT,
  specializations      TEXT[] NOT NULL DEFAULT '{}',
  languages            TEXT[] NOT NULL DEFAULT '{"English"}',
  location_city        TEXT,
  location_country     TEXT,
  photo_url            TEXT,
  contact_email        TEXT,
  linkedin_url         TEXT,
  is_published         BOOLEAN NOT NULL DEFAULT false,
  is_verified          BOOLEAN NOT NULL DEFAULT false,
  certification_date   DATE,
  recertification_due  DATE,
  coaching_hours       INTEGER NOT NULL DEFAULT 0,
  pending_changes      JSONB,
  search_vector        TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(bio, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(specializations, ' '), '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(location_city, '') || ' ' || COALESCE(location_country, '')), 'C')
  ) STORED,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
  -- Future: embedding vector(384)  -- pgvector for AI semantic search
);

CREATE INDEX idx_coach_chapter ON coach_profiles (chapter_id);
CREATE INDEX idx_coach_published ON coach_profiles (is_published) WHERE is_published = true;
CREATE INDEX idx_coach_cert_level ON coach_profiles (certification_level);
CREATE INDEX idx_coach_country ON coach_profiles (location_country);
CREATE INDEX idx_coach_search ON coach_profiles USING GIN (search_vector);
CREATE INDEX idx_coach_specializations ON coach_profiles USING GIN (specializations);

-- ============================================================
-- PAGES
-- ============================================================

CREATE TABLE pages (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id   UUID REFERENCES chapters (id) ON DELETE CASCADE,
  slug         TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (chapter_id, slug)
);

CREATE INDEX idx_pages_chapter ON pages (chapter_id);
CREATE INDEX idx_pages_published ON pages (is_published);

-- ============================================================
-- CONTENT BLOCKS
-- ============================================================

CREATE TABLE content_blocks (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  page_id           UUID NOT NULL REFERENCES pages (id) ON DELETE CASCADE,
  block_type        block_type NOT NULL,
  content           JSONB NOT NULL DEFAULT '{}',
  sort_order        INTEGER NOT NULL DEFAULT 0,
  is_visible        BOOLEAN NOT NULL DEFAULT true,
  status            content_status NOT NULL DEFAULT 'published',
  published_version JSONB,
  draft_version     JSONB,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  approved_by       UUID REFERENCES profiles (id) ON DELETE SET NULL,
  approved_at       TIMESTAMPTZ,
  rejection_reason  TEXT,
  created_by        UUID REFERENCES profiles (id) ON DELETE SET NULL,
  updated_by        UUID REFERENCES profiles (id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_blocks_page ON content_blocks (page_id, sort_order);
CREATE INDEX idx_blocks_status ON content_blocks (status);
CREATE INDEX idx_blocks_visible ON content_blocks (is_visible) WHERE is_visible = true;

-- ============================================================
-- CONTENT VERSIONS (audit trail)
-- ============================================================

CREATE TABLE content_versions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_block_id UUID NOT NULL REFERENCES content_blocks (id) ON DELETE CASCADE,
  version_number   INTEGER NOT NULL,
  content          JSONB NOT NULL,
  status           content_status NOT NULL,
  changed_by       UUID REFERENCES profiles (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (content_block_id, version_number)
);

CREATE INDEX idx_versions_block ON content_versions (content_block_id, version_number DESC);

-- ============================================================
-- EVENTS
-- ============================================================

CREATE TABLE events (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chapter_id       UUID REFERENCES chapters (id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT,
  event_type       event_type NOT NULL DEFAULT 'other',
  start_date       TIMESTAMPTZ NOT NULL,
  end_date         TIMESTAMPTZ,
  timezone         TEXT NOT NULL DEFAULT 'UTC',
  location_name    TEXT,
  is_virtual       BOOLEAN NOT NULL DEFAULT false,
  virtual_link     TEXT,
  max_attendees    INTEGER,
  registration_url TEXT,
  image_url        TEXT,
  is_published     BOOLEAN NOT NULL DEFAULT false,
  created_by       UUID REFERENCES profiles (id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT events_dates_valid CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE INDEX idx_events_chapter ON events (chapter_id);
CREATE INDEX idx_events_start_date ON events (start_date);
CREATE INDEX idx_events_published ON events (is_published) WHERE is_published = true;

-- ============================================================
-- PAYMENTS
-- ============================================================

CREATE TABLE payments (
  id                          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                     UUID NOT NULL REFERENCES profiles (id) ON DELETE RESTRICT,
  chapter_id                  UUID REFERENCES chapters (id) ON DELETE SET NULL,
  stripe_payment_intent_id    TEXT UNIQUE,
  stripe_checkout_session_id  TEXT UNIQUE NOT NULL,
  amount                      INTEGER NOT NULL,
  currency                    CHAR(3) NOT NULL DEFAULT 'USD',
  payment_type                payment_type NOT NULL,
  status                      payment_status NOT NULL DEFAULT 'pending',
  receipt_url                 TEXT,
  metadata                    JSONB NOT NULL DEFAULT '{}',
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT payments_amount_positive CHECK (amount > 0)
);

CREATE INDEX idx_payments_user ON payments (user_id);
CREATE INDEX idx_payments_chapter ON payments (chapter_id);
CREATE INDEX idx_payments_status ON payments (status);
CREATE INDEX idx_payments_session ON payments (stripe_checkout_session_id);

-- ============================================================
-- AUDIT LOG
-- ============================================================

CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles (id) ON DELETE SET NULL,
  action      TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id   UUID,
  chapter_id  UUID REFERENCES chapters (id) ON DELETE SET NULL,
  old_value   JSONB,
  new_value   JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_log (user_id);
CREATE INDEX idx_audit_entity ON audit_log (entity_type, entity_id);
CREATE INDEX idx_audit_chapter ON audit_log (chapter_id);
CREATE INDEX idx_audit_created ON audit_log (created_at DESC);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',        'avatars',        true, 2097152,  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('coach-photos',   'coach-photos',   true, 2097152,  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('chapter-assets', 'chapter-assets', true, 5242880,  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']),
  ('content-images', 'content-images', true, 2097152,  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO NOTHING;
