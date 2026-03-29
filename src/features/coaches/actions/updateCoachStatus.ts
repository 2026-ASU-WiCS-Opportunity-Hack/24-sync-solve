'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { uuidSchema } from '@/lib/utils/validation'
import type { ActionResult } from '@/types'
import type { Json } from '@/types/database'

/**
 * Server action: toggle a coach's published or verified status.
 * Restricted to super_admin only.
 */
export async function updateCoachStatusAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // ── Auth & role check ──────────────────────────────────────────────────────
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

  // ── Update using admin client ──────────────────────────────────────────────
  const adminClient = createAdminClient()

  const { error } = await adminClient.from('coach_profiles').update(updates).eq('id', coachId)

  if (error) {
    console.error('Coach status update error:', error)
    return { success: false, error: 'Failed to update coach status. Please try again.' }
  }

  // ── Audit log ──────────────────────────────────────────────────────────────
  await adminClient.from('audit_log').insert({
    user_id: user.id,
    action: 'update',
    entity_type: 'coach_profile',
    entity_id: coachId,
    new_value: updates as unknown as Json,
  })

  // ── Revalidate ─────────────────────────────────────────────────────────────
  revalidatePath('/admin/coaches')
  revalidatePath('/coaches')

  const actionLabel = action === 'publish' || action === 'verify' ? action + 'ed' : action + 'ied'
  return {
    success: true,
    data: null,
    message: `Coach ${actionLabel} successfully.`,
  }
}
