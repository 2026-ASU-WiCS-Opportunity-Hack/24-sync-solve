'use server'
import { embed } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import {
  getCoachMapByResourceIds,
  getCourseMapByCoachIds,
  type CoursePreview,
  type TeachingCoachPreview,
} from '@/features/resources/queries/getCoachCourseMappings'

interface KnowledgeResourceResult {
  id: string
  title: string
  description: string | null
  type: 'video' | 'article' | 'pdf' | 'link' | 'webinar'
  url: string
  tags?: string[]
  summary?: string | null
  key_findings?: unknown
  translations?: unknown
  authors?: string[] | null
  presenter?: string | null
  teachingCoaches?: TeachingCoachPreview[]
}

interface KnowledgeCoachResult {
  id: string
  user_id: string
  bio: string | null
  specializations: string[]
  location_city: string | null
  location_country: string | null
  certification_level: string
  profiles: {
    full_name: string | null
    avatar_url: string | null
  } | null
  courses: CoursePreview[]
}

function matchesCoachQuery(coach: KnowledgeCoachResult, query: string): boolean {
  const normalizedQuery = query.trim().toLowerCase()
  if (!normalizedQuery) return false

  const haystack = [
    coach.profiles?.full_name ?? '',
    coach.bio ?? '',
    coach.location_city ?? '',
    coach.location_country ?? '',
    coach.certification_level,
    ...(coach.specializations ?? []),
  ]
    .join(' ')
    .toLowerCase()

  return haystack.includes(normalizedQuery)
}

interface SearchResourcesRpc {
  rpc: (
    fn: 'search_resources',
    args: {
      query_embedding: number[]
      match_threshold: number
      match_count: number
    }
  ) => Promise<{ data: unknown[] | null }>
}

export async function searchKnowledge(query: string) {
  const supabase = await createClient()

  const { embedding } = await embed({
    model: openai.embedding('text-embedding-3-small'),
    value: query,
  })

  // Semantic resource search via pgvector RPC
  const rpcClient = supabase as unknown as SearchResourcesRpc
  const { data: resources } = await rpcClient.rpc('search_resources', {
    query_embedding: embedding,
    match_threshold: 0.1,
    match_count: 5,
  })

  const normalizedResources = (resources ?? []) as KnowledgeResourceResult[]
  const resourceCoachMap = await getCoachMapByResourceIds(
    supabase,
    normalizedResources.map((resource) => resource.id)
  )

  const resourcesWithCoaches = normalizedResources.map((resource) => ({
    ...resource,
    teachingCoaches: resourceCoachMap[resource.id] ?? [],
  }))

  // Re-use your existing coach full-text search
  const { data: coaches } = await supabase
    .from('coach_profiles')
    .select(
      'id, user_id, bio, specializations, location_city, location_country, certification_level, profiles(full_name, avatar_url)'
    )
    .textSearch('search_vector', query, { type: 'websearch' })
    .eq('is_published', true)
    .eq('is_verified', true)
    .limit(4)

  let normalizedCoaches = (coaches ?? []) as KnowledgeCoachResult[]

  if (normalizedCoaches.length === 0) {
    const { data: coachFallback } = await supabase
      .from('coach_profiles')
      .select(
        'id, user_id, bio, specializations, location_city, location_country, certification_level, profiles(full_name, avatar_url)'
      )
      .eq('is_published', true)
      .eq('is_verified', true)
      .limit(50)

    const fallbackRows = (coachFallback ?? []) as KnowledgeCoachResult[]

    normalizedCoaches = fallbackRows.filter((coach) => matchesCoachQuery(coach, query)).slice(0, 4)

    if (normalizedCoaches.length === 0) {
      normalizedCoaches = fallbackRows.slice(0, 4)
    }
  }

  const courseMap = await getCourseMapByCoachIds(
    supabase,
    normalizedCoaches.map((coach) => coach.id)
  )

  const coachesWithCourses = normalizedCoaches.map((coach) => ({
    ...coach,
    courses: courseMap[coach.id] ?? [],
  }))

  return { resources: resourcesWithCoaches, coaches: coachesWithCourses }
}
