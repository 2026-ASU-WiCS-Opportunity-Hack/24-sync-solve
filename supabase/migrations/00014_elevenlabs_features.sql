-- ============================================================
-- WIAL Platform — ElevenLabs AI features
-- Migration: 00014_elevenlabs_features
-- ============================================================
-- Adds:
--   1. Video transcript storage on resources (ElevenLabs Scribe v2)
--   2. No schema change needed for chapter background music —
--      stored in the existing chapters.settings JSONB column under
--      the key "background_music": { url, prompt, enabled, generated_at }
-- ============================================================

-- ── Transcript status enum ────────────────────────────────────────────────────
-- Using a check constraint instead of a PG enum to stay consistent with
-- the existing migration style and to allow easy extension.

ALTER TABLE resources
  ADD COLUMN transcript              TEXT,
  ADD COLUMN transcript_status       VARCHAR(20)
    NOT NULL DEFAULT 'idle'
    CHECK (transcript_status IN ('idle', 'processing', 'completed', 'failed')),
  ADD COLUMN transcript_generated_at TIMESTAMPTZ,
  ADD COLUMN transcript_job_id       TEXT;

-- Index for quickly finding in-progress transcription jobs (used by webhook)
CREATE INDEX idx_resources_transcript_job_id
  ON resources (transcript_job_id)
  WHERE transcript_job_id IS NOT NULL;

-- Index for listing resources that still need transcription
CREATE INDEX idx_resources_transcript_status
  ON resources (transcript_status)
  WHERE transcript_status IN ('processing', 'failed');
