import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ChapterRequest } from '@/types'

export interface ChapterRequestRow extends ChapterRequest {
  requester_name: string | null
  requester_email: string | null
}

/**
 * Fetch chapter requests for the admin review queue.
 */
export async function getChapterRequests(
  supabase: SupabaseClient<Database>,
  options: {
    status?: 'pending' | 'approved' | 'rejected'
    limit?: number
    offset?: number
  } = {}
): Promise<{ items: ChapterRequestRow[]; total: number }> {
  const { status = 'pending', limit = 50, offset = 0 } = options

  let query = supabase
    .from('chapter_requests')
    .select(
      `
      *,
      requester:profiles!chapter_requests_requested_by_fkey(full_name, email)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error, count } = await query

  if (error || !data) return { items: [], total: 0 }

  const items: ChapterRequestRow[] = data.map((row) => {
    const requester = row.requester as { full_name: string | null; email: string } | null
    const { requester: _r, ...rest } = row as typeof row & { requester: unknown }
    return {
      ...rest,
      requester_name: requester?.full_name ?? null,
      requester_email: requester?.email ?? null,
    } as ChapterRequestRow
  })

  return { items, total: count ?? 0 }
}
