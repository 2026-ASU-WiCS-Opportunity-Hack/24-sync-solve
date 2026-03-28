/**
 * WIAL Platform — Seed Data Generator
 *
 * Populates the database with realistic test data:
 *   - 5 test user accounts (one super admin, one chapter lead per chapter, and coaches)
 *   - 50 coach profiles spread across chapters
 *   - 15 upcoming events across chapters
 *
 * Usage:
 *   npm run db:seed
 *
 * Requirements:
 *   - Supabase project must be running (local or remote)
 *   - NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set
 *   - Run `supabase db reset` first to apply all migrations cleanly
 *
 * Note: Set env vars before running:
 *   export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
 *   export SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
 */

import { createClient } from '@supabase/supabase-js'
import { faker } from '@faker-js/faker'
import type { Database } from '../src/types/database'

// ── Environment ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL']
const SERVICE_ROLE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '❌ Missing environment variables.\n' +
      '   Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.\n' +
      '   For local Supabase: run `supabase status` to get these values.'
  )
  process.exit(1)
}

const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ── Constants ───────────────────────────────────────────────────────────────────

const CHAPTER_SLUGS = ['usa', 'nigeria', 'brazil', 'uk', 'australia'] as const

const CERTIFICATION_LEVELS = ['CALC', 'PALC', 'SALC', 'MALC'] as const

const SPECIALIZATIONS_POOL = [
  'Leadership Development',
  'Team Performance',
  'Organizational Change',
  'Executive Coaching',
  'Strategic Planning',
  'Innovation',
  'Cross-Cultural Communication',
  'Conflict Resolution',
  'Systems Thinking',
  'Facilitation',
  'Organizational Learning',
  'Employee Engagement',
  'Talent Development',
  'Healthcare Leadership',
  'NGO Leadership',
  'Government & Public Sector',
  'Educational Leadership',
]

const LANGUAGES_POOL = [
  'English',
  'Spanish',
  'Portuguese',
  'French',
  'Arabic',
  'Yoruba',
  'Igbo',
  'German',
  'Mandarin',
  'Japanese',
]

const EVENT_TYPES = ['workshop', 'webinar', 'conference', 'certification', 'networking'] as const

// ── Helpers ──────────────────────────────────────────────────────────────────────

function randomSubset<T>(arr: readonly T[], min = 1, max = 3): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  const count = faker.number.int({ min, max: Math.min(max, arr.length) })
  return shuffled.slice(0, count)
}

function randomDate(daysFromNow: number): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString()
}

// ── Seed Functions ───────────────────────────────────────────────────────────────

async function getChapterIds(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from('chapters').select('id, slug').eq('is_active', true)

  if (error || !data || data.length === 0) {
    throw new Error(
      'No chapters found. Run `supabase db reset` to apply migrations including 00004_seed.sql first.'
    )
  }

  const map: Record<string, string> = {}
  for (const ch of data) {
    map[ch.slug] = ch.id
  }
  return map
}

async function seedSuperAdmin(): Promise<string> {
  console.log('  Creating super admin user...')

  const { data, error } = await supabase.auth.admin.createUser({
    email: 'admin@wial.test',
    password: 'Password123!',
    email_confirm: true,
    user_metadata: { full_name: 'WIAL Administrator' },
  })

  if (error && !error.message.includes('already')) {
    throw new Error(`Failed to create super admin: ${error.message}`)
  }

  const userId = data?.user?.id
  if (!userId) {
    // Try to fetch existing user
    const { data: list } = await supabase.auth.admin.listUsers()
    const existing = list?.users?.find((u) => u.email === 'admin@wial.test')
    if (!existing) throw new Error('Could not find or create super admin user')
    return existing.id
  }

  // Update role to super_admin
  await supabase
    .from('profiles')
    .update({ role: 'super_admin', full_name: 'WIAL Administrator' })
    .eq('id', userId)

  console.log(`    ✔ admin@wial.test (password: Password123!)`)
  return userId
}

async function seedChapterLeads(chapterIds: Record<string, string>): Promise<void> {
  console.log('  Creating chapter lead users...')

  for (const slug of CHAPTER_SLUGS) {
    const chapterId = chapterIds[slug]
    if (!chapterId) continue

    const email = `${slug}.lead@wial.test`
    const fullName = `${slug.charAt(0).toUpperCase() + slug.slice(1)} Chapter Lead`

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (error && !error.message.includes('already')) {
      console.warn(`    ⚠ Failed to create ${email}: ${error.message}`)
      continue
    }

    const userId = data?.user?.id
    if (!userId) continue

    await supabase
      .from('profiles')
      .update({ role: 'chapter_lead', chapter_id: chapterId, full_name: fullName })
      .eq('id', userId)

    console.log(`    ✔ ${email}`)
  }
}

async function seedCoaches(chapterIds: Record<string, string>): Promise<void> {
  console.log('  Creating 50 coach profiles...')

  const chapterSlugList = Object.keys(chapterIds)
  let created = 0

  for (let i = 0; i < 50; i++) {
    const slug = chapterSlugList[i % chapterSlugList.length]!
    const chapterId = chapterIds[slug]!

    const firstName = faker.person.firstName()
    const lastName = faker.person.lastName()
    const fullName = `${firstName} ${lastName}`
    const email = faker.internet.email({ firstName, lastName, provider: 'wial.test' }).toLowerCase()

    // Create auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password: 'Password123!',
      email_confirm: true,
      user_metadata: { full_name: fullName },
    })

    if (error && !error.message.includes('already')) {
      console.warn(`    ⚠ Skipping ${email}: ${error.message}`)
      continue
    }

    const userId = data?.user?.id
    if (!userId) continue

    // Set profile role to 'coach'
    await supabase
      .from('profiles')
      .update({ role: 'coach', chapter_id: chapterId, full_name: fullName })
      .eq('id', userId)

    // Create coach profile
    const certLevel = CERTIFICATION_LEVELS[i % CERTIFICATION_LEVELS.length]!
    const certDate = faker.date.past({ years: 5 }).toISOString().split('T')[0]!

    const { error: coachError } = await supabase.from('coach_profiles').insert({
      user_id: userId,
      chapter_id: chapterId,
      certification_level: certLevel,
      bio: faker.lorem.paragraphs(2),
      specializations: randomSubset(SPECIALIZATIONS_POOL, 2, 4),
      languages: randomSubset(LANGUAGES_POOL, 1, 3),
      location_city: faker.location.city(),
      location_country: faker.location.countryCode('alpha-2'),
      contact_email: email,
      linkedin_url: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${faker.string.alphanumeric(5)}`,
      is_published: true,
      is_verified: true,
      certification_date: certDate,
      recertification_due: new Date(
        new Date(certDate).setFullYear(new Date(certDate).getFullYear() + 3)
      )
        .toISOString()
        .split('T')[0]!,
      coaching_hours: faker.number.int({ min: 20, max: 500 }),
    })

    if (coachError && !coachError.message.includes('already')) {
      console.warn(`    ⚠ Failed to create coach profile for ${email}: ${coachError.message}`)
    } else {
      created++
    }
  }

  console.log(`    ✔ Created ${created} coach profiles`)
}

async function seedEvents(chapterIds: Record<string, string>): Promise<void> {
  console.log('  Creating 15 upcoming events...')

  const chapterIdList = Object.values(chapterIds)
  const events = []

  // 10 chapter events + 5 global events
  for (let i = 0; i < 10; i++) {
    const chapterId = chapterIdList[i % chapterIdList.length]!
    const isVirtual = faker.datatype.boolean()
    const eventType = EVENT_TYPES[i % EVENT_TYPES.length]!
    const startDays = faker.number.int({ min: 3, max: 120 })
    const durationDays = faker.number.int({ min: 0, max: 2 })

    events.push({
      chapter_id: chapterId,
      title: `${faker.company.catchPhrase()} — ${eventType.charAt(0).toUpperCase() + eventType.slice(1)}`,
      description: faker.lorem.sentence(),
      event_type: eventType,
      start_date: randomDate(startDays),
      end_date: durationDays > 0 ? randomDate(startDays + durationDays) : null,
      timezone: 'America/New_York',
      location_name: isVirtual ? null : faker.location.city(),
      is_virtual: isVirtual,
      virtual_link: isVirtual ? 'https://zoom.us/j/example' : null,
      max_attendees: faker.number.int({ min: 20, max: 200 }),
      registration_url: `https://events.wial.edu/register/${faker.string.alphanumeric(8)}`,
      is_published: true,
    })
  }

  // 5 global events (no chapter)
  for (let i = 0; i < 5; i++) {
    const isVirtual = true
    const eventType = EVENT_TYPES[i % EVENT_TYPES.length]!
    const startDays = faker.number.int({ min: 14, max: 180 })

    events.push({
      chapter_id: null,
      title: `WIAL Global ${eventType.charAt(0).toUpperCase() + eventType.slice(1)} ${new Date().getFullYear()}`,
      description: faker.lorem.sentence(),
      event_type: eventType,
      start_date: randomDate(startDays),
      end_date: null,
      timezone: 'UTC',
      location_name: null,
      is_virtual: isVirtual,
      virtual_link: 'https://zoom.us/j/wial-global',
      max_attendees: 500,
      registration_url: `https://events.wial.edu/register/global-${faker.string.alphanumeric(6)}`,
      is_published: true,
    })
  }

  const { error } = await supabase.from('events').insert(events)
  if (error) {
    throw new Error(`Failed to seed events: ${error.message}`)
  }

  console.log(`    ✔ Created ${events.length} events`)
}

// ── Main ──────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 WIAL Platform — Seeding database...\n')

  try {
    // Verify migrations have run by checking for chapters
    const chapterIds = await getChapterIds()
    console.log(`  Found chapters: ${Object.keys(chapterIds).join(', ')}\n`)

    // Seed test users
    console.log('👤 Users:')
    await seedSuperAdmin()
    await seedChapterLeads(chapterIds)

    // Seed coaches
    console.log('\n🎓 Coaches:')
    await seedCoaches(chapterIds)

    // Seed events
    console.log('\n📅 Events:')
    await seedEvents(chapterIds)

    console.log('\n✅ Seed complete!\n')
    console.log('Test accounts (password: Password123!):')
    console.log('  Super admin:    admin@wial.test')
    console.log('  Chapter leads:  usa.lead@wial.test, nigeria.lead@wial.test, ...')
    console.log()
  } catch (err) {
    console.error('\n❌ Seed failed:', err)
    process.exit(1)
  }
}

void main()
