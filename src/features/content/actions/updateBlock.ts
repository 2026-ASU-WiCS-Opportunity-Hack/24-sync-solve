'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requiresApproval } from '@/features/content/blocks/registry'
import type { BlockUpdateResult } from '@/features/content/types'
import type { BlockType, Json } from '@/types'

/**
 * Save updated content for a single block.
 *
 * - If the block type requires approval: sets status to 'pending_approval'
 *   and saves content to draft_version. The live site keeps showing
 *   published_version until a super_admin approves.
 * - If no approval needed: publishes immediately, updates content +
 *   published_version.
 *
 * Authorization:
 * - User must be authenticated
 * - User must be super_admin OR (chapter_lead / content_editor for the
 *   block's chapter). Verified server-side via RLS + profile lookup.
 */
export async function updateBlock(
  blockId: string,
  content: Record<string, unknown>
): Promise<BlockUpdateResult> {
  const jsonContent = content as Json
  const supabase = await createClient()

  // Verify authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in to edit content.' }
  }

  // Fetch current block + page + chapter for role check
  const { data: block, error: blockError } = await supabase
    .from('content_blocks')
    .select(
      `
      id,
      block_type,
      page:pages!content_blocks_page_id_fkey(
        chapter_id
      )
    `
    )
    .eq('id', blockId)
    .single()

  if (blockError || !block) {
    return { success: false, error: 'Content block not found.' }
  }

  // Verify user has edit access
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
    return { success: false, error: 'You do not have permission to edit this content.' }
  }

  const blockType = block.block_type as BlockType
  const needsApproval = !isSuperAdmin && requiresApproval(blockType)

  // Use admin client for the write (bypasses RLS — we already checked above)
  const adminClient = createAdminClient()

  if (needsApproval) {
    // Save as pending approval — live site keeps showing existing published_version
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
      return { success: false, error: `Failed to save draft: ${error.message}` }
    }
  } else {
    // Publish immediately
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
      return { success: false, error: `Failed to publish: ${error.message}` }
    }
  }

  // Revalidate the chapter/global page that contains this block
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

/**
 * Super-admin direct publish (bypasses approval).
 * Only callable by super_admin — enforced server-side.
 */
export async function publishBlockDraft(blockId: string): Promise<BlockUpdateResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return { success: false, error: 'Only super admins can publish drafts directly.' }
  }

  // Fetch the draft_version
  const adminClient = createAdminClient()
  const { data: block } = await adminClient
    .from('content_blocks')
    .select('draft_version, page:pages!content_blocks_page_id_fkey(chapter_id)')
    .eq('id', blockId)
    .single()

  if (!block?.draft_version) {
    return { success: false, error: 'No draft version to publish.' }
  }

  const { error } = await adminClient
    .from('content_blocks')
    .update({
      content: block.draft_version,
      published_version: block.draft_version,
      draft_version: null,
      status: 'published',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
      updated_by: user.id,
    })
    .eq('id', blockId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  return { success: true, status: 'published' }
}
