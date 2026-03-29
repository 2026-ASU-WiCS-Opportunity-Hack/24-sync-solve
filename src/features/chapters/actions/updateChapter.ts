'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chapterUpdateSchema } from '@/lib/utils/validation'
import type { ActionResult, Chapter } from '@/types'
import type { Json } from '@/types/database'

/**
 * Server action: update an existing chapter's settings.
 * Restricted to super_admin only.
 */
export async function updateChapterAction(
  _prevState: ActionResult<Chapter> | null,
  formData: FormData
): Promise<ActionResult<Chapter>> {
  // ── Auth & role check ──────────────────────────────────────────────────────────
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

  // ── Validate input ─────────────────────────────────────────────────────────────
  const raw = {
    id: formData.get('id') as string,
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    country_code: formData.get('country_code') as string,
    timezone: formData.get('timezone') as string,
    currency: formData.get('currency') as string,
    accent_color: formData.get('accent_color') as string,
    contact_email: (formData.get('contact_email') as string) || undefined,
    website_url: (formData.get('website_url') as string) || undefined,
    is_active: formData.get('is_active') as string,
  }

  const result = chapterUpdateSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { id, ...updateData } = result.data

  // ── Fetch old value for audit ──────────────────────────────────────────────────
  const adminClient = createAdminClient()

  const { data: oldChapter } = await adminClient.from('chapters').select('*').eq('id', id).single()

  // ── Update chapter ─────────────────────────────────────────────────────────────
  const { data: chapter, error: updateError } = await adminClient
    .from('chapters')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (updateError || !chapter) {
    if (updateError?.code === '23505') {
      return {
        success: false,
        error: `A chapter with slug "${updateData.slug}" already exists.`,
        fieldErrors: { slug: ['This slug is already taken.'] },
      }
    }
    console.error('Chapter update error:', updateError)
    return { success: false, error: 'Failed to update chapter. Please try again.' }
  }

  // ── Audit log ──────────────────────────────────────────────────────────────────
  await adminClient.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'chapter',
    entity_id: id,
    old_value: oldChapter as unknown as Json,
    new_value: chapter as unknown as Json,
  })

  // ── Revalidate affected paths ──────────────────────────────────────────────────
  revalidatePath('/admin/chapters')
  revalidatePath(`/admin/chapters/${id}`)
  revalidatePath(`/${chapter.slug}`)
  revalidatePath('/')

  return {
    success: true,
    data: chapter,
    message: `Chapter "${chapter.name}" updated successfully.`,
  }
}

/**
 * Server action: toggle a chapter's active status.
 * Restricted to super_admin only.
 */
export async function toggleChapterStatusAction(
  chapterId: string,
  isActive: boolean
): Promise<ActionResult> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Authentication required.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return { success: false, error: 'Super admin access required.' }
  }

  const adminClient = createAdminClient()

  const { error } = await adminClient
    .from('chapters')
    .update({ is_active: isActive })
    .eq('id', chapterId)

  if (error) {
    return { success: false, error: 'Failed to update chapter status.' }
  }

  revalidatePath('/admin/chapters')
  revalidatePath('/')

  return { success: true, data: null }
}
