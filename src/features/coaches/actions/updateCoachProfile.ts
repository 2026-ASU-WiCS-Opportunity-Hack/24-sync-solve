'use server'

import { revalidatePath } from 'next/cache'
import { getTranslations } from 'next-intl/server'
import { createClient } from '@/lib/supabase/server'
import { coachProfileUpdateSchema, translateZodErrors } from '@/lib/utils/validation'
import type { ActionResult } from '@/types'

/**
 * Server action: update coach's own profile fields.
 * Coaches can only edit their own editable fields (bio, specializations, coaching_hours, etc.).
 * Certification level, published status, and verified status require admin action.
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

  // ── Check suspension ────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_suspended')
    .eq('id', user.id)
    .single()

  if (profile?.is_suspended) {
    return { success: false, error: 'Your account is suspended.' }
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
    photo_url: (formData.get('photo_url') as string) || '',
    specializations: specializationsRaw.filter(Boolean),
    languages: languagesRaw.filter(Boolean),
    location_city: (formData.get('location_city') as string) || '',
    location_country: (formData.get('location_country') as string) || '',
    contact_email: (formData.get('contact_email') as string) || '',
    linkedin_url: (formData.get('linkedin_url') as string) || '',
    coaching_hours: (formData.get('coaching_hours') as string) || '',
  }

  const result = coachProfileUpdateSchema.safeParse(raw)
  if (!result.success) {
    const tV = await getTranslations('validation')
    return {
      success: false,
      error: 'Please fix the errors below.',
      fieldErrors: translateZodErrors(result.error.flatten().fieldErrors, (k) => tV(k as never)),
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
  revalidatePath('/coaches/profile')
  revalidatePath(`/coaches/${existing.id}`)

  return {
    success: true,
    data: null,
    message: 'Profile updated successfully.',
  }
}
