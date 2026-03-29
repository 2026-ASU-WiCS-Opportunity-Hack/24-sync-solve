import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ContentBlock, Page } from '@/types'

export interface ApprovalItem extends ContentBlock {
  page: Pick<Page, 'title' | 'slug' | 'chapter_id'> | null
  chapter_name: string | null
  chapter_slug: string | null
}

/**
 * Fetch content blocks pending approval for the admin queue.
 * Joins page and chapter context for display.
 * Optionally scoped to a specific chapter.
 */
export async function getPendingApprovals(
  supabase: SupabaseClient<Database>,
  options: { chapterId?: string; limit?: number; offset?: number } = {}
): Promise<{ items: ApprovalItem[]; total: number }> {
  const { chapterId, limit = 50, offset = 0 } = options

  let query = supabase
    .from('content_blocks')
    .select(
      `
      *,
      page:pages!content_blocks_page_id_fkey(
        title,
        slug,
        chapter_id,
        chapter:chapters!pages_chapter_id_fkey(name, slug)
      )
    `,
      { count: 'exact' }
    )
    .eq('status', 'pending_approval')
    .order('updated_at', { ascending: true })
    .range(offset, offset + limit - 1)

  if (chapterId) {
    query = query.eq('page.chapter_id', chapterId)
  }

  const { data, error, count } = await query

  if (error || !data) return { items: [], total: 0 }

  const items: ApprovalItem[] = data.map((row) => {
    const { page, ...rest } = row as typeof row & {
      page: {
        title: string
        slug: string
        chapter_id: string | null
        chapter: { name: string; slug: string } | null
      } | null
    }
    return {
      ...rest,
      page: page ? { title: page.title, slug: page.slug, chapter_id: page.chapter_id } : null,
      chapter_name: page?.chapter?.name ?? null,
      chapter_slug: page?.chapter?.slug ?? null,
    }
  })

  return { items, total: count ?? 0 }
}

/**
 * Approve a content block: publish draft_version as published_version.
 */
export async function approveContentBlock(
  supabase: SupabaseClient<Database>,
  blockId: string,
  approvedByUserId: string
): Promise<{ error: string | null }> {
  // Fetch draft version
  const { data: block } = await supabase
    .from('content_blocks')
    .select('draft_version')
    .eq('id', blockId)
    .single()

  if (!block) return { error: 'Content block not found.' }

  const { error } = await supabase
    .from('content_blocks')
    .update({
      status: 'published',
      content: block.draft_version,
      published_version: block.draft_version,
      draft_version: null,
      approved_by: approvedByUserId,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
      updated_by: approvedByUserId,
    })
    .eq('id', blockId)

  return { error: error?.message ?? null }
}

/**
 * Reject a content block: revert to published_version.
 */
export async function rejectContentBlock(
  supabase: SupabaseClient<Database>,
  blockId: string,
  rejectedByUserId: string,
  reason: string
): Promise<{ error: string | null }> {
  const { error } = await supabase
    .from('content_blocks')
    .update({
      status: 'published', // Keep showing the existing published_version
      draft_version: null,
      rejection_reason: reason,
      approved_by: null,
      approved_at: null,
      updated_by: rejectedByUserId,
    })
    .eq('id', blockId)

  return { error: error?.message ?? null }
}
