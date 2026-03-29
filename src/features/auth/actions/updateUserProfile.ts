'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

/**
 * Server action: update the current user's own profile (full_name, avatar_url).
 * Available to all authenticated users regardless of role.
 */
export async function updateUserProfileAction(
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

  const fullName = (formData.get('full_name') as string | null)?.trim() ?? ''
  const avatarUrl = (formData.get('avatar_url') as string | null)?.trim() ?? ''

  if (fullName.length > 200) {
    return { success: false, error: 'Name must be under 200 characters.' }
  }

  if (avatarUrl && !avatarUrl.startsWith('http')) {
    return { success: false, error: 'Invalid avatar URL.' }
  }

  const updates: Record<string, string> = {}
  if (fullName) updates.full_name = fullName
  if (avatarUrl !== undefined) updates.avatar_url = avatarUrl

  const { error } = await supabase.from('profiles').update(updates).eq('id', user.id)

  if (error) {
    console.error('Profile update error:', error)
    return { success: false, error: 'Failed to update profile. Please try again.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/admin')
  revalidatePath('/admin/profile')

  return { success: true, data: null, message: 'Profile updated.' }
}
