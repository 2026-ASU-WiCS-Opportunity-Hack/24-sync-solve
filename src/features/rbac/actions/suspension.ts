'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions/context'
import { roleCanSuspend } from '@/lib/permissions/permissions'
import { suspensionSchema, roleSuspensionSchema, uuidSchema } from '@/lib/utils/validation'
import type { ActionResult, UserRole } from '@/types'
import type { Json } from '@/types/database'

// ── Account suspension ───────────────────────────────────────────────────────

/**
 * Suspend a user's account.
 * super_admin only. Cannot suspend yourself or the last super_admin.
 */
export async function suspendAccountAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    user_id: formData.get('user_id') as string,
    reason: formData.get('reason') as string,
  }

  const result = suspensionSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: 'Invalid input.',
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { user_id, reason } = result.data

  let ctx
  try {
    ctx = await requirePermission('suspend:account')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // Self-suspension prevention
  if (user_id === ctx.userId) {
    return { success: false, error: 'You cannot suspend your own account.' }
  }

  // Last-admin protection
  const supabase = await createClient()
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user_id)
    .single()

  if (targetProfile?.role === 'super_admin') {
    const { data: count } = await supabase.rpc('count_active_super_admins')
    if ((count ?? 0) <= 1) {
      return {
        success: false,
        error: 'Cannot suspend the last active super admin.',
      }
    }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('profiles')
    .update({
      is_suspended: true,
      suspended_at: new Date().toISOString(),
      suspended_by: ctx.userId,
      suspension_reason: reason,
    })
    .eq('id', user_id)

  if (error) {
    console.error('suspendAccount error:', error)
    return { success: false, error: 'Failed to suspend account. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'account_suspend',
    entity_type: 'profiles',
    entity_id: user_id,
    new_value: { is_suspended: true, reason } as Json,
  })

  revalidatePath('/admin/users')
  return { success: true, data: null, message: 'Account suspended.' }
}

/**
 * Unsuspend a user's account.
 * super_admin only.
 */
export async function unsuspendAccountAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const userIdResult = uuidSchema.safeParse(formData.get('user_id') as string)
  if (!userIdResult.success) {
    return { success: false, error: 'Invalid user ID.' }
  }

  const user_id = userIdResult.data

  let ctx
  try {
    ctx = await requirePermission('unsuspend:account')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('profiles')
    .update({
      is_suspended: false,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
    })
    .eq('id', user_id)

  if (error) {
    console.error('unsuspendAccount error:', error)
    return { success: false, error: 'Failed to unsuspend account. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'account_unsuspend',
    entity_type: 'profiles',
    entity_id: user_id,
    new_value: { is_suspended: false } as Json,
  })

  revalidatePath('/admin/users')
  return { success: true, data: null, message: 'Account unsuspended.' }
}

// ── Chapter role suspension ──────────────────────────────────────────────────

/**
 * Suspend a user's role within a chapter.
 * chapter_lead can suspend coach/content_editor. super_admin can suspend any.
 */
export async function suspendChapterRoleAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    user_id: formData.get('user_id') as string,
    chapter_id: formData.get('chapter_id') as string,
    role: formData.get('role') as string,
    reason: formData.get('reason') as string,
  }

  const result = roleSuspensionSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: 'Invalid input.',
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { user_id, chapter_id, role, reason } = result.data

  let ctx
  try {
    ctx = await requirePermission('suspend:role', chapter_id)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // Self-suspension prevention
  if (user_id === ctx.userId) {
    return { success: false, error: 'You cannot suspend your own role.' }
  }

  // chapter_lead can only suspend coach/content_editor
  if (!roleCanSuspend(ctx.globalRole, role as UserRole)) {
    const chapterRoles = ctx.chapterRoles.get(chapter_id) ?? []
    const canSuspend = chapterRoles.some((r) => roleCanSuspend(r, role as UserRole))
    if (!canSuspend) {
      return { success: false, error: `You cannot suspend the ${role} role.` }
    }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('user_chapter_roles')
    .update({
      is_active: false,
      suspended_at: new Date().toISOString(),
      suspended_by: ctx.userId,
      suspension_reason: reason,
    })
    .eq('user_id', user_id)
    .eq('chapter_id', chapter_id)
    .eq('role', role)

  if (error) {
    console.error('suspendChapterRole error:', error)
    return { success: false, error: 'Failed to suspend role. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'role_suspend',
    entity_type: 'user_chapter_roles',
    entity_id: user_id,
    chapter_id,
    new_value: { role, is_active: false, reason } as Json,
  })

  revalidatePath(`/[chapter]/manage/users`)
  revalidatePath('/admin/users')
  return { success: true, data: null, message: `Role "${role}" suspended.` }
}

/**
 * Unsuspend a user's role within a chapter.
 */
export async function unsuspendChapterRoleAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    user_id: formData.get('user_id') as string,
    chapter_id: formData.get('chapter_id') as string,
    role: formData.get('role') as string,
    reason: '',
  }

  const result = roleSuspensionSchema.safeParse(raw)
  if (!result.success) {
    return { success: false, error: 'Invalid input.' }
  }

  const { user_id, chapter_id, role } = result.data

  let ctx
  try {
    ctx = await requirePermission('unsuspend:role', chapter_id)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('user_chapter_roles')
    .update({
      is_active: true,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
    })
    .eq('user_id', user_id)
    .eq('chapter_id', chapter_id)
    .eq('role', role)

  if (error) {
    console.error('unsuspendChapterRole error:', error)
    return { success: false, error: 'Failed to unsuspend role. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'role_unsuspend',
    entity_type: 'user_chapter_roles',
    entity_id: user_id,
    chapter_id,
    new_value: { role, is_active: true } as Json,
  })

  revalidatePath(`/[chapter]/manage/users`)
  revalidatePath('/admin/users')
  return { success: true, data: null, message: `Role "${role}" unsuspended.` }
}

// ── Coach visibility suspension ──────────────────────────────────────────────

/**
 * Suspend a coach's public profile visibility.
 * chapter_lead (own chapter) or super_admin.
 */
export async function suspendCoachVisibilityAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const coachProfileIdResult = uuidSchema.safeParse(formData.get('coach_profile_id') as string)
  if (!coachProfileIdResult.success) {
    return { success: false, error: 'Invalid coach profile ID.' }
  }

  const reason = formData.get('reason') as string
  if (!reason?.trim()) {
    return { success: false, error: 'Reason is required.' }
  }

  const supabase = await createClient()

  // Fetch coach profile to get chapter_id for permission check
  const { data: coachProfile } = await supabase
    .from('coach_profiles')
    .select('chapter_id')
    .eq('id', coachProfileIdResult.data)
    .single()

  if (!coachProfile) {
    return { success: false, error: 'Coach profile not found.' }
  }

  let ctx
  try {
    ctx = await requirePermission('suspend:coach_visibility', coachProfile.chapter_id)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('coach_profiles')
    .update({
      profile_visibility_suspended: true,
      visibility_suspended_at: new Date().toISOString(),
      visibility_suspended_by: ctx.userId,
    })
    .eq('id', coachProfileIdResult.data)

  if (error) {
    console.error('suspendCoachVisibility error:', error)
    return { success: false, error: 'Failed to suspend visibility. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'coach_visibility_suspend',
    entity_type: 'coach_profiles',
    entity_id: coachProfileIdResult.data,
    chapter_id: coachProfile.chapter_id,
    new_value: { profile_visibility_suspended: true, reason } as Json,
  })

  revalidatePath('/coaches')
  revalidatePath('/admin/coaches')
  revalidatePath('/[chapter]/manage/coaches')
  return { success: true, data: null, message: 'Coach visibility suspended.' }
}

/**
 * Restore a coach's public profile visibility.
 */
export async function unsuspendCoachVisibilityAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const coachProfileIdResult = uuidSchema.safeParse(formData.get('coach_profile_id') as string)
  if (!coachProfileIdResult.success) {
    return { success: false, error: 'Invalid coach profile ID.' }
  }

  const supabase = await createClient()

  const { data: coachProfile } = await supabase
    .from('coach_profiles')
    .select('chapter_id')
    .eq('id', coachProfileIdResult.data)
    .single()

  if (!coachProfile) {
    return { success: false, error: 'Coach profile not found.' }
  }

  let ctx
  try {
    ctx = await requirePermission('unsuspend:coach_visibility', coachProfile.chapter_id)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('coach_profiles')
    .update({
      profile_visibility_suspended: false,
      visibility_suspended_at: null,
      visibility_suspended_by: null,
    })
    .eq('id', coachProfileIdResult.data)

  if (error) {
    console.error('unsuspendCoachVisibility error:', error)
    return { success: false, error: 'Failed to restore visibility. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'coach_visibility_unsuspend',
    entity_type: 'coach_profiles',
    entity_id: coachProfileIdResult.data,
    chapter_id: coachProfile.chapter_id,
    new_value: { profile_visibility_suspended: false } as Json,
  })

  revalidatePath('/coaches')
  revalidatePath('/admin/coaches')
  revalidatePath('/[chapter]/manage/coaches')
  return { success: true, data: null, message: 'Coach visibility restored.' }
}
