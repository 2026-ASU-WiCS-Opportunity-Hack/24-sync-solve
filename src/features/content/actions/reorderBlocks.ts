'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { BlockReorderItem } from '@/features/content/types'
import type { ActionResult } from '@/types'

/**
 * Reorder blocks within a page by updating sort_order for each.
 * Does not require approval — layout changes are instant.
 *
 * @param pageId  - ID of the page the blocks belong to
 * @param blocks  - Array of { id, sort_order } to apply
 */
export async function reorderBlocks(
  pageId: string,
  blocks: BlockReorderItem[]
): Promise<ActionResult> {
  if (!blocks.length) {
    return { success: true, data: null }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, chapter_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { success: false, error: 'User profile not found.' }
  }

  // Verify pageId belongs to a chapter the user can edit
  const { data: page } = await supabase.from('pages').select('chapter_id').eq('id', pageId).single()

  if (!page) {
    return { success: false, error: 'Page not found.' }
  }

  const isSuperAdmin = profile.role === 'super_admin'
  const isChapterEditor =
    (profile.role === 'chapter_lead' || profile.role === 'content_editor') &&
    (page.chapter_id === null || profile.chapter_id === page.chapter_id)

  if (!isSuperAdmin && !isChapterEditor) {
    return { success: false, error: 'Permission denied.' }
  }

  const adminClient = createAdminClient()

  // Update sort_order for each block in parallel
  const updates = blocks.map(
    ({ id, sort_order }) =>
      adminClient
        .from('content_blocks')
        .update({ sort_order, updated_by: user.id, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('page_id', pageId) // extra safety: only update blocks on this page
  )

  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)

  if (failed?.error) {
    return { success: false, error: `Failed to reorder: ${failed.error.message}` }
  }

  if (page.chapter_id) {
    revalidatePath(`/[chapter]`, 'layout')
  } else {
    revalidatePath('/', 'layout')
  }

  return { success: true, data: null }
}
