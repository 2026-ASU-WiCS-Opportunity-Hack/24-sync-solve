import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Chapter } from '@/types'

export interface ChapterWithStats extends Chapter {
  coach_count: number
  event_count: number
}

export interface AdminDashboardStats {
  chapterCount: number
  coachCount: number
  userCount: number
  pendingApprovals: number
  totalPayments: number
}

/**
 * Fetch all chapters (including inactive) for admin listing.
 * Returns chapters ordered by name with coach and event counts.
 */
export async function getAllChaptersAdmin(
  supabase: SupabaseClient<Database>
): Promise<ChapterWithStats[]> {
  const { data: chapters, error } = await supabase.from('chapters').select('*').order('name')

  if (error || !chapters) return []

  // Fetch coach counts per chapter
  const { data: coachCounts } = await supabase
    .from('coach_profiles')
    .select('chapter_id')
    .eq('is_published', true)

  // Fetch event counts per chapter
  const { data: eventCounts } = await supabase
    .from('events')
    .select('chapter_id')
    .eq('is_published', true)

  const coachMap: Record<string, number> = {}
  for (const c of coachCounts ?? []) {
    if (c.chapter_id) {
      coachMap[c.chapter_id] = (coachMap[c.chapter_id] ?? 0) + 1
    }
  }

  const eventMap: Record<string, number> = {}
  for (const e of eventCounts ?? []) {
    if (e.chapter_id) {
      eventMap[e.chapter_id] = (eventMap[e.chapter_id] ?? 0) + 1
    }
  }

  return chapters.map((ch) => ({
    ...ch,
    coach_count: coachMap[ch.id] ?? 0,
    event_count: eventMap[ch.id] ?? 0,
  }))
}

/**
 * Fetch a single chapter by UUID (for admin edit form).
 */
export async function getChapterById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Chapter | null> {
  const { data, error } = await supabase.from('chapters').select('*').eq('id', id).single()

  if (error || !data) return null
  return data
}

/**
 * Aggregate stats for the admin dashboard overview.
 */
export async function getAdminDashboardStats(
  supabase: SupabaseClient<Database>
): Promise<AdminDashboardStats> {
  const [chapters, coaches, users, approvals, payments] = await Promise.all([
    supabase.from('chapters').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('coach_profiles').select('id', { count: 'exact', head: true }),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('content_blocks')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending_approval'),
    supabase
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'succeeded'),
  ])

  return {
    chapterCount: chapters.count ?? 0,
    coachCount: coaches.count ?? 0,
    userCount: users.count ?? 0,
    pendingApprovals: approvals.count ?? 0,
    totalPayments: payments.count ?? 0,
  }
}
