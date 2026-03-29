-- ============================================================
-- WIAL Platform - AI cache fields for resources
-- Migration: 00012_resources_ai_cache
-- ============================================================
-- Stores AI-generated summary and promoter content so it can be reused
-- without regenerating on every request.
-- ============================================================

ALTER TABLE resources
  ADD COLUMN ai_summary TEXT,
  ADD COLUMN ai_summary_generated_at TIMESTAMPTZ,
  ADD COLUMN ai_marketing JSONB,
  ADD COLUMN ai_marketing_generated_at TIMESTAMPTZ;
