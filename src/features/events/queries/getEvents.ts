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
  /** Full-text search on event title */
  search?: string
  /** Sort order. Defaults to date_asc for upcoming, date_desc for past. */
  sort?: 'date_asc' | 'date_desc' | 'title_asc'
}

/**
 * Fetch published events with optional chapter, type, date, search, and sort filters.
 */
export async function getUpcomingEvents(
  supabase: SupabaseClient<Database>,
  options: EventFilters = {}
): Promise<Event[]> {
  const {
    chapterId,
    includeGlobal = true,
    type,
    upcoming = true,
    limit = 10,
    search,
    sort,
  } = options

  const ascending = sort === 'date_desc' ? false : sort !== 'title_asc'
  const orderColumn = sort === 'title_asc' ? 'title' : 'start_date'

  let query = supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .order(orderColumn, { ascending })
    .limit(limit)

  if (upcoming) {
    query = query.gte('start_date', new Date().toISOString())
  }

  if (type) {
    query = query.eq('event_type', type)
  }

  if (search) {
    query = query.ilike('title', `%${search}%`)
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
 * Fetch events a user has registered for (confirmed or pending registrations).
 */
export async function getMyRegisteredEvents(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<(Event & { registration_status: string; registered_at: string })[]> {
  const { data, error } = await supabase
    .from('event_registrations')
    .select('status, registered_at, events(*)')
    .eq('user_id', userId)
    .in('status', ['confirmed', 'pending'])
    .order('registered_at', { ascending: false })
    .limit(20)

  if (error || !data) return []

  return data
    .filter((row) => row.events !== null)
    .map((row) => ({
      ...(row.events as unknown as Event),
      registration_status: row.status,
      registered_at: row.registered_at,
    }))
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
