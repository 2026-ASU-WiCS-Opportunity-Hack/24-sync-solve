'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

/**
 * Toggle the is_visible flag for a content block.
 * Instant publish — no approval needed.
 */
export async function toggleBlockVisibility(
  blockId: string,
  isVisible: boolean
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  // Fetch block + page context
  const { data: block } = await supabase
    .from('content_blocks')
    .select(`id, page:pages!content_blocks_page_id_fkey(chapter_id)`)
    .eq('id', blockId)
    .single()

  if (!block) {
    return { success: false, error: 'Block not found.' }
  }

  // Check permissions
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, chapter_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { success: false, error: 'User profile not found.' }
  }

  const pageChapterId = (block.page as { chapter_id: string | null } | null)?.chapter_id ?? null
  const isSuperAdmin = profile.role === 'super_admin'
  const isChapterEditor =
    (profile.role === 'chapter_lead' || profile.role === 'content_editor') &&
    (pageChapterId === null || profile.chapter_id === pageChapterId)

  if (!isSuperAdmin && !isChapterEditor) {
    return { success: false, error: 'Permission denied.' }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('content_blocks')
    .update({
      is_visible: isVisible,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', blockId)

  if (error) {
    return { success: false, error: error.message }
  }

  if (pageChapterId) {
    revalidatePath(`/[chapter]`, 'layout')
  } else {
    revalidatePath('/', 'layout')
  }

  return { success: true, data: null }
}
