import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types'
import type { Resource, ResourceType } from '@/features/resources/types'

interface GetResourcesOptions {
  /**
   * Filter to a specific chapter's resources.
   * Omit (or pass undefined/null) to show ALL resources across all chapters.
   * Pass `globalOnly: true` instead to show only resources with chapter_id IS NULL.
   */
  chapterId?: string | null
  /** If true, only return resources where chapter_id IS NULL (WIAL global resources). */
  globalOnly?: boolean
  type?: ResourceType | null
  category?: string | null
  /** Full-text search on title and description (case-insensitive). */
  search?: string | null
  publishedOnly?: boolean
  limit?: number
  offset?: number
}

export async function getResources(
  supabase: SupabaseClient<Database>,
  options: GetResourcesOptions = {}
): Promise<{ items: Resource[]; total: number }> {
  const {
    chapterId,
    globalOnly = false,
    type = null,
    category = null,
    search = null,
    publishedOnly = true,
    limit = 100,
    offset = 0,
  } = options

  let query = supabase
    .from('resources')
    .select('*', { count: 'exact' })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // Chapter scoping
  if (globalOnly) {
    query = query.is('chapter_id', null)
  } else if (chapterId) {
    query = query.eq('chapter_id', chapterId)
  }
  // else: no chapter filter → show all resources

  if (publishedOnly) {
    query = query.eq('is_published', true)
  }

  if (type && type !== 'webinar') {
    query = query.eq('type', type)
  }

  if (category) {
    query = query.eq('category', category)
  }

  if (search) {
    // ilike search on title OR description
    query = query.or(
      `title.ilike.%${search.replace(/%/g, '\\%').replace(/_/g, '\\_')}%,description.ilike.%${search.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`
    )
  }

  const { data, error, count } = await query
  if (error || !data) return { items: [], total: 0 }

  return { items: data as Resource[], total: count ?? 0 }
}

export async function getResourceById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<Resource | null> {
  const { data } = await supabase.from('resources').select('*').eq('id', id).single()
  return (data as Resource | null) ?? null
}

interface GetResourceCategoriesOptions {
  chapterId?: string | null
  globalOnly?: boolean
}

export async function getResourceCategories(
  supabase: SupabaseClient<Database>,
  options: GetResourceCategoriesOptions = {}
): Promise<string[]> {
  const { chapterId, globalOnly = false } = options

  let query = supabase
    .from('resources')
    .select('category')
    .eq('is_published', true)
    .not('category', 'is', null)

  if (globalOnly) {
    query = query.is('chapter_id', null)
  } else if (chapterId) {
    query = query.eq('chapter_id', chapterId)
  }

  const { data } = await query
  if (!data) return []

  const unique = [...new Set(data.map((r) => r.category).filter(Boolean))] as string[]
  return unique.sort()
}
