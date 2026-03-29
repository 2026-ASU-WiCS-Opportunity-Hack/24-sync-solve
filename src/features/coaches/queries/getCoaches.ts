import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CoachProfile, PaginatedResult } from '@/types'
import type { CertificationLevel } from '@/types/database'
import { COACH_PAGE_SIZE } from '@/lib/utils/constants'
import { CERTIFICATION_LABELS } from '@/lib/utils/constants'
import { getEmbedding } from '@/features/search/utils/embeddings'
import { createAdminClient } from '@/lib/supabase/admin'

interface CoachFilters {
  q?: string
  searchMode?: 'semantic' | 'text' // default is 'text'
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
  similarityScore?: number
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
  const queryText = filters.q?.trim() ?? ''
  const hasQuery = queryText.length > 0
  const searchMode = filters.searchMode ?? 'text'
  const isSemanticSearch = hasQuery && searchMode === 'semantic'
  const isTextSearch = hasQuery && searchMode === 'text'

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

  let matchedCoachIds: string[] | null = null
  let matchScores: Record<string, number> = {}

  // Semantic/Full-text search override
  if (hasQuery) {
    if (isSemanticSearch) {
      try {
        // Get embedding for the user's natural language query
        const embedding = await getEmbedding(queryText)

        // Look up coach documents natively via RPC using admin client to bypass RLS on coach_search_documents table
        const adminClient = createAdminClient()
        const { data, error: rpcError } = await (adminClient as any).rpc('match_coach_documents', {
          query_embedding: embedding as any,
          match_threshold: 0.8,
          match_count: limit + 10, // Grab a bit extra for pagination margin
        })

        if (rpcError) {
          console.error('RPC Error from Supabase:', rpcError)
        }

        const matches = data as { coach_id: string; similarity: number }[] | null
        console.log('Semantic search matches count:', matches?.length || 0)

        if (matches && matches.length > 0) {
          matchedCoachIds = matches.map((m: any) => m.coach_id)
          matches.forEach((m: any) => {
            matchScores[m.coach_id] = m.similarity
          })
        } else {
          matchedCoachIds = [] // Found nothing
        }
      } catch (err) {
        console.warn('Semantic search failed, falling back to text search:', err)
        // Fallback
      }
    }

    if (matchedCoachIds !== null) {
      if (matchedCoachIds.length === 0) {
        // Force an empty result by creating an impossible condition
        query = query.eq('id', '00000000-0000-0000-0000-000000000000')
      } else {
        query = query.in('id', matchedCoachIds)
      }
    }
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
  if (filters.cursor && !isTextSearch) {
    query = query.gt('id', filters.cursor)
  }

  // Order and limit
  if (matchedCoachIds && matchedCoachIds.length > 0) {
    // If it's a semantic search, don't standard order yet - we will sort in memory
    query = query.limit(limit + 1)
  } else if (isTextSearch) {
    // Pull a broad candidate set, then do deterministic normalized text filtering in memory.
    query = query.order('id', { ascending: true }).limit(1000)
  } else {
    query = query.order('id', { ascending: true }).limit(limit + 1)
  }

  const { data, error } = await query

  if (error || !data) {
    return { items: [], nextCursor: null }
  }

  let finalData = data

  if (isTextSearch) {
    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

    const queryTokens = normalize(queryText).split(/\s+/).filter(Boolean)

    finalData = finalData.filter((coach) => {
      const certLabel = CERTIFICATION_LABELS[coach.certification_level] ?? ''
      const searchable = normalize(
        [
          coach.profile?.full_name ?? '',
          coach.certification_level ?? '',
          certLabel,
          coach.location_city ?? '',
          coach.location_country ?? '',
          coach.bio ?? '',
          (coach.specializations ?? []).join(' '),
        ].join(' ')
      )

      return queryTokens.every((token) => searchable.includes(token))
    })

    if (filters.cursor) {
      finalData = finalData.filter((coach) => coach.id > filters.cursor!)
    }
  }

  if (matchedCoachIds && matchedCoachIds.length > 0) {
    // Sort finalData by the original similarity order returned from the RPC
    finalData.sort((a, b) => {
      const indexA = matchedCoachIds!.indexOf(a.id)
      const indexB = matchedCoachIds!.indexOf(b.id)
      return indexA - indexB
    })
  }

  const hasMore = finalData.length > limit
  const items = hasMore ? finalData.slice(0, limit) : finalData
  const nextCursor = hasMore ? (items[items.length - 1]?.id ?? null) : null

  const itemsWithScores = items.map((item) => ({
    ...item,
    similarityScore: matchScores[item.id],
  }))

  return {
    items: itemsWithScores as CoachWithBasicProfile[],
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
