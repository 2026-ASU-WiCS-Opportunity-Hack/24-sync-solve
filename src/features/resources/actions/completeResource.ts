'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

/**
 * Mark a resource as completed for the current user.
 * If already completed, refreshes completed_at and expires_at (2-year window from now).
 * No explicit permission check — any authenticated user can complete resources.
 */
export async function completeResourceAction(resourceId: string): Promise<ActionResult<null>> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }

    const now = new Date()
    const expiresAt = new Date(now)
    expiresAt.setFullYear(expiresAt.getFullYear() + 2)

    const { error } = await supabase.from('resource_completions').upsert(
      {
        user_id: user.id,
        resource_id: resourceId,
        completed_at: now.toISOString(),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'user_id,resource_id' }
    )

    if (error) throw new Error(error.message)

    revalidatePath('/resources')
    revalidatePath('/dashboard')
    revalidatePath('/coaches/profile')

    return { success: true, data: null, message: 'Marked as completed.' }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to mark resource as completed.',
    }
  }
}
