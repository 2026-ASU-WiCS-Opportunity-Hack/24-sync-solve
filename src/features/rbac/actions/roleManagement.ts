'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions/context'
import { roleCanAssign } from '@/lib/permissions/permissions'
import { roleAssignmentSchema, uuidSchema } from '@/lib/utils/validation'
import type { ActionResult, UserRole } from '@/types'
import type { Json } from '@/types/database'
import { z } from 'zod'

// ── Assign role ──────────────────────────────────────────────────────────────

/**
 * Assign a role to a user in a chapter via user_chapter_roles.
 * chapter_lead can assign coach/content_editor in their own chapter.
 * super_admin can assign any role in any chapter.
 */
export async function assignRoleAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    user_id: formData.get('user_id') as string,
    chapter_id: formData.get('chapter_id') as string,
    role: formData.get('role') as string,
  }

  const result = roleAssignmentSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: 'Invalid input.',
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { user_id, chapter_id, role } = result.data

  let ctx
  try {
    ctx = await requirePermission('role:assign_coach', chapter_id)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // Verify actor can assign this specific role
  if (!roleCanAssign(ctx.globalRole, role as UserRole)) {
    // Also check chapter-specific role
    const chapterRoles = ctx.chapterRoles.get(chapter_id) ?? []
    const canAssign = chapterRoles.some((r) => roleCanAssign(r, role as UserRole))
    if (!canAssign) {
      return { success: false, error: `You cannot assign the ${role} role.` }
    }
  }

  const adminClient = createAdminClient()

  // Upsert to handle re-activation of suspended roles
  const { error } = await adminClient.from('user_chapter_roles').upsert(
    {
      user_id,
      chapter_id,
      role: role as UserRole,
      granted_by: ctx.userId,
      is_active: true,
      suspended_at: null,
      suspended_by: null,
      suspension_reason: null,
    },
    { onConflict: 'user_id,chapter_id,role' }
  )

  if (error) {
    // Duplicate unique constraint
    if (error.code === '23505') {
      return { success: false, error: 'User already has this role in this chapter.' }
    }
    console.error('assignRole error:', error)
    return { success: false, error: 'Failed to assign role. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'role_assign',
    entity_type: 'user_chapter_roles',
    entity_id: user_id,
    chapter_id,
    new_value: { role, chapter_id } as Json,
  })

  revalidatePath(`/admin/users`)
  revalidatePath(`/[chapter]/manage/users`)

  return { success: true, data: null, message: `Role "${role}" assigned successfully.` }
}

// ── Revoke role ──────────────────────────────────────────────────────────────

/**
 * Revoke a user's chapter role.
 */
export async function revokeRoleAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    user_id: formData.get('user_id') as string,
    chapter_id: formData.get('chapter_id') as string,
    role: formData.get('role') as string,
  }

  const result = roleAssignmentSchema.safeParse(raw)
  if (!result.success) {
    return { success: false, error: 'Invalid input.' }
  }

  const { user_id, chapter_id, role } = result.data

  let ctx
  try {
    ctx = await requirePermission('role:revoke', chapter_id)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // chapter_lead can only revoke coach/content_editor roles
  if (ctx.globalRole !== 'super_admin') {
    if (!['coach', 'content_editor'].includes(role)) {
      return { success: false, error: 'You can only revoke coach or content_editor roles.' }
    }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('user_chapter_roles')
    .delete()
    .eq('user_id', user_id)
    .eq('chapter_id', chapter_id)
    .eq('role', role)

  if (error) {
    console.error('revokeRole error:', error)
    return { success: false, error: 'Failed to revoke role. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'role_revoke',
    entity_type: 'user_chapter_roles',
    entity_id: user_id,
    chapter_id,
    old_value: { role, chapter_id } as Json,
  })

  revalidatePath(`/admin/users`)
  revalidatePath(`/[chapter]/manage/users`)

  return { success: true, data: null, message: `Role "${role}" revoked successfully.` }
}

// ── Update global role ───────────────────────────────────────────────────────

const updateGlobalRoleSchema = z.object({
  user_id: uuidSchema,
  role: z.enum(['super_admin', 'chapter_lead', 'content_editor', 'coach', 'user']),
})

/**
 * Update a user's global role (profiles.role).
 * super_admin only — with last-admin protection.
 */
export async function updateGlobalRoleAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const raw = {
    user_id: formData.get('user_id') as string,
    role: formData.get('role') as string,
  }

  const result = updateGlobalRoleSchema.safeParse(raw)
  if (!result.success) {
    return { success: false, error: 'Invalid input.' }
  }

  const { user_id, role } = result.data

  let ctx
  try {
    ctx = await requirePermission('role:assign_chapter_lead')
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // Last-admin protection: cannot demote/change the last active super_admin
  const supabase = await createClient()
  if (role !== 'super_admin') {
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user_id)
      .single()

    if (currentProfile?.role === 'super_admin') {
      const { data: count } = await supabase.rpc('count_active_super_admins')
      if ((count ?? 0) <= 1) {
        return {
          success: false,
          error: 'Cannot demote the last active super admin. Promote another admin first.',
        }
      }
    }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('profiles')
    .update({ role: role as UserRole })
    .eq('id', user_id)

  if (error) {
    console.error('updateGlobalRole error:', error)
    return { success: false, error: 'Failed to update role. Please try again.' }
  }

  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'role_update',
    entity_type: 'profiles',
    entity_id: user_id,
    new_value: { role } as Json,
  })

  revalidatePath(`/admin/users`)

  return { success: true, data: null, message: `Global role updated to "${role}".` }
}
