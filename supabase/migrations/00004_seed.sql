-- ============================================================
-- WIAL Platform - Seed Data
-- Migration: 00004_seed
-- ============================================================
-- NOTE: This seed creates global pages and chapter structures.
-- Coach data and test users are created via scripts/seed.ts
-- ============================================================

-- ============================================================
-- GLOBAL PAGES (chapter_id = NULL)
-- ============================================================

INSERT INTO pages (chapter_id, slug, title, description, sort_order, is_published) VALUES
  (NULL, 'home',          'Home',          'WIAL global homepage',                           0, true),
  (NULL, 'about',         'About',         'About WIAL and Action Learning',                 1, true),
  (NULL, 'certification', 'Certification', 'Action Learning certification levels and paths', 2, true),
  (NULL, 'coaches',       'Find a Coach',  'Global certified coach directory',               3, true),
  (NULL, 'resources',     'Resources',     'Action Learning resources and publications',     4, true),
  (NULL, 'events',        'Events',        'Global events and workshops',                    5, true),
  (NULL, 'contact',       'Contact',       'Contact WIAL global',                            6, true)
ON CONFLICT (chapter_id, slug) DO NOTHING;

-- ============================================================
-- SEED CHAPTERS (5 representative chapters)
-- ============================================================

WITH inserted_chapters AS (
  INSERT INTO chapters (slug, name, country_code, timezone, currency, accent_color, contact_email, is_active)
  VALUES
    ('usa',       'WIAL USA',       'US', 'America/New_York',     'USD', '#CC0000', 'usa@wial.edu',       true),
    ('nigeria',   'WIAL Nigeria',   'NG', 'Africa/Lagos',         'NGN', '#008751', 'nigeria@wial.edu',   true),
    ('brazil',    'WIAL Brazil',    'BR', 'America/Sao_Paulo',    'BRL', '#009C3B', 'brazil@wial.edu',    true),
    ('uk',        'WIAL UK',        'GB', 'Europe/London',        'GBP', '#003366', 'uk@wial.edu',        true),
    ('australia', 'WIAL Australia', 'AU', 'Australia/Sydney',     'AUD', '#FF8200', 'australia@wial.edu', true)
  ON CONFLICT (slug) DO NOTHING
  RETURNING id, slug
)
-- Provision pages for each chapter
SELECT provision_chapter_pages(id) FROM inserted_chapters;

-- ============================================================
-- GLOBAL HOMEPAGE CONTENT BLOCKS
-- ============================================================

WITH home_page AS (
  SELECT id FROM pages WHERE chapter_id IS NULL AND slug = 'home'
)
INSERT INTO content_blocks (page_id, block_type, content, published_version, sort_order, is_visible, status, requires_approval)
SELECT
  home_page.id,
  block_type,
  content,
  content AS published_version,
  sort_order,
  true,
  'published',
  CASE WHEN block_type = 'hero' THEN true ELSE false END
FROM home_page,
(VALUES
  (
    'hero'::block_type,
    '{"headline": "Transforming Leaders Through Action Learning", "subheadline": "WIAL certifies Action Learning coaches across 20+ countries, empowering organizations to solve complex challenges through collaborative problem-solving.", "cta_primary_text": "Find a Coach", "cta_primary_href": "/coaches", "cta_secondary_text": "Get Certified", "cta_secondary_href": "/certification", "background_image_url": null}'::jsonb,
    0
  ),
  (
    'stats'::block_type,
    '{"items": [{"label": "Countries", "value": "20+"}, {"label": "Certified Coaches", "value": "500+"}, {"label": "Organizations Served", "value": "1,000+"}, {"label": "Years of Impact", "value": "30+"}]}'::jsonb,
    1
  ),
  (
    'text'::block_type,
    '{"heading": "What is Action Learning?", "body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Action Learning is a process that involves a small group working on real problems, taking action, and learning as individuals and as a team. It is one of the most powerful approaches to leadership development in the world."}]}, {"type": "paragraph", "content": [{"type": "text", "text": "The World Institute for Action Learning (WIAL) is the global leader in Action Learning certification, having trained and certified coaches in organizations across every continent."}]}]}}'::jsonb,
    2
  ),
  (
    'cta'::block_type,
    '{"heading": "Ready to Transform Your Organization?", "subheading": "Join the global community of Action Learning coaches and practitioners.", "button_text": "Find Your Chapter", "button_href": "/coaches", "variant": "dark"}'::jsonb,
    3
  )
) AS blocks(block_type, content, sort_order)
ON CONFLICT DO NOTHING;

-- ============================================================
-- GLOBAL ABOUT PAGE CONTENT
-- ============================================================

WITH about_page AS (
  SELECT id FROM pages WHERE chapter_id IS NULL AND slug = 'about'
)
INSERT INTO content_blocks (page_id, block_type, content, published_version, sort_order, is_visible, status)
SELECT
  about_page.id,
  block_type,
  content,
  content,
  sort_order,
  true,
  'published'
FROM about_page,
(VALUES
  (
    'hero'::block_type,
    '{"headline": "About WIAL", "subheadline": "The World Institute for Action Learning — advancing leadership through the power of collaborative problem-solving."}'::jsonb,
    0
  ),
  (
    'text'::block_type,
    '{"heading": "Our Mission", "body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "WIAL''s mission is to develop leaders who can tackle the world''s most complex challenges through Action Learning. We certify coaches at four levels — CALC, PALC, SALC, and MALC — ensuring the highest standards in the field."}]}]}}'::jsonb,
    1
  )
) AS blocks(block_type, content, sort_order)
ON CONFLICT DO NOTHING;

-- ============================================================
-- GLOBAL CERTIFICATION PAGE CONTENT
-- ============================================================

WITH cert_page AS (
  SELECT id FROM pages WHERE chapter_id IS NULL AND slug = 'certification'
)
INSERT INTO content_blocks (page_id, block_type, content, published_version, sort_order, is_visible, status)
SELECT
  cert_page.id,
  block_type,
  content,
  content,
  sort_order,
  true,
  'published'
FROM cert_page,
(VALUES
  (
    'hero'::block_type,
    '{"headline": "Action Learning Certification", "subheadline": "Earn globally recognized certification as an Action Learning coach at four progressive levels."}'::jsonb,
    0
  ),
  (
    'text'::block_type,
    '{"heading": "Certification Levels", "body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "WIAL offers four levels of Action Learning coach certification, each building on the previous to deepen your expertise and expand your impact."}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "CALC — Certified Action Learning Coach"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "The entry-level certification for practitioners new to Action Learning. Complete 3 sets with support."}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "PALC — Professional Action Learning Coach"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "For coaches with demonstrated competency across diverse contexts. Requires 5 sets logged."}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "SALC — Senior Action Learning Coach"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Recognizes mastery in complex organizational settings. Requires 8+ sets and peer review."}]}, {"type": "heading", "attrs": {"level": 2}, "content": [{"type": "text", "text": "MALC — Master Action Learning Coach"}]}, {"type": "paragraph", "content": [{"type": "text", "text": "The highest WIAL certification, awarded to coaches who have demonstrated exceptional mastery."}]}]}}'::jsonb,
    1
  )
) AS blocks(block_type, content, sort_order)
ON CONFLICT DO NOTHING;
