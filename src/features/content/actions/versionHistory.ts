'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requiresApproval } from '@/features/content/blocks/registry'
import { getBlockVersionHistory } from '@/features/content/queries/getApprovals'
import type { ContentVersionItem } from '@/features/content/queries/getApprovals'
import type { BlockUpdateResult } from '@/features/content/types'
import type { BlockType, Json } from '@/types'

export type { ContentVersionItem }

/**
 * Fetch version history for a block.
 * Returns empty array if user lacks access (RLS blocks the query silently).
 */
export async function fetchVersionHistoryAction(blockId: string): Promise<ContentVersionItem[]> {
  const supabase = await createClient()
  return getBlockVersionHistory(supabase, blockId)
}

/**
 * Revert a content block to a specific saved version.
 * Applies the same approval logic as updateBlock:
 * - Super admins publish immediately.
 * - Chapter editors trigger pending_approval if block type requires it.
 */
export async function revertToVersionAction(
  blockId: string,
  versionId: string
): Promise<BlockUpdateResult> {
  const supabase = await createClient()

  // Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in to revert content.' }
  }

  // Fetch block for permission check
  const { data: block, error: blockError } = await supabase
    .from('content_blocks')
    .select(`id, block_type, page:pages!content_blocks_page_id_fkey(chapter_id)`)
    .eq('id', blockId)
    .single()

  if (blockError || !block) {
    return { success: false, error: 'Content block not found.' }
  }

  // Permission check
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
    return { success: false, error: 'You do not have permission to revert this content.' }
  }

  // Fetch the target version content
  const adminClient = createAdminClient()
  const { data: version, error: versionError } = await adminClient
    .from('content_versions')
    .select('content')
    .eq('id', versionId)
    .eq('content_block_id', blockId)
    .single()

  if (versionError || !version) {
    return { success: false, error: 'Version not found.' }
  }

  const jsonContent = version.content as Json
  const blockType = block.block_type as BlockType
  const needsApproval = !isSuperAdmin && requiresApproval(blockType)

  if (needsApproval) {
    const { error } = await adminClient
      .from('content_blocks')
      .update({
        draft_version: jsonContent,
        status: 'pending_approval',
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', blockId)

    if (error) {
      return { success: false, error: `Failed to submit revert for approval: ${error.message}` }
    }
  } else {
    const { error } = await adminClient
      .from('content_blocks')
      .update({
        content: jsonContent,
        published_version: jsonContent,
        draft_version: null,
        status: 'published',
        updated_by: user.id,
        updated_at: new Date().toISOString(),
        approved_by: user.id,
        approved_at: new Date().toISOString(),
        rejection_reason: null,
      })
      .eq('id', blockId)

    if (error) {
      return { success: false, error: `Failed to revert: ${error.message}` }
    }
  }

  if (pageChapterId) {
    revalidatePath(`/[chapter]`, 'layout')
  } else {
    revalidatePath('/', 'layout')
  }

  return {
    success: true,
    status: needsApproval ? 'pending_approval' : 'published',
    requiresApproval: needsApproval,
  }
}
