'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { coachProfileUpdateSchema } from '@/lib/utils/validation'
import type { ActionResult } from '@/types'

/**
 * Server action: update coach's own profile fields.
 * Coaches can only edit their own editable fields (bio, specializations, etc.).
 * Certification level and published status require admin action.
 */
export async function updateCoachProfileAction(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // ── Auth check ──────────────────────────────────────────────────────────────
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required.' }
  }

  // ── Verify coach profile exists for this user ──────────────────────────────
  const { data: existing } = await supabase
    .from('coach_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!existing) {
    return { success: false, error: 'Coach profile not found.' }
  }

  // ── Validate input ──────────────────────────────────────────────────────────
  const specializationsRaw = formData.getAll('specializations') as string[]
  const languagesRaw = formData.getAll('languages') as string[]

  const raw = {
    bio: (formData.get('bio') as string) || undefined,
    specializations: specializationsRaw.filter(Boolean),
    languages: languagesRaw.filter(Boolean),
    location_city: (formData.get('location_city') as string) || '',
    location_country: (formData.get('location_country') as string) || '',
    contact_email: (formData.get('contact_email') as string) || '',
    linkedin_url: (formData.get('linkedin_url') as string) || '',
  }

  const result = coachProfileUpdateSchema.safeParse(raw)
  if (!result.success) {
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: result.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  // ── Update coach profile ────────────────────────────────────────────────────
  const { error } = await supabase.from('coach_profiles').update(result.data).eq('user_id', user.id)

  if (error) {
    console.error('Coach profile update error:', error)
    return { success: false, error: 'Failed to update profile. Please try again.' }
  }

  // ── Revalidate public coach directory ──────────────────────────────────────
  revalidatePath('/coaches')
  revalidatePath(`/coaches/profile`)

  return {
    success: true,
    data: undefined,
    message: 'Profile updated successfully.',
  }
}
