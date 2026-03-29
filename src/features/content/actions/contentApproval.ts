'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions/context'
import type { ActionResult } from '@/types'

/**
 * Server Action: Approve a pending content block.
 * Requires content:approve permission for the block's chapter.
 */
export async function approveBlock(blockId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  const adminClient = createAdminClient()

  // Fetch block + page to get chapter_id for permission scoping
  const { data: block } = await adminClient
    .from('content_blocks')
    .select('draft_version, page:pages!content_blocks_page_id_fkey(chapter_id)')
    .eq('id', blockId)
    .single()

  if (!block) {
    return { success: false, error: 'Block not found.' }
  }

  const pageChapterId = (block.page as { chapter_id: string | null } | null)?.chapter_id ?? null

  try {
    await requirePermission('content:approve', pageChapterId)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  if (!block.draft_version) {
    return { success: false, error: 'No draft to approve.' }
  }

  const { error } = await adminClient
    .from('content_blocks')
    .update({
      status: 'published',
      content: block.draft_version,
      published_version: block.draft_version,
      draft_version: null,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', blockId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/', 'layout')
  revalidatePath('/admin/approvals')
  if (pageChapterId) revalidatePath(`/[chapter]/manage/approvals`)

  return { success: true, data: null, message: 'Content approved and published.' }
}

/**
 * Server Action: Reject a pending content block.
 * Requires content:approve permission for the block's chapter.
 */
export async function rejectBlock(blockId: string, reason: string): Promise<ActionResult> {
  if (!reason.trim()) {
    return { success: false, error: 'A rejection reason is required.' }
  }

  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  const adminClient = createAdminClient()

  const { data: block } = await adminClient
    .from('content_blocks')
    .select('page:pages!content_blocks_page_id_fkey(chapter_id)')
    .eq('id', blockId)
    .single()

  const pageChapterId = (block?.page as { chapter_id: string | null } | null)?.chapter_id ?? null

  try {
    await requirePermission('content:approve', pageChapterId)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  const { error } = await adminClient
    .from('content_blocks')
    .update({
      status: 'published',
      draft_version: null,
      rejection_reason: reason.trim(),
      approved_by: null,
      approved_at: null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', blockId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/approvals')
  if (pageChapterId) revalidatePath(`/[chapter]/manage/approvals`)

  return { success: true, data: null, message: 'Content rejected.' }
}

/**
 * Server Action: Revert a block to its last published version.
 * Requires content:edit permission for the block's chapter.
 */
export async function revertBlock(blockId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'Authentication required.' }
  }

  const { data: block } = await supabase
    .from('content_blocks')
    .select(`id, published_version, page:pages!content_blocks_page_id_fkey(chapter_id)`)
    .eq('id', blockId)
    .single()

  if (!block) {
    return { success: false, error: 'Block not found.' }
  }

  const pageChapterId = (block.page as { chapter_id: string | null } | null)?.chapter_id ?? null

  try {
    await requirePermission('content:edit', pageChapterId)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('content_blocks')
    .update({
      status: 'published',
      draft_version: null,
      rejection_reason: null,
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

  return { success: true, data: null, message: 'Block reverted to published version.' }
}
