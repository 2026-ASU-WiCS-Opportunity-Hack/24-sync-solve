'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ActionResult } from '@/types'

/**
 * Server Action: Approve a pending content block.
 * Only callable by super_admin.
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return { success: false, error: 'Only super admins can approve content.' }
  }

  const adminClient = createAdminClient()

  // Fetch draft_version to promote
  const { data: block } = await adminClient
    .from('content_blocks')
    .select('draft_version, page:pages!content_blocks_page_id_fkey(chapter_id)')
    .eq('id', blockId)
    .single()

  if (!block) {
    return { success: false, error: 'Block not found.' }
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

  return { success: true, data: null, message: 'Content approved and published.' }
}

/**
 * Server Action: Reject a pending content block.
 * Only callable by super_admin.
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return { success: false, error: 'Only super admins can reject content.' }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('content_blocks')
    .update({
      status: 'published', // revert to showing the existing published_version
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

  return { success: true, data: null, message: 'Content rejected.' }
}

/**
 * Server Action: Revert a block to its last published version.
 * Discards any draft changes.
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

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, chapter_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { success: false, error: 'User profile not found.' }
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
