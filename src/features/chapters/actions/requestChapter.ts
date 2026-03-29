'use server'

import React from 'react'
import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  chapterRequestSchema,
  chapterRequestReviewSchema,
  translateZodErrors,
} from '@/lib/utils/validation'
import { sendEmail } from '@/lib/email/send'
import { ChapterRequestReviewed } from '@/lib/email/templates/ChapterRequestReviewed'
import type { ActionResult, ChapterRequest } from '@/types'
import type { Json } from '@/types/database'

// ── Request a new chapter ────────────────────────────────────────────────────

/**
 * Submit a request to create a new chapter.
 * Requires: chapter_lead or super_admin role.
 * Validates: slug uniqueness, max 3 pending requests per user.
 */
export async function requestNewChapterAction(
  _prevState: ActionResult<ChapterRequest> | null,
  formData: FormData
): Promise<ActionResult<ChapterRequest>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_suspended')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return { success: false, error: 'Profile not found.' }
  }

  if (profile.is_suspended) {
    return { success: false, error: 'Your account is suspended.' }
  }

  if (!['chapter_lead', 'super_admin'].includes(profile.role)) {
    return {
      success: false,
      error: 'Only Chapter Admins and Super Admins can request new chapters.',
    }
  }

  // Validate input
  const raw = {
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    country_code: formData.get('country_code') as string,
    timezone: formData.get('timezone') as string,
    currency: formData.get('currency') as string,
    accent_color: (formData.get('accent_color') as string) || '#CC0000',
    contact_email: (formData.get('contact_email') as string) || '',
    message: (formData.get('message') as string) || '',
  }

  const result = chapterRequestSchema.safeParse(raw)
  if (!result.success) {
    const tV = await getTranslations('validation')
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: translateZodErrors(result.error.flatten().fieldErrors, (k) => tV(k as never)),
    }
  }

  const { slug, ...rest } = result.data

  // Check slug uniqueness against chapters table
  const { data: existingChapter } = await supabase
    .from('chapters')
    .select('id')
    .eq('slug', slug)
    .single()

  if (existingChapter) {
    return {
      success: false,
      error: 'This slug is already taken by an existing chapter.',
      fieldErrors: { slug: ['Slug is already in use.'] },
    }
  }

  // Check slug uniqueness against pending chapter_requests
  const { data: existingRequest } = await supabase
    .from('chapter_requests')
    .select('id')
    .eq('slug', slug)
    .neq('status', 'rejected')
    .single()

  if (existingRequest) {
    return {
      success: false,
      error: 'A pending request for this slug already exists.',
      fieldErrors: { slug: ['This slug is already requested.'] },
    }
  }

  // Rate limit: max 3 pending requests per user
  const { data: pendingRequests } = await supabase
    .from('chapter_requests')
    .select('id')
    .eq('requested_by', user.id)
    .eq('status', 'pending')

  if ((pendingRequests?.length ?? 0) >= 3) {
    return {
      success: false,
      error: 'You have reached the maximum of 3 pending chapter requests.',
    }
  }

  const adminClient = createAdminClient()

  const { data: request, error } = await adminClient
    .from('chapter_requests')
    .insert({
      requested_by: user.id,
      slug,
      ...rest,
    })
    .select()
    .single()

  if (error || !request) {
    console.error('requestNewChapter error:', error)
    return { success: false, error: 'Failed to submit request. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: user.id,
    action: 'chapter_request_submit',
    entity_type: 'chapter_requests',
    entity_id: request.id,
    new_value: { slug, name: rest.name } as Json,
  })

  revalidatePath('/admin/chapter-requests')

  return {
    success: true,
    data: request,
    message: 'Chapter request submitted. A super admin will review it shortly.',
  }
}

// ── Review chapter request ───────────────────────────────────────────────────

/**
 * Approve or reject a chapter request.
 * super_admin only.
 * On approval: creates the chapter + assigns chapter_lead role to requester.
 */
export async function reviewChapterRequestAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required.' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return { success: false, error: 'Super admin access required.' }
  }

  const raw = {
    request_id: formData.get('request_id') as string,
    decision: formData.get('decision') as string,
    review_notes: (formData.get('review_notes') as string) || '',
  }

  const result = chapterRequestReviewSchema.safeParse(raw)
  if (!result.success) {
    const tV = await getTranslations('validation')
    return {
      success: false,
      error: 'Invalid input.',
      fieldErrors: translateZodErrors(result.error.flatten().fieldErrors, (k) => tV(k as never)),
    }
  }

  const { request_id, decision, review_notes } = result.data

  const adminClient = createAdminClient()

  // Fetch the request
  const { data: request } = await adminClient
    .from('chapter_requests')
    .select('*')
    .eq('id', request_id)
    .single()

  if (!request) {
    return { success: false, error: 'Chapter request not found.' }
  }

  if (request.status !== 'pending') {
    return { success: false, error: 'This request has already been reviewed.' }
  }

  // Update request status
  const { error: updateError } = await adminClient
    .from('chapter_requests')
    .update({
      status: decision,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      review_notes: review_notes ?? null,
    })
    .eq('id', request_id)

  if (updateError) {
    console.error('reviewChapterRequest update error:', updateError)
    return { success: false, error: 'Failed to update request. Please try again.' }
  }

  if (decision === 'approved') {
    // Create the chapter
    const { data: newChapter, error: chapterError } = await adminClient
      .from('chapters')
      .insert({
        slug: request.slug,
        name: request.name,
        country_code: request.country_code,
        timezone: request.timezone,
        currency: request.currency,
        accent_color: request.accent_color,
        contact_email: request.contact_email ?? undefined,
        is_active: true,
        settings: {},
      })
      .select()
      .single()

    if (chapterError || !newChapter) {
      console.error('reviewChapterRequest create chapter error:', chapterError)
      return {
        success: false,
        error: 'Request approved but chapter creation failed. Contact support.',
      }
    }

    // Provision default pages
    await adminClient.rpc('provision_chapter_pages', { p_chapter_id: newChapter.id })

    // Assign chapter_lead role to the requester
    await adminClient.from('user_chapter_roles').upsert(
      {
        user_id: request.requested_by,
        chapter_id: newChapter.id,
        role: 'chapter_lead',
        granted_by: user.id,
        is_active: true,
      },
      { onConflict: 'user_id,chapter_id,role' }
    )

    // Also update their global role if they're still 'user'
    const { data: requesterProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', request.requested_by)
      .single()

    if (requesterProfile?.role === 'user') {
      await adminClient
        .from('profiles')
        .update({ role: 'chapter_lead' })
        .eq('id', request.requested_by)
    }
  }

  await adminClient.from('audit_log').insert({
    user_id: user.id,
    action: `chapter_request_${decision}`,
    entity_type: 'chapter_requests',
    entity_id: request_id,
    new_value: { decision, review_notes } as Json,
  })

  // Email notification to the requester
  const { data: requesterProfile } = await adminClient
    .from('profiles')
    .select('email, full_name')
    .eq('id', request.requested_by)
    .single()

  if (requesterProfile?.email) {
    const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'
    await sendEmail({
      to: requesterProfile.email,
      subject:
        decision === 'approved'
          ? `Your chapter request for ${request.name} has been approved`
          : `Update on your chapter request for ${request.name}`,
      react: React.createElement(ChapterRequestReviewed, {
        requesterName: requesterProfile.full_name ?? requesterProfile.email,
        decision: decision as 'approved' | 'rejected',
        chapterName: request.name,
        chapterSlug: request.slug,
        reviewNotes: review_notes ?? null,
        siteUrl,
      }),
    })
  }

  revalidatePath('/admin/chapter-requests')
  revalidatePath('/admin/chapters')

  return {
    success: true,
    data: null,
    message:
      decision === 'approved' ? 'Chapter created and chapter lead assigned.' : 'Request rejected.',
  }
}
