'use server'

import React from 'react'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions/context'
import { sendEmail } from '@/lib/email/send'
import { ContentBlockReviewed } from '@/lib/email/templates/ContentBlockReviewed'
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
    .select(
      'draft_version, block_type, updated_by, page:pages!content_blocks_page_id_fkey(chapter_id, title, slug)'
    )
    .eq('id', blockId)
    .single()

  if (!block) {
    return { success: false, error: 'Block not found.' }
  }

  type PageInfo = { chapter_id: string | null; title: string | null; slug: string | null }
  const page = block.page as PageInfo | null
  const pageChapterId = page?.chapter_id ?? null

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

  // Notify the editor who submitted the draft
  if (block.updated_by) {
    await _notifyContentEditor({
      adminClient,
      editorId: block.updated_by,
      decision: 'approved',
      blockType: block.block_type,
      pageTitle: page?.title ?? 'Unknown page',
      pageSlug: page?.slug ?? null,
      chapterId: pageChapterId,
    })
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
    .select(
      'block_type, updated_by, page:pages!content_blocks_page_id_fkey(chapter_id, title, slug)'
    )
    .eq('id', blockId)
    .single()

  type PageInfo = { chapter_id: string | null; title: string | null; slug: string | null }
  const page = block?.page as PageInfo | null
  const pageChapterId = page?.chapter_id ?? null

  try {
    await requirePermission('content:approve', pageChapterId)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  const { error } = await adminClient
    .from('content_blocks')
    .update({
      status: 'rejected',
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

  // Notify the editor who submitted the draft
  if (block?.updated_by) {
    await _notifyContentEditor({
      adminClient,
      editorId: block.updated_by,
      decision: 'rejected',
      blockType: block.block_type,
      pageTitle: page?.title ?? 'Unknown page',
      pageSlug: page?.slug ?? null,
      chapterId: pageChapterId,
      rejectionReason: reason.trim(),
    })
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

// ── Private helper ────────────────────────────────────────────────────────────

interface NotifyEditorOptions {
  adminClient: ReturnType<typeof createAdminClient>
  editorId: string
  decision: 'approved' | 'rejected'
  blockType: string
  pageTitle: string
  pageSlug: string | null
  chapterId: string | null
  rejectionReason?: string
}

async function _notifyContentEditor({
  adminClient,
  editorId,
  decision,
  blockType,
  pageTitle,
  pageSlug,
  chapterId,
  rejectionReason,
}: NotifyEditorOptions): Promise<void> {
  const { data: editorProfile } = await adminClient
    .from('profiles')
    .select('email, full_name')
    .eq('id', editorId)
    .single()

  if (!editorProfile?.email) return

  let chapterSlug: string | null = null
  let chapterName = 'Global'
  if (chapterId) {
    const { data: chapter } = await adminClient
      .from('chapters')
      .select('slug, name')
      .eq('id', chapterId)
      .single()
    if (chapter) {
      chapterSlug = chapter.slug
      chapterName = chapter.name
    }
  }

  const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'
  const pageUrl =
    pageSlug && chapterSlug ? `/${chapterSlug}/${pageSlug}` : pageSlug ? `/${pageSlug}` : null

  await sendEmail({
    to: editorProfile.email,
    subject:
      decision === 'approved'
        ? `Your content update was approved — WIAL ${chapterName}`
        : `Your content update was not approved — WIAL ${chapterName}`,
    react: React.createElement(ContentBlockReviewed, {
      editorName: editorProfile.full_name ?? editorProfile.email,
      decision,
      blockType,
      pageTitle,
      chapterName,
      rejectionReason: rejectionReason ?? null,
      siteUrl,
      pageUrl,
    }),
  })
}
