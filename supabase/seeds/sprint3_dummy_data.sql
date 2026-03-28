-- ============================================================
-- WIAL Platform - Sprint 3 Dummy Data Seed (SQL only)
-- File: supabase/seeds/sprint3_dummy_data.sql
-- ============================================================
-- Purpose:
-- - Populate realistic data for visual QA after Sprint 3
-- - Assumes auth users already exist (you can create them manually)
-- - Seeds coaches, chapter/global events, chapter content blocks, and payments
-- - Safe to re-run (idempotent inserts)
--
-- Prerequisites:
-- 1) Chapters/pages from migrations and 00004_seed.sql already exist.
-- 2) Users exist in auth.users, and matching profiles rows exist.
-- 3) Coach users should have role = 'coach' and a chapter_id when possible.
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- 0) Promote manually created coach users in profiles
-- ------------------------------------------------------------
-- If you add more manual auth users, extend this list.
UPDATE profiles p
SET role = 'coach'::user_role,
    full_name = COALESCE(NULLIF(p.full_name, ''), INITCAP(REPLACE(SPLIT_PART(p.email, '@', 1), '.', ' ')))
WHERE p.role <> 'coach'::user_role
  AND (
    p.email IN ('coach1@gmail.com', 'coach2@gmail.com', 'coach3@gmail.com')
    OR p.id::text IN (
      '8192e200-7a27-4637-89ea-fd73e7aa798d',
      'ab5d467b-6c9b-4aa4-8539-786051e50117',
      '3648b1ff-eb59-4719-a222-7cf42f96d050'
    )
  );

-- ------------------------------------------------------------
-- 1) Normalize coach profiles before seeding
-- ------------------------------------------------------------
-- If coach users are missing chapter_id, assign them to the first active chapter.
WITH default_chapter AS (
  SELECT id
  FROM chapters
  WHERE is_active = true
  ORDER BY slug
  LIMIT 1
)
UPDATE profiles p
SET chapter_id = dc.id
FROM default_chapter dc
WHERE p.role = 'coach'::user_role
  AND p.chapter_id IS NULL;

-- ------------------------------------------------------------
-- 2) Seed coach_profiles from existing profiles(role='coach')
-- ------------------------------------------------------------
INSERT INTO coach_profiles (
  user_id,
  chapter_id,
  certification_level,
  bio,
  specializations,
  languages,
  location_city,
  location_country,
  photo_url,
  contact_email,
  linkedin_url,
  is_published,
  is_verified,
  certification_date,
  recertification_due,
  coaching_hours,
  pending_changes
)
SELECT
  p.id,
  p.chapter_id,
  (ARRAY['CALC', 'PALC', 'SALC', 'MALC'])[1 + (ABS(('x' || SUBSTRING(md5(p.id::text), 1, 8))::bit(32)::int) % 4)]::certification_level,
  CONCAT(
    'Certified Action Learning coach focused on leadership development, team learning, and measurable organizational impact in ',
    COALESCE(c.name, 'their region'),
    '.'
  ) AS bio,
  CASE (ABS(('x' || SUBSTRING(md5(p.id::text), 1, 8))::bit(32)::int) % 3)
    WHEN 0 THEN ARRAY['Leadership Development', 'Team Performance']
    WHEN 1 THEN ARRAY['Organizational Change', 'Executive Coaching']
    ELSE ARRAY['Strategic Planning', 'Facilitation']
  END AS specializations,
  CASE (ABS(('x' || SUBSTRING(md5(p.id::text), 9, 8))::bit(32)::int) % 3)
    WHEN 0 THEN ARRAY['English']
    WHEN 1 THEN ARRAY['English', 'Spanish']
    ELSE ARRAY['English', 'Portuguese']
  END AS languages,
  CASE c.slug
    WHEN 'usa' THEN 'New York'
    WHEN 'nigeria' THEN 'Lagos'
    WHEN 'brazil' THEN 'Sao Paulo'
    WHEN 'uk' THEN 'London'
    WHEN 'australia' THEN 'Sydney'
    ELSE 'Global'
  END AS location_city,
  COALESCE(c.country_code, 'US') AS location_country,
  NULL AS photo_url,
  p.email AS contact_email,
  CONCAT('https://linkedin.com/in/', LOWER(REPLACE(COALESCE(p.full_name, 'wial-coach'), ' ', '-'))),
  true,
  true,
  CURRENT_DATE - INTERVAL '12 months',
  CURRENT_DATE + INTERVAL '24 months',
  60 + (ABS(('x' || SUBSTRING(md5(p.id::text), 17, 8))::bit(32)::int) % 300),
  NULL
FROM profiles p
LEFT JOIN chapters c ON c.id = p.chapter_id
WHERE p.role = 'coach'::user_role
  AND p.chapter_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM coach_profiles cp
    WHERE cp.user_id = p.id
  );

-- Ensure existing coach profiles are visible in directory for testing.
UPDATE coach_profiles
SET is_published = true,
    is_verified = true,
    contact_email = COALESCE(contact_email, p.email),
    chapter_id = COALESCE(coach_profiles.chapter_id, p.chapter_id)
FROM profiles p
WHERE coach_profiles.user_id = p.id
  AND p.role = 'coach'::user_role;

-- ------------------------------------------------------------
-- 3) Seed chapter page content blocks (home/about/coaches/events/contact)
-- ------------------------------------------------------------
WITH chapter_pages AS (
  SELECT
    p.id AS page_id,
    p.slug AS page_slug,
    c.id AS chapter_id,
    c.slug AS chapter_slug,
    c.name AS chapter_name,
    c.accent_color
  FROM pages p
  JOIN chapters c ON c.id = p.chapter_id
  WHERE c.is_active = true
    AND p.slug IN ('home', 'about', 'coaches', 'events', 'contact')
)
INSERT INTO content_blocks (
  page_id,
  block_type,
  content,
  published_version,
  sort_order,
  is_visible,
  status,
  requires_approval
)
SELECT
  rows_to_insert.page_id,
  rows_to_insert.block_type,
  rows_to_insert.content,
  rows_to_insert.content AS published_version,
  rows_to_insert.sort_order,
  true,
  'published'::content_status,
  rows_to_insert.requires_approval
FROM (
  -- HOME
  SELECT
    cp.page_id,
    'hero'::block_type,
    jsonb_build_object(
      'headline', CONCAT(cp.chapter_name, ' - Action Learning in Motion'),
      'subheadline', CONCAT('Develop leaders and solve real organizational challenges with ', cp.chapter_name, '.'),
      'cta_primary_text', 'Find a Coach',
      'cta_primary_href', CONCAT('/', cp.chapter_slug, '/coaches'),
      'cta_secondary_text', 'Upcoming Events',
      'cta_secondary_href', CONCAT('/', cp.chapter_slug, '/events'),
      'background_image_url', NULL
    ) AS content,
    0 AS sort_order,
    true AS requires_approval
  FROM chapter_pages cp
  WHERE cp.page_slug = 'home'

  UNION ALL

  SELECT
    cp.page_id,
    'stats'::block_type,
    jsonb_build_object(
      'heading', 'Chapter Snapshot',
      'items', jsonb_build_array(
        jsonb_build_object('label', 'Certified Coaches', 'value', '35+'),
        jsonb_build_object('label', 'Annual Workshops', 'value', '20+'),
        jsonb_build_object('label', 'Organizations Supported', 'value', '120+'),
        jsonb_build_object('label', 'Avg. Participant Rating', 'value', '4.8/5')
      )
    ),
    1,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'home'

  UNION ALL

  SELECT
    cp.page_id,
    'coach_list'::block_type,
    jsonb_build_object('heading', 'Featured Coaches', 'limit', 8),
    2,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'home'

  UNION ALL

  SELECT
    cp.page_id,
    'event_list'::block_type,
    jsonb_build_object('heading', 'Upcoming Events', 'limit', 6, 'show_past', false),
    3,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'home'

  UNION ALL

  SELECT
    cp.page_id,
    'cta'::block_type,
    jsonb_build_object(
      'heading', 'Bring Action Learning to Your Team',
      'subheading', 'Connect with a certified coach and start with a real business challenge.',
      'button_text', 'Contact Chapter',
      'button_href', CONCAT('/', cp.chapter_slug, '/contact'),
      'variant', 'dark'
    ),
    4,
    true
  FROM chapter_pages cp
  WHERE cp.page_slug = 'home'

  UNION ALL

  -- ABOUT
  SELECT
    cp.page_id,
    'text'::block_type,
    jsonb_build_object(
      'heading', CONCAT('About ', cp.chapter_name),
      'body', jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(
              jsonb_build_object(
                'type', 'text',
                'text', CONCAT(cp.chapter_name, ' helps leaders solve urgent organizational challenges while developing stronger teams through Action Learning practice.')
              )
            )
          ),
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(
              jsonb_build_object(
                'type', 'text',
                'text', 'Our coaches facilitate structured reflection, practical action, and measurable follow-through.'
              )
            )
          )
        )
      )
    ),
    0,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'about'

  UNION ALL

  SELECT
    cp.page_id,
    'team_grid'::block_type,
    jsonb_build_object(
      'heading', 'Chapter Leadership Team',
      'members', jsonb_build_array(
        jsonb_build_object('name', 'Avery Morgan', 'title', 'Chapter Director', 'bio', 'Leads chapter strategy and partnerships.', 'photo_url', NULL),
        jsonb_build_object('name', 'Jordan Lee', 'title', 'Programs Lead', 'bio', 'Designs certification and workshop pathways.', 'photo_url', NULL),
        jsonb_build_object('name', 'Samira Patel', 'title', 'Coach Development', 'bio', 'Mentors new coaches and supports quality assurance.', 'photo_url', NULL),
        jsonb_build_object('name', 'Daniel Okoro', 'title', 'Community Lead', 'bio', 'Builds member engagement and chapter events.', 'photo_url', NULL)
      )
    ),
    1,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'about'

  UNION ALL

  SELECT
    cp.page_id,
    'faq'::block_type,
    jsonb_build_object(
      'heading', 'Frequently Asked Questions',
      'items', jsonb_build_array(
        jsonb_build_object('question', 'Who can join chapter events?', 'answer', 'Events are open to leaders, facilitators, and professionals interested in Action Learning.'),
        jsonb_build_object('question', 'Do I need prior certification?', 'answer', 'No. Introductory workshops are designed for new practitioners.'),
        jsonb_build_object('question', 'How do I find a coach?', 'answer', 'Use the coach directory page and filter by location, chapter, and certification level.')
      )
    ),
    2,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'about'

  UNION ALL

  -- COACHES
  SELECT
    cp.page_id,
    'text'::block_type,
    jsonb_build_object(
      'heading', 'Certified Coach Directory',
      'body', jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(
              jsonb_build_object(
                'type', 'text',
                'text', 'Browse chapter coaches by expertise, certification level, and location.'
              )
            )
          )
        )
      )
    ),
    0,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'coaches'

  UNION ALL

  SELECT
    cp.page_id,
    'coach_list'::block_type,
    jsonb_build_object('heading', 'Meet Our Coaches', 'limit', 12),
    1,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'coaches'

  UNION ALL

  SELECT
    cp.page_id,
    'cta'::block_type,
    jsonb_build_object(
      'heading', 'Need Help Picking a Coach?',
      'subheading', 'Share your goals and we will connect you with the best fit.',
      'button_text', 'Contact Us',
      'button_href', CONCAT('/', cp.chapter_slug, '/contact'),
      'variant', 'light'
    ),
    2,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'coaches'

  UNION ALL

  -- EVENTS
  SELECT
    cp.page_id,
    'text'::block_type,
    jsonb_build_object(
      'heading', 'Workshops, Labs, and Certification Events',
      'body', jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(
              jsonb_build_object('type', 'text', 'text', 'Explore upcoming chapter and global events designed to build practical Action Learning capability.')
            )
          )
        )
      )
    ),
    0,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'events'

  UNION ALL

  SELECT
    cp.page_id,
    'event_list'::block_type,
    jsonb_build_object('heading', 'Upcoming Sessions', 'limit', 9, 'show_past', false),
    1,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'events'

  UNION ALL

  -- CONTACT
  SELECT
    cp.page_id,
    'text'::block_type,
    jsonb_build_object(
      'heading', CONCAT('Contact ', cp.chapter_name),
      'body', jsonb_build_object(
        'type', 'doc',
        'content', jsonb_build_array(
          jsonb_build_object(
            'type', 'paragraph',
            'content', jsonb_build_array(
              jsonb_build_object('type', 'text', 'text', 'Tell us what challenge your team is facing and we will respond with next-step recommendations.')
            )
          )
        )
      )
    ),
    0,
    false
  FROM chapter_pages cp
  WHERE cp.page_slug = 'contact'

  UNION ALL

  SELECT
    cp.page_id,
    'contact_form'::block_type,
    jsonb_build_object(
      'heading', 'Send Us a Message',
      'subheading', 'We typically respond within 2 business days.',
      'recipient_email', CONCAT(cp.chapter_slug, '@wial.edu')
    ),
    1,
    true
  FROM chapter_pages cp
  WHERE cp.page_slug = 'contact'
) AS rows_to_insert
WHERE NOT EXISTS (
  SELECT 1
  FROM content_blocks cb
  WHERE cb.page_id = rows_to_insert.page_id
    AND cb.block_type = rows_to_insert.block_type
    AND cb.sort_order = rows_to_insert.sort_order
);

-- ------------------------------------------------------------
-- 4) Seed events (chapter + global)
-- ------------------------------------------------------------
-- Chapter events: 3 per active chapter.
INSERT INTO events (
  chapter_id,
  title,
  description,
  event_type,
  start_date,
  end_date,
  timezone,
  location_name,
  is_virtual,
  virtual_link,
  max_attendees,
  registration_url,
  image_url,
  is_published,
  created_by
)
SELECT
  c.id,
  CONCAT(c.name, ' Leadership Lab ', gs.n),
  'Hands-on Action Learning session for leaders and facilitators.',
  CASE (gs.n % 5)
    WHEN 1 THEN 'workshop'::event_type
    WHEN 2 THEN 'webinar'::event_type
    WHEN 3 THEN 'conference'::event_type
    WHEN 4 THEN 'certification'::event_type
    ELSE 'networking'::event_type
  END,
  NOW() + make_interval(days => gs.n * 14),
  NOW() + make_interval(days => gs.n * 14, hours => 2),
  c.timezone,
  CASE WHEN gs.n % 2 = 0 THEN NULL ELSE CONCAT(c.name, ' Training Center') END,
  CASE WHEN gs.n % 2 = 0 THEN true ELSE false END,
  CASE WHEN gs.n % 2 = 0 THEN CONCAT('https://meet.wial.test/', c.slug, '-lab-', gs.n) ELSE NULL END,
  80 + (gs.n * 10),
  CONCAT('https://events.wial.test/register/', c.slug, '-lab-', gs.n),
  NULL,
  true,
  NULL
FROM chapters c
CROSS JOIN generate_series(1, 3) AS gs(n)
WHERE c.is_active = true
  AND NOT EXISTS (
    SELECT 1
    FROM events e
    WHERE e.chapter_id = c.id
      AND e.title = CONCAT(c.name, ' Leadership Lab ', gs.n)
  );

-- Global events: 4 records.
INSERT INTO events (
  chapter_id,
  title,
  description,
  event_type,
  start_date,
  end_date,
  timezone,
  location_name,
  is_virtual,
  virtual_link,
  max_attendees,
  registration_url,
  image_url,
  is_published,
  created_by
)
SELECT
  NULL,
  g.title,
  g.description,
  g.event_type,
  g.start_date,
  g.end_date,
  'UTC',
  NULL,
  true,
  g.virtual_link,
  400,
  g.registration_url,
  NULL,
  true,
  NULL
FROM (
  VALUES
    (
      'WIAL Global Certification Intensive',
      'Multi-day virtual intensive for coaches preparing for next-level certification.',
      'certification'::event_type,
      NOW() + INTERVAL '21 days',
      NOW() + INTERVAL '23 days',
      'https://meet.wial.test/global-cert-intensive',
      'https://events.wial.test/register/global-cert-intensive'
    ),
    (
      'WIAL Global Practice Exchange',
      'Cross-chapter case exchange focused on real-world facilitation challenges.',
      'webinar'::event_type,
      NOW() + INTERVAL '35 days',
      NOW() + INTERVAL '35 days 2 hours',
      'https://meet.wial.test/global-practice-exchange',
      'https://events.wial.test/register/global-practice-exchange'
    ),
    (
      'WIAL Global Leadership Forum',
      'Quarterly forum on Action Learning strategy and impact evidence.',
      'conference'::event_type,
      NOW() + INTERVAL '56 days',
      NOW() + INTERVAL '56 days 3 hours',
      'https://meet.wial.test/global-leadership-forum',
      'https://events.wial.test/register/global-leadership-forum'
    ),
    (
      'WIAL Coach Community Networking',
      'Community networking session for certified coaches across all chapters.',
      'networking'::event_type,
      NOW() + INTERVAL '70 days',
      NOW() + INTERVAL '70 days 90 minutes',
      'https://meet.wial.test/global-networking',
      'https://events.wial.test/register/global-networking'
    )
) AS g(title, description, event_type, start_date, end_date, virtual_link, registration_url)
WHERE NOT EXISTS (
  SELECT 1
  FROM events e
  WHERE e.chapter_id IS NULL
    AND e.title = g.title
);

-- ------------------------------------------------------------
-- 5) Seed payments for visual dashboards (one per first 20 coaches)
-- ------------------------------------------------------------
WITH coach_base AS (
  SELECT
    cp.user_id,
    cp.chapter_id,
    ROW_NUMBER() OVER (ORDER BY cp.created_at, cp.user_id) AS rn
  FROM coach_profiles cp
  WHERE cp.is_published = true
),
seed_rows AS (
  SELECT
    cb.user_id,
    cb.chapter_id,
    cb.rn,
    CONCAT('pi_seed_', cb.rn, '_', SUBSTRING(REPLACE(cb.user_id::text, '-', ''), 1, 12)) AS payment_intent_id,
    CONCAT('cs_seed_', cb.rn, '_', SUBSTRING(REPLACE(cb.user_id::text, '-', ''), 1, 12)) AS checkout_id,
    CASE
      WHEN cb.rn % 4 = 0 THEN 'event_registration'::payment_type
      WHEN cb.rn % 3 = 0 THEN 'certification_fee'::payment_type
      ELSE 'membership_dues'::payment_type
    END AS ptype,
    CASE
      WHEN cb.rn % 4 = 0 THEN 5000
      WHEN cb.rn % 3 = 0 THEN 3000
      ELSE 12000
    END AS amount_cents
  FROM coach_base cb
  WHERE cb.rn <= 20
)
INSERT INTO payments (
  user_id,
  chapter_id,
  stripe_payment_intent_id,
  stripe_checkout_session_id,
  amount,
  currency,
  payment_type,
  status,
  receipt_url,
  metadata
)
SELECT
  s.user_id,
  s.chapter_id,
  s.payment_intent_id,
  s.checkout_id,
  s.amount_cents,
  'USD',
  s.ptype,
  'succeeded'::payment_status,
  CONCAT('https://receipts.wial.test/', s.checkout_id),
  jsonb_build_object('seed', 'sprint3_dummy_data.sql', 'batch', 'sprint3')
FROM seed_rows s
WHERE NOT EXISTS (
  SELECT 1
  FROM payments p
  WHERE p.user_id = s.user_id
    AND p.payment_type = s.ptype
);

COMMIT;

-- Quick verification snippets (optional):
-- SELECT role, COUNT(*) FROM profiles GROUP BY role ORDER BY role;
-- SELECT COUNT(*) AS coach_profiles_count FROM coach_profiles;
-- SELECT chapter_id, COUNT(*) FROM events GROUP BY chapter_id;
-- SELECT payment_type, COUNT(*) FROM payments GROUP BY payment_type;
