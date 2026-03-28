'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { chapterCreateSchema } from '@/lib/utils/validation'
import type { ActionResult, Chapter } from '@/types'
import type { Json } from '@/types/database'

/**
 * Server action: create a new chapter and provision its default pages.
 * Restricted to super_admin only.
 */
export async function createChapterAction(
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
    name: formData.get('name') as string,
    slug: formData.get('slug') as string,
    country_code: formData.get('country_code') as string,
    timezone: formData.get('timezone') as string,
    currency: formData.get('currency') as string,
    accent_color: formData.get('accent_color') as string,
    contact_email: (formData.get('contact_email') as string) || undefined,
    website_url: (formData.get('website_url') as string) || undefined,
  }

  const result = chapterCreateSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // ── Create chapter (admin client bypasses RLS for provisioning) ────────────────
  const adminClient = createAdminClient()

  const { data: chapter, error: insertError } = await adminClient
    .from('chapters')
    .insert(result.data)
    .select()
    .single()

  if (insertError || !chapter) {
    if (insertError?.code === '23505') {
      return {
        success: false,
        error: `A chapter with slug "${result.data.slug}" already exists.`,
        fieldErrors: { slug: ['This slug is already taken.'] },
      }
    }
    console.error('Chapter insert error:', insertError)
    return { success: false, error: 'Failed to create chapter. Please try again.' }
  }

  // ── Provision default pages + content blocks ───────────────────────────────────
  const { error: provisionError } = await adminClient.rpc('provision_chapter_pages', {
    p_chapter_id: chapter.id,
  })

  if (provisionError) {
    // Chapter created but pages failed — log and continue (admin can reprovision)
    console.error('Chapter page provisioning error:', provisionError)
  }

  // ── Audit log ──────────────────────────────────────────────────────────────────
  await adminClient.from('audit_log').insert({
    user_id: user.id,
    action: 'create',
    entity_type: 'chapter',
    entity_id: chapter.id,
    new_value: chapter as unknown as Json,
  })

  // ── Revalidate affected paths ──────────────────────────────────────────────────
  revalidatePath('/admin/chapters')
  revalidatePath('/')

  return {
    success: true,
    data: chapter,
    message: `Chapter "${chapter.name}" created and pages provisioned successfully.`,
  }
}
