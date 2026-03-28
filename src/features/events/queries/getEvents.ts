import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Event } from '@/types'
import type { EventType } from '@/types/database'

export interface EventFilters {
  chapterId?: string
  /** Include global events (chapter_id IS NULL). Defaults to true. */
  includeGlobal?: boolean
  /** Filter to a specific event type */
  type?: EventType
  /** Only return upcoming events (start_date >= now). Defaults to true. */
  upcoming?: boolean
  limit?: number
}

/**
 * Fetch published events with optional chapter, type, and date filters.
 */
export async function getUpcomingEvents(
  supabase: SupabaseClient<Database>,
  options: EventFilters = {}
): Promise<Event[]> {
  const { chapterId, includeGlobal = true, type, upcoming = true, limit = 10 } = options

  let query = supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order('start_date', { ascending: true })
    .limit(limit)

  if (upcoming) {
    query = query.gte('start_date', new Date().toISOString())
  }

  if (type) {
    query = query.eq('event_type', type)
  }

  if (chapterId && includeGlobal) {
    query = query.or(`chapter_id.eq.${chapterId},chapter_id.is.null`)
  } else if (chapterId && !includeGlobal) {
    query = query.eq('chapter_id', chapterId)
  } else if (!chapterId && !includeGlobal) {
    query = query.is('chapter_id', null)
  }

  const { data, error } = await query
  if (error || !data) return []
  return data
}

/**
 * Fetch a single published event by ID.
 */
export async function getEventById(
  supabase: SupabaseClient<Database>,
  eventId: string
): Promise<Event | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .eq('is_published', true)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Fetch all events for a chapter (including unpublished) for chapter lead management.
 */
export async function getChapterEventsForAdmin(
  supabase: SupabaseClient<Database>,
  chapterId: string,
  options: { limit?: number; offset?: number } = {}
): Promise<{ items: Event[]; total: number }> {
  const { limit = 50, offset = 0 } = options

  const { data, error, count } = await supabase
    .from('events')
    .select('*', { count: 'exact' })
    .eq('chapter_id', chapterId)
    .order('start_date', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error || !data) return { items: [], total: 0 }
  return { items: data, total: count ?? 0 }
}
