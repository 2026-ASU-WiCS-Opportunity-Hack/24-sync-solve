import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'
import type { ResourceType } from '@/features/resources/types'

export interface TeachingCoachPreview {
  coachId: string
  name: string
  certificationLevel: string
  avatarUrl: string | null
}

export interface CoursePreview {
  id: string
  title: string
  type: ResourceType
  url: string
  category: string | null
}

interface CoachCourseMappingRow {
  coach_profile_id: string
  resource_id: string
}

interface CoachCourseMappingsTableAdapter {
  select: (columns: string) => {
    in: (
      column: 'resource_id' | 'coach_profile_id',
      values: string[]
    ) => Promise<{ data: CoachCourseMappingRow[] | null; error: { message: string } | null }>
    eq: (
      column: 'resource_id' | 'coach_profile_id',
      value: string
    ) => Promise<{ data: CoachCourseMappingRow[] | null; error: { message: string } | null }>
  }
}

interface CoachProfileLookupRow {
  id: string
  certification_level: string
  specializations: string[]
  bio: string | null
  profile: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface ResourceLookupRow {
  id: string
  title: string
  type: ResourceType
  url: string
  category: string | null
}

interface ResourceTeacherLookupRow extends ResourceLookupRow {
  presenter: string | null
  authors: string[] | null
  tags: string[]
  relevance_tags: string[] | null
  description: string | null
}

function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function tokenize(value: string): Set<string> {
  return new Set(
    value
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 3)
  )
}

function overlapScore(a: Set<string>, b: Set<string>): number {
  let score = 0
  for (const token of a) {
    if (b.has(token)) score += 1
  }
  return score
}

async function getPublishedCoachRows(
  supabase: SupabaseClient<Database>
): Promise<CoachProfileLookupRow[]> {
  const { data: coachRows, error: coachError } = await supabase
    .from('coach_profiles')
    .select(
      `
      id,
      certification_level,
      specializations,
      bio,
      profile:profiles!coach_profiles_user_id_fkey (
        full_name,
        avatar_url
      )
    `
    )
    .eq('is_published', true)
    .eq('is_verified', true)

  if (coachError || !coachRows) return []
  return coachRows as unknown as CoachProfileLookupRow[]
}

function buildCoachPreviewMap(
  coachRows: CoachProfileLookupRow[]
): Map<string, TeachingCoachPreview> {
  const coachById = new Map<string, TeachingCoachPreview>()
  for (const coach of coachRows) {
    coachById.set(coach.id, {
      coachId: coach.id,
      name: coach.profile?.full_name ?? 'Coach',
      certificationLevel: coach.certification_level,
      avatarUrl: coach.profile?.avatar_url ?? null,
    })
  }
  return coachById
}

async function getNameBasedCoachMapByResourceIds(
  supabase: SupabaseClient<Database>,
  resourceIds: string[]
): Promise<Record<string, TeachingCoachPreview[]>> {
  if (resourceIds.length === 0) return {}

  const { data: resources, error: resourceError } = await supabase
    .from('resources')
    .select('id, title, type, url, category, presenter, authors')
    .in('id', resourceIds)
    .eq('is_published', true)

  if (resourceError || !resources || resources.length === 0) return {}

  const coachRows = await getPublishedCoachRows(supabase)
  const normalizedNameToCoach = new Map<string, TeachingCoachPreview>()

  for (const coach of coachRows) {
    const fullName = coach.profile?.full_name
    if (!fullName) continue
    normalizedNameToCoach.set(normalizeName(fullName), {
      coachId: coach.id,
      name: fullName,
      certificationLevel: coach.certification_level,
      avatarUrl: coach.profile?.avatar_url ?? null,
    })
  }

  const map: Record<string, TeachingCoachPreview[]> = {}
  for (const resource of resources as unknown as ResourceTeacherLookupRow[]) {
    const teachers = new Set<string>()
    if (resource.presenter) teachers.add(normalizeName(resource.presenter))
    for (const author of resource.authors ?? []) {
      if (author) teachers.add(normalizeName(author))
    }

    const linked: TeachingCoachPreview[] = []
    for (const teacher of teachers) {
      const coach = normalizedNameToCoach.get(teacher)
      if (coach) linked.push(coach)
    }

    if (linked.length === 0) {
      const resourceKeywords = tokenize(
        [
          resource.title,
          resource.category ?? '',
          resource.description ?? '',
          ...(resource.tags ?? []),
          ...(resource.relevance_tags ?? []),
        ].join(' ')
      )

      const scored = coachRows
        .map((coach) => {
          const coachKeywords = tokenize(
            [
              coach.profile?.full_name ?? '',
              coach.bio ?? '',
              ...(coach.specializations ?? []),
            ].join(' ')
          )
          return {
            coach,
            score: overlapScore(resourceKeywords, coachKeywords),
          }
        })
        .filter((item) => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 2)

      for (const item of scored) {
        linked.push({
          coachId: item.coach.id,
          name: item.coach.profile?.full_name ?? 'Coach',
          certificationLevel: item.coach.certification_level,
          avatarUrl: item.coach.profile?.avatar_url ?? null,
        })
      }
    }

    if (linked.length > 0) map[resource.id] = linked
  }

  return map
}

async function getNameBasedCourseMapByCoachIds(
  supabase: SupabaseClient<Database>,
  coachProfileIds: string[]
): Promise<Record<string, CoursePreview[]>> {
  if (coachProfileIds.length === 0) return {}

  const { data: resources, error: resourceError } = await supabase
    .from('resources')
    .select('id, title, type, url, category')
    .eq('is_published', true)

  if (resourceError || !resources || resources.length === 0) return {}

  const resourceIds = (resources as unknown as ResourceLookupRow[]).map((resource) => resource.id)
  const resourceCoachMap = await getNameBasedCoachMapByResourceIds(supabase, resourceIds)
  const resourceById = new Map<string, ResourceLookupRow>()
  for (const resource of resources as unknown as ResourceLookupRow[]) {
    resourceById.set(resource.id, resource)
  }

  const coachIdSet = new Set(coachProfileIds)
  const map: Record<string, CoursePreview[]> = {}

  for (const [resourceId, coaches] of Object.entries(resourceCoachMap)) {
    const resource = resourceById.get(resourceId)
    if (!resource) continue

    for (const coach of coaches) {
      if (!coachIdSet.has(coach.coachId)) continue
      const existing = map[coach.coachId] ?? []
      existing.push({
        id: resource.id,
        title: resource.title,
        type: resource.type,
        url: resource.url,
        category: resource.category,
      })
      map[coach.coachId] = existing
    }
  }

  return map
}

function getMappingTable(supabase: SupabaseClient<Database>): CoachCourseMappingsTableAdapter {
  return supabase.from(
    'coach_course_mappings' as never
  ) as unknown as CoachCourseMappingsTableAdapter
}

export async function getCoachMapByResourceIds(
  supabase: SupabaseClient<Database>,
  resourceIds: string[]
): Promise<Record<string, TeachingCoachPreview[]>> {
  if (resourceIds.length === 0) return {}

  const mappingTable = getMappingTable(supabase)
  const { data: mappings, error: mappingError } = await mappingTable
    .select('resource_id, coach_profile_id')
    .in('resource_id', resourceIds)

  if (mappingError) {
    return getNameBasedCoachMapByResourceIds(supabase, resourceIds)
  }

  if (!mappings || mappings.length === 0) {
    return getNameBasedCoachMapByResourceIds(supabase, resourceIds)
  }

  const coachIds = [...new Set(mappings.map((m) => m.coach_profile_id))]
  const coachRows = await getPublishedCoachRows(supabase)
  const coachById = buildCoachPreviewMap(coachRows.filter((coach) => coachIds.includes(coach.id)))

  const map: Record<string, TeachingCoachPreview[]> = {}
  for (const mapping of mappings) {
    const coach = coachById.get(mapping.coach_profile_id)
    if (!coach) continue
    const existing = map[mapping.resource_id] ?? []
    existing.push(coach)
    map[mapping.resource_id] = existing
  }

  return map
}

export async function getCoursesForCoach(
  supabase: SupabaseClient<Database>,
  coachProfileId: string,
  publishedOnly = true
): Promise<CoursePreview[]> {
  const mappingTable = getMappingTable(supabase)
  const { data: mappings, error: mappingError } = await mappingTable
    .select('resource_id, coach_profile_id')
    .eq('coach_profile_id', coachProfileId)

  if (mappingError || !mappings || mappings.length === 0) {
    const nameBased = await getNameBasedCourseMapByCoachIds(supabase, [coachProfileId])
    return nameBased[coachProfileId] ?? []
  }

  const resourceIds = [...new Set(mappings.map((m) => m.resource_id))]
  let query = supabase
    .from('resources')
    .select('id, title, type, url, category')
    .in('id', resourceIds)
    .order('sort_order', { ascending: true })

  if (publishedOnly) {
    query = query.eq('is_published', true)
  }

  const { data: resources, error: resourceError } = await query
  if (resourceError || !resources) return []

  return resources as unknown as CoursePreview[]
}

export async function getCourseMapByCoachIds(
  supabase: SupabaseClient<Database>,
  coachProfileIds: string[]
): Promise<Record<string, CoursePreview[]>> {
  if (coachProfileIds.length === 0) return {}

  const mappingTable = getMappingTable(supabase)
  const { data: mappings, error: mappingError } = await mappingTable
    .select('resource_id, coach_profile_id')
    .in('coach_profile_id', coachProfileIds)

  if (mappingError || !mappings || mappings.length === 0) {
    return getNameBasedCourseMapByCoachIds(supabase, coachProfileIds)
  }

  const resourceIds = [...new Set(mappings.map((m) => m.resource_id))]

  const { data: resources, error: resourceError } = await supabase
    .from('resources')
    .select('id, title, type, url, category')
    .in('id', resourceIds)
    .eq('is_published', true)

  if (resourceError || !resources) return {}

  const resourceById = new Map<string, CoursePreview>()
  for (const resource of resources as unknown as CoursePreview[]) {
    resourceById.set(resource.id, resource)
  }

  const map: Record<string, CoursePreview[]> = {}
  for (const mapping of mappings) {
    const resource = resourceById.get(mapping.resource_id)
    if (!resource) continue
    const existing = map[mapping.coach_profile_id] ?? []
    existing.push(resource)
    map[mapping.coach_profile_id] = existing
  }

  return map
}
