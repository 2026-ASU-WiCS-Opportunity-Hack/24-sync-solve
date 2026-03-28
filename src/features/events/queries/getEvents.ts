import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Event } from '@/types'

/**
 * Fetch upcoming published events (global + chapter-specific).
 */
export async function getUpcomingEvents(
  supabase: SupabaseClient<Database>,
  options: {
    chapterId?: string
    includeGlobal?: boolean
    limit?: number
  } = {}
): Promise<Event[]> {
  const { chapterId, includeGlobal = true, limit = 10 } = options
  const now = new Date().toISOString()

  let query = supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .gte('start_date', now)
    .order('start_date', { ascending: true })
    .limit(limit)

  if (chapterId && includeGlobal) {
    // Chapter events + global events
    query = query.or(`chapter_id.eq.${chapterId},chapter_id.is.null`)
  } else if (chapterId && !includeGlobal) {
    // Chapter events only
    query = query.eq('chapter_id', chapterId)
  } else if (!chapterId && !includeGlobal) {
    // Global events only
    query = query.is('chapter_id', null)
  }
  // No filter = all events

  const { data, error } = await query
  if (error || !data) return []
  return data
}
