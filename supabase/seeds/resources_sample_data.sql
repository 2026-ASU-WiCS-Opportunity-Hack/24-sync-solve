-- ============================================================
-- WIAL Platform - Sample Resources Seed
-- File: supabase/seeds/resources_sample_data.sql
-- ============================================================
-- Inserts 3 global (chapter_id IS NULL) sample resources:
--   1. A YouTube video introduction to Action Learning
--   2. An external article on the WIAL methodology
--   3. A downloadable PDF facilitator guide
--
-- Safe to re-run — uses WHERE NOT EXISTS guards per URL + chapter_id.
-- Requires: 00010_resources migration already applied.
-- ============================================================

BEGIN;

INSERT INTO resources (chapter_id, title, description, type, url, thumbnail_url, category, tags, is_published, sort_order)
SELECT NULL,
       'Introduction to Action Learning with Michael Marquardt',
       'Dr. Michael Marquardt, founder of WIAL, explains the core principles of Action Learning — how small, diverse teams solve real problems while developing lasting leadership capacity.',
       'video',
       'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
       'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
       'Getting Started',
       ARRAY['action learning', 'introduction', 'michael marquardt', 'leadership'],
       true, 0
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' AND chapter_id IS NULL);

INSERT INTO resources (chapter_id, title, description, type, url, thumbnail_url, category, tags, is_published, sort_order)
SELECT NULL,
       'The Six Components of Action Learning',
       'A deep-dive article exploring WIAL''s six essential components — the real problem, the set, questioning, action, learning commitment, and the Action Learning Coach — and why each is critical to program success.',
       'article',
       'https://wial.org/action-learning/six-components',
       NULL,
       'Methodology',
       ARRAY['methodology', 'components', 'facilitation', 'certification'],
       true, 1
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE url = 'https://wial.org/action-learning/six-components' AND chapter_id IS NULL);

INSERT INTO resources (chapter_id, title, description, type, url, thumbnail_url, category, tags, is_published, sort_order)
SELECT NULL,
       'Action Learning Facilitator Guide (PDF)',
       'A practical reference guide for certified Action Learning Coaches covering session structure, questioning techniques, reflection prompts, and common facilitation challenges. Suitable for CALC through SALC practitioners.',
       'pdf',
       'https://wial.org/resources/facilitator-guide.pdf',
       NULL,
       'Facilitation',
       ARRAY['facilitator', 'guide', 'coaching', 'questions', 'reflection'],
       true, 2
WHERE NOT EXISTS (SELECT 1 FROM resources WHERE url = 'https://wial.org/resources/facilitator-guide.pdf' AND chapter_id IS NULL);

COMMIT;
