import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CoachProfile, PaginatedResult } from '@/types'
import type { CertificationLevel } from '@/types/database'
import { COACH_PAGE_SIZE } from '@/lib/utils/constants'

interface CoachFilters {
  q?: string
  certification?: CertificationLevel
  country?: string
  chapterId?: string
  cursor?: string
  limit?: number
}

export interface CoachWithBasicProfile extends CoachProfile {
  profile: {
    full_name: string | null
    email: string
    avatar_url: string | null
  } | null
}

/**
 * Fetch coaches from the directory with search and filters.
 * Uses PostgreSQL full-text search via the search_vector tsvector column.
 */
export async function getCoaches(
  supabase: SupabaseClient<Database>,
  filters: CoachFilters = {}
): Promise<PaginatedResult<CoachWithBasicProfile>> {
  const limit = filters.limit ?? COACH_PAGE_SIZE

  let query = supabase
    .from('coach_profiles')
    .select(
      `
      *,
      profile:profiles!coach_profiles_user_id_fkey (
        full_name,
        email,
        avatar_url
      )
    `
    )
    .eq('is_published', true)
    .eq('is_verified', true)

  // Full-text search
  if (filters.q && filters.q.trim()) {
    query = query.textSearch('search_vector', filters.q, { type: 'websearch' })
  }

  // Certification filter
  if (filters.certification) {
    query = query.eq('certification_level', filters.certification)
  }

  // Country filter
  if (filters.country) {
    query = query.eq('location_country', filters.country)
  }

  // Chapter filter
  if (filters.chapterId) {
    query = query.eq('chapter_id', filters.chapterId)
  }

  // Cursor-based pagination
  if (filters.cursor) {
    query = query.gt('id', filters.cursor)
  }

  // Order and limit
  query = query.order('id', { ascending: true }).limit(limit + 1)

  const { data, error } = await query

  if (error || !data) {
    return { items: [], nextCursor: null }
  }

  const hasMore = data.length > limit
  const items = hasMore ? data.slice(0, limit) : data
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null

  return {
    items: items as CoachWithBasicProfile[],
    nextCursor,
  }
}

/**
 * Fetch a single coach profile by user_id.
 */
export async function getCoachByUserId(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<CoachWithBasicProfile | null> {
  const { data, error } = await supabase
    .from('coach_profiles')
    .select(
      `
      *,
      profile:profiles!coach_profiles_user_id_fkey (
        full_name,
        email,
        avatar_url
      )
    `
    )
    .eq('user_id', userId)
    .single()

  if (error || !data) return null
  return data as CoachWithBasicProfile
}
