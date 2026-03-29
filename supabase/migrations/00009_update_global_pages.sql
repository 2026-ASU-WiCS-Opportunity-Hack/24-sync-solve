-- ============================================================
-- WIAL Platform - Refresh Global Pages Content
-- Migration: 00009_update_global_pages
-- ============================================================
-- Replaces stale / empty content blocks for the home and about
-- global pages with substantive, accurate content aligned with
-- WIAL's mission and methodology.
--
-- Strategy: DELETE then re-INSERT rather than ON CONFLICT DO NOTHING,
-- so stale or empty blocks created by earlier migrations are replaced.
-- ============================================================

-- ── Step 1: Remove all existing blocks for the two global pages ──

DELETE FROM content_blocks
WHERE page_id IN (
  SELECT id FROM pages
  WHERE chapter_id IS NULL
  AND slug IN ('home', 'about')
);

-- ── Step 2: Home page ─────────────────────────────────────────────

WITH home_page AS (
  SELECT id FROM pages WHERE chapter_id IS NULL AND slug = 'home'
)
INSERT INTO content_blocks (
  page_id, block_type, content, published_version,
  sort_order, is_visible, status, requires_approval
)
SELECT
  home_page.id,
  block_type::block_type,
  content,
  content AS published_version,
  sort_order,
  true,
  'published',
  block_type IN ('hero', 'cta', 'contact_form')
FROM home_page, (VALUES
  (
    'hero',
    '{"headline": "Transforming Leaders Through Action Learning", "subheadline": "WIAL certifies Action Learning coaches in 20+ countries, empowering organisations to solve complex challenges and build lasting leadership capacity.", "cta_primary_text": "Find a Coach", "cta_primary_href": "/coaches", "cta_secondary_text": "Get Certified", "cta_secondary_href": "/about", "background_image_url": null}'::jsonb,
    0
  ),
  (
    'stats',
    '{"items": [{"label": "Countries", "value": "20+"}, {"label": "Certified Coaches", "value": "500+"}, {"label": "Organisations Served", "value": "1,000+"}, {"label": "Years of Impact", "value": "30+"}]}'::jsonb,
    1
  ),
  (
    'text',
    '{"heading": "What is Action Learning?", "body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Action Learning is a powerful process in which a small, diverse team works on a real, complex problem, takes action, and learns from the results. It is simultaneously a problem-solving methodology and one of the world''s most effective leadership development approaches."}]}, {"type": "paragraph", "content": [{"type": "text", "text": "The World Institute for Action Learning (WIAL) was founded by Dr. Michael Marquardt and is the global authority on Action Learning. WIAL''s structured methodology — built around insightful questioning, active listening, and reflective practice — is used by Fortune 500 companies, governments, NGOs, and universities on every continent."}]}]}}'::jsonb,
    2
  ),
  (
    'cta',
    '{"heading": "Ready to Transform Your Organisation?", "subheading": "Join the global community of certified Action Learning coaches and practitioners making a difference in 20+ countries.", "button_text": "Find Your Coach", "button_href": "/coaches", "variant": "dark"}'::jsonb,
    3
  )
) AS blocks(block_type, content, sort_order);

-- ── Step 3: About page ────────────────────────────────────────────

WITH about_page AS (
  SELECT id FROM pages WHERE chapter_id IS NULL AND slug = 'about'
)
INSERT INTO content_blocks (
  page_id, block_type, content, published_version,
  sort_order, is_visible, status, requires_approval
)
SELECT
  about_page.id,
  block_type::block_type,
  content,
  content AS published_version,
  sort_order,
  true,
  'published',
  block_type IN ('hero', 'cta', 'contact_form')
FROM about_page, (VALUES
  (
    'hero',
    '{"headline": "About WIAL", "subheadline": "The World Institute for Action Learning is the global authority on Action Learning — a transformative methodology for leadership development and organisational problem-solving practised in 20+ countries."}'::jsonb,
    0
  ),
  (
    'text',
    '{"heading": "Our Mission", "body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "WIAL''s mission is to advance Action Learning worldwide as the premier methodology for developing leaders who can tackle complex challenges in a rapidly changing world. We certify coaches, develop practitioners, and connect a global community committed to learning through action."}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Founded by Dr. Michael Marquardt, WIAL draws on over 30 years of research and practice to set the global standard for Action Learning quality. Our certification programmes, professional community, and research initiatives ensure that Action Learning''s transformative power reaches organisations and individuals everywhere."}]}]}}'::jsonb,
    1
  ),
  (
    'text',
    '{"heading": "The Action Learning Methodology", "body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "Action Learning brings together a small group of 4–8 people — drawn from different functions, levels, or organisations — to work on a real, urgent, complex problem. The WIAL methodology has six essential components:"}]}, {"type": "bulletList", "content": [{"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "A real problem "}, {"type": "text", "text": "that is important, complex, and has no obvious solution."}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "An Action Learning set "}, {"type": "text", "text": "of 4–8 diverse members who are committed to solving the problem."}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Insightful questioning "}, {"type": "text", "text": "and active listening as the primary mode of communication."}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "Taking action "}, {"type": "text", "text": "on the problem between and after sessions."}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "A commitment to learning "}, {"type": "text", "text": "as individuals, as a team, and as an organisation."}]}]}, {"type": "listItem", "content": [{"type": "paragraph", "content": [{"type": "text", "marks": [{"type": "bold"}], "text": "An Action Learning Coach "}, {"type": "text", "text": "who focuses the group on learning and ensures the process is followed with fidelity."}]}]}]}]}}'::jsonb,
    2
  ),
  (
    'stats',
    '{"heading": "Our Global Impact", "items": [{"label": "Countries", "value": "20+"}, {"label": "Certified Coaches", "value": "500+"}, {"label": "Organisations Served", "value": "1,000+"}, {"label": "Years of Research", "value": "30+"}]}'::jsonb,
    3
  ),
  (
    'text',
    '{"heading": "Our Global Community", "body": {"type": "doc", "content": [{"type": "paragraph", "content": [{"type": "text", "text": "WIAL operates through a network of regional chapters spanning every continent. Each chapter brings Action Learning to its local context — adapting delivery, supporting local coaches, and connecting practitioners — while maintaining the rigorous global standards that make WIAL certification meaningful worldwide."}]}, {"type": "paragraph", "content": [{"type": "text", "text": "Our chapters are led by certified Senior and Master Action Learning Coaches who are deeply embedded in their regional leadership development ecosystems. Through chapters in the USA, UK, Nigeria, Brazil, Australia, and many more countries, WIAL ensures that world-class Action Learning is accessible wherever it is needed."}]}]}}'::jsonb,
    4
  ),
  (
    'faq',
    '{"heading": "Certification: Frequently Asked Questions", "items": [{"question": "What is WIAL certification?", "answer": "WIAL certification is the international gold standard for Action Learning coaches. Awarded at four progressive levels — CALC, PALC, SALC, and MALC — it confirms you have been rigorously assessed against global competency standards based on real coaching practice, not just coursework."}, {"question": "What are the four certification levels?", "answer": "CALC (Certified, entry-level: 3 sets coached, approximately 20 hours), PALC (Professional: 5 sets, approximately 40 hours), SALC (Senior: 8 or more sets, approximately 70 hours, peer review required), and MALC (Master: extensive coaching portfolio, original contribution to the field, board review)."}, {"question": "How do I get certified?", "answer": "Complete WIAL-accredited training through a regional chapter, coach the required minimum number of real Action Learning sets, compile a reflective portfolio, then apply through your chapter. Most coaches complete their first certification within 6 to 18 months of starting practice."}, {"question": "How long is certification valid?", "answer": "All WIAL certifications are valid for two years. Recertification requires demonstrating continued active coaching practice, ongoing professional development, and contribution to Action Learning during the cycle."}, {"question": "Is WIAL certification recognised internationally?", "answer": "Yes. WIAL certification is recognised by multinational corporations, governments, NGOs, and universities across 20 or more countries. It is the most widely accepted credential for Action Learning coaches worldwide."}, {"question": "Where can I find accredited training?", "answer": "Contact your regional WIAL chapter or reach out to WIAL Global using the contact form above. Accredited training is available in person and online across 20 or more countries."}]}'::jsonb,
    5
  )
) AS blocks(block_type, content, sort_order);
