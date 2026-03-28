import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Chapter } from '@/types'

/**
 * Fetch a chapter by slug.
 * Returns null if not found or inactive.
 */
export async function getChapterBySlug(
  supabase: SupabaseClient<Database>,
  slug: string
): Promise<Chapter | null> {
  const { data, error } = await supabase
    .from('chapters')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) return null
  return data
}

/**
 * Fetch all active chapters for navigation/listing.
 */
export async function getActiveChapters(
  supabase: SupabaseClient<Database>
): Promise<Pick<Chapter, 'id' | 'slug' | 'name' | 'country_code' | 'accent_color'>[]> {
  const { data, error } = await supabase
    .from('chapters')
    .select('id, slug, name, country_code, accent_color')
    .eq('is_active', true)
    .order('name')

  if (error || !data) return []
  return data
}

/**
 * Fetch all chapter slugs (for static generation and middleware validation).
 */
export async function getAllChapterSlugs(supabase: SupabaseClient<Database>): Promise<string[]> {
  const { data, error } = await supabase.from('chapters').select('slug').eq('is_active', true)

  if (error || !data) return []
  return data.map((c) => c.slug)
}
