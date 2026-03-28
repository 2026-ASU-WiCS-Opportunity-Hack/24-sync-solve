import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CoachProfile, Profile } from '@/types'

export interface CoachAdminRow extends CoachProfile {
  profile: Pick<Profile, 'email' | 'full_name' | 'avatar_url'> | null
  chapter_name: string | null
  chapter_slug: string | null
}

/**
 * Fetch all coach profiles for admin listing (including unpublished/unverified).
 * Joins profile and chapter data for display.
 */
export async function getCoachesAdmin(
  supabase: SupabaseClient<Database>,
  options: {
    chapterId?: string
    isPublished?: boolean
    limit?: number
    offset?: number
  } = {}
): Promise<{ items: CoachAdminRow[]; total: number }> {
  const { chapterId, isPublished, limit = 50, offset = 0 } = options

  let query = supabase
    .from('coach_profiles')
    .select(
      `
      *,
      profile:profiles!coach_profiles_user_id_fkey(email, full_name, avatar_url),
      chapter:chapters!coach_profiles_chapter_id_fkey(name, slug)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (chapterId) query = query.eq('chapter_id', chapterId)
  if (isPublished !== undefined) query = query.eq('is_published', isPublished)

  const { data, error, count } = await query

  if (error || !data) return { items: [], total: 0 }

  const items: CoachAdminRow[] = data.map((row) => {
    const { chapter, profile, ...rest } = row as typeof row & {
      chapter: { name: string; slug: string } | null
      profile: Pick<Profile, 'email' | 'full_name' | 'avatar_url'> | null
    }
    return {
      ...rest,
      profile: profile ?? null,
      chapter_name: chapter?.name ?? null,
      chapter_slug: chapter?.slug ?? null,
    }
  })

  return { items, total: count ?? 0 }
}

/**
 * Toggle a coach profile's published or verified status.
 */
export async function updateCoachStatus(
  supabase: SupabaseClient<Database>,
  coachId: string,
  updates: { is_published?: boolean; is_verified?: boolean }
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('coach_profiles').update(updates).eq('id', coachId)

  return { error: error?.message ?? null }
}
