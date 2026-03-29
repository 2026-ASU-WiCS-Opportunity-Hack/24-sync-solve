import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, CoachApplication } from '@/types'

export interface CoachApplicationRow extends CoachApplication {
  applicant_name: string | null
  applicant_email: string | null
  chapter_name: string | null
  chapter_slug: string | null
}

/**
 * Fetch pending (or all) coach applications for a chapter or globally.
 * @param chapterId - If provided, scopes to that chapter. Otherwise returns all (super_admin).
 */
export async function getPendingApplications(
  supabase: SupabaseClient<Database>,
  options: {
    chapterId?: string
    status?: 'pending' | 'approved' | 'rejected'
    limit?: number
    offset?: number
  } = {}
): Promise<{ items: CoachApplicationRow[]; total: number }> {
  const { chapterId, status = 'pending', limit = 50, offset = 0 } = options

  let query = supabase
    .from('coach_applications')
    .select(
      `
      *,
      applicant:profiles!coach_applications_user_id_fkey(full_name, email),
      chapter:chapters!coach_applications_chapter_id_fkey(name, slug)
    `,
      { count: 'exact' }
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (chapterId) {
    query = query.eq('chapter_id', chapterId)
  }

  const { data, error, count } = await query

  if (error || !data) return { items: [], total: 0 }

  const items: CoachApplicationRow[] = data.map((row) => {
    const applicant = row.applicant as { full_name: string | null; email: string } | null
    const chapter = row.chapter as { name: string; slug: string } | null
    const {
      applicant: _a,
      chapter: _c,
      ...rest
    } = row as typeof row & {
      applicant: unknown
      chapter: unknown
    }
    return {
      ...rest,
      applicant_name: applicant?.full_name ?? null,
      applicant_email: applicant?.email ?? null,
      chapter_name: chapter?.name ?? null,
      chapter_slug: chapter?.slug ?? null,
    } as CoachApplicationRow
  })

  return { items, total: count ?? 0 }
}

/**
 * Fetch a single coach application by ID.
 */
export async function getApplicationById(
  supabase: SupabaseClient<Database>,
  id: string
): Promise<CoachApplicationRow | null> {
  const { data } = await supabase
    .from('coach_applications')
    .select(
      `
      *,
      applicant:profiles!coach_applications_user_id_fkey(full_name, email),
      chapter:chapters!coach_applications_chapter_id_fkey(name, slug)
    `
    )
    .eq('id', id)
    .single()

  if (!data) return null

  const applicant = data.applicant as { full_name: string | null; email: string } | null
  const chapter = data.chapter as { name: string; slug: string } | null
  const {
    applicant: _a,
    chapter: _c,
    ...rest
  } = data as typeof data & {
    applicant: unknown
    chapter: unknown
  }

  return {
    ...rest,
    applicant_name: applicant?.full_name ?? null,
    applicant_email: applicant?.email ?? null,
    chapter_name: chapter?.name ?? null,
    chapter_slug: chapter?.slug ?? null,
  } as CoachApplicationRow
}
