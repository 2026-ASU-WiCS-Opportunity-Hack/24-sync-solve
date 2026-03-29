'use server'

import React from 'react'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions/context'
import { coachApplicationSchema, uuidSchema } from '@/lib/utils/validation'
import { sendEmail } from '@/lib/email/send'
import { CoachApplicationReviewed } from '@/lib/email/templates/CoachApplicationReviewed'
import type { ActionResult, CoachApplication } from '@/types'
import type { Json, CertificationLevel } from '@/types/database'

// ── Credly URL validation ────────────────────────────────────────────────────

interface CredlyBadgeInfo {
  name?: string
  issuerName?: string
}

/**
 * Validate a Credly badge URL by fetching its public page.
 * 5s timeout. If fetch fails, returns { valid: false }.
 */
export async function validateCredlyUrl(
  url: string
): Promise<{ valid: boolean; badgeInfo?: CredlyBadgeInfo }> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'WIAL-Platform/1.0' },
    })

    clearTimeout(timeout)

    if (!response.ok) {
      return { valid: false }
    }

    // Credly badge pages return JSON-LD — try to extract basic info
    const html = await response.text()
    const titleMatch = html.match(/<title>([^<]+)<\/title>/)
    const name = titleMatch?.[1]?.replace(' | Credly', '').trim()

    return { valid: true, badgeInfo: name ? { name } : undefined }
  } catch {
    return { valid: false }
  }
}

// ── Apply for coach ──────────────────────────────────────────────────────────

/**
 * Self-application for a coach role.
 * Requires authentication. Rate-limited to 3 applications per 24h.
 * Fetches Credly URL for validation (non-blocking — saves with credly_verified flag).
 */
export async function applyForCoachAction(
  _prevState: ActionResult<CoachApplication> | null,
  formData: FormData
): Promise<ActionResult<CoachApplication>> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required.' }
  }

  // Check account suspension
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) {
    return { success: false, error: 'Your account is suspended.' }
  }

  // Validate input
  const raw = {
    chapter_id: formData.get('chapter_id') as string,
    credly_url: formData.get('credly_url') as string,
    message: (formData.get('message') as string) || '',
  }

  const result = coachApplicationSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { chapter_id, credly_url, message } = result.data

  // Rate limit: max 3 applications per 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentApps } = await supabase
    .from('coach_applications')
    .select('id')
    .eq('user_id', user.id)
    .gte('created_at', oneDayAgo)

  if ((recentApps?.length ?? 0) >= 3) {
    return {
      success: false,
      error: 'You have reached the maximum of 3 applications per 24 hours. Please try again later.',
    }
  }

  // Validate Credly URL (non-blocking)
  const { valid: credlyVerified } = await validateCredlyUrl(credly_url)

  const adminClient = createAdminClient()

  const { data: application, error } = await adminClient
    .from('coach_applications')
    .insert({
      user_id: user.id,
      chapter_id,
      credly_url,
      credly_verified: credlyVerified,
      message: message ?? null,
      status: 'pending',
    })
    .select()
    .single()

  if (error || !application) {
    if (error?.code === '23505') {
      return {
        success: false,
        error: 'You already have a pending application for this chapter.',
      }
    }
    console.error('coachApplication insert error:', error)
    return { success: false, error: 'Failed to submit application. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: user.id,
    action: 'coach_application_submit',
    entity_type: 'coach_applications',
    entity_id: application.id,
    chapter_id,
    new_value: { credly_url, credly_verified: credlyVerified } as Json,
  })

  revalidatePath('/dashboard')
  revalidatePath(`/[chapter]/manage/coaches/applications`)

  return {
    success: true,
    data: application,
    message: credlyVerified
      ? 'Application submitted. Your Credly badge has been verified.'
      : 'Application submitted. Note: your Credly badge could not be automatically verified — an admin will review it manually.',
  }
}

// ── Review coach application ─────────────────────────────────────────────────

/**
 * Approve or reject a coach application.
 * chapter_lead (own chapter) or super_admin.
 * On approval: creates coach_profile + assigns coach role.
 */
export async function reviewCoachApplicationAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const applicationIdResult = uuidSchema.safeParse(formData.get('application_id') as string)
  if (!applicationIdResult.success) {
    return { success: false, error: 'Invalid application ID.' }
  }

  const decision = formData.get('decision') as string
  if (!['approved', 'rejected'].includes(decision)) {
    return { success: false, error: 'Invalid decision.' }
  }

  const review_notes = (formData.get('review_notes') as string) || null

  if (decision === 'rejected' && !review_notes?.trim()) {
    return { success: false, error: 'A reason is required when rejecting an application.' }
  }

  const supabase = await createClient()

  // Fetch application for chapter scoping
  const { data: application } = await supabase
    .from('coach_applications')
    .select('*')
    .eq('id', applicationIdResult.data)
    .single()

  if (!application) {
    return { success: false, error: 'Application not found.' }
  }

  if (application.status !== 'pending') {
    return { success: false, error: 'This application has already been reviewed.' }
  }

  let ctx
  try {
    ctx = await requirePermission('coach_application:review', application.chapter_id)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  const adminClient = createAdminClient()

  // Update application status
  const { error: updateError } = await adminClient
    .from('coach_applications')
    .update({
      status: decision as 'approved' | 'rejected',
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
      review_notes: review_notes ?? null,
    })
    .eq('id', applicationIdResult.data)

  if (updateError) {
    console.error('reviewCoachApplication update error:', updateError)
    return { success: false, error: 'Failed to update application. Please try again.' }
  }

  // On approval: create coach_profile (if not exists) + assign coach role
  if (decision === 'approved') {
    // Check if coach_profile already exists
    const { data: existingProfile } = await adminClient
      .from('coach_profiles')
      .select('id')
      .eq('user_id', application.user_id)
      .single()

    if (!existingProfile) {
      // Create coach profile with certification from application
      await adminClient.from('coach_profiles').insert({
        user_id: application.user_id,
        chapter_id: application.chapter_id,
        certification_level: (application.certification_level ?? 'CALC') as CertificationLevel,
        credly_url: application.credly_url,
        is_published: false,
        is_verified: false,
        coaching_hours: 0,
        specializations: [],
        languages: ['English'],
      })
    }

    // Assign coach role in user_chapter_roles (upsert)
    await adminClient.from('user_chapter_roles').upsert(
      {
        user_id: application.user_id,
        chapter_id: application.chapter_id,
        role: 'coach',
        granted_by: ctx.userId,
        is_active: true,
      },
      { onConflict: 'user_id,chapter_id,role' }
    )
  }

  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: `coach_application_${decision}`,
    entity_type: 'coach_applications',
    entity_id: applicationIdResult.data,
    chapter_id: application.chapter_id,
    new_value: { decision, review_notes } as Json,
  })

  // Send email notification to applicant
  const { data: applicantProfile } = await adminClient
    .from('profiles')
    .select('email, full_name')
    .eq('id', application.user_id)
    .single()

  const { data: chapter } = await adminClient
    .from('chapters')
    .select('name')
    .eq('id', application.chapter_id)
    .single()

  if (applicantProfile?.email) {
    const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'http://localhost:3000'
    await sendEmail({
      to: applicantProfile.email,
      subject:
        decision === 'approved'
          ? `Your coach application has been approved — WIAL ${chapter?.name ?? ''}`
          : `Update on your coach application — WIAL ${chapter?.name ?? ''}`,
      react: React.createElement(CoachApplicationReviewed, {
        applicantName: applicantProfile.full_name ?? applicantProfile.email,
        decision: decision as 'approved' | 'rejected',
        chapterName: chapter?.name ?? '',
        reviewNotes: review_notes ?? null,
        siteUrl,
      }),
    })
  }

  revalidatePath(`/[chapter]/manage/coaches/applications`)
  revalidatePath('/admin/coaches')
  revalidatePath('/dashboard')

  return {
    success: true,
    data: null,
    message:
      decision === 'approved'
        ? 'Application approved. Coach role assigned.'
        : 'Application rejected.',
  }
}
