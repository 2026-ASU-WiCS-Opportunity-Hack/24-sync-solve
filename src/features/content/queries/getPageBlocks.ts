import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, ContentBlock, Page } from '@/types'

/**
 * Fetch a page with its visible published content blocks.
 * Used by public display routes.
 */
export async function getPageWithBlocks(
  supabase: SupabaseClient<Database>,
  chapterId: string | null,
  slug: string
): Promise<{ page: Page; blocks: ContentBlock[] } | null> {
  const pageQuery = supabase.from('pages').select('*').eq('slug', slug).eq('is_published', true)

  if (chapterId) {
    pageQuery.eq('chapter_id', chapterId)
  } else {
    pageQuery.is('chapter_id', null)
  }

  const { data: page, error: pageError } = await pageQuery.single()
  if (pageError || !page) return null

  const { data: blocks, error: blocksError } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('page_id', page.id)
    .eq('is_visible', true)
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  if (blocksError) return null

  return { page, blocks: blocks ?? [] }
}

/**
 * Fetch all blocks for a page (including drafts — for editors).
 */
export async function getAllPageBlocks(
  supabase: SupabaseClient<Database>,
  pageId: string
): Promise<ContentBlock[]> {
  const { data, error } = await supabase
    .from('content_blocks')
    .select('*')
    .eq('page_id', pageId)
    .order('sort_order', { ascending: true })

  if (error || !data) return []
  return data
}
