'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/permissions/context'
import { uuidSchema } from '@/lib/utils/validation'
import type { ActionResult } from '@/types'
import type { Json } from '@/types/database'

/**
 * Server action: toggle a coach's published or verified status.
 * Requires coach_profile:publish permission.
 * chapter_lead can only toggle coaches in their own chapter.
 */
export async function updateCoachStatusAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // ── Validate coach ID ──────────────────────────────────────────────────────
  const coachIdRaw = formData.get('coach_id') as string
  const coachIdResult = uuidSchema.safeParse(coachIdRaw)
  if (!coachIdResult.success) {
    return { success: false, error: 'Invalid coach ID.' }
  }

  const coachId = coachIdResult.data
  const action = formData.get('action') as string

  const updates: { is_published?: boolean; is_verified?: boolean } = {}

  if (action === 'publish') updates.is_published = true
  else if (action === 'unpublish') updates.is_published = false
  else if (action === 'verify') updates.is_verified = true
  else if (action === 'unverify') updates.is_verified = false
  else return { success: false, error: 'Invalid action.' }

  // Fetch coach profile to get chapter_id for permission scoping
  const supabase = await createClient()

  const { data: coachProfile } = await supabase
    .from('coach_profiles')
    .select('chapter_id')
    .eq('id', coachId)
    .single()

  if (!coachProfile) {
    return { success: false, error: 'Coach profile not found.' }
  }

  let ctx
  try {
    ctx = await requirePermission('coach_profile:publish', coachProfile.chapter_id)
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }

  // chapter_lead: verify coach is in their chapter (Gap D fix)
  if (ctx.globalRole !== 'super_admin') {
    const actorChapterRoles = ctx.chapterRoles
    const isInChapter = coachProfile.chapter_id
      ? actorChapterRoles.has(coachProfile.chapter_id)
      : false

    // Also check profile.chapter_id matches
    if (!isInChapter) {
      return { success: false, error: 'You can only manage coaches in your own chapter.' }
    }
  }

  // ── Update using admin client ──────────────────────────────────────────────
  const adminClient = createAdminClient()

  const { error } = await adminClient.from('coach_profiles').update(updates).eq('id', coachId)

  if (error) {
    console.error('Coach status update error:', error)
    return { success: false, error: 'Failed to update coach status. Please try again.' }
  }

  // ── Audit log ──────────────────────────────────────────────────────────────
  await adminClient.from('audit_log').insert({
    user_id: ctx.userId,
    action: 'update',
    entity_type: 'coach_profile',
    entity_id: coachId,
    chapter_id: coachProfile.chapter_id,
    new_value: updates as unknown as Json,
  })

  // ── Revalidate ─────────────────────────────────────────────────────────────
  revalidatePath('/admin/coaches')
  revalidatePath('/coaches')
  if (coachProfile.chapter_id) {
    revalidatePath(`/[chapter]/manage/coaches`)
  }

  const actionLabel = action === 'publish' || action === 'verify' ? action + 'ed' : action + 'ied'
  return {
    success: true,
    data: null,
    message: `Coach ${actionLabel} successfully.`,
  }
}
